"""
Development FastAPI Application for Template Primărie Digitală with PostgreSQL
"""
import os
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load environment variables
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent.parent / '.env'
    load_dotenv(env_path)
    print(f"Loaded .env from: {env_path}")
except ImportError:
    print("python-dotenv not installed. Using system environment variables only.")
except Exception as e:
    print(f"Error loading .env: {e}")

# Import core modules
from .core.config import get_settings
from .core.database import engine, get_async_session
from .api.endpoints import auth, municipality, content, documents, forms, payments, search

# Get settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Include API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(municipality.router, prefix="/api/v1/municipality", tags=["Municipality"])
app.include_router(content.router, prefix="/api/v1/content", tags=["Content"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(forms.router, prefix="/api/v1/forms", tags=["Forms"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(search.router, prefix="/api/v1/search", tags=["Search"])

# Mount static files
uploads_dir = Path(settings.UPLOAD_DIR)
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

static_dir = Path("app/static")
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"🔧 Environment: {settings.ENVIRONMENT}")
    print(f"🗄️  Database: PostgreSQL")
    print(f"📊 Debug mode: {settings.DEBUG}")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    print("👋 Shutting down Template Primărie Digitală API")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Template Primărie Digitală API",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "PostgreSQL",
        "docs_url": "/docs",
        "health_check": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        async with engine.begin() as conn:
            await conn.execute("SELECT 1")
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected",
            "environment": settings.ENVIRONMENT
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "error",
            "error": str(e),
            "environment": settings.ENVIRONMENT
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main_dev_postgres:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower()
    )