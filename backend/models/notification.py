from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from database import Base

class Notification(Base):
    """Model for tenant notifications matching existing DB table"""
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(String(50), index=True)
    notification_date = Column(DateTime, default=datetime.utcnow)
    notification_type = Column(String(30))  # System Message / Property Broadcast / Ticket Related
    message = Column(Text) # Body of the notice
    icon = Column(String(50)) # Notification Icon
    created_at = Column(DateTime, default=datetime.utcnow)
