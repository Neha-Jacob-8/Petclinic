# Pet Clinic — Complete Todo List

> Private clinic website with 3 entry points: **Admin**, **Doctor**, **Receptionist**
> Last audited: 15-Feb-2026

---

## Quick Status

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | User & Roles | ✅ Complete |
| 2 | Patient Records | ✅ Complete (edge cases below) |
| 3 | Appointments | ✅ Complete (edge cases below) |
| 4 | Services & Billing | ✅ Complete (edge cases below) |
| 5 | Inventory | ✅ Complete |
| 6 | **Notifications** | 🔴 **INCOMPLETE — mocked, no real SMS/WhatsApp** |
| 7 | Reports | ✅ Complete |
| 8 | Website (private clinic portal) | ✅ Complete |

---

# ═══════════════════════════════════════════════════════════════
# SECTION A: INCOMPLETE FEATURES
# ═══════════════════════════════════════════════════════════════

---

# 🔴 A1. NOTIFICATIONS — Replace Mock with Real Twilio SMS/WhatsApp

## Current Problem
- `backend/app/notifications/service.py` always sets `status = "sent"` — **no real message is sent**
- Admin can "send" notifications from `NotificationLogs.tsx` but they are fake
- Receptionist has **no way** to send appointment reminders at all

## Detailed Steps to Complete

### Step 1: Create a Twilio Account
1. Go to https://www.twilio.com/try-twilio
2. Sign up with your email → verify your phone number
3. You get **$15.50 free trial credits** (~1,000 SMS)
4. From the Twilio Console dashboard, note down:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click eye icon to reveal)
5. Go to **Phone Numbers → Manage → Buy a Number**
6. Buy a number with SMS capability (free with trial)
7. Note down the number (e.g., `+1234567890`)

### Step 2: Activate WhatsApp Sandbox
1. In Twilio Console → **Messaging → Try it out → Send a WhatsApp message**
2. You'll see a sandbox number: `+14155238886`
3. From your WhatsApp, send the join code (e.g., `join <word>-<word>`) to that number
4. Once connected, Twilio can send WhatsApp messages to your number
5. Note down the sandbox number

### Step 3: Add Environment Variables
Edit `.env` and add these 4 new lines:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### Step 4: Install Twilio Package
```bash
cd /Users/nehajacob/Desktop/YourFolder/sem6intern/petclinic
pip install twilio
```
Add `twilio` to `requirements.txt`.

### Step 5: Create Twilio Client Helper
**Create new file:** `backend/app/notifications/twilio_client.py`

```python
import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException


def get_twilio_client():
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    if not account_sid or not auth_token:
        raise ValueError("Twilio credentials not set in environment variables")
    return Client(account_sid, auth_token)


def send_sms(to_phone: str, message: str) -> dict:
    client = get_twilio_client()
    from_number = os.getenv("TWILIO_PHONE_NUMBER")
    try:
        msg = client.messages.create(body=message, from_=from_number, to=to_phone)
        return {"sid": msg.sid, "status": "sent"}
    except TwilioRestException as e:
        return {"sid": None, "status": "failed", "error": str(e)}


def send_whatsapp(to_phone: str, message: str) -> dict:
    client = get_twilio_client()
    whatsapp_from = os.getenv("TWILIO_WHATSAPP_NUMBER", "+14155238886")
    try:
        msg = client.messages.create(
            body=message,
            from_=f"whatsapp:{whatsapp_from}",
            to=f"whatsapp:{to_phone}",
        )
        return {"sid": msg.sid, "status": "sent"}
    except TwilioRestException as e:
        return {"sid": None, "status": "failed", "error": str(e)}
```

### Step 6: Update `backend/app/notifications/service.py`
Replace the entire `send_notification` function to use the real Twilio client:

