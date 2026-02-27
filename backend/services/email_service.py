"""
Email service to fetch Zoho Sign emails via IMAP from hello@kots.world (or current user),
extract booking IDs, and store as SIGN_REQUEST, SIGNED, or CIR contract documents.
Only processes new emails since the last sync.
"""

import imaplib
import email
from email import policy
import re
import ssl
import logging
import os
import json
from datetime import datetime, timedelta
from email.utils import parsedate_to_datetime
from typing import Optional, List

from sqlalchemy.orm import Session

from config import get_settings
from models.contract_document import ContractDocument
from services.s3_service import S3Service

logger = logging.getLogger(__name__)

# Regex to extract booking ID from subject/body
BOOKING_ID_PATTERN = re.compile(r'(K[0-9A-Z]{8,20})')

# CIR subject prefixes — match the exact email subject format with "::" delimiter
# This avoids false matches with ticket-raising emails that may contain similar words.
CIR_SUBJECT_PREFIXES = [
    'kitchen flat condition :: part a',
    'kitchen flat condition :: part b',
    'living room flat condition ::',
    'bathrooms flat condition ::',
    'balcony & other flat condition ::',
    'first bedroom pictures ::',
    'second bedroom pictures ::',
]

# File to persist last sync date
LAST_SYNC_FILE = os.path.join(os.path.dirname(__file__), '..', '.last_email_sync')


def _get_last_sync_date() -> Optional[str]:
    """Get the last sync date in DD-Mon-YYYY format for IMAP SINCE query."""
    try:
        if os.path.exists(LAST_SYNC_FILE):
            with open(LAST_SYNC_FILE, 'r') as f:
                data = json.load(f)
                return data.get('last_sync_date')
    except Exception as e:
        logger.warning(f"Could not read last sync file: {e}")
    return None


def _save_last_sync_date():
    """Save today's date as the last sync date."""
    try:
        today = datetime.now().strftime('%d-%b-%Y')
        with open(LAST_SYNC_FILE, 'w') as f:
            json.dump({'last_sync_date': today, 'updated_at': datetime.now().isoformat()}, f)
    except Exception as e:
        logger.warning(f"Could not save last sync file: {e}")


def _extract_booking_id(text: str) -> Optional[str]:
    """Extract booking ID from text using pattern K[0-9A-Z]{8,20}."""
    match = BOOKING_ID_PATTERN.search(text)
    return match.group(1) if match else None


def _extract_email_address(header_value: str) -> str:
    """Extract plain email address from header like 'Name <email@example.com>'."""
    if not header_value:
        return ""
    match = re.search(r'<([^>]+)>', header_value)
    if match:
        return match.group(1).strip()
    return header_value.strip()


def _extract_sign_url(body: str) -> Optional[str]:
    """
    Extract the Zoho Sign URL from the email body.
    Prioritizes links containing 'sign.zoho' or 'zoho...sign'.
    Ignores image/static asset URLs.
    """
    links = re.findall(r'(https?://[^\s"<>]+)', body)
    
    candidates = []
    for link in links:
        lower_link = link.lower()
        if any(ext in lower_link for ext in ['.png', '.jpg', '.jpeg', '.gif', '.css', '.js', 'static.zohocdn']):
            continue
            
        if 'zoho' in lower_link and 'sign' in lower_link:
            candidates.append(link)
            
    if candidates:
        for c in candidates:
            if 'signform' in c.lower() or 'request' in c.lower():
                return c
        return candidates[0]
        
    return None


def _get_email_body(msg: email.message.EmailMessage) -> str:
    """Extract the text body from an email message using policy.default."""
    body = ""
    try:
        body_part = msg.get_body(preferencelist=('plain', 'html'))
        if body_part:
            body = body_part.get_content()
    except Exception as e:
        logger.error(f"Error extracting body: {e}")
    return body


def _is_cir_subject(subject_lower: str) -> bool:
    """Check if the email subject matches CIR document patterns using exact subject prefixes."""
    return any(subject_lower.startswith(prefix) for prefix in CIR_SUBJECT_PREFIXES)


