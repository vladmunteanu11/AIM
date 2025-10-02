"""
Endpoint-uri pentru managementul fișierelor și documentelor
"""
import os
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, BackgroundTasks, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from ...core.database import get_async_session as get_db
from ...services.file_service import FileService, DocumentService
from ...models.documents import Document, DocumentCategory, DocumentDownload
from ...schemas.files import (
    Document as DocumentSchema, DocumentList, DocumentCreate, DocumentUpdate,
    DocumentCategory as DocumentCategorySchema, DocumentCategoryCreate, DocumentCategoryUpdate,
    FileUploadResponse, FileValidationRequest, FileValidationResponse,
    BulkUploadRequest, BulkUploadResponse, DocumentStats, CleanupStats,
    StorageStats, DocumentSearchRequest, DownloadTrackingRequest
)
from ...core.config import get_settings
import mimetypes
import json

router = APIRouter()
file_service = FileService()
document_service = DocumentService()


# ================================
# UPLOAD FIȘIERE
# ================================

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    subfolder: str = Form("documents"),
    generate_thumbnail: bool = Form(False)
):
    """Upload un fișier"""
    try:
        file_info = await file_service.save_uploaded_file(
            file=file,
            subfolder=subfolder,
            prefix="upload",
            generate_thumbnail=generate_thumbnail
        )
        
        return FileUploadResponse(**file_info)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare la upload: {str(e)}")


@router.post("/upload/multiple", response_model=List[FileUploadResponse])
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    subfolder: str = Form("documents"),
    generate_thumbnail: bool = Form(False)
):
    """Upload fișiere multiple"""
    results = []
    errors = []
    
    for file in files:
        try:
            file_info = await file_service.save_uploaded_file(
                file=file,
                subfolder=subfolder,
                prefix="batch",
                generate_thumbnail=generate_thumbnail
            )
            results.append(FileUploadResponse(**file_info))
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})
    
    if errors and not results:
        raise HTTPException(status_code=400, detail={"message": "Toate fișierele au eșuat", "errors": errors})
    
    return results


@router.post("/validate", response_model=FileValidationResponse)
async def validate_file_info(request: FileValidationRequest):
    """Validează informațiile unui fișier fără upload"""
    
    class MockFile:
        def __init__(self, filename: str, content_type: str, size: int):
            self.filename = filename
            self.content_type = content_type
            self.size = size
    
    mock_file = MockFile(request.filename, request.content_type, 0)
    validation = FileService.validate_file(mock_file)
    
    return FileValidationResponse(
        is_valid=validation["is_valid"],
        errors=validation["errors"],
        warnings=[]
    )


# ================================
# CATEGORII DOCUMENTE
# ================================

