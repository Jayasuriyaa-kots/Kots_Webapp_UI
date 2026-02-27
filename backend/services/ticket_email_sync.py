"""
Ticket Email Sync Service
Fetches ticket confirmation emails via IMAP, extracts ticket numbers from subjects,
and stores them in the tenant_service_tickets table.

Email subject format:
  Re:[## 275482 ##] AO-Flat Customization and Installations :: AC Installation :: K15A4032411202
  or
  [## 275482 ##] AO-Flat Customization and Installations :: AC Installation :: K15A4032411202
"""

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
from typing import Optional

from sqlalchemy.orm import Session

from config import get_settings
from models.ticket import TenantServiceTicket
from models.notification import Notification
from services.websocket_manager import manager

logger = logging.getLogger(__name__)

# Regex to extract ticket number from subject: [## 275482 ##]
TICKET_NUMBER_PATTERN = re.compile(r'\[?##\s*(\d+)\s*##\]?')

# Regex to extract ticket number from closure email: Ticket no 474699
CLOSURE_TICKET_PATTERN = re.compile(r'Ticket\s*no\s*(\d+)', re.IGNORECASE)

# Regex to detect "Issue Closed" in subject
ISSUE_CLOSED_PATTERN = re.compile(r'Issue\s+Closed', re.IGNORECASE)

# Regex to extract booking ID: K followed by alphanumeric (8-20 chars)
BOOKING_ID_PATTERN = re.compile(r'(K[0-9A-Z]{8,20})')

# File to persist last ticket sync date
LAST_TICKET_SYNC_FILE = os.path.join(os.path.dirname(__file__), '..', '.last_ticket_sync')


def _get_last_ticket_sync_date() -> Optional[str]:
    """Get the last sync date in DD-Mon-YYYY format for IMAP SINCE query."""
    try:
        if os.path.exists(LAST_TICKET_SYNC_FILE):
            with open(LAST_TICKET_SYNC_FILE, 'r') as f:
                data = json.load(f)
                return data.get('last_sync_date')
    except Exception as e:
        logger.warning(f"Could not read last ticket sync file: {e}")
    return None


def _save_last_ticket_sync_date():
    """Save today's date as the last sync date."""
    try:
        today = datetime.now().strftime('%d-%b-%Y')
        with open(LAST_TICKET_SYNC_FILE, 'w') as f:
            json.dump({'last_sync_date': today, 'updated_at': datetime.now().isoformat()}, f)
    except Exception as e:
        logger.warning(f"Could not save last ticket sync file: {e}")


def _extract_ticket_number(subject: str) -> Optional[str]:
    """Extract ticket number from subject like [## 275482 ##]."""
    match = TICKET_NUMBER_PATTERN.search(subject)
    return match.group(1) if match else None


def _extract_booking_id(text: str) -> Optional[str]:
    """Extract booking ID from text using pattern K[0-9A-Z]{8,20}."""
    match = BOOKING_ID_PATTERN.search(text)
    return match.group(1) if match else None


