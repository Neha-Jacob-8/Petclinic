from pydantic import BaseModel
from typing import Optional, List


# ---------- OWNER ----------

class OwnerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None


class OwnerResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- PET ----------

class PetCreate(BaseModel):
    name: str
    species: str
    breed: Optional[str] = None
    age: Optional[int] = None


class PetResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    species: str
    breed: Optional[str] = None
    age: Optional[int] = None

    class Config:
        from_attributes = True

from datetime import date, time
from typing import Literal


# ---------- APPOINTMENT ----------

class AppointmentCreate(BaseModel):
    owner_id: int
    pet_id: int
    appointment_date: date
    appointment_time: time
    type: Literal["walk-in", "scheduled"]
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    status: Optional[str] = None  # "scheduled" / "cancelled" / "completed"
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: int
    owner_id: int
    pet_id: int
    appointment_date: date
    appointment_time: time
    type: str
    status: str
    notes: Optional[str] = None
    owner_name: Optional[str] = None
    pet_name: Optional[str] = None

    class Config:
        from_attributes = True