```python
from backend.app.db.models import NotificationLog, Owner
from backend.app.notifications.twilio_client import send_sms, send_whatsapp

def send_notification(db, owner_id, message, channel="sms", appointment_id=None):
    owner = db.query(Owner).filter(Owner.id == owner_id).first()
    if not owner or not owner.phone:
        log = NotificationLog(
            owner_id=owner_id, appointment_id=appointment_id,
            channel=channel, message=message, status="failed",
        )
        db.add(log); db.commit(); db.refresh(log)
        return log

    if channel == "whatsapp":
        result = send_whatsapp(to_phone=owner.phone, message=message)
    elif channel == "sms":
        result = send_sms(to_phone=owner.phone, message=message)
    else:
        result = {"status": "sent"}  # email stays mocked for now

    log = NotificationLog(
        owner_id=owner_id, appointment_id=appointment_id,
        channel=channel, message=message, status=result["status"],
    )
    db.add(log); db.commit(); db.refresh(log)
    return log
```

### Step 7: Add "Send Reminder" Button to Receptionist's Appointment Scheduler
**Edit:** `vetcore-pet-clinic/pages/receptionist/AppointmentScheduler.tsx`

1. Import `MessageSquare` from lucide-react
2. Add a reminder button next to each scheduled appointment in the actions column:
   ```tsx
   <button onClick={() => handleSendReminder(a)} title="Send Reminder">
       <MessageSquare size={16} />
   </button>
   ```
3. Add the handler function:
   ```tsx
   const handleSendReminder = async (appt: Appointment) => {
       try {
           await api.post('/notifications/send', {
               owner_id: appt.owner_id,
               appointment_id: appt.id,
               channel: 'whatsapp',
               message: `Hi! Reminder: your pet's appointment is on ${appt.appointment_date} at ${appt.appointment_time}. — VetCore Pet Clinic`,
           });
           toast.success('Reminder sent!');
       } catch (err: any) {
           toast.error(err.response?.data?.detail || 'Failed to send reminder');
       }
   };
   ```

### Step 8: Test
1. Restart backend: `uvicorn backend.main:app --reload`
2. Login as admin → Notifications → Send a notification with a real phone number → Check your phone
3. Login as receptionist → Appointments → Click "Send Reminder" → Check WhatsApp
4. Verify the notification log shows real "sent" or "failed" status

### Important Notes
- **Trial limitation:** Twilio trial only sends to verified numbers (add them in Console → Verified Caller IDs)
- **Phone format:** Must be `+91XXXXXXXXXX` (with country code) — update existing owner records if needed
- **WhatsApp sandbox:** Only works with numbers that sent the join code first
- **Cost:** SMS ~₹0.50/msg, WhatsApp ~₹0.30/msg. Trial gives $15.50 ≈ ~1000 messages

---

# ═══════════════════════════════════════════════════════════════
# SECTION B: EDGE CASES NOT HANDLED
# ═══════════════════════════════════════════════════════════════

---

# ⚠️ B1. OWNER SEARCH IS BROKEN — Frontend Sends Wrong Query Parameter

## Current Problem
- `OwnerManagement.tsx` line 39 sends: `GET /receptionist/owners/search?q=searchQuery`
- But the backend expects `?phone=` or `?email=` (not `?q=`)
- **Result:** Search always returns no results or all results

## Steps to Fix

### Option A: Fix the frontend to send the correct params
**Edit:** `vetcore-pet-clinic/pages/receptionist/OwnerManagement.tsx`

Change the `handleSearch` function (around line 35-46):
```tsx
const handleSearch = async () => {
    if (!searchQuery.trim()) { fetchOwners(); return; }
    setLoading(true);
    try {
        // Detect if input is a phone number or email
        const isEmail = searchQuery.includes('@');
        const params = isEmail
            ? { email: searchQuery.trim() }
            : { phone: searchQuery.trim() };
        const res = await api.get('/receptionist/owners/search', { params });
        setOwners(res.data);
    } catch (err) {
        toast.error('Search failed');
    } finally {
        setLoading(false);
    }
};
```

### Option B (Better): Add a name search to the backend
**Edit:** `backend/app/receptionist/routes.py` — update the `search_owner` function:
```python
@router.get("/owners/search", response_model=List[OwnerResponse])
def search_owner(
    q: Optional[str] = Query(default=None),
    phone: Optional[str] = Query(default=None),
    email: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_receptionist),
):
    query = db.query(Owner)
    if q:
        query = query.filter(
            (Owner.name.ilike(f"%{q}%")) |
            (Owner.phone.ilike(f"%{q}%")) |
            (Owner.email.ilike(f"%{q}%"))
        )
    if phone:
        query = query.filter(Owner.phone == phone)
    if email:
        query = query.filter(Owner.email == email)
    return query.all()
