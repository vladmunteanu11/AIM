"""
Servicii pentru upload și managementul fișierelor
"""
import os
import uuid
import mimetypes
import shutil
import hashlib
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from PIL import Image
from ..models.documents import Document, DocumentCategory, DocumentDownload
from ..core.config import get_settings


class FileService:
    """Serviciu pentru managementul fișierelor"""
    
    # Tipuri de fișiere permise
    ALLOWED_MIME_TYPES = {
        # Documente
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/vnd.ms-excel': ['.xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-powerpoint': ['.ppt'],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
        'text/plain': ['.txt'],
        'text/csv': ['.csv'],
        'application/rtf': ['.rtf'],
        'application/vnd.oasis.opendocument.text': ['.odt'],
        'application/vnd.oasis.opendocument.spreadsheet': ['.ods'],
        
        # Imagini
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
        'image/webp': ['.webp'],
        'image/tiff': ['.tiff', '.tif'],
        'image/bmp': ['.bmp'],
        'image/svg+xml': ['.svg'],
        
        # Archive
        'application/zip': ['.zip'],
        'application/x-rar-compressed': ['.rar'],
        'application/x-7z-compressed': ['.7z'],
        
        # Media
        'video/mp4': ['.mp4'],
        'video/webm': ['.webm'],
        'audio/mpeg': ['.mp3'],
        'audio/wav': ['.wav'],
        'audio/ogg': ['.ogg']
    }
    
    # Dimensiuni maxime pentru imagini
    MAX_IMAGE_SIZE = (2048, 2048)  # 2048x2048 px
    THUMBNAIL_SIZE = (300, 300)    # thumbnail 300x300 px
    
    def __init__(self):
        self.settings = get_settings()
        self.upload_dir = Path(self.settings.UPLOAD_DIR if hasattr(self.settings, 'UPLOAD_DIR') 
                              else "uploads")
        self.upload_dir.mkdir(exist_ok=True, parents=True)
        
        # Creează subdirectoarele
        (self.upload_dir / "documents").mkdir(exist_ok=True)
        (self.upload_dir / "mol").mkdir(exist_ok=True)
        (self.upload_dir / "images").mkdir(exist_ok=True)
        (self.upload_dir / "thumbnails").mkdir(exist_ok=True)
        (self.upload_dir / "temp").mkdir(exist_ok=True)
    
    @staticmethod
    def validate_file(file: UploadFile, max_size_mb: int = 50) -> Dict[str, Any]:
        """Validează fișierul înainte de upload"""
        errors = []
        
        # Verifică dimensiunea
        if hasattr(file.file, 'seek') and hasattr(file.file, 'tell'):
            file.file.seek(0, 2)  # seek la sfârșitul fișierului
            size = file.file.tell()
            file.file.seek(0)  # revine la început
            
            max_size_bytes = max_size_mb * 1024 * 1024
            if size > max_size_bytes:
                errors.append(f"Fișierul este prea mare. Maxim permis: {max_size_mb}MB")
        
        # Verifică tipul MIME
        mime_type = file.content_type
        if mime_type not in FileService.ALLOWED_MIME_TYPES:
            errors.append(f"Tipul de fișier '{mime_type}' nu este permis")
        
        # Verifică extensia
        file_ext = Path(file.filename).suffix.lower()
        if mime_type in FileService.ALLOWED_MIME_TYPES:
            allowed_extensions = FileService.ALLOWED_MIME_TYPES[mime_type]
            if file_ext not in allowed_extensions:
                errors.append(f"Extensia '{file_ext}' nu corespunde tipului MIME '{mime_type}'")
        
        # Verifică numele fișierului
        if not file.filename or len(file.filename) > 255:
            errors.append("Numele fișierului este invalid sau prea lung")
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "size": size if 'size' in locals() else 0,
            "mime_type": mime_type,
            "extension": file_ext
        }
    
    def generate_secure_filename(self, original_filename: str, prefix: str = "") -> str:
        """Generează nume securizat pentru fișier"""
        # Extrage extensia
        file_ext = Path(original_filename).suffix.lower()
        
        # Generează UUID pentru unicitate
        unique_id = str(uuid.uuid4())
        
        # Construiește numele
        if prefix:
            filename = f"{prefix}_{unique_id}{file_ext}"
        else:
            filename = f"{unique_id}{file_ext}"
        
        return filename
    
    def calculate_file_hash(self, file_path: Path) -> str:
        """Calculează hash-ul fișierului pentru detectarea duplicatelor"""
        hash_sha256 = hashlib.sha256()
        
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        
        return hash_sha256.hexdigest()
    
    async def save_uploaded_file(
        self, 
        file: UploadFile, 
        subfolder: str = "documents",
        prefix: str = "",
        generate_thumbnail: bool = False
    ) -> Dict[str, Any]:
        """Salvează fișierul uploadat și returnează informațiile"""
        
        # Validează fișierul
        validation = self.validate_file(file)
        if not validation["is_valid"]:
            raise HTTPException(status_code=400, detail=validation["errors"])
        
        # Generează numele securizat
        secure_filename = self.generate_secure_filename(file.filename, prefix)
        
        # Calea completă
        file_dir = self.upload_dir / subfolder
        file_dir.mkdir(exist_ok=True)
        file_path = file_dir / secure_filename
        
        try:
            # Salvează fișierul
            with open(file_path, 'wb') as f:
                content = await file.read()
                f.write(content)
            
            # Calculează hash-ul
            file_hash = self.calculate_file_hash(file_path)
            
            # Generează thumbnail pentru imagini
            thumbnail_path = None
            if generate_thumbnail and validation["mime_type"].startswith("image/"):
                thumbnail_path = await self._generate_thumbnail(file_path, secure_filename)
            
            # Optimizează imaginile
            if validation["mime_type"].startswith("image/"):
                await self._optimize_image(file_path)
            
            file_info = {
                "original_filename": file.filename,
                "secure_filename": secure_filename,
                "file_path": str(file_path.relative_to(self.upload_dir)),
                "absolute_path": str(file_path),
                "file_size": file_path.stat().st_size,
                "mime_type": validation["mime_type"],
                "extension": validation["extension"],
                "file_hash": file_hash,
                "thumbnail_path": thumbnail_path,
                "upload_timestamp": datetime.now().isoformat()
            }
            
            return file_info
            
        except Exception as e:
            # Șterge fișierul dacă salvarea a eșuat
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=500, detail=f"Eroare la salvarea fișierului: {str(e)}")
    
    async def _generate_thumbnail(self, image_path: Path, filename: str) -> Optional[str]:
        """Generează thumbnail pentru imagine"""
        try:
            thumbnail_filename = f"thumb_{filename}"
            thumbnail_path = self.upload_dir / "thumbnails" / thumbnail_filename
            
            with Image.open(image_path) as img:
                # Convertește la RGB dacă e necesar
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                # Redimensionează păstrând proporțiile
                img.thumbnail(self.THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
                
                # Salvează thumbnail-ul
                img.save(thumbnail_path, 'JPEG', quality=85, optimize=True)
            
            return str(thumbnail_path.relative_to(self.upload_dir))
            
        except Exception as e:
            print(f"Eroare la generarea thumbnail-ului: {e}")
            return None
    
    async def _optimize_image(self, image_path: Path) -> None:
        """Optimizează imaginea (redimensionare și compresie)"""
        try:
            with Image.open(image_path) as img:
                # Verifică dacă imaginea e prea mare
                if img.size[0] > self.MAX_IMAGE_SIZE[0] or img.size[1] > self.MAX_IMAGE_SIZE[1]:
                    # Redimensionează păstrând proporțiile
                    img.thumbnail(self.MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
                    
                    # Convertește la RGB dacă e necesar
                    if img.mode in ('RGBA', 'P'):
                        img = img.convert('RGB')
                    
                    # Salvează imaginea optimizată
                    img.save(image_path, 'JPEG', quality=90, optimize=True)
                    
        except Exception as e:
            print(f"Eroare la optimizarea imaginii: {e}")
    
    async def get_file_info(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Returnează informații despre fișier"""
        full_path = self.upload_dir / file_path
        
        if not full_path.exists():
            return None
        
        stat = full_path.stat()
        mime_type = mimetypes.guess_type(str(full_path))[0]
        
        return {
            "filename": full_path.name,
            "size": stat.st_size,
            "size_formatted": self._format_file_size(stat.st_size),
            "mime_type": mime_type,
            "extension": full_path.suffix.lower(),
            "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
            "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "is_image": mime_type and mime_type.startswith("image/") if mime_type else False
        }
    
    def _format_file_size(self, size_bytes: int) -> str:
        """Formatează dimensiunea fișierului"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"
    
    async def delete_file(self, file_path: str, delete_thumbnail: bool = True) -> bool:
        """Șterge un fișier și thumbnail-ul asociat"""
        try:
            full_path = self.upload_dir / file_path
            
            if full_path.exists():
                full_path.unlink()
            
            # Șterge și thumbnail-ul dacă există
            if delete_thumbnail:
                thumbnail_path = self.upload_dir / "thumbnails" / f"thumb_{full_path.name}"
                if thumbnail_path.exists():
                    thumbnail_path.unlink()
            
            return True
            
        except Exception as e:
            print(f"Eroare la ștergerea fișierului {file_path}: {e}")
            return False
    
    async def cleanup_orphaned_files(self, db: AsyncSession) -> Dict[str, int]:
        """Curăță fișierele orfane (fără înregistrări în baza de date)"""
        stats = {
            "total_files": 0,
            "orphaned_files": 0,
            "deleted_files": 0,
            "errors": 0
        }
        
        try:
            # Obține toate fișierele din baza de date
            result = await db.execute(
                select(Document.file_path).where(Document.file_path.isnot(None))
            )
            db_files = set(row[0] for row in result.fetchall())
            
            # Scandează directorul de upload
            for file_path in self.upload_dir.rglob("*"):
                if file_path.is_file() and not file_path.name.startswith('.'):
                    stats["total_files"] += 1
                    relative_path = str(file_path.relative_to(self.upload_dir))
                    
                    if relative_path not in db_files:
                        stats["orphaned_files"] += 1
                        try:
                            file_path.unlink()
                            stats["deleted_files"] += 1
                        except Exception as e:
                            print(f"Eroare la ștergerea fișierului orfan {relative_path}: {e}")
                            stats["errors"] += 1
            
            return stats
            
        except Exception as e:
            print(f"Eroare la curățarea fișierelor orfane: {e}")
            stats["errors"] += 1
            return stats


class DocumentService:
    """Serviciu pentru managementul documentelor"""
    
    def __init__(self):
        self.file_service = FileService()
    
    async def create_document(
        self,
        db: AsyncSession,
        file: UploadFile,
        title: str,
        description: Optional[str] = None,
        category_id: Optional[int] = None,
        tags: Optional[List[str]] = None,
        is_public: bool = True,
        requires_auth: bool = False,
        uploaded_by: Optional[str] = None
    ) -> Document:
        """Creează un document nou cu fișier"""
        
        # Salvează fișierul
        file_info = await self.file_service.save_uploaded_file(
            file, 
            subfolder="documents",
            prefix="doc",
            generate_thumbnail=True
        )
        
        # Creează înregistrarea în baza de date
        document = Document(
            title=title,
            description=description,
            category_id=category_id,
            tags=tags,
            file_path=file_info["file_path"],
            file_name=file_info["original_filename"],
            file_type=file_info["extension"],
            file_size=file_info["file_size"],
            is_public=is_public,
            requires_auth=requires_auth,
            uploaded_by=uploaded_by
        )
        
        db.add(document)
        await db.commit()
        await db.refresh(document)
        
        return document
    
    async def get_document(self, db: AsyncSession, document_id: int) -> Optional[Document]:
        """Obține un document după ID"""
        result = await db.execute(
            select(Document).where(Document.id == document_id)
        )
        return result.scalar_one_or_none()
    
    async def get_documents(
        self,
        db: AsyncSession,
        category_id: Optional[int] = None,
        is_public: Optional[bool] = None,
        search_term: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[Document]:
        """Obține lista de documente cu filtrare"""
        
        query = select(Document)
        
        conditions = []
        
        if category_id:
            conditions.append(Document.category_id == category_id)
        
        if is_public is not None:
            conditions.append(Document.is_public == is_public)
        
        if search_term:
            search_conditions = or_(
                Document.title.ilike(f"%{search_term}%"),
                Document.description.ilike(f"%{search_term}%"),
                Document.tags.op('@>')([search_term])
            )
            conditions.append(search_conditions)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        query = query.order_by(Document.uploaded_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def update_document(
        self,
        db: AsyncSession,
        document_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None,
        category_id: Optional[int] = None,
        tags: Optional[List[str]] = None,
        is_public: Optional[bool] = None,
        requires_auth: Optional[bool] = None
    ) -> Optional[Document]:
        """Actualizează un document"""
        
        document = await self.get_document(db, document_id)
        if not document:
            return None
        
        if title is not None:
            document.title = title
        if description is not None:
            document.description = description
        if category_id is not None:
            document.category_id = category_id
        if tags is not None:
            document.tags = tags
        if is_public is not None:
            document.is_public = is_public
        if requires_auth is not None:
            document.requires_auth = requires_auth
        
        await db.commit()
        await db.refresh(document)
        
        return document
    
    async def delete_document(self, db: AsyncSession, document_id: int) -> bool:
        """Șterge un document și fișierul asociat"""
        
        document = await self.get_document(db, document_id)
        if not document:
            return False
        
        # Șterge fișierul
        if document.file_path:
            await self.file_service.delete_file(document.file_path)
        
        # Șterge înregistrarea
        await db.delete(document)
        await db.commit()
        
        return True
    
    async def track_download(
        self,
        db: AsyncSession,
        document_id: int,
        visitor_ip: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        """Înregistrează o descărcare"""
        
        # Incrementează contorul pe document
        document = await self.get_document(db, document_id)
        if document:
            document.increment_download_count()
        
        # Creează înregistrarea de download
        download = DocumentDownload(
            document_id=document_id,
            visitor_ip=visitor_ip,
            user_agent=user_agent,
            download_date=datetime.now().date(),
            download_time=datetime.now()
        )
        
        db.add(download)
        await db.commit()
    
    async def get_popular_documents(
        self,
        db: AsyncSession,
        limit: int = 10,
        days: int = 30
    ) -> List[Document]:
        """Obține documentele populare"""
        
        # Calculează data de început
        from datetime import timedelta
        start_date = datetime.now().date() - timedelta(days=days)
        
        # Query pentru documentele cu cele mai multe descărcări
        query = (
            select(Document, func.count(DocumentDownload.id).label('download_count'))
            .outerjoin(DocumentDownload)
            .where(
                or_(
                    DocumentDownload.download_date.is_(None),
                    DocumentDownload.download_date >= start_date
                )
            )
            .group_by(Document.id)
            .order_by(func.count(DocumentDownload.id).desc())
            .limit(limit)
        )
        
        result = await db.execute(query)
        return [row[0] for row in result.fetchall()]