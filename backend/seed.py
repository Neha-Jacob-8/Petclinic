"""
Seed script — populates the database with rich demo data.

Usage:
    python -m backend.seed

Safe to re-run: all inserts are guarded by existence checks.
"""

import os
import sys
from datetime import date, time, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.db.session import SessionLocal, engine, Base
from backend.app.db.models import (
    StaffUser, Owner, Pet, Service, InventoryItem, InventoryLog,
    Appointment, MedicalRecord, Invoice, InvoiceItem, NotificationLog,
)
from backend.app.core.security import hash_password

TODAY = date.today()
D = lambda days: TODAY + timedelta(days=days)  # relative date helper


def _get_or_create_staff(db, username, name, email, role, password):
    obj = db.query(StaffUser).filter(StaffUser.username == username).first()
    if not obj:
        obj = StaffUser(name=name, username=username, email=email,
                        role=role, password_hash=hash_password(password))
        db.add(obj)
        db.flush()
        print(f"  + staff: {username} ({role})")
    return obj


def _get_or_create_service(db, name, category, price):
    obj = db.query(Service).filter(Service.name == name).first()
    if not obj:
        obj = Service(name=name, category=category, price=Decimal(str(price)))
        db.add(obj)
        db.flush()
    return obj


def _get_or_create_inventory(db, name, category, qty, unit, reorder, expiry, cost):
    obj = db.query(InventoryItem).filter(InventoryItem.name == name).first()
    if not obj:
        obj = InventoryItem(
            name=name, category=category, quantity=qty, unit=unit,
            reorder_level=reorder,
            expiry_date=date.fromisoformat(expiry) if expiry else None,
            cost_price=Decimal(str(cost)) if cost else None,
        )
        db.add(obj)
        db.flush()
    return obj


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # ── 1. STAFF ──────────────────────────────────────────────────────────
        print("\n[1/8] Staff users…")
        admin      = _get_or_create_staff(db, "admin",     "Dr. Priya Nair (Admin)", "admin@vetcore.in",       "admin",        "admin123")
        dr_anand   = _get_or_create_staff(db, "dranand",   "Dr. Anand Krishnan",     "anand@vetcore.in",       "doctor",       "doctor123")
        dr_meena   = _get_or_create_staff(db, "drmeena",   "Dr. Meena Pillai",       "meena@vetcore.in",       "doctor",       "doctor123")
        rec_riya   = _get_or_create_staff(db, "riya",      "Riya Thomas",            "riya@vetcore.in",        "receptionist", "recep123")
        rec_james  = _get_or_create_staff(db, "james",     "James Mathew",           "james@vetcore.in",       "receptionist", "recep123")
        db.flush()

        # ── 2. SERVICES ───────────────────────────────────────────────────────
        print("[2/8] Services…")
        svc_consult   = _get_or_create_service(db, "General Consultation",    "consultation", 500)
        svc_vaccine   = _get_or_create_service(db, "Vaccination",             "vaccination",  800)
        svc_groom     = _get_or_create_service(db, "Grooming",                "grooming",     1200)
        svc_minor_surg= _get_or_create_service(db, "Surgery - Minor",         "surgery",      5000)
        svc_major_surg= _get_or_create_service(db, "Surgery - Major",         "surgery",      15000)
        svc_blood     = _get_or_create_service(db, "Lab Test - Blood Work",   "lab",          1500)
        svc_xray      = _get_or_create_service(db, "Lab Test - X-Ray",        "lab",          2000)
        svc_dental    = _get_or_create_service(db, "Dental Cleaning",         "consultation", 2500)
        svc_deworm    = _get_or_create_service(db, "Deworming",               "vaccination",  300)
        svc_chip      = _get_or_create_service(db, "Microchipping",           "consultation", 1000)
        svc_neutr     = _get_or_create_service(db, "Neutering / Spaying",     "surgery",      8000)
        svc_flea      = _get_or_create_service(db, "Flea & Tick Treatment",   "vaccination",  600)
        db.flush()
        print("  + 12 services ready")

        # ── 3. INVENTORY ──────────────────────────────────────────────────────
        print("[3/8] Inventory…")
        # (name, category, qty, unit, reorder, expiry, cost_price)
        inv_data = [
            # Already EXPIRED (expiry in the past)
            ("Tetracycline 500mg",     "medicine", 45,  "tablets",  20, str(D(-90)),  8.00),
            ("Canine Parvovirus Vaccine (Old Batch)", "vaccine", 12, "vials", 10, str(D(-30)),  95.00),
            ("Metronidazole 200mg",    "medicine", 30,  "tablets",  15, str(D(-15)),  5.50),

            # CRITICAL — expiring in ≤7 days
            ("Ketamine Injection 10ml","medicine",  8,  "vials",    10, str(D(3)),   220.00),
            ("Dexamethasone 2mg",      "medicine", 18,  "tablets",  15, str(D(5)),    12.00),

            # WARNING — expiring in 8-30 days
            ("Amoxicillin 250mg",      "medicine", 120, "tablets",  20, str(D(12)),   4.50),
            ("Rabies Vaccine (Batch A)","vaccine",  22, "vials",    10, str(D(20)),  110.00),
            ("Ivermectin 1% Solution", "medicine",  35, "bottles",  15, str(D(25)),   55.00),

            # UPCOMING — expiring in 31-90 days
            ("Meloxicam 5mg",          "medicine",  90, "tablets",  25, str(D(45)),   9.00),
            ("Rabies Vaccine (Batch B)","vaccine",  40, "vials",    10, str(D(60)),  110.00),
            ("Parvo Vaccine",          "vaccine",   35, "vials",    10, str(D(75)),  120.00),
            ("Fenbendazole 150mg",     "medicine",  55, "tablets",  20, str(D(88)),   7.00),

            # SAFE — far expiry
            ("Cephalexin 500mg",       "medicine", 200, "tablets",  30, str(D(180)),  6.00),
            ("Prednisolone 5mg",       "medicine", 150, "tablets",  30, str(D(240)), 11.00),
            ("Atropine Sulphate 1mg",  "medicine",  25, "vials",    10, str(D(300)), 85.00),
            ("DHPP Combo Vaccine",     "vaccine",   50, "vials",    15, str(D(365)), 130.00),
            ("Bordetella Vaccine",     "vaccine",   30, "vials",    10, str(D(400)), 95.00),

            # Supplies (no expiry)
            ("Surgical Gloves (Box)",  "supply",    28, "boxes",     5, None,         250.00),
            ("Gauze Rolls",            "supply",    65, "rolls",    20, None,          35.00),
            ("Antiseptic Solution 500ml","supply",  18, "bottles",  10, None,          80.00),
            ("Disposable Syringes 5ml","supply",   200, "pcs",      50, None,           4.00),
            ("Cotton Wool 500g",       "supply",    12, "packs",     5, None,          60.00),

            # LOW STOCK items (qty <= reorder_level)
            ("Morphine Sulphate 10mg", "medicine",   5, "vials",    10, str(D(120)), 350.00),
            ("Insulin NPH 10ml",       "medicine",   8, "vials",    10, str(D(90)),  280.00),
            ("IV Drip Set",            "supply",      4, "pcs",      10, None,         90.00),
        ]
        inv_objs = {}
        for row in inv_data:
            obj = _get_or_create_inventory(db, *row)
            inv_objs[row[0]] = obj
        db.flush()
        print(f"  + {len(inv_data)} inventory items ready")

        # ── 4. OWNERS & PETS ──────────────────────────────────────────────────
        print("[4/8] Owners & Pets…")
        owners_data = [
            ("Arjun Menon",     "9876543210", "arjun.menon@gmail.com",    "12 MG Road, Kochi"),
            ("Divya Suresh",    "9845123456", "divya.s@gmail.com",         "45 Nehru Nagar, Thrissur"),
            ("Rahul Nambiar",   "9745678901", "rahul.n@yahoo.com",         "7 Park Avenue, Kozhikode"),
            ("Sneha Pillai",    "9654321098", "sneha.pillai@gmail.com",    "23 Lake View, Trivandrum"),
            ("Kiran George",    "9812345678", "kiran.g@outlook.com",       "89 Hill Street, Kottayam"),
            ("Meera Varma",     "9901234567", "meera.v@gmail.com",         "4 Rose Garden, Palakkad"),
            ("Thomas Kurian",   "9788654321", "thomas.k@gmail.com",        "67 Church Road, Ernakulam"),
            ("Lakshmi Nair",    "9677543210", "lakshmi.n@gmail.com",       "34 Gandhi Nagar, Kollam"),
            ("Arun Chandran",   "9512345670", "arun.c@gmail.com",          "18 Sunset Drive, Alappuzha"),
            ("Preethi Joseph",  "9423456789", "preethi.j@yahoo.com",       "55 Olive Street, Thrissur"),
        ]
        owner_objs = []
        for name, phone, email, address in owners_data:
            obj = db.query(Owner).filter(Owner.phone == phone).first()
            if not obj:
                obj = Owner(name=name, phone=phone, email=email, address=address)
                db.add(obj)
                db.flush()
                print(f"  + owner: {name}")
            owner_objs.append(obj)
        db.flush()

        pets_data = [
            # (owner_index, name, species, breed, age)
            (0, "Bruno",   "Dog",  "Labrador Retriever", 3),
            (0, "Kitty",   "Cat",  "Persian",            2),
            (1, "Max",     "Dog",  "German Shepherd",    5),
            (2, "Bella",   "Dog",  "Golden Retriever",   4),
            (2, "Whiskers","Cat",  "Siamese",            1),
            (3, "Charlie", "Dog",  "Beagle",             6),
            (4, "Luna",    "Cat",  "Maine Coon",         3),
            (4, "Rocky",   "Dog",  "Rottweiler",         7),
            (5, "Milo",    "Dog",  "Poodle",             2),
            (6, "Coco",    "Dog",  "Dachshund",          4),
            (6, "Nemo",    "Fish", "Goldfish",           1),
            (7, "Daisy",   "Dog",  "Cocker Spaniel",     5),
            (8, "Tiger",   "Cat",  "Bengal",             2),
            (8, "Rex",     "Dog",  "Doberman",           4),
            (9, "Pepper",  "Dog",  "Shih Tzu",           3),
        ]
        pet_objs = []
        for owner_idx, pname, species, breed, age in pets_data:
            owner = owner_objs[owner_idx]
            obj = db.query(Pet).filter(Pet.owner_id == owner.id, Pet.name == pname).first()
            if not obj:
                obj = Pet(owner_id=owner.id, name=pname, species=species, breed=breed, age=age)
                db.add(obj)
                db.flush()
            pet_objs.append((owner, obj))  # (owner, pet) — matches make_appt signature
        db.flush()
        print(f"  + {len(pet_objs)} pets ready")

        # ── 5. APPOINTMENTS ───────────────────────────────────────────────────
        print("[5/8] Appointments…")
        # Helper to avoid duplicate appointments on same date/time/pet
        def make_appt(owner, pet, appt_date, appt_time, atype, status, notes):
            exists = db.query(Appointment).filter(
                Appointment.pet_id == pet.id,
                Appointment.appointment_date == appt_date,
                Appointment.appointment_time == appt_time,
            ).first()
            if not exists:
                a = Appointment(
                    owner_id=owner.id, pet_id=pet.id,
                    appointment_date=appt_date, appointment_time=appt_time,
                    type=atype, status=status, notes=notes,
                )
                db.add(a)
                db.flush()
                return a
            return exists

        # Past completed appointments (for medical records + invoices)
        appt_records = []
        appt_records.append(make_appt(*pet_objs[0], D(-20), time(9,0),  "scheduled", "completed", "Annual checkup"))
        appt_records.append(make_appt(*pet_objs[1], D(-18), time(10,30),"scheduled", "completed", "Sneezing and nasal discharge"))
        appt_records.append(make_appt(*pet_objs[2], D(-15), time(11,0), "walk-in",   "completed", "Limping on left hind leg"))
        appt_records.append(make_appt(*pet_objs[3], D(-14), time(14,0), "scheduled", "completed", "Vaccination due"))
        appt_records.append(make_appt(*pet_objs[4], D(-12), time(9,30), "walk-in",   "completed", "Loss of appetite"))
        appt_records.append(make_appt(*pet_objs[5], D(-10), time(15,0), "scheduled", "completed", "Dental scaling"))
        appt_records.append(make_appt(*pet_objs[6], D(-9),  time(10,0), "walk-in",   "completed", "Eye discharge"))
        appt_records.append(make_appt(*pet_objs[7], D(-7),  time(11,30),"scheduled", "completed", "Post-surgery follow-up"))
        appt_records.append(make_appt(*pet_objs[8], D(-6),  time(9,0),  "walk-in",   "completed", "Skin rash and itching"))
        appt_records.append(make_appt(*pet_objs[9], D(-5),  time(14,30),"scheduled", "completed", "Deworming"))
        appt_records.append(make_appt(*pet_objs[10],D(-4),  time(10,0), "walk-in",   "completed", "Routine checkup"))
        appt_records.append(make_appt(*pet_objs[11],D(-3),  time(11,0), "scheduled", "completed", "Grooming appointment"))
        appt_records.append(make_appt(*pet_objs[12],D(-2),  time(9,30), "walk-in",   "completed", "Not eating, lethargy"))
        appt_records.append(make_appt(*pet_objs[13],D(-1),  time(15,30),"scheduled", "completed", "Flea treatment"))

        # Cancelled appointments
        make_appt(*pet_objs[0], D(-8), time(10,0), "scheduled", "cancelled", "Owner requested cancellation")
        make_appt(*pet_objs[3], D(-6), time(9,0),  "scheduled", "cancelled", "Pet unwell for travel")

        # TODAY's appointments (shows on doctor dashboard)
        today_appts = []
        today_appts.append(make_appt(*pet_objs[0], TODAY, time(9,0),   "scheduled", "scheduled", "Annual vaccine booster"))
        today_appts.append(make_appt(*pet_objs[2], TODAY, time(10,0),  "walk-in",   "scheduled", "Diarrhea since yesterday"))
        today_appts.append(make_appt(*pet_objs[5], TODAY, time(11,0),  "scheduled", "scheduled", "Blood test follow-up"))
        today_appts.append(make_appt(*pet_objs[8], TODAY, time(12,30), "walk-in",   "scheduled", "Injury on paw"))
        today_appts.append(make_appt(*pet_objs[11],TODAY, time(14,0),  "scheduled", "scheduled", "Dental checkup"))
        today_appts.append(make_appt(*pet_objs[14],TODAY, time(15,0),  "walk-in",   "scheduled", "First visit - general checkup"))

        # Upcoming scheduled appointments
        make_appt(*pet_objs[1], D(1),  time(9,30),  "scheduled", "scheduled", "Follow-up respiratory check")
        make_appt(*pet_objs[4], D(1),  time(11,0),  "scheduled", "scheduled", "Vaccination - Parvo booster")
        make_appt(*pet_objs[6], D(2),  time(10,0),  "scheduled", "scheduled", "Neutering procedure")
        make_appt(*pet_objs[7], D(2),  time(14,0),  "scheduled", "scheduled", "Monthly grooming")
        make_appt(*pet_objs[9], D(3),  time(9,0),   "scheduled", "scheduled", "X-Ray - hip dysplasia screening")
        make_appt(*pet_objs[12],D(3),  time(11,30), "scheduled", "scheduled", "Microchipping")
        make_appt(*pet_objs[13],D(5),  time(15,0),  "scheduled", "scheduled", "Post-op follow up")
        make_appt(*pet_objs[3], D(7),  time(10,30), "scheduled", "scheduled", "Annual checkup")
        make_appt(*pet_objs[0], D(10), time(9,0),   "scheduled", "scheduled", "Rabies booster vaccination")
        db.flush()
        print(f"  + appointments seeded (past/today/upcoming/cancelled)")

        # ── 6. MEDICAL RECORDS ────────────────────────────────────────────────
        print("[6/8] Medical records…")
        doctor = dr_anand

        records_data = [
            # (appt_index, diagnosis, symptoms, treatment, prescription, notes)
            (0,  "Healthy — annual checkup",
                 "None; routine visit",
                 "Physical examination; weight check; ear/eye inspection",
                 "Continue heartworm prophylaxis; next visit in 12 months",
                 "All vitals normal. Weight: 28 kg."),
            (1,  "Upper Respiratory Tract Infection",
                 "Sneezing, nasal discharge, mild fever (39.4°C)",
                 "Antibiotic course, steam inhalation, rest",
                 "Amoxicillin 250mg — 1 tablet twice daily for 7 days; Saline nasal drops",
                 "Responded well. Follow-up in 2 weeks if symptoms persist."),
            (2,  "Soft Tissue Injury — Left Hind Leg",
                 "Limping, swelling around ankle, mild yelping on touch",
                 "RICE therapy (Rest, Ice, Compression, Elevation); anti-inflammatory",
                 "Meloxicam 5mg — once daily for 5 days; Restrict activity",
                 "X-Ray ruled out fracture. Bandage applied. Recheck in 7 days."),
            (3,  "Routine Vaccination",
                 "No complaints; due for annual vaccine",
                 "DHPP Combo Vaccine administered; Rabies booster administered",
                 "Next vaccination due in 12 months",
                 "Post-vaccination observation 30 min — no adverse reaction."),
            (4,  "Hepatic Lipidosis (Early Stage)",
                 "Loss of appetite for 3 days, mild jaundice, lethargy",
                 "IV fluid therapy, force feeding, liver support supplements",
                 "Prednisolone 5mg — once daily; Liver tonic syrup 2ml/day for 21 days",
                 "Hospitalisation not required. Owner instructed on syringe feeding."),
            (5,  "Periodontal Disease Grade II",
                 "Bad breath, plaque buildup, mild gum inflammation",
                 "Dental scaling and polishing under sedation",
                 "Chlorhexidine gel — apply on gums daily for 2 weeks",
                 "3 teeth with Stage-2 decay noted. Consider extraction on next visit."),
            (6,  "Conjunctivitis — Bacterial",
                 "Thick yellow eye discharge, redness, squinting",
                 "Eye wash with saline; antibiotic eye drops prescribed",
                 "Tobramycin 0.3% eye drops — 2 drops every 6 hours for 7 days",
                 "Both eyes affected. Improve within 48 hrs usually."),
            (7,  "Post-Surgical Follow-Up — Splenectomy",
                 "Wound healing well; no signs of infection; slight lethargy",
                 "Wound cleaning, suture inspection",
                 "Cephalexin 500mg — twice daily; Vitamin E capsule once daily",
                 "Sutures intact. Remove in 5 days. Activity restriction for 2 more weeks."),
            (8,  "Allergic Dermatitis",
                 "Intense scratching, red patches on abdomen and flanks, hair loss",
                 "Allergen avoidance counselling; medicated shampoo; antihistamine",
                 "Diphenhydramine 25mg — once at night for 10 days; Medicated shampoo twice weekly",
                 "Possible food allergy. Recommend hypoallergenic diet trial."),
            (9,  "Routine Deworming",
                 "No symptoms; routine schedule",
                 "Fenbendazole administered orally",
                 "Fenbendazole 150mg — single dose; repeat in 3 months",
                 "Stool sample clear on microscopy."),
            (10, "Healthy — Routine Checkup",
                 "No complaints; routine visit",
                 "Full physical examination",
                 "No medication required",
                 "Fish appears active. Water quality parameters advised to owner."),
            (11, "Grooming — No Medical Issues",
                 "Overgrown nails, matted fur",
                 "Full grooming: bath, haircut, nail trim, ear cleaning",
                 "N/A",
                 "Skin condition good. No parasites found."),
            (12, "Panleukopenia (Suspected — Mild)",
                 "Not eating for 2 days, lethargy, mild vomiting",
                 "IV fluids, anti-emetics, supportive care; PCR test ordered",
                 "Ondansetron 0.1mg/kg IV; Ringer's lactate drip; Vitamin B complex",
                 "Isolate from other cats. PCR result awaited. Critical observation for 48 hrs."),
            (13, "Flea Infestation — Moderate",
                 "Excessive scratching, visible fleas on coat",
                 "Flea comb, topical spot-on treatment, environmental treatment advised",
                 "Fipronil spot-on — apply between shoulder blades; repeat monthly",
                 "Collar and bedding should also be treated."),
        ]

        for i, (appt_idx, diagnosis, symptoms, treatment, prescription, notes) in enumerate(records_data):
            appt = appt_records[appt_idx]
            if not appt:
                continue
            exists = db.query(MedicalRecord).filter(MedicalRecord.appointment_id == appt.id).first()
            if not exists:
                # Alternate between the two doctors
                doc = dr_anand if i % 2 == 0 else dr_meena
                rec = MedicalRecord(
                    appointment_id=appt.id,
                    doctor_id=doc.id,
                    diagnosis=diagnosis,
                    symptoms=symptoms,
                    treatment=treatment,
                    prescription=prescription,
                    notes=notes,
                )
                db.add(rec)
        db.flush()
        print(f"  + {len(records_data)} medical records seeded")

        # ── 7. INVOICES & PAYMENTS ────────────────────────────────────────────
        print("[7/8] Invoices…")
        # (appt_index, [(service_obj, qty)], discount_pct, payment_method)
        invoice_data = [
            (0,  [(svc_consult, 1)],                            0,  "cash",   "paid"),
            (1,  [(svc_consult, 1), (svc_blood, 1)],            0,  "card",   "paid"),
            (2,  [(svc_consult, 1), (svc_xray, 1)],             5,  "upi",    "paid"),
            (3,  [(svc_vaccine, 2)],                             0,  "cash",   "paid"),
            (4,  [(svc_consult, 1), (svc_blood, 1)],            10, "card",   "paid"),
            (5,  [(svc_dental, 1)],                              0,  "upi",    "paid"),
            (6,  [(svc_consult, 1)],                             0,  "cash",   "paid"),
            (7,  [(svc_consult, 1), (svc_minor_surg, 1)],       0,  "card",   "paid"),
            (8,  [(svc_consult, 1), (svc_flea, 1)],             0,  "cash",   "paid"),
            (9,  [(svc_deworm, 1)],                              0,  "upi",    "paid"),
            (10, [(svc_consult, 1)],                             0,  "cash",   "paid"),
            (11, [(svc_groom, 1)],                               0,  "cash",   "paid"),
            (12, [(svc_consult, 1), (svc_blood, 1)],            0,  "card",   "paid"),
            (13, [(svc_consult, 1), (svc_flea, 1)],             0,  "upi",    "paid"),
        ]

        for appt_idx, line_items, disc, method, pstatus in invoice_data:
            appt = appt_records[appt_idx]
            if not appt:
                continue
            exists = db.query(Invoice).filter(Invoice.appointment_id == appt.id).first()
            if not exists:
                total = sum(float(svc.price) * qty for svc, qty in line_items)
                final = total * (1 - disc / 100)
                inv = Invoice(
                    appointment_id=appt.id,
                    owner_id=appt.owner_id,
                    total_amount=Decimal(str(round(total, 2))),
                    discount_pct=Decimal(str(disc)),
                    final_amount=Decimal(str(round(final, 2))),
                    payment_status=pstatus,
                    payment_method=method,
                )
                db.add(inv)
                db.flush()
                for svc, qty in line_items:
                    line_total = float(svc.price) * qty
                    db.add(InvoiceItem(
                        invoice_id=inv.id,
                        service_id=svc.id,
                        quantity=qty,
                        unit_price=svc.price,
                        line_total=Decimal(str(round(line_total, 2))),
                    ))
                db.flush()
        print(f"  + {len(invoice_data)} invoices seeded")

        # ── 8. NOTIFICATION LOGS ─────────────────────────────────────────────
        print("[8/8] Notification logs…")
        for appt in appt_records:
            if not appt:
                continue
            exists = db.query(NotificationLog).filter(
                NotificationLog.appointment_id == appt.id,
                NotificationLog.owner_id == appt.owner_id,
            ).first()
            if not exists:
                owner = db.query(Owner).filter(Owner.id == appt.owner_id).first()
                pet   = db.query(Pet).filter(Pet.id == appt.pet_id).first()
                if owner and pet:
                    msg = (
                        f"Hi {owner.name}! Your appointment for {pet.name} is confirmed "
                        f"on {appt.appointment_date.strftime('%d-%b-%Y')} at "
                        f"{appt.appointment_time.strftime('%I:%M %p')}. — VetCore Pet Clinic"
                    )
                    db.add(NotificationLog(
                        owner_id=owner.id,
                        appointment_id=appt.id,
                        channel="sms",
                        message=msg,
                        status="sent",
                    ))
        # Payment confirmation notifications for paid invoices
        paid_invoices = db.query(Invoice).filter(Invoice.payment_status == "paid").all()
        for inv in paid_invoices:
            exists = db.query(NotificationLog).filter(
                NotificationLog.appointment_id == inv.appointment_id,
                NotificationLog.message.like("Payment%"),
            ).first()
            if not exists:
                owner = db.query(Owner).filter(Owner.id == inv.owner_id).first()
                if owner:
                    msg = (
                        f"Hi {owner.name}! Payment of ₹{float(inv.final_amount):,.2f} received "
                        f"via {inv.payment_method} for Invoice #{inv.id}. "
                        f"Thank you! — VetCore Pet Clinic"
                    )
                    db.add(NotificationLog(
                        owner_id=owner.id,
                        appointment_id=inv.appointment_id,
                        channel="sms",
                        message=msg,
                        status="sent",
                    ))
        db.flush()
        print("  + notification logs seeded")

        db.commit()
        print("\n✅ Database seeded successfully!")
        print("\n─── Login Credentials ───────────────────────────────")
        print("  Admin:        admin      / admin123")
        print("  Doctor 1:     dranand    / doctor123")
        print("  Doctor 2:     drmeena    / doctor123")
        print("  Receptionist: riya       / recep123")
        print("  Receptionist: james      / recep123")
        print("─────────────────────────────────────────────────────")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seed failed: {e}")
        import traceback; traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
