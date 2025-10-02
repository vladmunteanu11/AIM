"""
Scheme Pydantic pentru managementul fișierelor și documentelor
"""
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, validator


class FileInfoBase(BaseModel):
    """Schema de bază pentru informații fișier"""
    filename: str = Field(..., description="Numele fișierului")
    size: int = Field(..., description="Dimensiunea în bytes")
    mime_type: Optional[str] = Field(None, description="Tipul MIME")
    extension: str = Field(..., description="Extensia fișierului")


class FileUploadResponse(FileInfoBase):
    """Răspuns pentru upload fișier"""
    file_path: str = Field(..., description="Calea relativă a fișierului")
    file_hash: str = Field(..., description="Hash-ul fișierului")
    thumbnail_path: Optional[str] = Field(None, description="Calea thumbnail-ului")
    upload_timestamp: str = Field(..., description="Timestamp upload")


class DocumentCategoryBase(BaseModel):
    """Schema de bază pentru categorii documente"""
    name: str = Field(..., max_length=255, description="Numele categoriei")
    slug: str = Field(..., max_length=100, description="Slug-ul categoriei")
    description: Optional[str] = Field(None, description="Descrierea categoriei")
    parent_id: Optional[int] = Field(None, description="ID-ul categoriei părinte")


class DocumentCategoryCreate(DocumentCategoryBase):
    """Schema pentru crearea unei categorii"""
    pass


class DocumentCategoryUpdate(BaseModel):
    """Schema pentru actualizarea unei categorii"""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None)
    parent_id: Optional[int] = Field(None)
    is_active: Optional[bool] = Field(None)


class DocumentCategory(DocumentCategoryBase):
    """Schema completă pentru categorie document"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    is_active: bool
    created_at: datetime


class DocumentBase(BaseModel):
    """Schema de bază pentru documente"""
    title: str = Field(..., max_length=255, description="Titlul documentului")
    description: Optional[str] = Field(None, description="Descrierea documentului")
    category_id: Optional[int] = Field(None, description="ID-ul categoriei")
    tags: Optional[List[str]] = Field(default_factory=list, description="Tag-urile documentului")
    is_public: bool = Field(True, description="Document public")
    requires_auth: bool = Field(False, description="Necesită autentificare")


class DocumentCreate(DocumentBase):
    """Schema pentru crearea unui document"""
    pass


class DocumentUpdate(BaseModel):
    """Schema pentru actualizarea unui document"""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None)
    category_id: Optional[int] = Field(None)
    tags: Optional[List[str]] = Field(None)
    is_public: Optional[bool] = Field(None)
    requires_auth: Optional[bool] = Field(None)


class Document(DocumentBase):
    """Schema completă pentru document"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    file_path: str
    file_name: str
    file_type: str
    file_size: int
    download_count: int
    version: str
    language: str
    uploaded_by: Optional[str]
    uploaded_at: datetime
    updated_at: datetime
    
    # Proprietăți calculate
    file_size_formatted: str
    
    # Relații
    category: Optional[DocumentCategory] = None


class DocumentWithFileInfo(Document):
    """Document cu informații extinse despre fișier"""
    file_info: Optional[Dict[str, Any]] = Field(None, description="Informații extinse fișier")
    thumbnail_url: Optional[str] = Field(None, description="URL thumbnail")
    download_url: str = Field(..., description="URL pentru descărcare")


class DocumentList(BaseModel):
    """Lista de documente cu paginare"""
    documents: List[Document]
    total: int
    page: int
    per_page: int
    pages: int


class DocumentSearchRequest(BaseModel):
    """Cerere pentru căutarea documentelor"""
    search_term: Optional[str] = Field(None, description="Termenul de căutat")
    category_id: Optional[int] = Field(None, description="Filtru categorie")
    file_type: Optional[str] = Field(None, description="Filtru tip fișier")
    is_public: Optional[bool] = Field(None, description="Filtru public/privat")
    tags: Optional[List[str]] = Field(None, description="Filtru tag-uri")
    date_from: Optional[date] = Field(None, description="Data început")
    date_to: Optional[date] = Field(None, description="Data sfârșit")
    sort_by: Optional[str] = Field("uploaded_at", description="Sortare după")
    sort_order: Optional[str] = Field("desc", description="Ordinea sortării")
    page: int = Field(1, ge=1, description="Numărul paginii")
    per_page: int = Field(20, ge=1, le=100, description="Elemente per pagină")


