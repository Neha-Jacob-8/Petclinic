# 🐾 Pet Clinic Management System — Frontend Dashboard Prompt

## Project Overview

Build a **modern, professional, production-grade React dashboard** for a veterinary/pet clinic management system. The frontend must connect to an existing **FastAPI + PostgreSQL** backend. The application serves three user roles — **Admin**, **Doctor**, and **Receptionist** — each with their own dashboard layout and feature set.

The UI must feel **premium and pet-clinic-themed**: warm, friendly colors (teal/emerald primary, soft amber/orange accents, warm neutrals), rounded playful elements, subtle paw-print motifs or veterinary iconography, and smooth micro-animations. Think "modern SaaS dashboard meets cozy vet clinic."

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **React 18+** with **Vite** |
| Routing | **React Router v6** (with protected routes & role-based guards) |
| State Management | **React Context** + `useReducer` for auth; **TanStack Query (React Query)** for server state |
| HTTP Client | **Axios** with interceptors for JWT |
| Styling | **Tailwind CSS v3** + custom design tokens |
| Charts | **Recharts** or **Chart.js** (for admin reports) |
| Icons | **Lucide React** or **React Icons** |
| Notifications/Toasts | **React Hot Toast** or **Sonner** |
| Forms | **React Hook Form** + **Zod** validation |
| Date Handling | **date-fns** |
| Font | **Google Fonts — Inter** or **Outfit** |

---

## Backend API Reference (Base URL: `http://localhost:8000`)

### Authentication

The backend uses **OAuth2 Password Flow** with **JWT Bearer tokens**.

#### `POST /auth/login`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Body**: `username=<string>&password=<string>`
- **Response**:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "role": "admin" | "doctor" | "receptionist",
  "name": "Admin"
}
```

#### `GET /auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "id": 1,
  "name": "Admin",
  "role": "admin",
  "username": "admin"
}
```

### JWT Details
- Token contains: `{ "sub": "<staff_id>", "role": "<role>", "exp": <timestamp> }`
- Default expiry: **60 minutes**
- All protected endpoints require: `Authorization: Bearer <access_token>`

### Role Hierarchy for Access Control
| Role | Can access |
|------|-----------|
| **admin** | Everything (all admin, doctor, and receptionist routes) |
| **doctor** | Doctor routes + admin can also access doctor routes |
| **receptionist** | Receptionist routes + admin can also access receptionist routes |

---

### Admin Routes (require `admin` role)

#### Staff Management
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/admin/staff` | Create staff user | `{ name, username, email, password, role: "doctor" \| "receptionist" }` | `{ id, name, username, role, is_active }` |
| `GET` | `/admin/staff` | List all staff | — | `{ staff: [{ id, name, username, role, is_active }] }` |
| `PATCH` | `/admin/staff/{staff_id}` | Activate/deactivate staff | `{ is_active: bool }` | `{ id, name, username, role, is_active }` |

#### Services Management
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/billing/services` | Create service | `{ name, category?, price }` | `{ id, name, category, price, is_active }` |
| `GET` | `/billing/services` | List all services | — | `[{ id, name, category, price, is_active }]` |
| `PATCH` | `/billing/services/{id}` | Update service price/status | `{ price?, is_active? }` | `{ id, name, category, price, is_active }` |

#### Inventory Management
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/inventory/items` | Add inventory item | `{ name, category?, quantity, unit?, reorder_level, expiry_date?, cost_price? }` | Full item object |
| `GET` | `/inventory/items` | List items | Query: `?category=medicine&low_stock=true` | `[{ id, name, category, quantity, unit, reorder_level, expiry_date, cost_price, updated_at }]` |
| `PATCH` | `/inventory/items/{id}` | Update item | Partial update fields | Full item object |
| `POST` | `/inventory/items/{id}/stock` | Adjust stock | `{ change_qty: int, reason?: string }` | Full item object |
| `GET` | `/inventory/items/{id}/logs` | Stock change history | — | `[{ id, item_id, change_qty, reason, performed_by, created_at }]` |
| `GET` | `/inventory/expiring` | Expiring items | Query: `?days=30` | `[InventoryItem]` |

