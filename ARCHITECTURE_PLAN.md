# Plan Arhitectural - Template Primărie Digitală
## Programul Național #DigiLocal

### Analiza Cerințelor Oficiale

#### Din Documentul PDF Oficial:
1. **Obligații de Conformitate:**
   - Legea 544/2001 (acces la informații de interes public)
   - HG 123/2002 și HG 830/2022 (norme metodologice)
   - Procedura MOL (Monitorul Oficial Local)
   - Legea 448/2006 (protecția persoanelor cu handicap)
   - GDPR (Legea 190/2018)
   - Accesibilitate web (OUG 112/2018)

2. **Structura Obligatorie de Navigare:**
   - Despre Primărie
   - Informații de Interes Public
   - Transparență Decizională
   - Integritate Instituțională
   - MOL (Monitorul Oficial Local)
   - Servicii Publice
   - Comunitate
   - Anunțuri
   - Contact

3. **Identitate Vizuală Standardizată:**
   - Culori: PANTONE 280C (principal), PANTONE 300C (secundar)
   - Font: Trebuchet MS (principal), Trajan PRO (pentru denumiri oficiale)
   - Structură responsivă desktop/mobile
   - Pictograme SVG din https://boxicons.com/

#### Din Analiza Site-ului Florești:
- Navigare ierarhică cu mega-menu
- Design modern, responsive
- Integrare servicii online
- Structură modulară adaptabilă

---

## Stack Tehnologic

### Fundamentale (OBLIGATORII)
- **Frontend:** React.js 18+ cu TypeScript
- **Backend:** Python cu FastAPI
- **Baza de Date:** PostgreSQL 15+ cu pgAdmin4

### Justificări Tehnice Adiționale

#### Frontend Ecosystem:
- **Framework UI:** Material-UI (MUI) v5 - compatibilitate cu cerințele de accesibilitate
- **State Management:** Redux Toolkit + RTK Query - management centralizat pentru aplicația complexă
- **Routing:** React Router v6 - navigare avansată pentru structura ierarhică
- **Build Tool:** Vite - dezvoltare rapidă și optimizări performanță
- **Styling:** Styled Components + CSS-in-JS - theming dinamic pentru personalizare

#### Backend Ecosystem:
- **ORM:** SQLAlchemy 2.0 - management complex al bazei de date cu relații
- **Migrări:** Alembic - versionarea schemei de date
- **Autentificare:** FastAPI-Users + JWT - sistem securizat pentru admin
- **Validare:** Pydantic v2 - validare robustă și documentare API
- **Task Queue:** Celery + Redis - procesare asincronă pentru rapoarte/backup
- **File Storage:** Local filesystem cu validare tip/dimensiune

#### DevOps & Deployment:
- **Containerizare:** Docker + Docker Compose
- **Reverse Proxy:** Nginx
- **Process Manager:** Gunicorn pentru production
- **Monitoring:** Prometheus + Grafana (opțional)
- **Backup:** PostgreSQL dump + file sync scripts

---

## Arhitectura Aplicației

### 1. Template pentru Primărie Unică
```
/municipality-template/
├── backend/           # FastAPI application
├── frontend/          # React application  
├── config/           # Configuration templates
├── deployment/       # Docker & deployment scripts
├── docs/            # Documentation
└── migrations/      # Database migrations
```

### 2. Configurare Modulară
```python
# config/municipality_config.py
class MunicipalityConfig:
    name: str
    logo_path: str
    colors: dict
    enabled_modules: list
    contact_info: dict
    custom_pages: list
```

### 3. Admin Panel Centralizat
- **Un singur admin per instalare**
- Dashboard cu statistici vizitatori/conținut
- CRUD complet pentru toate secțiunile
- Editor rich-text pentru conținut
- Upload manager pentru documente/imagini
- Configurare aspecte vizuale

---

## Schema Bazei de Date

### Entități Principale:

#### Configurare & Identitate
```sql
-- Configurarea primăriei
CREATE TABLE municipality_config (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin user
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);
```

#### Conținut & Management
```sql
-- Pagini statice configurabile
CREATE TABLE pages (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    meta_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    menu_order INTEGER,
    parent_id INTEGER REFERENCES pages(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Anunțuri și evenimente
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category VARCHAR(100),
    featured_image VARCHAR(500),
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Documente oficiale (MOL, etc.)
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(20),
    file_size INTEGER,
    category VARCHAR(100),
    is_public BOOLEAN DEFAULT TRUE,
    uploaded_at TIMESTAMP DEFAULT NOW()
);
```

#### MOL (Monitorul Oficial Local)
```sql
-- Structura obligatorie MOL
CREATE TABLE mol_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    is_required BOOLEAN DEFAULT FALSE -- categorii obligatorii per lege
);

CREATE TABLE mol_documents (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES mol_categories(id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    document_number VARCHAR(100),
    published_date DATE NOT NULL,
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Formulare & Servicii Online
```sql
-- Tipuri de formulare
CREATE TABLE form_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    form_schema JSONB, -- structura dinamică a formularului
    required_documents TEXT[]
);

