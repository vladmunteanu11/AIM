"""
Aplicația principală FastAPI pentru Template Primărie Digitală
"""
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging.config
import os

from .core.config import get_settings, LOGGING_CONFIG, API_V1_PREFIX
from .core.database import db_connection
from .api import api_router


# Configurarea logging-ului
logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events pentru aplicație"""
    # Startup
    logger.info("🚀 Starting Primărie Digitală API...")
    
    # Inițializarea conexiunii la baza de date
    await db_connection.connect()
    
    # Crearea directorului pentru upload-uri
    os.makedirs(settings.upload_path, exist_ok=True)
    logger.info(f"📁 Upload directory created: {settings.upload_path}")
    
    logger.info(f"✅ API started successfully on {settings.ENVIRONMENT} environment")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Primărie Digitală API...")
    await db_connection.disconnect()
    logger.info("✅ Shutdown completed")


# Crearea aplicației FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    openapi_url=f"{API_V1_PREFIX}/openapi.json" if settings.DEBUG else None,
    docs_url=f"{API_V1_PREFIX}/docs" if settings.DEBUG else None,
    redoc_url=f"{API_V1_PREFIX}/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)


# Middleware pentru CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Middleware pentru trusted hosts (securitate în producție)
if settings.is_production:
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=["primarie.ro", "*.primarie.ro", "localhost", "127.0.0.1"]
    )


# Servirea fișierelor statice
if os.path.exists(settings.upload_path):
    app.mount(
        "/media", 
        StaticFiles(directory=settings.upload_path), 
        name="media"
    )

# Servirea fișierelor statice pentru frontend (dacă există)
if os.path.exists("static"):
    app.mount(
        "/static", 
        StaticFiles(directory="static"), 
        name="static"
    )


# Gestionarea erorilor globale
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handler pentru erorile HTTP"""
    logger.error(f"HTTP error {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler pentru erorile de validare"""
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "message": "Eroare de validare a datelor",
            "details": exc.errors(),
            "status_code": 422
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handler pentru erorile generale"""
    logger.exception(f"Unhandled exception: {str(exc)}")
    
    if settings.is_production:
        message = "A apărut o eroare internă. Vă rugăm să încercați din nou."
    else:
        message = str(exc)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "message": message,
            "status_code": 500
        }
    )


# Middleware pentru logging cererilor
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware pentru logging-ul cererilor HTTP"""
    start_time = time.time()
    
    # Executarea cererii
    response = await call_next(request)
    
    # Calcularea timpului de procesare
    process_time = time.time() - start_time
    
    # Logging
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.4f}s - "
        f"IP: {request.client.host if request.client else 'unknown'}"
    )
    
    # Adăugarea header-ului cu timpul de procesare
    response.headers["X-Process-Time"] = str(process_time)
    
    return response


# Middleware pentru rate limiting (dacă este activat)
if settings.RATE_LIMIT_ENABLED:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Includerea router-ilor API
app.include_router(api_router, prefix=API_V1_PREFIX)


# Endpoint-uri de bază
@app.get("/")
async def root():
    """Endpoint principal - informații despre API"""
    return {
        "message": "Primărie Digitală API",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "documentation": f"{API_V1_PREFIX}/docs" if settings.DEBUG else None
    }


@app.get("/health")
async def health_check():
    """Health check pentru monitoring"""
    try:
        # Verificarea conexiunii la baza de date
        from .core.database import engine
        async with engine.begin() as conn:
            await conn.execute("SELECT 1")
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e) if settings.DEBUG else "Service unavailable"
            }
        )


@app.get(f"{API_V1_PREFIX}/info")
async def api_info():
    """Informații despre API și configurație"""
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "municipality": {
            "name": settings.MUNICIPALITY_NAME,
            "county": settings.MUNICIPALITY_COUNTY,
            "website": settings.MUNICIPALITY_WEBSITE
        },
        "features": {
            "rate_limiting": settings.RATE_LIMIT_ENABLED,
            "prometheus": settings.PROMETHEUS_ENABLED,
            "debug": settings.DEBUG
        }
    }


# Import necesar pentru middleware
import time
from datetime import datetime


def create_app() -> FastAPI:
    """Factory function pentru crearea aplicației"""
    return app


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True
    )