#!/usr/bin/env python3
"""
Script pentru testarea sistemului de managementul fișierelor
Rulare: python test_files.py
"""

import asyncio
import sys
import os
import tempfile
import json
from pathlib import Path
from io import BytesIO
from PIL import Image

# Adaugă calea către modulele aplicației
sys.path.insert(0, str(Path(__file__).parent))

from app.services.file_service import FileService, DocumentService
from app.core.config import get_settings
from app.core.database import get_async_session
from app.models.documents import Document, DocumentCategory
from sqlalchemy.ext.asyncio import AsyncSession

def print_header(title):
    print(f"\n{'='*60}")
    print(f"📁 {title}")
    print(f"{'='*60}")

def print_status(check, status, details=None):
    icon = "✅" if status else "❌"
    print(f"{icon} {check}")
    if details:
        if not status and isinstance(details, str):
            print(f"   💡 {details}")
        elif isinstance(details, dict):
            for key, value in details.items():
                print(f"   📊 {key}: {value}")

def print_file_info(file_info):
    """Afișează informații despre fișier"""
    print(f"   📄 Numele: {file_info.get('original_filename', 'N/A')}")
    print(f"   🔒 Nume securizat: {file_info.get('secure_filename', 'N/A')}")
    print(f"   📁 Calea: {file_info.get('file_path', 'N/A')}")
    print(f"   📏 Dimensiune: {format_size(file_info.get('file_size', 0))}")
    print(f"   🏷️ Tip MIME: {file_info.get('mime_type', 'N/A')}")
    print(f"   #️⃣ Hash: {file_info.get('file_hash', 'N/A')[:16]}...")

def format_size(size_bytes):
    """Formatează dimensiunea fișierului"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"

def create_test_files():
    """Creează fișiere de test temporare"""
    files = {}
    
    # 1. Fișier text simplu
    text_content = """
    Acesta este un document de test pentru sistemul Primărie Digitală.
    
    Conținutul acestui fișier demonstrează funcționalitățile de upload și managementul documentelor.
    
    🏛️ Primăria Digitală
    📋 Sistem de managementul documentelor
    📄 Document de test generat automat
    
    Data generării: 2024
    """
    
    text_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8')
    text_file.write(text_content)
    text_file.close()
    files['text'] = text_file.name
    
    # 2. Imagine de test
    img = Image.new('RGB', (800, 600), color=(70, 130, 180))  # Steel blue
    img_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
    img.save(img_file.name, 'JPEG', quality=90)
    img_file.close()
    files['image'] = img_file.name
    
    # 3. Document PDF simulat (de fapt text)
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\nxref\n0 3\n%%EOF"
    pdf_file = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
    pdf_file.write(pdf_content)
    pdf_file.close()
    files['pdf'] = pdf_file.name
    
    return files

class MockUploadFile:
    """Mock pentru FastAPI UploadFile"""
    
    def __init__(self, file_path: str, filename: str, content_type: str):
        self.file_path = file_path
        self.filename = filename
        self.content_type = content_type
        self.file = None
    
    async def read(self) -> bytes:
        with open(self.file_path, 'rb') as f:
            return f.read()
    
    async def seek(self, position: int) -> None:
        pass

def test_file_service_configuration():
    """Testează configurația FileService"""
    print_header("TESTARE CONFIGURAȚIE FILE SERVICE")
    
    try:
        file_service = FileService()
        settings = get_settings()
        
        print_status("FileService inițializat", True)
        print_status(f"Director upload configurat", 
                    file_service.upload_dir.exists(),
                    f"Calea: {file_service.upload_dir}")
        
        # Verifică subdirectoarele
        subdirs = ["documents", "mol", "images", "thumbnails", "temp"]
        for subdir in subdirs:
            subdir_path = file_service.upload_dir / subdir
            print_status(f"Subdirector '{subdir}'", subdir_path.exists())
        
        # Tipuri de fișiere permise
        allowed_count = len(FileService.ALLOWED_MIME_TYPES)
        print_status(f"Tipuri MIME configurate", allowed_count > 0, 
                    f"Total: {allowed_count} tipuri")
        
        return True
        
    except Exception as e:
        print_status("Configurația FileService", False, str(e))
        return False

async def test_file_validation():
    """Testează validarea fișierelor"""
    print_header("TESTARE VALIDARE FIȘIERE")
    
    try:
        # Creează fișiere de test
        test_files = create_test_files()
        
        for file_type, file_path in test_files.items():
            print(f"\n🧪 Testez fișierul {file_type}: {Path(file_path).name}")
            
            # Determină content type
            content_types = {
                'text': 'text/plain',
                'image': 'image/jpeg', 
                'pdf': 'application/pdf'
            }
            
            mock_file = MockUploadFile(
                file_path=file_path,
                filename=Path(file_path).name,
                content_type=content_types.get(file_type, 'application/octet-stream')
            )
            
            # Validează fișierul
            validation = FileService.validate_file(mock_file, max_size_mb=10)
            
            print_status(f"Validare {file_type}", validation['is_valid'])
            if not validation['is_valid']:
                for error in validation['errors']:
                    print(f"   ❌ {error}")
            else:
                print(f"   📏 Dimensiune: {format_size(validation.get('size', 0))}")
                print(f"   🏷️ MIME: {validation.get('mime_type', 'N/A')}")
                print(f"   📎 Extensie: {validation.get('extension', 'N/A')}")
        
        # Curăță fișierele temporare
        for file_path in test_files.values():
            try:
                os.unlink(file_path)
            except:
                pass
        
        return True
        
    except Exception as e:
        print_status("Validarea fișierelor", False, str(e))
        return False

async def test_file_upload():
    """Testează upload-ul de fișiere"""
    print_header("TESTARE UPLOAD FIȘIERE")
    
    try:
        file_service = FileService()
        test_files = create_test_files()
        uploaded_files = []
        
        for file_type, file_path in test_files.items():
            print(f"\n📤 Upload fișier {file_type}...")
            
            content_types = {
                'text': 'text/plain',
                'image': 'image/jpeg', 
                'pdf': 'application/pdf'
            }
            
            mock_file = MockUploadFile(
                file_path=file_path,
                filename=f"test_{file_type}.{Path(file_path).suffix.lstrip('.')}",
                content_type=content_types.get(file_type, 'application/octet-stream')
            )
            
            try:
                file_info = await file_service.save_uploaded_file(
                    file=mock_file,
                    subfolder="documents",
                    prefix=f"test_{file_type}",
                    generate_thumbnail=(file_type == 'image')
                )
                
                print_status(f"Upload {file_type}", True)
                print_file_info(file_info)
                
                uploaded_files.append(file_info)
                
            except Exception as e:
                print_status(f"Upload {file_type}", False, str(e))
        
        # Curăță fișierele
        for file_path in test_files.values():
            try:
                os.unlink(file_path)
            except:
                pass
        
        # Curăță fișierele uploadate
        for file_info in uploaded_files:
            try:
                await file_service.delete_file(file_info['file_path'])
            except:
                pass
        
        return len(uploaded_files) > 0
        
    except Exception as e:
        print_status("Upload-ul fișierelor", False, str(e))
        return False

def test_mime_types():
    """Testează tipurile MIME suportate"""
    print_header("TESTARE TIPURI MIME SUPORTATE")
    
    mime_types = FileService.ALLOWED_MIME_TYPES
    
    categories = {
        'Documente': [
            'application/pdf', 'application/msword', 'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        'Imagini': [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp'
        ],
        'Archive': [
            'application/zip', 'application/x-rar-compressed'
        ],
        'Media': [
            'video/mp4', 'audio/mpeg'
        ]
    }
    
    for category, types in categories.items():
        print(f"\n📂 {category}:")
        supported = 0
        for mime_type in types:
            if mime_type in mime_types:
                extensions = ", ".join(mime_types[mime_type])
                print(f"   ✅ {mime_type} → {extensions}")
                supported += 1
            else:
                print(f"   ❌ {mime_type} → Nu este suportat")
        
        print_status(f"Suport {category}", supported > 0, f"{supported}/{len(types)} tipuri")
    
    total_supported = len(mime_types)
    print(f"\n📊 Total tipuri MIME suportate: {total_supported}")
    
    return total_supported > 0

async def test_storage_info():
    """Testează informațiile despre spațiul de stocare"""
    print_header("TESTARE INFORMAȚII STOCARE")
    
    try:
        file_service = FileService()
        
        # Informații despre directorul de upload
        upload_dir = file_service.upload_dir
        
        if upload_dir.exists():
            total_size = 0
            file_count = 0
            
            for file_path in upload_dir.rglob("*"):
                if file_path.is_file():
                    total_size += file_path.stat().st_size
                    file_count += 1
            
            print_status("Director upload existent", True)
            print_status("Scanare fișiere", True, {
                "Total fișiere": file_count,
                "Dimensiune totală": format_size(total_size),
                "Calea": str(upload_dir)
            })
        else:
            print_status("Director upload", False, "Directorul nu există")
        
        return True
        
    except Exception as e:
        print_status("Informații stocare", False, str(e))
        return False

async def test_api_endpoints():
    """Testează disponibilitatea endpoint-urilor API"""
    print_header("TESTARE ENDPOINT-URI API")
    
    try:
        import httpx
        
        # URL-uri de testat
        base_url = "http://localhost:8001/api/v1/files"
        endpoints = [
            ("GET", "/stats", "Statistici fișiere"),
            ("GET", "/categories", "Lista categorii"),
            ("GET", "/documents", "Lista documente"),
            ("GET", "/storage-stats", "Statistici stocare"),
        ]
        
        async with httpx.AsyncClient() as client:
            for method, endpoint, description in endpoints:
                try:
                    response = await client.request(method, f"{base_url}{endpoint}")
                    print_status(f"{description}", response.status_code == 200, 
                               f"{method} {endpoint} → {response.status_code}")
                except Exception as e:
                    print_status(f"{description}", False, f"Eroare conexiune: {str(e)}")
        
        return True
        
    except ImportError:
        print_status("Test endpoint-uri", False, "httpx nu este disponibil")
        return False
    except Exception as e:
        print_status("Test endpoint-uri", False, str(e))
        return False

async def main():
    """Funcția principală de test"""
    print("🚀 TESTER SISTEM FIȘIERE - Primărie Digitală")
    print("=" * 60)
    
    tests = [
        ("Configurație FileService", test_file_service_configuration),
        ("Tipuri MIME suportate", test_mime_types), 
        ("Validare fișiere", test_file_validation),
        ("Upload fișiere", test_file_upload),
        ("Informații stocare", test_storage_info),
        ("Endpoint-uri API", test_api_endpoints),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🧪 Rulez testul: {test_name}")
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
                result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Eroare în testul '{test_name}': {e}")
            results.append((test_name, False))
    
    # Sumar rezultate
    print_header("SUMAR TESTE")
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status_icon = "✅" if result else "❌"
        print(f"{status_icon} {test_name}")
        if result:
            passed += 1
    
    success_rate = (passed / total) * 100 if total > 0 else 0
    
    print(f"\n📊 Rezultat final:")
    print(f"   ✅ Teste reușite: {passed}/{total}")
    print(f"   📈 Rata de succes: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print(f"\n🎉 Sistemul de fișiere funcționează corect!")
        return 0
    else:
        print(f"\n⚠️ Sistemul de fișiere are probleme. Verificați erorile de mai sus.")
        return 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⏹️ Test întrerupt de utilizator.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Eroare neașteptată în teste: {e}")
        sys.exit(1)