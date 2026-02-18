from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db.models import StaffUser, Owner
from backend.app.notifications.service import send_notification

from backend.app.core.dependencies import get_current_user
from backend.app.core.roles import require_admin, require_receptionist
from backend.app.db.models import StaffUser
from backend.app.db.session import get_db
from backend.app.billing.schemas import (
    ServiceCreate,
    ServiceUpdate,
    ServiceResponse,
    InvoiceCreate,
    InvoiceResponse,
    PaymentUpdate,
)
from backend.app.billing.service import (
    create_service,
    get_all_services,
    update_service,
    create_invoice,
    get_invoice,
    list_invoices,
    mark_invoice_paid,
)

router = APIRouter(prefix="/billing", tags=["Billing"])


# ──────────── SERVICES ────────────

@router.post("/services", response_model=ServiceResponse)
def add_service(
    data: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_admin),
):
    return create_service(db, name=data.name, category=data.category, price=data.price)


@router.get("/services", response_model=List[ServiceResponse])
def services_list(
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(get_current_user),
):
    return get_all_services(db)


@router.patch("/services/{service_id}", response_model=ServiceResponse)
def edit_service(
    service_id: int,
    data: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_admin),
):
    return update_service(db, service_id, name=data.name, category=data.category, price=data.price, is_active=data.is_active)


# ──────────── INVOICES ────────────

@router.post("/invoices", response_model=InvoiceResponse)
def new_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_receptionist),
):
    return create_invoice(
        db,
        appointment_id=data.appointment_id,
        owner_id=data.owner_id,
        items=data.items,
        discount_pct=data.discount_pct,
    )


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
def view_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(get_current_user),
):
    return get_invoice(db, invoice_id)


@router.get("/invoices", response_model=List[InvoiceResponse])
def invoices_list(
    owner_id: Optional[int] = Query(default=None),
    date: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(get_current_user),
):
    return list_invoices(db, owner_id=owner_id, date=date)


@router.patch("/invoices/{invoice_id}/pay", response_model=InvoiceResponse)
def pay_invoice(
    invoice_id: int,
    data: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_receptionist),
):
    invoice = mark_invoice_paid(db, invoice_id, payment_method=data.payment_method)

    # Auto-send payment confirmation notification
    try:
        owner = db.query(Owner).filter(Owner.id == invoice.owner_id).first()
        if owner:
            msg = (
                f"Hi {owner.name}! Payment of ₹{invoice.final_amount:,.2f} received "
                f"via {data.payment_method} for Invoice #{invoice.id}. "
                f"Thank you! — VetCore Pet Clinic"
            )
            send_notification(
                db=db,
                owner_id=owner.id,
                message=msg,
                channel="sms",
                appointment_id=invoice.appointment_id,
            )
    except Exception:
        pass  # Don't fail payment if notification fails

    return invoice
