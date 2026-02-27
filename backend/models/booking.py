from sqlalchemy import Column, String, Integer, Text, Date
from database import Base


class FlatBookingOrder(Base):
    """Model for flat_booking_orders table"""
    __tablename__ = "flat_booking_orders"
    
    id = Column(Integer, primary_key=True)
    flat_booking_order_code = Column(String)
    dummy_order_code = Column(String)
    flat_id = Column(Integer)
    tenant_phone_number = Column(String)
    tenant_email = Column(String)
    status = Column(String)

