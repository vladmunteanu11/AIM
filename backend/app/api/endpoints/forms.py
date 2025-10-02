"""
API endpoints pentru formulare online și cereri administrative
"""
import uuid
from typing import List, Optional
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, or_, desc, asc, func

from ...core.database import get_async_session
from ...models.forms import FormType, FormSubmission, ComplaintCategory, Complaint
from ...models.admin import AdminUser
from ...schemas.forms import (
    FormType as FormTypeSchema,
    FormTypeCreate,
    FormTypeUpdate,
    FormSubmission as FormSubmissionSchema,
    FormSubmissionCreate,
    ComplaintCategory as ComplaintCategorySchema,
    ComplaintCategoryCreate,
    ComplaintCategoryUpdate,
    Complaint as ComplaintSchema,
    ComplaintCreate,
    ComplaintUpdate,
    ComplaintStatusUpdate,
    ComplaintList,
    ComplaintDetails,
    ComplaintFilters,
    ComplaintSearchRequest,
    ComplaintStats,
    ServiceStats,
    FileUploadResponse,
    FileUploadError
)
from ...utils.reference_generator import generate_reference_number
from ...utils.file_handler import save_uploaded_file, validate_file
import os
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# ========== FORMULARE ONLINE ==========

@router.get("/form-types", response_model=List[FormTypeSchema])
async def get_form_types(
    active_only: bool = True,
    db: AsyncSession = Depends(get_async_session)
):
    """Obține lista tipurilor de formulare disponibile"""
    query = db.query(FormType)
    if active_only:
        query = query.filter(FormType.is_active == True)
    
    form_types = query.order_by(FormType.name).all()
    return form_types


@router.get("/form-types/{form_type_id}", response_model=FormTypeSchema)
async def get_form_type(form_type_id: int, db: AsyncSession = Depends(get_async_session)):
    """Obține detaliile unui tip de formular"""
    form_type = db.query(FormType).filter(FormType.id == form_type_id).first()
    if not form_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipul de formular nu a fost găsit"
        )
    
    return form_type


@router.post("/form-types", response_model=FormTypeSchema)
async def create_form_type(
    form_type: FormTypeCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Creează un nou tip de formular (doar pentru administratori)"""
    # Verifică dacă slug-ul există deja
    existing = db.query(FormType).filter(FormType.slug == form_type.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un formular cu acest slug există deja"
        )
    
    # Creează formularul
    db_form_type = FormType(**form_type.dict())
    db.add(db_form_type)
    db.commit()
    db.refresh(db_form_type)
    
    logger.info(f"Created form type: {db_form_type.name} (ID: {db_form_type.id})")
    return db_form_type


@router.put("/form-types/{form_type_id}", response_model=FormTypeSchema)
async def update_form_type(
    form_type_id: int,
    form_update: FormTypeUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Actualizează un tip de formular"""
    db_form_type = db.query(FormType).filter(FormType.id == form_type_id).first()
    if not db_form_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipul de formular nu a fost găsit"
        )
    
    # Actualizează doar câmpurile furnizate
    update_data = form_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_form_type, field, value)
    
    db.commit()
    db.refresh(db_form_type)
    
    logger.info(f"Updated form type: {db_form_type.name} (ID: {db_form_type.id})")
    return db_form_type


