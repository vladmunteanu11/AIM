"""
Configurația aplicației FastAPI pentru Template Primărie Digitală
"""
import os
from typing import Optional, List
from pydantic import validator
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Setările aplicației cu validare automată"""
    
    # App Info
    APP_NAME: str = "Primărie Digitală API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "API pentru Template Primărie Digitală #DigiLocal"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RELOAD: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/primarie_db"
    DATABASE_ECHO: bool = False
    
    # Redis (pentru cache și Celery)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3002", "http://127.0.0.1:3002"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: List[str] = [
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain", "text/csv"
    ]
    
    # Email Configuration
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_USE_TLS: bool = True
    DEFAULT_FROM_EMAIL: str = "noreply@primarie.ro"
    DEFAULT_FROM_NAME: str = "Primăria Exemplu"
    
    # Email Recipients
    ADMIN_EMAILS: List[str] = ["admin@primarie.ro"]
    FORMS_EMAIL: str = "formulare@primarie.ro"
    APPOINTMENTS_EMAIL: str = "programari@primarie.ro"
    
    # Monitoring
    PROMETHEUS_ENABLED: bool = False
    LOG_LEVEL: str = "INFO"
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # Backup
    BACKUP_ENABLED: bool = True
    BACKUP_SCHEDULE: str = "0 2 * * *"  # Daily at 2 AM
    BACKUP_RETENTION_DAYS: int = 30
    
    # Municipality specific
    MUNICIPALITY_NAME: str = "Comuna Exemplu"
    MUNICIPALITY_COUNTY: str = "Județul Exemplu"
    MUNICIPALITY_WEBSITE: str = "https://primarie-exemplu.ro"
    MUNICIPALITY_ADDRESS: str = "Strada Principală nr. 1, Comuna Exemplu"
    MUNICIPALITY_PHONE: str = "0256 123 456"
    MUNICIPALITY_EMAIL: str = "contact@primarie-exemplu.ro"
    FRONTEND_URL: str = "http://localhost:3000"
    
    @validator("ENVIRONMENT")
    def validate_environment(cls, v):
        if v not in ["development", "staging", "production"]:
            raise ValueError("ENVIRONMENT must be development, staging, or production")
        return v
    
    @validator("DATABASE_URL")
    def validate_database_url(cls, v):
        valid_prefixes = [
            "postgresql://", 
            "postgresql+asyncpg://", 
            "postgresql+psycopg2://",
            "postgres://",
            "postgres+asyncpg://",
            "postgres+psycopg2://"
        ]
        if not any(v.startswith(prefix) for prefix in valid_prefixes):
            raise ValueError("DATABASE_URL must be a valid PostgreSQL URL")
        return v
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"
    
    @property
    def database_config(self) -> dict:
        """Configurația pentru SQLAlchemy"""
        return {
            "url": self.DATABASE_URL,
            "echo": self.DATABASE_ECHO and self.is_development,
            "pool_size": 5,
            "max_overflow": 10,
            "pool_pre_ping": True,
            "pool_recycle": 300
        }
    
    @property
    def upload_path(self) -> str:
        """Calea completă pentru directorul de upload-uri"""
        return os.path.abspath(self.UPLOAD_DIR)
    
    class Config:
        env_file = [".env", "../.env", "../../.env"]
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Returnează instanța singleton a setărilor"""
    return Settings()


# Constante pentru aplicație
API_V1_PREFIX = "/api/v1"
STATIC_FILES_PATH = "/static"
MEDIA_FILES_PATH = "/media"

# Tipuri de utilizatori
USER_ROLES = {
    "ADMIN": "admin",
    "EDITOR": "editor", 
    "VIEWER": "viewer"
}

# Statusuri pentru conținut
CONTENT_STATUS = {
    "DRAFT": "draft",
    "PUBLISHED": "published",
    "ARCHIVED": "archived",
    "SCHEDULED": "scheduled"
}

# Statusuri pentru cereri/formulare
FORM_STATUS = {
    "PENDING": "pending",
    "IN_REVIEW": "in_review",
    "APPROVED": "approved",
    "REJECTED": "rejected",
    "COMPLETED": "completed"
}

# Priorități pentru cereri
FORM_PRIORITIES = {
    "LOW": "low",
    "NORMAL": "normal",
    "HIGH": "high",
    "URGENT": "urgent"
}

# Configurația de logging
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        },
        "detailed": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(module)s - %(funcName)s - %(message)s",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": "INFO",
            "formatter": "default",
            "stream": "ext://sys.stdout"
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "INFO",
            "formatter": "detailed",
            "filename": "app.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5
        }
    },
    "loggers": {
        "": {
            "level": "INFO",
            "handlers": ["console", "file"]
        },
        "uvicorn": {
            "level": "INFO",
            "handlers": ["console"],
            "propagate": False
        },
        "sqlalchemy.engine": {
            "level": "WARN",
            "handlers": ["console"],
            "propagate": False
        }
    }
}