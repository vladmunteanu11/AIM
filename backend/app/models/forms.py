"""
Modele pentru formulare online și servicii digitale
"""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, ForeignKey, Date, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class FormType(Base):
    """Tipuri de formulare disponibile pentru cetățeni"""
    __tablename__ = "form_types"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Structura formularului (JSON Schema)
    form_schema = Column(JSONB, nullable=False)
    validation_rules = Column(JSONB, nullable=True)
    
    # Configurare
    is_active = Column(Boolean, default=True, nullable=False)
    requires_auth = Column(Boolean, default=False, nullable=False)
    max_submissions_per_day = Column(Integer, nullable=True)
    
    # Documente necesare
    required_documents = Column(ARRAY(String), nullable=True)
    instructions = Column(Text, nullable=True)
    
    # Email notificări
    notification_emails = Column(ARRAY(String), nullable=True)
    auto_reply_template = Column(Text, nullable=True)
    
    # Workflow
    approval_required = Column(Boolean, default=False, nullable=False)
    estimated_processing_days = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relații
    submissions = relationship("FormSubmission", back_populates="form_type")
    
    def __repr__(self):
        return f"<FormType(name='{self.name}', slug='{self.slug}')>"
    
    @property
    def total_submissions(self) -> int:
        """Returnează numărul total de submisii pentru acest tip de formular"""
        return len(self.submissions)
    
    @property
    def pending_submissions(self) -> int:
        """Returnează numărul de submisii în așteptare"""
        return len([s for s in self.submissions if s.status == 'pending'])


class FormSubmission(Base):
    """Submisii formulare de la cetățeni"""
    __tablename__ = "form_submissions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    form_type_id = Column(Integer, ForeignKey("form_types.id"), nullable=False)
    
    # Date solicitant
    citizen_name = Column(String(255), nullable=False)
    citizen_email = Column(String(255), nullable=True)
    citizen_phone = Column(String(50), nullable=True)
    citizen_cnp = Column(String(13), nullable=True)  # pentru verificare identitate
    citizen_address = Column(Text, nullable=True)
    
    # Datele formularului
    submission_data = Column(JSONB, nullable=False)
    attached_files = Column(ARRAY(String), nullable=True)  # array cu căi către fișiere
    
    # Status și procesare
    status = Column(String(50), default='pending', nullable=False)
    status_notes = Column(Text, nullable=True)
    
    # Tracking
    reference_number = Column(String(50), unique=True, nullable=False)
    priority = Column(String(20), default='normal', nullable=False)
    
    # Timestamps
    submitted_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Procesare
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("admin_users.id"), nullable=True)
    processing_notes = Column(Text, nullable=True)
    
    # GDPR
    consent_given = Column(Boolean, default=False, nullable=False)
    data_retention_until = Column(Date, nullable=True)
    
    # Relații
    form_type = relationship("FormType", back_populates="submissions")
    assigned_admin = relationship("AdminUser", foreign_keys=[assigned_to])
    
    def __repr__(self):
        return f"<FormSubmission(ref='{self.reference_number}', status='{self.status}')>"
    
    @property
    def is_overdue(self) -> bool:
        """Verifică dacă cererea este întârziată"""
        if not self.form_type.estimated_processing_days:
            return False
        
        from datetime import timedelta
        expected_completion = self.submitted_at + timedelta(
            days=self.form_type.estimated_processing_days
        )
        return datetime.utcnow() > expected_completion and self.status not in ['completed', 'rejected']
    
    @property
    def processing_time_days(self) -> int:
        """Calculează numărul de zile de procesare"""
        if self.completed_at:
            return (self.completed_at - self.submitted_at).days
        return (datetime.utcnow() - self.submitted_at).days
    
    @property
    def days_until_retention_expiry(self) -> int:
        """Calculează câte zile rămân până la expirarea retenției datelor"""
        if not self.data_retention_until:
            return 365  # default 1 an
        
        days_left = (self.data_retention_until - date.today()).days
        return max(0, days_left)
    
    def assign_to_admin(self, admin_id: uuid.UUID):
        """Asignează cererea unui administrator"""
        self.assigned_to = admin_id
        self.assigned_at = datetime.utcnow()
        if self.status == 'pending':
            self.status = 'in_review'
    
    def update_status(self, new_status: str, notes: str = None, admin_id: uuid.UUID = None):
        """Actualizează statusul cererii"""
        old_status = self.status
        self.status = new_status
        
        if notes:
            self.status_notes = notes
        
        if new_status == 'in_review' and not self.assigned_at:
            self.assigned_at = datetime.utcnow()
            if admin_id:
                self.assigned_to = admin_id
        
        if new_status in ['approved', 'rejected', 'completed']:
            self.processed_at = datetime.utcnow()
        
        if new_status == 'completed':
            self.completed_at = datetime.utcnow()
    
    def set_data_retention(self, years: int = 3):
        """Setează perioada de retenție a datelor conform GDPR"""
        from datetime import timedelta
        self.data_retention_until = date.today() + timedelta(days=years * 365)


