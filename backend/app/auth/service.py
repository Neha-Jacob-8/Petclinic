from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.db.models import StaffUser
from backend.app.core.security import verify_password, create_access_token


def authenticate_staff(db: Session, username: str, password: str):
    staff = (
        db.query(StaffUser)
        .filter(StaffUser.username == username, StaffUser.is_active == True)
        .first()
    )

    if not staff or not verify_password(password, staff.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token_data = {
        "sub": str(staff.id),
        "role": staff.role,
    }

    access_token = create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": staff.role,
        "name": staff.name,
    }
