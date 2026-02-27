from sqlalchemy import Column, String
from database import Base


class KycDetails(Base):
    """Model for kyc_details table to get tenant information"""
    __tablename__ = "kyc_details"
    
    booking_id = Column(String, primary_key=True)
    tenant_full_name = Column(String)
    co1_name = Column(String)
    co1_phone = Column(String)
    co2_name = Column(String)
    co2_phone = Column(String)
    co3_name = Column(String)
    co3_phone = Column(String)
    co4_name = Column(String)
    co4_phone = Column(String)
