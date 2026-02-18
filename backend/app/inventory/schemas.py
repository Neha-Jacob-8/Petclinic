from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


# ──────────── INVENTORY ITEM ────────────

class InventoryItemCreate(BaseModel):
    name: str
    category: Optional[str] = None
    quantity: int = 0
    unit: Optional[str] = None
    reorder_level: int = 10
    expiry_date: Optional[date] = None
    cost_price: Optional[Decimal] = None

    @field_validator("quantity")
    @classmethod
    def quantity_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Quantity cannot be negative")
        return v

    @field_validator("cost_price")
    @classmethod
    def cost_price_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("Cost price cannot be negative")
        return v

    @field_validator("expiry_date")
    @classmethod
    def expiry_not_in_past(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v < date.today():
            raise ValueError("Expiry date cannot be in the past")
        return v


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    reorder_level: Optional[int] = None
    expiry_date: Optional[date] = None
    cost_price: Optional[Decimal] = None


class InventoryItemResponse(BaseModel):
    id: int
    name: str
    category: Optional[str]
    quantity: int
    unit: Optional[str]
    reorder_level: int
    expiry_date: Optional[date]
    cost_price: Optional[Decimal]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ──────────── STOCK CHANGE ────────────

class StockChange(BaseModel):
    change_qty: int
    reason: str  # Required — must explain why stock changed

    @field_validator("change_qty")
    @classmethod
    def change_qty_not_zero(cls, v: int) -> int:
        if v == 0:
            raise ValueError("Stock change quantity cannot be zero")
        return v

    @field_validator("reason")
    @classmethod
    def reason_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Reason is required for stock changes")
        return v.strip()


# ──────────── INVENTORY LOG ────────────

class InventoryLogResponse(BaseModel):
    id: int
    item_id: int
    change_qty: int
    reason: Optional[str]
    performed_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