-- Submisii formulare de la cetățeni
CREATE TABLE form_submissions (
    id SERIAL PRIMARY KEY,
    form_type_id INTEGER REFERENCES form_types(id),
    citizen_name VARCHAR(255) NOT NULL,
    citizen_email VARCHAR(255),
    citizen_phone VARCHAR(50),
    submission_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);
```

---

## Funcționalități Esențiale

### 1. Pentru Administrare
- **Dashboard administrativ** cu statistici în timp real
- **Editor WYSIWYG** pentru conținut cu upload imagini
- **Manager documente** cu organizare pe categorii
- **Configurator vizual** pentru aspecte (culori, logo, meniu)
- **Sistem notificări** pentru formulare noi
- **Backup/restore** automated pentru date și fișiere

### 2. Pentru Cetățeni
- **Căutare avansată** în toate secțiunile
- **Formulare online** pentru toate serviciile
- **Notificări email** pentru statusul cererilor
- **Feed RSS** pentru anunțuri noi
- **Versiune printabilă** pentru documente importante
- **Accesibilitate completă** (screen readers, navigare tastatură)

### 3. Extensibilitate
- **Plugin system** pentru module noi
- **API REST** documentat complet pentru integrări
- **Webhook support** pentru notificări externe
- **Multi-language ready** pentru zone multilingve
- **Custom fields** pentru tipuri de conținut
- **Theme customization** pentru aspecte avansate

---

## Cerințe de Performanță

### Frontend Optimization:
- **Code splitting** per rută pentru încărcare rapidă
- **Lazy loading** pentru imagini și componente
- **Service Worker** pentru caching și funcționare offline
- **Bundle size < 1MB** pentru încărcare rapidă pe conexiuni lente

### Backend Performance:
- **Database indexing** pentru căutări rapide
- **Query optimization** cu eager loading pentru relații
- **Response caching** pentru conținut static
- **Pagination** pentru liste mari de date
- **Background tasks** pentru operații grele

### Hosting Local Optimization:
- **Docker multi-stage builds** pentru imagini mici
- **Nginx compression** și static file serving
- **Database connection pooling**
- **Health checks** și restart policies

---

## Plan de Implementare

### Faza 1: Backend Foundation (Săptămâna 1-2)
1. Setup FastAPI cu structura de proiect
2. Configurare PostgreSQL și migrări Alembic
3. Implementare autentificare admin
4. CRUD pentru configurare primărie
5. API endpoints pentru managementul conținutului

### Faza 2: Core Content Management (Săptămâna 2-3)
1. Sistem de pagini dinamice
2. Management anunțuri cu categorii
3. Upload și organizare documente
4. Implementare structură MOL obligatorie
5. Sistem formulare configurabile

### Faza 3: Frontend Implementation (Săptămâna 3-4)
1. Setup React cu TypeScript și MUI
2. Implementare design system bazat pe PDF oficial
3. Navigare responsivă desktop/mobile
4. Pagini publice cu toate secțiunile obligatorii
5. Integrare căutare și filtrare

### Faza 4: Admin Panel (Săptămâna 4-5)
1. Dashboard administrativ cu statistici
2. Editor conținut WYSIWYG
3. Manager fișiere și imagini
4. Configurator aspecte vizuale
5. Sistem preview pentru modificări

### Faza 5: Advanced Features (Săptămâna 5-6)
1. Formulare online cu validare
2. Sistem notificări email
3. Optimizări performanță și SEO
4. Implementare cerințe accesibilitate
5. Testing și debugging complet

### Faza 6: Production Ready (Săptămâna 6)
1. Docker containerization
2. Deployment scripts și documentație
3. Backup și recovery procedures
4. Monitoring și health checks
5. Documentație de instalare pentru primării

---

## Considerații de Securitate

### GDPR Compliance:
- **Data minimization** - colectare doar date necesare
- **Right to be forgotten** - ștergere date la cerere
- **Data portability** - export date în format standard
- **Consent management** - tracking acorduri procesare

### Security Best Practices:
- **SQL injection protection** via ORM și validare
- **XSS prevention** cu sanitizare input/output
- **CSRF protection** cu tokeni securizați
- **Rate limiting** pentru API endpoints
- **File upload validation** strict pentru tip și dimensiune
- **Audit logging** pentru toate acțiunile admin

---

## Concluzie

Această arhitectură oferă o bază solidă pentru un template de primărie care:
- ✅ Respectă toate cerințele legale românești
- ✅ Implementează identitatea vizuală oficială
- ✅ Permite configurare rapidă pentru orice primărie
- ✅ Oferă extensibilitate pentru funcționalități viitoare
- ✅ Asigură performanțe optime pe hardware local
- ✅ Garantează securitate și compliance GDPR

Template-ul va fi livrat cu documentație completă și scripts de deployment pentru instalare facilă în infrastructura locală a primăriilor.