@router.post("/categories", response_model=DocumentCategorySchema)
async def create_category(
    category_data: DocumentCategoryCreate,
    db: AsyncSession = Depends(get_db)
):
    """Creează o categorie nouă"""
    
    # Verifică dacă slug-ul există deja
    result = await db.execute(
        select(DocumentCategory).where(DocumentCategory.slug == category_data.slug)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Categoria cu slug-ul '{category_data.slug}' există deja")
    
    category = DocumentCategory(**category_data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    
    return category


@router.get("/categories", response_model=List[DocumentCategorySchema])
async def get_categories(
    include_inactive: bool = Query(False),
    parent_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Obține lista categoriilor"""
    
    query = select(DocumentCategory)
    conditions = []
    
    if not include_inactive:
        conditions.append(DocumentCategory.is_active == True)
    
    if parent_id is not None:
        conditions.append(DocumentCategory.parent_id == parent_id)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(DocumentCategory.name)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/categories/{category_id}", response_model=DocumentCategorySchema)
async def get_category(category_id: int, db: AsyncSession = Depends(get_db)):
    """Obține o categorie după ID"""
    
    result = await db.execute(
        select(DocumentCategory).where(DocumentCategory.id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Categoria nu a fost găsită")
    
    return category


@router.put("/categories/{category_id}", response_model=DocumentCategorySchema)
async def update_category(
    category_id: int,
    category_data: DocumentCategoryUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Actualizează o categorie"""
    
    result = await db.execute(
        select(DocumentCategory).where(DocumentCategory.id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Categoria nu a fost găsită")
    
    # Actualizează doar câmpurile furnizate
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    await db.commit()
    await db.refresh(category)
    
    return category


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    force: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    """Șterge o categorie"""
    
    result = await db.execute(
        select(DocumentCategory).where(DocumentCategory.id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Categoria nu a fost găsită")
    
    # Verifică dacă categoria are documente
    doc_result = await db.execute(
        select(func.count(Document.id)).where(Document.category_id == category_id)
    )
    doc_count = doc_result.scalar()
    
    if doc_count > 0 and not force:
        raise HTTPException(
            status_code=400, 
            detail=f"Categoria conține {doc_count} documente. Folosiți force=true pentru ștergere forțată."
        )
    
    # Dacă force=True, mută documentele la categoria None
    if force and doc_count > 0:
        await db.execute(
            update(Document).where(Document.category_id == category_id).values(category_id=None)
        )
    
    await db.delete(category)
    await db.commit()
    
    return {"message": "Categoria a fost ștearsă cu succes"}


# ================================
# DOCUMENTE
# ================================

@router.post("/documents", response_model=DocumentSchema)
async def create_document(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category_id: Optional[int] = Form(None),
    tags: Optional[str] = Form(None),  # JSON string
    is_public: bool = Form(True),
    requires_auth: bool = Form(False),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Creează un document nou cu fișier atașat"""
    
    try:
        # Parse tags-urile dacă sunt furnizate
        parsed_tags = []
        if tags:
            try:
                parsed_tags = json.loads(tags)
            except json.JSONDecodeError:
                parsed_tags = [tag.strip() for tag in tags.split(",") if tag.strip()]
        
        document = await document_service.create_document(
            db=db,
            file=file,
            title=title,
            description=description,
            category_id=category_id,
            tags=parsed_tags,
            is_public=is_public,
            requires_auth=requires_auth,
            uploaded_by=None  # TODO: get from JWT token
        )
        
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare la crearea documentului: {str(e)}")


@router.get("/documents", response_model=DocumentList)
async def get_documents(
    category_id: Optional[int] = Query(None),
    is_public: Optional[bool] = Query(None),
    search_term: Optional[str] = Query(None),
    file_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Obține lista documentelor cu paginare și filtrare"""
    
    # Calculează offset
    skip = (page - 1) * per_page
    
    # Query pentru total
    count_query = select(func.count(Document.id))
    conditions = []
    
    if category_id:
        conditions.append(Document.category_id == category_id)
    
    if is_public is not None:
        conditions.append(Document.is_public == is_public)
    
    if search_term:
        search_conditions = or_(
            Document.title.ilike(f"%{search_term}%"),
            Document.description.ilike(f"%{search_term}%"),
            Document.tags.op('@>')([search_term])
        )
        conditions.append(search_conditions)
    
    if file_type:
        conditions.append(Document.file_type == file_type)
    
    if conditions:
        count_query = count_query.where(and_(*conditions))
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Query pentru documente
    documents = await document_service.get_documents(
        db=db,
        category_id=category_id,
        is_public=is_public,
        search_term=search_term,
        skip=skip,
        limit=per_page
    )
    
    # Calculează numărul de pagini
    pages = (total + per_page - 1) // per_page
    
    return DocumentList(
        documents=documents,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/documents/search")
async def search_documents(
    q: str = Query(..., description="Termenul de căutat"),
    category_id: Optional[int] = Query(None),
    file_type: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Căutare rapidă în documente"""
    
    conditions = [
        or_(
            Document.title.ilike(f"%{q}%"),
            Document.description.ilike(f"%{q}%"),
            Document.file_name.ilike(f"%{q}%")
        )
    ]
    
    if category_id:
        conditions.append(Document.category_id == category_id)
    
    if file_type:
        conditions.append(Document.file_type == file_type)
    
    query = (
        select(Document)
        .where(and_(*conditions))
        .order_by(Document.uploaded_at.desc())
        .limit(limit)
    )
    
    result = await db.execute(query)
    documents = result.scalars().all()
    
    return {
        "query": q,
        "results": len(documents),
        "documents": documents
    }


@router.get("/documents/{document_id}", response_model=DocumentSchema)
async def get_document(document_id: int, db: AsyncSession = Depends(get_db)):
    """Obține un document după ID"""
    
    document = await document_service.get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Documentul nu a fost găsit")
    
    return document


@router.put("/documents/{document_id}", response_model=DocumentSchema)
async def update_document(
    document_id: int,
    document_data: DocumentUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Actualizează un document"""
    
    document = await document_service.update_document(
        db=db,
        document_id=document_id,
        **document_data.model_dump(exclude_unset=True)
    )
    
    if not document:
        raise HTTPException(status_code=404, detail="Documentul nu a fost găsit")
    
    return document


@router.delete("/documents/{document_id}")
async def delete_document(document_id: int, db: AsyncSession = Depends(get_db)):
    """Șterge un document și fișierul asociat"""
    
    success = await document_service.delete_document(db, document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Documentul nu a fost găsit")
    
    return {"message": "Documentul a fost șters cu succes"}


# ================================
# DESCĂRCARE FIȘIERE
# ================================

@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    track: bool = Query(True),
    db: AsyncSession = Depends(get_db)
):
    """Descarcă un document"""
    
    document = await document_service.get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Documentul nu a fost găsit")
    
    # Verifică dacă documentul este public sau necesită autentificare
    if not document.is_public:
        # TODO: Implementează verificarea autentificării
        raise HTTPException(status_code=403, detail="Documentul necesită autentificare")
    
    # Construiește calea completă
    settings = get_settings()
    upload_dir = Path(settings.UPLOAD_DIR if hasattr(settings, 'UPLOAD_DIR') else "uploads")
    file_path = upload_dir / document.file_path
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fișierul nu a fost găsit pe disc")
    
    # Înregistrează descărcarea în background
    if track:
        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        background_tasks.add_task(
            document_service.track_download,
            db=db,
            document_id=document_id,
            visitor_ip=client_ip,
            user_agent=user_agent
        )
    
    # Detectează tipul MIME
    mime_type = mimetypes.guess_type(str(file_path))[0] or 'application/octet-stream'
    
    return FileResponse(
        path=str(file_path),
        filename=document.file_name,
        media_type=mime_type
    )


@router.get("/files/{file_path:path}")
async def serve_file(file_path: str):
    """Servește un fișier static"""
    
    settings = get_settings()
    upload_dir = Path(settings.UPLOAD_DIR if hasattr(settings, 'UPLOAD_DIR') else "uploads")
    full_path = upload_dir / file_path
    
    # Verifică că calea este în directorul de upload (securitate)
    try:
        full_path.resolve().relative_to(upload_dir.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Calea fișierului nu este permisă")
    
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Fișierul nu a fost găsit")
    
    mime_type = mimetypes.guess_type(str(full_path))[0] or 'application/octet-stream'
    
    return FileResponse(path=str(full_path), media_type=mime_type)


# ================================
# STATISTICI ȘI ADMINISTRARE
# ================================

@router.get("/stats", response_model=DocumentStats)
async def get_document_stats(db: AsyncSession = Depends(get_db)):
    """Obține statistici despre documente"""
    
    # Total documente
    total_result = await db.execute(select(func.count(Document.id)))
    total_documents = total_result.scalar()
    
    # Documente publice
    public_result = await db.execute(
        select(func.count(Document.id)).where(Document.is_public == True)
    )
    public_documents = public_result.scalar()
    
    # Dimensiunea totală
    size_result = await db.execute(select(func.sum(Document.file_size)))
    total_size = size_result.scalar() or 0
    
    # Total descărcări
    downloads_result = await db.execute(select(func.sum(Document.download_count)))
    total_downloads = downloads_result.scalar() or 0
    
    # Numărul de categorii
    categories_result = await db.execute(select(func.count(DocumentCategory.id)))
    categories_count = categories_result.scalar()
    
    # Documente populare
    popular_documents = await document_service.get_popular_documents(db, limit=5)
    
    def format_size(size_bytes: int) -> str:
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"
    
    return DocumentStats(
        total_documents=total_documents,
        public_documents=public_documents,
        private_documents=total_documents - public_documents,
        total_size=total_size,
        total_size_formatted=format_size(total_size),
        total_downloads=total_downloads,
        categories_count=categories_count,
        popular_documents=popular_documents
    )


@router.post("/cleanup", response_model=CleanupStats)
async def cleanup_orphaned_files(db: AsyncSession = Depends(get_db)):
    """Curăță fișierele orfane"""
    
    stats = await file_service.cleanup_orphaned_files(db)
    
    return CleanupStats(**stats)


@router.get("/storage-stats", response_model=StorageStats)
async def get_storage_stats(db: AsyncSession = Depends(get_db)):
    """Obține statistici despre stocarea fișierelor"""
    
    settings = get_settings()
    upload_dir = Path(settings.UPLOAD_DIR if hasattr(settings, 'UPLOAD_DIR') else "uploads")
    
    total_size = 0
    files_count = 0
    categories = {}
    file_types = {}
    largest_files = []
    
    # Scandează directorul de upload
    for file_path in upload_dir.rglob("*"):
        if file_path.is_file():
            size = file_path.stat().st_size
            total_size += size
            files_count += 1
            
            # Categorie (subfolder)
            relative_path = file_path.relative_to(upload_dir)
            category = str(relative_path.parts[0]) if relative_path.parts else "root"
            categories[category] = categories.get(category, 0) + size
            
            # Tip fișier
            file_ext = file_path.suffix.lower()
            file_types[file_ext] = file_types.get(file_ext, 0) + 1
            
            # Fișiere mari
            largest_files.append({
                "path": str(relative_path),
                "size": size,
                "size_formatted": file_service._format_file_size(size)
            })
    
    # Sortează fișierele mari
    largest_files.sort(key=lambda x: x["size"], reverse=True)
    largest_files = largest_files[:10]
    
    def format_size(size_bytes: int) -> str:
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"
    
    return StorageStats(
        total_size=total_size,
        total_size_formatted=format_size(total_size),
        files_count=files_count,
        categories=categories,
        largest_files=largest_files,
        file_types=file_types
    )


# ================================
# BULK OPERATIONS
# ================================

@router.post("/bulk-upload", response_model=BulkUploadResponse)
async def bulk_upload_documents(
    files: List[UploadFile] = File(...),
    request_data: str = Form(...),  # JSON string cu BulkUploadRequest
    db: AsyncSession = Depends(get_db)
):
    """Upload în masă de documente"""
    
    try:
        # Parse request data
        bulk_request = BulkUploadRequest.model_validate_json(request_data)
        
        results = []
        errors = []
        
        for file in files:
            try:
                # Folosește numele fișierului ca titlu implicit
                title = Path(file.filename).stem
                
                document = await document_service.create_document(
                    db=db,
                    file=file,
                    title=title,
                    description=None,
                    category_id=bulk_request.category_id,
                    tags=bulk_request.tags,
                    is_public=bulk_request.is_public,
                    requires_auth=bulk_request.requires_auth,
                    uploaded_by=None  # TODO: get from JWT
                )
                
                results.append(document)
                
            except Exception as e:
                errors.append({
                    "filename": file.filename,
                    "error": str(e)
                })
        
        return BulkUploadResponse(
            total_files=len(files),
            successful=len(results),
            failed=len(errors),
            errors=errors,
            documents=results
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Eroare la upload în masă: {str(e)}")


@router.delete("/bulk-delete")
async def bulk_delete_documents(
    document_ids: List[int],
    db: AsyncSession = Depends(get_db)
):
    """Șterge mai multe documente odată"""
    
    results = {
        "deleted": 0,
        "failed": 0,
        "errors": []
    }
    
    for document_id in document_ids:
        try:
            success = await document_service.delete_document(db, document_id)
            if success:
                results["deleted"] += 1
            else:
                results["failed"] += 1
                results["errors"].append({
                    "document_id": document_id,
                    "error": "Document not found"
                })
        except Exception as e:
            results["failed"] += 1
            results["errors"].append({
                "document_id": document_id,
                "error": str(e)
            })
    
    return results