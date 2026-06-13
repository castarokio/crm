from sqlalchemy.orm import Session
from sqlalchemy import or_, func, String, cast
from typing import Optional
import models


# ─── Leads CRUD ───────────────────────────────────────────────────────────────

def get_leads(db: Session, skip: int = 0, limit: int = 20) -> tuple[list, int]:
    total = db.query(func.count(models.Lead.id)).scalar()
    leads = db.query(models.Lead).order_by(models.Lead.id.asc()).offset(skip).limit(limit).all()
    return leads, total


def get_lead_ids(db: Session) -> list[int]:
    """Return all lead IDs in insertion order — used for frontend navigation."""
    rows = db.query(models.Lead.id).order_by(models.Lead.id.asc()).all()
    return [r.id for r in rows]


def get_lead_by_id(db: Session, lead_id: int) -> Optional[models.Lead]:
    return db.query(models.Lead).filter(models.Lead.id == lead_id).first()


def get_leads_count(db: Session) -> int:
    return db.query(func.count(models.Lead.id)).scalar()


def search_leads(db: Session, q: str, limit: int = 50) -> list[models.Lead]:
    """Search leads by name, phone, ID, instagram, facebook, maps, city."""
    q_lower = f"%{q.lower()}%"
    return (
        db.query(models.Lead)
        .filter(
            or_(
                func.lower(models.Lead.business_name).like(q_lower),
                func.lower(models.Lead.phones).like(q_lower),
                func.lower(models.Lead.instagram).like(q_lower),
                func.lower(models.Lead.facebook).like(q_lower),
                func.lower(models.Lead.city).like(q_lower),
                func.lower(models.Lead.category).like(q_lower),
                func.lower(models.Lead.email).like(q_lower),
                # allow searching by numeric ID as string
                cast(models.Lead.id, String).like(q_lower),
            )
        )
        .order_by(models.Lead.id.asc())
        .limit(limit)
        .all()
    )


def delete_lead(db: Session, lead_id: int) -> bool:
    lead = get_lead_by_id(db, lead_id)
    if not lead:
        return False
    db.delete(lead)
    db.commit()
    return True


def process_lead(db: Session, lead_id: int, call_status: str, note: str) -> Optional[models.ProcessedLead]:
    """Move a lead from leads table to processed_leads table."""
    lead = get_lead_by_id(db, lead_id)
    if not lead:
        return None

    processed = models.ProcessedLead(
        original_lead_id=lead.id,
        business_name=lead.business_name,
        category=lead.category,
        phones=lead.phones,
        website=lead.website,
        email=lead.email,
        facebook=lead.facebook,
        instagram=lead.instagram,
        tiktok=lead.tiktok,
        city=lead.city,
        address=lead.address,
        maps_url=lead.maps_url,
        rating=lead.rating,
        reviews_count=lead.reviews_count,
        call_status=call_status,
        note=note,
        original_created_at=lead.created_at,
    )

    db.add(processed)
    db.delete(lead)
    db.commit()
    db.refresh(processed)
    return processed


# ─── Processed Leads CRUD ─────────────────────────────────────────────────────

def get_processed_leads(db: Session, skip: int = 0, limit: int = 20) -> tuple[list, int]:
    total = db.query(func.count(models.ProcessedLead.id)).scalar()
    leads = (
        db.query(models.ProcessedLead)
        .order_by(models.ProcessedLead.processed_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return leads, total


def get_processed_count(db: Session) -> int:
    return db.query(func.count(models.ProcessedLead.id)).scalar()


def search_processed(db: Session, q: str, status: Optional[str] = None, limit: int = 100) -> list:
    q_lower = f"%{q.lower()}%"
    query = db.query(models.ProcessedLead).filter(
        or_(
            func.lower(models.ProcessedLead.business_name).like(q_lower),
            func.lower(models.ProcessedLead.phones).like(q_lower),
            func.lower(models.ProcessedLead.city).like(q_lower),
            func.lower(models.ProcessedLead.note).like(q_lower),
            func.lower(models.ProcessedLead.call_status).like(q_lower),
        )
    )
    if status and status != "all":
        query = query.filter(models.ProcessedLead.call_status == status)
    return query.order_by(models.ProcessedLead.processed_at.desc()).limit(limit).all()


def filter_processed(db: Session, status: str, skip: int = 0, limit: int = 20) -> tuple[list, int]:
    query = db.query(models.ProcessedLead)
    if status and status != "all":
        query = query.filter(models.ProcessedLead.call_status == status)
    total = query.with_entities(func.count(models.ProcessedLead.id)).scalar()
    leads = query.order_by(models.ProcessedLead.processed_at.desc()).offset(skip).limit(limit).all()
    return leads, total
