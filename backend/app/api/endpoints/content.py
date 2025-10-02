"""
Endpoint-uri pentru managementul conținutului (pagini și anunțuri)
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload

from ...core.database import get_async_session
from ...models.content import Page, Announcement, ContentCategory, AnnouncementCategory
from ...models.admin import AdminAuditLog
from ...schemas.content import (
    PageCreate, PageUpdate, PageResponse, PageListResponse,
    AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse, AnnouncementListResponse,
    ContentCategoryResponse, AnnouncementCategoryResponse
)
from ..endpoints.auth import get_current_active_admin, get_current_user
from ...models.admin import AdminUser

router = APIRouter()


# ====================================================================
# CONTENT CATEGORIES
# ====================================================================

@router.get("/categories", response_model=List[ContentCategoryResponse])
async def get_content_categories(
    db: AsyncSession = Depends(get_async_session)
):
    """Obține toate categoriile de conținut active"""
    result = await db.execute(
        select(ContentCategory)
        .where(ContentCategory.is_active == True)
        .order_by(ContentCategory.menu_order, ContentCategory.name)
    )
    categories = result.scalars().all()
    return categories


# ====================================================================
# PAGES MANAGEMENT
# ====================================================================

@router.get("/pages", response_model=PageListResponse)
async def get_pages(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    status: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    published_only: bool = Query(False),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține lista paginilor cu filtrare și paginare
    published_only=True pentru endpoint-uri publice
    """
    query = select(Page).options(selectinload(Page.category))
    
    # Filtru pentru pagini publicate doar pentru vizitatori
    if published_only:
        query = query.where(Page.status == "published")
    
    # Filtrare după status
    if status:
        query = query.where(Page.status == status)
    
    # Filtrare după categorie
    if category_id:
        query = query.where(Page.category_id == category_id)
    
    # Căutare în titlu și conținut
    if search:
        search_filter = or_(
            Page.title.ilike(f"%{search}%"),
            Page.content.ilike(f"%{search}%"),
            Page.excerpt.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
    
    # Numărarea totală
    count_query = select(func.count(Page.id))
    if published_only:
        count_query = count_query.where(Page.status == "published")
    if status:
        count_query = count_query.where(Page.status == status)
    if category_id:
        count_query = count_query.where(Page.category_id == category_id)
    if search:
        count_query = count_query.where(search_filter)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Paginare și ordonare
    query = query.order_by(Page.menu_order, Page.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    pages = result.scalars().all()
    
    return {
        "items": pages,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }


@router.get("/pages/{slug}", response_model=PageResponse)
async def get_page_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_async_session)
):
    """Obține o pagină după slug (endpoint public)"""
    result = await db.execute(
        select(Page)
        .options(selectinload(Page.category))
        .where(
            and_(
                Page.slug == slug,
                Page.status == "published"
            )
        )
    )
    page = result.scalar_one_or_none()
    
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pagina nu a fost găsită"
        )
    
    return page


