from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.core.dependencies import get_current_user
from backend.app.core.roles import require_admin
from backend.app.db.models import StaffUser
from backend.app.db.session import get_db
from backend.app.inventory.schemas import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse,
    StockChange,
    InventoryLogResponse,
    ExpiryAlertSummary,
)
from backend.app.inventory.service import (
    create_item,
    get_all_items,
    update_item,
    adjust_stock,
    get_item_logs,
    get_expiring_items,
    get_expiry_alerts,
)

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.post("/items", response_model=InventoryItemResponse)
def add_item(
    data: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_admin),
):
    return create_item(db, **data.model_dump())


@router.get("/items", response_model=List[InventoryItemResponse])
def items_list(
    category: Optional[str] = Query(default=None),
    low_stock: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(get_current_user),
):
    return get_all_items(db, category=category, low_stock=low_stock)


@router.patch("/items/{item_id}", response_model=InventoryItemResponse)
def edit_item(
    item_id: int,
    data: InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_admin),
):
    return update_item(db, item_id, **data.model_dump(exclude_unset=True))


@router.post("/items/{item_id}/stock", response_model=InventoryItemResponse)
def change_stock(
    item_id: int,
    data: StockChange,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(get_current_user),
):
    return adjust_stock(
        db, item_id,
        change_qty=data.change_qty,
        reason=data.reason,
        staff_id=current_user.id,
    )


@router.get("/items/{item_id}/logs", response_model=List[InventoryLogResponse])
def item_logs(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_admin),
):
    return get_item_logs(db, item_id)


@router.get("/expiry-alerts", response_model=ExpiryAlertSummary)
def expiry_alerts(
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(get_current_user),
):
    """Return inventory items grouped by expiry severity.
    Levels: expired / critical (≤7d) / warning (≤30d) / upcoming (≤90d).
    """
    return get_expiry_alerts(db)


@router.get("/expiring", response_model=List[InventoryItemResponse])
def expiring_items(
    days: int = Query(default=30),
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(get_current_user),
):
    return get_expiring_items(db, days=days)


@router.delete("/items/{item_id}")
def remove_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_admin),
):
    from backend.app.db.models import InventoryItem, StockLog
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Item not found")
    # Delete associated stock logs first
    db.query(StockLog).filter(StockLog.item_id == item_id).delete()
    db.delete(item)
    db.commit()
    return {"message": f"Item '{item.name}' deleted successfully"}
