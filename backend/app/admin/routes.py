from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.core.dependencies import require_admin
from backend.app.db.models import StaffUser
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.admin.schemas import (
    StaffCreateRequest,
    StaffCreateResponse,
    StaffListResponse, 
    StaffListItem,
    StaffStatusUpdateRequest,
    StaffProfileUpdateRequest,
    StaffPasswordResetRequest,
)
from backend.app.admin.service import (
    create_staff_user,
    get_all_staff,
    update_staff_status,
    update_staff_profile,
    reset_staff_password,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/ping")
def admin_ping(current_admin: StaffUser = Depends(require_admin)):
    return {
        "message": "Admin access granted",
        "id": current_admin.id,
        "name": current_admin.name,
        "role": current_admin.role,
    }

@router.post("/staff", response_model=StaffCreateResponse)
def create_staff(
    payload: StaffCreateRequest,
    db: Session = Depends(get_db),
    current_admin: StaffUser = Depends(require_admin),
):
    staff = create_staff_user(
        db=db,
        name=payload.name,
        username=payload.username,
        email=payload.email,
        password=payload.password,
        role=payload.role,
    )


    return staff


@router.get("/staff", response_model=StaffListResponse)
def list_staff(
    db: Session = Depends(get_db),
    current_admin: StaffUser = Depends(require_admin),
):
    staff = get_all_staff(db)

    return {
        "staff": [
            StaffListItem(
                id=s.id,
                name=s.name,
                username=s.username,
                email=s.email,
                role=s.role,
                is_active=s.is_active,
            )
            for s in staff
        ]
    }
@router.patch("/staff/{staff_id}", response_model=StaffCreateResponse)
def update_staff_status_route(
    staff_id: int,
    payload: StaffStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: StaffUser = Depends(require_admin),
):
    # Block self-deactivation
    if staff_id == current_admin.id and not payload.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot deactivate your own account",
        )

    staff = update_staff_status(
        db=db,
        staff_id=staff_id,
        is_active=payload.is_active,
    )

    return staff


@router.patch("/staff/{staff_id}/profile", response_model=StaffCreateResponse)
def update_staff_profile_route(
    staff_id: int,
    payload: StaffProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: StaffUser = Depends(require_admin),
):
    staff = update_staff_profile(
        db=db,
        staff_id=staff_id,
        name=payload.name,
        username=payload.username,
        email=payload.email,
    )
    return staff


@router.post("/staff/{staff_id}/reset-password")
def reset_staff_password_route(
    staff_id: int,
    payload: StaffPasswordResetRequest,
    db: Session = Depends(get_db),
    current_admin: StaffUser = Depends(require_admin),
):
    reset_staff_password(
        db=db,
        staff_id=staff_id,
        new_password=payload.new_password,
    )
    return {"message": "Password reset successfully"}