def _upload_pdf_attachment(msg, booking_id: str, category: str) -> Optional[str]:
    """Extract PDF attachment from email and upload to S3. Returns the S3 URL or None."""
    for part in msg.iter_attachments():
        filename = part.get_filename() or f"{booking_id}_{category.lower()}.pdf"
        if filename.lower().endswith(".pdf"):
            try:
                file_data = part.get_content()
                s3_service = S3Service()
                object_name = f"contracts/{booking_id}/{category.lower()}/{filename}"
                uploaded_url = s3_service.upload_file(file_data, object_name)
                if uploaded_url:
                    logger.info(f"Uploaded attachment to S3: {uploaded_url}")
                    return uploaded_url
            except Exception as e:
                logger.error(f"Failed to upload attachment {filename}: {e}")
    return None


def _connect_imap(settings):
    """Create a fresh IMAP connection."""
    mail = imaplib.IMAP4_SSL(settings.email_host, settings.email_port)
    mail.login(settings.email_user, settings.email_password)
    return mail


def _process_single_email(mail, eid, existing_msg_ids, existing_titles, db, stats):
    """
    Fetch and process a single email. Returns True if successful, False on error.
    Raises ssl.SSLError or imaplib.IMAP4.abort if the connection is broken.
    """
    status, msg_data = mail.fetch(eid, "(RFC822)")
    if status != "OK":
        stats["errors"] += 1
        return True  # non-fatal, connection still OK

    raw_email = msg_data[0][1]
    msg = email.message_from_bytes(raw_email, policy=policy.default)

    message_id = msg.get("Message-ID", "").strip()
    if message_id and message_id in existing_msg_ids:
        stats["skipped"] += 1
        return True

    subject = msg.get("Subject", "") or ""
    subject_lower = subject.lower()
    
    # Extract booking ID
    booking_id = _extract_booking_id(subject)
    
    body = None
    if not booking_id:
        body = _get_email_body(msg)
        booking_id = _extract_booking_id(body)

    if not booking_id:
        return True  # Not relevant, skip

    # Dedup by booking_id + subject (catches replies with different Message-IDs)
    title_key = f"{booking_id}||{subject.strip()}"
    if title_key in existing_titles:
        stats["skipped"] += 1
        return True

    # Determine Category
    category = None
    
    # Rule 1: CIR — flat condition / inspection reports
    if _is_cir_subject(subject_lower):
        category = "CIR"
    
    # Rule 2: SIGNED (Completed)
    elif "has been completed" in subject_lower:
        category = "SIGNED"
    
    # Rule 3: SIGN_REQUEST
    elif "request" in subject_lower:
         is_sign_request_subject = bool(re.search(r'request(s)?\s+you\s+to\s+sign|signature\s+request|sign\s+tenant', subject_lower))
         
         if body is None:
            body = _get_email_body(msg)
         body_lower = body.lower()
         is_sign_request_body = bool(re.search(r'zoho\s+sign|digital\s+signature\s+request|start\s+signing', body_lower))

         if is_sign_request_subject or is_sign_request_body:
             category = "SIGN_REQUEST"

    if not category:
        return True  # Not a relevant category, skip

    # Parse Date
    date_str = msg.get("Date", "")
    email_date = None
    if date_str:
        try:
            email_date = parsedate_to_datetime(date_str)
        except Exception:
            pass

    # Extract URLs / Attachments
    if body is None:
        body = _get_email_body(msg)
        
    sign_url = None
    pdf_url = None
    
    if category == "SIGN_REQUEST":
        sign_url = _extract_sign_url(body)
    elif category in ("SIGNED", "CIR"):
        pdf_url = _upload_pdf_attachment(msg, booking_id, category)
        if not pdf_url:
            logger.warning(f"No PDF attachment found for {category} doc {booking_id}: {subject[:50]}")

    from_addr = msg.get("From", "") or ""
    to_addr = msg.get("To", "") or ""
    from_email = _extract_email_address(from_addr)
    to_email = _extract_email_address(to_addr)

    doc = ContractDocument(
        booking_id=booking_id,
        tenant_email=to_email,
        document_category=category,
        document_title=subject,
        sign_url=sign_url,
        pdf_url=pdf_url,
        email_message_id=message_id,
        email_received_at=email_date,
        email_from=from_email,
        email_to=to_email,
        email_subject=subject,
    )
    db.add(doc)
    if message_id:
        existing_msg_ids.add(message_id)
    existing_titles.add(title_key)
    stats["new"] += 1
    logger.info(f"Added {category} doc: {booking_id} - {subject[:50]}")
    return True


