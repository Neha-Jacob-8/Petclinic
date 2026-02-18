# VetCore — Pet Clinic Management System

**VetCore** is a modern, full-stack clinic management system designed for veterinary practices. It streamlines operations for administrators, doctors, and receptionists through role-based dashboards, automated billing, inventory tracking, and electronic medical records.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React%2019-61dafb?logo=react)
![FastAPI](https://img.shields.io/badge/backend-FastAPI-05998b?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL%2016-336791?logo=postgresql)

---

## ✨ Features

### 🔐 Multi-Role Authentication
- **Role-Based Access Control (RBAC)**: Secure access tailored for Admin, Doctor, and Receptionist roles.
- **JWT Protection**: Secure API communication with persistent sessions.
- **Protected Routes**: Navigation strictly enforced by user permissions.

### 🛠️ Admin Suite
- **Comprehensive Analytics**: Real-time dashboards for revenue, appointment trends, and service performance using dynamic charts.
- **Staff Management**: Full control over staff accounts with activation/deactivation safeguards.
- **Inventory Engine**: Smart tracking of medicines and vaccines with low-stock alerts and expiry monitoring.
- **Global Billing View**: Oversight of all clinic financial transactions.

### 🩺 Doctor Module
- **Daily Timeline**: Clear view of scheduled and walk-in appointments.
- **Electronic Health Records (EHR)**: Standardized forms for diagnosis, symptoms, treatment, and prescriptions.
- **Patient History**: Instant access to a pet's complete medical history.

### 📅 Receptionist Portal
- **Smart Scheduling**: Intuitive appointment management for both new and existing patients.
- **Client & Pet CRM**: Seamless registration of owners and their pets with unique ID tracking.
- **Automated Billing**: Dynamic invoice generator with line-item building and instant payment processing.

---

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide-React.
- **Backend**: FastAPI, SQLAlchemy, Pydantic, PostgreSQL, Redis.
- **Deployment**: Docker, Docker Compose.

---

## 🛠️ Installation & Setup

### Prerequisites
- [Docker](https://www.docker.com/get-started) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (for local frontend development)
- [Python 3.9+](https://www.python.org/) (for local backend development)

### Quick Start with Docker
The easiest way to get the system running is via Docker:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/petclinic.git
cd petclinic

# 2. Spin up the infrastructure (Postgres & Redis)
docker-compose up -d

# 3. Setup and run Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r ../requirements.txt
uvicorn backend.main:app --reload

# 4. Setup and run Frontend
cd ../vetcore-pet-clinic
npm install
npm run dev
```

The application will be accessible at:
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000/docs`

---

## 📂 Project Structure

```text
├── backend/                # FastAPI Application
│   ├── app/                # Core Application Logic
│   │   ├── admin/          # Admin role routes and services
│   │   ├── doctor/         # Doctor role routes and services
│   │   ├── receptionist/   # Receptionist role routes and services
│   │   ├── auth/           # JWT & Authentication
│   │   └── ...             # Inventory, Billing, Reports modules
│   └── main.py             # Entry point
├── vetcore-pet-clinic/     # React Application (Vite/TS)
│   ├── pages/              # Role-specific dashboard pages
│   ├── components/         # Reusable UI components
│   └── api/                # Axios instance and service calls
├── docker-compose.yml      # Infrastructure (DB & Cache)
└── requirements.txt        # Python dependencies
```

---

## 👤 Sample Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |
| **Doctor** | `drsmith` | `doctor123` |
| **Receptionist** | `reception` | `reception123` |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
