"""
Endpoint-uri pentru Monitorul Oficial Local (MOL)
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract, desc, and_, or_
from sqlalchemy.orm import selectinload
from datetime import datetime, date

from ...core.database import get_async_session
from ...models.documents import MOLCategory, MOLDocument
from ...schemas.mol import (
    MOLCategory as MOLCategorySchema,
    MOLCategoryCreate,
    MOLCategoryUpdate,
    MOLDocument as MOLDocumentSchema,
    MOLDocumentCreate,
    MOLDocumentUpdate,
    MOLDocumentWithCategory,
    MOLCategoryWithDocuments,
    MOLSearchFilter,
    MOLStats,
    MOLDocumentResponse
)

router = APIRouter()


@router.get("/categories", response_model=List[MOLCategoryWithDocuments])
async def get_mol_categories(
    include_documents: bool = Query(False, description="Include documentele pentru fiecare categorie"),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține toate categoriile MOL cu numărul de documente
    """
    
    query = select(MOLCategory).order_by(MOLCategory.section_order, MOLCategory.name)
    
    if include_documents:
        query = query.options(selectinload(MOLCategory.documents))
    
    result = await db.execute(query)
    categories = result.scalars().all()
    
    # Calculez numărul de documente pentru fiecare categorie
    categories_with_counts = []
    for category in categories:
        category_dict = {
            "id": category.id,
            "name": category.name,
            "slug": category.slug,
            "description": category.description,
            "is_required": category.is_required,
            "section_order": category.section_order,
            "parent_id": category.parent_id,
            "created_at": category.created_at,
            "documents": category.documents if include_documents else [],
            "document_count": len(category.documents) if include_documents else 0
        }
        
        if not include_documents:
            # Calculez separat numărul de documente
            count_query = select(func.count(MOLDocument.id)).where(
                MOLDocument.category_id == category.id,
                MOLDocument.status == 'published'
            )
            count_result = await db.execute(count_query)
            category_dict["document_count"] = count_result.scalar() or 0
            
        categories_with_counts.append(category_dict)
    
    return categories_with_counts


