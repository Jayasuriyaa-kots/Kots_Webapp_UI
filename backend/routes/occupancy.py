from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.booking import FlatBookingOrder
from models.flat import Flat
from models.kyc import KycDetails
from schemas.occupancy import OccupancyResponse, CoOccupant
from services.auth_middleware import get_current_user_phone

router = APIRouter(prefix="/api", tags=["Occupancy"])

@router.get("/occupancy", response_model=OccupancyResponse)
def get_occupancy_details(
    booking_id: str = Query(..., description="Booking ID to fetch occupancy details"),
    db: Session = Depends(get_db),
    current_user_phone: str = Depends(get_current_user_phone)
):
    """
    Fetch max occupancy and co-occupants for a booking.
    """
    # 1. Get booking to find flat_id
    booking = db.query(FlatBookingOrder).filter(
        FlatBookingOrder.flat_booking_order_code == booking_id
    ).first()
    
    if not booking:
        return OccupancyResponse(
            success=False,
            message="Booking not found"
        )
    
    # 2. Get flat to find max_occupancy
    max_occ = "N/A"
    if booking.flat_id:
        flat = db.query(Flat).filter(Flat.id == booking.flat_id).first()
        if flat:
            max_occ = flat.max_occupancy or "N/A"
            
    # 3. Get co-occupants from kyc_details
    kyc = db.query(KycDetails).filter(
        KycDetails.booking_id == booking_id
    ).first()
    
    co_occupants = []
    if kyc:
        # Check co1_name to co4_name as per screenshot
        for i in range(1, 5):
            name = getattr(kyc, f"co{i}_name", None)
            phone = getattr(kyc, f"co{i}_phone", None)
            if name:
                co_occupants.append(CoOccupant(
                    name=name,
                    phone=phone or "N/A"
                ))
                
    return OccupancyResponse(
        success=True,
        max_occupancy=max_occ,
        co_occupants=co_occupants
    )
