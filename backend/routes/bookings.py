from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.booking import FlatBookingOrder
from schemas.booking import BookingInfo, BookingsResponse
from services.auth_service import create_sso_token, create_session_token
from services.auth_middleware import get_current_user_phone

router = APIRouter(prefix="/api", tags=["Bookings"])


@router.get("/bookings", response_model=BookingsResponse)
def get_bookings_by_phone(
    response: Response,
    phone: str = Query(..., description="Phone number to lookup bookings"),
    db: Session = Depends(get_db)
):
    """
    Fetch bookings by phone number from database.
    
    - If phone number has bookings: returns list of booking IDs
    - If phone number not found: returns error message
    """
    # Clean phone number (remove spaces, dashes, country code if present)
    clean_phone = phone.strip().replace(" ", "").replace("-", "")
    if clean_phone.startswith("+91"):
        clean_phone = clean_phone[3:]
    elif clean_phone.startswith("91") and len(clean_phone) > 10:
        clean_phone = clean_phone[2:]
    
    # Query database for bookings with this phone number
    bookings = db.query(FlatBookingOrder).filter(
        FlatBookingOrder.tenant_phone_number == clean_phone
    ).all()
    
    if not bookings:
        return BookingsResponse(
            success=False,
            bookings=[],
            message="Enter registered mobile number"
        )
    
    # Build response with booking IDs
    booking_list = []
    for booking in bookings:
        booking_code = booking.flat_booking_order_code
        if booking_code:
            # Generate SSO token for Site B
            sso_token = create_sso_token(clean_phone, booking_code)
            
            booking_list.append(BookingInfo(
                id=booking_code,
                displayName=f"Booking ID - {booking_code}",
                sso_token=sso_token
            ))
    
    if not booking_list:
        return BookingsResponse(
            success=False,
            bookings=[],
            message="Enter registered mobile number"
        )
    
    # Set internal session cookie
    from config import get_settings
    settings = get_settings()
    
    session_token = create_session_token(clean_phone)
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=604800  # 7 days
    )
    
    return BookingsResponse(
        success=True,
        bookings=booking_list,
        message=None
    )

@router.get("/auth/me", response_model=BookingsResponse)
def get_current_session(
    db: Session = Depends(get_db),
    phone: str = Depends(get_current_user_phone)
):
    """
    Get the current user's bookings based on the session cookie.
    Used by the frontend to restore state on refresh.
    """
    # Reuse code from get_bookings_by_phone but with the verified phone
    clean_phone = "".join(filter(str.isdigit, phone))[-10:]
    
    bookings = db.query(FlatBookingOrder).filter(
        FlatBookingOrder.tenant_phone_number.contains(clean_phone)
    ).all()
    
    booking_list = []
    for b in bookings:
        booking_code = b.flat_booking_order_code
        if booking_code:
            sso_token = create_sso_token(clean_phone, booking_code)
            booking_list.append(BookingInfo(
                id=booking_code,
                displayName=f"Booking ID - {booking_code}",
                sso_token=sso_token
            ))
            
    if not booking_list:
        raise HTTPException(status_code=401, detail="No bookings found for session")
        
    return BookingsResponse(
        success=True,
        bookings=booking_list,
        message=None
    )
