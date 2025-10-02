"""
Simple FastAPI Application for testing JWT authentication with PostgreSQL
"""
import os
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
from .core.database import engine
from .api.endpoints.auth import router as auth_router
from .api.endpoints.forms_simple import router as forms_router
from .api.endpoints.municipality import router as municipality_router
from .api.endpoints.appointments import router as appointments_router
from .api.endpoints.content import router as content_router
from .api.endpoints.navigation import router as navigation_router
from .api.endpoints.search import router as search_router
from .api.endpoints.mol import router as mol_router
from .api.endpoints.notifications import router as notifications_router
from .api.endpoints.files import router as files_router

# Get settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Primărie Digitală API - Simple",
    description="Simple API for testing JWT authentication",
    version="1.0.0",
    debug=True
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(forms_router, prefix="/api/v1", tags=["Forms", "Submissions", "Complaints"])
app.include_router(municipality_router, prefix="/api/v1/municipality", tags=["Municipality"])
app.include_router(appointments_router, prefix="/api/v1/appointments", tags=["Appointments"])
app.include_router(content_router, prefix="/api/v1/content", tags=["Content", "Announcements", "Pages"])
app.include_router(navigation_router, prefix="/api/v1/navigation", tags=["Navigation", "Menu", "Sitemap"])
app.include_router(search_router, prefix="/api/v1/search", tags=["Search", "Full-text Search"])
app.include_router(mol_router, prefix="/api/v1/mol", tags=["MOL", "Monitorul Oficial Local"])
app.include_router(notifications_router, prefix="/api/v1/notifications", tags=["Notifications", "Email"])
app.include_router(files_router, prefix="/api/v1/files", tags=["Files", "Documents", "Upload"])

@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    print(f"🚀 Starting Simple Primărie Digitală API")
    print(f"🗄️  Database: PostgreSQL")
    print(f"🔐 JWT Authentication enabled")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Simple Primărie Digitală API",
        "version": "1.0.0",
        "database": "PostgreSQL",
        "auth": "JWT",
        "docs_url": "/docs"
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
            "auth": "available"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "error",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main_simple:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )