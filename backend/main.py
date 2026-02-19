from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.auth.routes import router as auth_router
from backend.app.admin.routes import router as admin_router
from backend.app.receptionist.routes import router as receptionist_router
from backend.app.doctor.routes import router as doctor_router
from backend.app.billing.routes import router as billing_router
from backend.app.inventory.routes import router as inventory_router
from backend.app.reports.routes import router as reports_router
from backend.app.notifications.routes import router as notifications_router
from backend.app.website.routes import router as website_router
from backend.app.db.session import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create all tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: nothing needed for now


app = FastAPI(
    title="Pet Clinic API",
    description="Clinic Management Backend",
    version="1.0.0",
    lifespan=lifespan,
    # Hide docs in production
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# CORS — driven by ALLOWED_ORIGINS env var
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(receptionist_router)
app.include_router(doctor_router)
app.include_router(billing_router)
app.include_router(inventory_router)
app.include_router(reports_router)
app.include_router(notifications_router)
app.include_router(website_router)


@app.get("/health")
def health():
    return {"status": "ok", "environment": settings.ENVIRONMENT}
