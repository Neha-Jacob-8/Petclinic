from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from backend.app.db.session import get_db
from backend.app.auth.service import authenticate_staff
from backend.app.auth.schemas import LoginResponse
from backend.app.core.dependencies import get_current_user
from backend.app.db.models import StaffUser

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    return authenticate_staff(
        db=db,
        username=form_data.username,
        password=form_data.password,
    )


@router.get("/me")
def read_me(current_user: StaffUser = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "role": current_user.role,
        "username": current_user.username,
    }
