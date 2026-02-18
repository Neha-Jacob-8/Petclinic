# Admin Module — Detailed Documentation & Testing Guide

> **Login**: `admin` / `admin123`  
> **Dashboard URL**: `http://localhost:3000/#/admin/dashboard`

---

## Table of Contents

1. [Dashboard](#1-dashboard)
2. [Staff Management](#2-staff-management)
3. [Services Management](#3-services-management)
4. [Inventory Management](#4-inventory-management)
5. [Reports & Analytics](#5-reports--analytics)
6. [Notification Logs](#6-notification-logs)
7. [Billing Overview](#7-billing-overview)
8. [Complete Test Cases](#8-complete-test-cases)

---

## 1. Dashboard

**Route**: `/#/admin/dashboard`  
**File**: `pages/admin/AdminDashboard.tsx`  
**API**: `GET /reports/dashboard`, `GET /reports/revenue`, `GET /reports/services`, `GET /reports/appointments`

### What It Does

The dashboard is the admin's landing page after login. It provides a real-time bird's-eye view of clinic operations.

### UI Components

| Component | Location | Description |
|-----------|----------|-------------|
| **Greeting Banner** | Top-right | Shows "Hello, {Admin Name} 👋" with the current date |
| **Stats Cards Row** | Top section | 4 cards showing key metrics |
| **Revenue Chart** | Middle-left | Area chart — revenue over the last 30 days |
| **Appointments Chart** | Middle-right | Pie chart — completed vs cancelled vs scheduled |
| **Top Services Chart** | Bottom | Bar chart — most-used services by count |
we en
### Stats Cards Detail

| Card | Metric | Color | Icon |
|------|--------|-------|------|
| Today's Appointments | Number of appointments today | Teal | Calendar |
| Today's Revenue | Total revenue in ₹ today | Green | Dollar |
| Low Stock Items | Items below reorder level | Orange | Package |
| Active Staff | Active staff members count | Blue | People |

### Data Flow
1. On page load, `GET /reports/dashboard` fetches the 4 stat values
2. `GET /reports/revenue?start={30 days ago}&end={today}` populates the area chart
3. `GET /reports/appointments?start={30 days ago}&end={today}` populates the pie chart
4. `GET /reports/services?start={30 days ago}&end={today}` populates the bar chart
5. If any API fails, a toast error is shown and the section displays "No data yet"

---

## 2. Staff Management

**Route**: `/#/admin/staff`  
**File**: `pages/admin/StaffManagement.tsx`  
**APIs**: `GET /admin/staff`, `POST /admin/staff`, `PATCH /admin/staff/{id}`

### What It Does

Allows the admin to view all clinic staff, create new staff accounts, and activate/deactivate them.

### Features In Detail

#### 2.1 View Staff Table

| Column | Description |
|--------|-------------|
| **Name** | Full name of the staff member |
| **Username** | Login username |
| **Role** | Color-coded badge: Purple = Admin, Blue = Doctor, Teal = Receptionist |
| **Status** | Green "Active" or Red "Inactive" badge |
| **Actions** | Toggle switch to activate/deactivate (shows "You" label for current user) |

#### 2.2 Add New Staff

Click the **"+ Add Staff"** button (top-right) to open a modal form:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Full Name | Text | ✅ | Non-empty |
| Username | Text | ✅ | Unique across all users |
| Email | Email | ✅ | Valid email format |
| Password | Password | ✅ | Non-empty |
| Role | Dropdown | ✅ | Doctor or Receptionist only (cannot create another admin) |

**On Submit**: Creates the user immediately. The new user can log in with the provided credentials.

#### 2.3 Activate/Deactivate Staff

- Click the toggle icon next to any staff member
- **Deactivating**: Sets `is_active = false` → user can no longer log in
- **Activating**: Sets `is_active = true` → user can log in again
- ⚠️ **Self-protection**: You CANNOT deactivate your own account (shows "You" label instead of toggle)

---

## 3. Services Management

**Route**: `/#/admin/services`  
**File**: `pages/admin/ServicesManagement.tsx`  
**APIs**: `GET /billing/services`, `POST /billing/services`, `PATCH /billing/services/{id}`

### What It Does

Manage the catalog of clinic services (consultations, vaccinations, surgeries, etc.) and their pricing.

### Features In Detail

#### 3.1 View Services Table

| Column | Description |
|--------|-------------|
| **Name** | Service name (e.g., "General Consultation") |
| **Category** | Category tag (consultation, vaccination, surgery, lab, grooming) |
| **Price** | Price in ₹ — **clickable for inline edit** |
| **Status** | Green "Active" or Gray "Inactive" |
| **Actions** | Toggle switch to activate/deactivate |

#### 3.2 Add New Service

Click **"+ Add Service"** button:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Service Name | Text | ✅ | e.g., "Dental Cleaning" |
| Category | Text | No | e.g., "consultation", "surgery" |
| Price (₹) | Number | ✅ | Must be > 0 |

#### 3.3 Inline Price Editing

1. Click on any price value in the table
2. An input field appears with the current price
3. Change the value and press **Enter** or click away (blur) to save
4. Press **Escape** to cancel
5. Shows success toast on save

#### 3.4 Toggle Active/Inactive

- Active services appear in the receptionist's invoice creation dropdown
- Inactive services are hidden from invoice creation but preserved in existing invoices

### Pre-Seeded Services

| Service | Category | Price (₹) |
|---------|----------|-----------|
| General Consultation | consultation | 500 |
| Vaccination | vaccination | 800 |
| Grooming | grooming | 1,200 |
| Surgery - Minor | surgery | 5,000 |
| Surgery - Major | surgery | 15,000 |
| Lab Test - Blood Work | lab | 1,500 |
| Lab Test - X-Ray | lab | 2,000 |
| Dental Cleaning | consultation | 2,500 |
| Deworming | vaccination | 300 |
| Microchipping | consultation | 1,000 |

---

## 4. Inventory Management

**Route**: `/#/admin/inventory`  
**File**: `pages/admin/InventoryManagement.tsx`  
**APIs**: `GET /inventory/items`, `POST /inventory/items`, `POST /inventory/items/{id}/stock`, `GET /inventory/items/{id}/logs`, `GET /inventory/expiring`

### What It Does

Track medicines, vaccines, and supplies — quantities, reorder alerts, expiry warnings, and full stock change history.

### Features In Detail

#### 4.1 View Inventory Table

| Column | Description |
|--------|-------------|
| **Name** | Item name |
| **Category** | medicine / vaccine / supply |
| **Quantity** | Current stock count (red highlight if below reorder level) |
| **Unit** | tablets, vials, bottles, boxes, rolls |
| **Reorder Level** | Minimum safe stock quantity |
| **Expiry Date** | Date when the item expires (amber highlight if within 30 days) |
| **Actions** | Adjust Stock button, View Logs button |

#### 4.2 Category Filters (Tab Bar)

| Filter | What It Shows |
|--------|---------------|
| **All** | Every inventory item |
| **Medicine** | Only items where category = medicine |
| **Vaccine** | Only items where category = vaccine |
| **Supply** | Only items where category = supply |
| **Low Stock ⚠️** | Items where quantity < reorder_level |

#### 4.3 Expiring Soon Badge

- Shows a badge with count of items expiring within 30 days
- Data from `GET /inventory/expiring`
- Orange badge in the header area

#### 4.4 Add New Inventory Item

Click **"+ Add Item"** button:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Item Name | Text | ✅ | e.g., "Amoxicillin 250mg" |
| Category | Dropdown | ✅ | medicine / vaccine / supply |
| Quantity | Number | ✅ | Initial stock count |
| Unit | Text | ✅ | e.g., "tablets", "vials" |
| Reorder Level | Number | ✅ | Alert threshold |
| Cost Price (₹) | Number | No | Per-unit cost |
| Expiry Date | Date | No | Leave blank for non-perishables |

#### 4.5 Stock Adjustment

Click the stock adjustment icon on any item:

| Field | Description |
|-------|-------------|
| **Quantity Change** | Positive number to add, negative to subtract |
| **Reason** | Text field — e.g., "Restocked from supplier", "Used in surgery #42" |

- API: `POST /inventory/items/{id}/stock` with `{ change_qty, reason }`
- After adjustment, the inventory table auto-refreshes

#### 4.6 View Stock Change Logs

Click the log icon on any item to see history:

| Column | Description |
|--------|-------------|
| Date | When the change happened |
| Change | +/- quantity (green for add, red for subtract) |
| Reason | Why the change was made |
| By | Staff member who made the change |

### Pre-Seeded Inventory

| Item | Category | Qty | Unit | Reorder | Expiry |
|------|----------|-----|------|---------|--------|
| Amoxicillin 250mg | medicine | 100 | tablets | 20 | — |
| Rabies Vaccine | vaccine | 50 | vials | 10 | Dec 2026 |
| Surgical Gloves (Box) | supply | 30 | boxes | 5 | — |
| Ivermectin 10ml | medicine | 40 | bottles | 15 | Jun 2026 |
| Antiseptic Solution 500ml | supply | 25 | bottles | 10 | — |
| Parvo Vaccine | vaccine | 35 | vials | 10 | Sep 2026 |
| Gauze Rolls | supply | 60 | rolls | 20 | — |
| Meloxicam 5mg | medicine | 80 | tablets | 25 | Mar 2027 |

---

## 5. Reports & Analytics

**Route**: `/#/admin/reports`  
**File**: `pages/admin/Reports.tsx`  
**APIs**: `GET /reports/revenue`, `GET /reports/services`, `GET /reports/appointments`, `GET /reports/inventory`

### What It Does

Visual analytics with charts and tables for revenue, service usage, appointment stats, and inventory health.

### Tabs

#### 5.1 Revenue Tab

| Element | Description |
|---------|-------------|
| **Date Range Picker** | Start and End date fields (defaults: last 30 days) |
| **Area Chart** | X-axis = dates, Y-axis = revenue in ₹, filled gradient area |
| **Empty State** | "No revenue data for this period" if no invoices exist |

#### 5.2 Services Tab

| Element | Description |
|---------|-------------|
| **Date Range Picker** | Same as Revenue tab |
| **Bar Chart** | Horizontal bars showing service usage count |
| **Data Table** | Service Name, Times Used, Total Revenue |

#### 5.3 Appointments Tab

| Element | Description |
|---------|-------------|
| **Date Range Picker** | Same as Revenue tab |
| **Pie Chart** | Completed (green) / Cancelled (red) / Scheduled (blue) |
| **Summary Stats** | Total, Completed, Cancelled, Walk-in, Scheduled counts |

#### 5.4 Inventory Tab

| Element | Description |
|---------|-------------|
| **Low Stock Table** | Items below reorder level — no date filter (always current) |
| **Near-Expiry Table** | Items expiring within 30 days |

---

## 6. Notification Logs

**Route**: `/#/admin/notifications`  
**File**: `pages/admin/NotificationLogs.tsx`  
**APIs**: `GET /notifications/logs`, `POST /notifications/send`

### What It Does

View a log of all sent notifications and send new ones to pet owners.

### Features

#### 6.1 View Notification Logs

| Column | Description |
|--------|-------------|
| **ID** | Notification ID |
| **Owner ID** | Which owner received it |
| **Channel** | SMS / WhatsApp / Email |
| **Message** | Truncated message preview |
| **Status** | sent / pending / failed |
| **Sent At** | Timestamp |

#### 6.2 Filter by Owner

- Enter an Owner ID in the filter field to see only that owner's notifications

#### 6.3 Send New Notification

Click **"Send Notification"** button:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Owner ID | Number | ✅ | Must be a valid owner ID |
| Appointment ID | Number | No | Link to a specific appointment |
| Channel | Dropdown | ✅ | SMS / WhatsApp / Email |
| Message | Textarea | ✅ | Notification content |

> ⚠️ **Note**: Notifications are **mocked** on the backend. They are logged in the database but no actual SMS/email/WhatsApp is sent.

---

## 7. Billing Overview

**Route**: `/#/admin/billing`  
**File**: `pages/admin/BillingOverview.tsx`  
**API**: `GET /billing/invoices`

### What It Does

Read-only view of all invoices across the clinic. Admins can view but not create or modify invoices.

### Invoice Table

| Column | Description |
|--------|-------------|
| **Invoice #** | Unique invoice ID |
| **Owner ID** | Which owner is billed |
| **Appointment ID** | Linked appointment |
| **Total (₹)** | Pre-discount amount |
| **Final (₹)** | Post-discount amount |
| **Status** | Green "Paid" or Amber "Pending" badge |
| **Payment Method** | Cash / Card / UPI / Online (or "—" if unpaid) |
| **Date** | Invoice creation date |

### Filters

| Filter | Description |
|--------|-------------|
| **Owner ID** | Show invoices for a specific owner |
| **Date** | Show invoices from a specific date |

---

## 8. Complete Test Cases

### Prerequisites

1. **Start Docker**: Ensure the Postgres container `petclinic-postgres-1` is running
2. **Start Backend**: `cd petclinic && source clinic/bin/activate && uvicorn backend.main:app --reload --port 8000`
3. **Start Frontend**: `cd vetcore-pet-clinic && npm run dev`
4. **Seed Database**: `cd petclinic && source clinic/bin/activate && python -m backend.seed`
5. **Open Browser**: Navigate to `http://localhost:3000`

---

### TC-01: Admin Login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `http://localhost:3000` | Login page is displayed with "Welcome Back" |
| 2 | Enter username: `admin` | Username field populated |
| 3 | Enter password: `admin123` | Password field populated (masked) |
| 4 | Click "Sign In" | ✅ Redirected to `/#/admin/dashboard` |
| 5 | Verify greeting | Shows "Hello, System Admin 👋" with today's date |

---

### TC-02: Dashboard Stats

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View stats cards | 4 cards visible: Appointments, Revenue, Low Stock, Active Staff |
| 2 | Verify Active Staff | Shows `6` (seeded staff count) |
| 3 | Verify Low Stock | Shows `0` (all items above reorder level after seed) |
| 4 | Scroll down | Revenue chart, Appointments pie chart, and Top Services bar chart visible |
| 5 | Charts with no data | Should display "No data yet" messages (no appointments/invoices after fresh seed) |

---

### TC-03: Staff — View All

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Staff" in sidebar | Staff Management page loads |
| 2 | Verify table | Shows all staff: admin, drsmith, reception, doctor1, reception1 etc. |
| 3 | Check role badges | Admin = Purple, Doctor = Blue, Receptionist = Teal |
| 4 | Check status badges | All should be Green "Active" |
| 5 | Your own row | Actions column shows "You" (not a toggle button) |

---

### TC-04: Staff — Create New

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "+ Add Staff" | Modal opens with empty form |
| 2 | Fill: Name = "Dr. Test", Username = "drtest", Email = "drtest@clinic.com", Password = "test123", Role = Doctor | All fields populated |
| 3 | Click "Create" | ✅ Toast: "Staff member created" |
| 4 | Verify table | New "Dr. Test" row appears with Doctor badge |
| 5 | Try login with `drtest` / `test123` | ✅ Redirected to Doctor Dashboard |

---

### TC-05: Staff — Deactivate/Activate

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click toggle on "Dr. Test" row | ✅ Toast: "Staff deactivated" |
| 2 | Verify status | Badge changes to Red "Inactive" |
| 3 | Try login as `drtest` / `test123` in another browser tab | ❌ Login fails — "Invalid credentials" |
| 4 | Click toggle again | ✅ Toast: "Staff activated" |
| 5 | Try login again | ✅ Login succeeds |

---

### TC-06: Staff — Self-Deactivation Block

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find your admin row in the table | Actions column shows "You" label |
| 2 | Verify no toggle button | No ToggleRight/ToggleLeft icon for your row |

---

### TC-07: Services — View All

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Services" in sidebar | Services Management page loads |
| 2 | Verify pre-seeded data | 10 services listed (General Consultation, Vaccination, etc.) |
| 3 | Check prices | All prices displayed in ₹ format |

---

### TC-08: Services — Add New

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "+ Add Service" | Modal opens |
| 2 | Fill: Name = "Emergency Visit", Category = "consultation", Price = 2000 | Fields populated |
| 3 | Click "Create" | ✅ Toast: "Service created" |
| 4 | Verify table | "Emergency Visit" appears with ₹2000 |

---

### TC-09: Services — Inline Price Edit

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on the price "₹500" for General Consultation | Input field appears with value "500" |
| 2 | Change to "600" and press Enter | ✅ Toast: "Price updated" |
| 3 | Verify | Price now shows ₹600 |
| 4 | Click on another price, press Escape | Edit cancelled, original price remains |

---

### TC-10: Services — Toggle Active/Inactive

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click toggle on "Grooming" | ✅ Toast: "Service deactivated" |
| 2 | Verify status | Badge changes to "Inactive" |
| 3 | Go to Receptionist → Billing → Create Invoice | "Grooming" should NOT appear in the services dropdown |
| 4 | Toggle back on | "Grooming" reappears in dropdown |

---

### TC-11: Inventory — View & Filter

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Inventory" in sidebar | Inventory page loads with 8 pre-seeded items |
| 2 | Click "Medicine" tab | Shows only: Amoxicillin, Ivermectin, Meloxicam |
| 3 | Click "Vaccine" tab | Shows only: Rabies Vaccine, Parvo Vaccine |
| 4 | Click "Supply" tab | Shows only: Surgical Gloves, Antiseptic Solution, Gauze Rolls |
| 5 | Click "Low Stock" tab | Shows 0 items (all above reorder level) |
| 6 | Click "All" tab | All 8 items shown |

---

### TC-12: Inventory — Add Item

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "+ Add Item" | Modal opens |
| 2 | Fill: Name = "Bandages", Category = supply, Qty = 100, Unit = rolls, Reorder = 15 | All fields populated |
| 3 | Click "Create" | ✅ Toast: "Item added" |
| 4 | Verify | "Bandages" appears in the table |

---

### TC-13: Inventory — Stock Adjustment

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click stock adjustment icon on "Amoxicillin 250mg" (qty = 100) | Adjustment modal opens |
| 2 | Enter: Change = -20, Reason = "Used for patient treatment" | Fields populated |
| 3 | Click "Adjust" | ✅ Toast: "Stock adjusted" |
| 4 | Verify | Quantity now shows 80 |
| 5 | Repeat with Change = +50, Reason = "Restocked from supplier" | Quantity now shows 130 |

---

### TC-14: Inventory — View Stock Logs

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click log icon on "Amoxicillin 250mg" | Log modal opens |
| 2 | Verify entries | Shows 2 entries: -20 (Used for patient treatment) and +50 (Restocked...) |
| 3 | Check timestamps | Entries have correct dates/times |

---

### TC-15: Inventory — Low Stock Alert

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Adjust "Surgical Gloves" stock by -28 (from 30 → 2, below reorder of 5) | Quantity updated to 2 |
| 2 | Verify | Quantity cell highlighted in red |
| 3 | Click "Low Stock" tab | "Surgical Gloves" now appears |
| 4 | Go to Dashboard | "Low Stock Items" stat card should show 1 |

---

### TC-16: Reports — Revenue

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Reports" in sidebar | Reports page loads, Revenue tab active |
| 2 | Verify date range | Defaults to last 30 days |
| 3 | Empty state (fresh DB) | "No revenue data for this period" message |
| 4 | After creating invoices and payments | Area chart shows daily revenue data |

---

### TC-17: Reports — Services

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Services" tab | Bar chart + table view |
| 2 | Empty state | "No data" message |
| 3 | After invoices with services | Shows service name, usage count, and revenue |

---

### TC-18: Reports — Appointments

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Appointments" tab | Pie chart + summary stats |
| 2 | Empty state | All stats show 0 |
| 3 | After creating appointments | Pie shows completed/cancelled/scheduled split |

---

### TC-19: Reports — Inventory

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Inventory" tab | Two tables: Low Stock and Near-Expiry |
| 2 | No date filter | Always shows current state |
| 3 | After TC-15 | "Surgical Gloves" appears in Low Stock table |

---

### TC-20: Notifications — View Logs

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Notifications" in sidebar | Notification logs page loads |
| 2 | Fresh database | Empty table or "No notifications" message |

---

### TC-21: Notifications — Send New

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Send Notification" | Modal opens |
| 2 | Fill: Owner ID = 1, Channel = SMS, Message = "Your pet's vaccination is due" | Fields populated |
| 3 | Click "Send" | ✅ Toast: "Notification sent" |
| 4 | Verify | New entry appears in the logs table |
| 5 | Filter by Owner ID = 1 | Only that notification shows |

---

### TC-22: Billing Overview

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Billing" in sidebar | Billing overview page loads |
| 2 | Fresh database | Empty table or "No invoices" message |
| 3 | After receptionist creates invoices | Invoices appear with all details |
| 4 | Filter by Owner ID | Shows only that owner's invoices |
| 5 | Filter by Date | Shows only invoices from that date |

---

### TC-23: Sidebar Navigation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click each sidebar item | Navigates to the correct page without error |
| 2 | Active item | Active page is highlighted in the sidebar |
| 3 | Collapse sidebar | Click the collapse arrow "‹" — sidebar shrinks to icons only |
| 4 | Footer | Shows user name, role, and logout button |

---

### TC-24: Logout

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click the logout icon in the sidebar footer | ✅ Redirected to login page |
| 2 | Try accessing `/#/admin/dashboard` directly | ✅ Redirected to login (session cleared) |
| 3 | Check localStorage | `token` key should be removed |

---

### TC-25: Session Restore

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as admin | Dashboard loads |
| 2 | Refresh the page (F5) | ✅ Still on dashboard — session persists |
| 3 | Verify greeting | Still shows admin name |

---

## Test Summary Checklist

| # | Test Case | Feature | Status |
|---|-----------|---------|--------|
| 01 | Admin Login | Auth | ☐ |
| 02 | Dashboard Stats | Dashboard | ☐ |
| 03 | Staff View All | Staff | ☐ |
| 04 | Staff Create New | Staff | ☐ |
| 05 | Staff Deactivate/Activate | Staff | ☐ |
| 06 | Staff Self-Deactivation Block | Staff | ☐ |
| 07 | Services View All | Services | ☐ |
| 08 | Services Add New | Services | ☐ |
| 09 | Services Inline Price Edit | Services | ☐ |
| 10 | Services Toggle Active | Services | ☐ |
| 11 | Inventory View & Filter | Inventory | ☐ |
| 12 | Inventory Add Item | Inventory | ☐ |
| 13 | Inventory Stock Adjustment | Inventory | ☐ |
| 14 | Inventory View Logs | Inventory | ☐ |
| 15 | Inventory Low Stock Alert | Inventory | ☐ |
| 16 | Reports — Revenue | Reports | ☐ |
| 17 | Reports — Services | Reports | ☐ |
| 18 | Reports — Appointments | Reports | ☐ |
| 19 | Reports — Inventory | Reports | ☐ |
| 20 | Notifications View Logs | Notifications | ☐ |
| 21 | Notifications Send New | Notifications | ☐ |
| 22 | Billing Overview | Billing | ☐ |
| 23 | Sidebar Navigation | Layout | ☐ |
| 24 | Logout | Auth | ☐ |
| 25 | Session Restore | Auth | ☐ |
