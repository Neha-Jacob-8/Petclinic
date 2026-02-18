from sqlalchemy import (
    Column, Integer, String, Boolean, TIMESTAMP, text,
    ForeignKey, Date, Time, Text, Numeric,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime

from backend.app.db.session import Base


# ──────────────────── STAFF ────────────────────

class StaffUser(Base):
    __tablename__ = "staff_users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    role = Column(String(20), nullable=False)
    password_hash = Column(String, nullable=False)
    username = Column(String(50), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, server_default=text("true"))
    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )


# ──────────────────── OWNERS & PETS ────────────────────

class Owner(Base):
    __tablename__ = "owners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False, index=True)
    email = Column(String, nullable=True, index=True)
    address = Column(String, nullable=True)

    pets = relationship("Pet", back_populates="owner")


class Pet(Base):
    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=False)

    name = Column(String, nullable=False)
    species = Column(String, nullable=False)
    breed = Column(String, nullable=True)
    age = Column(Integer, nullable=True)

    owner = relationship("Owner", back_populates="pets")


# ──────────────────── APPOINTMENTS ────────────────────

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)

    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=False)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)

    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(Time, nullable=False)

    type = Column(String, nullable=False)       # walk-in / scheduled
    status = Column(String, nullable=False)      # scheduled / cancelled / completed

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("Owner")
    pet = relationship("Pet")


# ──────────────────── MEDICAL RECORDS ────────────────────

class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)

    appointment_id = Column(
        Integer,
        ForeignKey("appointments.id"),
        nullable=False,
        unique=True,
    )

    doctor_id = Column(
        Integer,
        ForeignKey("staff_users.id"),
        nullable=False,
    )

    diagnosis = Column(Text, nullable=False)
    symptoms = Column(Text, nullable=True)
    treatment = Column(Text, nullable=True)
    prescription = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    appointment = relationship("Appointment")
    doctor = relationship("StaffUser")


# ──────────────────── SERVICES & BILLING ────────────────────

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    category = Column(String(50))
    price = Column(Numeric(10, 2), nullable=False)
    is_active = Column(Boolean, server_default=text("true"))


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    discount_pct = Column(Numeric(5, 2), server_default=text("0"))
    final_amount = Column(Numeric(10, 2), nullable=False)
    payment_status = Column(String(20), server_default=text("'pending'"))
    payment_method = Column(String(30), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    appointment = relationship("Appointment")
    owner = relationship("Owner")
    items = relationship("InvoiceItem", back_populates="invoice")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    quantity = Column(Integer, server_default=text("1"))
    unit_price = Column(Numeric(10, 2), nullable=False)
    line_total = Column(Numeric(10, 2), nullable=False)

    invoice = relationship("Invoice", back_populates="items")
    service = relationship("Service")


# ──────────────────── INVENTORY ────────────────────

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50))
    quantity = Column(Integer, nullable=False, server_default=text("0"))
    unit = Column(String(30))
    reorder_level = Column(Integer, server_default=text("10"))
    expiry_date = Column(Date, nullable=True)
    cost_price = Column(Numeric(10, 2), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class InventoryLog(Base):
    __tablename__ = "inventory_logs"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    change_qty = Column(Integer, nullable=False)
    reason = Column(String(200))
    performed_by = Column(Integer, ForeignKey("staff_users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    item = relationship("InventoryItem")
    staff = relationship("StaffUser")


# ──────────────────── NOTIFICATIONS ────────────────────

class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    channel = Column(String(20))
    message = Column(Text)
    status = Column(String(20))
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("Owner")
    appointment = relationship("Appointment")

