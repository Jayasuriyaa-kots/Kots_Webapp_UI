from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import asc
import logging

from database import get_db
from models.booking import FlatBookingOrder
from models.parking import ParkingLock
from schemas.parking import ParkingStatusResponse, ParkingDetails
from services.auth_middleware import get_current_user_phone

router = APIRouter(prefix="/api", tags=["Parking"])
logger = logging.getLogger(__name__)


@router.get("/parking-status", response_model=ParkingStatusResponse)
def get_parking_status(
    booking_id: str = Query(..., description="Flat booking order code"),
    db: Session = Depends(get_db),
    current_user_phone: str = Depends(get_current_user_phone)
):
    """
    Get parking status for a booking.
    
    1. Find flat_dummy_code from flat_booking_orders using booking_id
    2. Look up parking_locks using flat_customer_reference_id
    3. If parking_notify_me is True -> user is in waiting list, calculate position
    4. If parking_notify_me is False -> subscription is active
    """
    # Step 1: Find the booking and get flat_dummy_code
    booking = db.query(FlatBookingOrder).filter(
        FlatBookingOrder.flat_booking_order_code == booking_id
    ).first()

    if not booking:
        return ParkingStatusResponse(
            success=False,
            message="Booking not found"
        )

    flat_dummy_code = booking.dummy_order_code
    if not flat_dummy_code:
        return ParkingStatusResponse(
            success=False,
            message="No flat reference found for this booking"
        )

    # Step 2: Find parking lock using flat_customer_reference_id
    parking = db.query(ParkingLock).filter(
        ParkingLock.flat_customer_reference_id == flat_dummy_code
    ).first()

    if not parking:
        return ParkingStatusResponse(
            success=False,
            message="No parking record found"
        )

    # Step 3: Check parking_notify_me
    if parking.parking_notify_me:
        # User is in waiting list - calculate position within property
        waiting_list = db.query(ParkingLock).filter(
            ParkingLock.property_id == parking.property_id,
            ParkingLock.parking_notify_me == True
        ).order_by(asc(ParkingLock.id)).all()

        # Find this user's position in the waiting list
        waiting_position = 1
        for i, entry in enumerate(waiting_list):
            if entry.id == parking.id:
                waiting_position = i + 1
                break

        return ParkingStatusResponse(
            success=True,
            is_in_waiting_list=True,
            waiting_list_number=waiting_position,
            property_id=parking.property_id,
            message=f"You are in waiting list No. {waiting_position}"
        )
    else:
        # Step 4: Subscription is active
        return ParkingStatusResponse(
            success=True,
            is_in_waiting_list=False,
            property_id=parking.property_id,
            parking_details=ParkingDetails(
                parking_slot_reserved=parking.parking_slot_reserved or False,
                total_available_parking_slots=parking.total_available_parking_slots or 0,
                total_paid_parking_slots=parking.total_paid_parking_slots or 0,
                reserved_parking_slots=parking.reserved_parking_slots or 0,
                status=parking.status or ""
            ),
            message="Parking subscription is active"
        )