#### Reports & Analytics
| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|-------------|----------|
| `GET` | `/reports/dashboard` | Dashboard summary | — | `{ todays_appointments, total_revenue_today, low_stock_count, active_staff }` |
| `GET` | `/reports/revenue` | Revenue report | `?start=YYYY-MM-DD&end=YYYY-MM-DD` | `{ data: [{ date, amount }], total }` |
| `GET` | `/reports/services` | Services usage | `?start=YYYY-MM-DD&end=YYYY-MM-DD` | `[{ service_name, count, revenue }]` |
| `GET` | `/reports/appointments` | Appointment stats | `?start=YYYY-MM-DD&end=YYYY-MM-DD` | `{ total, completed, cancelled, walk_in, scheduled }` |
| `GET` | `/reports/inventory` | Inventory report | — | `{ low_stock: [InventoryItem], near_expiry: [InventoryItem] }` |

#### Notifications
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/notifications/send` | Send notification | `{ owner_id, appointment_id?, channel: "sms"\|"whatsapp"\|"email", message }` | `{ id, owner_id, appointment_id, channel, message, status, sent_at }` |
| `GET` | `/notifications/logs` | Notification history | Query: `?owner_id=1` | `[NotificationLogResponse]` |

---

### Receptionist Routes (require `receptionist` or `admin` role)

#### Owner Management
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/receptionist/owners` | Register owner | `{ name, phone, email?, address? }` | `{ id, name, phone, email, address }` |
| `GET` | `/receptionist/owners` | List all owners | — | `[OwnerResponse]` |
| `GET` | `/receptionist/owners/search` | Search owners | Query: `?phone=...&email=...` | `[OwnerResponse]` |

#### Pet Management
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/receptionist/owners/{owner_id}/pets` | Add pet to owner | `{ name, species, breed?, age? }` | `{ id, owner_id, name, species, breed, age }` |
| `GET` | `/receptionist/owners/{owner_id}/pets` | List owner's pets | — | `[PetResponse]` |

#### Appointment Management
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/receptionist/appointments` | Create appointment | `{ owner_id, pet_id, appointment_date: "YYYY-MM-DD", appointment_time: "HH:MM:SS", type: "walk-in"\|"scheduled", notes? }` | `{ id, owner_id, pet_id, appointment_date, appointment_time, type, status, notes }` |
| `GET` | `/receptionist/appointments/today` | Today's appointments | — | `[AppointmentResponse]` |
| `GET` | `/receptionist/appointments` | Appointments by date | Query: `?appointment_date=YYYY-MM-DD` | `[AppointmentResponse]` |
| `PATCH` | `/receptionist/appointments/{id}` | Update appointment | `{ appointment_date?, appointment_time?, status?: "scheduled"\|"cancelled"\|"completed", notes? }` | `AppointmentResponse` |

#### Billing — Invoices
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `POST` | `/billing/invoices` | Create invoice | `{ appointment_id, owner_id, items: [{ service_id, quantity }], discount_pct? }` | Full invoice with items |
| `GET` | `/billing/invoices/{id}` | View invoice | — | `{ id, appointment_id, owner_id, total_amount, discount_pct, final_amount, payment_status, payment_method, created_at, items: [...] }` |
| `GET` | `/billing/invoices` | List invoices | Query: `?owner_id=1&date=YYYY-MM-DD` | `[InvoiceResponse]` |
| `PATCH` | `/billing/invoices/{id}/pay` | Mark invoice paid | `{ payment_method: "cash"\|"card"\|"upi" }` | Updated invoice |

---

