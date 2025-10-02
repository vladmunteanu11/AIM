"""
Scheme Pydantic pentru sistemul de plăți Ghișeul.ro
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PaymentStatus(str, Enum):
    """Status-urile posibile ale unei plăți"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class PaymentMethod(str, Enum):
    """Metodele de plată disponibile"""
    GHISEUL_RO = "ghiseul_ro"
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    CARD = "card"


# Scheme pentru tipuri de taxe
class TaxTypeBase(BaseModel):
    code: str = Field(..., min_length=3, max_length=20)
    name: str = Field(..., min_length=5, max_length=255)
    description: Optional[str] = None
    base_amount: float = Field(0.0, ge=0)
    is_annual: bool = True
    due_date_month: int = Field(3, ge=1, le=12)
    due_date_day: int = Field(31, ge=1, le=31)
    penalty_percentage: float = Field(0.01, ge=0, le=1)
    ghiseul_service_code: Optional[str] = None
    ghiseul_enabled: bool = True
    is_active: bool = True


class TaxTypeCreate(TaxTypeBase):
    pass


class TaxTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_amount: Optional[float] = None
    penalty_percentage: Optional[float] = None
    ghiseul_enabled: Optional[bool] = None
    is_active: Optional[bool] = None


class TaxType(TaxTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Scheme pentru evidența fiscală
class CitizenTaxRecordBase(BaseModel):
    citizen_cnp: Optional[str] = Field(None, min_length=13, max_length=13)
    citizen_cui: Optional[str] = Field(None, max_length=20)
    citizen_name: str = Field(..., min_length=2, max_length=255)
    citizen_email: Optional[EmailStr] = None
    citizen_phone: Optional[str] = Field(None, max_length=20)
    citizen_address: Optional[str] = None
    tax_type_id: int
    property_identifier: Optional[str] = Field(None, max_length=100)
    property_description: Optional[str] = None
    taxable_value: Optional[float] = Field(None, ge=0)
    calculated_amount: Optional[float] = Field(None, ge=0)
    year: int = Field(datetime.now().year, ge=2020, le=2030)
    
    @validator('citizen_cnp')
    def validate_cnp(cls, v):
        if v and (len(v) != 13 or not v.isdigit()):
            raise ValueError('CNP-ul trebuie să aibă exact 13 cifre')
        return v
    
    @validator('citizen_cui')
    def validate_cui(cls, v):
        if v and not v.replace('RO', '').isdigit():
            raise ValueError('CUI-ul trebuie să conțină doar cifre (cu sau fără prefixul RO)')
        return v


class CitizenTaxRecordCreate(CitizenTaxRecordBase):
    pass


class CitizenTaxRecord(CitizenTaxRecordBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Scheme pentru plăți
class PaymentBase(BaseModel):
    tax_type_id: int
    tax_record_id: Optional[int] = None
    payer_name: str = Field(..., min_length=2, max_length=255)
    payer_cnp: Optional[str] = Field(None, min_length=13, max_length=13)
    payer_cui: Optional[str] = Field(None, max_length=20)
    payer_email: Optional[EmailStr] = None
    payer_phone: Optional[str] = Field(None, max_length=20)
    amount: float = Field(..., gt=0)
    penalty_amount: float = Field(0.0, ge=0)
    payment_year: int = Field(datetime.now().year, ge=2020, le=2030)
    description: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    payment_method: PaymentMethod = PaymentMethod.GHISEUL_RO


class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    ghiseul_payment_id: Optional[str] = None
    payment_date: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    notes: Optional[str] = None


class Payment(PaymentBase):
    id: int
    payment_id: str
    ghiseul_payment_id: Optional[str] = None
    reference_number: str
    total_amount: float
    status: PaymentStatus
    payment_method: PaymentMethod
    ghiseul_session_id: Optional[str] = None
    ghiseul_redirect_url: Optional[str] = None
    created_at: datetime
    payment_date: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Scheme pentru Ghișeul.ro
class GhiseulPaymentRequest(BaseModel):
    """Request pentru inițierea plății prin Ghișeul.ro"""
    payment_id: str
    amount: float
    description: str
    payer_name: str
    payer_cnp: Optional[str] = None
    payer_email: Optional[str] = None
    tax_code: str
    return_url: str
    cancel_url: str


class GhiseulPaymentResponse(BaseModel):
    """Response de la Ghișeul.ro pentru inițierea plății"""
    success: bool
    session_id: Optional[str] = None
    redirect_url: Optional[str] = None
    error_message: Optional[str] = None
    error_code: Optional[str] = None


class GhiseulCallback(BaseModel):
    """Date primite în callback de la Ghișeul.ro"""
    payment_id: str
    ghiseul_payment_id: str
    session_id: str
    status: str
    amount: float
    payment_date: datetime
    signature: str
    additional_data: Optional[dict] = None


class GhiseulConfiguration(BaseModel):
    """Configurarea integrării cu Ghișeul.ro"""
    merchant_id: str
    api_base_url: str = "https://www.ghiseul.ro/ghiseul/api"
    payment_url: str = "https://www.ghiseul.ro/ghiseul/public/platapersonalfizica"
    callback_url: str
    success_url: str
    cancel_url: str
    test_mode: bool = True
    session_timeout: int = 1800
    institution_name: str
    institution_code: str
    institution_account: str


# Scheme pentru calculul taxelor
class TaxCalculationRequest(BaseModel):
    """Request pentru calculul unei taxe"""
    tax_type_code: str
    taxable_value: float
    year: int = datetime.now().year
    citizen_cnp: Optional[str] = None
    property_details: Optional[dict] = None


class TaxCalculationResponse(BaseModel):
    """Response cu calculul taxei"""
    tax_type_code: str
    tax_type_name: str
    taxable_value: float
    base_amount: float
    calculated_amount: float
    penalty_amount: float
    total_amount: float
    due_date: datetime
    is_overdue: bool
    calculation_details: dict


# Scheme pentru statistici
class PaymentStats(BaseModel):
    """Statistici plăți"""
    total_payments: int
    total_amount: float
    completed_payments: int
    completed_amount: float
    pending_payments: int
    pending_amount: float
    failed_payments: int
    payments_by_method: dict
    payments_by_tax_type: dict
    monthly_stats: List[dict]


class TaxRecordStats(BaseModel):
    """Statistici evidență fiscală"""
    total_taxpayers: int
    total_tax_records: int
    total_taxable_amount: float
    collection_rate: float
    overdue_amount: float
    stats_by_tax_type: dict


# Scheme pentru rapoarte
class PaymentReport(BaseModel):
    """Raport plăți pentru o perioadă"""
    period_start: datetime
    period_end: datetime
    total_payments: int
    total_amount: float
    payments: List[Payment]
    summary_by_tax_type: dict
    summary_by_method: dict


# Scheme pentru integrarea cu formularele
class FormPaymentInfo(BaseModel):
    """Informații de plată pentru un formular"""
    form_submission_id: str
    tax_type_code: str
    amount: float
    description: str
    required_documents: List[str]
    payment_deadline: Optional[datetime] = None


class QuickPaymentRequest(BaseModel):
    """Request pentru plată rapidă (fără cont utilizator)"""
    tax_type_code: str
    payer_name: str
    payer_cnp: Optional[str] = None
    payer_email: Optional[EmailStr] = None
    amount: float
    property_identifier: Optional[str] = None
    description: Optional[str] = None