@router.get("/categories/{category_id}", response_model=MOLCategoryWithDocuments)
async def get_mol_category(
    category_id: int,
    include_documents: bool = Query(True, description="Include documentele categoriei"),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține o categorie MOL specifică cu documentele sale
    """
    
    query = select(MOLCategory).where(MOLCategory.id == category_id)
    
    if include_documents:
        query = query.options(selectinload(MOLCategory.documents))
    
    result = await db.execute(query)
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Categoria MOL nu a fost găsită")
    
    return {
        "id": category.id,
        "name": category.name,
        "slug": category.slug,
        "description": category.description,
        "is_required": category.is_required,
        "section_order": category.section_order,
        "parent_id": category.parent_id,
        "created_at": category.created_at,
        "documents": category.documents if include_documents else [],
        "document_count": len(category.documents) if include_documents else 0
    }


@router.get("/documents", response_model=MOLDocumentResponse)
async def get_mol_documents(
    category_id: Optional[int] = Query(None, description="Filtrează după categorie"),
    year: Optional[int] = Query(None, description="Filtrează după anul publicării"),
    month: Optional[int] = Query(None, description="Filtrează după luna publicării"),
    status: str = Query("published", description="Statusul documentului"),
    is_effective: Optional[bool] = Query(None, description="Doar documente în vigoare"),
    search_query: Optional[str] = Query(None, description="Căutare în titlu și conținut"),
    page: int = Query(1, ge=1, description="Pagina curentă"),
    per_page: int = Query(20, ge=1, le=100, description="Documente per pagină"),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține documentele MOL cu filtrare și paginare
    """
    
    # Construiesc query-ul de bază
    query = select(MOLDocument).options(
        selectinload(MOLDocument.category)
    ).where(MOLDocument.status == status)
    
    # Aplicare filtre
    filters = []
    
    if category_id:
        filters.append(MOLDocument.category_id == category_id)
    
    if year:
        filters.append(extract('year', MOLDocument.published_date) == year)
    
    if month:
        filters.append(extract('month', MOLDocument.published_date) == month)
    
    if is_effective is not None:
        if is_effective:
            # Documente în vigoare
            filters.append(
                or_(
                    MOLDocument.effective_date.is_(None),
                    MOLDocument.effective_date <= date.today()
                )
            )
        else:
            # Documente neîn vigoare
            filters.append(
                and_(
                    MOLDocument.effective_date.is_not(None),
                    MOLDocument.effective_date > date.today()
                )
            )
    
    if search_query:
        search_pattern = f"%{search_query}%"
        filters.append(
            or_(
                MOLDocument.title.ilike(search_pattern),
                MOLDocument.content.ilike(search_pattern),
                MOLDocument.document_number.ilike(search_pattern)
            )
        )
    
    if filters:
        query = query.where(and_(*filters))
    
    # Query pentru total
    count_query = select(func.count(MOLDocument.id))
    if filters:
        count_query = count_query.where(and_(*filters))
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Aplicare paginare și sortare
    query = query.order_by(desc(MOLDocument.published_date)).offset(
        (page - 1) * per_page
    ).limit(per_page)
    
    result = await db.execute(query)
    documents = result.scalars().all()
    
    # Calculez proprietățile pentru fiecare document
    documents_with_props = []
    for doc in documents:
        doc_dict = {
            "id": doc.id,
            "category_id": doc.category_id,
            "title": doc.title,
            "document_number": doc.document_number,
            "description": doc.description,
            "content": doc.content,
            "file_path": doc.file_path,
            "file_name": doc.file_name,
            "file_type": doc.file_type,
            "file_size": doc.file_size,
            "adoption_date": doc.adoption_date,
            "effective_date": doc.effective_date,
            "published_date": doc.published_date,
            "status": doc.status,
            "is_public": doc.is_public,
            "created_by": str(doc.created_by) if doc.created_by else None,
            "created_at": doc.created_at,
            "updated_at": doc.updated_at,
            "is_effective": doc.is_effective,
            "file_size_formatted": doc.file_size_formatted,
            "category": {
                "id": doc.category.id,
                "name": doc.category.name,
                "slug": doc.category.slug,
                "description": doc.category.description,
                "is_required": doc.category.is_required,
                "section_order": doc.category.section_order,
                "parent_id": doc.category.parent_id,
                "created_at": doc.category.created_at
            }
        }
        documents_with_props.append(doc_dict)
    
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "documents": documents_with_props,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "filters_applied": {
            "category_id": category_id,
            "year": year,
            "month": month,
            "status": status,
            "is_effective": is_effective,
            "search_query": search_query
        }
    }


