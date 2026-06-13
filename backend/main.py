"""
LeadStream CRM — FastAPI Backend
Serves both the REST API and the static frontend.
"""
import os
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import sys
import os
import io
import csv

# Ensure backend directory is in path for Vercel serverless environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import models
import schemas
import crud
from database import engine, get_db

# ─── App init ─────────────────────────────────────────────────────────────────

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LeadStream CRM API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static frontend ──────────────────────────────────────────────────────────

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

if os.path.isdir(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.get("/", response_class=FileResponse, include_in_schema=False)
def serve_index():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend not found. Place files in /frontend/"}


# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "LeadStream CRM"}


@app.post("/api/leads/import")
async def import_leads_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import leads from CSV, scanning for duplicates against leads & processed_leads."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
    try:
        contents = await file.read()
        try:
            decoded = contents.decode("utf-8-sig")
        except UnicodeDecodeError:
            decoded = contents.decode("latin-1")
            
        f = io.StringIO(decoded)
        reader = csv.DictReader(f)
        
        # Check mandatory column
        if not reader.fieldnames or "Name" not in reader.fieldnames:
            raise HTTPException(
                status_code=400,
                detail="CSV must contain a 'Name' column (for business name)."
            )
            
        rows = list(reader)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV file: {str(e)}")

    # Helper functions for normalization
    def normalize_name(name: str) -> str:
        return name.strip().lower() if name else ""

    def normalize_phone(phone: str) -> str:
        if not phone:
            return ""
        return "".join(c for c in phone if c.isdigit())

    # Fetch existing active leads (name, phone)
    existing_keys = set()
    leads_db = db.query(models.Lead.business_name, models.Lead.phones).all()
    for row in leads_db:
        n_name = normalize_name(row.business_name)
        n_phone = normalize_phone(row.phones)
        existing_keys.add((n_name, n_phone))

    # Fetch existing processed leads (name, phone)
    processed_db = db.query(models.ProcessedLead.business_name, models.ProcessedLead.phones).all()
    for row in processed_db:
        n_name = normalize_name(row.business_name)
        n_phone = normalize_phone(row.phones)
        existing_keys.add((n_name, n_phone))

    def clean_str(val: str) -> str | None:
        if val is None:
            return None
        s = val.strip()
        return s if s else None

    def to_float(val: str) -> float | None:
        try:
            return float(val.strip()) if val and val.strip() else None
        except ValueError:
            return None

    def to_int(val: str) -> int | None:
        try:
            return int(val.strip()) if val and val.strip() else None
        except ValueError:
            return None

    imported_count = 0
    skipped_count = 0
    new_objects = []

    for row in rows:
        name = clean_str(row.get("Name", ""))
        phones = clean_str(row.get("Phones", ""))
        if not name:
            skipped_count += 1
            continue

        n_name = normalize_name(name)
        n_phone = normalize_phone(phones)

        # Check for duplicates in DB + current batch
        if (n_name, n_phone) in existing_keys:
            skipped_count += 1
            continue

        # Add to existing keys to avoid duplicates within the CSV itself
        existing_keys.add((n_name, n_phone))

        lead = models.Lead(
            business_name=name,
            category=clean_str(row.get("Category")),
            phones=phones,
            website=clean_str(row.get("Website")),
            email=clean_str(row.get("Email")),
            facebook=clean_str(row.get("Facebook")),
            instagram=clean_str(row.get("Instagram")),
            tiktok=clean_str(row.get("TikTok")),
            city=clean_str(row.get("City")),
            address=clean_str(row.get("Address")),
            maps_url=clean_str(row.get("Google Maps URL")),
            rating=to_float(row.get("Rating", "")),
            reviews_count=to_int(row.get("Reviews Count", "")),
        )
        new_objects.append(lead)
        imported_count += 1

    if new_objects:
        # Bulk save
        db.add_all(new_objects)
        db.commit()

    return {
        "success": True,
        "total_found": len(rows),
        "imported": imported_count,
        "duplicates_skipped": skipped_count
    }


# ═══════════════════════════════════════════════════════════════════════════════
# LEADS ENDPOINTS (Tab 1 — To Call)
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/leads/ids", response_model=schemas.LeadIdsResponse)
def get_lead_ids(db: Session = Depends(get_db)):
    """Return all lead IDs in order — used for frontend prev/next navigation."""
    ids = crud.get_lead_ids(db)
    return schemas.LeadIdsResponse(ids=ids, total=len(ids))


@app.get("/api/leads/count", response_model=schemas.CountResponse)
def get_leads_count(db: Session = Depends(get_db)):
    count = crud.get_leads_count(db)
    return schemas.CountResponse(count=count)


@app.get("/api/leads/search")
def search_leads(
    q: str = Query(..., min_length=1, description="Search term"),
    db: Session = Depends(get_db),
):
    """Search leads by name, phone, ID, social links, city."""
    results = crud.search_leads(db, q)
    return {
        "leads": [schemas.LeadResponse.model_validate(r) for r in results],
        "total": len(results),
        "query": q,
    }


@app.get("/api/leads", response_model=schemas.LeadListResponse)
def get_leads(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    leads, total = crud.get_leads(db, skip=skip, limit=limit)
    return schemas.LeadListResponse(
        leads=[schemas.LeadResponse.model_validate(l) for l in leads],
        total=total,
        skip=skip,
        limit=limit,
    )


@app.get("/api/leads/{lead_id}", response_model=schemas.LeadResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = crud.get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return schemas.LeadResponse.model_validate(lead)


@app.delete("/api/leads/{lead_id}", response_model=schemas.MessageResponse)
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    """Permanently delete a lead without saving it to processed."""
    success = crud.delete_lead(db, lead_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lead not found")
    # Find next lead ID for smooth UI transition
    ids = crud.get_lead_ids(db)
    next_id = ids[0] if ids else None
    return schemas.MessageResponse(
        message="Lead permanently deleted",
        lead_id=lead_id,
        next_lead_id=next_id,
    )


@app.post("/api/leads/{lead_id}/process", response_model=schemas.MessageResponse)
def process_lead(
    lead_id: int,
    body: schemas.ProcessLeadRequest,
    db: Session = Depends(get_db),
):
    """Move a lead to processed_leads with status and note, delete from leads."""
    processed = crud.process_lead(
        db,
        lead_id=lead_id,
        call_status=body.call_status or "Other",
        note=body.note or "",
    )
    if not processed:
        raise HTTPException(status_code=404, detail="Lead not found")
    # Return next lead ID for smooth UI transition
    ids = crud.get_lead_ids(db)
    next_id = ids[0] if ids else None
    return schemas.MessageResponse(
        message="Lead processed successfully",
        lead_id=lead_id,
        next_lead_id=next_id,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# PROCESSED LEADS ENDPOINTS (Tab 2 — Reached)
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/processed/count", response_model=schemas.CountResponse)
def get_processed_count(db: Session = Depends(get_db)):
    count = crud.get_processed_count(db)
    return schemas.CountResponse(count=count)


@app.get("/api/processed/search")
def search_processed(
    q: str = Query(..., min_length=1),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    results = crud.search_processed(db, q, status)
    return {
        "leads": [schemas.ProcessedLeadResponse.model_validate(r) for r in results],
        "total": len(results),
        "query": q,
    }


@app.get("/api/processed", response_model=schemas.ProcessedLeadListResponse)
def get_processed(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by call_status"),
    db: Session = Depends(get_db),
):
    leads, total = crud.filter_processed(db, status or "all", skip=skip, limit=limit)
    return schemas.ProcessedLeadListResponse(
        leads=[schemas.ProcessedLeadResponse.model_validate(l) for l in leads],
        total=total,
        skip=skip,
        limit=limit,
    )
