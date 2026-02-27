from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime


class InvoiceItem(BaseModel):
    """Individual invoice entry"""
    id: int
    booking_id: Optional[str] = None
    invoice_date: Optional[date] = None
    invoice_number: Optional[str] = None
    customer_name: Optional[str] = None
    total: Optional[str] = None
    due_date: Optional[date] = None
    balance: Optional[str] = None
    status: Optional[str] = None
    pdf_url: Optional[str] = None
    dummy_order_code: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InvoiceListResponse(BaseModel):
    """Response wrapper for invoice list"""
    success: bool
    invoices: List[InvoiceItem] = []
    message: Optional[str] = None