def _parse_subject(subject: str) -> dict:
    """
    Parse ticket email subject to extract classification, subcategory, booking_id.

    Format: [## 275482 ##] AO-Flat Customization and Installations :: AC Installation :: K15A4032411202
    Also handles: Re:[## 275482 ##] AO-Flat ...
    2-part:  [## 474940 ##] Update/Remove Co-Occupants :: K01A99924012026
    """
    result = {
        'ticket_number': None,
        'classification': None,
        'category': None,
        'booking_id': None,
    }

    # Extract ticket number
    result['ticket_number'] = _extract_ticket_number(subject)

    # Extract booking ID
    result['booking_id'] = _extract_booking_id(subject)

    # Remove the ticket number part and "Re:" prefix to parse classification :: subcategory
    cleaned = re.sub(r'^(Re:\s*)', '', subject, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[?##\s*\d+\s*##\]?\s*', '', cleaned).strip()

    # Split by :: and filter out the booking ID part
    parts = [p.strip() for p in cleaned.split('::')]
    # Remove any part that matches the booking ID pattern (K followed by alphanumeric)
    parts = [p for p in parts if not BOOKING_ID_PATTERN.fullmatch(p)]

    if len(parts) >= 1:
        result['classification'] = parts[0]
    if len(parts) >= 2:
        result['category'] = parts[1]

    return result


def _connect_imap(settings):
    """Create a fresh IMAP connection."""
    mail = imaplib.IMAP4_SSL(settings.email_host, settings.email_port)
    mail.login(settings.email_user, settings.email_password)
    return mail


def _process_ticket_email(mail, eid, existing_ticket_nos, db, stats):
    """
    Fetch and process a single ticket email.
    Returns True if successful, False on error.
    """
    status, msg_data = mail.fetch(eid, "(RFC822)")
    if status != "OK":
        stats["errors"] += 1
        return True

    raw_email = msg_data[0][1]
    msg = email.message_from_bytes(raw_email, policy=policy.default)

    subject = msg.get("Subject", "") or ""

    # Only process emails that have a ticket number pattern ## NUMBER ##
    ticket_number = _extract_ticket_number(subject)
    if not ticket_number:
        print(f"  [SKIP] No ticket number in: {subject[:80]}")
        return True  # Not a ticket email, skip

    # Check if this ticket already exists in DB
    if ticket_number in existing_ticket_nos:
        stats["skipped"] += 1
        return True

    # Parse the full subject
    parsed = _parse_subject(subject)

    if not parsed['booking_id']:
        print(f"  [SKIP] No booking ID in: {subject[:80]}")
        return True  # No booking ID found, skip

    # Create the ticket record
    ticket = TenantServiceTicket(
        ticket_number=parsed['ticket_number'],
        booking_id=parsed['booking_id'],
        classification=parsed['classification'],
        category=parsed['category'],
        issue_description=subject,
        status='Open',
    )
    db.add(ticket)

    # Add notification for new ticket
    notification = Notification(
        booking_id=parsed['booking_id'],
        notification_type="System Message", # Per user instruction: ticket notification is system
        message=f"Your ticket #{parsed['ticket_number']} has been received. Our team will look into it shortly.",
        icon="ticket_icon",
        notification_date=datetime.utcnow()
    )
    db.add(notification)
    
    # Broadcast notification via WebSocket
    import asyncio
    try:
        # Since this might be called in a background thread/scheduler, we use a helper
        # but for now we'll just try to send if we can. 
        # Note: sync_ticket_emails is called in background.
        from database import SessionLocal
        # We need to be careful with async in sync context
        asyncio.run(manager.broadcast_to_booking(parsed['booking_id'], {
            "type": "NOTIFICATION_RECEIVED",
            "notification": {
                "booking_id": notification.booking_id,
                "notification_type": notification.notification_type,
                "message": notification.message,
                "icon": notification.icon,
                "notification_date": notification.notification_date.isoformat()
            }
        }))
    except Exception as e:
        logger.warning(f"Failed to broadcast websocket notification: {e}")

    existing_ticket_nos.add(ticket_number)

    stats["new"] += 1
    print(f"  [NEW] Ticket #{parsed['ticket_number']} | Booking: {parsed['booking_id']} | {parsed['classification']} :: {parsed['category']}")
    logger.info(f"Added ticket #{parsed['ticket_number']} for booking {parsed['booking_id']}: {subject[:60]}")
    return True


def _process_closure_email(mail, eid, db, closure_stats):
    """
    Check if an email is an 'Issue Closed' notification.
    If so, find the ticket in DB and mark it as Closed.
    """
    status, msg_data = mail.fetch(eid, "(RFC822)")
    if status != "OK":
        return True

    raw_email = msg_data[0][1]
    msg = email.message_from_bytes(raw_email, policy=policy.default)
    subject = msg.get("Subject", "") or ""

    # Only process emails with "Issue Closed" in subject
    if not ISSUE_CLOSED_PATTERN.search(subject):
        return True

    # Extract ticket number from "Ticket no XXXXX"
    match = CLOSURE_TICKET_PATTERN.search(subject)
    if not match:
        print(f"  [CLOSE-SKIP] No ticket number in: {subject[:80]}")
        return True

    ticket_number = match.group(1)

    # Find the ticket in DB
    ticket = db.query(TenantServiceTicket).filter(
        TenantServiceTicket.ticket_number == ticket_number
    ).first()

    if not ticket:
        print(f"  [CLOSE-SKIP] Ticket #{ticket_number} not found in DB")
        return True

    if ticket.status == 'Closed':
        closure_stats['already_closed'] += 1
        return True

    # Extract the email body text
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == "text/plain":
                try:
                    body = part.get_content()
                except Exception:
                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                break
        # Fallback to HTML if no plain text
        if not body:
            for part in msg.walk():
                if part.get_content_type() == "text/html":
                    try:
                        body = part.get_content()
                    except Exception:
                        body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    # Strip HTML tags for clean text
                    body = re.sub(r'<[^>]+>', '', body).strip()
                    break
    else:
        try:
            body = msg.get_content()
        except Exception:
            body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')

    # Parse email date for resolution timestamp
    date_str = msg.get("Date", "")
    resolution_date = datetime.utcnow()
    if date_str:
        try:
            resolution_date = parsedate_to_datetime(date_str)
        except Exception:
            pass

    # Update the ticket
    ticket.status = 'Closed'
    ticket.final_resolution_message = body.strip() if body else subject
    ticket.final_resolution_at = resolution_date

    # Add notification for ticket closure
    notification = Notification(
        booking_id=ticket.booking_id,
        notification_type="System Message",
        message=f"Great news! Your ticket #{ticket_number} has been marked as resolved. Please let us know if you're satisfied.",
        icon="ticket_resolved_icon",
        notification_date=datetime.utcnow()
    )
    db.add(notification)

    # Broadcast notification via WebSocket
    import asyncio
    try:
        asyncio.run(manager.broadcast_to_booking(ticket.booking_id, {
            "type": "NOTIFICATION_RECEIVED",
            "notification": {
                "booking_id": notification.booking_id,
                "notification_type": notification.notification_type,
                "message": notification.message,
                "icon": notification.icon,
                "notification_date": notification.notification_date.isoformat()
            }
        }))
    except Exception as e:
        logger.warning(f"Failed to broadcast websocket notification: {e}")

    closure_stats['closed'] += 1
    print(f"  [CLOSED] Ticket #{ticket_number} | Status -> Closed | Resolved at: {resolution_date}")
    return True


def sync_ticket_emails(db: Session) -> dict:
    """
    Connect to IMAP, read Sent folder for ticket emails,
    extract ticket numbers from subjects, and store in tenant_service_tickets.
    Only processes new emails since the last sync.
    Skips duplicates using email_message_id.
    """
    settings = get_settings()
    stats = {"fetched": 0, "new": 0, "skipped": 0, "errors": 0}
    closure_stats = {"fetched": 0, "closed": 0, "already_closed": 0}

    try:
        mail = _connect_imap(settings)

        # =============================================
        # PHASE 1: Scan Sent folder for NEW tickets
        # =============================================
        print("  --- Phase 1: New Ticket Detection (Sent folder) ---")
        folders_to_search = ['"Sent"', '"Sent Items"', '"[Gmail]/Sent Mail"', 'Sent']
        processed_folders = set()

        # Get existing ticket numbers from DB to avoid duplicates
        existing_ticket_nos = set()
        existing_records = db.query(TenantServiceTicket.ticket_number).filter(
            TenantServiceTicket.ticket_number.isnot(None)
        ).all()
        for record in existing_records:
            if record.ticket_number:
                existing_ticket_nos.add(record.ticket_number)
        print(f"  Existing tickets in DB: {len(existing_ticket_nos)}")

        # Get last sync date for incremental processing
        last_sync_date = _get_last_ticket_sync_date()
        if last_sync_date:
            search_criteria = f'(SINCE {last_sync_date})'
            print(f"  Ticket sync: fetching emails since {last_sync_date}")
        else:
            search_criteria = "ALL"
            print("  Ticket sync: first sync, fetching ALL emails")

        for folder_name in folders_to_search:
            try:
                if folder_name in processed_folders:
                    continue

                status, _ = mail.select(folder_name)
                if status != "OK":
                    continue

                processed_folders.add(folder_name)
                print(f"  Scanning folder: {folder_name}")

                status, data = mail.search(None, search_criteria)
                if status != "OK" or not data[0]:
                    print(f"  No emails found in {folder_name}")
                    continue

                email_ids = data[0].split()
                if not email_ids:
                    continue

                print(f"  Found {len(email_ids)} emails in {folder_name}")
                stats["fetched"] += len(email_ids)

                # Process newest first
                email_ids = email_ids[::-1]

                for eid in email_ids:
                    try:
                        _process_ticket_email(mail, eid, existing_ticket_nos, db, stats)
                    except (ssl.SSLError, imaplib.IMAP4.abort, ConnectionError, OSError) as e:
                        logger.warning(f"Connection error on email {eid}, reconnecting: {e}")
                        stats["errors"] += 1
                        try:
                            mail = _connect_imap(settings)
                            mail.select(folder_name)
                            try:
                                _process_ticket_email(mail, eid, existing_ticket_nos, db, stats)
                            except Exception:
                                logger.warning(f"Skipping email {eid} after reconnect retry")
                                stats["errors"] += 1
                        except Exception as reconnect_err:
                            logger.error(f"Failed to reconnect: {reconnect_err}")
                            db.commit()
                            return {"error": f"Connection lost: {str(e)}", **stats}
                    except Exception as e:
                        logger.error(f"Error processing ticket email {eid}: {e}")
                        stats["errors"] += 1
                        continue

            except Exception as e:
                logger.error(f"Error accessing folder {folder_name}: {e}")
                continue

        db.commit()

        # =============================================
        # PHASE 2: Scan ALL folders for CLOSURE emails
        # =============================================
        print("  --- Phase 2: Ticket Closure Detection (Sent folder) ---")
        closure_folders = ['"Sent"', '"Sent Items"', '"[Gmail]/Sent Mail"', 'Sent']
        scanned_closure_folders = set()

        for folder_name in closure_folders:
            try:
                if folder_name in scanned_closure_folders:
                    continue

                status, _ = mail.select(folder_name)
                if status != "OK":
                    continue

                scanned_closure_folders.add(folder_name)

                status, data = mail.search(None, search_criteria)
                if status != "OK" or not data[0]:
                    continue

                folder_ids = data[0].split()
                print(f"  Scanning {folder_name} for closures: {len(folder_ids)} emails")
                closure_stats['fetched'] += len(folder_ids)

                # Process newest first
                folder_ids = folder_ids[::-1]

                for eid in folder_ids:
                    try:
                        _process_closure_email(mail, eid, db, closure_stats)
                    except (ssl.SSLError, imaplib.IMAP4.abort, ConnectionError, OSError) as e:
                        logger.warning(f"Connection error on closure email {eid}: {e}")
                        try:
                            mail = _connect_imap(settings)
                            mail.select(folder_name)
                            _process_closure_email(mail, eid, db, closure_stats)
                        except Exception:
                            pass
                    except Exception as e:
                        logger.error(f"Error processing closure email {eid}: {e}")

            except Exception as e:
                logger.error(f"Error scanning {folder_name} for closures: {e}")

        db.commit()

        try:
            mail.close()
            mail.logout()
        except Exception:
            pass

        # Save sync date for next run
        _save_last_ticket_sync_date()

        print(f"  New tickets: {stats}")
        print(f"  Closures:    {closure_stats}")
        print(f"{'='*60}")
        logger.info(f"Ticket email sync complete: new={stats}, closures={closure_stats}")

    except imaplib.IMAP4.error as e:
        logger.error(f"IMAP error in ticket sync: {e}")
        return {"error": f"IMAP connection failed: {str(e)}", **stats}
    except Exception as e:
        logger.error(f"Ticket email sync error: {e}")
        db.rollback()
        return {"error": str(e), **stats}

    return {**stats, **closure_stats}
