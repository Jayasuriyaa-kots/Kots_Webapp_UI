from pydantic import BaseModel
from typing import List, Optional


class BookingInfo(BaseModel):
    """Response schema for a single booking"""
    id: str
    displayName: str
    tenantName: Optional[str] = None
    sso_token: Optional[str] = None
    
    class Config:
        from_attributes = True


class BookingsResponse(BaseModel):
    """Response schema for booking lookup"""
    success: bool
    bookings: List[BookingInfo]
    message: Optional[str] = None


class TenantDetailsResponse(BaseModel):
    """Response schema for tenant details by booking ID"""
    success: bool
    bookingId: str
    tenantName: Optional[str] = None
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    """Response schema for errors"""
    success: bool = False
    message: str
    bookings: List[BookingInfo] = []