class FileValidationRequest(BaseModel):
    """Cerere pentru validarea unui fișier"""
    filename: str = Field(..., description="Numele fișierului")
    content_type: str = Field(..., description="Tipul MIME")
    size: int = Field(..., description="Dimensiunea în bytes")


class FileValidationResponse(BaseModel):
    """Răspuns pentru validarea fișierului"""
    is_valid: bool = Field(..., description="Fișierul este valid")
    errors: List[str] = Field(default_factory=list, description="Lista erorilor")
    warnings: List[str] = Field(default_factory=list, description="Lista avertismentelor")


class BulkUploadRequest(BaseModel):
    """Cerere pentru upload în masă"""
    category_id: Optional[int] = Field(None, description="Categoria pentru toate documentele")
    tags: Optional[List[str]] = Field(None, description="Tag-uri comune")
    is_public: bool = Field(True, description="Toate documentele publice")
    requires_auth: bool = Field(False, description="Toate documentele necesită autentificare")


class BulkUploadResponse(BaseModel):
    """Răspuns pentru upload în masă"""
    total_files: int = Field(..., description="Numărul total de fișiere")
    successful: int = Field(..., description="Fișierele încărcate cu succes")
    failed: int = Field(..., description="Fișierele care au eșuat")
    errors: List[Dict[str, Any]] = Field(default_factory=list, description="Erorile întâlnite")
    documents: List[Document] = Field(default_factory=list, description="Documentele create")


class DocumentStats(BaseModel):
    """Statistici pentru documente"""
    total_documents: int = Field(..., description="Total documente")
    public_documents: int = Field(..., description="Documente publice")
    private_documents: int = Field(..., description="Documente private")
    total_size: int = Field(..., description="Dimensiunea totală în bytes")
    total_size_formatted: str = Field(..., description="Dimensiunea formatată")
    total_downloads: int = Field(..., description="Total descărcări")
    categories_count: int = Field(..., description="Numărul de categorii")
    popular_documents: List[Document] = Field(default_factory=list, description="Documente populare")


class CleanupStats(BaseModel):
    """Statistici pentru curățarea fișierelor"""
    total_files: int = Field(..., description="Total fișiere scanate")
    orphaned_files: int = Field(..., description="Fișiere orfane găsite")
    deleted_files: int = Field(..., description="Fișiere șterse")
    errors: int = Field(..., description="Erori întâlnite")
    freed_space: Optional[int] = Field(None, description="Spațiu eliberat (bytes)")


class DownloadTrackingRequest(BaseModel):
    """Cerere pentru urmărirea descărcărilor"""
    document_id: int = Field(..., description="ID-ul documentului")
    visitor_ip: Optional[str] = Field(None, description="IP-ul vizitatorului")
    user_agent: Optional[str] = Field(None, description="User agent-ul")


class DocumentDownloadStats(BaseModel):
    """Statistici descărcări document"""
    document_id: int
    document_title: str
    total_downloads: int
    downloads_this_month: int
    downloads_this_week: int
    downloads_today: int
    last_download: Optional[datetime]


class StorageStats(BaseModel):
    """Statistici spațiu de stocare"""
    total_size: int = Field(..., description="Dimensiunea totală (bytes)")
    total_size_formatted: str = Field(..., description="Dimensiunea formatată")
    files_count: int = Field(..., description="Numărul de fișiere")
    categories: Dict[str, int] = Field(..., description="Dimensiuni per categorie")
    largest_files: List[Dict[str, Any]] = Field(default_factory=list, description="Cele mai mari fișiere")
    file_types: Dict[str, int] = Field(..., description="Distribuția tipurilor de fișiere")


# Model rebuild nu mai e necesar fără referințe circulare