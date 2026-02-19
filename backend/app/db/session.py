from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.core.config import settings

# NeonDB requires psycopg3 (psycopg) — swap dialect from postgresql to postgresql+psycopg
_db_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(
    _db_url,
    echo=settings.ENVIRONMENT == "development",
    pool_pre_ping=True,       # detect stale connections (important for NeonDB serverless)
    pool_recycle=300,         # recycle connections every 5 min
    connect_args={
        "sslmode": "require",
    },
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
