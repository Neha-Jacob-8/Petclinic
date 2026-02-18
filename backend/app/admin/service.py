from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.db.models import StaffUser, Appointment
from backend.app.core.security import hash_password


def create_staff_user(
    db: Session,
    name: str,
    username: str,
    email: str,
    password: str,
    role: str,
):
    # Check if username already exists
    if db.query(StaffUser).filter(StaffUser.username == username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    # Check if email already exists
    if db.query(StaffUser).filter(StaffUser.email == email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists",
        )

    staff = StaffUser(
        name=name,
        username=username,
        email=email,
        role=role,
        password_hash=hash_password(password),
        is_active=True,
    )

    db.add(staff)
    db.commit()
    db.refresh(staff)

    return staff

def get_all_staff(db: Session):
    staff_list = (
        db.query(StaffUser)
        .order_by(StaffUser.id)
        .all()
    )

    return staff_list
def update_staff_status(
    db: Session,
    staff_id: int,
    is_active: bool,
):
    staff = (
        db.query(StaffUser)
        .filter(StaffUser.id == staff_id)
        .first()
    )

    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff user not found",
        )

    # Warn if deactivating a doctor with scheduled appointments
    if not is_active and staff.role == "doctor":
        active_appointments = (
            db.query(Appointment)
            .filter(
                Appointment.status == "scheduled",
                Appointment.appointment_date >= date.today(),
            )
            .count()
        )
        if active_appointments > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot deactivate: doctor has {active_appointments} upcoming appointment(s). Reassign or cancel them first.",
            )

    staff.is_active = is_active
    db.commit()
    db.refresh(staff)

    return staff


def update_staff_profile(
    db: Session,
    staff_id: int,
    name: str = None,
    username: str = None,
    email: str = None,
):
    staff = (
        db.query(StaffUser)
        .filter(StaffUser.id == staff_id)
        .first()
    )

    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff user not found",
        )

    if username is not None and username != staff.username:
        existing = db.query(StaffUser).filter(StaffUser.username == username).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists",
            )
        staff.username = username

    if email is not None and email != staff.email:
        existing = db.query(StaffUser).filter(StaffUser.email == email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )
        staff.email = email

    if name is not None:
        staff.name = name

    db.commit()
    db.refresh(staff)
    return staff


def reset_staff_password(
    db: Session,
    staff_id: int,
    new_password: str,
):
    staff = (
        db.query(StaffUser)
        .filter(StaffUser.id == staff_id)
        .first()
    )

    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff user not found",
        )

    staff.password_hash = hash_password(new_password)
    db.commit()
    db.refresh(staff)
    return staff
