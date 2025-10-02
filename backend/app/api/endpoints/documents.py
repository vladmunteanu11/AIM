"""
Endpoint-uri pentru managementul documentelor și MOL
"""
import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from ...core.database import get_async_session
from ...core.config import get_settings
from ...models.documents import Document, DocumentCategory, MOLDocument, MOLCategory, DocumentDownload
from ...models.admin import AdminAuditLog
from ...schemas.documents import (
    DocumentResponse, DocumentListResponse, DocumentCreate, DocumentUpdate,
    MOLDocumentResponse, MOLDocumentListResponse, MOLDocumentCreate, MOLDocumentUpdate,
    MOLCategoryResponse, DocumentCategoryResponse
)
from ..endpoints.auth import get_current_active_admin
from ...models.admin import AdminUser

router = APIRouter()
settings = get_settings()


# ====================================================================
# DOCUMENT CATEGORIES
# ====================================================================

@router.get("/categories", response_model=List[DocumentCategoryResponse])
async def get_document_categories(
    db: AsyncSession = Depends(get_async_session)
):
    """Obține toate categoriile de documente active"""
    result = await db.execute(
        select(DocumentCategory)
        .where(DocumentCategory.is_active == True)
        .order_by(DocumentCategory.name)
    )
    categories = result.scalars().all()
    return categories


# ====================================================================
# DOCUMENTS MANAGEMENT
# ====================================================================

@router.get("/", response_model=DocumentListResponse)
async def get_documents(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    category_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    file_type: Optional[str] = Query(None),
    public_only: bool = Query(False),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține lista documentelor cu filtrare și paginare
    public_only=True pentru endpoint-uri publice
    """
    query = select(Document).options(selectinload(Document.category))
    
    # Filtru pentru documente publice
    if public_only:
        query = query.where(Document.is_public == True)
    
    # Filtrare după categorie
    if category_id:
        query = query.where(Document.category_id == category_id)
    
    # Filtrare după tipul fișierului
    if file_type:
        query = query.where(Document.file_type == file_type)
    
    # Căutare în titlu și descriere
    if search:
        search_filter = or_(
            Document.title.ilike(f"%{search}%"),
            Document.description.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
    
    # Numărarea totală
    count_query = select(func.count(Document.id))
    if public_only:
        count_query = count_query.where(Document.is_public == True)
    if category_id:
        count_query = count_query.where(Document.category_id == category_id)
    if file_type:
        count_query = count_query.where(Document.file_type == file_type)
    if search:
        count_query = count_query.where(search_filter)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Paginare și ordonare
    query = query.order_by(Document.uploaded_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    documents = result.scalars().all()
    
    return {
        "items": documents,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    title: str = None,
    description: str = None,
    category_id: int = None,
    is_public: bool = True,
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """Upload și creare document nou (admin only)"""
    
    # Validarea tipului de fișier
    if file.content_type not in settings.ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipul de fișier {file.content_type} nu este permis"
        )
    
    # Verificarea dimensiunii
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Fișierul este prea mare. Dimensiunea maximă: {settings.MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Generarea unui nume unic pentru fișier
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(settings.upload_path, "documents", unique_filename)
    
    # Crearea directorului dacă nu există
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Salvarea fișierului
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Eroare la salvarea fișierului: {str(e)}"
        )
    
    # Crearea înregistrării în baza de date
    document = Document(
        title=title or file.filename,
        description=description,
        category_id=category_id,
        file_path=f"documents/{unique_filename}",
        file_name=file.filename,
        file_type=file.content_type,
        file_size=len(content),
        is_public=is_public,
        uploaded_by=current_user.id
    )
    
    db.add(document)
    
    # Audit log
    audit_log = AdminAuditLog.create_log(
        user_id=current_user.id,
        action="upload",
        resource_type="document",
        new_values={
            "title": document.title,
            "file_name": document.file_name,
            "file_size": document.file_size
        },
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(document)
    
    return document


@router.get("/{document_id}/download")
async def download_document(
    request: Request,
    document_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Download document și înregistrare statistică"""
    
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documentul nu a fost găsit"
        )
    
    if not document.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Documentul nu este public"
        )
    
    # Verificarea existenței fișierului
    full_path = os.path.join(settings.upload_path, document.file_path)
    if not os.path.exists(full_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fișierul nu a fost găsit pe disk"
        )
    
    # Incrementarea contorului de descărcări
    document.increment_download_count()
    
    # Înregistrarea statisticii de download
    from datetime import date
    download_stat = DocumentDownload(
        document_id=document_id,
        visitor_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        download_date=date.today()
    )
    db.add(download_stat)
    
    await db.commit()
    
    return FileResponse(
        path=full_path,
        filename=document.file_name,
        media_type=document.file_type
    )


