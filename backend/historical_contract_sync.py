import imaplib
import email
from email import policy
import re
import ssl
import logging
import os
import json
from datetime import datetime
from email.utils import parsedate_to_datetime
from typing import Optional, List

from sqlalchemy.orm import Session
from database import SessionLocal
from config import get_settings
from models.contract_document import ContractDocument
from services.s3_service import S3Service

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Regex patterns
BOOKING_ID_PATTERN = re.compile(r'(K[0-9A-Z]{8,20})')

CIR_SUBJECT_PREFIXES = [
    'kitchen flat condition :: part a',
    'kitchen flat condition :: part b',
    'living room flat condition ::',
    'bathrooms flat condition ::',
    'balcony & other flat condition ::',
    'first bedroom pictures ::',
    'second bedroom pictures ::',
]

def _extract_booking_id(text: str) -> Optional[str]:
    match = BOOKING_ID_PATTERN.search(text)
    return match.group(1) if match else None

def _extract_email_address(header_value: str) -> str:
    if not header_value: return ""
    match = re.search(r'<([^>]+)>', header_value)
    return match.group(1).strip() if match else header_value.strip()

def _extract_sign_url(body: str) -> Optional[str]:
    links = re.findall(r'(https?://[^\s"<>]+)', body)
    candidates = [l for l in links if 'zoho' in l.lower() and 'sign' in l.lower() and not any(ext in l.lower() for ext in ['.png', '.jpg', '.jpeg', '.gif', '.css', '.js', 'static.zohocdn'])]
    if candidates:
        for c in candidates:
            if 'signform' in c.lower() or 'request' in c.lower(): return c
        return candidates[0]
    return None

def _get_email_body(msg: email.message.EmailMessage) -> str:
    try:
        body_part = msg.get_body(preferencelist=('plain', 'html'))
        if body_part: return body_part.get_content()
    except Exception as e:
        logger.error(f"Error extracting body: {e}")
    return ""

def _upload_pdf_attachment(msg, booking_id: str, category: str) -> Optional[str]:
    for part in msg.iter_attachments():
        filename = part.get_filename() or f"{booking_id}_{category.lower()}.pdf"
        if filename.lower().endswith(".pdf"):
            try:
                file_data = part.get_content()
                s3_service = S3Service()
                object_name = f"contracts/{booking_id}/{category.lower()}/{filename}"
                return s3_service.upload_file(file_data, object_name)
            except Exception as e:
                logger.error(f"Failed to upload attachment {filename}: {e}")
    return None

def process_booking_id(mail, booking_id, db, existing_msg_ids):
    # Search in Sent folder for the booking ID
    search_criteria = f'TEXT "{booking_id}"'
    status, data = mail.search(None, search_criteria)
    if status != "OK" or not data[0]:
        return 0

    email_ids = data[0].split()
    count = 0
    for eid in email_ids:
        status, msg_data = mail.fetch(eid, "(RFC822)")
        if status != "OK": continue
        
        raw_email = msg_data[0][1]
        msg = email.message_from_bytes(raw_email, policy=policy.default)
        message_id = msg.get("Message-ID", "").strip()
        
        if message_id and message_id in existing_msg_ids:
            continue

        subject = msg.get("Subject", "") or ""
        subject_lower = subject.lower()
        body = _get_email_body(msg)
        
        # Verify booking ID is actually in this email (TEXT search can be broad)
        found_id = _extract_booking_id(subject) or _extract_booking_id(body)
        if found_id != booking_id:
            continue

        category = None
        if any(subject_lower.startswith(p) for p in CIR_SUBJECT_PREFIXES): category = "CIR"
        elif "has been completed" in subject_lower: category = "SIGNED"
        elif "request" in subject_lower:
            if re.search(r'request(s)?\s+you\s+to\s+sign|signature\s+request|sign\s+tenant', subject_lower) or \
               re.search(r'zoho\s+sign|digital\s+signature\s+request|start\s+signing', body.lower()):
                category = "SIGN_REQUEST"

        if not category: continue

        sign_url = _extract_sign_url(body) if category == "SIGN_REQUEST" else None
        pdf_url = _upload_pdf_attachment(msg, booking_id, category) if category in ("SIGNED", "CIR") else None

        doc = ContractDocument(
            booking_id=booking_id,
            tenant_email=_extract_email_address(msg.get("To", "")),
            document_category=category,
            document_title=subject,
            sign_url=sign_url,
            pdf_url=pdf_url,
            email_message_id=message_id,
            email_received_at=parsedate_to_datetime(msg.get("Date", "")) if msg.get("Date") else None,
            email_from=_extract_email_address(msg.get("From", "")),
            email_to=_extract_email_address(msg.get("To", "")),
            email_subject=subject,
        )
        db.add(doc)
        existing_msg_ids.add(message_id)
        count += 1
    
    db.commit()
    return count

def run_sync(limit=None):
    settings = get_settings()
    db = SessionLocal()
    
    # Load existing message IDs
    existing_msg_ids = {r[0] for r in db.query(ContractDocument.email_message_id).all() if r[0]}
    
    # Load booking IDs
    with open("booking_ids.txt", "r") as f:
        ids = [line.strip() for line in f if line.strip()]
    
    if limit: ids = ids[:limit]
    
    mail = imaplib.IMAP4_SSL(settings.email_host, settings.email_port)
    mail.login(settings.email_user, settings.email_password)
    mail.select('"Sent"') # Zoho Sent folder
    
    logger.info(f"Starting sync for {len(ids)} booking IDs...")
    
    for i, bid in enumerate(ids):
        found = process_booking_id(mail, bid, db, existing_msg_ids)
        print(f"Completed example {i+1}/{len(ids)} booking id: {bid} (Found {found} docs)")

    mail.logout()
    db.close()

if __name__ == "__main__":
    run_sync()
