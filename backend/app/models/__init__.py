"""
Modelele SQLAlchemy pentru aplicația Primărie Digitală
"""
from .admin import AdminUser, AdminSession, AdminAuditLog
from .municipality import MunicipalityConfig
from .content import (
    ContentCategory, Page, AnnouncementCategory, Announcement
)
from .documents import (
    DocumentCategory, Document, MOLCategory, MOLDocument
)
from .forms import (
    FormType, FormSubmission, EmailTemplate, EmailQueue,
    ComplaintCategory, Complaint, ComplaintUpdate
)
from .appointments import (
    AppointmentCategory, AppointmentTimeSlot, Appointment,
    AppointmentNotification, AppointmentStats
)
from .documents import SearchIndex, PageView, DocumentDownload
# Note: SearchIndex is defined in documents.py to avoid circular imports

__all__ = [
    # Admin models
    "AdminUser",
    "AdminSession", 
    "AdminAuditLog",
    
    # Municipality config
    "MunicipalityConfig",
    
    # Content models
    "ContentCategory",
    "Page",
    "AnnouncementCategory", 
    "Announcement",
    
    # Document models
    "DocumentCategory",
    "Document",
    "MOLCategory",
    "MOLDocument",
    
    # Form models
    "FormType",
    "FormSubmission",
    "EmailTemplate",
    "EmailQueue",
    
    # Complaint models
    "ComplaintCategory",
    "Complaint",
    "ComplaintUpdate",
    
    # Appointment models
    "AppointmentCategory",
    "AppointmentTimeSlot", 
    "Appointment",
    "AppointmentNotification",
    "AppointmentStats",
    
    # Search and analytics
    "SearchIndex",
    "PageView",
    "DocumentDownload",
    
]