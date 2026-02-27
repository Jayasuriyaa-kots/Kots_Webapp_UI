from sqlalchemy import Column, String, Integer, Date, DateTime
from database import Base


class ContractDocument(Base):
    """Model for contract_documents table"""
    __tablename__ = "contract_documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(String, nullable=False, index=True)
    tenant_email = Column(String)
    document_category = Column(String, nullable=False)  # SIGN_REQUEST, SIGNED, CIR
    document_title = Column(String, nullable=False)
    required_date = Column(Date, nullable=True)          # Only for SIGN_REQUEST
    sign_url = Column(String, nullable=True)             # Only for SIGN_REQUEST
    pdf_url = Column(String, nullable=True)              # Only for SIGNED / CIR
    email_message_id = Column(String, nullable=True, unique=True)
    email_received_at = Column(DateTime, nullable=True)
    email_from = Column(String, nullable=True)           # Sender email
    email_to = Column(String, nullable=True)             # Recipient email
    email_subject = Column(String, nullable=True)        # Full email subject
