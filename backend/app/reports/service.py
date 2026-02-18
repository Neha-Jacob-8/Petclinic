from datetime import date, timedelta
from decimal import Decimal
from typing import Optional

from sqlalchemy import func, cast, Date
from sqlalchemy.orm import Session

from backend.app.db.models import (
    Appointment, Invoice, InvoiceItem, Service,
    InventoryItem, StaffUser,
)


def dashboard_summary(db: Session) -> dict:
    today = date.today()

    todays_appointments = (
        db.query(func.count(Appointment.id))
        .filter(Appointment.appointment_date == today)
        .scalar()
    )

    total_revenue_today = (
        db.query(func.coalesce(func.sum(Invoice.final_amount), 0))
        .filter(
            cast(Invoice.created_at, Date) == today,
            Invoice.payment_status == "paid",
        )
        .scalar()
    )

    low_stock_count = (
        db.query(func.count(InventoryItem.id))
        .filter(InventoryItem.quantity <= InventoryItem.reorder_level)
        .scalar()
    )

    active_staff = (
        db.query(func.count(StaffUser.id))
        .filter(StaffUser.is_active == True)
        .scalar()
    )

    return {
        "todays_appointments": todays_appointments,
        "total_revenue_today": float(total_revenue_today),
        "low_stock_count": low_stock_count,
        "active_staff": active_staff,
    }


def revenue_report(db: Session, start: date, end: date) -> dict:
    rows = (
        db.query(
            cast(Invoice.created_at, Date).label("date"),
            func.sum(Invoice.final_amount).label("amount"),
        )
        .filter(
            cast(Invoice.created_at, Date) >= start,
            cast(Invoice.created_at, Date) <= end,
            Invoice.payment_status == "paid",
        )
        .group_by(cast(Invoice.created_at, Date))
        .order_by(cast(Invoice.created_at, Date))
        .all()
    )

    data = [{"date": str(r.date), "amount": float(r.amount)} for r in rows]
    total = sum(d["amount"] for d in data)
    return {"data": data, "total": total}


def services_report(db: Session, start: date, end: date) -> list:
    rows = (
        db.query(
            Service.name.label("service_name"),
            func.sum(InvoiceItem.quantity).label("count"),
            func.sum(InvoiceItem.line_total).label("revenue"),
        )
        .join(InvoiceItem, InvoiceItem.service_id == Service.id)
        .join(Invoice, Invoice.id == InvoiceItem.invoice_id)
        .filter(
            cast(Invoice.created_at, Date) >= start,
            cast(Invoice.created_at, Date) <= end,
        )
        .group_by(Service.name)
        .order_by(func.sum(InvoiceItem.quantity).desc())
        .all()
    )

    return [
        {
            "service_name": r.service_name,
            "count": int(r.count),
            "revenue": float(r.revenue),
        }
        for r in rows
    ]


def appointments_report(db: Session, start: date, end: date) -> dict:
    q = db.query(Appointment).filter(
        Appointment.appointment_date >= start,
        Appointment.appointment_date <= end,
    )

    total = q.count()
    completed = q.filter(Appointment.status == "completed").count()
    cancelled = q.filter(Appointment.status == "cancelled").count()
    walk_in = q.filter(Appointment.type == "walk-in").count()
    scheduled = q.filter(Appointment.type == "scheduled").count()

    return {
        "total": total,
        "completed": completed,
        "cancelled": cancelled,
        "walk_in": walk_in,
        "scheduled": scheduled,
    }


def inventory_report(db: Session) -> dict:
    low_stock = (
        db.query(InventoryItem)
        .filter(InventoryItem.quantity <= InventoryItem.reorder_level)
        .all()
    )

    cutoff = date.today() + timedelta(days=30)
    near_expiry = (
        db.query(InventoryItem)
        .filter(
            InventoryItem.expiry_date.isnot(None),
            InventoryItem.expiry_date <= cutoff,
        )
        .all()
    )

    return {"low_stock": low_stock, "near_expiry": near_expiry}
