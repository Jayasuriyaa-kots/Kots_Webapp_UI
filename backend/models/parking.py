from sqlalchemy import Column, String, Integer, Boolean, DateTime
from database import Base


class ParkingLock(Base):
    """Model for parking_locks table"""
    __tablename__ = "parking_locks"

    id = Column(Integer, primary_key=True)
    property_id = Column(Integer)
    flat_id = Column(Integer)
    flat_customer_reference_id = Column(String)
    lock_type = Column(String)
    status = Column(String)
    total_available_parking_slots = Column(Integer)
    total_paid_parking_slots = Column(Integer)
    count_of_paid_car_parking = Column(Integer)
    reserved_parking_slots = Column(Integer)
    parking_opted_in = Column(Boolean)
    parking_notify_me = Column(Boolean)
    parking_slot_reserved = Column(Boolean)
    parking_reservation_expires_at = Column(DateTime)
    created_at = Column(DateTime)