# Model pentru notificări email
class EmailTemplate(Base):
    """Șabloane email pentru notificări"""
    __tablename__ = "email_templates"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    subject = Column(String(255), nullable=False)
    body_text = Column(Text, nullable=False)
    body_html = Column(Text, nullable=True)
    variables = Column(ARRAY(String), nullable=True)  # variabile disponibile în șablon
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<EmailTemplate(name='{self.name}')>"


class EmailQueue(Base):
    """Coada de email-uri de trimis"""
    __tablename__ = "email_queue"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    to_email = Column(String(255), nullable=False)
    cc_emails = Column(ARRAY(String), nullable=True)
    bcc_emails = Column(ARRAY(String), nullable=True)
    subject = Column(String(255), nullable=False)
    body_text = Column(Text, nullable=True)
    body_html = Column(Text, nullable=True)
    attachments = Column(JSONB, nullable=True)  # array cu fișiere atașate
    
    # Status trimitere
    status = Column(String(20), default='pending', nullable=False)  # pending, sent, failed
    attempts = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=3, nullable=False)
    error_message = Column(Text, nullable=True)
    
    # Timing
    send_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<EmailQueue(to='{self.to_email}', status='{self.status}')>"
    
    @property
    def can_retry(self) -> bool:
        """Verifică dacă email-ul poate fi reîncercat"""
        return self.attempts < self.max_attempts and self.status == 'failed'
    
    def mark_sent(self):
        """Marchează email-ul ca trimis cu succes"""
        self.status = 'sent'
        self.sent_at = datetime.utcnow()
    
    def mark_failed(self, error: str):
        """Marchează email-ul ca eșuat"""
        self.status = 'failed'
        self.attempts += 1
        self.error_message = error


class ComplaintCategory(Base):
    """Categorii de sesizări și reclamații"""
    __tablename__ = "complaint_categories"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Configurare
    is_active = Column(Boolean, default=True, nullable=False)
    requires_location = Column(Boolean, default=True, nullable=False)
    requires_photos = Column(Boolean, default=False, nullable=False)
    
    # Departament responsabil
    responsible_department = Column(String(255), nullable=True)
    notification_emails = Column(ARRAY(String), nullable=True)
    
    # SLA (Service Level Agreement)
    response_time_hours = Column(Integer, default=24, nullable=False)
    resolution_time_days = Column(Integer, default=7, nullable=False)
    
    # Ordinea de afișare
    sort_order = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relații
    complaints = relationship("Complaint", back_populates="category")
    
    def __repr__(self):
        return f"<ComplaintCategory(name='{self.name}', slug='{self.slug}')>"


