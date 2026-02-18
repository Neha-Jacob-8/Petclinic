from fastapi import Depends, HTTPException, status
from backend.app.db.models import StaffUser
from backend.app.core.dependencies import get_current_user


def require_admin(
    current_user: StaffUser = Depends(get_current_user),
) -> StaffUser:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def require_doctor(
    current_user: StaffUser = Depends(get_current_user),
) -> StaffUser:
    if current_user.role not in ("doctor", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor access required",
        )
    return current_user


def require_receptionist(
    current_user: StaffUser = Depends(get_current_user),
) -> StaffUser:
    if current_user.role not in ("receptionist", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Receptionist access required",
        )
    return current_user
