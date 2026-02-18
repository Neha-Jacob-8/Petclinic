# To Be Done — Pet Clinic

## 1. Notifications — Replace Mock with Real WhatsApp/SMS

### Current State
- Backend notification module exists (`backend/app/notifications/`)
- Frontend admin page exists (`pages/admin/NotificationLogs.tsx`)
- Currently **mocked** — logs to DB but doesn't send actual messages

### What Needs to Be Done

#### 1.1 Choose & Set Up Twilio
- [ ] Create a Twilio account (free trial gives ~$15 credits) → [twilio.com](https://www.twilio.com)
- [ ] Get **Account SID**, **Auth Token**, and a **Twilio phone number**
- [ ] For WhatsApp: activate Twilio Sandbox for WhatsApp (free for testing)
- [ ] Add Twilio credentials to `.env` file

#### 1.2 Backend — Integrate Twilio
- [ ] Install `twilio` Python package
- [ ] Create a Twilio helper module (`backend/app/notifications/twilio_client.py`)
- [ ] Update `backend/app/notifications/service.py` — replace mock with real Twilio SMS/WhatsApp calls
- [ ] Add error handling — set status to `"failed"` if Twilio call fails, `"sent"` on success
- [ ] Support channels: `sms`, `whatsapp`, `email` (email can stay mocked or use Gmail SMTP)

#### 1.3 Receptionist — Send Reminders
- [ ] Add "Send Reminder" button on `AppointmentScheduler.tsx` next to each appointment
- [ ] On click → call `POST /notifications/send` with appointment details + owner phone
- [ ] Auto-generate reminder message: "Hi {owner}, reminder: {pet}'s appointment is tomorrow at {time}"
- [ ] Toast feedback on success/failure

#### 1.4 Admin — Keep Existing Notification Logs
- [ ] Admin already has `NotificationLogs.tsx` — no changes needed
- [ ] Admin can still send custom notifications via the existing form
- [ ] Logs page now shows real sent/failed statuses

### Who Can Send Notifications
| Role | Can Send? | Where |
|------|-----------|-------|
| **Receptionist** | ✅ | Appointment Scheduler — "Send Reminder" button |
| **Admin** | ✅ | Notification Logs — "Send Notification" form |
| **Doctor** | ❌ | Not needed |

### Reminder Types
| Type | When | Example Message |
|------|------|-----------------|
| Appointment Reminder | Day before appointment | "Hi {owner}, reminder: {pet}'s appointment is tomorrow at {time} with Dr. {name}" |
| Vaccination Due | When vaccination is upcoming | "Hi {owner}, {pet}'s vaccination is due soon. Please book an appointment." |
| Payment Reminder | When invoice is pending | "Hi {owner}, you have a pending payment of ₹{amount}" |

### Environment Variables Needed
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### Dependencies to Install
```bash
pip install twilio
```

---

## 2. Other Pending Items
- [ ] _(Add any other pending features here)_
