from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import date

from backend.app.core.roles import require_doctor
from backend.app.core.dependencies import get_db
from backend.app.db.models import Appointment, MedicalRecord, StaffUser, Pet, Owner
from backend.app.doctor.schemas import (
    MedicalRecordCreate,
    MedicalRecordResponse,
)
from backend.app.receptionist.schemas import AppointmentResponse


router = APIRouter(
    prefix="/doctor",
    tags=["Doctor"]
)


def _enrich_appointment(appt: Appointment) -> Appointment:
    """Populate owner_name and pet_name from relationships."""
    appt.owner_name = appt.owner.name if appt.owner else None
    appt.pet_name = appt.pet.name if appt.pet else None
    return appt


def _enrich_record(rec: MedicalRecord) -> MedicalRecord:
    """Populate pet/owner/doctor context on a medical record."""
    appt = rec.appointment
    if appt:
        rec.appointment_date = appt.appointment_date
        rec.pet_id = appt.pet_id
        rec.owner_id = appt.owner_id
        if appt.pet:
            rec.pet_name = appt.pet.name
            rec.species = appt.pet.species
        if appt.owner:
            rec.owner_name = appt.owner.name
    if rec.doctor:
        rec.doctor_name = rec.doctor.name
    return rec


# B8 NOTE: This returns ALL appointments for today, not filtered by doctor_id.
# This is intentional for a single-doctor or small-clinic setup where all
# doctors share the same appointment queue. If multi-doctor filtering is
# needed in the future, add a doctor_id column to the Appointment model
# and filter by current_user.id here.
@router.get("/appointments/today", response_model=List[AppointmentResponse])
def doctor_today_appointments(
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_doctor),
):
    today = date.today()

    appointments = (
        db.query(Appointment)
        .options(joinedload(Appointment.owner), joinedload(Appointment.pet))
        .filter(Appointment.appointment_date == today)
        .order_by(Appointment.appointment_time)
        .all()
    )

    return [_enrich_appointment(a) for a in appointments]
@router.post(
    "/appointments/{appointment_id}/medical-record",
    response_model=MedicalRecordResponse
)
def create_medical_record(
    appointment_id: int,
    data: MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_doctor),
):
    # Fetch appointment
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Prevent duplicate medical record
    existing = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.appointment_id == appointment_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Medical record already exists for this appointment",
        )

    record = MedicalRecord(
        appointment_id=appointment_id,
        doctor_id=current_user.id,
        diagnosis=data.diagnosis,
        symptoms=data.symptoms,
        treatment=data.treatment,
        prescription=data.prescription,
        notes=data.notes,
    )

    # Mark appointment as completed
    appointment.status = "completed"

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


@router.put(
    "/medical-records/{record_id}",
    response_model=MedicalRecordResponse,
)
def update_medical_record(
    record_id: int,
    data: MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_doctor),
):
    """Update a medical record — only the doctor who created it can edit."""
    record = (
        db.query(MedicalRecord)
        .options(
            joinedload(MedicalRecord.appointment).joinedload(Appointment.pet),
            joinedload(MedicalRecord.appointment).joinedload(Appointment.owner),
            joinedload(MedicalRecord.doctor),
        )
        .filter(MedicalRecord.id == record_id)
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")

    if record.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own records")

    record.diagnosis = data.diagnosis
    record.symptoms = data.symptoms
    record.treatment = data.treatment
    record.prescription = data.prescription
    record.notes = data.notes

    db.commit()
    db.refresh(record)

    return _enrich_record(record)


@router.get("/medical-records", response_model=List[MedicalRecordResponse])
def list_my_medical_records(
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_doctor),
):
    """List medical records created by the logged-in doctor."""
    records = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.doctor_id == current_user.id)
        .options(
            joinedload(MedicalRecord.appointment).joinedload(Appointment.pet),
            joinedload(MedicalRecord.appointment).joinedload(Appointment.owner),
            joinedload(MedicalRecord.doctor),
        )
        .order_by(MedicalRecord.created_at.desc())
        .all()
    )
    return [_enrich_record(r) for r in records]


@router.get(
    "/pets/{pet_id}/history",
    response_model=List[MedicalRecordResponse]
)
def view_pet_medical_history(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_doctor),
):
    records = (
        db.query(MedicalRecord)
        .join(Appointment, MedicalRecord.appointment_id == Appointment.id)
        .options(
            joinedload(MedicalRecord.appointment).joinedload(Appointment.pet),
            joinedload(MedicalRecord.appointment).joinedload(Appointment.owner),
            joinedload(MedicalRecord.doctor),
        )
        .filter(Appointment.pet_id == pet_id)
        .order_by(MedicalRecord.created_at.desc())
        .all()
    )

    return [_enrich_record(r) for r in records]

@router.get(
    "/appointments/{appointment_id}",
    response_model=AppointmentResponse
)
def doctor_view_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_doctor),
):
    appointment = (
        db.query(Appointment)
        .options(joinedload(Appointment.owner), joinedload(Appointment.pet))
        .filter(Appointment.id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return _enrich_appointment(appointment)

@router.patch("/appointments/{appointment_id}/complete")
def complete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_doctor),
):
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.status = "completed"
    db.commit()

    return {"message": "Appointment marked as completed"}