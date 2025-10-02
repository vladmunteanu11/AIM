"""
Scheme Pydantic pentru sistemul de programări
"""
from datetime import datetime, date, time
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, validator, Field


# ====================
# APPOINTMENT CATEGORY SCHEMAS
# ====================

class AppointmentCategoryBase(BaseModel):
    """Schema de bază pentru categoria de programări"""
    name: str = Field(..., description="Numele categoriei")
    slug: str = Field(..., description="Slug-ul pentru URL")
    description: Optional[str] = Field(None, description="Descrierea categoriei")
    color: Optional[str] = Field(None, description="Culoarea hex pentru UI")
    icon: Optional[str] = Field(None, description="Icon pentru UI")
    
    # Configurare
    is_active: bool = Field(True, description="Categoria este activă")
    requires_documents: bool = Field(False, description="Necesită documente")
    required_documents: Optional[List[str]] = Field(None, description="Lista documente necesare")
    max_appointments_per_day: int = Field(10, description="Numărul maxim de programări pe zi")
    appointment_duration_minutes: int = Field(30, description="Durata în minute")
    
    @validator('color')
    def validate_color(cls, v):
        if v and (not v.startswith('#') or len(v) != 7):
            raise ValueError('Culoarea trebuie să fie în format hex #RRGGBB')
        return v


class AppointmentCategoryCreate(AppointmentCategoryBase):
    """Schema pentru crearea unei categorii"""
    pass


class AppointmentCategoryUpdate(BaseModel):
    """Schema pentru actualizarea unei categorii"""
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None
    requires_documents: Optional[bool] = None
    required_documents: Optional[List[str]] = None
    max_appointments_per_day: Optional[int] = None
    appointment_duration_minutes: Optional[int] = None


