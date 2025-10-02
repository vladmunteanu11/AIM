"""
Utilități pentru gestionarea upload-ului de fișiere
"""
import os
import uuid
import mimetypes
from typing import Dict, List, Any
from fastapi import UploadFile
import aiofiles
from pathlib import Path


# Configurări pentru tipurile de fișiere acceptate
FILE_CONFIGS = {
    "photo": {
        "allowed_types": ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
        "max_size_mb": 10,
        "extensions": [".jpg", ".jpeg", ".png", ".gif", ".webp"]
    },
    "document": {
        "allowed_types": [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain"
        ],
        "max_size_mb": 25,
        "extensions": [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"]
    }
}

# Directoare pentru upload
UPLOAD_DIRS = {
    "photo": "uploads/photos",
    "document": "uploads/documents"
}


def validate_file(file: UploadFile, file_type: str = "document") -> Dict[str, Any]:
    """
    Validează un fișier înainte de upload
    
    Args:
        file: Fișierul de validat
        file_type: Tipul fișierului ("photo" sau "document")
    
    Returns:
        Dict cu rezultatul validării
    """
    if file_type not in FILE_CONFIGS:
        return {
            "valid": False,
            "error": "Tip de fișier necunoscut",
            "allowed_types": [],
            "max_size_mb": 0
        }
    
    config = FILE_CONFIGS[file_type]
    
    # Verifică tipul MIME
    if file.content_type not in config["allowed_types"]:
        return {
            "valid": False,
            "error": f"Tipul de fișier {file.content_type} nu este permis",
            "allowed_types": config["allowed_types"],
            "max_size_mb": config["max_size_mb"]
        }
    
    # Verifică extensia fișierului
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in config["extensions"]:
        return {
            "valid": False,
            "error": f"Extensia {file_extension} nu este permisă",
            "allowed_types": config["allowed_types"],
            "max_size_mb": config["max_size_mb"]
        }
    
    # Verifică dimensiunea (FastAPI nu oferă size direct, va fi verificată la upload)
    return {
        "valid": True,
        "error": None,
        "allowed_types": config["allowed_types"],
        "max_size_mb": config["max_size_mb"]
    }


async def save_uploaded_file(file: UploadFile, file_type: str = "document") -> Dict[str, Any]:
    """
    Salvează un fișier uploadat
    
    Args:
        file: Fișierul de salvat
        file_type: Tipul fișierului ("photo" sau "document")
    
    Returns:
        Dict cu informațiile fișierului salvat
    """
    if file_type not in UPLOAD_DIRS:
        raise ValueError(f"Tip de fișier necunoscut: {file_type}")
    
    config = FILE_CONFIGS[file_type]
    upload_dir = UPLOAD_DIRS[file_type]
    
    # Creează directorul dacă nu există
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generează numele fișierului
    file_extension = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Verifică dimensiunea în timpul citirii
    content = await file.read()
    file_size = len(content)
    max_size_bytes = config["max_size_mb"] * 1024 * 1024
    
    if file_size > max_size_bytes:
        raise ValueError(f"Fișierul depășește dimensiunea maximă de {config['max_size_mb']}MB")
    
    # Salvează fișierul
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    # Detectează tipul MIME dacă nu este specificat corect
    detected_mime_type, _ = mimetypes.guess_type(file.filename)
    if detected_mime_type and detected_mime_type != file.content_type:
        mime_type = detected_mime_type
    else:
        mime_type = file.content_type
    
    return {
        "filename": unique_filename,
        "original_filename": file.filename,
        "file_path": file_path,
        "file_size": file_size,
        "mime_type": mime_type,
        "upload_id": str(uuid.uuid4())
    }


def delete_file(file_path: str) -> bool:
    """
    Șterge un fișier uploadat
    
    Args:
        file_path: Calea către fișier
    
    Returns:
        True dacă fișierul a fost șters cu succes
    """
    try:
        if os.path.exists(file_path) and file_path.startswith("uploads/"):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False


def get_file_info(file_path: str) -> Dict[str, Any]:
    """
    Obține informații despre un fișier
    
    Args:
        file_path: Calea către fișier
    
    Returns:
        Dict cu informațiile fișierului
    """
    if not os.path.exists(file_path):
        return {}
    
    stat = os.stat(file_path)
    mime_type, _ = mimetypes.guess_type(file_path)
    
    return {
        "filename": os.path.basename(file_path),
        "file_path": file_path,
        "file_size": stat.st_size,
        "mime_type": mime_type,
        "created_at": stat.st_ctime,
        "modified_at": stat.st_mtime
    }


def cleanup_old_files(days: int = 30) -> List[str]:
    """
    Curăță fișierele vechi nefolosite
    
    Args:
        days: Numărul de zile după care fișierele sunt considerate vechi
    
    Returns:
        Lista fișierelor șterse
    """
    import time
    
    deleted_files = []
    cutoff_time = time.time() - (days * 24 * 60 * 60)
    
    for upload_dir in UPLOAD_DIRS.values():
        if not os.path.exists(upload_dir):
            continue
        
        for filename in os.listdir(upload_dir):
            file_path = os.path.join(upload_dir, filename)
            
            if os.path.isfile(file_path):
                file_stat = os.stat(file_path)
                
                # Verifică dacă fișierul este vechi
                if file_stat.st_mtime < cutoff_time:
                    try:
                        os.remove(file_path)
                        deleted_files.append(file_path)
                    except Exception:
                        pass  # Ignoră erorile de ștergere
    
    return deleted_files


def get_upload_stats() -> Dict[str, Any]:
    """
    Obține statistici despre fișierele uploadate
    
    Returns:
        Dict cu statisticile
    """
    stats = {
        "total_files": 0,
        "total_size_mb": 0,
        "by_type": {}
    }
    
    for file_type, upload_dir in UPLOAD_DIRS.items():
        if not os.path.exists(upload_dir):
            stats["by_type"][file_type] = {"count": 0, "size_mb": 0}
            continue
        
        type_count = 0
        type_size = 0
        
        for filename in os.listdir(upload_dir):
            file_path = os.path.join(upload_dir, filename)
            
            if os.path.isfile(file_path):
                file_stat = os.stat(file_path)
                type_count += 1
                type_size += file_stat.st_size
        
        stats["by_type"][file_type] = {
            "count": type_count,
            "size_mb": round(type_size / (1024 * 1024), 2)
        }
        
        stats["total_files"] += type_count
        stats["total_size_mb"] += stats["by_type"][file_type]["size_mb"]
    
    stats["total_size_mb"] = round(stats["total_size_mb"], 2)
    return stats


# Funcții pentru integrarea cu modelele de date

def attach_files_to_submission(submission_id: str, file_paths: List[str]) -> bool:
    """
    Atașează fișiere la o cerere/sesizare
    
    Args:
        submission_id: ID-ul cererii
        file_paths: Lista căilor către fișiere
    
    Returns:
        True dacă operația a fost reușită
    """
    # TODO: Implementează logica de legare cu baza de date
    # Pentru moment returnează True
    return True


def get_submission_files(submission_id: str) -> List[Dict[str, Any]]:
    """
    Obține fișierele atașate la o cerere/sesizare
    
    Args:
        submission_id: ID-ul cererii
    
    Returns:
        Lista cu informațiile fișierelor
    """
    # TODO: Implementează logica de citire din baza de date
    return []


def validate_file_access(file_path: str, user_id: str = None) -> bool:
    """
    Validează dacă un utilizator poate accesa un fișier
    
    Args:
        file_path: Calea către fișier
        user_id: ID-ul utilizatorului (None pentru acces public)
    
    Returns:
        True dacă accesul este permis
    """
    # Verifică că fișierul este în directorul de upload
    if not file_path.startswith("uploads/"):
        return False
    
    # Verifică că fișierul există
    if not os.path.exists(file_path):
        return False
    
    # TODO: Implementează logica de verificare a permisiunilor
    # Pentru moment permite accesul la toate fișierele
    return True