```
This way the frontend's `?q=` param will work AND you can search by name, phone, or email.

---

# ⚠️ B2. NO OWNER EDIT / UPDATE FUNCTIONALITY

## Current Problem
- Receptionist can create owners and pets, but **cannot edit** them
- If a phone number, email, or address changes, there's no way to update it
- There's no backend endpoint for `PATCH /receptionist/owners/{id}`

## Steps to Fix

### Step 1: Add backend endpoint
**Edit:** `backend/app/receptionist/routes.py` — add after the `list_owners` function:

```python
from backend.app.receptionist.schemas import OwnerUpdate  # new import

@router.patch("/owners/{owner_id}", response_model=OwnerResponse)
def update_owner(
    owner_id: int,
    data: OwnerUpdate,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_receptionist),
):
    owner = db.query(Owner).filter(Owner.id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    if data.name is not None:
        owner.name = data.name
    if data.phone is not None:
        owner.phone = data.phone
    if data.email is not None:
        owner.email = data.email
    if data.address is not None:
        owner.address = data.address
    db.commit()
    db.refresh(owner)
    return owner
```

### Step 2: Add schema
**Edit:** `backend/app/receptionist/schemas.py` — add:
```python
class OwnerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
```

### Step 3: Add edit button on frontend
**Edit:** `vetcore-pet-clinic/pages/receptionist/OwnerManagement.tsx`
- Add an "Edit" button next to each owner
- Show a pre-filled modal with the owner's current details
- On save, call `PATCH /receptionist/owners/{id}` with the updated fields
- Refresh the owners list after successful update

---

# ⚠️ B3. NO PET EDIT FUNCTIONALITY

## Current Problem
- Once a pet is created, you can't change its name, species, breed, or age
- No `PATCH /receptionist/owners/{id}/pets/{pet_id}` endpoint exists

## Steps to Fix

### Step 1: Add backend endpoint
**Edit:** `backend/app/receptionist/routes.py`:
```python
from backend.app.receptionist.schemas import PetUpdate  # new import

@router.patch("/owners/{owner_id}/pets/{pet_id}", response_model=PetResponse)
def update_pet(
    owner_id: int,
    pet_id: int,
    data: PetUpdate,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_receptionist),
):
    pet = db.query(Pet).filter(Pet.id == pet_id, Pet.owner_id == owner_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    if data.name is not None:
        pet.name = data.name
    if data.species is not None:
        pet.species = data.species
    if data.breed is not None:
        pet.breed = data.breed
    if data.age is not None:
        pet.age = data.age
    db.commit()
    db.refresh(pet)
    return pet
```

### Step 2: Add schema
**Edit:** `backend/app/receptionist/schemas.py`:
```python
class PetUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[int] = None
```

### Step 3: Add edit button on frontend
- In the pet cards inside `OwnerManagement.tsx`, add an "Edit" icon
- Show a pre-filled form, save with `PATCH /receptionist/owners/{owner_id}/pets/{pet_id}`

---

# ⚠️ B4. DUPLICATE OWNER BY PHONE NUMBER — No Validation

## Current Problem
- A receptionist can register the same phone number multiple times
- This creates duplicate owner records for the same person
- The backend has no check for duplicate phone numbers

## Steps to Fix

**Edit:** `backend/app/receptionist/routes.py` — update `create_owner`:
```python
@router.post("/owners", response_model=OwnerResponse)
def create_owner(
    data: OwnerCreate,
    db: Session = Depends(get_db),
    current_user: StaffUser = Depends(require_receptionist),
):
    # Check for duplicate phone
    existing = db.query(Owner).filter(Owner.phone == data.phone).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Owner with phone {data.phone} already exists (ID: {existing.id})"
        )
    owner = Owner(**data.model_dump())
    db.add(owner)
    db.commit()
    db.refresh(owner)
    return owner