### Doctor Routes (require `doctor` or `admin` role)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| `GET` | `/doctor/appointments/today` | Today's appointments | — | `[AppointmentResponse]` |
| `GET` | `/doctor/appointments/{id}` | View single appointment | — | `AppointmentResponse` |
| `PATCH` | `/doctor/appointments/{id}/complete` | Mark as completed | — | `{ message: "Appointment marked as completed" }` |
| `POST` | `/doctor/appointments/{id}/medical-record` | Add medical record | `{ diagnosis, symptoms?, treatment?, prescription?, notes? }` | `{ id, appointment_id, doctor_id, diagnosis, symptoms, treatment, prescription, notes, created_at }` |
| `GET` | `/doctor/pets/{pet_id}/history` | Pet medical history | — | `[MedicalRecordResponse]` |

---

### Public Website Routes (no auth required)

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/website/info` | Clinic info | `{ name, address, phone, hours, about }` |
| `GET` | `/website/services` | Public services | `[{ name, category, price }]` |
| `POST` | `/website/appointments` | Public appointment request | `{ owner_name, phone, pet_name, species, preferred_date, preferred_time, notes? }` → `{ message, id }` |

---

## Database Models (for reference)

```
StaffUser:      id, name, email, role, password_hash, username, is_active, created_at
Owner:          id, name, phone, email, address → has many Pets
Pet:            id, owner_id, name, species, breed, age
Appointment:    id, owner_id, pet_id, appointment_date, appointment_time, type, status, notes, created_at
MedicalRecord:  id, appointment_id, doctor_id, diagnosis, symptoms, treatment, prescription, notes, created_at
Service:        id, name, category, price, is_active
Invoice:        id, appointment_id, owner_id, total_amount, discount_pct, final_amount, payment_status, payment_method, created_at → has many InvoiceItems
InvoiceItem:    id, invoice_id, service_id, quantity, unit_price, line_total
InventoryItem:  id, name, category, quantity, unit, reorder_level, expiry_date, cost_price, updated_at
InventoryLog:   id, item_id, change_qty, reason, performed_by, created_at
NotificationLog: id, owner_id, appointment_id, channel, message, status, sent_at
```

---

## Seed Data (default credentials for testing)

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Doctor | `drsmith` | `doctor123` |
| Receptionist | `reception` | `reception123` |

---

## Application Architecture

### Folder Structure

```
frontend/
├── public/
├── src/
│   ├── api/
│   │   └── axios.ts              # Axios instance with interceptors
│   ├── assets/                   # Images, svgs, logos
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx       # Role-aware sidebar navigation
│   │   │   ├── Topbar.tsx        # User info, notifications bell, logout
│   │   │   └── DashboardLayout.tsx
│   │   ├── ui/                   # Reusable components (Button, Card, Modal, Table, Badge, etc.)
│   │   └── shared/               # Shared components (SearchBar, DatePicker, StatCard, etc.)
│   ├── context/
│   │   └── AuthContext.tsx       # Auth state, login/logout, token management
│   ├── hooks/                    # Custom hooks (useAuth, useApi, etc.)
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── StaffManagement.tsx
│   │   │   ├── ServicesManagement.tsx
│   │   │   ├── InventoryManagement.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── NotificationLogs.tsx
│   │   ├── doctor/
│   │   │   ├── DoctorDashboard.tsx
│   │   │   ├── TodayAppointments.tsx
│   │   │   ├── MedicalRecordForm.tsx
│   │   │   └── PetHistory.tsx
│   │   └── receptionist/
│   │       ├── ReceptionistDashboard.tsx
│   │       ├── OwnerManagement.tsx
│   │       ├── PetRegistration.tsx
│   │       ├── AppointmentScheduler.tsx
│   │       ├── BillingInvoice.tsx
│   │       └── PaymentProcessing.tsx
│   ├── routes/
│   │   ├── AppRoutes.tsx         # Route definitions
│   │   └── ProtectedRoute.tsx    # Auth + role guard wrapper
│   ├── types/                    # TypeScript interfaces matching backend schemas
│   ├── utils/                    # Formatters, constants
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                 # Tailwind + custom design tokens
├── .env
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Page-by-Page Specifications

