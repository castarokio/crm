from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class Lead(Base):
    """Unprocessed leads — the calling queue."""
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    business_name = Column(String, name="agency_name", index=True)
    category = Column(String, name="niche", nullable=True)
    phones = Column(String, name="phone", nullable=True)          # raw string, may contain multiple
    website = Column(String, nullable=True)
    email = Column(String, nullable=True)
    facebook = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    tiktok = Column(String, nullable=True)
    city = Column(String, name="area", nullable=True)
    address = Column(String, nullable=True)
    maps_url = Column(String, name="maps_link", nullable=True)
    rating = Column(Float, name="google_rating", nullable=True)
    reviews_count = Column(Integer, name="review_count", nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class ProcessedLead(Base):
    """Leads that have been contacted and handled."""
    __tablename__ = "processed_leads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    original_lead_id = Column(Integer, index=True)  # original id from leads table
    business_name = Column(String, name="agency_name", index=True)
    category = Column(String, name="niche", nullable=True)
    phones = Column(String, name="phone", nullable=True)
    website = Column(String, nullable=True)
    email = Column(String, nullable=True)
    facebook = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    tiktok = Column(String, nullable=True)
    city = Column(String, name="area", nullable=True)
    address = Column(String, nullable=True)
    maps_url = Column(String, name="maps_link", nullable=True)
    rating = Column(Float, name="google_rating", nullable=True)
    reviews_count = Column(Integer, name="review_count", nullable=True)
    call_status = Column(String, nullable=True)     # selected status
    note = Column(Text, nullable=True)              # manual note
    processed_at = Column(DateTime, server_default=func.now())
    original_created_at = Column(DateTime, nullable=True)

