# VetCore — Technical Project Specification & Reference

This document provides a deep-dive into the **VetCore Pet Clinic Management System**. It is designed to serve as a comprehensive context source for developers or AI prompting to generate further documentation, tests, or feature extensions.

---

## 1. System Overview
VetCore is a role-based clinic management platform. It uses a **decoupled architecture** with a FastAPI backend serving a React SPA frontend. The system is designed for high consistency in data handling (PostgreSQL) and rapid response for stateful UI.

### Key Roles & Permissions
- **Admin**: Full system access (Staff, Services, Inventory, Financial Reports).
- **Receptionist**: Client-facing operations (Registration, Scheduling, Billing, Payments).
- **Doctor**: Medical operations (Appointments timeline, EHR entries, Patient history).

---

## 2. Technology Stack

### Backend (Python/FastAPI)
- **Framework**: FastAPI (Asynchronous API)
- **ORM**: SQLAlchemy 2.0 (Declarative Mapping)
- **Validation**: Pydantic v2 (Data modeling & schemas)
- **Authentication**: JWT (JSON Web Tokens) with `python-jose` and `passlib` (bcrypt).
- **Database**: PostgreSQL 16
- **Cache/Task Queue**: Redis 7
- **Development**: Uvicorn (ASGI Server)

### Frontend (React/TypeScript)
- **Core**: React 19 (Functional Components + Hooks)
- **Build Tool**: Vite
- **Language**: TypeScript (Strict typing)
- **State Management**: React Context API & Local State
- **Routing**: React Router 7 (HashRouter for compatibility)
- **Styling**: Tailwind CSS
- **Visualization**: Recharts (Dashboard & Reports)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

---

## 3. Database Schema (Logical Entities)

### Core Models
- **Staff**: `id`, `name`, `username`, `email`, `hashed_password`, `role` (Admin/Doctor/Receptionist), `is_active`.
- **Owner**: `id`, `name`, `phone`, `email`, `address`.
- **Pet**: `id`, `owner_id`, `name`, `species` (Dog, Cat, etc.), `breed`, `age`.
- **Service**: `id`, `name`, `category`, `price`, `is_active`.
- **InventoryItem**: `id`, `name`, `category`, `quantity`, `unit`, `reorder_level`, `cost_price`, `expiry_date`.
- **Appointment**: `id`, `owner_id`, `pet_id`, `date`, `time`, `type` (Scheduled/Walk-in), `status` (Scheduled/Completed/Cancelled), `notes`.
- **MedicalRecord**: `id`, `appointment_id`, `pet_id`, `diagnosis`, `symptoms`, `treatment`, `prescription`, `notes`.
- **Invoice**: `id`, `owner_id`, `appointment_id`, `total_amount`, `discount_pct`, `final_amount`, `status` (Paid/Pending), `payment_method`.
- **InvoiceItem**: `id`, `invoice_id`, `service_id`, `quantity`, `unit_price`, `subtotal`.

---

## 4. API Architecture

The backend is structured into domain-specific routers included in `main.py`:

- `/auth`: Login (`/login`), Session recovery (`/me`).
- `/admin`: Staff management, System settings.
- `/receptionist`: Owner/Pet CRUD, Appointment booking.
- `/doctor`: Today's appointments, Medical record creation.
- `/billing`: Service catalog, Invoice generation, Payment processing.
- `/inventory`: CRUD for supplies, Stock adjustment logs.
- `/reports`: Dashboard stats, Financial charts, Inventory alerts.
- `/notifications`: SMS/WhatsApp/Email logs (mocked backend).

---

## 5. Critical Workflows

### 5.1 The Patient Lifecycle
1. **Registration**: Receptionist creates an `Owner` profile and registers one or more `Pets`.
2. **Scheduling**: Receptionist creates an `Appointment`.
3. **Examination**: Doctor sees the appointment on their dashboard, completes the visit, and files a `MedicalRecord`.
4. **Billing**: Receptionist creates an `Invoice` linked to the completed appointment, adding `Services` as line items.
5. **Payment**: Receptionist processes payment, updating the `Invoice` status to `Paid`.

### 5.2 Managed Inventory
- Items are tracked by `quantity` and `reorder_level`.
- When an item falls below the level, it triggers a "Low Stock" alert on the Admin/Inventory reports.
- Stock adjustments are logged with a reason for accountability.

---

## 6. Frontend Navigation Structure

### Common Components
- `MainLayout`: Sidebar navigation, Header with user profile/logout.
- `StatCard`: Reusable dashboard widget.
- `DataTable`: Generic table with search/filter capabilities.
- `Modal`: Accessible dialogs for forms.

### Protected Routing
- Implementation in `ProtectedRoute.tsx`.
- Token check on mount.
- Role verification before rendering child components.

---

## 7. Environment Variables

### Root `.env`
- `DATABASE_URL`: Postgres connection string.
- `SECRET_KEY`: JWT signing secret.
- `ALGORITHM`: (e.g., HS256).
- `ACCESS_TOKEN_EXPIRE_MINUTES`.

### Frontend `.env.local`
- `VITE_API_URL`: Points to backend (default: `http://localhost:8000`).

---

## 8. Deployment Strategy
- **Containerization**: Single `docker-compose.yml` defining `postgres` and `redis`.
- **Frontend Build**: `npm run build` outputs static files to `/dist`.
- **Backend Entry**: `uvicorn backend.main:app`.
