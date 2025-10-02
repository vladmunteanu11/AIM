"""
Modele pentru sistemul de programări online
"""
import uuid
from datetime import datetime, date, time
from typing import Optional
from sqlalchemy import Column, String, Boolean, DateTime, Date, Time, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class AppointmentCategory(Base):
    """Categorii pentru tipurile de programări"""
    __tablename__ = "appointment_categories"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=True)  # Culoare hex pentru UI
    icon = Column(String(50), nullable=True)  # Icon pentru UI
    
    # Configurare programări
    is_active = Column(Boolean, default=True, nullable=False)
    requires_documents = Column(Boolean, default=False, nullable=False)
    required_documents = Column(JSONB, nullable=True)  # Lista documente necesare
    max_appointments_per_day = Column(Integer, default=10, nullable=False)
    appointment_duration_minutes = Column(Integer, default=30, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relații
    appointments = relationship("Appointment", back_populates="category")
    time_slots = relationship("AppointmentTimeSlot", back_populates="category")
    
    def __repr__(self):
        return f"<AppointmentCategory(name='{self.name}', slug='{self.slug}')>"


class AppointmentTimeSlot(Base):
    """Sloturile de timp disponibile pentru programări"""
    __tablename__ = "appointment_time_slots"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("appointment_categories.id"), nullable=False)
    
    # Configurare slot
    day_of_week = Column(Integer, nullable=False)  # 1=Luni, 2=Marți, etc.
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    max_appointments = Column(Integer, default=1, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relații
    category = relationship("AppointmentCategory", back_populates="time_slots")
    
    def __repr__(self):
        return f"<AppointmentTimeSlot(day={self.day_of_week}, time={self.start_time}-{self.end_time})>"


class Appointment(Base):
    """Programări făcute de cetățeni"""
    __tablename__ = "appointments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(Integer, ForeignKey("appointment_categories.id"), nullable=False)
    
    # Date solicitant
    citizen_name = Column(String(255), nullable=False)
    citizen_email = Column(String(255), nullable=False)
    citizen_phone = Column(String(50), nullable=False)
    citizen_cnp = Column(String(13), nullable=True)  # Pentru verificare identitate
    citizen_address = Column(Text, nullable=True)
    
    # Detalii programare
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(Time, nullable=False)
    subject = Column(String(500), nullable=False)  # Motivul programării
    details = Column(Text, nullable=True)  # Detalii suplimentare
    attached_files = Column(JSONB, nullable=True)  # Documente atașate
    
    # Status și procesare
    status = Column(String(50), default='pending', nullable=False)
    # Status: pending, confirmed, cancelled, completed, no_show
    status_notes = Column(Text, nullable=True)
    
    # Tracking
    reference_number = Column(String(50), unique=True, nullable=False)
    priority = Column(String(20), default='normal', nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Admin management
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("admin_users.id"), nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    # GDPR
    consent_given = Column(Boolean, default=False, nullable=False)
    data_retention_until = Column(Date, nullable=True)
    
    # Relații
    category = relationship("AppointmentCategory", back_populates="appointments")
    assigned_admin = relationship("AdminUser")
    notifications = relationship("AppointmentNotification", back_populates="appointment")
    
    def __repr__(self):
        return f"<Appointment(ref='{self.reference_number}', citizen='{self.citizen_name}')>"
    
    @property
    def is_upcoming(self) -> bool:
        """Verifică dacă programarea este viitoare"""
        now = datetime.now().date()
        return self.appointment_date >= now and self.status in ['pending', 'confirmed']
    
    @property
    def is_past(self) -> bool:
        """Verifică dacă programarea a trecut"""
        now = datetime.now().date()
        return self.appointment_date < now
    
    @property
    def can_be_cancelled(self) -> bool:
        """Verifică dacă programarea poate fi anulată"""
        if self.status not in ['pending', 'confirmed']:
            return False
        
        # Nu poate fi anulată cu mai puțin de 24h înainte
        appointment_datetime = datetime.combine(self.appointment_date, self.appointment_time)
        now = datetime.now()
        hours_until_appointment = (appointment_datetime - now).total_seconds() / 3600
        
        return hours_until_appointment >= 24
    
    @classmethod
    def generate_reference_number(cls) -> str:
        """Generează număr de referință unic"""
        from datetime import datetime
        now = datetime.now()
        return f"PROG-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


class AppointmentNotification(Base):
    """Notificări pentru programări"""
    __tablename__ = "appointment_notifications"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    
    # Tipul notificării
    notification_type = Column(String(50), nullable=False)
    # Types: confirmation, reminder, cancellation, status_update
    
    # Detalii notificare
    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Status trimitere
    status = Column(String(20), default='pending', nullable=False)
    # Status: pending, sent, failed
    sent_at = Column(DateTime(timezone=True), nullable=True)
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    # Relații
    appointment = relationship("Appointment", back_populates="notifications")
    
    def __repr__(self):
        return f"<AppointmentNotification(type='{self.notification_type}', status='{self.status}')>"


class AppointmentStats(Base):
    """Statistici pentru programări (cache pentru performance)"""
    __tablename__ = "appointment_stats"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    stats_date = Column(Date, nullable=False, unique=True)
    
    # Statistici zilnice
    total_appointments = Column(Integer, default=0, nullable=False)
    confirmed_appointments = Column(Integer, default=0, nullable=False)
    cancelled_appointments = Column(Integer, default=0, nullable=False)
    completed_appointments = Column(Integer, default=0, nullable=False)
    no_show_appointments = Column(Integer, default=0, nullable=False)
    
    # Statistici pe categorii (JSON)
    category_stats = Column(JSONB, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<AppointmentStats(date='{self.stats_date}', total={self.total_appointments})>"