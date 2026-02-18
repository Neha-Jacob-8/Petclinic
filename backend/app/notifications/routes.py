from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.core.dependencies import get_current_user
from backend.app.core.roles import require_admin
from backend.app.db.models import StaffUser
from backend.app.db.session import get_db
from backend.app.notifications.schemas import NotificationSend, NotificationLogResponse
from backend.app.notifications.service import send_notification, get_notification_logs

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("/send", response_model=NotificationLogResponse)
def send(
    data: NotificationSend,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(get_current_user),
):
    return send_notification(
        db,
        owner_id=data.owner_id,
        message=data.message,
        channel=data.channel,
        appointment_id=data.appointment_id,
    )


@router.get("/logs", response_model=List[NotificationLogResponse])
def logs(
    owner_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_admin),
):
    return get_notification_logs(db, owner_id=owner_id)
