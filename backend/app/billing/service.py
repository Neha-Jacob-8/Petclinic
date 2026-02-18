from decimal import Decimal
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.db.models import Service, Invoice, InvoiceItem


# ──────────── SERVICES ────────────

def create_service(db: Session, name: str, category: str, price: Decimal) -> Service:
    existing = db.query(Service).filter(Service.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Service already exists")
    service = Service(name=name, category=category, price=price)
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


def get_all_services(db: Session) -> List[Service]:
    return db.query(Service).order_by(Service.name).all()


def update_service(
    db: Session,
    service_id: int,
    name: Optional[str] = None,
    category: Optional[str] = None,
    price: Optional[Decimal] = None,
    is_active: Optional[bool] = None,
) -> Service:
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if name is not None:
        # Check for duplicate name
        existing = db.query(Service).filter(Service.name == name, Service.id != service_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Another service with this name already exists")
        service.name = name
    if category is not None:
        service.category = category
    if price is not None:
        service.price = price
    if is_active is not None:
        service.is_active = is_active
    db.commit()
    db.refresh(service)
    return service


# ──────────── INVOICES ────────────

def create_invoice(
    db: Session,
    appointment_id: int,
    owner_id: int,
    items: list,
    discount_pct: Decimal = Decimal("0"),
) -> Invoice:
    total = Decimal("0")
    invoice_items = []

    for item_input in items:
        service = db.query(Service).filter(Service.id == item_input.service_id).first()
        if not service:
            raise HTTPException(
                status_code=404,
                detail=f"Service {item_input.service_id} not found",
            )
        line_total = service.price * item_input.quantity
        total += line_total
        invoice_items.append(
            InvoiceItem(
                service_id=service.id,
                quantity=item_input.quantity,
                unit_price=service.price,
                line_total=line_total,
            )
        )

    final = total * (1 - discount_pct / 100)

    invoice = Invoice(
        appointment_id=appointment_id,
        owner_id=owner_id,
        total_amount=total,
        discount_pct=discount_pct,
        final_amount=final,
    )
    db.add(invoice)
    db.flush()  # get invoice.id

    for ii in invoice_items:
        ii.invoice_id = invoice.id
        db.add(ii)

    db.commit()
    db.refresh(invoice)
    return invoice


def get_invoice(db: Session, invoice_id: int) -> Invoice:
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


def list_invoices(
    db: Session,
    owner_id: Optional[int] = None,
    date: Optional[str] = None,
) -> List[Invoice]:
    q = db.query(Invoice)
    if owner_id:
        q = q.filter(Invoice.owner_id == owner_id)
    if date:
        from sqlalchemy import cast, Date
        q = q.filter(cast(Invoice.created_at, Date) == date)
    return q.order_by(Invoice.created_at.desc()).all()


def mark_invoice_paid(db: Session, invoice_id: int, payment_method: str) -> Invoice:
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice.payment_status = "paid"
    invoice.payment_method = payment_method
    db.commit()
    db.refresh(invoice)
    return invoice
