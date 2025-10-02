"""
Scheme Pydantic pentru managementul conținutului
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, validator


# ====================================================================
# CONTENT CATEGORIES
# ====================================================================

class ContentCategoryBase(BaseModel):
    """Schema de bază pentru categoriile de conținut"""
    name: str
    slug: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    menu_order: int = 0
    is_active: bool = True


class ContentCategoryResponse(ContentCategoryBase):
    """Schema pentru răspunsul cu categorii de conținut"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ====================================================================
# PAGES
# ====================================================================

class PageBase(BaseModel):
    """Schema de bază pentru pagini"""
    title: str
    slug: str
    content: Optional[str] = None
    excerpt: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    category_id: Optional[int] = None
    parent_id: Optional[int] = None
    menu_order: int = 0
    template: str = "default"
    status: str = "draft"
    is_featured: bool = False
    requires_auth: bool = False
    featured_image: Optional[str] = None
    alt_text: Optional[str] = None
    
    @validator('status')
    def validate_status(cls, v):
        allowed_statuses = ['draft', 'published', 'archived']
        if v not in allowed_statuses:
            raise ValueError(f'Status must be one of: {", ".join(allowed_statuses)}')
        return v
    
    @validator('slug')
    def validate_slug(cls, v):
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('Slug-ul poate conține doar litere, cifre, cratimă și underscore')
        return v.lower()


class PageCreate(PageBase):
    """Schema pentru crearea unei pagini"""
    published_at: Optional[datetime] = None


class PageUpdate(BaseModel):
    """Schema pentru actualizarea unei pagini"""
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    category_id: Optional[int] = None
    parent_id: Optional[int] = None
    menu_order: Optional[int] = None
    template: Optional[str] = None
    status: Optional[str] = None
    is_featured: Optional[bool] = None
    requires_auth: Optional[bool] = None
    featured_image: Optional[str] = None
    alt_text: Optional[str] = None
    published_at: Optional[datetime] = None
    
    @validator('status')
    def validate_status(cls, v):
        if v is not None:
            allowed_statuses = ['draft', 'published', 'archived']
            if v not in allowed_statuses:
                raise ValueError(f'Status must be one of: {", ".join(allowed_statuses)}')
        return v
    
    @validator('slug')
    def validate_slug(cls, v):
        if v is not None and not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('Slug-ul poate conține doar litere, cifre, cratimă și underscore')
        return v.lower() if v else v


class PageResponse(PageBase):
    """Schema pentru răspunsul cu o pagină"""
    id: int
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]
    category: Optional[ContentCategoryResponse] = None
    
    class Config:
        from_attributes = True


class PageListResponse(BaseModel):
    """Schema pentru lista paginilor cu paginare"""
    items: List[PageResponse]
    total: int
    page: int
    limit: int
    total_pages: int


# ====================================================================
# ANNOUNCEMENT CATEGORIES
# ====================================================================

class AnnouncementCategoryBase(BaseModel):
    """Schema de bază pentru categoriile de anunțuri"""
    name: str
    slug: str
    color: Optional[str] = None
    icon: Optional[str] = None
    is_active: bool = True
    
    @validator('color')
    def validate_color(cls, v):
        if v is not None:
            if not v.startswith('#') or len(v) != 7:
                raise ValueError('Culoarea trebuie să fie în format hexadecimal #RRGGBB')
        return v


class AnnouncementCategoryResponse(AnnouncementCategoryBase):
    """Schema pentru răspunsul cu categorii de anunțuri"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ====================================================================
# ANNOUNCEMENTS
# ====================================================================

class AnnouncementBase(BaseModel):
    """Schema de bază pentru anunțuri"""
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    category_id: Optional[int] = None
    tags: Optional[List[str]] = None
    featured_image: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    status: str = "draft"
    is_featured: bool = False
    is_urgent: bool = False
    expires_at: Optional[datetime] = None
    event_start_date: Optional[datetime] = None
    event_end_date: Optional[datetime] = None
    event_location: Optional[str] = None
    meta_description: Optional[str] = None
    
    @validator('status')
    def validate_status(cls, v):
        allowed_statuses = ['draft', 'published', 'scheduled', 'archived']
        if v not in allowed_statuses:
            raise ValueError(f'Status must be one of: {", ".join(allowed_statuses)}')
        return v
    
    @validator('slug')
    def validate_slug(cls, v):
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('Slug-ul poate conține doar litere, cifre, cratimă și underscore')
        return v.lower()
    
    @validator('event_end_date')
    def validate_event_dates(cls, v, values):
        if v is not None and 'event_start_date' in values and values['event_start_date'] is not None:
            if v <= values['event_start_date']:
                raise ValueError('Data de sfârșit trebuie să fie după data de început')
        return v


class AnnouncementCreate(AnnouncementBase):
    """Schema pentru crearea unui anunț"""
    published_at: Optional[datetime] = None


class AnnouncementUpdate(BaseModel):
    """Schema pentru actualizarea unui anunț"""
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    category_id: Optional[int] = None
    tags: Optional[List[str]] = None
    featured_image: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    status: Optional[str] = None
    is_featured: Optional[bool] = None
    is_urgent: Optional[bool] = None
    published_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    event_start_date: Optional[datetime] = None
    event_end_date: Optional[datetime] = None
    event_location: Optional[str] = None
    meta_description: Optional[str] = None
    
    @validator('status')
    def validate_status(cls, v):
        if v is not None:
            allowed_statuses = ['draft', 'published', 'scheduled', 'archived']
            if v not in allowed_statuses:
                raise ValueError(f'Status must be one of: {", ".join(allowed_statuses)}')
        return v
    
    @validator('slug')
    def validate_slug(cls, v):
        if v is not None and not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('Slug-ul poate conține doar litere, cifre, cratimă și underscore')
        return v.lower() if v else v


class AnnouncementResponse(AnnouncementBase):
    """Schema pentru răspunsul cu un anunț"""
    id: int
    view_count: int
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]
    category: Optional[AnnouncementCategoryResponse] = None
    
    class Config:
        from_attributes = True


class AnnouncementListResponse(BaseModel):
    """Schema pentru lista anunțurilor cu paginare"""
    items: List[AnnouncementResponse]
    total: int
    page: int
    limit: int
    total_pages: int


# ====================================================================
# SCHEMAS FOR PUBLIC ENDPOINTS
# ====================================================================

class PublicPageResponse(BaseModel):
    """Schema simplificată pentru paginile publice"""
    title: str
    slug: str
    content: Optional[str]
    excerpt: Optional[str]
    featured_image: Optional[str]
    alt_text: Optional[str]
    meta_description: Optional[str]
    published_at: Optional[datetime]
    category_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class PublicAnnouncementResponse(BaseModel):
    """Schema simplificată pentru anunțurile publice"""
    title: str
    slug: str
    content: str
    excerpt: Optional[str]
    featured_image: Optional[str]
    is_featured: bool
    is_urgent: bool
    published_at: Optional[datetime]
    event_start_date: Optional[datetime]
    event_end_date: Optional[datetime]
    event_location: Optional[str]
    category_name: Optional[str] = None
    category_color: Optional[str] = None
    view_count: int
    
    class Config:
        from_attributes = True