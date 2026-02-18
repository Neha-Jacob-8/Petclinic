from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ──────────── SERVICE ────────────

class ServiceCreate(BaseModel):
    name: str
    category: Optional[str] = None
    price: Decimal

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Price must be greater than zero")
        return v


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[Decimal] = None
    is_active: Optional[bool] = None

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("Price must be greater than zero")
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Service name cannot be empty")
        return v.strip() if v else v


class ServiceResponse(BaseModel):
    id: int
    name: str
    category: Optional[str]
    price: Decimal
    is_active: bool

    class Config:
        from_attributes = True


# ──────────── INVOICE ────────────

class InvoiceItemInput(BaseModel):
    service_id: int
    quantity: int = 1


class InvoiceCreate(BaseModel):
    appointment_id: int
    owner_id: int
    items: List[InvoiceItemInput]
    discount_pct: Optional[Decimal] = Decimal("0")


class InvoiceItemResponse(BaseModel):
    id: int
    service_id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    id: int
    appointment_id: int
    owner_id: int
    total_amount: Decimal
    discount_pct: Decimal
    final_amount: Decimal
    payment_status: str
    payment_method: Optional[str]
    created_at: datetime
    items: List[InvoiceItemResponse] = []

    class Config:
        from_attributes = True


class PaymentUpdate(BaseModel):
    payment_method: str  # cash / card / upi
