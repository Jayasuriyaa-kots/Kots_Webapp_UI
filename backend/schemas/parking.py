from pydantic import BaseModel
from typing import Optional


class ParkingDetails(BaseModel):
    """Parking details for subscribed users"""
    parking_slot_reserved: bool = False
    total_available_parking_slots: int = 0
    total_paid_parking_slots: int = 0
    reserved_parking_slots: int = 0
    status: str = ""


class ParkingStatusResponse(BaseModel):
    """Response schema for parking status check"""
    success: bool
    is_in_waiting_list: bool = False
    waiting_list_number: Optional[int] = None
    property_id: Optional[int] = None
    parking_details: Optional[ParkingDetails] = None
    message: Optional[str] = None


class ParkingRequestResponse(BaseModel):
    """Response schema for parking request email"""
    success: bool
    message: str

