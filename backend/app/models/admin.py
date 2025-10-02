"""
Modele pentru administrarea sistemului
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class AdminUser(Base):
    """Model pentru utilizatorii admin ai sistemului"""
    __tablename__ = "admin_users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="admin", nullable=False)
    
    # Status și securitate
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # Audit și securitate
    last_login = Column(DateTime(timezone=True), nullable=True)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    password_changed_at = Column(DateTime(timezone=True), default=func.now())
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relații
    sessions = relationship("AdminSession", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AdminAuditLog", back_populates="user")
    
    def __repr__(self):
        return f"<AdminUser(email='{self.email}', role='{self.role}')>"
    
    @property
    def is_locked(self) -> bool:
        """Verifică dacă contul este blocat"""
        if self.locked_until is None:
            return False
        from datetime import timezone
        now = datetime.now(timezone.utc)
        locked_until = self.locked_until
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        return now < locked_until
    
    def lock_account(self, minutes: int = 30):
        """Blochează contul pentru un număr specificat de minute"""
        from datetime import timedelta, timezone
        self.locked_until = datetime.now(timezone.utc) + timedelta(minutes=minutes)
        self.failed_login_attempts = 0
    
    def unlock_account(self):
        """Deblochează contul"""
        self.locked_until = None
        self.failed_login_attempts = 0


class AdminSession(Base):
    """Sesiuni admin pentru gestionarea autentificării"""
    __tablename__ = "admin_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("admin_users.id", ondelete="CASCADE"), nullable=False)
    
    # JWT Tokens
    access_token_hash = Column(String(255), nullable=False, index=True)
    refresh_token_hash = Column(String(255), nullable=False, index=True)
    
    # Informații despre sesiune
    ip_address = Column(INET, nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Expirare
    access_expires_at = Column(DateTime(timezone=True), nullable=False)
    refresh_expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    # Status
    is_revoked = Column(Boolean, default=False, nullable=False)
    
    # Relații
    user = relationship("AdminUser", back_populates="sessions")
    
    def __repr__(self):
        return f"<AdminSession(user_id='{self.user_id}', access_expires_at='{self.access_expires_at}')>"
    
    @property
    def is_access_expired(self) -> bool:
        """Verifică dacă access token-ul a expirat"""
        from datetime import timezone
        now = datetime.now(timezone.utc)
        expires_at = self.access_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        return now > expires_at
    
    @property
    def is_refresh_expired(self) -> bool:
        """Verifică dacă refresh token-ul a expirat"""
        from datetime import timezone
        now = datetime.now(timezone.utc)
        expires_at = self.refresh_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        return now > expires_at
    
    @property
    def is_valid(self) -> bool:
        """Verifică dacă sesiunea este validă"""
        return not self.is_revoked and not self.is_refresh_expired
    
    def revoke(self):
        """Revocă sesiunea"""
        self.is_revoked = True


class AdminAuditLog(Base):
    """Log pentru acțiunile administrative"""
    __tablename__ = "admin_audit_log"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("admin_users.id"), nullable=True)
    
    # Detalii acțiune
    action = Column(String(100), nullable=False)  # create, update, delete, login, etc.
    resource_type = Column(String(50), nullable=False)  # user, page, announcement, etc.
    resource_id = Column(String(50), nullable=True)
    
    # Date modificate (pentru rollback)
    old_values = Column(JSONB, nullable=True)
    new_values = Column(JSONB, nullable=True)
    
    # Context request
    ip_address = Column(INET, nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    # Relații
    user = relationship("AdminUser", back_populates="audit_logs")
    
    def __repr__(self):
        return f"<AdminAuditLog(action='{self.action}', resource_type='{self.resource_type}')>"
    
    @classmethod
    def create_log(
        cls,
        user_id: Optional[uuid.UUID],
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Factory method pentru crearea unei intrări de audit"""
        return cls(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent
        )