class AppointmentCategoryResponse(AppointmentCategoryBase):
    """Schema pentru răspunsul cu categoria"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ====================
# APPOINTMENT SCHEMAS
# ====================

class AppointmentBase(BaseModel):
    """Schema de bază pentru programări"""
    category_id: int = Field(..., description="ID-ul categoriei")
    citizen_name: str = Field(..., min_length=2, max_length=255, description="Numele cetățeanului")
    citizen_email: EmailStr = Field(..., description="Email-ul cetățeanului")
    citizen_phone: str = Field(..., description="Telefonul cetățeanului")
    citizen_cnp: Optional[str] = Field(None, description="CNP-ul cetățeanului")
    citizen_address: Optional[str] = Field(None, description="Adresa cetățeanului")
    
    appointment_date: date = Field(..., description="Data programării")
    appointment_time: time = Field(..., description="Ora programării")
    subject: str = Field(..., min_length=5, max_length=500, description="Motivul programării")
    details: Optional[str] = Field(None, description="Detalii suplimentare")
    
    consent_given: bool = Field(False, description="Acordul GDPR")
    
    @validator('citizen_phone')
    def validate_phone(cls, v):
        # Eliminarea caracterelor speciale pentru validare
        clean_phone = ''.join(c for c in v if c.isdigit() or c in '+()-')
        if len(clean_phone) < 10:
            raise ValueError('Numărul de telefon trebuie să aibă cel puțin 10 cifre')
        return v
    
    @validator('citizen_cnp')
    def validate_cnp(cls, v):
        if v and (len(v) != 13 or not v.isdigit()):
            raise ValueError('CNP-ul trebuie să aibă exact 13 cifre')
        return v
    
    @validator('appointment_date')
    def validate_date_not_past(cls, v):
        if v < date.today():
            raise ValueError('Nu puteți programa în trecut')
        return v


class AppointmentCreate(AppointmentBase):
    """Schema pentru crearea unei programări"""
    pass


class AppointmentUpdate(BaseModel):
    """Schema pentru actualizarea unei programări (admin)"""
    status: Optional[str] = Field(None, description="Statusul programării")
    status_notes: Optional[str] = Field(None, description="Notele pentru status")
    admin_notes: Optional[str] = Field(None, description="Notele administratorului")
    assigned_to: Optional[UUID] = Field(None, description="Administratorul asignat")
    
    @validator('status')
    def validate_status(cls, v):
        if v and v not in ['pending', 'confirmed', 'cancelled', 'completed', 'no_show']:
            raise ValueError('Status invalid')
        return v


class AppointmentResponse(AppointmentBase):
    """Schema pentru răspunsul cu programarea"""
    id: UUID
    reference_number: str
    status: str
    status_notes: Optional[str]
    priority: str
    
    created_at: datetime
    confirmed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    assigned_to: Optional[UUID]
    admin_notes: Optional[str]
    
    # Proprietăți calculate
    is_upcoming: bool = Field(..., description="Programarea este viitoare")
    is_past: bool = Field(..., description="Programarea a trecut")
    can_be_cancelled: bool = Field(..., description="Poate fi anulată")
    
    class Config:
        from_attributes = True


class AppointmentPublicResponse(BaseModel):
    """Schema pentru răspunsul public cu programarea (fără date sensibile)"""
    id: UUID
    reference_number: str
    category_id: int
    appointment_date: date
    appointment_time: time
    subject: str
    status: str
    created_at: datetime
    is_upcoming: bool
    can_be_cancelled: bool
    
    class Config:
        from_attributes = True


# ====================
# TIME SLOT SCHEMAS
# ====================

class TimeSlotBase(BaseModel):
    """Schema pentru sloturile de timp"""
    category_id: int
    day_of_week: int = Field(..., ge=1, le=7, description="Ziua săptămânii (1=Luni)")
    start_time: time
    end_time: time
    max_appointments: int = Field(1, ge=1, description="Numărul maxim de programări")
    is_active: bool = True
    
    @validator('end_time')
    def validate_end_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('Ora de sfârșit trebuie să fie după ora de început')
        return v


class TimeSlotCreate(TimeSlotBase):
    """Schema pentru crearea unui slot"""
    pass


class TimeSlotResponse(TimeSlotBase):
    """Schema pentru răspunsul cu slotul"""
    id: int
    
    class Config:
        from_attributes = True


# ====================
# STATISTICS SCHEMAS
# ====================

class AppointmentStatsResponse(BaseModel):
    """Schema pentru statisticile programărilor"""
    total_appointments: int = Field(..., description="Total programări")
    pending_appointments: int = Field(..., description="Programări în așteptare")
    confirmed_appointments: int = Field(..., description="Programări confirmate")
    cancelled_appointments: int = Field(..., description="Programări anulate")
    completed_appointments: int = Field(..., description="Programări finalizate")
    no_show_appointments: int = Field(..., description="Programări pierdute")
    
    # Statistici pe perioada
    today_appointments: int = Field(..., description="Programări astăzi")
    this_week_appointments: int = Field(..., description="Programări săptămâna aceasta")
    this_month_appointments: int = Field(..., description="Programări luna aceasta")
    
    # Top categorii
    popular_categories: List[Dict[str, Any]] = Field(..., description="Categoriile populare")
    
    # Programări viitoare
    upcoming_appointments: List[AppointmentResponse] = Field(..., description="Programări viitoare")


class DailyStatsResponse(BaseModel):
    """Schema pentru statisticile zilnice"""
    stats_date: date
    total_appointments: int
    confirmed_appointments: int
    cancelled_appointments: int
    completed_appointments: int
    no_show_appointments: int
    category_stats: Optional[Dict[str, Any]]


# ====================
# SEARCH AND FILTER SCHEMAS  
# ====================

class AppointmentFilter(BaseModel):
    """Schema pentru filtrarea programărilor"""
    status: Optional[str] = None
    category_id: Optional[int] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    citizen_email: Optional[str] = None
    assigned_to: Optional[UUID] = None
    
    # Paginare
    page: int = Field(1, ge=1)
    size: int = Field(10, ge=1, le=100)


class AppointmentSearchResponse(BaseModel):
    """Schema pentru răspunsul de căutare"""
    appointments: List[AppointmentResponse]
    total: int
    page: int
    size: int
    pages: int


# ====================
# NOTIFICATION SCHEMAS
# ====================

class NotificationCreate(BaseModel):
    """Schema pentru crearea unei notificări"""
    appointment_id: UUID
    notification_type: str
    recipient_email: EmailStr
    subject: str
    message: str
    scheduled_for: Optional[datetime] = None


class NotificationResponse(BaseModel):
    """Schema pentru răspunsul cu notificarea"""
    id: int
    appointment_id: UUID
    notification_type: str
    recipient_email: str
    subject: str
    status: str
    sent_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ====================
# PUBLIC API SCHEMAS
# ====================

class AvailableSlotResponse(BaseModel):
    """Schema pentru sloturile disponibile"""
    date: date
    time: time
    category_id: int
    available_spots: int
    total_spots: int


class BookingRequest(AppointmentCreate):
    """Schema pentru cererea de rezervare (alias pentru create)"""
    pass


class BookingConfirmation(BaseModel):
    """Schema pentru confirmarea rezervării"""
    reference_number: str
    appointment_date: date
    appointment_time: time
    category_name: str
    citizen_name: str
    citizen_email: str
    message: str