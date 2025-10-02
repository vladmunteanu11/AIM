"""
Development FastAPI Application for Template Primărie Digitală
Simplified version that works without full PostgreSQL setup
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
from pathlib import Path
import shutil
import uuid
import random
from datetime import datetime, timedelta
import json
from pathlib import Path

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent.parent / '.env'
    load_dotenv(env_path)
    print(f"Loaded .env from: {env_path}")
except ImportError:
    print("python-dotenv not installed. Using system environment variables only.")
except Exception as e:
    print(f"Error loading .env: {e}")

# Basic configuration
app = FastAPI(
    title="Primărie Digitală API - Development",
    description="API pentru Template Primărie Digitală #DigiLocal - Development Mode",
    version="1.0.0"
)

# CORS configuration for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)

# Create uploads directory
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

# Mock authentication
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # In development, accept any token or no token
    return {"id": 1, "email": "admin@primarie.ro", "full_name": "Administrator"}

# Mock data models
class MunicipalityConfig(BaseModel):
    id: int = 1
    name: str = os.getenv("MUNICIPALITY_NAME", "Primăria Exemplu")
    official_name: str = os.getenv("MUNICIPALITY_OFFICIAL_NAME", "Comuna Exemplu, Județul Exemplu")
    mayor_name: str = os.getenv("MAYOR_NAME", "Ion Popescu")
    logo_url: Optional[str] = os.getenv("LOGO_URL", "/logo-primarie.png")
    contact_email: str = os.getenv("CONTACT_EMAIL", "contact@primaria-exemplu.ro")
    contact_phone: str = os.getenv("CONTACT_PHONE", "0256 123 456")
    address: str = os.getenv("MUNICIPALITY_ADDRESS", "Strada Principală nr. 1, Comuna Exemplu, Județul Exemplu")
    website_url: str = os.getenv("MUNICIPALITY_WEBSITE", "https://primaria-exemplu.ro")
    primary_color: str = os.getenv("PRIMARY_COLOR", "#004990")
    secondary_color: str = os.getenv("SECONDARY_COLOR", "#0079C1")

class Announcement(BaseModel):
    id: int
    title: str
    content: str
    excerpt: str
    date: str
    category: str
    is_urgent: bool = False
    image_url: Optional[str] = None

class Page(BaseModel):
    id: int
    slug: str
    title: str
    content: str
    meta_description: Optional[str] = None

class ComplaintCategory(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    requires_location: bool = True
    requires_photos: bool = False
    responsible_department: Optional[str] = None
    response_time_hours: int = 24
    resolution_time_days: int = 7
    sort_order: int = 0
    is_active: bool = True

class Complaint(BaseModel):
    id: str
    category_id: int
    title: str
    description: str
    citizen_name: str
    citizen_email: Optional[str] = None
    citizen_phone: Optional[str] = None
    citizen_address: Optional[str] = None
    is_anonymous: bool = False
    location_address: Optional[str] = None
    location_details: Optional[str] = None
    urgency_level: str = "normal"
    status: str = "submitted"
    reference_number: str
    submitted_at: str
    acknowledged_at: Optional[str] = None
    started_at: Optional[str] = None
    resolved_at: Optional[str] = None
    admin_notes: Optional[str] = None
    consent_given: bool = True
    attached_photos: Optional[List[str]] = None
    attached_documents: Optional[List[str]] = None

class ComplaintCreate(BaseModel):
    category_id: int
    title: str
    description: str
    citizen_name: str
    citizen_email: Optional[str] = None
    citizen_phone: Optional[str] = None
    citizen_address: Optional[str] = None
    is_anonymous: bool = False
    location_address: Optional[str] = None
    location_details: Optional[str] = None
    urgency_level: str = "normal"
    consent_given: bool = True

class ComplaintStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None

# Global municipality config storage (in production this would be in database)
global_municipality_config = None

# Mock data pentru categorii de sesizări
mock_complaint_categories = [
    ComplaintCategory(
        id=1,
        name="Probleme Rutiere și Trafic",
        slug="probleme-rutiere-trafic",
        description="Gropi, semne lipsă, semafoare defecte, probleme de circulație",
        requires_location=True,
        requires_photos=True,
        responsible_department="Direcția Tehnică",
        response_time_hours=12,
        resolution_time_days=5,
        sort_order=1
    ),
    ComplaintCategory(
        id=2,
        name="Curățenie și Salubritate",
        slug="curatenie-salubritate",
        description="Gunoaie neridicate, spații verzi neîntreținute, canalizare",
        requires_location=True,
        requires_photos=True,
        responsible_department="Serviciul de Salubritate",
        response_time_hours=24,
        resolution_time_days=3,
        sort_order=2
    ),
    ComplaintCategory(
        id=3,
        name="Iluminat Public",
        slug="iluminat-public",
        description="Becuri arse, stâlpi căzuți, zone neilluminate",
        requires_location=True,
        requires_photos=False,
        responsible_department="Direcția Tehnică",
        response_time_hours=8,
        resolution_time_days=2,
        sort_order=3
    ),
    ComplaintCategory(
        id=4,
        name="Zgomot și Deranj Public",
        slug="zgomot-deranj-public",
        description="Zgomot excesiv, petreceri, construcții în ore nepermise",
        requires_location=True,
        requires_photos=False,
        responsible_department="Poliția Locală",
        response_time_hours=4,
        resolution_time_days=1,
        sort_order=4
    ),
    ComplaintCategory(
        id=5,
        name="Spații Verzi și Parcuri",
        slug="spatii-verzi-parcuri",
        description="Deteriorări în parcuri, copaci căzuți, jocuri copii defecte",
        requires_location=True,
        requires_photos=True,
        responsible_department="Serviciul Spații Verzi",
        response_time_hours=24,
        resolution_time_days=7,
        sort_order=5
    ),
    ComplaintCategory(
        id=6,
        name="Parcare Neregulamentară",
        slug="parcare-neregulamentara",
        description="Mașini parcate neregulamentar, blocarea căilor de acces",
        requires_location=True,
        requires_photos=True,
        responsible_department="Poliția Locală",
        response_time_hours=2,
        resolution_time_days=1,
        sort_order=6
    ),
    ComplaintCategory(
        id=7,
        name="Utilități Publice",
        slug="utilitati-publice",
        description="Probleme cu apa, gaze, canalizare în spațiile publice",
        requires_location=True,
        requires_photos=False,
        responsible_department="Serviciul Utilități",
        response_time_hours=6,
        resolution_time_days=3,
        sort_order=7
    ),
    ComplaintCategory(
        id=8,
        name="Alte Probleme",
        slug="alte-probleme",
        description="Orice altă problemă care nu se încadrează în categoriile de mai sus",
        requires_location=False,
        requires_photos=False,
        responsible_department="Secretariat",
        response_time_hours=48,
        resolution_time_days=10,
        sort_order=8
    )
]

# Mock data pentru sesizări
mock_complaints = []

def generate_reference_number():
    """Generează un număr de referință pentru sesizare"""
    return f"SES-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

def create_mock_complaint(category_id: int, title: str, description: str, status: str = "submitted"):
    """Creează o sesizare mock pentru demonstrație"""
    complaint_id = str(uuid.uuid4())
    submitted_date = datetime.now() - timedelta(days=random.randint(0, 30))
    
    complaint = Complaint(
        id=complaint_id,
        category_id=category_id,
        title=title,
        description=description,
        citizen_name=f"Cetățean {random.randint(1, 100)}",
        citizen_email=f"cetatean{random.randint(1, 100)}@email.com",
        citizen_phone=f"07{random.randint(10000000, 99999999)}",
        citizen_address=f"Str. Exemplu nr. {random.randint(1, 100)}",
        is_anonymous=False,
        location_address=f"Intersecția str. {random.choice(['Principală', 'Libertății', 'Mihai Viteazu', 'Aurel Vlaicu'])} cu str. {random.choice(['Republicii', 'Unirii', 'Florilor', 'Speranței'])}",
        urgency_level=random.choice(["low", "normal", "high"]),
        status=status,
        reference_number=generate_reference_number(),
        submitted_at=submitted_date.isoformat(),
        consent_given=True
    )
    
    # Adaugă timestamps bazat pe status
    if status in ["acknowledged", "in_progress", "resolved"]:
        complaint.acknowledged_at = (submitted_date + timedelta(hours=random.randint(1, 24))).isoformat()
    
    if status in ["in_progress", "resolved"]:
        complaint.started_at = (submitted_date + timedelta(days=random.randint(1, 3))).isoformat()
    
    if status == "resolved":
        complaint.resolved_at = (submitted_date + timedelta(days=random.randint(3, 7))).isoformat()
        complaint.admin_notes = "Problema a fost rezolvată conform planificării."
    
    return complaint

# Generează date mock pentru sesizări
for i in range(25):
    category_id = random.randint(1, 8)
    status = random.choice(["submitted", "acknowledged", "in_progress", "resolved"])
    
    titles_by_category = {
        1: ["Groapă mare pe strada Principală", "Semafor defect la intersecție", "Lipsă indicator de circulație"],
        2: ["Gunoi nestrâns de 3 zile", "Canalizare înfundată", "Grădină publică neîngrijită"],
        3: ["Becuri arse pe aleea parcului", "Stâlp căzut după furtună", "Zonă întunecată periculoasă"],
        4: ["Muzică tare în bloc", "Construcții în timpul nopții", "Câini maidanezi agresivi"],
        5: ["Copac căzut în parc", "Băncuță spartă", "Leagăn defect la locul de joacă"],
        6: ["Mașină parcată pe trotuar", "Acces blocat la intrarea în bloc", "Parcare pe spațiul verde"],
        7: ["Țeavă spartă pe stradă", "Capac canal lipsă", "Scurgere de gaz în parc"],
        8: ["Problem nedefinită", "Solicitare informații", "Reclamație generală"]
    }
    
    descriptions_by_category = {
        1: ["Există o groapă foarte mare care pune în pericol circulația auto și pietonală. Vă rog să o reparați urgent.",
            "Semaforul de la intersecție nu funcționează de câteva zile, creând probleme de circulație.",
            "Lipsește indicatorul de circulație, ceea ce creează confuzie pentru șoferi."],
        2: ["Gunoiul nu a fost strâns de 3 zile și începe să miroasă foarte urât. Zona devine insalubră.",
            "Canalizarea este înfundată și apa se scurge pe stradă. Situația este urgentă.",
            "Grădina publică nu a fost îngrijită de luni de zile și arată foarte urât."],
        3: ["Toate becurile sunt arse pe această alee și noaptea este foarte întuneric și periculos.",
            "După furtuna de săptămâna trecută, stâlpul s-a prăbușit și blochează trecerea.",
            "Zona este foarte întunecată și prezintă risc de securitate pentru cetățeni."],
        4: ["Vecinii de la etajul de sus fac muzică foarte tare în fiecare noapte după ora 22:00.",
            "Se fac lucrări de construcție în timpul nopții, încălcând programul legal.",
            "Câinii maidanezi din zonă au devenit agresivi și atacă trecătorii."],
        5: ["După furtună, un copac s-a prăbușit în parc și blochează aleea principală.",
            "Băncuța din parc este spartă și prezintă risc de accidentare pentru vizitatori.",
            "Leagănul pentru copii este defect și periculos pentru siguranța copiilor."],
        6: ["O mașină este parcată pe trotuar de câteva zile, împiedicând circulația pietonilor.",
            "Accesul la intrarea în bloc este blocat de mașini parcate neregulamentar.",
            "Mașinile parcate pe spațiul verde distrug gazonul și înfrumusețarea zonei."],
        7: ["O țeavă s-a spart pe stradă și apa se scurge continuu, creând risc de accidente.",
            "Capacul de canal lipsește și prezintă risc major pentru siguranța pietonilor și auto.",
            "Se simte miros de gaz în parc, ceea ce poate fi foarte periculos."],
        8: ["Am o problemă care nu se încadrează în celelalte categorii dar necesită atenție.",
            "Doresc să obțin informații despre procedurile administrative locale.",
            "Am o reclamație generală privind serviciile publice din comună."]
    }
    
    title = random.choice(titles_by_category.get(category_id, ["Problemă generală"]))
    description = random.choice(descriptions_by_category.get(category_id, ["Descriere generală a problemei."]))
    
    mock_complaints.append(create_mock_complaint(category_id, title, description, status))

# Mock data storage
def get_municipality_config():
    """Generate fresh municipality config with current ENV values"""
    return MunicipalityConfig(
        id=1,
        name=os.getenv("MUNICIPALITY_NAME", "Primăria Exemplu"),
        official_name=os.getenv("MUNICIPALITY_OFFICIAL_NAME", "Comuna Exemplu, Județul Exemplu"),
        mayor_name=os.getenv("MAYOR_NAME", "Ion Popescu"),
        logo_url=os.getenv("LOGO_URL", "/logo-primarie.png"),
        contact_email=os.getenv("CONTACT_EMAIL", "contact@primaria-exemplu.ro"),
        contact_phone=os.getenv("CONTACT_PHONE", "0256 123 456"),
        address=os.getenv("MUNICIPALITY_ADDRESS", "Strada Principală nr. 1, Comuna Exemplu, Județul Exemplu"),
        website_url=os.getenv("MUNICIPALITY_WEBSITE", "https://primaria-exemplu.ro"),
        primary_color=os.getenv("PRIMARY_COLOR", "#004990"),
        secondary_color=os.getenv("SECONDARY_COLOR", "#0079C1")
    )

mock_announcements = [
    Announcement(
        id=1,
        title="Consultare publică - Planul Urbanistic General",
        content="Detalii complete despre consultarea publică pentru actualizarea Planului Urbanistic General...",
        excerpt="Invităm cetățenii să participe la consultarea publică pentru actualizarea Planului Urbanistic General.",
        date="2024-11-15",
        category="Urbanism",
        is_urgent=True,
        image_url="/announcements/urban-plan.jpg"
    ),
    Announcement(
        id=2,
        title="Program special de colectare deșeuri voluminoase",
        content="În perioada 20-24 noiembrie se va desfășura programul special...",
        excerpt="În perioada 20-24 noiembrie se va desfășura programul special de colectare a deșeurilor voluminoase.",
        date="2024-11-12",
        category="Mediu",
        is_urgent=False,
        image_url="/announcements/waste-collection.jpg"
    ),
    Announcement(
        id=3,
        title="Modernizarea sistemului de iluminat public",
        content="A început proiectul de modernizare a sistemului de iluminat public cu tehnologie LED...",
        excerpt="A început proiectul de modernizare a sistemului de iluminat public cu tehnologie LED.",
        date="2024-11-10",
        category="Infrastructură",
        is_urgent=False,
        image_url="/announcements/led-lighting.jpg"
    )
]

# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Template Primărie Digitală API - Development Mode 🚀 HOT RELOAD ACTIVE!",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/api/v1/municipality/config", response_model=MunicipalityConfig)
async def get_municipality_config_endpoint():
    """Get municipality configuration"""
    global global_municipality_config
    if global_municipality_config:
        return global_municipality_config
    # Debug ENV values
    print(f"DEBUG: MUNICIPALITY_NAME = {os.getenv('MUNICIPALITY_NAME', 'NOT_SET')}")
    config = get_municipality_config()
    global_municipality_config = config
    return config

@app.put("/api/v1/municipality/config", response_model=MunicipalityConfig)
async def update_municipality_config(config: MunicipalityConfig, user = Depends(get_current_user)):
    """Update municipality configuration"""
    global global_municipality_config
    global_municipality_config = config
    print(f"✅ Configuration updated by {user['email']}")
    print(f"   Name: {config.name}")
    print(f"   Colors: {config.primary_color}, {config.secondary_color}")
    return config

@app.get("/api/v1/announcements", response_model=List[Announcement])
async def get_announcements(limit: int = 10, urgent_only: bool = False):
    """Get announcements with optional filtering"""
    announcements = mock_announcements
    
    if urgent_only:
        announcements = [a for a in announcements if a.is_urgent]
    
    return announcements[:limit]

@app.get("/api/v1/announcements/{announcement_id}", response_model=Announcement)
async def get_announcement(announcement_id: int):
    """Get specific announcement by ID"""
    announcement = next((a for a in mock_announcements if a.id == announcement_id), None)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return announcement

@app.get("/api/v1/pages/{slug}", response_model=Page)
async def get_page(slug: str):
    """Get page by slug"""
    # Mock page data
    mock_pages = {
        "despre-primarie": Page(
            id=1,
            slug="despre-primarie",
            title="Despre Primărie",
            content="<h1>Despre Primărie</h1><p>Informații despre organizarea și funcționarea primăriei...</p>",
            meta_description="Informații despre organizarea și funcționarea primăriei"
        ),
        "contact": Page(
            id=2,
            slug="contact",
            title="Contact",
            content="<h1>Contact</h1><p>Informații de contact și program de audiențe...</p>",
            meta_description="Informații de contact și program de audiențe"
        )
    }
    
    page = mock_pages.get(slug)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@app.get("/api/v1/search")
async def search(q: str, limit: int = 10):
    """Basic search functionality"""
    if not q or len(q) < 2:
        return {"results": [], "total": 0}
    
    # Simple search in announcements
    results = []
    for announcement in mock_announcements:
        if (q.lower() in announcement.title.lower() or 
            q.lower() in announcement.content.lower() or 
            q.lower() in announcement.category.lower()):
            results.append({
                "type": "announcement",
                "id": announcement.id,
                "title": announcement.title,
                "excerpt": announcement.excerpt,
                "url": f"/anunturi/{announcement.id}"
            })
    
    return {
        "results": results[:limit],
        "total": len(results),
        "query": q
    }

@app.post("/api/v1/municipality/logo")
async def upload_logo(file: UploadFile = File(...), user = Depends(get_current_user)):
    """Upload municipality logo"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Only image files are allowed")
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'png'
        filename = f"logo_{uuid.uuid4().hex}.{file_extension}"
        file_path = uploads_dir / filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logo_url = f"/uploads/{filename}"
        
        # Update global config with new logo
        global global_municipality_config
        if global_municipality_config:
            global_municipality_config.logo_url = logo_url
        
        print(f"✅ Logo uploaded by {user['email']}: {logo_url}")
        
        return {"message": "Logo uploaded successfully", "logo_url": logo_url}
    
    except Exception as e:
        print(f"❌ Error uploading logo: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload logo")

