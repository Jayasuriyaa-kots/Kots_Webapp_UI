from sqlalchemy import Column, String, BigInteger
from database import Base

class Flat(Base):
    """Model for flats table"""
    __tablename__ = "flats"
    
    id = Column(BigInteger, primary_key=True)
    wifi_id = Column(String(200))
    wifi_password = Column(String(200))
    max_occupancy = Column(String(100))
