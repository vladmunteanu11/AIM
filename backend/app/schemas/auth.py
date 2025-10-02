"""
Scheme Pydantic pentru autentificare și administrare utilizatori
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, validator
import uuid


class Token(BaseModel):
    """Schema pentru răspunsul de autentificare"""
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    refresh_expires_in: int
    user: dict


class RefreshTokenRequest(BaseModel):
    """Schema pentru cererea de refresh token"""
    refresh_token: str


class TokenResponse(BaseModel):
    """Schema pentru răspunsul la refresh token"""
    access_token: str
    token_type: str
    expires_in: int


class LoginRequest(BaseModel):
    """Schema pentru cererea de autentificare"""
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    """Schema pentru schimbarea parolei"""
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Parola trebuie să aibă cel puțin 8 caractere')
        return v


class AdminUserBase(BaseModel):
    """Schema de bază pentru utilizatori admin"""
    email: EmailStr
    full_name: str
    role: str = "admin"
    is_active: bool = True


class AdminUserCreate(AdminUserBase):
    """Schema pentru crearea unui utilizator admin"""
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Parola trebuie să aibă cel puțin 8 caractere')
        return v
    
    @validator('role')
    def validate_role(cls, v):
        if v not in ['admin', 'editor', 'viewer', 'superuser']:
            raise ValueError('Rol invalid')
        return v


class AdminUserUpdate(BaseModel):
    """Schema pentru actualizarea unui utilizator admin"""
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    
    @validator('role')
    def validate_role(cls, v):
        if v is not None and v not in ['admin', 'editor', 'viewer', 'superuser']:
            raise ValueError('Rol invalid')
        return v


class AdminUserResponse(AdminUserBase):
    """Schema pentru răspunsul cu datele utilizatorului admin"""
    id: uuid.UUID
    is_superuser: bool
    last_login: Optional[datetime]
    failed_login_attempts: int
    locked_until: Optional[datetime]
    password_changed_at: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AdminSessionResponse(BaseModel):
    """Schema pentru răspunsul cu datele sesiunii"""
    id: uuid.UUID
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    expires_at: datetime
    
    class Config:
        from_attributes = True


class AdminAuditLogResponse(BaseModel):
    """Schema pentru răspunsul cu log-urile de audit"""
    id: int
    user_id: Optional[uuid.UUID]
    action: str
    resource_type: str
    resource_id: Optional[str]
    old_values: Optional[dict]
    new_values: Optional[dict]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True