"""
Seed script — run once to populate the database with initial data.

Usage:
    python -m backend.seed
"""

import os
import sys

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.db.session import SessionLocal, engine, Base
from backend.app.db.models import StaffUser, Service, InventoryItem
from backend.app.core.security import hash_password


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── Admin User ──
        if not db.query(StaffUser).filter(StaffUser.username == "admin").first():
            admin = StaffUser(
                name="Admin",
                username="admin",
                email="admin@petclinic.com",
                role="admin",
                password_hash=hash_password("admin123"),
            )
            db.add(admin)
            print("✓ Created admin user (admin / admin123)")

        # ── Sample Doctor ──
        if not db.query(StaffUser).filter(StaffUser.username == "drsmith").first():
            doctor = StaffUser(
                name="Dr. Smith",
                username="drsmith",
                email="drsmith@petclinic.com",
                role="doctor",
                password_hash=hash_password("doctor123"),
            )
            db.add(doctor)
            print("✓ Created doctor user (drsmith / doctor123)")

        # ── Sample Receptionist ──
        if not db.query(StaffUser).filter(StaffUser.username == "reception").first():
            receptionist = StaffUser(
                name="Jane Reception",
                username="reception",
                email="reception@petclinic.com",
                role="receptionist",
                password_hash=hash_password("reception123"),
            )
            db.add(receptionist)
            print("✓ Created receptionist user (reception / reception123)")

        # ── Services ──
        services = [
            ("General Consultation", "consultation", 500),
            ("Vaccination", "vaccination", 800),
            ("Grooming", "grooming", 1200),
            ("Surgery - Minor", "surgery", 5000),
            ("Surgery - Major", "surgery", 15000),
            ("Lab Test - Blood Work", "lab", 1500),
            ("Lab Test - X-Ray", "lab", 2000),
            ("Dental Cleaning", "consultation", 2500),
            ("Deworming", "vaccination", 300),
            ("Microchipping", "consultation", 1000),
        ]
        for name, category, price in services:
            if not db.query(Service).filter(Service.name == name).first():
                db.add(Service(name=name, category=category, price=price))
        print("✓ Seeded services")

        # ── Inventory Items ──
        items = [
            ("Amoxicillin 250mg", "medicine", 100, "tablets", 20, None),
            ("Rabies Vaccine", "vaccine", 50, "vials", 10, "2026-12-31"),
            ("Surgical Gloves (Box)", "supply", 30, "boxes", 5, None),
            ("Ivermectin 10ml", "medicine", 40, "bottles", 15, "2026-06-30"),
            ("Antiseptic Solution 500ml", "supply", 25, "bottles", 10, None),
            ("Parvo Vaccine", "vaccine", 35, "vials", 10, "2026-09-30"),
            ("Gauze Rolls", "supply", 60, "rolls", 20, None),
            ("Meloxicam 5mg", "medicine", 80, "tablets", 25, "2027-03-15"),
        ]
        for name, category, qty, unit, reorder, expiry in items:
            if not db.query(InventoryItem).filter(InventoryItem.name == name).first():
                from datetime import date as date_type
                exp_date = date_type.fromisoformat(expiry) if expiry else None
                db.add(InventoryItem(
                    name=name, category=category, quantity=qty,
                    unit=unit, reorder_level=reorder, expiry_date=exp_date,
                ))
        print("✓ Seeded inventory items")

        db.commit()
        print("\n✅ Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
