from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationSend(BaseModel):
    owner_id: int
    appointment_id: Optional[int] = None
    channel: str = "sms"  # sms / whatsapp / email
    message: str


class NotificationLogResponse(BaseModel):
    id: int
    owner_id: int
    appointment_id: Optional[int]
    channel: str
    message: str
    status: str
    sent_at: datetime

    class Config:
        from_attributes = True
