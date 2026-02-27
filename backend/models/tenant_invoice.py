from sqlalchemy import Column, String, Integer, Date, DateTime, Text
from database import Base


class TenantInvoice(Base):
    """Model for tenant_invoices table"""
    __tablename__ = "tenant_invoices"

    id = Column(Integer, primary_key=True)
    invoice_date = Column(Date)
    invoice_number = Column(String(50))
    customer_name = Column(String(255))
    total = Column(String(255))
    company_name = Column(String(255))
    work_phone = Column(String(20))
    mobile_phone = Column(String(20))
    booking_id = Column(String(100), index=True)
    last_name = Column(String(255))
    customer_email = Column(String(255))
    due_date = Column(Date)
    balance = Column(String(255))
    balance_fcy = Column(String(255))
    status = Column(String(50))
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    pdf_url = Column(Text)