### 1. Login Page

**Route**: `/login`

**Design**:
- Full-screen split layout: left side has a beautiful hero illustration (veterinary/pet themed with warm gradients), right side has the login form
- Clinic logo and name at the top: "🐾 VetCore Pet Clinic"
- Form fields: Username, Password (with show/hide toggle)
- Login button with loading spinner state
- Error displayed as a subtle toast or inline alert
- Subtle animated background (floating paw prints or gradient animation)

**Behavior**:
- Submit as `application/x-www-form-urlencoded` to `POST /auth/login`
- On success: store `access_token` in localStorage, store `role` and `name` in auth context
- Redirect based on role:
  - `admin` → `/admin/dashboard`
  - `doctor` → `/doctor/dashboard`
  - `receptionist` → `/receptionist/dashboard`
- On error: show "Invalid credentials" message

---

### 2. Dashboard Layout (shared shell)

**Components**:

#### Sidebar (collapsible)
- Clinic logo + name at top
- Navigation links change based on user role (see below)
- Active link highlighting with smooth indicator
- Collapse/expand toggle with smooth animation
- User avatar + role badge at bottom
- Logout button

#### Topbar
- Page title (dynamic based on current route)
- Search bar (optional global search)
- Notification bell icon
- User greeting: "Hello, Dr. Smith 👋"
- Profile dropdown with logout

#### Sidebar Navigation by Role

**Admin:**
- 📊 Dashboard
- 👥 Staff Management
- 🏥 Services
- 📦 Inventory
- 📈 Reports
- 🔔 Notifications
- 💰 Billing (view invoices)

**Doctor:**
- 📊 Dashboard
- 📅 Today's Appointments
- 📋 Medical Records
- 🐾 Pet History Lookup

**Receptionist:**
- 📊 Dashboard
- 👤 Owners & Pets
- 📅 Appointments
- 💰 Billing & Invoices
- 💳 Payments

---

### 3. Admin Dashboard (`/admin/dashboard`)

**Summary Cards** (fetched from `GET /reports/dashboard`):
- 📅 Today's Appointments (count) — teal card
- 💰 Today's Revenue (₹ amount) — emerald card
- ⚠️ Low Stock Items (count) — amber/warning card
- 👥 Active Staff (count) — blue card

Each card should have:
- Large number with label
- Subtle icon
- Hover elevation effect
- Click to navigate to relevant section

**Charts Section** (fetched from `/reports/*`):
- **Revenue Chart**: Line/Area chart showing daily revenue for the last 30 days (from `GET /reports/revenue?start=...&end=...`)
- **Services Breakdown**: Horizontal bar chart or pie chart showing top services (from `GET /reports/services?start=...&end=...`)
- **Appointments Overview**: Doughnut chart showing completed vs cancelled vs scheduled (from `GET /reports/appointments?start=...&end=...`)

**Quick Actions**:
- "Add Staff" button → opens modal/navigates to staff management
- "View Low Stock" button → navigates to inventory with low_stock filter
- "View Reports" button → navigates to reports page

---

### 4. Staff Management (`/admin/staff`)

**Layout**:
- Header with title + "Add Staff" button
- Searchable, sortable table:
  - Columns: Name, Username, Role (badge), Status (Active/Inactive badge), Actions
  - Actions: Toggle active/inactive (with confirmation)

**Add Staff Modal/Form**:
- Fields: Full Name, Username, Email, Password, Role (dropdown: Doctor / Receptionist)
- Validation with Zod
- Success toast on creation

---

### 5. Services Management (`/admin/services`)

**Layout**:
- Card grid or table view of all services
- Each service card: Name, Category (badge), Price (₹), Active status toggle
- "Add Service" button → modal with: Name, Category, Price
- Edit price via inline edit or modal
- Toggle active/inactive

---

### 6. Inventory Management (`/admin/inventory`)

