import re
from pydantic import BaseModel, EmailStr, field_validator
from typing import Literal, List, Optional


class StaffCreateRequest(BaseModel):
    name: str
    username: str
    email: EmailStr
    password: str
    role: Literal["doctor", "receptionist"]

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class StaffCreateResponse(BaseModel):
    id: int
    name: str
    username: str
    role: str
    is_active: bool

class StaffListItem(BaseModel):
    id: int
    name: str
    username: str
    email: Optional[str] = None
    role: str
    is_active: bool


class StaffListResponse(BaseModel):
    staff: List[StaffListItem]

class StaffStatusUpdateRequest(BaseModel):
    is_active: bool


class StaffProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or not v.strip()):
            raise ValueError("Name cannot be empty")
        return v.strip() if v else v

    @field_validator("username")
    @classmethod
    def username_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or not v.strip()):
            raise ValueError("Username cannot be empty")
        return v.strip() if v else v


class StaffPasswordResetRequest(BaseModel):
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class StaffStatusUpdateResponse(BaseModel):
    id: int
    name: str
    username: str
    role: str
    is_active: bool
