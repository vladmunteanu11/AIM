"""
Scheme Pydantic pentru Monitorul Oficial Local (MOL)
"""
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class MOLCategoryBase(BaseModel):
    """Schema de bază pentru categoriile MOL"""
    name: str = Field(..., description="Numele categoriei")
    slug: str = Field(..., description="Slug-ul categoriei")
    description: Optional[str] = Field(None, description="Descrierea categoriei")
    is_required: bool = Field(False, description="Categorie obligatorie conform legii")
    section_order: Optional[int] = Field(None, description="Ordinea de afișare")
    parent_id: Optional[int] = Field(None, description="ID categoria părinte")


class MOLCategoryCreate(MOLCategoryBase):
    """Schema pentru crearea unei categorii MOL"""
    pass


class MOLCategoryUpdate(BaseModel):
    """Schema pentru actualizarea unei categorii MOL"""
    name: Optional[str] = None
    description: Optional[str] = None
    section_order: Optional[int] = None


class MOLCategory(MOLCategoryBase):
    """Schema completă pentru o categorie MOL"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class MOLDocumentBase(BaseModel):
    """Schema de bază pentru documentele MOL"""
    category_id: int = Field(..., description="ID categoria MOL")
    title: str = Field(..., description="Titlul documentului")
    document_number: Optional[str] = Field(None, description="Numărul actului administrativ")
    description: Optional[str] = Field(None, description="Descrierea documentului")
    content: Optional[str] = Field(None, description="Conținutul textual pentru indexare")
    
    # Fișier atașat
    file_name: Optional[str] = Field(None, description="Numele fișierului")
    file_type: Optional[str] = Field(None, description="Tipul fișierului")
    file_size: Optional[int] = Field(None, description="Dimensiunea fișierului în bytes")
    
    # Date oficiale
    adoption_date: Optional[date] = Field(None, description="Data adoptării actului")
    effective_date: Optional[date] = Field(None, description="Data intrării în vigoare")
    published_date: date = Field(..., description="Data publicării în MOL")
    
    # Status
    status: str = Field("published", description="Statusul documentului")
    is_public: bool = Field(True, description="Document public")


class MOLDocumentCreate(MOLDocumentBase):
    """Schema pentru crearea unui document MOL"""
    pass


class MOLDocumentUpdate(BaseModel):
    """Schema pentru actualizarea unui document MOL"""
    title: Optional[str] = None
    document_number: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    adoption_date: Optional[date] = None
    effective_date: Optional[date] = None
    published_date: Optional[date] = None
    status: Optional[str] = None
    is_public: Optional[bool] = None


class MOLDocument(MOLDocumentBase):
    """Schema completă pentru un document MOL"""
    id: int
    file_path: Optional[str] = Field(None, description="Calea către fișier")
    created_by: Optional[str] = Field(None, description="ID utilizator care a creat")
    created_at: datetime
    updated_at: datetime
    
    # Proprietăți calculate
    is_effective: bool = Field(..., description="Document în vigoare")
    file_size_formatted: str = Field(..., description="Dimensiunea fișierului formatată")
    
    class Config:
        from_attributes = True


class MOLDocumentWithCategory(MOLDocument):
    """Document MOL cu informații despre categorie"""
    category: MOLCategory


class MOLCategoryWithDocuments(MOLCategory):
    """Categorie MOL cu documentele asociate"""
    documents: List[MOLDocument] = []
    document_count: int = Field(0, description="Numărul de documente din categorie")


class MOLSearchFilter(BaseModel):
    """Filtre pentru căutarea în MOL"""
    category_id: Optional[int] = Field(None, description="Filtrează după categorie")
    document_type: Optional[str] = Field(None, description="Tipul documentului")
    year: Optional[int] = Field(None, description="Anul publicării")
    month: Optional[int] = Field(None, description="Luna publicării")
    status: Optional[str] = Field("published", description="Statusul documentului")
    is_effective: Optional[bool] = Field(None, description="Doar documente în vigoare")
    search_query: Optional[str] = Field(None, description="Termen de căutare")


class MOLStats(BaseModel):
    """Statistici pentru MOL"""
    total_documents: int = Field(..., description="Total documente")
    documents_by_category: dict = Field(..., description="Documente pe categorii")
    documents_by_year: dict = Field(..., description="Documente pe ani")
    recent_documents: List[MOLDocument] = Field(..., description="Documente recente")
    most_accessed: List[MOLDocument] = Field(..., description="Documente cele mai accesate")


class MOLDocumentResponse(BaseModel):
    """Răspuns pentru listarea documentelor MOL"""
    documents: List[MOLDocumentWithCategory]
    total: int
    page: int
    per_page: int
    total_pages: int
    filters_applied: MOLSearchFilter