**Layout**:
- Tabs or filters: All | Medicines | Vaccines | Supplies | Low Stock | Expiring Soon
- Table with columns: Name, Category (badge), Qty, Unit, Reorder Level, Expiry Date, Cost Price, Actions
- **Low stock items** highlighted in red/amber
- **Expiring items** (≤30 days) with a warning badge

**Features**:
- "Add Item" button → modal form
- "Adjust Stock" button per item → modal with `change_qty` (+/-) and reason
- Click item → expandable row or drawer showing stock change history logs
- Expiring items alert banner at top

---

### 7. Reports Page (`/admin/reports`)

**Layout**:
- Date range picker at top (start date, end date)
- Tab sections: Revenue | Services | Appointments | Inventory

**Revenue Tab**:
- Total revenue display (large number)
- Line chart with daily revenue data

**Services Tab**:
- Table: Service Name, Times Used (count), Revenue Generated
- Bar chart visualization

**Appointments Tab**:
- Stats: Total, Completed, Cancelled, Walk-in, Scheduled
- Doughnut/pie chart

**Inventory Tab** (no date range needed):
- Split view: Low Stock Items | Near Expiry Items
- Each as a card list or table

---

### 8. Notification Logs (`/admin/notifications`)

**Layout**:
- Table: Owner ID, Channel (SMS/WhatsApp/Email badge), Message, Status (badge), Sent At
- Filter by owner_id
- "Send Notification" button → modal with owner_id, channel dropdown, message textarea, optional appointment_id

---

### 9. Doctor Dashboard (`/doctor/dashboard`)

**Summary**:
- "Today's Appointments" count card
- Quick list of today's appointments (from `GET /doctor/appointments/today`)

**Today's Appointments List**:
- Card layout for each appointment:
  - Pet ID, Owner ID, Time, Type (walk-in/scheduled badge), Status (badge)
  - **Actions**:
    - "View Details" → appointment detail view
    - "Add Medical Record" → medical record form (only if no record exists and status != completed)
    - "Mark Complete" → calls `PATCH /doctor/appointments/{id}/complete`
- Appointments sorted by time
- Color-code by status: scheduled (blue), completed (green), cancelled (red)

---

### 10. Medical Record Form (`/doctor/medical-record`)

**Accessed from**: clicking "Add Medical Record" on an appointment

**Form Fields**:
- Diagnosis (required, textarea)
- Symptoms (textarea)
- Treatment (textarea)
- Prescription (textarea)
- Notes (textarea)

**Behavior**:
- Submits to `POST /doctor/appointments/{appointment_id}/medical-record`
- Auto-marks appointment as completed
- Success toast + redirect back to appointments

---

### 11. Pet History (`/doctor/pets/:petId/history`)

**Layout**:
- Input field to enter Pet ID or search
- Timeline/card view of medical records for that pet
- Each record: Date, Doctor ID, Diagnosis, Symptoms, Treatment, Prescription, Notes
- Fetched from `GET /doctor/pets/{pet_id}/history`

---

### 12. Receptionist Dashboard (`/receptionist/dashboard`)

**Summary Cards**:
- Today's Appointments count
- Quick actions: "Register Owner", "New Appointment", "Create Invoice"

**Today's Appointments Table** (from `GET /receptionist/appointments/today`):
- Columns: ID, Owner ID, Pet ID, Time, Type, Status, Notes, Actions
- Actions: Edit (status/reschedule), Cancel

---

### 13. Owner & Pet Management (`/receptionist/owners`)

**Owner List**:
- Searchable table with columns: ID, Name, Phone, Email, Address, Actions
- Search by phone or email using `GET /receptionist/owners/search?phone=...`
- "Register Owner" button → form: Name, Phone, Email (optional), Address (optional)

**Pet Registration** (nested under owner):
- Click owner → see their pets (from `GET /receptionist/owners/{id}/pets`)
- "Add Pet" button → form: Name, Species (Dog/Cat/Bird/Other dropdown), Breed (optional), Age (optional)
- Submits to `POST /receptionist/owners/{owner_id}/pets`

---