```

---

# ⚠️ B5. APPOINTMENT FORM USES RAW IDs — Not User-Friendly

## Current Problem
- When creating an appointment, the receptionist must manually type Owner ID and Pet ID
- There's no dropdown to select owners/pets by name
- This is error-prone and the receptionist has to look up IDs manually

## Steps to Fix

**Edit:** `vetcore-pet-clinic/pages/receptionist/AppointmentScheduler.tsx`

1. When the "New Appointment" modal opens, fetch owners: `GET /receptionist/owners`
2. Show an owner dropdown with names (value = owner ID)
3. When an owner is selected, fetch their pets: `GET /receptionist/owners/{id}/pets`
4. Show a pet dropdown with names (value = pet ID)
5. Replace the two `<input type="number">` fields with `<select>` dropdowns:

```tsx
// Add state
const [owners, setOwners] = useState<Owner[]>([]);
const [pets, setPets] = useState<Pet[]>([]);

// Fetch owners when modal opens
useEffect(() => {
    if (showModal) {
        api.get('/receptionist/owners').then(r => setOwners(r.data));
    }
}, [showModal]);

// Fetch pets when owner changes
useEffect(() => {
    if (form.owner_id) {
        api.get(`/receptionist/owners/${form.owner_id}/pets`).then(r => setPets(r.data));
    }
}, [form.owner_id]);
```

Then replace the Owner ID / Pet ID inputs with:
```tsx
<select value={form.owner_id} onChange={e => setForm({...form, owner_id: e.target.value, pet_id: ''})}>
    <option value="">Select Owner</option>
    {owners.map(o => <option key={o.id} value={o.id}>{o.name} ({o.phone})</option>)}
</select>