# ========== FORMULARE ONLINE - CERERI ADMINISTRATIVE ==========

class FormType(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    requires_auth: bool = False
    is_active: bool = True
    estimated_processing_days: Optional[int] = None
    form_schema: dict = {}
    required_documents: Optional[List[str]] = None

class FormSubmission(BaseModel):
    id: str
    form_type_id: int
    reference_number: str
    citizen_name: str
    citizen_email: Optional[str] = None
    citizen_phone: Optional[str] = None
    citizen_cnp: Optional[str] = None
    citizen_address: Optional[str] = None
    submission_data: dict = {}
    status: str = "pending"
    submitted_at: str
    consent_given: bool = True
    attached_files: Optional[List[str]] = None
    processing_notes: Optional[str] = None
    processed_at: Optional[str] = None

class FormSubmissionCreate(BaseModel):
    form_type_id: int
    citizen_name: str
    citizen_email: Optional[str] = None
    citizen_phone: Optional[str] = None
    citizen_cnp: Optional[str] = None
    citizen_address: Optional[str] = None
    submission_data: dict = {}
    consent_given: bool = True

# Mock data pentru tipuri de formulare
mock_form_types = [
    FormType(
        id=1,
        name="Certificat de Urbanism",
        slug="certificat-urbanism",
        description="Cerere pentru obținerea certificatului de urbanism pentru construcții noi sau modificări",
        instructions="Completați toate câmpurile obligatorii și atașați documentele necesare conform listei.",
        requires_auth=False,
        is_active=True,
        estimated_processing_days=15,
        form_schema={
            "type": "object",
            "properties": {
                "property_address": {"type": "string", "title": "Adresa proprietății"},
                "property_cadastral": {"type": "string", "title": "Număr cadastral"},
                "construction_type": {"type": "string", "title": "Tipul construcției", "enum": ["casa", "anexe", "gard", "altele"]},
                "construction_purpose": {"type": "string", "title": "Destinația construcției"},
                "property_area": {"type": "number", "title": "Suprafața terenului (mp)"},
                "building_area": {"type": "number", "title": "Suprafața construită (mp)"},
                "additional_notes": {"type": "string", "title": "Observații suplimentare"}
            },
            "required": ["property_address", "property_cadastral", "construction_type", "property_area"]
        },
        required_documents=[
            "Copie certificat de proprietate/contract de vânzare-cumpărare",
            "Copie plan de situație",
            "Copie carte de identitate solicitant",
            "Procură notarială (dacă este cazul)"
        ]
    ),
    FormType(
        id=2,
        name="Autorizație de Construcție",
        slug="autorizatie-constructie",
        description="Cerere pentru obținerea autorizației de construcție pentru lucrări de construcții",
        instructions="Necesită în prealabil certificatul de urbanism valid. Consultați arhitectul pentru documentația tehnică.",
        requires_auth=False,
        is_active=True,
        estimated_processing_days=30,
        form_schema={
            "type": "object",
            "properties": {
                "urbanism_certificate_number": {"type": "string", "title": "Numărul certificatului de urbanism"},
                "project_type": {"type": "string", "title": "Tipul proiectului", "enum": ["construcție_nouă", "extindere", "reabilitare", "demolare"]},
                "total_investment": {"type": "number", "title": "Valoarea totală a investiției (lei)"},
                "construction_start_date": {"type": "string", "format": "date", "title": "Data estimată de începere a lucrărilor"},
                "construction_duration": {"type": "number", "title": "Durata estimată a lucrărilor (luni)"},
                "architect_name": {"type": "string", "title": "Numele arhitectului responsabil"},
                "contractor_name": {"type": "string", "title": "Numele constructorului/firmei"}
            },
            "required": ["urbanism_certificate_number", "project_type", "total_investment", "architect_name"]
        },
        required_documents=[
            "Certificat de urbanism valid",
            "Proiect tehnic complet",
            "Aviz ISU",
            "Aviz de mediu (dacă este cazul)",
            "Asigurare de răspundere civilă",
            "Dovada plății taxelor"
        ]
    ),
    FormType(
        id=3,
        name="Certificat Fiscal",
        slug="certificat-fiscal",
        description="Cerere pentru obținerea certificatului fiscal privind îndeplinirea obligațiilor către bugetul local",
        instructions="Certificatul confirmă că nu aveți datorii restante către primărie.",
        requires_auth=False,
        is_active=True,
        estimated_processing_days=3,
        form_schema={
            "type": "object",
            "properties": {
                "certificate_purpose": {"type": "string", "title": "Scopul certificatului"},
                "property_address": {"type": "string", "title": "Adresa proprietății (dacă este cazul)"},
                "business_name": {"type": "string", "title": "Numele firmei (pentru PFA/SRL)"},
                "cui": {"type": "string", "title": "CUI/CIF (pentru firme)"},
                "urgent_processing": {"type": "boolean", "title": "Solicit procesare urgentă (+taxa suplimentară)"}
            },
            "required": ["certificate_purpose"]
        },
        required_documents=[
            "Copie carte de identitate",
            "Dovada plății taxei",
            "Împuternicire notarială (dacă nu este solicitantul direct)"
        ]
    ),
    FormType(
        id=4,
        name="Adeverință de Domiciliu",
        slug="adeverinta-domiciliu",
        description="Cerere pentru obținerea adeverinței de domiciliu/reședința",
        instructions="Documentul confirmă că aveți domiciliul/reședința în această localitate.",
        requires_auth=False,
        is_active=True,
        estimated_processing_days=2,
        form_schema={
            "type": "object",
            "properties": {
                "address": {"type": "string", "title": "Adresa completă"},
                "residence_type": {"type": "string", "title": "Tipul reședinței", "enum": ["domiciliu", "reședința", "reședința_temporară"]},
                "purpose": {"type": "string", "title": "Scopul adeverinței"},
                "family_members": {"type": "array", "title": "Membrii familiei care locuiesc la aceeași adresă", "items": {"type": "string"}},
                "residence_since": {"type": "string", "format": "date", "title": "Locuiește de la data"}
            },
            "required": ["address", "residence_type", "purpose", "residence_since"]
        },
        required_documents=[
            "Copie carte de identitate",
            "Copie contract de închiriere/proprietate",
            "Dovada plății taxei"
        ]
    ),
    FormType(
        id=5,
        name="Cerere Racordare Utilități",
        slug="cerere-racordare",
        description="Cerere pentru racordarea la rețelele de utilități publice (apă, canalizare, gaz)",
        instructions="Specificați tipul de utilitate și furnizați toate documentele necesare.",
        requires_auth=False,
        is_active=True,
        estimated_processing_days=20,
        form_schema={
            "type": "object",
            "properties": {
                "utility_type": {"type": "string", "title": "Tipul utilității", "enum": ["apă", "canalizare", "gaz", "apă_și_canalizare"]},
                "property_address": {"type": "string", "title": "Adresa proprietății"},
                "property_type": {"type": "string", "title": "Tipul proprietății", "enum": ["rezidențială", "comercială", "industrială"]},
                "estimated_consumption": {"type": "number", "title": "Consumul estimat (mc/lună)"},
                "connection_diameter": {"type": "string", "title": "Diametrul de racordare solicitat"},
                "construction_permit": {"type": "string", "title": "Numărul autorizației de construcție"},
                "access_authorization": {"type": "boolean", "title": "Autorizez accesul pe proprietate pentru lucrări"}
            },
            "required": ["utility_type", "property_address", "property_type", "access_authorization"]
        },
        required_documents=[
            "Copie certificat de proprietate",
            "Copie autorizație de construcție",
            "Plan de situație cu racordurile",
            "Copie carte de identitate",
            "Dovada plății taxelor"
        ]
    ),
    FormType(
        id=6,
        name="Licență de Funcționare",
        slug="licenta-functionare",
        description="Cerere pentru obținerea licenței de funcționare pentru activități comerciale",
        instructions="Consultați lista de activități care necesită licență de funcționare de la primărie.",
        requires_auth=False,
        is_active=True,
        estimated_processing_days=25,
        form_schema={
            "type": "object",
            "properties": {
                "business_name": {"type": "string", "title": "Denumirea firmei"},
                "cui": {"type": "string", "title": "CUI/CIF"},
                "activity_type": {"type": "string", "title": "Tipul de activitate"},
                "caen_code": {"type": "string", "title": "Codul CAEN principal"},
                "business_address": {"type": "string", "title": "Adresa locației de desfășurare"},
                "space_area": {"type": "number", "title": "Suprafața spațiului (mp)"},
                "employees_number": {"type": "number", "title": "Numărul de angajați"},
                "estimated_start_date": {"type": "string", "format": "date", "title": "Data estimată de începere a activității"},
                "special_requirements": {"type": "string", "title": "Cerințe speciale (dacă este cazul)"}
            },
            "required": ["business_name", "cui", "activity_type", "business_address", "space_area"]
        },
        required_documents=[
            "Certificat de înregistrare firmă",
            "Copie contract închiriere/proprietate spațiu",
            "Avize conform destinației (ISU, Sanitar, etc.)",
            "Dovada plății taxelor",
            "Copie carte de identitate reprezentant legal"
        ]
    )
]

# Mock data pentru cereri/submisii
mock_form_submissions = []

def generate_form_reference_number(form_type_slug: str):
    """Generează numărul de referință pentru cereri administrative"""
    prefix_map = {
        'certificat-urbanism': 'CU',
        'autorizatie-constructie': 'AC',
        'certificat-fiscal': 'CF',
        'adeverinta-domiciliu': 'AD',
        'cerere-racordare': 'CR',
        'licenta-functionare': 'LF'
    }
    prefix = prefix_map.get(form_type_slug, 'FORM')
    return f"{prefix}-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

# Generează date mock pentru cereri
for i in range(15):
    form_type = random.choice(mock_form_types)
    status = random.choice(["pending", "in_review", "approved", "completed", "rejected"])
    submitted_date = datetime.now() - timedelta(days=random.randint(0, 45))
    
    # Date mock bazate pe tipul formularului
    submission_data = {}
    if form_type.slug == "certificat-urbanism":
        submission_data = {
            "property_address": f"Str. {random.choice(['Libertății', 'Republicii', 'Mihai Viteazu'])} nr. {random.randint(1, 50)}",
            "property_cadastral": f"{random.randint(100000, 999999)}",
            "construction_type": random.choice(["casa", "anexe", "gard"]),
            "property_area": random.randint(200, 1000),
            "building_area": random.randint(80, 300)
        }
    elif form_type.slug == "certificat-fiscal":
        submission_data = {
            "certificate_purpose": random.choice(["Vânzare proprietate", "Credit bancar", "Licitație publică", "Documentație legală"]),
            "urgent_processing": random.choice([True, False])
        }
    elif form_type.slug == "adeverinta-domiciliu":
        submission_data = {
            "address": f"Str. {random.choice(['Principală', 'Florilor', 'Speranței'])} nr. {random.randint(1, 30)}",
            "residence_type": random.choice(["domiciliu", "reședința"]),
            "purpose": "Documentație oficială",
            "residence_since": (datetime.now() - timedelta(days=random.randint(365, 1825))).strftime('%Y-%m-%d')
        }
    
    submission = FormSubmission(
        id=str(uuid.uuid4()),
        form_type_id=form_type.id,
        reference_number=generate_form_reference_number(form_type.slug),
        citizen_name=f"Solicitant {random.randint(1, 100)}",
        citizen_email=f"solicitant{random.randint(1, 100)}@email.com",
        citizen_phone=f"07{random.randint(10000000, 99999999)}",
        citizen_address=f"Str. Exemplu nr. {random.randint(1, 50)}",
        submission_data=submission_data,
        status=status,
        submitted_at=submitted_date.isoformat(),
        consent_given=True
    )
    
    mock_form_submissions.append(submission)

# ========== API ENDPOINTS PENTRU FORMULARE ONLINE ==========

@app.get("/api/v1/form-types", response_model=List[FormType])
async def get_form_types():
    """Obține toate tipurile de formulare active"""
    active_forms = [form for form in mock_form_types if form.is_active]
    return sorted(active_forms, key=lambda x: x.name)

@app.get("/api/v1/form-types/{form_type_id}", response_model=FormType)
async def get_form_type(form_type_id: int):
    """Obține un tip de formular specific"""
    form_type = next((form for form in mock_form_types if form.id == form_type_id), None)
    if not form_type:
        raise HTTPException(status_code=404, detail="Tipul de formular nu a fost găsit")
    return form_type

@app.get("/api/v1/form-types/slug/{slug}", response_model=FormType)
async def get_form_type_by_slug(slug: str):
    """Obține un tip de formular după slug"""
    form_type = next((form for form in mock_form_types if form.slug == slug), None)
    if not form_type:
        raise HTTPException(status_code=404, detail="Tipul de formular nu a fost găsit")
    return form_type

@app.post("/api/v1/form-submissions", response_model=FormSubmission)
async def create_form_submission(submission_data: FormSubmissionCreate):
    """Creează o cerere administrativă nouă"""
    try:
        # Verifică dacă tipul de formular există
        form_type = next((form for form in mock_form_types if form.id == submission_data.form_type_id), None)
        if not form_type:
            raise HTTPException(status_code=400, detail="Tipul de formular specificat nu există")
        
        # Verifică consimțământul GDPR
        if not submission_data.consent_given:
            raise HTTPException(status_code=400, detail="Consimțământul pentru prelucrarea datelor este obligatoriu")
        
        # Creează cererea
        submission_id = str(uuid.uuid4())
        reference_number = generate_form_reference_number(form_type.slug)
        now = datetime.now()
        
        new_submission = FormSubmission(
            id=submission_id,
            form_type_id=submission_data.form_type_id,
            reference_number=reference_number,
            citizen_name=submission_data.citizen_name,
            citizen_email=submission_data.citizen_email,
            citizen_phone=submission_data.citizen_phone,
            citizen_cnp=submission_data.citizen_cnp,
            citizen_address=submission_data.citizen_address,
            submission_data=submission_data.submission_data,
            status="pending",
            submitted_at=now.isoformat(),
            consent_given=submission_data.consent_given
        )
        
        # Adaugă în lista mock
        mock_form_submissions.append(new_submission)
        
        print(f"✅ Cerere administrativă nouă creată: {reference_number}")
        print(f"   Tip formular: {form_type.name}")
        print(f"   Solicitant: {submission_data.citizen_name}")
        
        return new_submission
        
    except Exception as e:
        print(f"❌ Eroare la crearea cererii: {e}")
        raise HTTPException(status_code=500, detail="Eroare la crearea cererii")

@app.get("/api/v1/form-submissions", response_model=List[FormSubmission])
async def get_form_submissions(
    form_type_id: Optional[int] = None,
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    """Obține lista cererilor cu filtrare opțională"""
    submissions = mock_form_submissions.copy()
    
    # Filtrează după tipul de formular
    if form_type_id:
        submissions = [s for s in submissions if s.form_type_id == form_type_id]
    
    # Filtrează după status
    if status:
        submissions = [s for s in submissions if s.status == status]
    
    # Sortează după data submiterii (cele mai recente primul)
    submissions.sort(key=lambda x: x.submitted_at, reverse=True)
    
    # Paginație
    submissions = submissions[offset:offset + limit]
    
    return submissions

@app.get("/api/v1/form-submissions/reference/{reference_number}", response_model=FormSubmission)
async def get_form_submission_by_reference(reference_number: str):
    """Obține o cerere după numărul de referință"""
    submission = next((s for s in mock_form_submissions if s.reference_number == reference_number), None)
    if not submission:
        raise HTTPException(status_code=404, detail="Cererea cu acest număr de referință nu a fost găsită")
    return submission

@app.get("/api/v1/form-submissions/stats")
async def get_form_submissions_stats():
    """Obține statistici despre cererile administrative"""
    total_submissions = len(mock_form_submissions)
    
    # Cereri pe status
    status_counts = {}
    for submission in mock_form_submissions:
        status_counts[submission.status] = status_counts.get(submission.status, 0) + 1
    
    # Cereri pe tip de formular
    form_type_counts = {}
    for submission in mock_form_submissions:
        form_type = next((ft for ft in mock_form_types if ft.id == submission.form_type_id), None)
        if form_type:
            form_type_counts[form_type.name] = form_type_counts.get(form_type.name, 0) + 1
    
    # Cereri din ultima săptămână
    one_week_ago = datetime.now() - timedelta(days=7)
    recent_submissions = [
        s for s in mock_form_submissions 
        if datetime.fromisoformat(s.submitted_at) > one_week_ago
    ]
    
    return {
        "total_submissions": total_submissions,
        "submitted_this_week": len(recent_submissions),
        "status_breakdown": status_counts,
        "form_type_breakdown": form_type_counts,
        "pending_review": status_counts.get("pending", 0),
        "in_review": status_counts.get("in_review", 0),
        "completed_this_month": status_counts.get("completed", 0)
    }

@app.get("/api/v1/form-submissions/{submission_id}", response_model=FormSubmission)
async def get_form_submission(submission_id: str):
    """Obține o cerere specifică după ID"""
    submission = next((s for s in mock_form_submissions if s.id == submission_id), None)
    if not submission:
        raise HTTPException(status_code=404, detail="Cererea nu a fost găsită")
    return submission

# ========== SIMULARE PROCESARE CERERI ==========

@app.put("/api/v1/form-submissions/{submission_id}/status")
async def update_form_submission_status(
    submission_id: str,
    new_status: str,
    processing_notes: str = None,
    user = Depends(get_current_user)
):
    """Actualizează statusul unei cereri (simulare pentru admin)"""
    try:
        # Găsește cererea
        submission = next((s for s in mock_form_submissions if s.id == submission_id), None)
        if not submission:
            raise HTTPException(status_code=404, detail="Cererea nu a fost găsită")
        
        # Validează statusul
        valid_statuses = ["pending", "in_review", "approved", "completed", "rejected"]
        if new_status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Status invalid")
        
        # Actualizează statusul
        old_status = submission.status
        submission.status = new_status
        
        if processing_notes:
            submission.processing_notes = processing_notes
        
        # Actualizează timestamps
        now = datetime.now()
        if new_status == "in_review" and old_status == "pending":
            submission.assigned_at = now.isoformat()
        elif new_status in ["approved", "completed", "rejected"]:
            submission.processed_at = now.isoformat()
        
        if new_status == "completed":
            submission.completed_at = now.isoformat()
        
        print(f"✅ Status cerere actualizat: {submission.reference_number}")
        print(f"   De la: {old_status} -> La: {new_status}")
        print(f"   Admin: {user['email']}")
        
        return {
            "message": "Status actualizat cu succes",
            "submission": submission,
            "old_status": old_status,
            "new_status": new_status
        }
        
    except Exception as e:
        print(f"❌ Eroare la actualizarea statusului: {e}")
        raise HTTPException(status_code=500, detail="Eroare la actualizarea statusului")

# Helper endpoint pentru a simula rapid aprobarea unei cereri pentru testare
@app.post("/api/v1/form-submissions/{submission_id}/quick-approve")
async def quick_approve_submission(submission_id: str, user = Depends(get_current_user)):
    """Aprobă rapid o cerere pentru testarea generării documentelor"""
    try:
        # Găsește cererea
        submission = next((s for s in mock_form_submissions if s.id == submission_id), None)
        if not submission:
            raise HTTPException(status_code=404, detail="Cererea nu a fost găsită")
        
        # Schimbă statusul la approved
        old_status = submission.status
        submission.status = "approved"
        submission.processing_notes = "Cerere aprobată pentru testare generare document"
        submission.processed_at = datetime.now().isoformat()
        
        print(f"✅ Cerere aprobată rapid pentru testare: {submission.reference_number}")
        
        return {
            "message": "Cerere aprobată cu succes",
            "submission": submission,
            "can_generate_document": True,
            "generate_url": f"/api/v1/documents/generate/{submission_id}"
        }
        
    except Exception as e:
        print(f"❌ Eroare la aprobarea cererii: {e}")
        raise HTTPException(status_code=500, detail="Eroare la aprobarea cererii")

# Endpoints pentru Servicii Online - Sesizări

@app.get("/api/v1/complaints/categories", response_model=List[ComplaintCategory])
async def get_complaint_categories():
    """Obține toate categoriile de sesizări active"""
    active_categories = [cat for cat in mock_complaint_categories if cat.is_active]
    return sorted(active_categories, key=lambda x: x.sort_order)

@app.get("/api/v1/complaints/categories/{category_id}", response_model=ComplaintCategory)
async def get_complaint_category(category_id: int):
    """Obține o categorie specifică de sesizări"""
    category = next((cat for cat in mock_complaint_categories if cat.id == category_id), None)
    if not category:
        raise HTTPException(status_code=404, detail="Categoria nu a fost găsită")
    return category

@app.get("/api/v1/complaints", response_model=List[Complaint])
async def get_complaints(
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    """Obține lista sesizărilor cu filtrare opțională"""
    complaints = mock_complaints.copy()
    
    # Filtrează după categorie
    if category_id:
        complaints = [c for c in complaints if c.category_id == category_id]
    
    # Filtrează după status
    if status:
        complaints = [c for c in complaints if c.status == status]
    
    # Sortează după data submiterii (cele mai recente primul)
    complaints.sort(key=lambda x: x.submitted_at, reverse=True)
    
    # Paginație
    total_complaints = len(complaints)
    complaints = complaints[offset:offset + limit]
    
    return complaints

@app.get("/api/v1/complaints/stats")
async def get_complaints_stats():
    """Obține statistici despre sesizări"""
    total_complaints = len(mock_complaints)
    
    # Sesizări pe status
    status_counts = {}
    for complaint in mock_complaints:
        status_counts[complaint.status] = status_counts.get(complaint.status, 0) + 1
    
    # Sesizări pe categorie
    category_counts = {}
    for complaint in mock_complaints:
        category = next((cat for cat in mock_complaint_categories if cat.id == complaint.category_id), None)
        if category:
            category_counts[category.name] = category_counts.get(category.name, 0) + 1
    
    # Sesizări din ultima săptămână
    one_week_ago = datetime.now() - timedelta(days=7)
    recent_complaints = [
        c for c in mock_complaints 
        if datetime.fromisoformat(c.submitted_at) > one_week_ago
    ]
    
    # Timp mediu de rezolvare
    resolved_complaints = [c for c in mock_complaints if c.status == "resolved" and c.resolved_at]
    avg_resolution_days = 0
    if resolved_complaints:
        total_days = sum([
            (datetime.fromisoformat(c.resolved_at) - datetime.fromisoformat(c.submitted_at)).days
            for c in resolved_complaints
        ])
        avg_resolution_days = total_days / len(resolved_complaints)
    
    return {
        "total_complaints": total_complaints,
        "submitted_this_week": len(recent_complaints),
        "status_breakdown": status_counts,
        "category_breakdown": category_counts,
        "average_resolution_days": round(avg_resolution_days, 1),
        "pending_response": status_counts.get("submitted", 0),
        "in_progress": status_counts.get("in_progress", 0),
        "resolved_this_month": status_counts.get("resolved", 0)
    }

@app.get("/api/v1/complaints/reference/{reference_number}", response_model=Complaint)
async def get_complaint_by_reference(reference_number: str):
    """Obține o sesizare după numărul de referință"""
    complaint = next((c for c in mock_complaints if c.reference_number == reference_number), None)
    if not complaint:
        raise HTTPException(status_code=404, detail="Sesizarea cu acest număr de referință nu a fost găsită")
    return complaint

@app.get("/api/v1/complaints/{complaint_id}", response_model=Complaint)
async def get_complaint(complaint_id: str):
    """Obține o sesizare specifică după ID"""
    complaint = next((c for c in mock_complaints if c.id == complaint_id), None)
    if not complaint:
        raise HTTPException(status_code=404, detail="Sesizarea nu a fost găsită")
    return complaint

@app.post("/api/v1/complaints", response_model=Complaint)
async def create_complaint(complaint_data: ComplaintCreate):
    """Creează o sesizare nouă"""
    try:
        # Verifică dacă categoria există
        category = next((cat for cat in mock_complaint_categories if cat.id == complaint_data.category_id), None)
        if not category:
            raise HTTPException(status_code=400, detail="Categoria specificată nu există")
        
        # Verifică consimțământul GDPR
        if not complaint_data.consent_given:
            raise HTTPException(status_code=400, detail="Consimțământul pentru prelucrarea datelor este obligatoriu")
        
        # Creează sesizarea
        complaint_id = str(uuid.uuid4())
        reference_number = generate_reference_number()
        now = datetime.now()
        
        new_complaint = Complaint(
            id=complaint_id,
            category_id=complaint_data.category_id,
            title=complaint_data.title,
            description=complaint_data.description,
            citizen_name=complaint_data.citizen_name if not complaint_data.is_anonymous else "Sesizare Anonimă",
            citizen_email=complaint_data.citizen_email if not complaint_data.is_anonymous else None,
            citizen_phone=complaint_data.citizen_phone if not complaint_data.is_anonymous else None,
            citizen_address=complaint_data.citizen_address if not complaint_data.is_anonymous else None,
            is_anonymous=complaint_data.is_anonymous,
            location_address=complaint_data.location_address,
            location_details=complaint_data.location_details,
            urgency_level=complaint_data.urgency_level,
            status="submitted",
            reference_number=reference_number,
            submitted_at=now.isoformat(),
            consent_given=complaint_data.consent_given
        )
        
        # Adaugă în lista mock
        mock_complaints.append(new_complaint)
        
        print(f"✅ Sesizare nouă creată: {reference_number}")
        print(f"   Categorie: {category.name}")
        print(f"   Titlu: {complaint_data.title}")
        print(f"   Solicitant: {complaint_data.citizen_name if not complaint_data.is_anonymous else 'Anonim'}")
        
        return new_complaint
        
    except Exception as e:
        print(f"❌ Eroare la crearea sesizării: {e}")
        raise HTTPException(status_code=500, detail="Eroare la crearea sesizării")

@app.put("/api/v1/complaints/{complaint_id}/status", response_model=Complaint)
async def update_complaint_status(
    complaint_id: str, 
    status_update: ComplaintStatusUpdate,
    user = Depends(get_current_user)
):
    """Actualizează statusul unei sesizări (doar pentru administratori)"""
    complaint = next((c for c in mock_complaints if c.id == complaint_id), None)
    if not complaint:
        raise HTTPException(status_code=404, detail="Sesizarea nu a fost găsită")
    
    # Validează statusul
    valid_statuses = ["submitted", "acknowledged", "in_progress", "resolved", "closed"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Status invalid")
    
    # Actualizează statusul
    old_status = complaint.status
    complaint.status = status_update.status
    
    now = datetime.now()
    
    # Actualizează timestamps bazat pe noul status
    if status_update.status == "acknowledged" and not complaint.acknowledged_at:
        complaint.acknowledged_at = now.isoformat()
    elif status_update.status == "in_progress" and not complaint.started_at:
        complaint.started_at = now.isoformat()
    elif status_update.status == "resolved" and not complaint.resolved_at:
        complaint.resolved_at = now.isoformat()
    
    # Adaugă notele administratorului
    if status_update.admin_notes:
        complaint.admin_notes = status_update.admin_notes
    
    print(f"✅ Status sesizare actualizat: {complaint.reference_number}")
    print(f"   De la: {old_status} -> La: {status_update.status}")
    print(f"   Admin: {user['email']}")
    
    return complaint

@app.post("/api/v1/complaints/{complaint_id}/photos")
async def upload_complaint_photos(
    complaint_id: str,
    files: List[UploadFile] = File(...),
    user = Depends(get_current_user)
):
    """Upload fotografii pentru o sesizare"""
    complaint = next((c for c in mock_complaints if c.id == complaint_id), None)
    if not complaint:
        raise HTTPException(status_code=404, detail="Sesizarea nu a fost găsită")
    
    uploaded_files = []
    
    try:
        for file in files:
            # Validează tipul fișierului
            if not file.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail=f"Fișierul {file.filename} nu este o imagine")
            
            # Generează nume unic pentru fișier
            file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
            filename = f"complaint_{complaint_id}_{uuid.uuid4().hex}.{file_extension}"
            file_path = uploads_dir / "complaints" / filename
            
            # Creează directorul dacă nu există
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Salvează fișierul
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            uploaded_files.append(f"/uploads/complaints/{filename}")
        
        # Actualizează sesizarea cu fotografiile
        if not complaint.attached_photos:
            complaint.attached_photos = []
        complaint.attached_photos.extend(uploaded_files)
        
        print(f"✅ {len(uploaded_files)} fotografii încărcate pentru sesizarea {complaint.reference_number}")
        
        return {
            "message": f"{len(uploaded_files)} fotografii încărcate cu succes",
            "uploaded_files": uploaded_files
        }
        
    except Exception as e:
        print(f"❌ Eroare la încărcarea fotografiilor: {e}")
        raise HTTPException(status_code=500, detail="Eroare la încărcarea fotografiilor")

# ========== GENERARE DOCUMENTE PDF ==========

@app.post("/api/v1/documents/generate/{submission_id}")
async def generate_document(submission_id: str, user = Depends(get_current_user)):
    """Generează documentul oficial pentru o cerere finalizată"""
    try:
        # Găsește cererea în mock data
        submission = next((s for s in mock_form_submissions if s.id == submission_id), None)
        if not submission:
            raise HTTPException(status_code=404, detail="Cererea nu a fost găsită")
        
        # Verifică statusul cererii
        if submission.status not in ['approved', 'completed']:
            raise HTTPException(status_code=400, detail="Documentul poate fi generat doar pentru cererile aprobate/finalizate")
        
        # Găsește tipul de formular
        form_type = next((ft for ft in mock_form_types if ft.id == submission.form_type_id), None)
        if not form_type:
            raise HTTPException(status_code=404, detail="Tipul de formular nu a fost găsit")
        
        # Obține configurația primăriei
        municipality_config = get_municipality_config()
        
        # Simulează generarea documentului (în producție va folosi utils/pdf_generator.py)
        from pathlib import Path
        import os
        
        # Creează directorul dacă nu există
        documents_dir = Path("uploads/documents")
        documents_dir.mkdir(parents=True, exist_ok=True)
        
        # Generează HTML mock pentru document
        document_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>{form_type.name}</title>
            <style>
                body {{ font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.6; }}
                .header {{ text-align: center; border-bottom: 3px solid #004990; padding-bottom: 20px; margin-bottom: 30px; }}
                .municipality-name {{ font-size: 18px; font-weight: bold; color: #004990; }}
                .document-title {{ font-size: 24px; font-weight: bold; text-transform: uppercase; margin: 30px 0; text-align: center; color: #004990; }}
                .reference-number {{ text-align: right; font-weight: bold; margin-bottom: 20px; }}
                .content {{ text-align: justify; margin: 20px 0; }}
                .signature-section {{ margin-top: 50px; text-align: right; }}
                .stamp-area {{ margin-top: 40px; text-align: center; border: 2px dashed #004990; padding: 30px; color: #666; }}
                .footer {{ margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="municipality-name">{municipality_config.official_name}</div>
                <div>{municipality_config.address}</div>
                <div>Tel: {municipality_config.contact_phone} | Email: {municipality_config.contact_email}</div>
            </div>
            
            <div class="reference-number">
                Nr. {submission.reference_number}<br>
                Data: {datetime.now().strftime('%d.%m.%Y')}
            </div>
            
            <div class="document-title">{form_type.name}</div>
            
            <div class="content">
                <h3>Solicitant:</h3>
                <p><strong>Nume:</strong> {submission.citizen_name}</p>
                <p><strong>Email:</strong> {submission.citizen_email or 'N/A'}</p>
                <p><strong>Telefon:</strong> {submission.citizen_phone or 'N/A'}</p>
                <p><strong>Adresa:</strong> {submission.citizen_address or 'N/A'}</p>
                
                <h3>Detalii cerere:</h3>
        """
        
        # Adaugă datele specifice formularului
        for key, value in submission.submission_data.items():
            if value:
                field_name = key.replace('_', ' ').title()
                document_html += f"<p><strong>{field_name}:</strong> {value}</p>"
        
        document_html += f"""
                
                <h3>Status cerere:</h3>
                <p><strong>Status:</strong> {submission.status.upper()}</p>
                <p><strong>Data submiterii:</strong> {submission.submitted_at[:10]}</p>
                
                <p style="margin-top: 30px;">Prin prezentul document se confirmă procesarea cererii cu numărul de referință <strong>{submission.reference_number}</strong>.</p>
                
                <p><strong>Observații:</strong> Documentul este generat automat și are valabilitate conform legislației în vigoare.</p>
            </div>
            
            <div class="signature-section">
                <div style="display: inline-block; text-align: center;">
                    <div style="margin-bottom: 50px;">PRIMAR</div>
                    <div style="border-top: 1px solid #000; padding-top: 5px; width: 200px;">
                        {municipality_config.mayor_name}
                    </div>
                </div>
            </div>
            
            <div class="stamp-area">
                [ȘTAMPILA PRIMĂRIEI]
            </div>
            
            <div class="footer">
                Document generat electronic în data {datetime.now().strftime('%d.%m.%Y')}<br>
                Verifică autenticitatea la: {municipality_config.website_url}/verificare/{submission.reference_number}
            </div>
        </body>
        </html>
        """
        
        # Salvează documentul
        filename = f"{submission.reference_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        file_path = documents_dir / filename
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(document_html)
        
        print(f"✅ Document generat pentru cererea {submission.reference_number}: {filename}")
        
        return {
            "message": "Document generat cu succes",
            "document_info": {
                "filename": filename,
                "reference_number": submission.reference_number,
                "form_type": form_type.name,
                "download_url": f"/api/v1/documents/download/{submission.reference_number}",
                "preview_url": f"/api/v1/documents/preview/{submission.reference_number}",
                "generated_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        print(f"❌ Eroare la generarea documentului: {e}")
        raise HTTPException(status_code=500, detail="Eroare la generarea documentului")

@app.get("/api/v1/documents/download/{reference_number}")
async def download_document(reference_number: str):
    """Descarcă documentul generat"""
    try:
        documents_dir = Path("uploads/documents")
        
        # Caută fișierul cu numărul de referință
        matching_files = list(documents_dir.glob(f"{reference_number}_*.html"))
        
        if not matching_files:
            raise HTTPException(status_code=404, detail="Documentul nu a fost găsit")
        
        # Ia cel mai recent fișier (ultimul generat)
        latest_file = max(matching_files, key=lambda x: x.stat().st_mtime)
        
        if not latest_file.exists():
            raise HTTPException(status_code=404, detail="Fișierul documentului nu a fost găsit")
        
        # Returnează fișierul
        from fastapi.responses import FileResponse
        return FileResponse(
            path=str(latest_file),
            filename=f"Document_Oficial_{reference_number}.html",
            media_type="text/html"
        )
        
    except Exception as e:
        print(f"❌ Eroare la descărcarea documentului: {e}")
        raise HTTPException(status_code=500, detail="Eroare la descărcarea documentului")

@app.get("/api/v1/documents/preview/{reference_number}")
async def preview_document(reference_number: str):
    """Previzualizează documentul generat (returnează HTML)"""
    try:
        documents_dir = Path("uploads/documents")
        
        # Caută fișierul cu numărul de referință
        matching_files = list(documents_dir.glob(f"{reference_number}_*.html"))
        
        if not matching_files:
            raise HTTPException(status_code=404, detail="Documentul nu a fost găsit")
        
        # Ia cel mai recent fișier
        latest_file = max(matching_files, key=lambda x: x.stat().st_mtime)
        
        if not latest_file.exists():
            raise HTTPException(status_code=404, detail="Fișierul documentului nu a fost găsit")
        
        # Citește și returnează conținutul HTML
        with open(latest_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        from fastapi.responses import HTMLResponse
        return HTMLResponse(content=html_content)
        
    except Exception as e:
        print(f"❌ Eroare la previzualizarea documentului: {e}")
        raise HTTPException(status_code=500, detail="Eroare la previzualizarea documentului")

@app.get("/api/v1/documents/status/{submission_id}")
async def get_document_status(submission_id: str):
    """Verifică dacă documentul a fost generat pentru o cerere"""
    try:
        # Găsește cererea
        submission = next((s for s in mock_form_submissions if s.id == submission_id), None)
        if not submission:
            raise HTTPException(status_code=404, detail="Cererea nu a fost găsită")
        
        documents_dir = Path("uploads/documents")
        
        # Caută documentul generat
        matching_files = list(documents_dir.glob(f"{submission.reference_number}_*.html"))
        
        if matching_files:
            latest_file = max(matching_files, key=lambda x: x.stat().st_mtime)
            file_stats = latest_file.stat()
            
            return {
                "document_exists": True,
                "reference_number": submission.reference_number,
                "filename": latest_file.name,
                "generated_at": datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                "file_size": file_stats.st_size,
                "download_url": f"/api/v1/documents/download/{submission.reference_number}",
                "preview_url": f"/api/v1/documents/preview/{submission.reference_number}"
            }
        else:
            return {
                "document_exists": False,
                "reference_number": submission.reference_number,
                "can_generate": submission.status in ['approved', 'completed'],
                "status": submission.status
            }
        
    except Exception as e:
        print(f"❌ Eroare la verificarea statusului documentului: {e}")
        raise HTTPException(status_code=500, detail="Eroare la verificarea statusului documentului")

@app.post("/api/v1/admin/login")
async def admin_login(email: str = Form(...), password: str = Form(...)):
    """Admin login endpoint for development"""
    # Simple demo authentication
    if email == "admin@primarie.ro" and password == "admin123":
        token = f"mock-token-{uuid.uuid4().hex}"
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": 1,
                "email": email,
                "full_name": "Administrator Primărie",
                "is_superuser": True,
                "is_active": True
            }
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/v1/admin/stats")
async def get_admin_stats(user = Depends(get_current_user)):
    """Get admin dashboard statistics"""
    import random
    return {
        "visitors_today": random.randint(1000, 2000),
        "page_views": random.randint(5000, 10000),
        "downloads": random.randint(50, 200),
        "active_announcements": len(mock_announcements),
        "total_pages": 15,
        "total_documents": random.randint(100, 500)
    }

# ========== PLĂȚI GHIȘEUL.RO - MOCK ENDPOINTS ==========

class TaxType(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    base_amount: float = 0.0
    is_annual: bool = True
    penalty_percentage: float = 0.01
    ghiseul_enabled: bool = True
    is_active: bool = True

class PaymentRequest(BaseModel):
    tax_type_code: str
    payer_name: str
    payer_cnp: Optional[str] = None
    payer_email: Optional[str] = None
    amount: float
    property_identifier: Optional[str] = None
    description: Optional[str] = None

class Payment(BaseModel):
    id: str
    payment_id: str
    reference_number: str
    tax_type_code: str
    payer_name: str
    amount: float
    penalty_amount: float = 0.0
    total_amount: float
    status: str = "pending"
    payment_method: str = "ghiseul_ro"
    created_at: str
    payment_date: Optional[str] = None
    ghiseul_redirect_url: Optional[str] = None

# Mock data pentru tipuri de taxe
mock_tax_types = [
    TaxType(
        id=1,
        code="IMP_CLADIRI",
        name="Impozit pe Clădiri",
        description="Impozitul anual pe clădirile aflate în proprietatea persoanelor fizice",
        base_amount=100.0,
        is_annual=True,
        penalty_percentage=0.01,
        ghiseul_enabled=True
    ),
    TaxType(
        id=2,
        code="IMP_TEREN",
        name="Impozit pe Teren",
        description="Impozitul anual pe terenurile aflate în proprietatea persoanelor fizice",
        base_amount=50.0,
        is_annual=True,
        penalty_percentage=0.01,
        ghiseul_enabled=True
    ),
    TaxType(
        id=3,
        code="TAX_GUNOI",
        name="Taxa pentru Salubrizare",
        description="Taxa anuală pentru serviciul de salubrizare și colectare deșeuri",
        base_amount=60.0,
        is_annual=True,
        penalty_percentage=0.01,
        ghiseul_enabled=True
    ),
    TaxType(
        id=4,
        code="TAX_AUTO",
        name="Taxa Auto",
        description="Taxa anuală pentru vehiculele înmatriculate",
        base_amount=150.0,
        is_annual=True,
        penalty_percentage=0.01,
        ghiseul_enabled=True
    ),
    TaxType(
        id=5,
        code="TAX_AUTORIZATIE",
        name="Taxa Autorizație de Construcție",
        description="Taxa pentru eliberarea autorizației de construcție",
        base_amount=200.0,
        is_annual=False,
        penalty_percentage=0.0,
        ghiseul_enabled=True
    ),
    TaxType(
        id=6,
        code="TAX_CERTIFICAT_URBANISM",
        name="Taxa Certificat de Urbanism",
        description="Taxa pentru eliberarea certificatului de urbanism",
        base_amount=50.0,
        is_annual=False,
        penalty_percentage=0.0,
        ghiseul_enabled=True
    )
]

# Mock storage pentru plăți
mock_payments = []

def generate_payment_reference():
    """Generează numărul de referință pentru plată"""
    return f"PAY-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

def calculate_penalty(base_amount: float, due_date: datetime, penalty_rate: float = 0.01) -> float:
    """Calculează penalizarea pentru întârziere"""
    if datetime.now().date() <= due_date.date():
        return 0.0
    
    months_overdue = ((datetime.now().year - due_date.year) * 12 + 
                     (datetime.now().month - due_date.month))
    
    if months_overdue <= 0:
        return 0.0
    
    penalty = base_amount * penalty_rate * months_overdue
    max_penalty = base_amount * 0.5
    return min(penalty, max_penalty)

# ========== API ENDPOINTS PENTRU PLĂȚI ==========

@app.get("/api/v1/payments/tax-types", response_model=List[TaxType])
async def get_tax_types():
    """Obține toate tipurile de taxe disponibile"""
    return [tax for tax in mock_tax_types if tax.is_active]

@app.get("/api/v1/payments/tax-types/{tax_code}", response_model=TaxType)
async def get_tax_type_by_code(tax_code: str):
    """Obține un tip de taxă după cod"""
    tax_type = next((tax for tax in mock_tax_types if tax.code == tax_code.upper()), None)
    if not tax_type:
        raise HTTPException(status_code=404, detail="Tipul de taxă nu a fost găsit")
    return tax_type

@app.post("/api/v1/payments/calculate")
async def calculate_tax(tax_code: str, taxable_value: float, year: int = datetime.now().year):
    """Calculează suma pentru o taxă"""
    tax_type = next((tax for tax in mock_tax_types if tax.code == tax_code.upper()), None)
    if not tax_type:
        raise HTTPException(status_code=404, detail="Tipul de taxă nu a fost găsit")
    
    # Calculări specifice pe tip de taxă
    if tax_code.upper() == "IMP_CLADIRI":
        # Pentru clădiri: valoarea proprietății * 0.1%
        calculated_amount = taxable_value * 0.001
    elif tax_code.upper() == "IMP_TEREN":
        # Pentru teren: suprafața * 10 lei/mp * 0.3%
        calculated_amount = taxable_value * 10 * 0.003
    elif tax_code.upper() == "TAX_AUTO":
        # Pentru auto: bazat pe cilindreea
        if taxable_value <= 1200:
            calculated_amount = 29.0
        elif taxable_value <= 2000:
            calculated_amount = 75.0
        elif taxable_value <= 3000:
            calculated_amount = 224.0
        else:
            calculated_amount = 483.0
    else:
        # Utilizează suma de bază
        calculated_amount = tax_type.base_amount
    
    # Calculează penalizarea (pentru taxele anuale)
    penalty_amount = 0.0
    if tax_type.is_annual:
        due_date = datetime(year, 3, 31)  # 31 martie
        penalty_amount = calculate_penalty(calculated_amount, due_date, tax_type.penalty_percentage)
    
    total_amount = calculated_amount + penalty_amount
    
    return {
        "tax_type_code": tax_type.code,
        "tax_type_name": tax_type.name,
        "taxable_value": taxable_value,
        "calculated_amount": calculated_amount,
        "penalty_amount": penalty_amount,
        "total_amount": total_amount,
        "due_date": f"{year}-03-31" if tax_type.is_annual else None,
        "is_overdue": penalty_amount > 0
    }

@app.post("/api/v1/payments/create", response_model=Payment)
async def create_payment(payment_data: PaymentRequest):
    """Creează o plată nouă"""
    tax_type = next((tax for tax in mock_tax_types if tax.code == payment_data.tax_type_code.upper()), None)
    if not tax_type:
        raise HTTPException(status_code=404, detail="Tipul de taxă nu a fost găsit")
    
    # Generează ID-urile
    payment_id = str(uuid.uuid4())
    reference_number = generate_payment_reference()
    
    # Calculează penalizarea dacă este cazul
    penalty_amount = 0.0
    if tax_type.is_annual:
        due_date = datetime(datetime.now().year, 3, 31)
        penalty_amount = calculate_penalty(payment_data.amount, due_date, tax_type.penalty_percentage)
    
    total_amount = payment_data.amount + penalty_amount
    
    # Creează plata
    payment = Payment(
        id=payment_id,
        payment_id=payment_id,
        reference_number=reference_number,
        tax_type_code=tax_type.code,
        payer_name=payment_data.payer_name,
        amount=payment_data.amount,
        penalty_amount=penalty_amount,
        total_amount=total_amount,
        status="pending",
        payment_method="ghiseul_ro",
        created_at=datetime.now().isoformat()
    )
    
    mock_payments.append(payment)
    
    print(f"✅ Plată creată: {reference_number}")
    print(f"   Tip taxă: {tax_type.name}")
    print(f"   Plătitor: {payment_data.payer_name}")
    print(f"   Sumă: {total_amount} lei")
    
    return payment

@app.post("/api/v1/payments/{payment_id}/initiate-ghiseul")
async def initiate_ghiseul_payment(payment_id: str):
    """Inițiază plata prin Ghișeul.ro"""
    payment = next((p for p in mock_payments if p.payment_id == payment_id), None)
    if not payment:
        raise HTTPException(status_code=404, detail="Plata nu a fost găsită")
    
    if payment.status != "pending":
        raise HTTPException(status_code=400, detail="Plata nu poate fi inițiată")
    
    # Simulează răspunsul Ghișeul.ro
    session_id = str(uuid.uuid4())
    redirect_url = f"http://localhost:3000/payments/mock-ghiseul?session_id={session_id}&payment_id={payment_id}&amount={payment.total_amount}"
    
    # Actualizează plata
    payment.status = "processing"
    payment.ghiseul_redirect_url = redirect_url
    
    print(f"✅ Plată inițiată către Ghișeul.ro: {payment.reference_number}")
    print(f"   URL redirect: {redirect_url}")
    
    return {
        "success": True,
        "session_id": session_id,
        "redirect_url": redirect_url,
        "payment_id": payment_id,
        "reference_number": payment.reference_number
    }

@app.get("/api/v1/payments", response_model=List[Payment])
async def get_payments(
    status: Optional[str] = None,
    tax_type_code: Optional[str] = None,
    limit: int = 20
):
    """Obține lista plăților"""
    payments = mock_payments.copy()
    
    if status:
        payments = [p for p in payments if p.status == status]
    if tax_type_code:
        payments = [p for p in payments if p.tax_type_code == tax_type_code.upper()]
    
    # Sortează după data creării (cele mai recente primul)
    payments.sort(key=lambda x: x.created_at, reverse=True)
    
    return payments[:limit]

@app.get("/api/v1/payments/{payment_id}", response_model=Payment)
async def get_payment(payment_id: str):
    """Obține o plată specifică"""
    payment = next((p for p in mock_payments if p.payment_id == payment_id), None)
    if not payment:
        raise HTTPException(status_code=404, detail="Plata nu a fost găsită")
    return payment

@app.get("/api/v1/payments/reference/{reference_number}", response_model=Payment)
async def get_payment_by_reference(reference_number: str):
    """Obține o plată după numărul de referință"""
    payment = next((p for p in mock_payments if p.reference_number == reference_number), None)
    if not payment:
        raise HTTPException(status_code=404, detail="Plata nu a fost găsită")
    return payment

@app.post("/api/v1/payments/{payment_id}/simulate-success")
async def simulate_payment_success(payment_id: str):
    """Simulează succesul unei plăți (pentru dezvoltare)"""
    payment = next((p for p in mock_payments if p.payment_id == payment_id), None)
    if not payment:
        raise HTTPException(status_code=404, detail="Plata nu a fost găsită")
    
    payment.status = "completed"
    payment.payment_date = datetime.now().isoformat()
    
    print(f"✅ Plată simulată ca finalizată: {payment.reference_number}")
    
    return {
        "status": "success",
        "message": "Plata a fost marcată ca finalizată",
        "payment": payment
    }

@app.get("/api/v1/payments/stats")
async def get_payment_stats():
    """Obține statistici despre plăți"""
    total_payments = len(mock_payments)
    total_amount = sum([p.total_amount for p in mock_payments])
    
    completed_payments = [p for p in mock_payments if p.status == "completed"]
    completed_amount = sum([p.total_amount for p in completed_payments])
    
    pending_payments = [p for p in mock_payments if p.status == "pending"]
    pending_amount = sum([p.total_amount for p in pending_payments])
    
    return {
        "total_payments": total_payments,
        "total_amount": total_amount,
        "completed_payments": len(completed_payments),
        "completed_amount": completed_amount,
        "pending_payments": len(pending_payments),
        "pending_amount": pending_amount,
        "collection_rate": (completed_amount / total_amount * 100) if total_amount > 0 else 0
    }

# ========== SISTEM PROGRAMĂRI ONLINE ==========

class AppointmentService(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    duration_minutes: int = 30
    max_daily_appointments: int = 10
    advance_booking_days: int = 14
    department: str = "Secretariat"
    requires_documents: bool = False
    required_documents: Optional[List[str]] = None
    is_active: bool = True

class AppointmentSlot(BaseModel):
    id: int
    service_id: int
    date: str
    time: str
    is_available: bool = True
    max_appointments: int = 1
    current_appointments: int = 0

class Appointment(BaseModel):
    id: str
    appointment_number: str
    service_id: int
    citizen_name: str
    citizen_email: Optional[str] = None
    citizen_phone: str
    citizen_cnp: Optional[str] = None
    appointment_date: str
    appointment_time: str
    status: str = "scheduled"  # scheduled, confirmed, completed, cancelled, no_show
    purpose: Optional[str] = None
    additional_notes: Optional[str] = None
    created_at: str
    confirmed_at: Optional[str] = None
    cancelled_at: Optional[str] = None
    reminder_sent: bool = False
    consent_given: bool = True

class AppointmentCreate(BaseModel):
    service_id: int
    citizen_name: str
    citizen_email: Optional[str] = None
    citizen_phone: str
    citizen_cnp: Optional[str] = None
    appointment_date: str
    appointment_time: str
    purpose: Optional[str] = None
    additional_notes: Optional[str] = None
    consent_given: bool = True

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    admin_notes: Optional[str] = None

# Mock data pentru servicii de programări
mock_appointment_services = [
    AppointmentService(
        id=1,
        name="Întâlnire cu Primarul",
        slug="intalnire-primar",
        description="Audiență publică cu domnul primar pentru discutarea problemelor comunității",
        duration_minutes=30,
        max_daily_appointments=6,
        advance_booking_days=21,
        department="Cabinet Primar",
        requires_documents=False,
        required_documents=["Carte de identitate"]
    ),
    AppointmentService(
        id=2,
        name="Consiliere Urbanism",
        slug="consiliere-urbanism",
        description="Consultații pentru proiecte de construcție și autorizații de urbanism",
        duration_minutes=45,
        max_daily_appointments=8,
        advance_booking_days=14,
        department="Compartiment Urbanism",
        requires_documents=True,
        required_documents=[
            "Carte de identitate",
            "Certificat de proprietate",
            "Planuri de situație (dacă este cazul)"
        ]
    ),
    AppointmentService(
        id=3,
        name="Taxe și Impozite",
        slug="taxe-impozite",
        description="Informații despre taxele locale, plata ratelor și recuperarea restanțelor",
        duration_minutes=20,
        max_daily_appointments=12,
        advance_booking_days=7,
        department="Compartiment Financiar",
        requires_documents=False,
        required_documents=["Carte de identitate"]
    ),
    AppointmentService(
        id=4,
        name="Stare Civilă",
        slug="stare-civila",
        description="Eliberare certificate de naștere, căsătorie, deces și alte acte de stare civilă",
        duration_minutes=15,
        max_daily_appointments=15,
        advance_booking_days=3,
        department="Serviciul Stare Civilă",
        requires_documents=True,
        required_documents=[
            "Carte de identitate",
            "Documentele solicitate specific serviciului"
        ]
    ),
    AppointmentService(
        id=5,
        name="Asistență Socială",
        slug="asistenta-sociala",
        description="Consultări pentru ajutoare sociale, pensii și beneficii pentru persoane defavorizate",
        duration_minutes=30,
        max_daily_appointments=10,
        advance_booking_days=10,
        department="Compartiment Asistență Socială",
        requires_documents=True,
        required_documents=[
            "Carte de identitate",
            "Declarație de venituri",
            "Adeverințe medicale (dacă este cazul)"
        ]
    ),
    AppointmentService(
        id=6,
        name="Registru Agricol",
        slug="registru-agricol",
        description="Înscrierea în registrul agricol și probleme legate de activitățile agricole",
        duration_minutes=25,
        max_daily_appointments=8,
        advance_booking_days=5,
        department="Compartiment Agricol",
        requires_documents=True,
        required_documents=[
            "Carte de identitate",
            "Acte de proprietate asupra terenurilor"
        ]
    )
]

# Mock storage pentru programări
mock_appointments = []

def generate_appointment_number():
    """Generează numărul de programare"""
    return f"PROG-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

def get_available_time_slots(service_id: int, date_str: str):
    """Generează slot-urile de timp disponibile pentru o zi"""
    service = next((s for s in mock_appointment_services if s.id == service_id), None)
    if not service:
        return []
    
    # Program de lucru: 8:00 - 16:00, cu pauză 12:00 - 13:00
    available_hours = []
    
    # Dimineața: 8:00 - 12:00
    for hour in range(8, 12):
        available_hours.extend([f"{hour:02d}:00", f"{hour:02d}:30"])
    
    # După-amiaza: 13:00 - 16:00
    for hour in range(13, 16):
        available_hours.extend([f"{hour:02d}:00", f"{hour:02d}:30"])
    
    # Verifică programările existente pentru acea zi
    existing_appointments = [
        app for app in mock_appointments 
        if app.appointment_date == date_str 
        and app.service_id == service_id 
        and app.status not in ['cancelled', 'no_show']
    ]
    
    occupied_times = [app.appointment_time for app in existing_appointments]
    
    # Returnează doar slot-urile libere
    available_slots = []
    for time_slot in available_hours:
        if time_slot not in occupied_times:
            available_slots.append({
                "time": time_slot,
                "is_available": True,
                "display_time": time_slot
            })
    
    return available_slots

def is_business_day(date_obj):
    """Verifică dacă ziua este zi lucrătoare"""
    return date_obj.weekday() < 5  # 0-4 sunt zile lucrătoare (Luni-Vineri)

def get_next_available_dates(service_id: int, days_ahead: int = 14):
    """Obține datele disponibile pentru programări"""
    service = next((s for s in mock_appointment_services if s.id == service_id), None)
    if not service:
        return []
    
    available_dates = []
    current_date = datetime.now().date()
    
    # Începe de mâine
    check_date = current_date + timedelta(days=1)
    
    days_added = 0
    max_days = min(days_ahead, service.advance_booking_days)
    
    while days_added < max_days:
        if is_business_day(check_date):
            # Verifică dacă sunt slot-uri disponibile în acea zi
            available_slots = get_available_time_slots(service_id, check_date.isoformat())
            
            if available_slots:
                available_dates.append({
                    "date": check_date.isoformat(),
                    "display_date": check_date.strftime('%d.%m.%Y'),
                    "day_name": check_date.strftime('%A'),
                    "available_slots": len(available_slots)
                })
                days_added += 1
        
        check_date += timedelta(days=1)
    
    return available_dates

# Generează programări mock pentru demonstrație
for i in range(8):
    service = random.choice(mock_appointment_services)
    appointment_date = (datetime.now() + timedelta(days=random.randint(1, 10))).date()
    
    if is_business_day(appointment_date):
        available_times = ["09:00", "10:30", "14:00", "15:30"]
        appointment_time = random.choice(available_times)
        
        appointment = Appointment(
            id=str(uuid.uuid4()),
            appointment_number=generate_appointment_number(),
            service_id=service.id,
            citizen_name=f"Cetățean {random.randint(1, 100)}",
            citizen_email=f"cetatean{random.randint(1, 100)}@email.com",
            citizen_phone=f"07{random.randint(10000000, 99999999)}",
            appointment_date=appointment_date.isoformat(),
            appointment_time=appointment_time,
            status=random.choice(["scheduled", "confirmed", "completed"]),
            purpose=f"Consultare pentru {service.name.lower()}",
            created_at=(datetime.now() - timedelta(days=random.randint(0, 5))).isoformat(),
            consent_given=True
        )
        
        mock_appointments.append(appointment)

# ========== API ENDPOINTS PENTRU PROGRAMĂRI ==========

@app.get("/api/v1/appointments/services", response_model=List[AppointmentService])
async def get_appointment_services():
    """Obține toate serviciile pentru care se pot face programări"""
    return [service for service in mock_appointment_services if service.is_active]

@app.get("/api/v1/appointments/services/{service_id}", response_model=AppointmentService)
async def get_appointment_service(service_id: int):
    """Obține informații despre un serviciu specific"""
    service = next((s for s in mock_appointment_services if s.id == service_id), None)
    if not service:
        raise HTTPException(status_code=404, detail="Serviciul nu a fost găsit")
    return service

@app.get("/api/v1/appointments/services/slug/{slug}", response_model=AppointmentService)
async def get_appointment_service_by_slug(slug: str):
    """Obține serviciu după slug"""
    service = next((s for s in mock_appointment_services if s.slug == slug), None)
    if not service:
        raise HTTPException(status_code=404, detail="Serviciul nu a fost găsit")
    return service

@app.get("/api/v1/appointments/available-dates/{service_id}")
async def get_available_dates(service_id: int, days_ahead: int = 14):
    """Obține datele disponibile pentru programări"""
    service = next((s for s in mock_appointment_services if s.id == service_id), None)
    if not service:
        raise HTTPException(status_code=404, detail="Serviciul nu a fost găsit")
    
    available_dates = get_next_available_dates(service_id, days_ahead)
    
    return {
        "service_id": service_id,
        "service_name": service.name,
        "available_dates": available_dates,
        "advance_booking_days": service.advance_booking_days,
        "duration_minutes": service.duration_minutes
    }

@app.get("/api/v1/appointments/available-slots/{service_id}")
async def get_available_time_slots_endpoint(service_id: int, date: str):
    """Obține slot-urile de timp disponibile pentru o zi specifică"""
    try:
        # Validează data
        appointment_date = datetime.strptime(date, '%Y-%m-%d').date()
        
        # Verifică dacă data nu este în trecut
        if appointment_date <= datetime.now().date():
            raise HTTPException(status_code=400, detail="Nu se pot face programări pentru ziua curentă sau trecută")
        
        # Verifică dacă este zi lucrătoare
        if not is_business_day(appointment_date):
            raise HTTPException(status_code=400, detail="Programările se fac doar în zilele lucrătoare")
        
        service = next((s for s in mock_appointment_services if s.id == service_id), None)
        if not service:
            raise HTTPException(status_code=404, detail="Serviciul nu a fost găsit")
        
        # Verifică dacă data este în intervalul permis
        max_date = datetime.now().date() + timedelta(days=service.advance_booking_days)
        if appointment_date > max_date:
            raise HTTPException(status_code=400, detail=f"Programările se pot face cu maxim {service.advance_booking_days} zile în avans")
        
        available_slots = get_available_time_slots(service_id, date)
        
        return {
            "service_id": service_id,
            "date": date,
            "day_name": appointment_date.strftime('%A'),
            "available_slots": available_slots,
            "total_slots": len(available_slots)
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Format de dată invalid. Utilizați YYYY-MM-DD")

@app.post("/api/v1/appointments", response_model=Appointment)
async def create_appointment(appointment_data: AppointmentCreate):
    """Creează o programare nouă"""
    try:
        # Validările serviciului
        service = next((s for s in mock_appointment_services if s.id == appointment_data.service_id), None)
        if not service:
            raise HTTPException(status_code=400, detail="Serviciul specificat nu există")
        
        # Validează consimțământul GDPR
        if not appointment_data.consent_given:
            raise HTTPException(status_code=400, detail="Consimțământul pentru prelucrarea datelor este obligatoriu")
        
        # Validează data și ora
        appointment_date = datetime.strptime(appointment_data.appointment_date, '%Y-%m-%d').date()
        
        if appointment_date <= datetime.now().date():
            raise HTTPException(status_code=400, detail="Nu se pot face programări pentru ziua curentă sau trecută")
        
        if not is_business_day(appointment_date):
            raise HTTPException(status_code=400, detail="Programările se fac doar în zilele lucrătoare")
        
        # Verifică disponibilitatea slot-ului
        available_slots = get_available_time_slots(appointment_data.service_id, appointment_data.appointment_date)
        available_times = [slot["time"] for slot in available_slots]
        
        if appointment_data.appointment_time not in available_times:
            raise HTTPException(status_code=400, detail="Slot-ul de timp solicitat nu este disponibil")
        
        # Creează programarea
        appointment_id = str(uuid.uuid4())
        appointment_number = generate_appointment_number()
        now = datetime.now()
        
        new_appointment = Appointment(
            id=appointment_id,
            appointment_number=appointment_number,
            service_id=appointment_data.service_id,
            citizen_name=appointment_data.citizen_name,
            citizen_email=appointment_data.citizen_email,
            citizen_phone=appointment_data.citizen_phone,
            citizen_cnp=appointment_data.citizen_cnp,
            appointment_date=appointment_data.appointment_date,
            appointment_time=appointment_data.appointment_time,
            status="scheduled",
            purpose=appointment_data.purpose,
            additional_notes=appointment_data.additional_notes,
            created_at=now.isoformat(),
            consent_given=appointment_data.consent_given
        )
        
        # Adaugă în lista mock
        mock_appointments.append(new_appointment)
        
        print(f"✅ Programare nouă creată: {appointment_number}")
        print(f"   Serviciu: {service.name}")
        print(f"   Cetățean: {appointment_data.citizen_name}")
        print(f"   Data: {appointment_data.appointment_date} la {appointment_data.appointment_time}")
        
        return new_appointment
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Format de dată invalid. Utilizați YYYY-MM-DD")
    except Exception as e:
        print(f"❌ Eroare la crearea programării: {e}")
        raise HTTPException(status_code=500, detail="Eroare la crearea programării")

@app.get("/api/v1/appointments", response_model=List[Appointment])
async def get_appointments(
    service_id: Optional[int] = None,
    status: Optional[str] = None,
    date: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    """Obține lista programărilor cu filtrare opțională"""
    appointments = mock_appointments.copy()
    
    # Filtrează după serviciu
    if service_id:
        appointments = [a for a in appointments if a.service_id == service_id]
    
    # Filtrează după status
    if status:
        appointments = [a for a in appointments if a.status == status]
    
    # Filtrează după dată
    if date:
        appointments = [a for a in appointments if a.appointment_date == date]
    
    # Sortează după data programării (cele mai apropiate primul)
    appointments.sort(key=lambda x: (x.appointment_date, x.appointment_time))
    
    # Paginație
    total = len(appointments)
    appointments = appointments[offset:offset + limit]
    
    return appointments

@app.get("/api/v1/appointments/{appointment_id}", response_model=Appointment)
async def get_appointment(appointment_id: str):
    """Obține o programare specifică"""
    appointment = next((a for a in mock_appointments if a.id == appointment_id), None)
    if not appointment:
        raise HTTPException(status_code=404, detail="Programarea nu a fost găsită")
    return appointment

@app.get("/api/v1/appointments/number/{appointment_number}", response_model=Appointment)
async def get_appointment_by_number(appointment_number: str):
    """Obține o programare după numărul de programare"""
    appointment = next((a for a in mock_appointments if a.appointment_number == appointment_number), None)
    if not appointment:
        raise HTTPException(status_code=404, detail="Programarea cu acest număr nu a fost găsită")
    return appointment

@app.put("/api/v1/appointments/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: str,
    update_data: AppointmentUpdate,
    user = Depends(get_current_user)
):
    """Actualizează statusul unei programări (pentru administratori)"""
    appointment = next((a for a in mock_appointments if a.id == appointment_id), None)
    if not appointment:
        raise HTTPException(status_code=404, detail="Programarea nu a fost găsită")
    
    if update_data.status:
        valid_statuses = ["scheduled", "confirmed", "completed", "cancelled", "no_show"]
        if update_data.status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Status invalid")
        
        old_status = appointment.status
        appointment.status = update_data.status
        
        # Actualizează timestamps
        now = datetime.now()
        if update_data.status == "confirmed" and not appointment.confirmed_at:
            appointment.confirmed_at = now.isoformat()
        elif update_data.status == "cancelled":
            appointment.cancelled_at = now.isoformat()
        
        print(f"✅ Status programare actualizat: {appointment.appointment_number}")
        print(f"   De la: {old_status} -> La: {update_data.status}")
        print(f"   Admin: {user['email']}")
    
    if update_data.admin_notes:
        appointment.admin_notes = update_data.admin_notes
    
    return appointment

@app.delete("/api/v1/appointments/{appointment_id}")
async def cancel_appointment(appointment_id: str, reason: str = ""):
    """Anulează o programare"""
    appointment = next((a for a in mock_appointments if a.id == appointment_id), None)
    if not appointment:
        raise HTTPException(status_code=404, detail="Programarea nu a fost găsită")
    
    if appointment.status in ["completed", "no_show"]:
        raise HTTPException(status_code=400, detail="Programarea nu poate fi anulată")
    
    appointment.status = "cancelled"
    appointment.cancelled_at = datetime.now().isoformat()
    if reason:
        appointment.additional_notes = f"Motiv anulare: {reason}"
    
    print(f"✅ Programare anulată: {appointment.appointment_number}")
    print(f"   Motiv: {reason or 'Nespecificat'}")
    
    return {"message": "Programarea a fost anulată cu succes"}

@app.get("/api/v1/appointments/stats")
async def get_appointments_stats():
    """Obține statistici despre programări"""
    total_appointments = len(mock_appointments)
    
    # Programări pe status
    status_counts = {}
    for appointment in mock_appointments:
        status_counts[appointment.status] = status_counts.get(appointment.status, 0) + 1
    
    # Programări pe serviciu
    service_counts = {}
    for appointment in mock_appointments:
        service = next((s for s in mock_appointment_services if s.id == appointment.service_id), None)
        if service:
            service_counts[service.name] = service_counts.get(service.name, 0) + 1
    
    # Programări din săptămâna aceasta
    week_start = datetime.now().date() - timedelta(days=datetime.now().weekday())
    week_appointments = [
        a for a in mock_appointments 
        if datetime.strptime(a.appointment_date, '%Y-%m-%d').date() >= week_start
    ]
    
    # Programări de azi
    today_appointments = [
        a for a in mock_appointments 
        if a.appointment_date == datetime.now().date().isoformat()
    ]
    
    return {
        "total_appointments": total_appointments,
        "appointments_this_week": len(week_appointments),
        "appointments_today": len(today_appointments),
        "status_breakdown": status_counts,
        "service_breakdown": service_counts,
        "scheduled_appointments": status_counts.get("scheduled", 0),
        "confirmed_appointments": status_counts.get("confirmed", 0),
        "completed_appointments": status_counts.get("completed", 0)
    }

# ========== SISTEM CĂUTARE ÎN SITE ==========

class SearchResultItem(BaseModel):
    id: str
    content_type: str  # 'service', 'page', 'document', 'announcement'
    title: str
    url: str
    excerpt: Optional[str] = None
    category: Optional[str] = None
    priority: int = 0
    last_modified: Optional[str] = None

class SearchResultsResponse(BaseModel):
    query: str
    results: List[SearchResultItem]
    total: int
    suggestions: Optional[List[str]] = None

# Mock data pentru căutare
mock_search_data = [
    SearchResultItem(
        id="1",
        content_type="service",
        title="Programări Online",
        url="/programari-online",
        excerpt="Programează-te online pentru serviciile primăriei. Evită cozile și alege ora care ți se potrivește.",
        category="Servicii Digitale",
        priority=10
    ),
    SearchResultItem(
        id="2", 
        content_type="service",
        title="Sesizări Cetățene",
        url="/servicii-publice/sesizari/formular",
        excerpt="Trimite o sesizare online către primărie. Monitorizează statusul și primește răspunsuri.",
        category="Servicii Digitale",
        priority=9
    ),
    SearchResultItem(
        id="3",
        content_type="service", 
        title="Plăți Online",
        url="/plati-online",
        excerpt="Plătește taxele locale online cu cardul. Rapid, sigur și convenabil.",
        category="Servicii Financiare",
        priority=8
    ),
    SearchResultItem(
        id="4",
        content_type="service",
        title="Formulare Administrative",
        url="/servicii-publice/formulare", 
        excerpt="Completează online formularele pentru certificate, autorizații și alte acte.",
        category="Servicii Administrative",
        priority=7
    ),
    SearchResultItem(
        id="5",
        content_type="service",
        title="Verificare Sesizări",
        url="/servicii-publice/cautare-sesizare",
        excerpt="Verifică statusul unei sesizări folosind numărul de referință.",
        category="Servicii Digitale",
        priority=6
    ),
    SearchResultItem(
        id="6",
        content_type="service",
        title="Verificare Programări", 
        url="/verificare-programare",
        excerpt="Verifică statusul unei programări folosind numărul de programare.",
        category="Servicii Digitale",
        priority=5
    ),
    SearchResultItem(
        id="7",
        content_type="page",
        title="Despre Primărie - Organizare",
        url="/despre-primarie/organizare",
        excerpt="Structura organizatorică a primăriei, compartimente și atribuții.",
        category="Informații Instituționale",
        priority=4
    ),
    SearchResultItem(
        id="8",
        content_type="page",
        title="Transparență Decizională",
        url="/transparenta-decizionala", 
        excerpt="Proiecte de hotărâri, ședințe ale consiliului local și proces decizional transparent.",
        category="Transparență",
        priority=3
    ),
    SearchResultItem(
        id="9",
        content_type="page",
        title="Buget și Execuție Bugetară",
        url="/informatii-interes-public/buget",
        excerpt="Bugetul local, execuția bugetară și rapoarte financiare.", 
        category="Informații Financiare",
        priority=2
    ),
    SearchResultItem(
        id="10",
        content_type="page",
        title="Contact și Program",
        url="/contact",
        excerpt="Date de contact, program de funcționare și localizare.",
        category="Contact",
        priority=1
    )
]

def normalize_romanian_text(text: str) -> str:
    """Normalizează textul românesc pentru căutare"""
    replacements = {
        'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
        'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T'
    }
    for romanian, ascii_char in replacements.items():
        text = text.replace(romanian, ascii_char)
    return text.lower().strip()

def calculate_search_relevance(item: SearchResultItem, query: str) -> int:
    """Calculează relevanța unui rezultat pentru query"""
    normalized_query = normalize_romanian_text(query)
    normalized_title = normalize_romanian_text(item.title)
    normalized_excerpt = normalize_romanian_text(item.excerpt or "")
    normalized_category = normalize_romanian_text(item.category or "")
    
    score = 0
    
    # Titlul exact
    if normalized_title == normalized_query:
        score += 100
        
    # Titlul începe cu query
    elif normalized_title.startswith(normalized_query):
        score += 80
        
    # Titlul conține query
    elif normalized_query in normalized_title:
        score += 60
        
    # Categoria conține query
    if normalized_query in normalized_category:
        score += 40
        
    # Descrierea conține query
    if normalized_query in normalized_excerpt:
        score += 20
        
    # Bonus pentru servicii (mai relevante)
    if item.content_type == "service":
        score += 10
        
    # Bonus pentru prioritate
    score += item.priority
    
    # Bonus pentru cuvinte cheie importante
    important_keywords = ['programare', 'sesizare', 'plata', 'formular', 'verificare', 'taxe', 'impozite']
    for keyword in important_keywords:
        if keyword in normalized_query:
            if keyword in normalized_title or keyword in normalized_excerpt:
                score += 15
    
    return score

@app.get("/api/v1/search", response_model=SearchResultsResponse)
async def search_site(q: str = "", limit: int = 20):
    """Căutare în conținutul site-ului"""
    if not q.strip():
        return SearchResultsResponse(
            query=q,
            results=[],
            total=0,
            suggestions=[]
        )
    
    # Filtrează și sortează rezultatele
    scored_results = []
    for item in mock_search_data:
        score = calculate_search_relevance(item, q)
        if score > 0:  # Doar rezultatele relevante
            scored_results.append((score, item))
    
    # Sortează după scor descrescător
    scored_results.sort(key=lambda x: x[0], reverse=True)
    
    # Limitează rezultatele
    final_results = [item for score, item in scored_results[:limit]]
    
    # Generează sugestii simple
    suggestions = []
    if len(final_results) < 3:
        popular_searches = [
            "programari online", "plati taxe", "sesizari", 
            "formulare", "contact", "buget", "transparenta"
        ]
        suggestions = [s for s in popular_searches if q.lower() not in s.lower()][:3]
    
    print(f"🔍 Căutare efectuată: '{q}' - {len(final_results)} rezultate")
    
    return SearchResultsResponse(
        query=q,
        results=final_results,
        total=len(final_results),
        suggestions=suggestions
    )

@app.get("/api/v1/search/suggestions")
async def get_search_suggestions(q: str = ""):
    """Obține sugestii pentru căutare"""
    if len(q) < 2:
        return {"suggestions": []}
    
    suggestions = []
    normalized_query = normalize_romanian_text(q)
    
    for item in mock_search_data:
        normalized_title = normalize_romanian_text(item.title)
        if normalized_title.startswith(normalized_query):
            suggestions.append(item.title)
        elif normalized_query in normalized_title:
            suggestions.append(item.title)
    
    # Elimină duplicatele și limitează
    suggestions = list(dict.fromkeys(suggestions))[:5]
    
    return {"suggestions": suggestions}

@app.get("/api/v1/search/popular")
async def get_popular_searches():
    """Obține căutările populare"""
    popular = [
        "programari online",
        "plati taxe locale", 
        "sesizari cetatori",
        "formulare administrative",
        "contact primarie",
        "buget local",
        "anunturi oficiale",
        "transparenta decizionala"
    ]
    
    return {"popular_searches": popular}

# ==============================================
# SISTEM AUTENTIFICARE SI ADMINISTRARE
# ==============================================

# Importuri pentru autentificare
from datetime import datetime, timedelta
from typing import Union
import hashlib
import hmac
import secrets

# Mock users pentru dezvoltare
mock_admin_users = [
    {
        "id": "admin-001",
        "email": "admin@primarie.ro",
        "password_hash": hashlib.sha256("admin123".encode()).hexdigest(),
        "full_name": "Administrator Primărie",
        "role": "admin",
        "is_active": True,
        "is_superuser": False,
        "permissions": [
            "complaints.read", "complaints.update", "complaints.delete",
            "appointments.read", "appointments.update", "appointments.delete",
            "documents.read", "documents.update",
            "reports.read", "users.read"
        ],
        "department": "Secretariat General",
        "created_at": "2024-01-01T10:00:00Z",
        "last_login": None
    },
    {
        "id": "superadmin-001", 
        "email": "superadmin@primarie.ro",
        "password_hash": hashlib.sha256("super123".encode()).hexdigest(),
        "full_name": "Super Administrator",
        "role": "superadmin",
        "is_active": True,
        "is_superuser": True,
        "permissions": [
            "complaints.*", "appointments.*", "documents.*", "reports.*",
            "users.*", "config.*", "site.*", "system.*"
        ],
        "department": "IT & Administrare",
        "created_at": "2024-01-01T09:00:00Z",
        "last_login": None
    }
]

# Modele pentru autentificare
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
    expires_in: int = 3600

class AdminUser(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    is_superuser: bool
    permissions: List[str]
    department: str
    created_at: str
    last_login: Optional[str] = None

class AdminStats(BaseModel):
    total_complaints: int
    pending_complaints: int
    total_appointments: int
    today_appointments: int
    total_users: int
    system_uptime: str

# Helper functions pentru autentificare
def create_access_token(user_data: dict) -> str:
    """Creează un token JWT simplu pentru dezvoltare"""
    payload = {
        "user_id": user_data["id"],
        "email": user_data["email"],
        "role": user_data["role"],
        "exp": (datetime.utcnow() + timedelta(hours=1)).timestamp()
    }
    return f"dev-token-{user_data['id']}-{int(payload['exp'])}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifică parola"""
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def get_user_by_email(email: str) -> Optional[dict]:
    """Găsește utilizatorul după email"""
    for user in mock_admin_users:
        if user["email"] == email:
            return user
    return None

def authenticate_user(email: str, password: str) -> Union[dict, None]:
    """Autentifică utilizatorul"""
    user = get_user_by_email(email)
    if not user or not user["is_active"]:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user

# Endpoint-uri autentificare
@app.post("/api/v1/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Login pentru administratori"""
    user = authenticate_user(request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Email sau parolă incorectă"
        )
    
    # Update last login
    user["last_login"] = datetime.utcnow().isoformat()
    
    # Creează token
    access_token = create_access_token(user)
    
    # Prepare user data pentru frontend
    user_data = {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "is_superuser": user["is_superuser"],
        "permissions": user["permissions"],
        "department": user["department"]
    }
    
    return LoginResponse(
        access_token=access_token,
        user=user_data,
        expires_in=3600
    )

@app.get("/api/v1/auth/me", response_model=AdminUser)
async def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    """Obține datele utilizatorului curent"""
    user = get_user_by_email(current_user["email"])
    if not user:
        raise HTTPException(status_code=404, detail="Utilizator nu a fost găsit")
    
    return AdminUser(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        is_active=user["is_active"],
        is_superuser=user["is_superuser"],
        permissions=user["permissions"],
        department=user["department"],
        created_at=user["created_at"],
        last_login=user.get("last_login")
    )

@app.post("/api/v1/auth/logout")
async def logout():
    """Logout - în dezvoltare doar returnează success"""
    return {"message": "Deconectare reușită"}

# Dashboard Statistics
@app.get("/api/v1/admin/stats", response_model=AdminStats)
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    """Statistici pentru dashboard admin"""
    
    # Calculează statistici
    total_complaints = len(mock_complaints)
    pending_complaints = len([c for c in mock_complaints if c.status in ['submitted', 'acknowledged']])
    
    total_appointments = len(mock_appointments)
    today_appointments = len([a for a in mock_appointments if a.scheduled_date.date() == datetime.now().date()])
    
    return AdminStats(
        total_complaints=total_complaints,
        pending_complaints=pending_complaints,
        total_appointments=total_appointments,
        today_appointments=today_appointments,
        total_users=len(mock_admin_users),
        system_uptime="99.9%"
    )

# User Management (doar pentru super admin)
@app.get("/api/v1/admin/users")
async def get_admin_users(current_user: dict = Depends(get_current_user)):
    """Lista utilizatorilor admin"""
    user = get_user_by_email(current_user["email"])
    if not user or not user["is_superuser"]:
        raise HTTPException(status_code=403, detail="Acces interzis")
    
    return [
        {
            "id": u["id"],
            "email": u["email"], 
            "full_name": u["full_name"],
            "role": u["role"],
            "is_active": u["is_active"],
            "department": u["department"],
            "created_at": u["created_at"],
            "last_login": u.get("last_login")
        }
        for u in mock_admin_users
    ]

# Site Configuration (doar pentru super admin)
@app.get("/api/v1/admin/site-config")
async def get_site_config(current_user: dict = Depends(get_current_user)):
    """Configurări site (doar super admin)"""
    user = get_user_by_email(current_user["email"])
    if not user or not user["is_superuser"]:
        raise HTTPException(status_code=403, detail="Acces interzis")
    
    return {
        "municipality": {
            "name": os.getenv("MUNICIPALITY_NAME", "Primăria Exemplu"),
            "official_name": os.getenv("MUNICIPALITY_OFFICIAL_NAME", "Comuna Exemplu"),
            "mayor_name": os.getenv("MAYOR_NAME", "Ion Popescu"),
            "contact_email": os.getenv("CONTACT_EMAIL", "contact@primarie.ro"),
            "contact_phone": os.getenv("CONTACT_PHONE", "0256 123 456"),
            "logo_url": os.getenv("LOGO_URL", "/logo-primarie.png")
        },
        "theme": {
            "primary_color": "#1976d2",
            "secondary_color": "#dc004e",
            "header_background": "#1976d2"
        },
        "features": {
            "complaints_enabled": True,
            "appointments_enabled": True,
            "payments_enabled": True,
            "documents_enabled": True,
            "search_enabled": True
        }
    }

@app.put("/api/v1/admin/site-config")
async def update_site_config(config: dict, current_user: dict = Depends(get_current_user)):
    """Actualizează configurările site (doar super admin)"""
    user = get_user_by_email(current_user["email"])
    if not user or not user["is_superuser"]:
        raise HTTPException(status_code=403, detail="Acces interzis")
    
    # În producție aici s-ar actualiza baza de date / fișierele de config
    return {"message": "Configurări actualizate cu succes", "config": config}

# ============================================================================
# ENDPOINTS PENTRU MANAGEMENT SESIZĂRI ADMIN
# ============================================================================

@app.get("/api/v1/admin/complaints")
async def get_admin_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user = Depends(get_current_admin_user)
):
    """Obține lista sesizărilor pentru admin"""
    
    # Mock data pentru sesizări
    mock_complaints = [
        {
            "id": "1",
            "title": "Groapă în carosabil pe Strada Libertatii",
            "description": "Există o groapă mare pe strada Libertății, nr. 25, care poate provoca accidente. Solicit repararea urgentă.",
            "category": "Infrastructură",
            "status": "nou",
            "priority": "high",
            "citizen_name": "Maria Popescu",
            "citizen_email": "maria.popescu@email.com",
            "citizen_phone": "0721234567",
            "location": "Strada Libertății, nr. 25",
            "created_at": "2024-03-20T10:30:00Z",
            "updated_at": "2024-03-20T10:30:00Z",
            "attachments": ["groapa_strada.jpg"]
        },
        {
            "id": "2",
            "title": "Iluminat public defect",
            "description": "Stâlpul de iluminat de pe strada Victoriei este defect de 2 săptămâni.",
            "category": "Utilități publice",
            "status": "in_progress",
            "priority": "medium",
            "citizen_name": "Ion Gheorghe",
            "citizen_email": "ion.gheorghe@email.com",
            "citizen_phone": "0732123456",
            "location": "Strada Victoriei, nr. 15",
            "created_at": "2024-03-18T14:20:00Z",
            "updated_at": "2024-03-19T09:15:00Z",
            "assigned_to": "Echipa Utilități",
            "response": "Am contactat echipa tehnică pentru verificare."
        },
        {
            "id": "3",
            "title": "Gunoi menajer necolectat",
            "description": "Gunoiul nu a fost colectat de 3 zile pe strada Pacii.",
            "category": "Salubritate",
            "status": "resolved",
            "priority": "medium",
            "citizen_name": "Ana Dumitrescu",
            "citizen_email": "ana.dumitrescu@email.com",
            "citizen_phone": "0743234567",
            "location": "Strada Păcii, nr. 42",
            "created_at": "2024-03-15T16:45:00Z",
            "updated_at": "2024-03-17T11:30:00Z",
            "assigned_to": "Serviciul de Salubritate",
            "response": "Problema a fost rezolvată. Gunoiul a fost colectat."
        },
        {
            "id": "4",
            "title": "Câini vagabonzi în parc",
            "description": "În parcul central sunt mai mulți câini vagabonzi care pot fi periculoși pentru copii.",
            "category": "Mediu",
            "status": "nou",
            "priority": "medium",
            "citizen_name": "Mihai Stoica",
            "citizen_email": "mihai.stoica@email.com",
            "citizen_phone": "0754345678",
            "location": "Parcul Central",
            "created_at": "2024-03-19T09:15:00Z",
            "updated_at": "2024-03-19T09:15:00Z"
        },
        {
            "id": "5",
            "title": "Semaforul de la intersecția Mihai Viteazu nu funcționează",
            "description": "De 2 zile semaforul nu funcționează, creând blocaj în trafic.",
            "category": "Infrastructură",
            "status": "in_progress",
            "priority": "high",
            "citizen_name": "Radu Marinescu",
            "citizen_email": "radu.marinescu@email.com",
            "citizen_phone": "0765432109",
            "location": "Intersecția Mihai Viteazu - Unirii",
            "created_at": "2024-03-21T08:15:00Z",
            "updated_at": "2024-03-21T10:30:00Z",
            "assigned_to": "Echipa Tehnică Trafic"
        }
    ]
    
    # Filtrare
    filtered_complaints = mock_complaints
    if status and status != "toate":
        filtered_complaints = [c for c in filtered_complaints if c["status"] == status]
    if category and category != "toate":
        filtered_complaints = [c for c in filtered_complaints if c["category"] == category]
    
    # Paginare
    total = len(filtered_complaints)
    start_idx = (page - 1) * size
    end_idx = start_idx + size
    paginated_complaints = filtered_complaints[start_idx:end_idx]
    
    return {
        "complaints": paginated_complaints,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": (total + size - 1) // size
    }

@app.get("/api/v1/admin/complaints/{complaint_id}")
async def get_complaint_details(
    complaint_id: str,
    current_user = Depends(get_current_admin_user)
):
    """Obține detaliile unei sesizări"""
    
    # Mock data - în realitate s-ar căuta în baza de date
    mock_complaint = {
        "id": complaint_id,
        "title": "Groapă în carosabil pe Strada Libertatii",
        "description": "Există o groapă mare pe strada Libertății, nr. 25, care poate provoca accidente. Solicit repararea urgentă.",
        "category": "Infrastructură",
        "status": "nou",
        "priority": "high",
        "citizen_name": "Maria Popescu",
        "citizen_email": "maria.popescu@email.com",
        "citizen_phone": "0721234567",
        "location": "Strada Libertății, nr. 25",
        "created_at": "2024-03-20T10:30:00Z",
        "updated_at": "2024-03-20T10:30:00Z",
        "attachments": ["groapa_strada.jpg"],
        "history": [
            {
                "date": "2024-03-20T10:30:00Z",
                "action": "Sesizare creată",
                "user": "Sistem",
                "details": "Sesizarea a fost înregistrată în sistem"
            }
        ]
    }
    
    return mock_complaint

@app.put("/api/v1/admin/complaints/{complaint_id}")
async def update_complaint(
    complaint_id: str,
    request: dict,
    current_user = Depends(get_current_admin_user)
):
    """Actualizează o sesizare"""
    
    # În realitate s-ar actualiza în baza de date
    updated_fields = request
    
    # Mock response
    return {
        "message": "Sesizarea a fost actualizată cu succes",
        "complaint_id": complaint_id,
        "updated_fields": updated_fields,
        "updated_by": current_user["full_name"],
        "updated_at": datetime.now().isoformat()
    }

@app.post("/api/v1/admin/complaints/{complaint_id}/assign")
async def assign_complaint(
    complaint_id: str,
    request: dict,
    current_user = Depends(get_current_admin_user)
):
    """Atribuie o sesizare unei echipe/persoane"""
    
    assigned_to = request.get("assigned_to")
    
    # În realitate s-ar actualiza în baza de date
    return {
        "message": "Sesizarea a fost atribuită cu succes",
        "complaint_id": complaint_id,
        "assigned_to": assigned_to,
        "assigned_by": current_user["full_name"],
        "assigned_at": datetime.now().isoformat()
    }

@app.post("/api/v1/admin/complaints/{complaint_id}/respond")
async def respond_to_complaint(
    complaint_id: str,
    request: dict,
    current_user = Depends(get_current_admin_user)
):
    """Adaugă un răspuns oficial la o sesizare"""
    
    response_text = request.get("response")
    
    # În realitate s-ar salva în baza de date
    return {
        "message": "Răspunsul a fost adăugat cu succes",
        "complaint_id": complaint_id,
        "response": response_text,
        "responded_by": current_user["full_name"],
        "responded_at": datetime.now().isoformat()
    }

@app.get("/api/v1/admin/complaints/stats")
async def get_complaints_stats(
    current_user = Depends(get_current_admin_user)
):
    """Obține statistici despre sesizări pentru dashboard"""
    
    return {
        "total_complaints": 25,
        "new_complaints": 8,
        "in_progress_complaints": 12,
        "resolved_complaints": 15,
        "closed_complaints": 3,
        "high_priority_complaints": 5,
        "average_resolution_time_hours": 48,
        "complaints_by_category": {
            "Infrastructură": 8,
            "Utilități publice": 6,
            "Salubritate": 5,
            "Mediu": 4,
            "Transport": 2
        },
        "complaints_this_month": 12,
        "complaints_last_month": 18,
        "satisfaction_rate": 87.5
    }

# ============================================================================
# ENDPOINTS PENTRU MANAGEMENT PROGRAMĂRI ADMIN
# ============================================================================

@app.get("/api/v1/admin/appointments")
async def get_admin_appointments(
    status: Optional[str] = None,
    department: Optional[str] = None,
    date: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user = Depends(get_current_admin_user)
):
    """Obține lista programărilor pentru admin"""
    
    # Mock data pentru programări
    mock_appointments = [
        {
            "id": "1",
            "citizen_name": "Maria Popescu",
            "citizen_email": "maria.popescu@email.com",
            "citizen_phone": "0721234567",
            "department": "Urbanism",
            "service": "Certificat de urbanism",
            "appointment_date": "2024-03-25",
            "appointment_time": "10:00",
            "status": "confirmed",
            "notes": "Documentație completă",
            "created_at": "2024-03-20T14:30:00Z",
            "updated_at": "2024-03-21T09:15:00Z"
        },
        {
            "id": "2", 
            "citizen_name": "Ion Gheorghe",
            "citizen_email": "ion.gheorghe@email.com",
            "citizen_phone": "0732123456",
            "department": "Taxe și Impozite",
            "service": "Consultanță taxe locale",
            "appointment_date": "2024-03-26",
            "appointment_time": "14:30",
            "status": "pending",
            "notes": "Prima programare",
            "created_at": "2024-03-21T16:20:00Z",
            "updated_at": "2024-03-21T16:20:00Z"
        },
        {
            "id": "3",
            "citizen_name": "Ana Dumitrescu", 
            "citizen_email": "ana.dumitrescu@email.com",
            "citizen_phone": "0743234567",
            "department": "Stare Civilă",
            "service": "Certificat de naștere",
            "appointment_date": "2024-03-27",
            "appointment_time": "09:30",
            "status": "completed",
            "notes": "Certificat eliberat cu succes",
            "created_at": "2024-03-19T11:45:00Z",
            "updated_at": "2024-03-22T10:30:00Z"
        },
        {
            "id": "4",
            "citizen_name": "Mihai Stoica",
            "citizen_email": "mihai.stoica@email.com", 
            "citizen_phone": "0754345678",
            "department": "Juridic",
            "service": "Consultanță juridică",
            "appointment_date": "2024-03-28",
            "appointment_time": "11:00",
            "status": "cancelled",
            "notes": "Anulată de cetățean",
            "created_at": "2024-03-20T09:20:00Z",
            "updated_at": "2024-03-23T15:45:00Z"
        },
        {
            "id": "5",
            "citizen_name": "Elena Marin",
            "citizen_email": "elena.marin@email.com",
            "citizen_phone": "0765432109", 
            "department": "Asistență Socială",
            "service": "Ajutor social",
            "appointment_date": "2024-03-29",
            "appointment_time": "13:00",
            "status": "confirmed",
            "notes": "Documentație în verificare",
            "created_at": "2024-03-22T12:10:00Z",
            "updated_at": "2024-03-22T12:10:00Z"
        }
    ]
    
    # Filtrare
    filtered_appointments = mock_appointments
    if status and status != "toate":
        filtered_appointments = [a for a in filtered_appointments if a["status"] == status]
    if department and department != "toate":
        filtered_appointments = [a for a in filtered_appointments if a["department"] == department]
    if date:
        filtered_appointments = [a for a in filtered_appointments if a["appointment_date"] == date]
    
    # Paginare
    total = len(filtered_appointments)
    start_idx = (page - 1) * size
    end_idx = start_idx + size
    paginated_appointments = filtered_appointments[start_idx:end_idx]
    
    return {
        "appointments": paginated_appointments,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": (total + size - 1) // size
    }

@app.get("/api/v1/admin/appointments/{appointment_id}")
async def get_appointment_details(
    appointment_id: str,
    current_user = Depends(get_current_admin_user)
):
    """Obține detaliile unei programări"""
    
    # Mock data
    mock_appointment = {
        "id": appointment_id,
        "citizen_name": "Maria Popescu",
        "citizen_email": "maria.popescu@email.com",
        "citizen_phone": "0721234567",
        "citizen_address": "Strada Libertății nr. 25, Brașov",
        "department": "Urbanism",
        "service": "Certificat de urbanism",
        "appointment_date": "2024-03-25",
        "appointment_time": "10:00",
        "status": "confirmed",
        "notes": "Documentație completă",
        "required_documents": ["Certificat proprietate", "Plan cadastral", "Autorizație construire"],
        "submitted_documents": ["Certificat proprietate", "Plan cadastral"],
        "created_at": "2024-03-20T14:30:00Z",
        "updated_at": "2024-03-21T09:15:00Z",
        "assigned_officer": "Ing. Radu Ionescu",
        "history": [
            {
                "date": "2024-03-20T14:30:00Z",
                "action": "Programare creată",
                "user": "Sistem",
                "details": "Programarea a fost înregistrată în sistem"
            },
            {
                "date": "2024-03-21T09:15:00Z", 
                "action": "Status actualizat",
                "user": "Admin Maria",
                "details": "Status schimbat în confirmat"
            }
        ]
    }
    
    return mock_appointment

@app.put("/api/v1/admin/appointments/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    request: dict,
    current_user = Depends(get_current_admin_user)
):
    """Actualizează o programare"""
    
    updated_fields = request
    
    return {
        "message": "Programarea a fost actualizată cu succes",
        "appointment_id": appointment_id,
        "updated_fields": updated_fields,
        "updated_by": current_user["full_name"],
        "updated_at": datetime.now().isoformat()
    }

@app.post("/api/v1/admin/appointments/{appointment_id}/confirm")
async def confirm_appointment(
    appointment_id: str,
    request: dict,
    current_user = Depends(get_current_admin_user)
):
    """Confirmă o programare"""
    
    notes = request.get("notes", "")
    
    return {
        "message": "Programarea a fost confirmată cu succes",
        "appointment_id": appointment_id,
        "notes": notes,
        "confirmed_by": current_user["full_name"],
        "confirmed_at": datetime.now().isoformat()
    }

@app.post("/api/v1/admin/appointments/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: str,
    request: dict,
    current_user = Depends(get_current_admin_user)
):
    """Anulează o programare"""
    
    reason = request.get("reason", "")
    
    return {
        "message": "Programarea a fost anulată cu succes", 
        "appointment_id": appointment_id,
        "cancellation_reason": reason,
        "cancelled_by": current_user["full_name"],
        "cancelled_at": datetime.now().isoformat()
    }

@app.post("/api/v1/admin/appointments/{appointment_id}/complete")
async def complete_appointment(
    appointment_id: str,
    request: dict,
    current_user = Depends(get_current_admin_user)
):
    """Marchează o programare ca finalizată"""
    
    completion_notes = request.get("completion_notes", "")
    
    return {
        "message": "Programarea a fost marcată ca finalizată",
        "appointment_id": appointment_id,
        "completion_notes": completion_notes,
        "completed_by": current_user["full_name"],
        "completed_at": datetime.now().isoformat()
    }

@app.get("/api/v1/admin/appointments/stats")
async def get_appointments_stats(
    current_user = Depends(get_current_admin_user)
):
    """Obține statistici despre programări pentru dashboard"""
    
    return {
        "total_appointments": 42,
        "pending_appointments": 8,
        "confirmed_appointments": 15,
        "completed_appointments": 16,
        "cancelled_appointments": 3,
        "today_appointments": 6,
        "tomorrow_appointments": 4,
        "this_week_appointments": 18,
        "appointments_by_department": {
            "Urbanism": 12,
            "Taxe și Impozite": 8,
            "Stare Civilă": 10,
            "Juridic": 6,
            "Asistență Socială": 6
        },
        "appointments_by_status": {
            "pending": 8,
            "confirmed": 15,
            "completed": 16,
            "cancelled": 3
        },
        "average_waiting_time_days": 3.2,
        "completion_rate": 84.2,
        "no_show_rate": 5.8
    }

@app.get("/api/v1/admin/appointments/calendar")
async def get_appointments_calendar(
    year: int = Query(...),
    month: int = Query(...),
    current_user = Depends(get_current_admin_user)
):
    """Obține programările pentru calendar"""
    
    # Mock data pentru calendar
    calendar_data = {
        "2024-03-25": [
            {
                "id": "1",
                "time": "10:00",
                "citizen_name": "Maria Popescu",
                "department": "Urbanism",
                "service": "Certificat de urbanism",
                "status": "confirmed"
            },
            {
                "id": "6", 
                "time": "14:00",
                "citizen_name": "Gheorghe Ionescu",
                "department": "Taxe și Impozite",
                "service": "Plată taxe",
                "status": "pending"
            }
        ],
        "2024-03-26": [
            {
                "id": "2",
                "time": "14:30", 
                "citizen_name": "Ion Gheorghe",
                "department": "Taxe și Impozite",
                "service": "Consultanță taxe locale",
                "status": "pending"
            }
        ],
        "2024-03-27": [
            {
                "id": "3",
                "time": "09:30",
                "citizen_name": "Ana Dumitrescu",
                "department": "Stare Civilă", 
                "service": "Certificat de naștere",
                "status": "completed"
            }
        ]
    }
    
    return {
        "year": year,
        "month": month,
        "appointments": calendar_data
    }

# Serve static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)