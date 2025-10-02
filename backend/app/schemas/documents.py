"""
Dummy documents schema to fix import error
"""
from pydantic import BaseModel
from typing import List

class DocumentResponse(BaseModel):
    """Placeholder document response schema"""
    id: str
    title: str

class DocumentListResponse(BaseModel):
    """List response for documents"""
    documents: List[DocumentResponse]
    total: int

class DocumentCreate(BaseModel):
    """Document creation schema"""
    title: str

class DocumentUpdate(BaseModel):
    """Document update schema"""
    title: str

class MOLDocumentResponse(BaseModel):
    """MOL document response schema"""
    id: str
    title: str

class MOLDocumentListResponse(BaseModel):
    """MOL document list response"""
    documents: List[MOLDocumentResponse]
    total: int

class MOLDocumentCreate(BaseModel):
    """MOL document creation schema"""
    title: str

class MOLDocumentUpdate(BaseModel):
    """MOL document update schema"""
    title: str

class DocumentCategoryResponse(BaseModel):
    """Document category response schema"""
    id: str
    name: str

class MOLCategoryResponse(BaseModel):
    """MOL category response schema"""
    id: str
    name: str