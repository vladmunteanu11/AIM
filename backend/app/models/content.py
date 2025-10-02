"""
Modele pentru managementul conținutului
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class ContentCategory(Base):
    """Categorii pentru organizarea conținutului"""
    __tablename__ = "content_categories"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("content_categories.id"), nullable=True)
    menu_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    # Relații
    parent = relationship("ContentCategory", remote_side=[id], backref="children")
    pages = relationship("Page", back_populates="category")
    
    def __repr__(self):
        return f"<ContentCategory(name='{self.name}', slug='{self.slug}')>"


class Page(Base):
    """Pagini statice cu conținut editabil"""
    __tablename__ = "pages"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    content = Column(Text, nullable=True)
    excerpt = Column(Text, nullable=True)
    meta_description = Column(Text, nullable=True)
    meta_keywords = Column(Text, nullable=True)
    
    # Organizare
    category_id = Column(Integer, ForeignKey("content_categories.id"), nullable=True)
    parent_id = Column(Integer, ForeignKey("pages.id"), nullable=True)
    menu_order = Column(Integer, default=0, nullable=False)
    template = Column(String(50), default="default", nullable=False)
    
    # Stare și vizibilitate
    status = Column(String(20), default="published", nullable=False)  # draft, published, archived
    is_featured = Column(Boolean, default=False, nullable=False)
    requires_auth = Column(Boolean, default=False, nullable=False)
    
    # SEO și accesibilitate
    featured_image = Column(String(500), nullable=True)
    alt_text = Column(Text, nullable=True)
    
    # Audit
    created_by = Column(UUID(as_uuid=True), ForeignKey("admin_users.id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("admin_users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relații
    category = relationship("ContentCategory", back_populates="pages")
    parent = relationship("Page", remote_side=[id], backref="children")
    
    def __repr__(self):
        return f"<Page(title='{self.title}', slug='{self.slug}', status='{self.status}')>"
    
    @property
    def is_published(self) -> bool:
        """Verifică dacă pagina este publicată"""
        return self.status == "published" and (
            self.published_at is None or self.published_at <= datetime.utcnow()
        )
    
    @property
    def full_url(self) -> str:
        """URL-ul complet al paginii"""
        return f"/pagina/{self.slug}"


class AnnouncementCategory(Base):
    """Categorii pentru anunțuri și evenimente"""
    __tablename__ = "announcement_categories"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    color = Column(String(7), nullable=True)  # culoare hex pentru UI
    icon = Column(String(50), nullable=True)  # numele iconului
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    # Relații
    announcements = relationship("Announcement", back_populates="category")
    
    def __repr__(self):
        return f"<AnnouncementCategory(name='{self.name}', slug='{self.slug}')>"


class Announcement(Base):
    """Anunțuri și evenimente publice"""
    __tablename__ = "announcements"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    content = Column(Text, nullable=False)
    excerpt = Column(Text, nullable=True)
    
    # Categorizare
    category_id = Column(Integer, ForeignKey("announcement_categories.id"), nullable=True)
    tags = Column(ARRAY(String), nullable=True)  # array de tag-uri
    
    # Vizuale
    featured_image = Column(String(500), nullable=True)
    gallery_images = Column(ARRAY(String), nullable=True)  # array de URL-uri
    
    # Programare și vizibilitate
    status = Column(String(20), default="draft", nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    is_urgent = Column(Boolean, default=False, nullable=False)
    
    # Programare publicare
    published_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Evenimente specifice
    event_start_date = Column(DateTime(timezone=True), nullable=True)
    event_end_date = Column(DateTime(timezone=True), nullable=True)
    event_location = Column(Text, nullable=True)
    
    # SEO
    meta_description = Column(Text, nullable=True)
    
    # Statistici
    view_count = Column(Integer, default=0, nullable=False)
    
    # Audit
    created_by = Column(UUID(as_uuid=True), ForeignKey("admin_users.id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("admin_users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relații
    category = relationship("AnnouncementCategory", back_populates="announcements")
    
    def __repr__(self):
        return f"<Announcement(title='{self.title}', status='{self.status}')>"
    
    @property
    def is_published(self) -> bool:
        """Verifică dacă anunțul este publicat și vizibil"""
        now = datetime.utcnow()
        return (
            self.status == "published" and
            (self.published_at is None or self.published_at <= now) and
            (self.expires_at is None or self.expires_at > now)
        )
    
    @property
    def is_event(self) -> bool:
        """Verifică dacă este un eveniment (are date programate)"""
        return self.event_start_date is not None
    
    @property
    def is_expired(self) -> bool:
        """Verifică dacă anunțul a expirat"""
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at
    
    @property
    def full_url(self) -> str:
        """URL-ul complet al anunțului"""
        return f"/anunturi/{self.slug}"
    
    def increment_view_count(self):
        """Incrementează numărul de vizualizări"""
        self.view_count = (self.view_count or 0) + 1