### 14. Appointment Scheduler (`/receptionist/appointments`)

**Layout**:
- Date picker to select a date
- "Today" quick button
- "New Appointment" floating action button

**Appointments List** (from `GET /receptionist/appointments?appointment_date=YYYY-MM-DD`):
- Time-ordered card list
- Each card: Time, Owner ID, Pet ID, Type (badge), Status (badge), Notes
- Actions: Edit (change date/time/status), Cancel (set status to "cancelled")

**New Appointment Form (modal)**:
- Owner ID (ideally searchable dropdown of existing owners)
- Pet ID (filtered by selected owner)
- Date picker
- Time picker
- Type: Walk-in / Scheduled (radio buttons)
- Notes (optional textarea)

---

### 15. Billing & Invoices (`/receptionist/billing`)

**Layout**:
- "Create Invoice" button
- Invoice list (from `GET /billing/invoices`), filterable by owner_id and date
- Table: Invoice ID, Owner ID, Appointment ID, Total, Discount %, Final Amount, Payment Status (badge: pending/paid), Payment Method, Date, Actions

**Create Invoice Form**:
- Appointment ID
- Owner ID
- Services: multi-select from `GET /billing/services` with quantity for each
- Discount % (optional)
- Auto-calculate total and final amount on the frontend before submitting
- Submits to `POST /billing/invoices`

**View Invoice**:
- Detail view showing all line items
- Print-friendly layout

**Pay Invoice**:
- "Mark as Paid" button on pending invoices
- Dropdown: Cash / Card / UPI
- Calls `PATCH /billing/invoices/{id}/pay`

---

## Design System & Theme

### Color Palette
```
Primary:       #0D9488 (Teal 600)       — main actions, active states
Primary Light: #14B8A6 (Teal 500)       — hover states
Primary Dark:  #0F766E (Teal 700)       — pressed states
Secondary:     #F59E0B (Amber 500)      — accents, warnings, highlights
Success:       #10B981 (Emerald 500)    — completed, paid, active
Danger:        #EF4444 (Red 500)        — cancelled, errors, low stock
Warning:       #F59E0B (Amber 500)      — expiring, caution
Info:          #3B82F6 (Blue 500)       — scheduled, info badges
Background:    #F8FAFC (Slate 50)       — page background
Surface:       #FFFFFF                   — cards, modals
Sidebar BG:    #0F172A (Slate 900)      — dark sidebar
Sidebar Text:  #CBD5E1 (Slate 300)      — sidebar text
Text Primary:  #1E293B (Slate 800)      — headings
Text Secondary: #64748B (Slate 500)     — descriptions
```

### Design Principles
1. **Rounded corners** everywhere (cards: `rounded-2xl`, buttons: `rounded-xl`, badges: `rounded-full`)
2. **Glassmorphism** on cards: `backdrop-blur-lg bg-white/70 border border-white/20`
3. **Soft shadows**: `shadow-lg shadow-teal-500/10`
4. **Gradient accents**: Teal-to-emerald gradients for hero sections, stat cards
5. **Subtle animations**: fade-in on page load, scale on hover for cards, smooth slide for sidebar
6. **Pet-themed touches**: paw-print watermarks, pet-related emoji in headings, veterinary icons
7. **Responsive**: works on desktop (primary), tablet, and mobile
8. **Dark sidebar with light content area** (admin panel pattern)
9. **Status badges**: color-coded pill badges (green=active/completed/paid, red=inactive/cancelled, blue=scheduled, amber=pending)
10. **Empty states**: friendly illustrations when no data ("No appointments today 🐾", "All stock levels healthy ✅")

### Typography
- Headings: **Outfit** (bold, rounded feel)
- Body: **Inter** (clean, readable)
- Monospace (for IDs, codes): **JetBrains Mono**

---

## Authentication Flow

```
1. User visits any page → ProtectedRoute checks for token in localStorage
2. No token → redirect to /login
3. Token exists → decode role from stored context (or call GET /auth/me)
4. Role mismatch for route → redirect to user's dashboard
5. Token expired (API returns 401) → clear token, redirect to /login
```

