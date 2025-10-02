"""
Endpoint-uri pentru căutarea avansată în conținutul site-ului
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_async_session
from ...services.search_service import SearchService

router = APIRouter()


@router.get("/")
async def search_content(
    q: str = Query(..., description="Termenul de căutare", min_length=2),
    content_types: Optional[List[str]] = Query(None, description="Tipuri de conținut (page, announcement, form_submission, appointment)"),
    category: Optional[str] = Query(None, description="Filtru după categorie"),
    limit: int = Query(20, ge=1, le=100, description="Numărul maxim de rezultate"),
    offset: int = Query(0, ge=0, description="Offset pentru paginare"),
    db: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Căutare avansată în tot conținutul site-ului
    
    Suportă:
    - Full-text search în română cu PostgreSQL
    - Filtrare după tipul de conținut
    - Filtrare după categorie
    - Highlighting rezultate
    - Sugestii pentru correții
    - Paginare rezultate
    """
    
    results = await SearchService.search_content(
        db=db,
        query=q,
        content_types=content_types,
        category=category,
        limit=limit,
        offset=offset
    )
    
    return results


@router.get("/suggestions")
async def get_search_suggestions(
    q: str = Query(..., description="Termenul pentru sugestii"),
    db: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Obține sugestii pentru autocomplete în căutare
    """
    
    if len(q) < 2:
        return {"suggestions": []}
    
    suggestions = await SearchService._get_search_suggestions(db, q)
    
    return {"suggestions": suggestions}


@router.get("/popular")
async def get_popular_searches(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Obține termenii de căutare populari pentru autocomplete
    """
    
    popular_terms = await SearchService.get_popular_searches(db, limit)
    
    return {"popular_searches": popular_terms}


@router.post("/index/rebuild")
async def rebuild_search_index(
    db: AsyncSession = Depends(get_async_session)
) -> Dict[str, str]:
    """
    Reindexează tot conținutul site-ului
    
    Endpoint de administrare pentru reindexarea completă
    """
    
    try:
        await SearchService.index_all_content(db)
        return {"message": "Indexul de căutare a fost reconstruit cu succes"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Eroare la reindexarea conținutului: {str(e)}"
        )


@router.post("/index/content")
async def index_single_content(
    content_type: str,
    content_id: int,
    title: str,
    content_text: str,
    url: str,
    category: Optional[str] = None,
    tags: Optional[List[str]] = None,
    db: AsyncSession = Depends(get_async_session)
) -> Dict[str, str]:
    """
    Indexează un singur element de conținut
    
    Utilizat pentru indexarea automată la crearea/modificarea conținutului
    """
    
    try:
        await SearchService.index_single_content(
            db=db,
            content_type=content_type,
            content_id=content_id,
            title=title,
            content_text=content_text,
            url=url,
            category=category,
            tags=tags
        )
        return {"message": f"Conținutul {content_type}:{content_id} a fost indexat cu succes"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Eroare la indexarea conținutului: {str(e)}"
        )


@router.get("/stats")
async def get_search_stats(
    db: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Statistici generale despre indexul de căutare
    """
    
    from sqlalchemy import text, func
    from ...models.documents import SearchIndex
    from sqlalchemy import select
    
    try:
        # Total entries în index
        total_query = select(func.count(SearchIndex.id))
        total_result = await db.execute(total_query)
        total_entries = total_result.scalar() or 0
        
        # Breakdown pe tipuri de conținut
        breakdown_query = select(
            SearchIndex.content_type,
            func.count(SearchIndex.id)
        ).group_by(SearchIndex.content_type)
        
        breakdown_result = await db.execute(breakdown_query)
        breakdown = {row[0]: row[1] for row in breakdown_result.fetchall()}
        
        # Ultima indexare
        last_indexed_query = select(func.max(SearchIndex.last_indexed))
        last_indexed_result = await db.execute(last_indexed_query)
        last_indexed = last_indexed_result.scalar()
        
        return {
            "total_entries": total_entries,
            "content_breakdown": breakdown,
            "last_indexed": last_indexed.isoformat() if last_indexed else None,
            "search_features": {
                "full_text_search": True,
                "romanian_language": True,
                "highlighting": True,
                "suggestions": True,
                "faceted_search": True
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Eroare la obținerea statisticilor: {str(e)}"
        )