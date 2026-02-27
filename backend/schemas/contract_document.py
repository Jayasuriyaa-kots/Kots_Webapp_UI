from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime


class SignRequestItem(BaseModel):
    """A document sign request from Zoho Sign"""
    id: int
    document_title: str
    required_date: Optional[date] = None
    sign_url: Optional[str] = None
    email_from: Optional[str] = None
    email_to: Optional[str] = None

    class Config:
        from_attributes = True


class SignedDocumentItem(BaseModel):
    """A signed/completed document"""
    id: int
    document_title: str
    pdf_url: Optional[str] = None
    email_received_at: Optional[datetime] = None
    email_from: Optional[str] = None
    email_to: Optional[str] = None

    class Config:
        from_attributes = True


class CirDocumentItem(BaseModel):
    """A CIR document"""
    id: int
    document_title: str
    pdf_url: Optional[str] = None
    email_received_at: Optional[datetime] = None
    email_from: Optional[str] = None
    email_to: Optional[str] = None

    class Config:
        from_attributes = True


class ContractDocumentsResponse(BaseModel):
    """Grouped response with all 3 sections"""
    success: bool
    sign_requests: List[SignRequestItem] = []
    signed_documents: List[SignedDocumentItem] = []
    cir_documents: List[CirDocumentItem] = []
    message: Optional[str] = None
