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
    return q.order_by(InventoryItem.name).all()


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
