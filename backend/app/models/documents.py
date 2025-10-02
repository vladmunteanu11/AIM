"""
Modele pentru managementul documentelor și MOL
"""
import uuid
from datetime import date, datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, ForeignKey, Date, ARRAY
from sqlalchemy.dialects.postgresql import UUID, TSVECTOR
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class DocumentCategory(Base):
    """Categorii pentru organizarea documentelor"""
    __tablename__ = "document_categories"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("document_categories.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    # Relații
    parent = relationship("DocumentCategory", remote_side=[id], backref="children")
    documents = relationship("Document", back_populates="category")
    
    def __repr__(self):
        return f"<DocumentCategory(name='{self.name}', slug='{self.slug}')>"


class Document(Base):
    """Documente generale (diferite de MOL)"""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Categorizare
    category_id = Column(Integer, ForeignKey("document_categories.id"), nullable=True)
    tags = Column(ARRAY(String), nullable=True)
    
    # Fișier
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)
    file_size = Column(Integer, nullable=True)
    
    # Proprietăți
    is_public = Column(Boolean, default=True, nullable=False)
    requires_auth = Column(Boolean, default=False, nullable=False)
    download_count = Column(Integer, default=0, nullable=False)
    
    # Metadata
    version = Column(String(20), default="1.0", nullable=False)
    language = Column(String(5), default="ro", nullable=False)
    
    # Audit
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("admin_users.id"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relații
    category = relationship("DocumentCategory", back_populates="documents")
    
    def __repr__(self):
        return f"<Document(title='{self.title}', file_type='{self.file_type}')>"
    
    @property
    def file_size_formatted(self) -> str:
        """Returnează dimensiunea fișierului formatată"""
        if not self.file_size:
            return "N/A"
        
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
    
    def increment_download_count(self):
        """Incrementează numărul de descărcări"""
        self.download_count = (self.download_count or 0) + 1


class MOLCategory(Base):
    """Categorii MOL conform legislației române"""
    __tablename__ = "mol_categories"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_required = Column(Boolean, default=False, nullable=False)  # categorii obligatorii per lege
    section_order = Column(Integer, nullable=True)
    parent_id = Column(Integer, ForeignKey("mol_categories.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    # Relații
    parent = relationship("MOLCategory", remote_side=[id], backref="children")
    documents = relationship("MOLDocument", back_populates="category")
    
    def __repr__(self):
        return f"<MOLCategory(name='{self.name}', required='{self.is_required}')>"


class MOLDocument(Base):
    """Documente pentru Monitorul Oficial Local"""
    __tablename__ = "mol_documents"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("mol_categories.id"), nullable=False)
    title = Column(String(255), nullable=False)
    document_number = Column(String(100), nullable=True)  # numărul actului
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)  # conținutul textual pentru indexare
    
    # Fișier atașat
    file_path = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(20), nullable=True)
    file_size = Column(Integer, nullable=True)
    
    # Date oficiale
    adoption_date = Column(Date, nullable=True)  # data adoptării
    effective_date = Column(Date, nullable=True)  # data intrării în vigoare
    published_date = Column(Date, nullable=False)
    
    # Stare
    status = Column(String(20), default="published", nullable=False)
    is_public = Column(Boolean, default=True, nullable=False)
    
    # Audit
    created_by = Column(UUID(as_uuid=True), ForeignKey("admin_users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relații
    category = relationship("MOLCategory", back_populates="documents")
    
    def __repr__(self):
        return f"<MOLDocument(title='{self.title}', number='{self.document_number}')>"
    
    @property
    def is_effective(self) -> bool:
        """Verifică dacă documentul este în vigoare"""
        if self.effective_date is None:
            return True  # dacă nu e specificată, presupunem că e în vigoare
        return date.today() >= self.effective_date
    
    @property
    def file_size_formatted(self) -> str:
        """Returnează dimensiunea fișierului formatată"""
        if not self.file_size:
            return "N/A"
        
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"


# Modelele pentru search și analytics sunt create separat pentru a evita dependențele circulare

class SearchIndex(Base):
    """Index pentru căutarea rapidă în tot conținutul site-ului"""
    __tablename__ = "search_index"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    content_type = Column(String(50), nullable=False)  # 'page', 'announcement', 'document', 'mol'
    content_id = Column(String(100), nullable=False)  # string pentru a suporta UUID-uri
    title = Column(String(255), nullable=False)
    content_text = Column(Text, nullable=False)
    url = Column(String(500), nullable=False)
    tags = Column(ARRAY(String), nullable=True)
    category = Column(String(100), nullable=True)
    search_vector = Column(TSVECTOR, nullable=True)  # pentru full-text search PostgreSQL
    last_indexed = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<SearchIndex(type='{self.content_type}', title='{self.title}')>"


class PageView(Base):
    """Statistici vizitatori pentru pagini"""
    __tablename__ = "page_views"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    page_url = Column(String(500), nullable=False)
    page_title = Column(String(255), nullable=True)
    visitor_ip = Column(String(45), nullable=True)  # IPv6 poate fi mai lung
    user_agent = Column(Text, nullable=True)
    referrer = Column(String(500), nullable=True)
    session_id = Column(String(255), nullable=True)
    view_date = Column(Date, nullable=False)
    view_time = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<PageView(url='{self.page_url}', date='{self.view_date}')>"


class DocumentDownload(Base):
    """Statistici download documente"""
    __tablename__ = "document_downloads"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    mol_document_id = Column(Integer, ForeignKey("mol_documents.id"), nullable=True)
    visitor_ip = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    download_date = Column(Date, nullable=False)
    download_time = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    # Relații
    document = relationship("Document", foreign_keys=[document_id])
    mol_document = relationship("MOLDocument", foreign_keys=[mol_document_id])
    
    def __repr__(self):
        return f"<DocumentDownload(doc_id='{self.document_id or self.mol_document_id}', date='{self.download_date}')>"