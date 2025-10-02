"""
Pydantic schemas for search results.
"""
from pydantic import BaseModel
from typing import List, Optional

class SearchResult(BaseModel):
    """
    Represents a single search result item.
    """
    id: int
    content_type: str
    title: str
    url: str
    excerpt: Optional[str] = None
    category: Optional[str] = None

    class Config:
        orm_mode = True

class SearchResponse(BaseModel):
    """
    Represents the response for a search query.
    """
    query: str
    results: List[SearchResult]
    total: int
