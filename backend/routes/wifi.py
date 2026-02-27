from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models.booking import FlatBookingOrder
from models.flat import Flat
from schemas.wifi import WifiResponse
from services.auth_middleware import get_current_user_phone

router = APIRouter(prefix="/api/wifi", tags=["wifi"])

@router.get("", response_model=WifiResponse)
def get_wifi_credentials(
    booking_id: str = Query(..., description="Booking ID or Flat Booking Order Code"),
    db: Session = Depends(get_db),
    current_user_phone: str = Depends(get_current_user_phone)
):
    # 1. Look up the booking to get the flat_id
    booking = db.query(FlatBookingOrder).filter(
        FlatBookingOrder.flat_booking_order_code.ilike(booking_id)
    ).first()
    
    if not booking:
        # Try dummy_order_code as fallback if needed, but primary is flat_booking_order_code
        booking = db.query(FlatBookingOrder).filter(
            FlatBookingOrder.dummy_order_code.ilike(booking_id)
        ).first()
        
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if not booking.flat_id:
        raise HTTPException(status_code=400, detail="Booking has no associated flat")
        
    # 2. Look up the flat to get WiFi credentials
    flat = db.query(Flat).filter(Flat.id == booking.flat_id).first()
    
    if not flat:
        raise HTTPException(status_code=404, detail="Flat not found")
        
    return WifiResponse(
        success=True,
        wifi_id=flat.wifi_id,
        wifi_password=flat.wifi_password
    )
