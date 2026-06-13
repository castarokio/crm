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

    if existing_count > 0:
        print(f"[INFO] Database already has {existing_count} leads.")
        answer = input("   Do you want to clear and re-import? [y/N]: ").strip().lower()
        if answer == "y":
            db.query(models.Lead).delete()
            db.commit()
            print("   Cleared existing leads.")
        else:
            print("   Skipping import. Existing data kept.")
            db.close()
            return

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

    inserted = 0
    skipped = 0

    for row in rows:
        name = clean(row.get("Name", ""))
        if not name:
            skipped += 1
            continue

        lead = models.Lead(
            business_name=name,
            category=clean(row.get("Category")),
            phones=clean(row.get("Phones")),
            website=clean(row.get("Website")),
            email=clean(row.get("Email")),
            facebook=clean(row.get("Facebook")),
            instagram=clean(row.get("Instagram")),
            youtube=clean(row.get("YouTube")),
            twitter=clean(row.get("Twitter")),
            tiktok=clean(row.get("TikTok")),
            city=clean(row.get("City")),
            address=clean(row.get("Address")),
            maps_url=clean(row.get("Google Maps URL")),
            place_id=clean(row.get("Place ID")),
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
