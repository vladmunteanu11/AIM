"""
Schema pentru validarea formularelor și sesizărilor
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, validator
from enum import Enum


class UrgencyLevel(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class ComplaintStatus(str, Enum):
    SUBMITTED = "submitted"
    ACKNOWLEDGED = "acknowledged"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class NotificationPreferences(BaseModel):
    """Preferințe de notificare pentru cetățean"""
    email: bool = True
    sms: bool = False
    push: bool = False


# Schema pentru categorii de sesizări
class ComplaintCategoryBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    requires_location: bool = True
    requires_photos: bool = False
    responsible_department: Optional[str] = None
    notification_emails: Optional[List[EmailStr]] = None
    response_time_hours: int = Field(default=24, ge=1, le=168)  # max 7 zile
    resolution_time_days: int = Field(default=7, ge=1, le=30)  # max 30 zile


class ComplaintCategoryCreate(ComplaintCategoryBase):
    slug: str = Field(..., min_length=3, max_length=100, pattern=r'^[a-z0-9-]+$')


class ComplaintCategoryUpdate(ComplaintCategoryBase):
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class ComplaintCategory(ComplaintCategoryBase):
    id: int
    slug: str
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Schema pentru sesizări
class ComplaintBase(BaseModel):
    title: str = Field(..., min_length=10, max_length=500)
    description: str = Field(..., min_length=20, max_length=5000)
    citizen_name: str = Field(..., min_length=2, max_length=255)
    citizen_email: Optional[EmailStr] = None
    citizen_phone: Optional[str] = Field(None, pattern=r'^\+?[0-9\s\-\(\)]{10,15}$')
    citizen_address: Optional[str] = Field(None, max_length=500)
    is_anonymous: bool = False
    location_address: Optional[str] = Field(None, max_length=500)
    location_details: Optional[str] = Field(None, max_length=1000)
    latitude: Optional[str] = Field(None, pattern=r'^-?[0-9]+\.?[0-9]*$')
    longitude: Optional[str] = Field(None, pattern=r'^-?[0-9]+\.?[0-9]*$')
    urgency_level: UrgencyLevel = UrgencyLevel.NORMAL
    notification_preferences: Optional[NotificationPreferences] = None

    @validator('citizen_email')
    def validate_email_if_not_anonymous(cls, v, values):
        if not values.get('is_anonymous') and not v:
            raise ValueError('Email este obligatoriu pentru sesizările ne-anonime')
        return v

    @validator('citizen_name')
    def validate_name_if_not_anonymous(cls, v, values):
        if not values.get('is_anonymous') and not v:
            raise ValueError('Numele este obligatoriu pentru sesizările ne-anonime')
        if values.get('is_anonymous'):
            return "Sesizare Anonimă"
        return v


class ComplaintCreate(ComplaintBase):
    category_id: int
    consent_given: bool = Field(..., description="Consimțământul GDPR este obligatoriu")

    @validator('consent_given')
    def validate_consent(cls, v):
        if not v:
            raise ValueError('Consimțământul pentru prelucrarea datelor este obligatoriu')
        return v


class ComplaintUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=10, max_length=500)
    description: Optional[str] = Field(None, min_length=20, max_length=5000)
    urgency_level: Optional[UrgencyLevel] = None
    location_address: Optional[str] = Field(None, max_length=500)
    location_details: Optional[str] = Field(None, max_length=1000)
    citizen_feedback: Optional[str] = Field(None, max_length=2000)
    citizen_satisfaction: Optional[int] = Field(None, ge=1, le=5)


class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    admin_notes: Optional[str] = Field(None, max_length=2000)


class Complaint(ComplaintBase):
    id: str  # UUID as string
    category_id: int
    reference_number: str
    status: ComplaintStatus
    submitted_at: datetime
    acknowledged_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    admin_notes: Optional[str] = None
    citizen_feedback: Optional[str] = None
    citizen_satisfaction: Optional[int] = None
    attached_photos: Optional[List[str]] = None
    attached_documents: Optional[List[str]] = None
    consent_given: bool
    data_retention_until: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Relații incluse
    category: Optional[ComplaintCategory] = None
    
    class Config:
        from_attributes = True


class ComplaintList(BaseModel):
    """Schema pentru lista de sesizări cu paginație"""
    total: int
    page: int
    per_page: int
    pages: int
    complaints: List[Complaint]


class ComplaintUpdateHistory(BaseModel):
    """Istoricul actualizărilor unei sesizări"""
    id: int
    status_from: Optional[str]
    status_to: str
    notes: Optional[str]
    is_public: bool
    created_at: datetime
    admin_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class ComplaintDetails(Complaint):
    """Detalii complete pentru o sesizare, inclusiv istoric"""
    updates: List[ComplaintUpdateHistory] = []
    is_overdue: bool = False
    processing_time_days: int = 0


# Schema pentru formulare generice
class FormTypeBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    instructions: Optional[str] = None
    requires_auth: bool = False
    max_submissions_per_day: Optional[int] = Field(None, ge=1, le=50)
    notification_emails: Optional[List[EmailStr]] = None
    approval_required: bool = False
    estimated_processing_days: Optional[int] = Field(None, ge=1, le=30)


class FormTypeCreate(FormTypeBase):
    slug: str = Field(..., min_length=3, max_length=100, pattern=r'^[a-z0-9-]+$')
    form_schema: Dict[str, Any] = Field(..., description="JSON Schema pentru validarea formularului")


class FormTypeUpdate(FormTypeBase):
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    is_active: Optional[bool] = None
    form_schema: Optional[Dict[str, Any]] = None


class FormType(FormTypeBase):
    id: int
    slug: str
    form_schema: Dict[str, Any]
    validation_rules: Optional[Dict[str, Any]] = None
    is_active: bool
    required_documents: Optional[List[str]] = None
    auto_reply_template: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    total_submissions: int = 0
    pending_submissions: int = 0
    
    class Config:
        from_attributes = True


class FormSubmissionBase(BaseModel):
    citizen_name: str = Field(..., min_length=2, max_length=255)
    citizen_email: Optional[EmailStr] = None
    citizen_phone: Optional[str] = Field(None, pattern=r'^\+?[0-9\s\-\(\)]{10,15}$')
    citizen_cnp: Optional[str] = Field(None, pattern=r'^[0-9]{13}$')
    citizen_address: Optional[str] = Field(None, max_length=500)
    submission_data: Dict[str, Any] = Field(..., description="Datele completate în formular")


class FormSubmissionCreate(FormSubmissionBase):
    form_type_id: int
    consent_given: bool = Field(..., description="Consimțământul GDPR este obligatoriu")

    @validator('consent_given')
    def validate_consent(cls, v):
        if not v:
            raise ValueError('Consimțământul pentru prelucrarea datelor este obligatoriu')
        return v


class FormSubmission(FormSubmissionBase):
    id: str  # UUID as string
    form_type_id: int
    reference_number: str
    status: str
    priority: str
    submitted_at: datetime
    assigned_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    processing_notes: Optional[str] = None
    attached_files: Optional[List[str]] = None
    consent_given: bool
    data_retention_until: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Relații
    form_type: Optional[FormType] = None
    
    class Config:
        from_attributes = True


# Schema pentru statistici
class ComplaintStats(BaseModel):
    """Statistici pentru sesizări"""
    total_complaints: int
    submitted_today: int
    pending_response: int
    in_progress: int
    resolved_this_month: int
    average_resolution_days: float
    overdue_complaints: int
    satisfaction_average: Optional[float] = None


class ServiceStats(BaseModel):
    """Statistici generale pentru servicii online"""
    total_forms_submitted: int
    forms_submitted_today: int
    pending_forms: int
    completed_forms: int
    average_processing_days: float
    most_popular_services: List[Dict[str, Any]]


# Schema pentru căutare și filtrare
class ComplaintFilters(BaseModel):
    """Filtre pentru căutarea sesizărilor"""
    category_id: Optional[int] = None
    status: Optional[ComplaintStatus] = None
    urgency_level: Optional[UrgencyLevel] = None
    submitted_after: Optional[datetime] = None
    submitted_before: Optional[datetime] = None
    is_overdue: Optional[bool] = None
    search_text: Optional[str] = Field(None, max_length=200)


class ComplaintSearchRequest(BaseModel):
    """Request pentru căutarea sesizărilor"""
    filters: Optional[ComplaintFilters] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)
    sort_by: str = Field(default="submitted_at", pattern=r'^(submitted_at|updated_at|reference_number)$')
    sort_order: str = Field(default="desc", pattern=r'^(asc|desc)$')


# Schema pentru upload fișiere
class FileUploadResponse(BaseModel):
    """Răspuns pentru upload fișiere"""
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    mime_type: str
    upload_id: str


class FileUploadError(BaseModel):
    """Eroare la upload fișiere"""
    error: str
    error_code: str
    allowed_types: List[str]
    max_size_mb: int