from pydantic import BaseModel
from typing import Optional
from datetime import date, time
from decimal import Decimal


class ClinicInfoResponse(BaseModel):
    name: str
    address: str
    phone: str
    hours: str
    about: str


class PublicServiceResponse(BaseModel):
    name: str
    category: Optional[str]
    price: Decimal

    class Config:
        from_attributes = True


class PublicAppointmentRequest(BaseModel):
    owner_name: str
    phone: str
    pet_name: str
    species: str
    preferred_date: date
    preferred_time: time
    notes: Optional[str] = None
