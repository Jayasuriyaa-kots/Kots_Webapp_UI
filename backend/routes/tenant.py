from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models.kyc import KycDetails
from schemas.booking import TenantDetailsResponse
from services.auth_middleware import get_current_user_phone

router = APIRouter(prefix="/api", tags=["Tenant"])


@router.get("/tenant-details", response_model=TenantDetailsResponse)
def get_tenant_details(
    booking_id: str = Query(..., description="Booking ID to fetch tenant details"),
    db: Session = Depends(get_db),
    current_user_phone: str = Depends(get_current_user_phone)
):
    """
    Fetch tenant name from kyc_details table by booking_id.
    """
    kyc = db.query(KycDetails).filter(
        KycDetails.booking_id == booking_id
    ).first()
    
    if not kyc:
        return TenantDetailsResponse(
            success=False,
            bookingId=booking_id,
            tenantName=None,
            message="Tenant details not found"
        )
    
    return TenantDetailsResponse(
        success=True,
        bookingId=booking_id,
        tenantName=kyc.tenant_full_name,
        message=None
    )