### Axios Interceptor Setup
```typescript
// Request interceptor: attach Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

---

## Route Configuration

```typescript
// Public
/login                          → LoginPage

// Admin routes (role === "admin")
/admin/dashboard                → AdminDashboard
/admin/staff                    → StaffManagement
/admin/services                 → ServicesManagement
/admin/inventory                → InventoryManagement
/admin/reports                  → ReportsPage
/admin/notifications            → NotificationLogs
/admin/billing                  → BillingOverview (view-only)

// Doctor routes (role === "doctor" or "admin")
/doctor/dashboard               → DoctorDashboard
/doctor/appointments            → TodayAppointments
/doctor/appointments/:id/record → MedicalRecordForm
/doctor/pets/:petId/history     → PetHistory

// Receptionist routes (role === "receptionist" or "admin")
/receptionist/dashboard         → ReceptionistDashboard
/receptionist/owners            → OwnerManagement
/receptionist/appointments      → AppointmentScheduler
/receptionist/billing           → BillingInvoices
```

---

## Environment Variables (`.env`)

```
VITE_API_BASE_URL=http://localhost:8000
```

---

## Key Implementation Notes

1. **Login POST format**: The `/auth/login` endpoint expects `application/x-www-form-urlencoded`, NOT JSON. Use `URLSearchParams` or set the content-type header explicitly.

2. **Date/Time formats**: Backend expects dates as `YYYY-MM-DD` and times as `HH:MM:SS` (24-hour format).

3. **Decimal handling**: Prices and amounts come as strings/Decimal from the backend. Parse to `Number` for display and chart calculations.

4. **Role guard**: Admin can access all routes. Doctor routes also allow admin. Receptionist routes also allow admin. Implement guards accordingly.

5. **Invoice creation flow**: When creating an invoice, fetch available services first (`GET /billing/services`), let the user pick services with quantities, calculate a preview total on the frontend, then submit.

6. **Appointment statuses**: `scheduled` → `completed` (by doctor) or `cancelled` (by receptionist). Only these three statuses exist.

7. **Appointment types**: `walk-in` and `scheduled`. Both start with status `scheduled`.

8. **Notification channels**: `sms`, `whatsapp`, `email` — the backend currently mocks the sending, so just wire up the UI for creating and viewing.

9. **Stock adjustment**: `change_qty` can be positive (restock) or negative (use/remove). The backend handles the math.

10. **All ID fields are integers**, not UUIDs.

---

## Deliverables Checklist

- [ ] Login page with OAuth2 form-urlencoded authentication
- [ ] Auth context with token management and role-based redirect
- [ ] Protected routes with role guards
- [ ] Responsive sidebar + topbar dashboard layout
- [ ] Admin: Dashboard with stat cards + charts
- [ ] Admin: Staff management (CRUD + activate/deactivate)
- [ ] Admin: Services management (CRUD + toggle active)
- [ ] Admin: Inventory management (CRUD + stock adjust + expiry alerts)
- [ ] Admin: Reports page with date range + 4 report types + charts
- [ ] Admin: Notification logs + send notification
- [ ] Doctor: Dashboard with today's appointments
- [ ] Doctor: View appointment + mark complete
- [ ] Doctor: Add medical record form
- [ ] Doctor: Pet medical history timeline
- [ ] Receptionist: Dashboard with quick actions
- [ ] Receptionist: Owner registration + search
- [ ] Receptionist: Pet registration under owner
- [ ] Receptionist: Appointment scheduling + management
- [ ] Receptionist: Invoice creation with service selection
- [ ] Receptionist: Payment processing (mark paid)
- [ ] Toast notifications for success/error feedback
- [ ] Loading states and skeletons
- [ ] Empty states with friendly messages
- [ ] Fully typed with TypeScript interfaces matching backend schemas
- [ ] Clean, modular, well-organized code