@router.get("/documents/{document_id}", response_model=MOLDocumentWithCategory)
async def get_mol_document(
    document_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține un document MOL specific
    """
    
    query = select(MOLDocument).options(
        selectinload(MOLDocument.category)
    ).where(
        MOLDocument.id == document_id,
        MOLDocument.is_public == True
    )
    
    result = await db.execute(query)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Documentul MOL nu a fost găsit")
    
    return {
        "id": document.id,
        "category_id": document.category_id,
        "title": document.title,
        "document_number": document.document_number,
        "description": document.description,
        "content": document.content,
        "file_path": document.file_path,
        "file_name": document.file_name,
        "file_type": document.file_type,
        "file_size": document.file_size,
        "adoption_date": document.adoption_date,
        "effective_date": document.effective_date,
        "published_date": document.published_date,
        "status": document.status,
        "is_public": document.is_public,
        "created_by": str(document.created_by) if document.created_by else None,
        "created_at": document.created_at,
        "updated_at": document.updated_at,
        "is_effective": document.is_effective,
        "file_size_formatted": document.file_size_formatted,
        "category": {
            "id": document.category.id,
            "name": document.category.name,
            "slug": document.category.slug,
            "description": document.category.description,
            "is_required": document.category.is_required,
            "section_order": document.category.section_order,
            "parent_id": document.category.parent_id,
            "created_at": document.category.created_at
        }
    }


@router.get("/stats", response_model=MOLStats)
async def get_mol_stats(
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține statistici generale pentru MOL
    """
    
    # Total documente
    total_query = select(func.count(MOLDocument.id)).where(
        MOLDocument.status == 'published'
    )
    total_result = await db.execute(total_query)
    total_documents = total_result.scalar() or 0
    
    # Documente pe categorii
    category_query = select(
        MOLCategory.name,
        func.count(MOLDocument.id)
    ).select_from(
        MOLCategory
    ).outerjoin(MOLDocument).group_by(MOLCategory.name)
    
    category_result = await db.execute(category_query)
    documents_by_category = {row[0]: row[1] for row in category_result.fetchall()}
    
    # Documente pe ani
    year_query = select(
        extract('year', MOLDocument.published_date).label('year'),
        func.count(MOLDocument.id)
    ).where(
        MOLDocument.status == 'published'
    ).group_by(extract('year', MOLDocument.published_date)).order_by(
        desc(extract('year', MOLDocument.published_date))
    )
    
    year_result = await db.execute(year_query)
    documents_by_year = {int(row[0]): row[1] for row in year_result.fetchall()}
    
    # Documente recente
    recent_query = select(MOLDocument).options(
        selectinload(MOLDocument.category)
    ).where(
        MOLDocument.status == 'published'
    ).order_by(desc(MOLDocument.created_at)).limit(5)
    
    recent_result = await db.execute(recent_query)
    recent_documents = recent_result.scalars().all()
    
    return {
        "total_documents": total_documents,
        "documents_by_category": documents_by_category,
        "documents_by_year": documents_by_year,
        "recent_documents": [
            {
                "id": doc.id,
                "category_id": doc.category_id,
                "title": doc.title,
                "document_number": doc.document_number,
                "description": doc.description,
                "content": doc.content,
                "file_path": doc.file_path,
                "file_name": doc.file_name,
                "file_type": doc.file_type,
                "file_size": doc.file_size,
                "adoption_date": doc.adoption_date,
                "effective_date": doc.effective_date,
                "published_date": doc.published_date,
                "status": doc.status,
                "is_public": doc.is_public,
                "created_by": str(doc.created_by) if doc.created_by else None,
                "created_at": doc.created_at,
                "updated_at": doc.updated_at,
                "is_effective": doc.is_effective,
                "file_size_formatted": doc.file_size_formatted
            }
            for doc in recent_documents
        ],
        "most_accessed": []  # TODO: implementare tracking accesări
    }


@router.get("/archive/{year}")
async def get_mol_archive_by_year(
    year: int,
    category_id: Optional[int] = Query(None, description="Filtrează după categorie"),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține arhiva MOL pentru un an specific
    """
    
    query = select(MOLDocument).options(
        selectinload(MOLDocument.category)
    ).where(
        extract('year', MOLDocument.published_date) == year,
        MOLDocument.status == 'published'
    )
    
    if category_id:
        query = query.where(MOLDocument.category_id == category_id)
    
    query = query.order_by(desc(MOLDocument.published_date))
    
    result = await db.execute(query)
    documents = result.scalars().all()
    
    return {
        "year": year,
        "category_id": category_id,
        "documents": [
            {
                "id": doc.id,
                "title": doc.title,
                "document_number": doc.document_number,
                "published_date": doc.published_date,
                "category": doc.category.name,
                "file_name": doc.file_name,
                "file_size_formatted": doc.file_size_formatted
            }
            for doc in documents
        ],
        "total": len(documents)
    }