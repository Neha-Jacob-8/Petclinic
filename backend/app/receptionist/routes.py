from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.core.roles import require_receptionist
from backend.app.core.dependencies import get_db
from backend.app.db.models import Owner, Pet, StaffUser, Appointment
from backend.app.receptionist.schemas import (
    OwnerCreate,
    OwnerResponse,
    PetCreate,
    PetResponse,
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
)
from backend.app.notifications.service import send_notification
from datetime import date

router = APIRouter(
    prefix="/receptionist",
    tags=["Receptionist"]
)

# ---------------- OWNER ----------------

@router.post("/owners", response_model=OwnerResponse)
def create_owner(
    data: OwnerCreate,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_receptionist),
):
    owner = Owner(**data.model_dump())
    db.add(owner)
    db.commit()
    db.refresh(owner)
    return owner


@router.get("/owners", response_model=List[OwnerResponse])
def list_owners(
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_receptionist),
):
    return db.query(Owner).order_by(Owner.id.desc()).all()


@router.get("/owners/search", response_model=List[OwnerResponse])
def search_owner(
    phone: Optional[str] = Query(default=None),
    email: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_receptionist),
):
    query = db.query(Owner)
    if phone:
        query = query.filter(Owner.phone == phone)
    if email:
        query = query.filter(Owner.email == email)
    return query.all()


# ---------------- PET ----------------

@router.post("/owners/{owner_id}/pets", response_model=PetResponse)
def create_pet(
    owner_id: int,
    data: PetCreate,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_receptionist),
):
    owner = db.query(Owner).filter(Owner.id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    pet = Pet(owner_id=owner_id, **data.model_dump())
    db.add(pet)
    db.commit()
    db.refresh(pet)
    return pet


@router.get("/owners/{owner_id}/pets", response_model=List[PetResponse])
def list_pets(
    owner_id: int,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_receptionist),
):
    return db.query(Pet).filter(Pet.owner_id == owner_id).all()

# ---------------- APPOINTMENTS ----------------

@router.post("/appointments", response_model=AppointmentResponse)
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_receptionist),
):
    # validate owner
    owner = db.query(Owner).filter(Owner.id == data.owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    # validate pet
    pet = db.query(Pet).filter(Pet.id == data.pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # ✅ FIXED: Both types start as scheduled
    status = "scheduled"  # Both walk-in and scheduled start as scheduled

    appointment = Appointment(
        owner_id=data.owner_id,
        pet_id=data.pet_id,
        appointment_date=data.appointment_date,
        appointment_time=data.appointment_time,
        type=data.type,
        status=status,
        notes=data.notes,
    )


    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    # Auto-send appointment confirmation notification
    try:
        pet_name = pet.name if pet else "your pet"
        msg = (
            f"Hi {owner.name}! Your appointment for {pet_name} is confirmed "
            f"on {data.appointment_date.strftime('%d-%b-%Y')} at {data.appointment_time.strftime('%I:%M %p')}. "
            f"— VetCore Pet Clinic"
        )
        send_notification(
            db=db,
            owner_id=owner.id,
            message=msg,
            channel="sms",
            appointment_id=appointment.id,
        )
    except Exception:
        pass  # Don't fail appointment creation if notification fails

    return appointment


@router.get("/appointments/today", response_model=list[AppointmentResponse])
def list_today_appointments(
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_receptionist),
):
    today = date.today()
    return (
        db.query(Appointment)
        .filter(Appointment.appointment_date == today)
        .order_by(Appointment.appointment_time)
        .all()
    )


@router.get("/appointments", response_model=list[AppointmentResponse])
def list_appointments_by_date(
    appointment_date: date,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_receptionist),
):
    return (
        db.query(Appointment)
        .filter(Appointment.appointment_date == appointment_date)
        .order_by(Appointment.appointment_time)
        .all()
    )


@router.patch("/appointments/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_receptionist),
):
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    old_status = appointment.status

    if data.appointment_date:
        appointment.appointment_date = data.appointment_date
    if data.appointment_time:
        appointment.appointment_time = data.appointment_time
    if data.status:
        appointment.status = data.status
    if data.notes is not None:
        appointment.notes = data.notes

    db.commit()
    db.refresh(appointment)

    # Auto-send notification on cancellation
    if data.status and data.status == "cancelled" and old_status != "cancelled":
        try:
            owner = db.query(Owner).filter(Owner.id == appointment.owner_id).first()
            pet = db.query(Pet).filter(Pet.id == appointment.pet_id).first()
            if owner:
                pet_name = pet.name if pet else "your pet"
                msg = (
                    f"Hi {owner.name}, your appointment for {pet_name} "
                    f"on {appointment.appointment_date.strftime('%d-%b-%Y')} has been cancelled. "
                    f"Please contact us to reschedule. — VetCore Pet Clinic"
                )
                send_notification(
                    db=db,
                    owner_id=owner.id,
                    message=msg,
                    channel="sms",
                    appointment_id=appointment.id,
                )
        except Exception:
            pass

    return appointment