@router.delete("/{document_id}")
async def delete_document(
    request: Request,
    document_id: int,
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """Șterge un document (admin only)"""
    
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documentul nu a fost găsit"
        )
    
    # Ștergerea fișierului de pe disk
    full_path = os.path.join(settings.upload_path, document.file_path)
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except Exception as e:
            # Log error dar continuă cu ștergerea din DB
            print(f"Eroare la ștergerea fișierului {full_path}: {e}")
    
    # Audit log
    audit_log = AdminAuditLog.create_log(
        user_id=current_user.id,
        action="delete",
        resource_type="document",
        resource_id=str(document_id),
        old_values={
            "title": document.title,
            "file_name": document.file_name
        },
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    
    await db.delete(document)
    await db.commit()
    
    return {"message": "Documentul a fost șters cu succes"}


# ====================================================================
# MOL (MONITORUL OFICIAL LOCAL)
# ====================================================================

@router.get("/mol/categories", response_model=List[MOLCategoryResponse])
async def get_mol_categories(
    db: AsyncSession = Depends(get_async_session)
):
    """Obține categoriile MOL conform legislației"""
    result = await db.execute(
        select(MOLCategory)
        .order_by(MOLCategory.section_order.nulls_last(), MOLCategory.name)
    )
    categories = result.scalars().all()
    return categories


@router.get("/mol", response_model=MOLDocumentListResponse)
async def get_mol_documents(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    public_only: bool = Query(True),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține documentele din Monitorul Oficial Local
    Endpoint principal pentru afișarea MOL conform legislației
    """
    query = select(MOLDocument).options(selectinload(MOLDocument.category))
    
    # Filtru pentru documente publice
    if public_only:
        query = query.where(
            and_(
                MOLDocument.is_public == True,
                MOLDocument.status == "published"
            )
        )
    
    # Filtrare după categorie
    if category_id:
        query = query.where(MOLDocument.category_id == category_id)
    
    # Filtrare după an
    if year:
        from sqlalchemy import extract
        query = query.where(extract('year', MOLDocument.published_date) == year)
    
    # Căutare
    if search:
        search_filter = or_(
            MOLDocument.title.ilike(f"%{search}%"),
            MOLDocument.document_number.ilike(f"%{search}%"),
            MOLDocument.description.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
    
    # Numărarea totală
    count_query = select(func.count(MOLDocument.id))
    if public_only:
        count_query = count_query.where(
            and_(
                MOLDocument.is_public == True,
                MOLDocument.status == "published"
            )
        )
    if category_id:
        count_query = count_query.where(MOLDocument.category_id == category_id)
    if year:
        count_query = count_query.where(extract('year', MOLDocument.published_date) == year)
    if search:
        count_query = count_query.where(search_filter)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Ordonare după data publicării (cele mai recente primul)
    query = query.order_by(MOLDocument.published_date.desc(), MOLDocument.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    documents = result.scalars().all()
    
    return {
        "items": documents,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }


@router.post("/mol", response_model=MOLDocumentResponse)
async def create_mol_document(
    request: Request,
    document_data: MOLDocumentCreate,
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """Creează un document MOL nou (admin only)"""
    
    # Verifică dacă categoria MOL există
    result = await db.execute(
        select(MOLCategory).where(MOLCategory.id == document_data.category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Categoria MOL nu există"
        )
    
    # Creează documentul MOL
    mol_document = MOLDocument(
        **document_data.dict(),
        created_by=current_user.id
    )
    
    db.add(mol_document)
    
    # Audit log
    audit_log = AdminAuditLog.create_log(
        user_id=current_user.id,
        action="create",
        resource_type="mol_document",
        new_values=document_data.dict(),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(mol_document)
    
    return mol_document


@router.get("/mol/{document_id}/download")
async def download_mol_document(
    request: Request,
    document_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Download document MOL și înregistrare statistică"""
    
    result = await db.execute(select(MOLDocument).where(MOLDocument.id == document_id))
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documentul MOL nu a fost găsit"
        )
    
    if not document.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Documentul nu este public"
        )
    
    if not document.file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documentul nu are fișier atașat"
        )
    
    # Verificarea existenței fișierului
    full_path = os.path.join(settings.upload_path, document.file_path)
    if not os.path.exists(full_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fișierul nu a fost găsit pe disk"
        )
    
    # Înregistrarea statisticii de download
    from datetime import date
    download_stat = DocumentDownload(
        mol_document_id=document_id,
        visitor_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        download_date=date.today()
    )
    db.add(download_stat)
    
    await db.commit()
    
    return FileResponse(
        path=full_path,
        filename=document.file_name or f"MOL_{document.document_number}.pdf",
        media_type=document.file_type or "application/pdf"
    )


@router.get("/stats/downloads")
async def get_download_statistics(
    days: int = Query(30, ge=1, le=365),
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """Obține statistici de download pentru ultimele N zile (admin only)"""
    
    from datetime import date, timedelta
    from sqlalchemy import func, desc
    
    start_date = date.today() - timedelta(days=days)
    
    # Statistici generale
    total_downloads = await db.execute(
        select(func.count(DocumentDownload.id))
        .where(DocumentDownload.download_date >= start_date)
    )
    
    # Top documente descărcate
    top_documents = await db.execute(
        select(
            Document.title,
            func.count(DocumentDownload.id).label('downloads')
        )
        .join(DocumentDownload, Document.id == DocumentDownload.document_id)
        .where(DocumentDownload.download_date >= start_date)
        .group_by(Document.id, Document.title)
        .order_by(desc('downloads'))
        .limit(10)
    )
    
    # Descărcări pe zile
    daily_downloads = await db.execute(
        select(
            DocumentDownload.download_date,
            func.count(DocumentDownload.id).label('downloads')
        )
        .where(DocumentDownload.download_date >= start_date)
        .group_by(DocumentDownload.download_date)
        .order_by(DocumentDownload.download_date)
    )
    
    return {
        "total_downloads": total_downloads.scalar(),
        "period_days": days,
        "top_documents": [
            {"title": row.title, "downloads": row.downloads}
            for row in top_documents.all()
        ],
        "daily_downloads": [
            {"date": row.download_date, "downloads": row.downloads}
            for row in daily_downloads.all()
        ]
    }