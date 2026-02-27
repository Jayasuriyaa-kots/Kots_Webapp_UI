from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

class ReferralCode(Base):
    """Model for storing user referral codes (legacy - kept for backward compat)"""
    __tablename__ = "referral_codes"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(String, unique=True, index=True)
    code = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Referral(Base):
    """Model for tracking referrals"""
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True, index=True)
    referrer_booking_id = Column(String, index=True)  # Who sent the invite
    referee_name = Column(String)
    referee_phone = Column(String)
    referee_email = Column(String, nullable=True)
    
    # Status: 'Pending', 'Joined', 'Successful'
    status = Column(String, default='Pending')
    
    # Linked when referee actually books a flat
    booking_id = Column(String, nullable=True)
    
    # Referral code for this specific referral
    referral_code = Column(String, nullable=True, index=True)
    
    clicked_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
