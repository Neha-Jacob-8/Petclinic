from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


# -------- MEDICAL RECORD --------

class MedicalRecordCreate(BaseModel):
    diagnosis: str
    symptoms: Optional[str] = None
    treatment: Optional[str] = None
    prescription: Optional[str] = None
    notes: Optional[str] = None


class MedicalRecordResponse(BaseModel):
    id: int
    appointment_id: int
    doctor_id: int
    diagnosis: str
    symptoms: Optional[str]
    treatment: Optional[str]
    prescription: Optional[str]
    notes: Optional[str]
    created_at: datetime
    # Enriched fields
    pet_name: Optional[str] = None
    pet_id: Optional[int] = None
    owner_name: Optional[str] = None
    owner_id: Optional[int] = None
    doctor_name: Optional[str] = None
    appointment_date: Optional[date] = None
    species: Optional[str] = None

    class Config:
        from_attributes = True
