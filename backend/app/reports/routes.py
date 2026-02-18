from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date

from backend.app.core.roles import require_admin
from backend.app.db.models import StaffUser
from backend.app.db.session import get_db
from backend.app.reports.service import (
    dashboard_summary,
    revenue_report,
    services_report,
    appointments_report,
    inventory_report,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_admin),
):
    return dashboard_summary(db)


@router.get("/revenue")
def revenue(
    start: date = Query(...),
    end: date = Query(...),
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_admin),
):
    return revenue_report(db, start, end)


@router.get("/services")
def services(
    start: date = Query(...),
    end: date = Query(...),
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_admin),
):
    return services_report(db, start, end)


@router.get("/appointments")
def appointments(
    start: date = Query(...),
    end: date = Query(...),
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_admin),
):
    return appointments_report(db, start, end)


@router.get("/inventory")
def inventory(
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_admin),
):
    return inventory_report(db)