@router.post("/form-submissions", response_model=FormSubmissionSchema)
async def submit_form(
    submission: FormSubmissionCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Trimite o cerere completând un formular"""
    # Verifică dacă tipul de formular există și este activ
    form_type = db.query(FormType).filter(
        and_(FormType.id == submission.form_type_id, FormType.is_active == True)
    ).first()
    
    if not form_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipul de formular nu a fost găsit sau nu este activ"
        )
    
    # Verifică limita zilnică de submisii
    if form_type.max_submissions_per_day:
        today = date.today()
        today_submissions = db.query(FormSubmission).filter(
            and_(
                FormSubmission.form_type_id == submission.form_type_id,
                func.date(FormSubmission.submitted_at) == today
            )
        ).count()
        
        if today_submissions >= form_type.max_submissions_per_day:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Ați depășit limita de {form_type.max_submissions_per_day} cereri pe zi pentru acest formular"
            )
    
    # Generează numărul de referință
    reference_number = generate_reference_number("CERERE")
    
    # Creează submisia
    db_submission = FormSubmission(
        **submission.dict(),
        reference_number=reference_number,
        status="pending"
    )
    
    # Setează perioada de retenție a datelor
    db_submission.set_data_retention(years=3)
    
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    
    logger.info(f"Created form submission: {reference_number} for form type {form_type.name}")
    
    # TODO: Trimite notificări email
    
    return db_submission


@router.get("/form-submissions/{submission_id}", response_model=FormSubmissionSchema)
async def get_form_submission(
    submission_id: str,
    db: AsyncSession = Depends(get_async_session)
):
    """Obține detaliile unei cereri"""
    try:
        submission_uuid = uuid.UUID(submission_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID-ul cererii nu este valid"
        )
    
    submission = db.query(FormSubmission).filter(
        FormSubmission.id == submission_uuid
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cererea nu a fost găsită"
        )
    
    return submission


@router.get("/form-submissions/ref/{reference_number}", response_model=FormSubmissionSchema)
async def get_form_submission_by_reference(
    reference_number: str,
    db: AsyncSession = Depends(get_async_session)
):
    """Obține detaliile unei cereri după numărul de referință"""
    submission = db.query(FormSubmission).filter(
        FormSubmission.reference_number == reference_number
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cererea cu acest număr de referință nu a fost găsită"
        )
    
    return submission


@router.get("/form-submissions", response_model=List[FormSubmissionSchema])
async def list_form_submissions(
    form_type_id: Optional[int] = None,
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    db: AsyncSession = Depends(get_async_session)
):
    """Listează cererile (cu paginație)"""
    query = db.query(FormSubmission)
    
    # Filtrare
    if form_type_id:
        query = query.filter(FormSubmission.form_type_id == form_type_id)
    if status:
        query = query.filter(FormSubmission.status == status)
    
    # Paginație
    offset = (page - 1) * per_page
    submissions = query.order_by(desc(FormSubmission.submitted_at)).offset(offset).limit(per_page).all()
    
    return submissions


# ========== CATEGORII SESIZĂRI ==========

@router.get("/complaint-categories", response_model=List[ComplaintCategorySchema])
async def get_complaint_categories(
    active_only: bool = True,
    db: AsyncSession = Depends(get_async_session)
):
    """Obține lista categoriilor de sesizări"""
    query = db.query(ComplaintCategory)
    if active_only:
        query = query.filter(ComplaintCategory.is_active == True)
    
    categories = query.order_by(ComplaintCategory.sort_order, ComplaintCategory.name).all()
    return categories


@router.post("/complaint-categories", response_model=ComplaintCategorySchema)
async def create_complaint_category(
    category: ComplaintCategoryCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Creează o categorie de sesizări"""
    # Verifică dacă slug-ul există deja
    existing = db.query(ComplaintCategory).filter(ComplaintCategory.slug == category.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O categorie cu acest slug există deja"
        )
    
    db_category = ComplaintCategory(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    logger.info(f"Created complaint category: {db_category.name}")
    return db_category


@router.put("/complaint-categories/{category_id}", response_model=ComplaintCategorySchema)
async def update_complaint_category(
    category_id: int,
    category_update: ComplaintCategoryUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Actualizează o categorie de sesizări"""
    db_category = db.query(ComplaintCategory).filter(ComplaintCategory.id == category_id).first()
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria nu a fost găsită"
        )
    
    update_data = category_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)
    
    db.commit()
    db.refresh(db_category)
    
    logger.info(f"Updated complaint category: {db_category.name}")
    return db_category


# ========== SESIZĂRI ==========

@router.post("/complaints", response_model=ComplaintSchema)
async def create_complaint(
    complaint: ComplaintCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Creează o sesizare nouă"""
    # Verifică dacă categoria există și este activă
    category = db.query(ComplaintCategory).filter(
        and_(ComplaintCategory.id == complaint.category_id, ComplaintCategory.is_active == True)
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria de sesizări nu a fost găsită sau nu este activă"
        )
    
    # Generează numărul de referință
    reference_number = generate_reference_number("SESIZARE")
    
    # Creează sesizarea
    complaint_data = complaint.dict()
    db_complaint = Complaint(
        **complaint_data,
        reference_number=reference_number,
        status="submitted"
    )
    
    # Setează perioada de retenție a datelor
    db_complaint.set_data_retention(years=5)
    
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    
    logger.info(f"Created complaint: {reference_number} in category {category.name}")
    
    # TODO: Trimite notificări email
    
    return db_complaint


@router.get("/complaints/{complaint_id}", response_model=ComplaintDetails)
async def get_complaint(
    complaint_id: str,
    include_history: bool = True,
    db: AsyncSession = Depends(get_async_session)
):
    """Obține detaliile unei sesizări"""
    try:
        complaint_uuid = uuid.UUID(complaint_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID-ul sesizării nu este valid"
        )
    
    complaint = db.query(Complaint).filter(Complaint.id == complaint_uuid).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesizarea nu a fost găsită"
        )
    
    # Convertește la schema cu detalii
    complaint_dict = ComplaintSchema.from_orm(complaint).dict()
    complaint_details = ComplaintDetails(**complaint_dict)
    
    # Adaugă informatii calculate
    complaint_details.is_overdue = complaint.is_overdue
    complaint_details.processing_time_days = complaint.processing_time_days
    
    if include_history:
        complaint_details.updates = complaint.updates
    
    return complaint_details


@router.get("/complaints/ref/{reference_number}", response_model=ComplaintDetails)
async def get_complaint_by_reference(
    reference_number: str,
    include_history: bool = True,
    db: AsyncSession = Depends(get_async_session)
):
    """Obține detaliile unei sesizări după numărul de referință"""
    complaint = db.query(Complaint).filter(
        Complaint.reference_number == reference_number
    ).first()
    
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesizarea cu acest număr de referință nu a fost găsită"
        )
    
    # Convertește la schema cu detalii
    complaint_dict = ComplaintSchema.from_orm(complaint).dict()
    complaint_details = ComplaintDetails(**complaint_dict)
    
    # Adaugă informatii calculate
    complaint_details.is_overdue = complaint.is_overdue
    complaint_details.processing_time_days = complaint.processing_time_days
    
    if include_history:
        complaint_details.updates = complaint.updates
    
    return complaint_details


@router.post("/complaints/search", response_model=ComplaintList)
async def search_complaints(
    search_request: ComplaintSearchRequest,
    db: AsyncSession = Depends(get_async_session)
):
    """Caută sesizări cu filtre și paginație"""
    query = db.query(Complaint)
    
    # Aplică filtrele
    if search_request.filters:
        filters = search_request.filters
        
        if filters.category_id:
            query = query.filter(Complaint.category_id == filters.category_id)
        
        if filters.status:
            query = query.filter(Complaint.status == filters.status)
        
        if filters.urgency_level:
            query = query.filter(Complaint.urgency_level == filters.urgency_level)
        
        if filters.submitted_after:
            query = query.filter(Complaint.submitted_at >= filters.submitted_after)
        
        if filters.submitted_before:
            query = query.filter(Complaint.submitted_at <= filters.submitted_before)
        
        if filters.search_text:
            search_term = f"%{filters.search_text}%"
            query = query.filter(
                or_(
                    Complaint.title.ilike(search_term),
                    Complaint.description.ilike(search_term),
                    Complaint.reference_number.ilike(search_term)
                )
            )
    
    # Total înregistrări
    total = query.count()
    
    # Sortare
    sort_column = getattr(Complaint, search_request.sort_by, Complaint.submitted_at)
    if search_request.sort_order == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))
    
    # Paginație
    offset = (search_request.page - 1) * search_request.per_page
    complaints = query.offset(offset).limit(search_request.per_page).all()
    
    # Calculează numărul de pagini
    pages = (total + search_request.per_page - 1) // search_request.per_page
    
    return ComplaintList(
        total=total,
        page=search_request.page,
        per_page=search_request.per_page,
        pages=pages,
        complaints=complaints
    )


