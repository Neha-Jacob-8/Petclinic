import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from backend.app.db.session import get_db
from backend.app.db.models import Service, Owner, Pet, Appointment
from backend.app.website.schemas import (
    ClinicInfoResponse,
    PublicServiceResponse,
    PublicAppointmentRequest,
)

router = APIRouter(prefix="/website", tags=["Website (Public)"])


@router.get("/info", response_model=ClinicInfoResponse)
def clinic_info():
    return {
        "name": os.getenv("CLINIC_NAME", "VetCore Pet Clinic"),
        "address": os.getenv("CLINIC_ADDRESS", "123 Main Street, Cityville"),
        "phone": os.getenv("CLINIC_PHONE", "+91 98765 43210"),
        "hours": os.getenv("CLINIC_HOURS", "Mon-Sat 9 AM – 7 PM"),
        "about": os.getenv(
            "CLINIC_ABOUT",
            "Trusted veterinary care for your beloved pets. "
            "We offer consultations, vaccinations, surgeries, grooming, "
            "and 24/7 emergency services.",
        ),
    }


@router.get("/services", response_model=List[PublicServiceResponse])
def public_services(db: Session = Depends(get_db)):
    return (
        db.query(Service)
        .filter(Service.is_active == True)
        .order_by(Service.name)
        .all()
    )


@router.post("/appointments")
def public_appointment_request(
    data: PublicAppointmentRequest,
    db: Session = Depends(get_db),
):
    # Find or create owner
    owner = db.query(Owner).filter(Owner.phone == data.phone).first()
    if not owner:
        owner = Owner(name=data.owner_name, phone=data.phone)
        db.add(owner)
        db.flush()

    # Find or create pet
    pet = (
        db.query(Pet)
        .filter(Pet.owner_id == owner.id, Pet.name == data.pet_name)
        .first()
    )
    if not pet:
        pet = Pet(owner_id=owner.id, name=data.pet_name, species=data.species)
        db.add(pet)
        db.flush()

    # Create appointment as "scheduled" (receptionist must confirm)
    appointment = Appointment(
        owner_id=owner.id,
        pet_id=pet.id,
        appointment_date=data.preferred_date,
        appointment_time=data.preferred_time,
        type="scheduled",
        status="scheduled",
        notes=data.notes,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return {
        "message": "Appointment request received. We will contact you shortly.",
        "id": appointment.id,
    }
