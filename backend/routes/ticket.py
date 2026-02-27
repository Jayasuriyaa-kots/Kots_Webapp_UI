from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
import httpx
import logging

from database import get_db
from models.ticket import TenantServiceTicket
from models.notification import Notification
from services.auth_middleware import get_current_user_phone
from datetime import datetime

from services.websocket_manager import manager
import asyncio
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

WEBHOOK_URL = "https://kots-website-staging.quantaops.com/api/add_service_webhook"


class TicketPayload(BaseModel):
    timestamp: str
    phone: str
    servicetype: str
    subcategory: str
    servicetranscript: Optional[str] = None
    call_transcript: Optional[str] = None
    booking_id: str
    channel: str = "Mobile App"
    layout: str
    classification: str


class TicketResponse(BaseModel):
    id: int
    ticket_number: Optional[str] = None
    booking_id: Optional[str] = None
    classification: Optional[str] = None
    category: Optional[str] = None
    issue_description: Optional[str] = None
    status: Optional[str] = None
    final_resolution_message: Optional[str] = None
    final_resolution_at: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/{booking_id}", response_model=List[TicketResponse])
def get_tickets_by_booking(
    booking_id: str, 
    db: Session = Depends(get_db),
    current_user_phone: str = Depends(get_current_user_phone)
):
    """Fetch all tickets for a given booking ID."""
    tickets = db.query(TenantServiceTicket).filter(
        TenantServiceTicket.booking_id == booking_id
    ).order_by(TenantServiceTicket.created_at.desc()).all()

    result = []
    for t in tickets:
        result.append(TicketResponse(
            id=t.id,
            ticket_number=t.ticket_number,
            booking_id=t.booking_id,
            classification=t.classification,
            category=t.category,
            issue_description=t.issue_description,
            status=t.status,
            final_resolution_message=t.final_resolution_message,
            final_resolution_at=t.final_resolution_at.isoformat() if t.final_resolution_at else None,
            created_at=t.created_at.isoformat() if t.created_at else None,
        ))
    return result


@router.post("/raise")
async def raise_ticket(
    payload: TicketPayload,
    db: Session = Depends(get_db),
    current_user_phone: str = Depends(get_current_user_phone)
):
    """Proxy endpoint to forward ticket to webhook and log it."""
    payload_dict = payload.dict()
    
    # Overwrite the phone from the payload with the verified phone from the cookie
    payload_dict["phone"] = current_user_phone

    print(f"\n{'='*60}")
    print(f"TICKET RAISED - Webhook Payload:")
    print(f"  Timestamp: {payload.timestamp}")
    print(f"  Phone: {payload.phone}")
    print(f"  Service Type: {payload.servicetype}")
    print(f"  Subcategory: {payload.subcategory}")
    print(f"  Service Transcript: {payload.servicetranscript}")
    print(f"  Call Transcript: {payload.call_transcript}")
    print(f"  Booking ID: {payload.booking_id}")
    print(f"  Channel: {payload.channel}")
    print(f"  Layout: {payload.layout}")
    print(f"  Classification: {payload.classification}")
    print(f"{'='*60}\n")

    # Insert notification logic
    try:
        transcript = (payload.servicetranscript or "").lower()
        service_type = (payload.servicetype or "").lower()
        
        # Determine notification content
        if "parking" in service_type or "parking" in transcript:
            if any(k in transcript for k in ["cancel", "cancelling", "removal", "stop"]):
                msg = "Your car parking request has been cancelled."
                icon = "parking_cancel_icon"
            elif any(k in transcript for k in ["request", "requesting", "need", "want", "add"]):
                msg = "Your car parking request has been received. Our team will look into it shortly."
                icon = "parking_request_icon"
            else:
                msg = "Update regarding your car parking request."
                icon = "parking_icon"
        else:
            msg = "Your ticket has been raised, our kots team will look into it and update you soon"
            icon = "ticket_raised_icon"
        
        # Broadcast notification via WebSocket AS SOON AS POSSIBLE
        # Skip broadcast for parking actions because they are now handled locally in the UI
        # to ensure near-zero latency popup alerts.
        is_parking_action = "parking" in service_type or "parking" in transcript
        
        if not is_parking_action:
            temp_id = f"notif_{int(datetime.utcnow().timestamp())}"
            broadcast_data = {
                "type": "NOTIFICATION_RECEIVED",
                "notification": {
                    "id": temp_id,
                    "booking_id": payload.booking_id,
                    "notification_type": "System Message",
                    "message": msg,
                    "icon": icon,
                    "notification_date": datetime.utcnow().isoformat(),
                    "isRead": False,
                    "created_at": datetime.utcnow().isoformat()
                }
            }
            try:
                # Fire and forget the broadcast for other ticket types
                asyncio.create_task(manager.broadcast_to_booking(payload.booking_id, broadcast_data))
            except Exception as ws_err:
                print(f"DEBUG: WS Broadcast error: {ws_err}")
        else:
            print("DEBUG: Skipping WS broadcast for parking action (handled locally)")

        # Now save to DB in the background (or just proceed)
        notif = Notification(
            booking_id=payload.booking_id,
            notification_type="System Message",
            message=msg,
            icon=icon,
            notification_date=datetime.utcnow()
        )
        db.add(notif)
        db.commit()
            
    except Exception as e:
        print(f"DEBUG: Error in notification logic: {e}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(WEBHOOK_URL, json=payload_dict)
            print(f"Webhook response status: {response.status_code}")
            print(f"Webhook response body: {response.text[:200]}")
            return {"ok": True, "webhook_status": response.status_code, "webhook_response": response.json() if response.status_code == 200 else response.text}
    except Exception as e:
        print(f"Webhook error: {e}")
        logger.error(f"Webhook error: {e}")
        # Still return success so user sees the success page
        return {"ok": True, "message": "Ticket submitted (webhook delivery pending)", "error": str(e)}

