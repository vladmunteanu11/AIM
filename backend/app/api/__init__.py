"""
API Router principal pentru toate endpoint-urile
"""
from fastapi import APIRouter
from .endpoints import (
    auth,
    municipality, 
    content,
    documents,
    forms,
    search
)

# Router principal pentru API v1
api_router = APIRouter()

# Includerea router-ilor pentru fiecare modul
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(municipality.router, prefix="/municipality", tags=["Municipality"])
api_router.include_router(content.router, prefix="/content", tags=["Content Management"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(forms.router, prefix="/forms", tags=["Forms"])
api_router.include_router(search.router, prefix="", tags=["Search"])

__all__ = ["api_router"]