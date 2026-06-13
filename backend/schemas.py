from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ─── Lead Schemas ────────────────────────────────────────────────────────────

class LeadBase(BaseModel):
    business_name: str
    category: Optional[str] = None
    phones: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    youtube: Optional[str] = None
    twitter: Optional[str] = None
    tiktok: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    maps_url: Optional[str] = None
    place_id: Optional[str] = None
    rating: Optional[float] = None
    reviews_count: Optional[int] = None


class LeadResponse(LeadBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class LeadListResponse(BaseModel):
    leads: list[LeadResponse]
    total: int
    skip: int
    limit: int


class LeadIdsResponse(BaseModel):
    ids: list[int]
    total: int


# ─── Process (Save) Request ───────────────────────────────────────────────────

class ProcessLeadRequest(BaseModel):
    call_status: Optional[str] = None
    note: Optional[str] = None


# ─── Processed Lead Schemas ───────────────────────────────────────────────────

class ProcessedLeadResponse(LeadBase):
    id: int
    original_lead_id: Optional[int] = None
    call_status: Optional[str] = None
    note: Optional[str] = None
    processed_at: Optional[datetime] = None
    original_created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ProcessedLeadListResponse(BaseModel):
    leads: list[ProcessedLeadResponse]
    total: int
    skip: int
    limit: int


# ─── General Responses ────────────────────────────────────────────────────────

class CountResponse(BaseModel):
    count: int


class MessageResponse(BaseModel):
    message: str
    lead_id: Optional[int] = None
    next_lead_id: Optional[int] = None
