from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from urllib.parse import urlparse
import re

from database import get_db
from models.contract_document import ContractDocument
from schemas.contract_document import (
    ContractDocumentsResponse,
    SignRequestItem,
    SignedDocumentItem,
    CirDocumentItem
)
from services.email_service import sync_sign_request_emails
from services.s3_service import S3Service
from services.auth_middleware import get_current_user_phone

router = APIRouter(prefix="/api", tags=["Contract Documents"])


@router.get("/contract-documents", response_model=ContractDocumentsResponse)
def get_contract_documents(
    booking_id: str = Query(..., description="Booking ID to fetch contract documents"),
    db: Session = Depends(get_db),
    current_user_phone: str = Depends(get_current_user_phone)
):
    """
    Fetch contract documents for a booking ID, grouped into 3 sections:
    - Sign Requests (SIGN_REQUEST)
    - Signed Documents (SIGNED)
    - CIR Documents (CIR)
    """
    documents = db.query(ContractDocument).filter(
        ContractDocument.booking_id == booking_id
    ).all()

    sign_requests = []
    signed_documents = []
    cir_documents = []

    def clean_title(title: str, booking_id: str) -> str:
        """Clean up document title for display."""
        if not title:
            return "Document"
        
        # Remove common email prefixes/suffixes
        t = title
        for prefix in ["Fwd:", "Re:", "Document "]:
            if t.startswith(prefix):
                t = t[len(prefix):].strip()
        
        # Remove "has been completed" and everything after
        if "has been completed" in t:
            t = t.split("has been completed")[0].strip()

        # Remove CIR-style suffixes: :: PART A :: <ID> :: Flat No. <flat>
        # Remove ":: Flat No. ..." suffix
        t = re.sub(r'::\s*Flat No\.?\s*\S+', '', t).strip()
        
        # Remove ":: PART A/B/C ::" etc.
        t = re.sub(r'::\s*PART\s+[A-Z]\s*::', '::', t).strip()

        # Remove booking ID from title if present
        if booking_id and booking_id in t:
             t = t.replace(booking_id, "").strip()

        # Remove file extension if present .pdf_ or just .pdf
        if ".pdf" in t:
            t = t.split(".pdf")[0].strip()

        # Clean up remaining :: separators and trailing chars
        t = re.sub(r'::\s*$', '', t).strip()
        t = re.sub(r'^\s*::\s*', '', t).strip()
        t = re.sub(r'\s*::\s*::\s*', ' :: ', t).strip()

        # Remove trailing underscores or special chars
        t = t.strip("_").strip()

        return t if t else "Document"

    for doc in documents:
        # Clean title
        display_title = clean_title(doc.document_title, booking_id)

        if doc.document_category == "SIGN_REQUEST":
            sign_requests.append(SignRequestItem(
                id=doc.id,
                document_title=display_title,
                required_date=doc.required_date,
                sign_url=doc.sign_url
            ))
        elif doc.document_category == "SIGNED":
             if doc.pdf_url: # Only show if file exists
                signed_documents.append(SignedDocumentItem(
                    id=doc.id,
                    document_title=display_title,
                    pdf_url=doc.pdf_url,
                    email_received_at=doc.email_received_at
                ))
        elif doc.document_category == "CIR":
            if doc.pdf_url: # Only show if file exists
                cir_documents.append(CirDocumentItem(
                    id=doc.id,
                    document_title=display_title,
                    pdf_url=doc.pdf_url,
                    email_received_at=doc.email_received_at
                ))

    return ContractDocumentsResponse(
        success=True,
        sign_requests=sign_requests,
        signed_documents=signed_documents,
        cir_documents=cir_documents,
        message=None
    )


@router.get("/contract-documents/{document_id}/access-url")
def get_contract_document_access_url(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Generate a temporary signed URL to view/download a contract document.
    """
    doc = db.query(ContractDocument).filter(ContractDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not doc.pdf_url:
        raise HTTPException(status_code=404, detail="Document file URL not found")

    # Extract S3 Key from URL if needed
    # The DB currently stores full URL: https://BUCKET.s3.REGION.amazonaws.com/KEY
    # We need just the KEY to sign it.
    
    s3_key = doc.pdf_url
    if s3_key.startswith("http"):
         try:
            parsed = urlparse(s3_key)
            # path is "/contracts/..." -> strip leading slash
            s3_key = parsed.path.lstrip('/')
         except Exception:
            # Fallback to using as is if parsing fails, though unlikely for valid URL
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


@router.post("/sync-emails")
def trigger_email_sync(db: Session = Depends(get_db)):
    """
    Trigger email sync: fetches emails from Sent folder,
    extracts booking IDs, and creates SIGN_REQUEST documents.
    Skips duplicates using email_message_id.
    """
    result = sync_sign_request_emails(db)

    if "error" in result:
        return {
            "success": False,
            "message": result["error"],
            "stats": result
        }

    return {
        "success": True,
        "message": f"Sync complete. {result['new']} new documents added, {result['skipped']} skipped.",
        "stats": result
    }