@router.post("/pages", response_model=PageResponse)
async def create_page(
    request: Request,
    page_data: PageCreate,
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """Creează o pagină nouă (admin only)"""
    
    # Verifică dacă slug-ul este unic
    existing = await db.execute(select(Page).where(Page.slug == page_data.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O pagină cu acest slug există deja"
        )
    
    # Creează pagina
    page = Page(
        **page_data.dict(),
        created_by=current_user.id,
        updated_by=current_user.id
    )
    
    # Setează published_at dacă statusul este published
    if page.status == "published" and not page.published_at:
        from datetime import datetime
        page.published_at = datetime.utcnow()
    
    db.add(page)
    
    # Audit log
    audit_log = AdminAuditLog.create_log(
        user_id=current_user.id,
        action="create",
        resource_type="page",
        new_values=page_data.dict(),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(page)
    
    return page


@router.put("/pages/{page_id}", response_model=PageResponse)
async def update_page(
    request: Request,
    page_id: int,
    page_data: PageUpdate,
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """Actualizează o pagină (admin only)"""
    
    result = await db.execute(select(Page).where(Page.id == page_id))
    page = result.scalar_one_or_none()
    
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pagina nu a fost găsită"
        )
    
    # Salvează valorile vechi pentru audit
    old_values = {
        "title": page.title,
        "slug": page.slug,
        "content": page.content,
        "status": page.status
    }
    
    # Verifică unicitatea slug-ului dacă se schimbă
    update_data = page_data.dict(exclude_unset=True)
    if "slug" in update_data and update_data["slug"] != page.slug:
        existing = await db.execute(
            select(Page).where(
                and_(Page.slug == update_data["slug"], Page.id != page_id)
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O pagină cu acest slug există deja"
            )
    
    # Actualizează câmpurile
    for field, value in update_data.items():
        setattr(page, field, value)
    
    page.updated_by = current_user.id
    
    # Setează published_at dacă statusul devine published
    if update_data.get("status") == "published" and not page.published_at:
        from datetime import datetime
        page.published_at = datetime.utcnow()
    
    # Audit log
    audit_log = AdminAuditLog.create_log(
        user_id=current_user.id,
        action="update",
        resource_type="page",
        resource_id=str(page_id),
        old_values=old_values,
        new_values=update_data,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(page)
    
    return page


@router.delete("/pages/{page_id}")
async def delete_page(
    request: Request,
    page_id: int,
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """Șterge o pagină (admin only)"""
    
    result = await db.execute(select(Page).where(Page.id == page_id))
    page = result.scalar_one_or_none()
    
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pagina nu a fost găsită"
        )
    
    # Audit log
    audit_log = AdminAuditLog.create_log(
        user_id=current_user.id,
        action="delete",
        resource_type="page",
        resource_id=str(page_id),
        old_values={
            "title": page.title,
            "slug": page.slug,
            "status": page.status
        },
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    
    await db.delete(page)
    await db.commit()
    
    return {"message": "Pagina a fost ștearsă cu succes"}


# ====================================================================
# ANNOUNCEMENTS MANAGEMENT
# ====================================================================

@router.get("/announcement-categories", response_model=List[AnnouncementCategoryResponse])
async def get_announcement_categories(
    db: AsyncSession = Depends(get_async_session)
):
    """Obține toate categoriile de anunțuri active"""
    result = await db.execute(
        select(AnnouncementCategory)
        .where(AnnouncementCategory.is_active == True)
        .order_by(AnnouncementCategory.name)
    )
    categories = result.scalars().all()
    return categories


@router.get("/announcements", response_model=AnnouncementListResponse)
async def get_announcements(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    status: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    is_featured: Optional[bool] = Query(None),
    is_urgent: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    published_only: bool = Query(False),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține lista anunțurilor cu filtrare și paginare
    published_only=True pentru endpoint-uri publice
    """
    query = select(Announcement).options(selectinload(Announcement.category))
    
    # Filtru pentru anunțuri publicate și valide
    if published_only:
        from datetime import datetime
        now = datetime.utcnow()
        query = query.where(
            and_(
                Announcement.status == "published",
                or_(
                    Announcement.published_at.is_(None),
                    Announcement.published_at <= now
                ),
                or_(
                    Announcement.expires_at.is_(None),
                    Announcement.expires_at > now
                )
            )
        )
    
    # Filtre administrative
    if status:
        query = query.where(Announcement.status == status)
    if category_id:
        query = query.where(Announcement.category_id == category_id)
    if is_featured is not None:
        query = query.where(Announcement.is_featured == is_featured)
    if is_urgent is not None:
        query = query.where(Announcement.is_urgent == is_urgent)
    
    # Căutare
    if search:
        search_filter = or_(
            Announcement.title.ilike(f"%{search}%"),
            Announcement.content.ilike(f"%{search}%"),
            Announcement.excerpt.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
    
    # Numărarea totală cu aceleași filtre
    count_query = select(func.count(Announcement.id))
    if published_only:
        from datetime import datetime
        now = datetime.utcnow()
        count_query = count_query.where(
            and_(
                Announcement.status == "published",
                or_(
                    Announcement.published_at.is_(None),
                    Announcement.published_at <= now
                ),
                or_(
                    Announcement.expires_at.is_(None),
                    Announcement.expires_at > now
                )
            )
        )
    if status:
        count_query = count_query.where(Announcement.status == status)
    if category_id:
        count_query = count_query.where(Announcement.category_id == category_id)
    if search:
        count_query = count_query.where(search_filter)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Ordonare: urgente -> featured -> data publicării
    query = query.order_by(
        Announcement.is_urgent.desc(),
        Announcement.is_featured.desc(),
        Announcement.published_at.desc().nulls_last(),
        Announcement.created_at.desc()
    )
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    announcements = result.scalars().all()
    
    return {
        "items": announcements,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }


@router.get("/announcements/{slug}", response_model=AnnouncementResponse)
async def get_announcement_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_async_session)
):
    """Obține un anunț după slug și incrementează view count"""
    result = await db.execute(
        select(Announcement)
        .options(selectinload(Announcement.category))
        .where(
            and_(
                Announcement.slug == slug,
                Announcement.status == "published"
            )
        )
    )
    announcement = result.scalar_one_or_none()
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anunțul nu a fost găsit"
        )
    
    # Verifică dacă anunțul nu a expirat
    if announcement.is_expired:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Anunțul a expirat"
        )
    
    # Incrementează contorul de vizualizări
    announcement.increment_view_count()
    await db.commit()
    
    return announcement


@router.post("/announcements", response_model=AnnouncementResponse)
async def create_announcement(
    request: Request,
    announcement_data: AnnouncementCreate,
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """Creează un anunț nou (admin only)"""
    
    # Verifică unicitatea slug-ului
    existing = await db.execute(
        select(Announcement).where(Announcement.slug == announcement_data.slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un anunț cu acest slug există deja"
        )
    
    # Creează anunțul
    announcement = Announcement(
        **announcement_data.dict(),
        created_by=current_user.id,
        updated_by=current_user.id
    )
    
    # Setează published_at dacă statusul este published
    if announcement.status == "published" and not announcement.published_at:
        from datetime import datetime
        announcement.published_at = datetime.utcnow()
    
    db.add(announcement)
    
    # Audit log
    audit_log = AdminAuditLog.create_log(
        user_id=current_user.id,
        action="create",
        resource_type="announcement",
        new_values=announcement_data.dict(),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(announcement)
    
    return announcement


@router.put("/announcements/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(
    request: Request,
    announcement_id: int,
    announcement_data: AnnouncementUpdate,
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """Actualizează un anunț (admin only)"""
    
    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id)
    )
    announcement = result.scalar_one_or_none()
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anunțul nu a fost găsit"
        )
    
    # Salvează valorile vechi
    old_values = {
        "title": announcement.title,
        "slug": announcement.slug,
        "status": announcement.status,
        "is_featured": announcement.is_featured,
        "is_urgent": announcement.is_urgent
    }
    
    # Verifică unicitatea slug-ului dacă se schimbă
    update_data = announcement_data.dict(exclude_unset=True)
    if "slug" in update_data and update_data["slug"] != announcement.slug:
        existing = await db.execute(
            select(Announcement).where(
                and_(
                    Announcement.slug == update_data["slug"],
                    Announcement.id != announcement_id
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un anunț cu acest slug există deja"
            )
    
    # Actualizează câmpurile
    for field, value in update_data.items():
        setattr(announcement, field, value)
    
    announcement.updated_by = current_user.id
    
    # Setează published_at dacă statusul devine published
    if update_data.get("status") == "published" and not announcement.published_at:
        from datetime import datetime
        announcement.published_at = datetime.utcnow()
    
    # Audit log
    audit_log = AdminAuditLog.create_log(
        user_id=current_user.id,
        action="update",
        resource_type="announcement",
        resource_id=str(announcement_id),
        old_values=old_values,
        new_values=update_data,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(announcement)
    
    return announcement


@router.delete("/announcements/{announcement_id}")
async def delete_announcement(
    request: Request,
    announcement_id: int,
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """Șterge un anunț (admin only)"""
    
    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id)
    )
    announcement = result.scalar_one_or_none()
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anunțul nu a fost găsit"
        )
    
    # Audit log
    audit_log = AdminAuditLog.create_log(
        user_id=current_user.id,
        action="delete",
        resource_type="announcement",
        resource_id=str(announcement_id),
        old_values={
            "title": announcement.title,
            "slug": announcement.slug,
            "status": announcement.status
        },
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    
    await db.delete(announcement)
    await db.commit()
    
    return {"message": "Anunțul a fost șters cu succes"}