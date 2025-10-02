"""
Endpoint-uri pentru autentificare și managementul sesiunilor admin cu JWT și refresh tokens
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
import secrets
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from jose import JWTError, jwt
from passlib.context import CryptContext

from ...core.config import get_settings
from ...core.database import get_async_session
from ...models.admin import AdminUser, AdminSession, AdminAuditLog
from ...schemas.auth import Token, AdminUserResponse, LoginRequest, RefreshTokenRequest, TokenResponse

settings = get_settings()
router = APIRouter()

# Configurarea pentru criptarea parolelor
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme pentru JWT
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifică parola în text clar cu cea hash-uită"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generează hash pentru parolă"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creează un JWT access token"""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "type": "access"
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creează un JWT refresh token"""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Adaugă un random string pentru unicitate
    to_encode.update({
        "exp": expire,
        "iat": now,
        "type": "refresh",
        "jti": secrets.token_hex(16)  # JWT ID pentru unicitate
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def hash_token(token: str) -> str:
    """Creează hash pentru token (pentru stocare în DB)"""
    return hashlib.sha256(token.encode()).hexdigest()


def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """Verifică și decodează un JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Verifică tipul token-ului
        if payload.get("type") != token_type:
            return None
            
        return payload
    except JWTError:
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_async_session)
) -> AdminUser:
    """Dependency pentru obținerea utilizatorului curent din JWT"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nu s-au putut valida acreditările",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Verifică și decodează token-ul
    payload = verify_token(token, "access")
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Verifică dacă sesiunea există și este validă
    token_hash = hash_token(token)
    result = await db.execute(
        select(AdminSession).where(
            and_(
                AdminSession.access_token_hash == token_hash,
                AdminSession.is_revoked == False
            )
        )
    )
    session = result.scalar_one_or_none()
    
    if session is None or session.is_access_expired:
        raise credentials_exception
    
    # Verificarea utilizatorului în baza de date
    result = await db.execute(select(AdminUser).where(AdminUser.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cont dezactivat"
        )
    
    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cont blocat temporar"
        )
    
    return user


async def get_current_active_admin(
    current_user: AdminUser = Depends(get_current_user)
) -> AdminUser:
    """Dependency pentru verificarea că utilizatorul este admin activ"""
    if current_user.role not in ["admin", "superuser"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insuficiente privilegii administrative"
        )
    return current_user


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_async_session)
):
    """Autentificare admin și generare JWT cu refresh token"""
    
    # Găsirea utilizatorului după email
    result = await db.execute(
        select(AdminUser).where(AdminUser.email == form_data.username)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        # Log tentativă de autentificare eșuată
        audit_log = AdminAuditLog.create_log(
            user_id=None,
            action="login_failed",
            resource_type="auth",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        await db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email sau parolă incorectă"
        )
    
    # Verificarea dacă contul este blocat
    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Cont blocat până la {user.locked_until}"
        )
    
    # Verificarea parolei
    if not verify_password(form_data.password, user.hashed_password):
        # Incrementarea încercărilor eșuate
        user.failed_login_attempts += 1
        
        # Blocarea contului după 5 încercări eșuate
        if user.failed_login_attempts >= 5:
            user.lock_account(30)  # 30 minute
        
        # Log tentativă eșuată
        audit_log = AdminAuditLog.create_log(
            user_id=user.id,
            action="login_failed",
            resource_type="auth",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        await db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email sau parolă incorectă"
        )
    
    # Verificarea dacă contul este activ
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cont dezactivat"
        )
    
    # Resetarea încercărilor eșuate la autentificare cu succes
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.now(timezone.utc)
    
    # Crearea token-urilor JWT
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    token_data = {"sub": str(user.id), "role": user.role}
    
    access_token = create_access_token(
        data=token_data,
        expires_delta=access_token_expires
    )
    
    refresh_token = create_refresh_token(
        data=token_data,
        expires_delta=refresh_token_expires
    )
    
    # Revocă sesiunile vechi ale utilizatorului (opțional)
    old_sessions_result = await db.execute(
        select(AdminSession).where(
            and_(
                AdminSession.user_id == user.id,
                AdminSession.is_revoked == False
            )
        )
    )
    old_sessions = old_sessions_result.scalars().all()
    for session in old_sessions:
        session.revoke()
    
    # Salvarea sesiunii în baza de date
    session = AdminSession(
        user_id=user.id,
        access_token_hash=hash_token(access_token),
        refresh_token_hash=hash_token(refresh_token),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        access_expires_at=datetime.now(timezone.utc) + access_token_expires,
        refresh_expires_at=datetime.now(timezone.utc) + refresh_token_expires
    )
    db.add(session)
    
    # Log autentificare cu succes
    audit_log = AdminAuditLog.create_log(
        user_id=user.id,
        action="login_success",
        resource_type="auth",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    
    await db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "refresh_expires_in": settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_superuser": user.is_superuser,
            "permissions": [],  # TODO: implement permissions
            "department": "Secretariat General"  # TODO: add department field
        }
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    refresh_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_async_session)
):
    """Refresh access token folosind refresh token"""
    
    # Verifică refresh token-ul
    payload = verify_token(refresh_data.refresh_token, "refresh")
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalid sau expirat"
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalid"
        )
    
    # Verifică dacă refresh token-ul există în baza de date
    refresh_token_hash = hash_token(refresh_data.refresh_token)
    result = await db.execute(
        select(AdminSession).where(
            and_(
                AdminSession.refresh_token_hash == refresh_token_hash,
                AdminSession.is_revoked == False
            )
        )
    )
    session = result.scalar_one_or_none()
    
    if session is None or session.is_refresh_expired:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalid sau expirat"
        )
    
    # Verifică utilizatorul
    result = await db.execute(select(AdminUser).where(AdminUser.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None or not user.is_active or user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilizator invalid sau inactiv"
        )
    
    # Creează un nou access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role},
        expires_delta=access_token_expires
    )
    
    # Actualizează sesiunea cu noul access token
    session.access_token_hash = hash_token(new_access_token)
    session.access_expires_at = datetime.now(timezone.utc) + access_token_expires
    
    # Log refresh token usage
    audit_log = AdminAuditLog.create_log(
        user_id=user.id,
        action="token_refresh",
        resource_type="auth",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    
    await db.commit()
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/logout")
async def logout(
    request: Request,
    current_user: AdminUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Logout - invalidarea sesiunii curente"""
    
    # Obținerea token-ului din header
    token = request.headers.get("authorization")
    if token and token.startswith("Bearer "):
        token = token[7:]
        
        # Găsirea și revocarea sesiunii
        token_hash = hash_token(token)
        result = await db.execute(
            select(AdminSession).where(
                and_(
                    AdminSession.user_id == current_user.id,
                    AdminSession.access_token_hash == token_hash
                )
            )
        )
        session = result.scalar_one_or_none()
        
        if session:
            session.revoke()
    
    # Log logout
    audit_log = AdminAuditLog.create_log(
        user_id=current_user.id,
        action="logout",
        resource_type="auth",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    await db.commit()
    
    return {"message": "Logout efectuat cu succes"}


@router.get("/me", response_model=AdminUserResponse)
async def get_current_user_info(
    current_user: AdminUser = Depends(get_current_user)
):
    """Obține informațiile utilizatorului curent"""
    return current_user


@router.post("/change-password")
async def change_password(
    request: Request,
    current_password: str,
    new_password: str,
    current_user: AdminUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Schimbarea parolei utilizatorului curent"""
    
    # Verificarea parolei curente
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parola curentă este incorectă"
        )
    
    # Validarea parolei noi
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parola nouă trebuie să aibă cel puțin 8 caractere"
        )
    
    # Actualizarea parolei
    current_user.hashed_password = get_password_hash(new_password)
    current_user.password_changed_at = datetime.now(timezone.utc)
    
    # Log schimbarea parolei
    audit_log = AdminAuditLog.create_log(
        user_id=current_user.id,
        action="password_changed",
        resource_type="auth",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    
    await db.commit()
    
    return {"message": "Parola a fost schimbată cu succes"}


@router.get("/sessions")
async def get_active_sessions(
    current_user: AdminUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Obține sesiunile active ale utilizatorului curent"""
    
    result = await db.execute(
        select(AdminSession).where(
            AdminSession.user_id == current_user.id,
            AdminSession.refresh_expires_at > datetime.now(timezone.utc)
        ).order_by(AdminSession.created_at.desc())
    )
    sessions = result.scalars().all()
    
    return [
        {
            "id": str(session.id),
            "ip_address": str(session.ip_address) if session.ip_address else None,
            "user_agent": session.user_agent,
            "created_at": session.created_at,
            "expires_at": session.expires_at
        }
        for session in sessions
    ]


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: AdminUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Revocă o sesiune specifică"""
    
    result = await db.execute(
        select(AdminSession).where(
            AdminSession.id == session_id,
            AdminSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesiunea nu a fost găsită"
        )
    
    await db.delete(session)
    await db.commit()
    
    return {"message": "Sesiunea a fost revocată cu succes"}