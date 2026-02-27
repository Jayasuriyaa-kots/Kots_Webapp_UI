from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from uuid import UUID

class NotificationResponse(BaseModel):
    id: UUID
    booking_id: str
    notification_date: datetime
    notification_type: str
    message: str
    icon: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationListResponse(BaseModel):
    success: bool
    notifications: List[NotificationResponse]
    message: Optional[str] = None