def sync_sign_request_emails(db: Session) -> dict:
    """
    Connect to IMAP, read Sent folder,
    extract booking IDs and store as SIGN_REQUEST, SIGNED, or CIR documents.
    Only processes new emails since the last sync.
    Skips duplicates using email_message_id.
    Handles SSL errors by reconnecting.
    """
    settings = get_settings()
    stats = {"fetched": 0, "new": 0, "skipped": 0, "errors": 0}

    try:
        mail = _connect_imap(settings)

        # Folders to search: Sent
        folders_to_search = ['"Sent"', '"Sent Items"', '"[Gmail]/Sent Mail"', 'Sent']
        processed_folders = set()
        
        # Get existing message IDs and titles from DB to avoid duplicates
        existing_msg_ids = set()
        existing_titles = set()
        existing_records = db.query(
            ContractDocument.email_message_id,
            ContractDocument.booking_id,
            ContractDocument.document_title
        ).all()
        for record in existing_records:
            if record.email_message_id:
                existing_msg_ids.add(record.email_message_id)
            if record.booking_id and record.document_title:
                existing_titles.add(f"{record.booking_id}||{record.document_title.strip()}")

        # Get last sync date for incremental processing
        last_sync_date = _get_last_sync_date()
        if last_sync_date:
            search_criteria = f'(SINCE {last_sync_date})'
            logger.info(f"Incremental sync: fetching emails since {last_sync_date}")
        else:
            search_criteria = "ALL"
            logger.info("First sync: fetching all emails")

        for folder_name in folders_to_search:
            try:
                if folder_name in processed_folders:
                    continue
                
                status, _ = mail.select(folder_name)
                if status != "OK":
                    continue
                
                processed_folders.add(folder_name)
                logger.info(f"Scanning folder: {folder_name}")

                status, data = mail.search(None, search_criteria)
                if status != "OK" or not data[0]:
                    logger.info(f"No emails found in {folder_name}")
                    continue

                email_ids = data[0].split()
                if not email_ids:
                    continue
                    
                logger.info(f"Found {len(email_ids)} emails in {folder_name}")
                stats["fetched"] += len(email_ids)
                
                # Process newest first
                email_ids = email_ids[::-1]

                for eid in email_ids:
                    try:
                        _process_single_email(mail, eid, existing_msg_ids, existing_titles, db, stats)
                    except (ssl.SSLError, imaplib.IMAP4.abort, ConnectionError, OSError) as e:
                        # Connection broken — reconnect and retry this email
                        logger.warning(f"Connection error on email {eid}, reconnecting: {e}")
                        stats["errors"] += 1
                        try:
                            mail = _connect_imap(settings)
                            mail.select(folder_name)
                            # Retry this email once
                            try:
                                _process_single_email(mail, eid, existing_msg_ids, existing_titles, db, stats)
                            except Exception:
                                logger.warning(f"Skipping email {eid} after reconnect retry")
                                stats["errors"] += 1
                        except Exception as reconnect_err:
                            logger.error(f"Failed to reconnect: {reconnect_err}")
                            # Commit what we have so far and bail
                            db.commit()
                            return {"error": f"Connection lost: {str(e)}", **stats}
                    except Exception as e:
                        logger.error(f"Error processing email {eid}: {e}")
                        stats["errors"] += 1
                        continue

            except Exception as e:
                logger.error(f"Error accessing folder {folder_name}: {e}")
                continue

        db.commit()
        
        try:
            mail.close()
            mail.logout()
        except Exception:
            pass
        
        # Save sync date for next run
        _save_last_sync_date()
        
        logger.info(f"Email sync complete: {stats}")

    except imaplib.IMAP4.error as e:
        logger.error(f"IMAP error: {e}")
        return {"error": f"IMAP connection failed: {str(e)}", **stats}
    except Exception as e:
        logger.error(f"Email sync error: {e}")
        db.rollback()
        return {"error": str(e), **stats}

    return stats
