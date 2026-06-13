"""
import_leads.py — One-shot script to import travel_and_visa_leads.csv into SQLite.
Run from project root: python import_leads.py
Safe to run multiple times (skips duplicates by business_name + phones).
"""
import csv
import os
import sys
from pathlib import Path

# ─── Path setup ───────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).parent
CSV_PATH = Path(r"C:\Users\elweh\Desktop\New folder\travel_and_visa_leads.csv")
DB_PATH = PROJECT_ROOT / "leads.db"

# Add backend to path so we can import our modules
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from database import engine, SessionLocal
import models

models.Base.metadata.create_all(bind=engine)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def clean(value: str) -> str | None:
    """Return stripped string or None if empty."""
    if value is None:
        return None
    v = value.strip()
    return v if v else None


def to_float(value: str) -> float | None:
    try:
        return float(value.strip()) if value and value.strip() else None
    except ValueError:
        return None


def to_int(value: str) -> int | None:
    try:
        return int(value.strip()) if value and value.strip() else None
    except ValueError:
        return None


# ─── Import ───────────────────────────────────────────────────────────────────

def import_csv():
    if not CSV_PATH.exists():
        print(f"[ERROR] CSV file not found: {CSV_PATH}")
        sys.exit(1)

    db = SessionLocal()
    existing_count = db.query(models.Lead).count()

    should_clear = False
    if existing_count > 0:
        print(f"[INFO] Database already has {existing_count} leads.")
        print("   [1] Clear all existing leads and import fresh")
        print("   [2] Append new leads (skips duplicates)")
        print("   [3] Cancel import")
        answer = input("   Select option [1/2/3]: ").strip()
        if answer == "1":
            should_clear = True
        elif answer == "2":
            should_clear = False
        else:
            print("   Import cancelled.")
            db.close()
            return

    if should_clear:
        db.query(models.Lead).delete()
        db.commit()
        print("   Cleared existing leads.")

    # Try UTF-8 first, fall back to latin-1 for the Algerian address encoding
    encodings = ["utf-8-sig", "utf-8", "latin-1", "cp1252"]
    rows = []
    for enc in encodings:
        try:
            with open(CSV_PATH, newline="", encoding=enc) as f:
                reader = csv.DictReader(f)
                rows = list(reader)
            print(f"   Read CSV with encoding: {enc}")
            break
        except (UnicodeDecodeError, Exception):
            continue

    if not rows:
        print("❌ Could not read CSV file.")
        db.close()
        sys.exit(1)

    print(f"[INFO] Found {len(rows)} rows in CSV.")

    # Load existing lead keys to prevent duplicates when appending
    existing_keys = set()
    if not should_clear:
        print("   Loading existing leads keys to check for duplicates...")
        existing_rows = db.query(models.Lead.business_name, models.Lead.phones).all()
        for r in existing_rows:
            name_norm = (r.business_name or "").strip().lower()
            phone_norm = (r.phones or "").strip().lower()
            existing_keys.add((name_norm, phone_norm))
        print(f"   Loaded {len(existing_keys)} existing keys.")

    inserted = 0
    skipped = 0

    for row in rows:
        name = clean(row.get("Name", ""))
        phones = clean(row.get("Phones", ""))
        if not name:
            skipped += 1
            continue

        # Skip duplicates if appending
        if not should_clear:
            name_norm = name.strip().lower()
            phone_norm = (phones or "").strip().lower()
            if (name_norm, phone_norm) in existing_keys:
                skipped += 1
                continue

        lead = models.Lead(
            business_name=name,
            category=clean(row.get("Category")),
            phones=phones,
            website=clean(row.get("Website")),
            email=clean(row.get("Email")),
            facebook=clean(row.get("Facebook")),
            instagram=clean(row.get("Instagram")),
            tiktok=clean(row.get("TikTok")),
            city=clean(row.get("City")),
            address=clean(row.get("Address")),
            maps_url=clean(row.get("Google Maps URL")),
            rating=to_float(row.get("Rating", "")),
            reviews_count=to_int(row.get("Reviews Count", "")),
        )
        db.add(lead)
        inserted += 1

        if inserted % 100 == 0:
            db.commit()
            print(f"   Saved {inserted} leads...")

    db.commit()
    db.close()

    print(f"\n[SUCCESS] Import complete!")
    print(f"   Inserted : {inserted}")
    print(f"   Skipped  : {skipped}")
    print(f"   DB path  : {DB_PATH}")


if __name__ == "__main__":
    print("=" * 50)
    print("  LeadStream CRM — Lead Importer")
    print("=" * 50)
    import_csv()
