from typing import List, Optional
from sqlalchemy.orm import Session

from backend.app.db.models import NotificationLog


def send_notification(
    db: Session,
    owner_id: int,
    message: str,
    channel: str = "sms",
    appointment_id: Optional[int] = None,
) -> NotificationLog:
    """
    Mock notification sender — logs the message to DB.
    In production, integrate Twilio or another SMS/WhatsApp provider here.
    """
    log = NotificationLog(
        owner_id=owner_id,
        appointment_id=appointment_id,
        channel=channel,
        message=message,
        status="sent",  # mock: always "sent"
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_notification_logs(
    db: Session,
    owner_id: Optional[int] = None,
) -> List[NotificationLog]:
    q = db.query(NotificationLog)
    if owner_id:
        q = q.filter(NotificationLog.owner_id == owner_id)
    return q.order_by(NotificationLog.sent_at.desc()).all()