@router.put("/complaints/{complaint_id}/status", response_model=ComplaintSchema)
async def update_complaint_status(
    complaint_id: str,
    status_update: ComplaintStatusUpdate,
    admin_id: Optional[str] = None,  # TODO: Get from authentication
    db: AsyncSession = Depends(get_async_session)
):
    """Actualizează statusul unei sesizări (doar administratori)"""
    try:
        complaint_uuid = uuid.UUID(complaint_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID-ul sesizării nu este valid"
        )
    
    complaint = db.query(Complaint).filter(Complaint.id == complaint_uuid).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesizarea nu a fost găsită"
        )
    
    # Actualizează statusul
    admin_uuid = uuid.UUID(admin_id) if admin_id else None
    complaint.update_status(
        new_status=status_update.status.value,
        admin_notes=status_update.admin_notes,
        admin_id=admin_uuid
    )
    
    db.commit()
    db.refresh(complaint)
    
    logger.info(f"Updated complaint {complaint.reference_number} status to {status_update.status}")
    
    # TODO: Trimite notificare către cetățean
    
    return complaint


@router.put("/complaints/{complaint_id}", response_model=ComplaintSchema)
async def update_complaint(
    complaint_id: str,
    complaint_update: ComplaintUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Actualizează o sesizare (feedback de la cetățean)"""
    try:
        complaint_uuid = uuid.UUID(complaint_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID-ul sesizării nu este valid"
        )
    
    complaint = db.query(Complaint).filter(Complaint.id == complaint_uuid).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesizarea nu a fost găsită"
        )
    
    # Actualizează doar câmpurile permise pentru cetățeni
    update_data = complaint_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(complaint, field, value)
    
    db.commit()
    db.refresh(complaint)
    
    logger.info(f"Updated complaint {complaint.reference_number} with citizen feedback")
    return complaint


# ========== STATISTICI ==========

@router.get("/stats/complaints", response_model=ComplaintStats)
async def get_complaint_stats(db: AsyncSession = Depends(get_async_session)):
    """Obține statistici despre sesizări"""
    today = date.today()
    month_start = today.replace(day=1)
    
    total_complaints = db.query(Complaint).count()
    submitted_today = db.query(Complaint).filter(
        func.date(Complaint.submitted_at) == today
    ).count()
    
    pending_response = db.query(Complaint).filter(
        Complaint.status == "submitted"
    ).count()
    
    in_progress = db.query(Complaint).filter(
        Complaint.status == "in_progress"
    ).count()
    
    resolved_this_month = db.query(Complaint).filter(
        and_(
            Complaint.status == "resolved",
            Complaint.resolved_at >= month_start
        )
    ).count()
    
    # Calculează media zilelor de rezolvare
    resolved_complaints = db.query(Complaint).filter(
        Complaint.resolved_at.isnot(None)
    ).all()
    
    if resolved_complaints:
        total_days = sum(c.processing_time_days for c in resolved_complaints)
        average_resolution_days = total_days / len(resolved_complaints)
    else:
        average_resolution_days = 0.0
    
    # Sesizări întârziate
    overdue_complaints = len([c for c in db.query(Complaint).filter(
        Complaint.status.in_(["submitted", "acknowledged", "in_progress"])
    ).all() if c.is_overdue])
    
    # Satisfacția medie
    satisfaction_scores = db.query(Complaint.citizen_satisfaction).filter(
        Complaint.citizen_satisfaction.isnot(None)
    ).all()
    
    if satisfaction_scores:
        satisfaction_average = sum(score[0] for score in satisfaction_scores) / len(satisfaction_scores)
    else:
        satisfaction_average = None
    
    return ComplaintStats(
        total_complaints=total_complaints,
        submitted_today=submitted_today,
        pending_response=pending_response,
        in_progress=in_progress,
        resolved_this_month=resolved_this_month,
        average_resolution_days=average_resolution_days,
        overdue_complaints=overdue_complaints,
        satisfaction_average=satisfaction_average
    )


@router.get("/stats/services", response_model=ServiceStats)
async def get_service_stats(db: AsyncSession = Depends(get_async_session)):
    """Obține statistici despre serviciile online"""
    today = date.today()
    
    total_forms_submitted = db.query(FormSubmission).count()
    forms_submitted_today = db.query(FormSubmission).filter(
        func.date(FormSubmission.submitted_at) == today
    ).count()
    
    pending_forms = db.query(FormSubmission).filter(
        FormSubmission.status == "pending"
    ).count()
    
    completed_forms = db.query(FormSubmission).filter(
        FormSubmission.status == "completed"
    ).count()
    
    # Media zilelor de procesare pentru formulare
    completed_submissions = db.query(FormSubmission).filter(
        FormSubmission.completed_at.isnot(None)
    ).all()
    
    if completed_submissions:
        total_days = sum(s.processing_time_days for s in completed_submissions)
        average_processing_days = total_days / len(completed_submissions)
    else:
        average_processing_days = 0.0
    
    # Serviciile cele mai populare
    popular_services = db.query(
        FormType.name,
        func.count(FormSubmission.id).label("submissions_count")
    ).join(FormSubmission).group_by(FormType.name).order_by(
        desc(func.count(FormSubmission.id))
    ).limit(5).all()
    
    most_popular_services = [
        {"name": name, "count": count} for name, count in popular_services
    ]
    
    return ServiceStats(
        total_forms_submitted=total_forms_submitted,
        forms_submitted_today=forms_submitted_today,
        pending_forms=pending_forms,
        completed_forms=completed_forms,
        average_processing_days=average_processing_days,
        most_popular_services=most_popular_services
    )


# ========== UPLOAD FIȘIERE ==========

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    file_type: str = Form("document"),  # "document" sau "photo"
):
    """Upload fișiere pentru formulare și sesizări"""
    try:
        # Validează fișierul
        validation_result = validate_file(file, file_type)
        if not validation_result["valid"]:
            return FileUploadError(
                error=validation_result["error"],
                error_code="INVALID_FILE",
                allowed_types=validation_result["allowed_types"],
                max_size_mb=validation_result["max_size_mb"]
            )
        
        # Salvează fișierul
        file_info = await save_uploaded_file(file, file_type)
        
        return FileUploadResponse(**file_info)
        
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eroare la încărcarea fișierului"
        )


@router.get("/files/{file_path}")
async def download_file(file_path: str):
    """Download fișiere încărcate"""
    # Construiește calea completă și verifică securitatea
    safe_path = os.path.join("uploads", file_path)
    
    # Verifică că fișierul există și este în directorul permis
    if not os.path.exists(safe_path) or not safe_path.startswith("uploads/"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fișierul nu a fost găsit"
        )
    
    return FileResponse(
        path=safe_path,
        filename=os.path.basename(file_path)
    )