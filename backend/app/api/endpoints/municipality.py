"""
Endpoint-uri pentru managementul configurației primăriei
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...core.database import get_async_session
from ...models.municipality import MunicipalityConfig
from ...models.admin import AdminAuditLog
from ...schemas.municipality import (
    MunicipalityConfigResponse,
    MunicipalityConfigUpdate,
    MunicipalityConfigCreate
)
from ..endpoints.auth import get_current_active_admin
from ...models.admin import AdminUser

router = APIRouter()


@router.get("/config", response_model=MunicipalityConfigResponse)
async def get_municipality_config(
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține configurația curentă a primăriei
    Endpoint public pentru frontend
    """
    result = await db.execute(select(MunicipalityConfig))
    config = result.scalar_one_or_none()
    
    if not config:
        # Creează o configurație implicită dacă nu există
        config = MunicipalityConfig.create_default_config(
            name="Primăria Exemplu",
            official_name="Comuna Exemplu, Județul Exemplu", 
            county="Exemplu",
            address="Strada Principală nr. 1, Comuna Exemplu"
        )
        db.add(config)
        await db.commit()
        await db.refresh(config)
    
    return config


@router.put("/config", response_model=MunicipalityConfigResponse)
async def update_municipality_config(
    request: Request,
    config_update: MunicipalityConfigUpdate,
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Actualizează configurația primăriei
    Necesită privilegii de admin
    """
    result = await db.execute(select(MunicipalityConfig))
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configurația primăriei nu a fost găsită"
        )
    
    # Salvarea valorilor vechi pentru audit
    old_values = {
        "name": config.name,
        "official_name": config.official_name,
        "county": config.county,
        "mayor_name": config.mayor_name,
        "contact_email": config.contact_email,
        "contact_phone": config.contact_phone,
        "address": config.address,
        "primary_color": config.primary_color,
        "secondary_color": config.secondary_color
    }
    
    # Actualizarea doar a câmpurilor furnizate
    update_data = config_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    
    # Log audit pentru modificare
    audit_log = AdminAuditLog.create_log(
        user_id=current_user.id,
        action="update",
        resource_type="municipality_config",
        resource_id=str(config.id),
        old_values=old_values,
        new_values=update_data,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(config)
    
    return config


@router.post("/config", response_model=MunicipalityConfigResponse)
async def create_municipality_config(
    request: Request,
    config_create: MunicipalityConfigCreate,
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Creează configurația inițială a primăriei
    Se folosește doar la prima configurare
    """
    # Verifică dacă există deja o configurație
    result = await db.execute(select(MunicipalityConfig))
    existing_config = result.scalar_one_or_none()
    
    if existing_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configurația primăriei există deja. Folosiți PUT pentru actualizare."
        )
    
    # Crearea noii configurații
    config = MunicipalityConfig(**config_create.dict())
    db.add(config)
    
    # Log audit pentru creare
    audit_log = AdminAuditLog.create_log(
        user_id=current_user.id,
        action="create",
        resource_type="municipality_config",
        new_values=config_create.dict(),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(config)
    
    return config


@router.get("/info")
async def get_public_info(
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține informațiile publice ale primăriei
    Endpoint optimizat pentru afișarea pe site
    """
    result = await db.execute(select(MunicipalityConfig))
    config = result.scalar_one_or_none()
    
    if not config:
        return {
            "name": "Primăria Exemplu",
            "official_name": "Comuna Exemplu, Județul Exemplu",
            "county": "Exemplu"
        }
    
    return {
        "name": config.name,
        "official_name": config.official_name,
        "county": config.county,
        "mayor_name": config.mayor_name,
        "contact_info": config.contact_info,
        "working_hours": config.get_working_hours_display(),
        "audience_hours": config.get_audience_hours_display(),
        "brand_colors": config.brand_colors,
        "logo_url": config.logo_url,
        "coat_of_arms_url": config.coat_of_arms_url,
        "website_url": config.website_url
    }


@router.get("/contact")
async def get_contact_info(
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține doar informațiile de contact
    Pentru pagina de contact și footer
    """
    result = await db.execute(select(MunicipalityConfig))
    config = result.scalar_one_or_none()
    
    if not config:
        return {
            "message": "Informațiile de contact nu sunt configurate"
        }
    
    return {
        "contact_email": config.contact_email,
        "contact_phone": config.contact_phone,
        "fax": config.fax,
        "address": config.full_address,
        "working_hours": config.get_working_hours_display(),
        "audience_hours": config.get_audience_hours_display()
    }


@router.get("/branding")
async def get_branding_info(
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține informațiile de branding pentru frontend
    Culori, logo, etc.
    """
    result = await db.execute(select(MunicipalityConfig))
    config = result.scalar_one_or_none()
    
    if not config:
        return {
            "primary_color": "#004990",
            "secondary_color": "#0079C1",
            "logo_url": None,
            "coat_of_arms_url": None
        }
    
    return {
        "primary_color": config.primary_color,
        "secondary_color": config.secondary_color,
        "logo_url": config.logo_url,
        "coat_of_arms_url": config.coat_of_arms_url,
        "name": config.name,
        "official_name": config.official_name
    }