<select value={form.pet_id} onChange={e => setForm({...form, pet_id: e.target.value})}>
    <option value="">Select Pet</option>
    {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
</select>
```

---

# ⚠️ B6. NO PAST DATE VALIDATION FOR APPOINTMENTS

## Current Problem
- A receptionist can create an appointment for a past date (e.g., last week)
- The backend does not validate that `appointment_date >= today`

## Steps to Fix

### Backend fix
**Edit:** `backend/app/receptionist/routes.py` — in `create_appointment`, add:
```python
from datetime import date

# Add this check before creating the appointment:
if data.appointment_date < date.today():
    raise HTTPException(status_code=400, detail="Cannot schedule an appointment in the past")
```

### Frontend fix
**Edit:** `vetcore-pet-clinic/pages/receptionist/AppointmentScheduler.tsx`
Set `min` on the date input so the user can't pick a past date:
```tsx
<input type="date" min={new Date().toISOString().split('T')[0]} ... />
```

---

# ⚠️ B7. INVOICE DOUBLE-PAY NOT PREVENTED

## Current Problem
- Calling `PATCH /billing/invoices/{id}/pay` on an already-paid invoice pays it again
- No check for `payment_status == "paid"` before marking as paid

## Steps to Fix

**Edit:** `backend/app/billing/service.py` — in `mark_invoice_paid`, add:
```python
def mark_invoice_paid(db, invoice_id, payment_method):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # ADD THIS CHECK:
    if invoice.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Invoice is already paid")

    invoice.payment_status = "paid"
    invoice.payment_method = payment_method
    db.commit()
    db.refresh(invoice)
    return invoice
```

---

# ⚠️ B8. DOCTOR SEES ALL APPOINTMENTS — Not Filtered by Doctor

## Current Problem
- `GET /doctor/appointments/today` returns **ALL** scheduled appointments, not just those assigned to the logged-in doctor
- The `Appointment` model has no `doctor_id` field — there's no way to assign a doctor to an appointment

## Why This Matters
- In a multi-doctor clinic, Doctor A should NOT see Doctor B's patients
- Currently every doctor sees every appointment

## Steps to Fix (Two Options)

### Option A (Simpler — keep as-is)
If the clinic only has 1-2 doctors and they share all appointments, this is fine. Add a comment in the code explaining this is intentional.

### Option B (Proper — add doctor assignment)
This is a bigger change, requires:

1. **Add `doctor_id` to the Appointment model:**
   ```python
   # In backend/app/db/models.py, class Appointment:
   doctor_id = Column(Integer, ForeignKey("staff_users.id"), nullable=True)
   doctor = relationship("StaffUser")
   ```

2. **Update the receptionist appointment form** to include a doctor dropdown
   - Fetch active doctors from `GET /admin/staff` (filtered to role="doctor")
   - Add a `doctor_id` field to `AppointmentCreate` schema

3. **Filter doctor's appointments** in `doctor/routes.py`:
   ```python
   .filter(Appointment.doctor_id == current_user.id)
   ```

4. **Run a DB migration** (or recreate tables) to add the new column

> Choose Option A if this is just a college project. Choose Option B if you want it production-ready.

---

# ⚠️ B9. APPOINTMENT TABLE SHOWS RAW IDs INSTEAD OF NAMES

## Current Problem
- Both the receptionist `AppointmentScheduler.tsx` and doctor `TodayAppointments.tsx` display `Pet #3`, `Owner #1` instead of actual names
- Makes it hard to identify who the appointment is for

## Steps to Fix

### Step 1: Update the AppointmentResponse to include names
**Edit:** `backend/app/receptionist/schemas.py`:
```python
class AppointmentResponse(BaseModel):
    id: int
    owner_id: int
    pet_id: int
    appointment_date: date
    appointment_time: time
    type: str
    status: str
    notes: Optional[str] = None
    owner_name: Optional[str] = None    # NEW
    pet_name: Optional[str] = None      # NEW

    class Config:
        from_attributes = True
```

### Step 2: Return names from the backend
**Edit:** `backend/app/receptionist/routes.py` — in the appointment list/create functions, populate the names:
```python
# After querying appointments, add owner and pet names:
for appt in appointments:
    appt.owner_name = appt.owner.name if appt.owner else None
    appt.pet_name = appt.pet.name if appt.pet else None
```

Or better, use a custom serializer in the route.

### Step 3: Update frontend tables
Replace `{a.pet_id}` and `{a.owner_id}` with `{a.pet_name}` and `{a.owner_name}` in both:
- `AppointmentScheduler.tsx` (receptionist)
- `TodayAppointments.tsx` (doctor)

---

# ⚠️ B10. DUPLICATE INVOICE FOR SAME APPOINTMENT — No Validation

## Current Problem
- A receptionist can create multiple invoices for the same appointment
- The backend has no check for existing invoices on the same appointment

## Steps to Fix

**Edit:** `backend/app/billing/service.py` — in `create_invoice`, add:
```python
def create_invoice(db, appointment_id, owner_id, items, discount_pct=Decimal("0")):
    # ADD THIS CHECK:
    existing = db.query(Invoice).filter(Invoice.appointment_id == appointment_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Invoice already exists for this appointment")

    # ... rest of the function
```

---

# ⚠️ B11. DISCOUNT VALIDATION MISSING

## Current Problem
- No validation that `discount_pct` is between 0 and 100
- A receptionist could enter 150% discount or -10% discount

## Steps to Fix

**Edit:** `backend/app/billing/schemas.py` — add validator to `InvoiceCreate`:
```python
class InvoiceCreate(BaseModel):
    appointment_id: int
    owner_id: int
    items: List[InvoiceItemInput]
    discount_pct: Optional[Decimal] = Decimal("0")

    @field_validator("discount_pct")
    @classmethod
    def validate_discount(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError("Discount must be between 0 and 100")
        return v
```

---

# Summary Checklist

## Incomplete Features
- [ ] **A1.** Notifications — Twilio SMS/WhatsApp integration (Steps 1-8)

## Edge Cases
- [ ] **B1.** Fix owner search — wrong query parameter (`q` vs `phone`/`email`)
- [ ] **B2.** Add owner edit/update endpoint + UI
- [ ] **B3.** Add pet edit endpoint + UI
- [ ] **B4.** Prevent duplicate owners by phone number
- [ ] **B5.** Replace raw ID inputs with owner/pet name dropdowns in appointment form
- [ ] **B6.** Validate no past-date appointments (backend + frontend)
- [ ] **B7.** Prevent double-paying an invoice
- [ ] **B8.** Decide on doctor assignment to appointments (Option A or B)
- [ ] **B9.** Show owner/pet names instead of IDs in appointment tables
- [ ] **B10.** Prevent duplicate invoices for the same appointment
- [ ] **B11.** Validate discount percentage (0-100)
