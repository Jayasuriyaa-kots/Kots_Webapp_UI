from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from urllib.parse import urlparse
import logging

from database import get_db
from models.tenant_invoice import TenantInvoice
from models.booking import FlatBookingOrder
from schemas.tenant_invoice import InvoiceListResponse, InvoiceItem
from services.s3_service import S3Service
from services.auth_middleware import get_current_user_phone

router = APIRouter(prefix="/api", tags=["Invoices"])
logger = logging.getLogger(__name__)


@router.get("/invoices", response_model=InvoiceListResponse)
def get_invoices(
    booking_id: str = Query(..., description="Booking ID to fetch invoices for"),
    db: Session = Depends(get_db),
    current_user_phone: str = Depends(get_current_user_phone)
):
    """
    Fetch all invoices for a booking ID from the tenant_invoices table,
    ordered by due_date descending (most recent first).
    """
    invoices = db.query(TenantInvoice).filter(
        TenantInvoice.booking_id == booking_id
    ).order_by(desc(TenantInvoice.due_date)).all()

    # Fetch dummy_order_code for the booking_id
    booking_order = db.query(FlatBookingOrder).filter(
        FlatBookingOrder.flat_booking_order_code == booking_id
    ).first()
    dummy_order_code = booking_order.dummy_order_code if booking_order else None

    items = []
    for inv in invoices:
        items.append(InvoiceItem(
            id=inv.id,
            booking_id=inv.booking_id,
            invoice_date=inv.invoice_date,
            invoice_number=inv.invoice_number,
            customer_name=inv.customer_name,
            total=inv.total,
            due_date=inv.due_date,
            balance=inv.balance,
            status=inv.status,
            pdf_url=inv.pdf_url,
            dummy_order_code=dummy_order_code,
            created_at=inv.created_at,
            updated_at=inv.updated_at
        ))

    return InvoiceListResponse(
        success=True,
        invoices=items,
        message=None
    )


@router.get("/invoices/pending", response_model=InvoiceListResponse)
def get_pending_invoices(
    booking_id: str = Query(..., description="Booking ID to fetch pending invoices for"),
    db: Session = Depends(get_db),
    current_user_phone: str = Depends(get_current_user_phone)
):
    """
    Fetch invoices with status 'Sent' or 'Overdue' for a booking ID.
    These are the invoices the tenant needs to pay.
    """
    invoices = db.query(TenantInvoice).filter(
        TenantInvoice.booking_id == booking_id,
        TenantInvoice.status.in_(["Sent", "Overdue"])
    ).order_by(desc(TenantInvoice.due_date)).all()

    # Fetch dummy_order_code for the booking_id
    booking_order = db.query(FlatBookingOrder).filter(
        FlatBookingOrder.flat_booking_order_code == booking_id
    ).first()
    dummy_order_code = booking_order.dummy_order_code if booking_order else None

    items = []
    for inv in invoices:
        items.append(InvoiceItem(
            id=inv.id,
            booking_id=inv.booking_id,
            invoice_date=inv.invoice_date,
            invoice_number=inv.invoice_number,
            customer_name=inv.customer_name,
            total=inv.total,
            due_date=inv.due_date,
            balance=inv.balance,
            status=inv.status,
            pdf_url=inv.pdf_url,
            dummy_order_code=dummy_order_code,
            created_at=inv.created_at,
            updated_at=inv.updated_at
        ))

    return InvoiceListResponse(
        success=True,
        invoices=items,
        message=None
    )


@router.get("/invoices/paid", response_model=InvoiceListResponse)
def get_paid_invoices(
    booking_id: str = Query(..., description="Booking ID to fetch paid invoices for"),
    db: Session = Depends(get_db),
    current_user_phone: str = Depends(get_current_user_phone)
):
    """
    Fetch invoices with status 'Paid' for a booking ID.
    These appear in Payment History.
    """
    invoices = db.query(TenantInvoice).filter(
        TenantInvoice.booking_id == booking_id,
        TenantInvoice.status == "Paid"
    ).order_by(desc(TenantInvoice.due_date)).all()

    # Fetch dummy_order_code for the booking_id
    booking_order = db.query(FlatBookingOrder).filter(
        FlatBookingOrder.flat_booking_order_code == booking_id
    ).first()
    dummy_order_code = booking_order.dummy_order_code if booking_order else None

    items = []
    for inv in invoices:
        items.append(InvoiceItem(
            id=inv.id,
            booking_id=inv.booking_id,
            invoice_date=inv.invoice_date,
            invoice_number=inv.invoice_number,
            customer_name=inv.customer_name,
            total=inv.total,
            due_date=inv.due_date,
            balance=inv.balance,
            status=inv.status,
            pdf_url=inv.pdf_url,
            dummy_order_code=dummy_order_code,
            created_at=inv.created_at,
            updated_at=inv.updated_at
        ))

    return InvoiceListResponse(
        success=True,
        invoices=items,
        message=None
    )


@router.get("/invoices/{invoice_id}/access-url")
def get_invoice_access_url(
    invoice_id: int,
    db: Session = Depends(get_db)
):
    """
    Generate a temporary presigned URL for viewing/downloading an invoice PDF.
    """
    invoice = db.query(TenantInvoice).filter(TenantInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if not invoice.pdf_url:
        raise HTTPException(status_code=404, detail="Invoice PDF not available")

    # Extract S3 key from full URL
    s3_key = invoice.pdf_url
    if s3_key.startswith("http"):
        try:
            parsed = urlparse(s3_key)
            s3_key = parsed.path.lstrip('/')
        except Exception:
            pass

    s3_service = S3Service()
    signed_url = s3_service.generate_presigned_url(s3_key)

    if not signed_url:
        raise HTTPException(status_code=500, detail="Failed to generate secure access link")

    return {
        "success": True,
        "url": signed_url,
        "message": "Secure link generated successfully"
    }
