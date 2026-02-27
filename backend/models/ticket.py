from sqlalchemy import Column, Integer, String, Text, DateTime, Numeric
from datetime import datetime
from database import Base


class TenantServiceTicket(Base):
    """
    Model for tenant_service_tickets table.
    Populated via email sync from Zoho/IMAP.
    """
    __tablename__ = "tenant_service_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(50))                        # Ticket No
    booking_id = Column(String(50))                           # Booking ID (from email subject)
    classification = Column(String(200))                      # Ticket Classification
    category = Column(String(100))                            # Category
    issue_description = Column(Text)                          # Issue Description
    status = Column(String(30), default="Open")               # Ticket Status
    final_resolution_message = Column(Text)                   # Final Resolution Message
    final_resolution_at = Column(DateTime)                    # Final Resolution Date & Time
    charges_amount = Column(Numeric(10, 2))                   # Charges applicable to pay
    charges_description = Column(Text)                        # Charges Description
    created_at = Column(DateTime, default=datetime.utcnow)    # Ticket Creation Date
