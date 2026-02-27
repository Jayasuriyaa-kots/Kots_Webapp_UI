from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import random
import string
from datetime import datetime
import os


from database import get_db
from models.referral import ReferralCode, Referral
from models.booking import FlatBookingOrder
from schemas.referral import ReferralInviteRequest, ReferralResponse, DashboardResponse, ReferralStats, ReferralItem
from services.auth_middleware import get_current_user_phone

router = APIRouter(prefix="/api/referrals", tags=["Referral"])

BASE_URL = os.getenv("BASE_URL", "https://9a33-106-51-36-241.ngrok-free.app")

# Configuration
REWARD_AMOUNT = 5000.0
GOAL_AMOUNT = 25000.0

def generate_referral_code(prefix: str = "KOTS") -> str:
    """Generate a random 6-character code appended to prefix"""
    chars = string.ascii_uppercase + string.digits
    random_str = ''.join(random.choice(chars) for _ in range(6))
    return f"{prefix}-{random_str}"

def get_or_create_referral_code(db: Session, booking_id: str) -> str:
    """Get existing code for user from referrals table, or from legacy referral_codes table, or create new one"""
    # First check if any referral for this booking already has a code
    existing_referral = db.query(Referral).filter(
        Referral.referrer_booking_id == booking_id,
        Referral.referral_code.isnot(None)
    ).first()
    
    if existing_referral:
        return existing_referral.referral_code
    
    # Fallback: check legacy referral_codes table
    ref_code = db.query(ReferralCode).filter(ReferralCode.booking_id == booking_id).first()
    if ref_code:
        return ref_code.code
        
    # Create new code
    new_code = generate_referral_code()
    # Ensure uniqueness
    while db.query(ReferralCode).filter(ReferralCode.code == new_code).first():
        new_code = generate_referral_code()
    
    # Also save to legacy table for backward compat
    new_ref_code = ReferralCode(booking_id=booking_id, code=new_code)
    db.add(new_ref_code)
    db.commit()
    db.refresh(new_ref_code)
    return new_ref_code.code

@router.post("/invite", response_model=ReferralResponse)
def invite_friend(
    invite: ReferralInviteRequest,
    booking_id: str = Query(..., description="Referrer's Booking ID"),
    db: Session = Depends(get_db),
    current_user_phone: str = Depends(get_current_user_phone)
):
    """
    Record a manual invite (Pending status) with the referral code attached
    """
    # Check if already invited
    existing = db.query(Referral).filter(
        Referral.referrer_booking_id == booking_id,
        Referral.referee_phone == invite.referee_phone
    ).first()
    
    if existing:
        return ReferralResponse(
            success=True, 
            message="Friend already invited",
            referral_id=existing.id
        )
    
    # Generate a unique referral code for this specific referral
    code = generate_referral_code()
    while db.query(Referral).filter(Referral.referral_code == code).first():
        code = generate_referral_code()
        
    # Create new referral with its own unique code
    new_referral = Referral(
        referrer_booking_id=booking_id,
        referee_name=invite.referee_name,
        referee_phone=invite.referee_phone,
        referee_email=invite.referee_email,
        referral_code=code,
        status="Pending"
    )
    
    db.add(new_referral)
    try:
        db.commit()
        db.refresh(new_referral)
        click_link = f"{BASE_URL}/api/referrals/click/{new_referral.id}"

        return ReferralResponse(
            success=True, 
            message="Invite recorded successfully",
            referral_id=new_referral.id,
            invite_link=click_link
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    booking_id: str = Query(..., description="User's Booking ID"),
    db: Session = Depends(get_db),
    current_user_phone: str = Depends(get_current_user_phone)
):
    print(f"DEBUG: get_dashboard called with booking_id={booking_id}")
    try:
        """
        Get referral stats and list.
        Also syncs 'Pending' referrals with actual bookings.
        """
        # 1. Sync Pending Referrals
        pending_referrals = db.query(Referral).filter(
            Referral.referrer_booking_id == booking_id,
            Referral.status == "Pending"
        ).all()
        
        for ref in pending_referrals:
            booked_user = db.query(FlatBookingOrder).filter(
                FlatBookingOrder.tenant_phone_number.contains(ref.referee_phone),
                FlatBookingOrder.flat_booking_order_code.isnot(None),
                FlatBookingOrder.flat_booking_order_code != ""
            ).first()
            
            if booked_user:
                ref.status = "Successful"
                ref.booking_id = booked_user.flat_booking_order_code
                ref.updated_at = datetime.utcnow()
                db.add(ref)
                
        if pending_referrals:
            db.commit()
            
        # 2. Get Stats
        total_invites = db.query(Referral).filter(Referral.referrer_booking_id == booking_id).count()
        successful_invites = db.query(Referral).filter(
            Referral.referrer_booking_id == booking_id, 
            Referral.status == "Successful"
        ).count()
        pending_invites = db.query(Referral).filter(
            Referral.referrer_booking_id == booking_id, 
            Referral.status == "Pending"
        ).count()
        
        total_earned = successful_invites * REWARD_AMOUNT
        
        # 3. Get Referral Code
        my_code = get_or_create_referral_code(db, booking_id)
        referral_link = f"https://kotsworld.com/register?ref={my_code}" 
        
        # 4. Get List
        referrals_list = db.query(Referral).filter(
            Referral.referrer_booking_id == booking_id
        ).order_by(Referral.created_at.desc()).all()
        
        return DashboardResponse(
            success=True,
            stats=ReferralStats(
                total_earned=total_earned,
                goal_amount=GOAL_AMOUNT,
                total_invites=total_invites,
                successful_invites=successful_invites,
                pending_invites=pending_invites,
                referral_code=my_code,
                referral_link=referral_link
            ),
            invites=[
                ReferralItem(
                    id=r.id,
                    name=r.referee_name,
                    phone=r.referee_phone,
                    status=r.status,
                    clicked_count=r.clicked_count,
                    referral_code=r.referral_code or "",
                    created_at=r.created_at
                ) for r in referrals_list
            ]
        )
    except Exception as e:
        print(f"ERROR in get_dashboard: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/click/{referral_id}")
def track_click_by_id(referral_id: int, db: Session = Depends(get_db)):

    referral = db.query(Referral).filter(
        Referral.id == referral_id
    ).first()

    if not referral:
        return RedirectResponse("https://kotsworld.com/register")

    # Safe increment
    referral.clicked_count = (referral.clicked_count or 0) + 1
    referral.updated_at = datetime.utcnow()

    db.add(referral)
    db.commit()

    # Use the code stored on the referral itself
    code = referral.referral_code or get_or_create_referral_code(db, referral.referrer_booking_id)

    return RedirectResponse(
        f"https://kotsworld.com/register?ref={code}"
    )


@router.get("/r/{code}")
def track_click(code: str, db: Session = Depends(get_db)):
    """
    Track click and redirect
    """
    # Find code owner (optional: could log who clicked if we had info)
    ref_code = db.query(ReferralCode).filter(ReferralCode.code == code).first()
    
    if ref_code:
        pass
        
    return RedirectResponse(f"https://kotsworld.com/register?ref={code}")
