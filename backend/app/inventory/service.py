from typing import List, Optional
from datetime import date, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.db.models import InventoryItem, InventoryLog


def create_item(db: Session, **kwargs) -> InventoryItem:
    item = InventoryItem(**kwargs)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_all_items(
    db: Session,
    category: Optional[str] = None,
    low_stock: bool = False,
) -> List[InventoryItem]:
    q = db.query(InventoryItem)
    if category:
        q = q.filter(InventoryItem.category == category)
    if low_stock:
        q = q.filter(InventoryItem.quantity <= InventoryItem.reorder_level)
    # Sort: nearest expiry first; items with no expiry date go last
    return q.order_by(
        InventoryItem.expiry_date.asc().nulls_last(),
        InventoryItem.name.asc(),
    ).all()


def update_item(db: Session, item_id: int, **kwargs) -> InventoryItem:
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for k, v in kwargs.items():
        if v is not None:
            setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


def adjust_stock(
    db: Session, item_id: int, change_qty: int, reason: str, staff_id: int
) -> InventoryItem:
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.quantity += change_qty
    if item.quantity < 0:
        raise HTTPException(status_code=400, detail="Stock cannot go below zero")

    log = InventoryLog(
        item_id=item_id,
        change_qty=change_qty,
        reason=reason,
        performed_by=staff_id,
    )
    db.add(log)
    db.commit()
    db.refresh(item)
    return item


def get_item_logs(db: Session, item_id: int) -> List[InventoryLog]:
    return (
        db.query(InventoryLog)
        .filter(InventoryLog.item_id == item_id)
        .order_by(InventoryLog.created_at.desc())
        .all()
    )


def get_expiring_items(db: Session, days: int = 30) -> List[InventoryItem]:
    cutoff = date.today() + timedelta(days=days)
    return (
        db.query(InventoryItem)
        .filter(
            InventoryItem.expiry_date.isnot(None),
            InventoryItem.expiry_date <= cutoff,
        )
        .order_by(InventoryItem.expiry_date)
        .all()
    )


def get_expiry_alerts(db: Session) -> dict:
    """Return inventory items grouped by expiry severity.

    Levels:
      expired  — already past expiry_date
      critical — expiring within 7 days
      warning  — expiring within 8–30 days
      upcoming — expiring within 31–90 days
    """
    today = date.today()

    items_with_expiry = (
        db.query(InventoryItem)
        .filter(InventoryItem.expiry_date.isnot(None))
        .order_by(InventoryItem.expiry_date.asc())
        .all()
    )

    expired: list = []
    critical: list = []  # 0–7 days
    warning: list = []   # 8–30 days
    upcoming: list = []  # 31–90 days

    for item in items_with_expiry:
        delta = (item.expiry_date - today).days
        if delta < 0:
            level = "expired"
            expired.append(_alert_dict(item, delta, level))
        elif delta <= 7:
            level = "critical"
            critical.append(_alert_dict(item, delta, level))
        elif delta <= 30:
            level = "warning"
            warning.append(_alert_dict(item, delta, level))
        elif delta <= 90:
            level = "upcoming"
            upcoming.append(_alert_dict(item, delta, level))

    return {
        "expired": expired,
        "critical": critical,
        "warning": warning,
        "upcoming": upcoming,
        "total_alerts": len(expired) + len(critical) + len(warning) + len(upcoming),
    }


def _alert_dict(item: InventoryItem, days_until_expiry: int, alert_level: str) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "category": item.category,
        "quantity": item.quantity,
        "unit": item.unit,
        "expiry_date": item.expiry_date,
        "days_until_expiry": days_until_expiry,
        "alert_level": alert_level,
    }
