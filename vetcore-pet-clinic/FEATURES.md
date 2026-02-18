# VetCore Pet Clinic — Feature Documentation

> **Version**: 1.0  
> **Last Updated**: February 13, 2026  
> **Stack**: React 19 (frontend) + FastAPI (backend) + PostgreSQL (database)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Admin Features](#2-admin-features)
3. [Doctor Features](#3-doctor-features)
4. [Receptionist Features](#4-receptionist-features)
5. [Login Credentials](#5-login-credentials)

---

## 1. Authentication

All users share a common authentication system. Access is role-based — each role sees only its own dashboard and pages.

| Feature | Description |
|---------|-------------|
| **Login** | Username + password login form with validation (Zod + react-hook-form). Sends credentials as `x-www-form-urlencoded` to `POST /auth/login`. |
| **JWT Token** | On successful login, a JWT token is returned and stored in `localStorage`. All subsequent API calls attach this token via an Axios request interceptor. |
| **Session Restore** | On page reload, the app calls `GET /auth/me` to restore the user session without re-login. |
| **Role-Based Routing** | `ProtectedRoute` component checks the user's role before rendering pages. Unauthorized role access redirects to the user's own dashboard. |
| **Auto Logout** | If any API call returns `401 Unauthorized`, the token is cleared and the user is redirected to the login page. |

---

## 2. Admin Features

**Route prefix**: `/#/admin/`  
**Sidebar navigation**: Dashboard, Staff, Services, Inventory, Reports, Notifications, Billing

---

### 2.1 Dashboard (`/admin/dashboard`)

The admin dashboard provides a real-time overview of clinic operations.

| Widget | Data Source | Description |
|--------|------------|-------------|
| Today's Appointments | `GET /reports/dashboard` | Count of appointments scheduled for today |
| Today's Revenue | `GET /reports/dashboard` | Total revenue collected today (₹) |
| Low Stock Items | `GET /reports/dashboard` | Count of inventory items below reorder level |
| Active Staff | `GET /reports/dashboard` | Count of active staff members |

**Charts** (powered by `recharts`):

| Chart | Type | Data Source |
|-------|------|------------|
| Revenue Overview (Last 30 Days) | Area Chart | `GET /reports/revenue?start=...&end=...` |
| Appointments Status | Pie Chart | `GET /reports/appointments?start=...&end=...` |
| Top Performing Services | Bar Chart | `GET /reports/services?start=...&end=...` |

---

### 2.2 Staff Management (`/admin/staff`)

Manage all clinic staff users (doctors, receptionists).

| Feature | API | Description |
|---------|-----|-------------|
| **View All Staff** | `GET /admin/staff` | Lists all staff in a table with Name, Username, Role, Status |
| **Add Staff** | `POST /admin/staff` | Modal form to create a new staff member with name, username, email, password, and role (doctor/receptionist) |
| **Activate/Deactivate** | `PATCH /admin/staff/{id}` | Toggle button to enable/disable a staff account. **Self-deactivation is blocked** — the logged-in admin cannot deactivate their own account |
| **Role Badges** | — | Color-coded role badges: Purple (admin), Blue (doctor), Teal (receptionist) |
| **Status Badges** | — | Green (Active), Red (Inactive) |

---

### 2.3 Services Management (`/admin/services`)

Manage the catalog of clinic services and their pricing.

| Feature | API | Description |
|---------|-----|-------------|
| **View All Services** | `GET /billing/services` | Table listing all services with name, category, price, and status |
| **Add Service** | `POST /billing/services` | Modal form: service name, category (optional), and price |
| **Inline Price Edit** | `PATCH /billing/services/{id}` | Click on a price to edit it inline — saves on blur or Enter |
| **Toggle Active/Inactive** | `PATCH /billing/services/{id}` | Activate or deactivate a service. Inactive services won't appear in invoice creation |

---

### 2.4 Inventory Management (`/admin/inventory`)

Track medicines, vaccines, and supplies with stock levels and expiry dates.

| Feature | API | Description |
|---------|-----|-------------|
| **View All Items** | `GET /inventory/items` | Table with name, category, quantity, unit, reorder level, expiry date |
| **Category Filters** | `GET /inventory/items?category=...` | Filter by: All, Medicine, Vaccine, Supply |
| **Low Stock Filter** | `GET /inventory/items?low_stock=true` | Show only items below their reorder level (highlighted in red) |
| **Expiring Soon Alert** | `GET /inventory/expiring` | Badge showing count of items expiring within 30 days |
| **Add Item** | `POST /inventory/items` | Modal form: name, category, quantity, unit, reorder level, cost price, expiry date |
| **Stock Adjustment** | `POST /inventory/items/{id}/stock` | Modal to increase/decrease quantity with a reason (e.g., "Restocked", "Used in surgery") |
| **View Stock Logs** | `GET /inventory/items/{id}/logs` | Modal showing the history of all stock changes for an item with timestamps, quantities, and reasons |

---

### 2.5 Reports (`/admin/reports`)

Analytics and reporting with date-range filtering.

| Tab | Data Source | Visualization |
|-----|------------|---------------|
| **Revenue** | `GET /reports/revenue?start=...&end=...` | Area chart showing daily revenue over the selected period |
| **Services** | `GET /reports/services?start=...&end=...` | Bar chart showing service usage counts + revenue table |
| **Appointments** | `GET /reports/appointments?start=...&end=...` | Pie chart (completed vs cancelled vs scheduled) + summary stats |
| **Inventory** | `GET /reports/inventory` | Two tables: Low Stock items and Near-Expiry items (no date filter) |

**Date Range Picker**: Available for Revenue, Services, and Appointments tabs. Defaults to the last 30 days.

---

### 2.6 Notification Logs (`/admin/notifications`)

View sent notifications and send new ones to pet owners.

| Feature | API | Description |
|---------|-----|-------------|
| **View Logs** | `GET /notifications/logs` | Table listing all sent notifications with owner ID, channel, message snippet, status, and timestamp |
| **Filter by Owner** | `GET /notifications/logs?owner_id=...` | Filter notifications by a specific owner ID |
| **Send Notification** | `POST /notifications/send` | Modal form: owner ID, appointment ID (optional), channel (SMS/WhatsApp/Email), message body. **Note**: Notifications are mocked on the backend — they log but don't actually send. |

---

### 2.7 Billing Overview (`/admin/billing`)

Read-only view of all invoices across the clinic.

| Feature | API | Description |
|---------|-----|-------------|
| **View All Invoices** | `GET /billing/invoices` | Table showing invoice ID, owner ID, appointment ID, total amount, final amount, payment status, payment method, and date |
| **Filter by Owner** | `GET /billing/invoices?owner_id=...` | Filter invoices by owner ID |
| **Filter by Date** | `GET /billing/invoices?date=...` | Filter invoices by creation date |
| **Status Badges** | — | Green (Paid), Amber (Pending) |

---

## 3. Doctor Features

**Route prefix**: `/#/doctor/`  
**Sidebar navigation**: Dashboard, Appointments, Records, Pet History

---

### 3.1 Dashboard (`/doctor/dashboard`)

Quick overview of the day's workload.

| Widget | Description |
|--------|-------------|
| Today's Appointments | Total count of all appointments for today |
| Pending | Count of appointments with status `scheduled` |
| Completed | Count of appointments with status `completed` |

**Appointment Cards**: Each appointment is shown as a card with:
- Status badge (Scheduled / Completed / Cancelled)
- Type badge (Walk-in / Scheduled)
- Pet ID and Owner ID
- Time slot
- Notes (if any)
- **"Record" button** — navigates to the medical record form (only for scheduled appointments)

---

### 3.2 Today's Appointments (`/doctor/appointments`)

Detailed list view of today's appointments with actions.

| Feature | API | Description |
|---------|-----|-------------|
| **View Appointments** | `GET /doctor/appointments/today` | List of all today's appointments in a timeline format |
| **Mark Complete** | `PATCH /doctor/appointments/{id}/complete` | Button to mark a scheduled appointment as completed |
| **Add Medical Record** | Navigate to `/doctor/appointments/{id}/record` | Button to open the medical record creation form |

Each appointment row shows:
- Time, Pet ID, Owner ID
- Status badge with color coding
- Type badge
- Notes
- Action buttons (only for `scheduled` appointments)

---

### 3.3 Medical Record Form (`/doctor/appointments/:id/record`)

Form to create a medical record for a completed appointment.

| Field | Required | Description |
|-------|----------|-------------|
| **Diagnosis** | ✅ Yes | Primary diagnosis text |
| **Symptoms** | No | Observed symptoms |
| **Treatment** | No | Treatment administered |
| **Prescription** | No | Medications prescribed |
| **Additional Notes** | No | Follow-up instructions, observations |

- **API**: `POST /doctor/appointments/{id}/medical-record`
- On success, redirects back to the appointments list
- Cancel button navigates back without saving

---

### 3.4 Pet History (`/doctor/history`)

Look up the complete medical history of a pet.

| Feature | API | Description |
|---------|-----|-------------|
| **Search by Pet ID** | `GET /doctor/pets/{petId}/history` | Enter a pet ID and press Enter or click Search |
| **Medical Record Cards** | — | Each record shows: diagnosis, date, symptoms, treatment, prescription, and notes in a card format |
| **404 Handling** | — | Shows "Pet not found" toast if the pet ID doesn't exist |

---

## 4. Receptionist Features

**Route prefix**: `/#/receptionist/`  
**Sidebar navigation**: Dashboard, Owners, Appointments, Billing, Payments

---

### 4.1 Dashboard (`/receptionist/dashboard`)

Quick actions and today's appointment overview.

**Quick Action Cards** (clickable, with hover animation):

| Action | Navigates To | Description |
|--------|-------------|-------------|
| 🧑 Register Owner | `/receptionist/owners` | Go to owner management |
| 📅 New Appointment | `/receptionist/appointments` | Go to appointment scheduler |
| 🐾 Create Invoice | `/receptionist/billing` | Go to billing page |

**Today's Appointments Table**: Shows all appointments for today with time, pet ID, owner ID, type, and status.

---

### 4.2 Owner & Pet Management (`/receptionist/owners`)

Register new pet owners and manage their pets.

| Feature | API | Description |
|---------|-----|-------------|
| **View All Owners** | `GET /receptionist/owners` | Card list of all registered owners with name, phone, email, and address |
| **Search Owners** | `GET /receptionist/owners/search?q=...` | Search by phone number or email |
| **Register Owner** | `POST /receptionist/owners` | Modal form: name (required), phone (required), email (optional), address (optional) |
| **View Pets** | `GET /receptionist/owners/{id}/pets` | Expandable section under each owner card showing their registered pets |
| **Add Pet** | `POST /receptionist/owners/{id}/pets` | Modal form: pet name (required), species (required, dropdown: dog/cat/bird/rabbit/hamster/other), breed (optional), age in years (optional) |

Each pet card shows: name, species, breed, age, and a unique Pet ID (important for appointments and medical records).

---

### 4.3 Appointment Scheduler (`/receptionist/appointments`)

Create and manage appointments.

| Feature | API | Description |
|---------|-----|-------------|
| **View Appointments** | `GET /receptionist/appointments?appointment_date=...` | Table filtered by date — shows time, date, pet ID, owner ID, type, status, notes |
| **Today Button** | `GET /receptionist/appointments/today` | Quick filter to show only today's appointments |
| **Date Filter** | — | Date picker to view appointments for any date |
| **Create Appointment** | `POST /receptionist/appointments` | Modal form: owner ID, pet ID, date, time, type (scheduled/walk-in), notes (optional) |
| **Cancel Appointment** | `PATCH /receptionist/appointments/{id}` | ✕ button to cancel a scheduled appointment (sets status to `cancelled`) |

---

### 4.4 Billing & Invoices (`/receptionist/billing`)

Create and view invoices for completed appointments.

| Feature | API | Description |
|---------|-----|-------------|
| **View All Invoices** | `GET /billing/invoices` | Table with invoice #, owner, total amount, final amount, status, date |
| **View Invoice Detail** | `GET /billing/invoices/{id}` | Modal showing full breakdown: line items, subtotal, discount %, final amount, payment status and method |
| **Create Invoice** | `POST /billing/invoices` | Modal form with: |
| | | — Appointment ID and Owner ID |
| | | — **Dynamic line items**: select a service + quantity (add/remove rows) |
| | | — Discount percentage |
| | | — Submits to create a new invoice |

**Line Item Builder**: 
- Select from active services (fetched from `GET /billing/services`)
- Each service shows its name and price
- Add multiple services with different quantities
- Remove individual line items

---

### 4.5 Payment Processing (`/receptionist/payments`)

Process payments for pending invoices.

| Feature | API | Description |
|---------|-----|-------------|
| **View Pending Invoices** | `GET /billing/invoices` (filtered to `pending`) | Card grid showing all unpaid invoices with final amount, discount info, and date |
| **Process Payment** | `PATCH /billing/invoices/{id}/pay` | Two-step flow: |
| | | 1. Click "Process Payment" to expand payment options |
| | | 2. Select payment method (Cash / Card / UPI / Online) |
| | | 3. Click "Confirm" to mark as paid |
| **Success State** | — | When all invoices are paid, shows "All payments are up to date! ✅" |

---

## 5. Login Credentials

| Role | Username | Password | Dashboard URL |
|------|----------|----------|---------------|
| **Admin** | `admin` | `admin123` | `/#/admin/dashboard` |
| **Doctor** | `drsmith` | `doctor123` | `/#/doctor/dashboard` |
| **Receptionist** | `reception` | `reception123` | `/#/receptionist/dashboard` |

---

## Technical Notes

- **API Base URL**: `http://localhost:8000` (configured in `api/axios.ts`)
- **Frontend Port**: `http://localhost:3000` (Vite dev server)
- **Database**: PostgreSQL 16 via Docker (port 5433)
- **Styling**: Tailwind CSS via CDN + custom `index.css`
- **Charts**: `recharts` library
- **Icons**: `lucide-react` library
- **Notifications**: Toast notifications via `react-hot-toast`
- **Routing**: `react-router-dom` with `HashRouter`
