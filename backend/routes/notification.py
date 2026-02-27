from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from database import get_db
from models.notification import Notification
from schemas.notification import NotificationListResponse
from services.auth_middleware import get_current_user_phone

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("", response_model=NotificationListResponse)
def get_notifications(
    booking_id: str = Query(..., description="Booking ID to fetch notifications for"),
    db: Session = Depends(get_db),
    current_user_phone: str = Depends(get_current_user_phone)
):
    """
    Fetch all notifications for a specific booking.
    """
    notifications = db.query(Notification).filter(
        Notification.booking_id == booking_id
    ).order_by(Notification.notification_date.desc()).all()
    
    return NotificationListResponse(
        success=True,
        notifications=notifications
    )

# Note: is_read is not present in the current DB table structure
# If needed later, we can add a Column for it.