class Complaint(Base):
    """Sesizări și reclamații de la cetățeni"""
    __tablename__ = "complaints"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(Integer, ForeignKey("complaint_categories.id"), nullable=False)
    
    # Date cetățean
    citizen_name = Column(String(255), nullable=False)
    citizen_email = Column(String(255), nullable=True)
    citizen_phone = Column(String(50), nullable=True)
    citizen_address = Column(Text, nullable=True)
    
    # Opțiune anonimat
    is_anonymous = Column(Boolean, default=False, nullable=False)
    
    # Conținutul sesizării
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    
    # Localizare
    location_address = Column(Text, nullable=True)
    location_details = Column(Text, nullable=True)
    latitude = Column(String(50), nullable=True)
    longitude = Column(String(50), nullable=True)
    
    # Fișiere atașate
    attached_photos = Column(ARRAY(String), nullable=True)
    attached_documents = Column(ARRAY(String), nullable=True)
    
    # Status procesare
    status = Column(String(50), default='submitted', nullable=False)
    # submitted -> acknowledged -> in_progress -> resolved -> closed
    
    # Urgență
    urgency_level = Column(String(20), default='normal', nullable=False)
    # low, normal, high, critical
    
    # Tracking
    reference_number = Column(String(50), unique=True, nullable=False)
    
    # Timestamps
    submitted_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Procesare de către administrație
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("admin_users.id"), nullable=True)
    admin_notes = Column(Text, nullable=True)
    citizen_feedback = Column(Text, nullable=True)
    citizen_satisfaction = Column(Integer, nullable=True)  # 1-5 rating
    
    # GDPR și consimțământ
    consent_given = Column(Boolean, default=False, nullable=False)
    data_retention_until = Column(Date, nullable=True)
    
    # Notificare SMS/Email
    notification_preferences = Column(JSONB, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relații
    category = relationship("ComplaintCategory", back_populates="complaints")
    assigned_admin = relationship("AdminUser", foreign_keys=[assigned_to])
    updates = relationship("ComplaintUpdate", back_populates="complaint", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Complaint(ref='{self.reference_number}', status='{self.status}')>"
    
    @property
    def is_overdue(self) -> bool:
        """Verifică dacă sesizarea este întârziată"""
        if self.status in ['resolved', 'closed']:
            return False
        
        from datetime import timedelta
        if self.status == 'submitted' and self.category.response_time_hours:
            deadline = self.submitted_at + timedelta(hours=self.category.response_time_hours)
            return datetime.utcnow() > deadline
        
        if self.status in ['acknowledged', 'in_progress'] and self.category.resolution_time_days:
            deadline = self.submitted_at + timedelta(days=self.category.resolution_time_days)
            return datetime.utcnow() > deadline
        
        return False
    
    @property
    def processing_time_days(self) -> int:
        """Calculează timpul de procesare în zile"""
        end_time = self.resolved_at or datetime.utcnow()
        return (end_time - self.submitted_at).days
    
    def update_status(self, new_status: str, admin_notes: str = None, admin_id: uuid.UUID = None):
        """Actualizează statusul sesizării"""
        old_status = self.status
        self.status = new_status
        
        now = datetime.utcnow()
        
        if new_status == 'acknowledged' and not self.acknowledged_at:
            self.acknowledged_at = now
        elif new_status == 'in_progress' and not self.started_at:
            self.started_at = now
        elif new_status == 'resolved' and not self.resolved_at:
            self.resolved_at = now
        elif new_status == 'closed' and not self.closed_at:
            self.closed_at = now
        
        if admin_notes:
            self.admin_notes = admin_notes
        
        if admin_id:
            self.assigned_to = admin_id
        
        # Creează o înregistrare în historicul actualizărilor
        update = ComplaintUpdate(
            complaint_id=self.id,
            status_from=old_status,
            status_to=new_status,
            notes=admin_notes,
            updated_by=admin_id
        )
        self.updates.append(update)
    
    def set_data_retention(self, years: int = 5):
        """Setează perioada de retenție a datelor pentru sesizări"""
        from datetime import timedelta
        self.data_retention_until = date.today() + timedelta(days=years * 365)


class ComplaintUpdate(Base):
    """Istoricul actualizărilor pentru sesizări"""
    __tablename__ = "complaint_updates"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(UUID(as_uuid=True), ForeignKey("complaints.id"), nullable=False)
    
    # Schimbarea de status
    status_from = Column(String(50), nullable=True)
    status_to = Column(String(50), nullable=False)
    
    # Detalii actualizare
    notes = Column(Text, nullable=True)
    is_public = Column(Boolean, default=True, nullable=False)  # vizibil pentru cetățean?
    
    # Cine a făcut actualizarea
    updated_by = Column(UUID(as_uuid=True), ForeignKey("admin_users.id"), nullable=True)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    # Relații
    complaint = relationship("Complaint", back_populates="updates")
    admin = relationship("AdminUser", foreign_keys=[updated_by])
    
    def __repr__(self):
        return f"<ComplaintUpdate(complaint_id='{self.complaint_id}', status='{self.status_to}')>"