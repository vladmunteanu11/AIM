-- Schema Baza de Date PostgreSQL pentru Template Primărie Digitală
-- Programul Național #DigiLocal

-- Extensii necesare
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- pentru căutare full-text îmbunătățită

-- ====================================================================
-- CONFIGURARE PRIMĂRIE & UTILIZATORI
-- ====================================================================

-- Configurarea generală a primăriei (o singură înregistrare per instalare)
CREATE TABLE municipality_config (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    official_name VARCHAR(255) NOT NULL, -- numele oficial complet
    county VARCHAR(100) NOT NULL,
    mayor_name VARCHAR(255),
    
    -- Identitate vizuală
    logo_url VARCHAR(500),
    coat_of_arms_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#004990', -- PANTONE 280C
    secondary_color VARCHAR(7) DEFAULT '#0079C1', -- PANTONE 300C
    
    -- Date de contact
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    fax VARCHAR(50),
    address TEXT NOT NULL,
    postal_code VARCHAR(10),
    website_url VARCHAR(255),
    
    -- Program functionare
    working_hours JSONB, -- {"monday": "08:00-16:00", "tuesday": "08:00-16:00", ...}
    audience_hours JSONB, -- program audiențe
    
    -- SEO & Analytics
    meta_description TEXT,
    google_analytics_id VARCHAR(50),
    
    -- Setări avansate
    timezone VARCHAR(50) DEFAULT 'Europe/Bucharest',
    language VARCHAR(5) DEFAULT 'ro',
    maintenance_mode BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Utilizatori admin (unul per primărie, dar extensibil pentru viitor)
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin', -- 'admin', 'editor', 'viewer'
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    
    -- Audit & securitate
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    password_changed_at TIMESTAMP DEFAULT NOW(),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sesiuni admin pentru securitate îmbunătățită
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ====================================================================
-- MANAGEMENT CONȚINUT STATIC
-- ====================================================================

-- Categorii pentru organizarea conținutului
CREATE TABLE content_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES content_categories(id),
    menu_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pagini statice (structură ierarhică pentru meniu)
CREATE TABLE pages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    
    -- Organizare
    category_id INTEGER REFERENCES content_categories(id),
    parent_id INTEGER REFERENCES pages(id),
    menu_order INTEGER DEFAULT 0,
    template VARCHAR(50) DEFAULT 'default', -- pentru layout-uri custom
    
    -- Stare și vizibilitate
    status VARCHAR(20) DEFAULT 'published', -- 'draft', 'published', 'archived'
    is_featured BOOLEAN DEFAULT FALSE,
    requires_auth BOOLEAN DEFAULT FALSE,
    
    -- SEO și accesibilitate
    featured_image VARCHAR(500),
    alt_text TEXT,
    
    -- Audit
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP
);

-- ====================================================================
-- ANUNȚURI ȘI EVENIMENTE
-- ====================================================================

-- Categorii anunțuri
CREATE TABLE announcement_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7), -- culoare pentru afișare
    icon VARCHAR(50), -- icon pentru UI
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Anunțuri și evenimente
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    
    -- Categorizare
    category_id INTEGER REFERENCES announcement_categories(id),
    tags TEXT[], -- array de tag-uri pentru filtrare
    
    -- Vizuale
    featured_image VARCHAR(500),
    gallery_images TEXT[], -- array cu URL-uri imagini
    
    -- Programare și vizibilitate
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'scheduled', 'archived'
    is_featured BOOLEAN DEFAULT FALSE,
    is_urgent BOOLEAN DEFAULT FALSE, -- pentru anunțuri urgente
    
    -- Programare publicare
    published_at TIMESTAMP,
    expires_at TIMESTAMP, -- pentru anunțuri cu durată limitată
    
    -- Evenimente specifice
    event_start_date TIMESTAMP,
    event_end_date TIMESTAMP,
    event_location TEXT,
    
    -- SEO
    meta_description TEXT,
    
    -- Statistici
    view_count INTEGER DEFAULT 0,
    
    -- Audit
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ====================================================================
-- MONITORUL OFICIAL LOCAL (MOL) - STRUCTURĂ OBLIGATORIE
-- ====================================================================

-- Categorii MOL conform legislației române
CREATE TABLE mol_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT FALSE, -- categorii obligatorii per lege
    section_order INTEGER,
    parent_id INTEGER REFERENCES mol_categories(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Popularea categoriilor MOL obligatorii
INSERT INTO mol_categories (name, slug, is_required, section_order) VALUES
('Statutul Unității Administrativ-Teritoriale', 'statutul-uat', TRUE, 1),
('Regulamentele privind procedurile administrative', 'regulamente-proceduri', TRUE, 2),
('Hotărârile autorității deliberative', 'hotarari-consiliul-local', TRUE, 3),
('Dispozițiile autorității executive', 'dispozitii-primar', TRUE, 4),
('Documente și informații financiare', 'documente-financiare', TRUE, 5),
('Alte documente', 'alte-documente', TRUE, 6);

-- Documente MOL
CREATE TABLE mol_documents (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES mol_categories(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    document_number VARCHAR(100), -- numărul actului
    description TEXT,
    content TEXT, -- conținutul textual pentru indexare
    
    -- Fișier atasat
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_type VARCHAR(20),
    file_size INTEGER,
    
    -- Date oficiale
    adoption_date DATE, -- data adoptării
    effective_date DATE, -- data intrării în vigoare
    published_date DATE NOT NULL,
    
    -- Stare
    status VARCHAR(20) DEFAULT 'published',
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ====================================================================
-- DOCUMENTE ȘI FIȘIERE
-- ====================================================================

-- Categorii documente pentru organizare
CREATE TABLE document_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES document_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Documente generale (diferite de MOL)
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Categorizare
    category_id INTEGER REFERENCES document_categories(id),
    tags TEXT[],
    
    -- Fișier
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    file_size INTEGER,
    
    -- Proprietăți
    is_public BOOLEAN DEFAULT TRUE,
    requires_auth BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    
    -- Metadata
    version VARCHAR(20) DEFAULT '1.0',
    language VARCHAR(5) DEFAULT 'ro',
    
    -- Audit
    uploaded_by UUID REFERENCES admin_users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ====================================================================
-- FORMULARE ONLINE ȘI SERVICII DIGITALE
-- ====================================================================

-- Tipuri de formulare disponibile
CREATE TABLE form_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    
    -- Structura formularului (JSON Schema)
    form_schema JSONB NOT NULL,
    validation_rules JSONB,
    
    -- Configurare
    is_active BOOLEAN DEFAULT TRUE,
    requires_auth BOOLEAN DEFAULT FALSE,
    max_submissions_per_day INTEGER,
    
    -- Documente necesare
    required_documents TEXT[],
    instructions TEXT,
    
    -- Email notificări
    notification_emails TEXT[],
    auto_reply_template TEXT,
    
    -- Workflow
    approval_required BOOLEAN DEFAULT FALSE,
    estimated_processing_days INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Submisii formulare de la cetățeni
CREATE TABLE form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_type_id INTEGER REFERENCES form_types(id) NOT NULL,
    
    -- Date solicitant
    citizen_name VARCHAR(255) NOT NULL,
    citizen_email VARCHAR(255),
    citizen_phone VARCHAR(50),
    citizen_cnp VARCHAR(13), -- pentru verificare identitate
    citizen_address TEXT,
    
    -- Datele formularului
    submission_data JSONB NOT NULL,
    attached_files TEXT[], -- array cu căi către fișiere
    
    -- Status și procesare
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_review', 'approved', 'rejected', 'completed'
    status_notes TEXT,
    
    -- Tracking
    reference_number VARCHAR(50) UNIQUE NOT NULL, -- număr unic pentru urmărire
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    
    -- Timestamps
    submitted_at TIMESTAMP DEFAULT NOW(),
    assigned_at TIMESTAMP,
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Procesare
    assigned_to UUID REFERENCES admin_users(id),
    processing_notes TEXT,
    
    -- GDPR
    consent_given BOOLEAN DEFAULT FALSE,
    data_retention_until DATE
);

-- ====================================================================
-- CĂUTARE ȘI INDEXARE
-- ====================================================================

-- Index pentru căutare full-text pe toate tipurile de conținut
CREATE TABLE search_index (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL, -- 'page', 'announcement', 'document', 'mol'
    content_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_text TEXT NOT NULL,
    url VARCHAR(500) NOT NULL,
    tags TEXT[],
    category VARCHAR(100),
    search_vector tsvector,
    last_indexed TIMESTAMP DEFAULT NOW()
);

-- ====================================================================
-- STATISTICI ȘI AUDIT
-- ====================================================================

-- Log-uri pentru acțiunile admin
CREATE TABLE admin_audit_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', etc.
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Statistici vizitatori (basic analytics)
CREATE TABLE page_views (
    id SERIAL PRIMARY KEY,
    page_url VARCHAR(500) NOT NULL,
    page_title VARCHAR(255),
    visitor_ip INET,
    user_agent TEXT,
    referrer VARCHAR(500),
    session_id VARCHAR(255),
    view_date DATE NOT NULL,
    view_time TIMESTAMP DEFAULT NOW()
);

-- Statistici download documente
CREATE TABLE document_downloads (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id),
    visitor_ip INET,
    user_agent TEXT,
    download_date DATE NOT NULL,
    download_time TIMESTAMP DEFAULT NOW()
);

-- ====================================================================
-- SISTEM DE NOTIFICĂRI
-- ====================================================================

-- Șabloane email pentru notificări
CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT,
    variables TEXT[], -- variabile disponibile în șablon
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Coada de email-uri de trimis
CREATE TABLE email_queue (
    id SERIAL PRIMARY KEY,
    to_email VARCHAR(255) NOT NULL,
    cc_emails TEXT[],
    bcc_emails TEXT[],
    subject VARCHAR(255) NOT NULL,
    body_text TEXT,
    body_html TEXT,
    attachments JSONB, -- array cu fișiere atașate
    
    -- Status trimitere
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    
    -- Timing
    send_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ====================================================================
-- INDEXURI PENTRU PERFORMANȚĂ
-- ====================================================================

-- Indexuri pentru căutare rapidă
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_pages_published_at ON pages(published_at);

CREATE INDEX idx_announcements_slug ON announcements(slug);
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);
CREATE INDEX idx_announcements_category ON announcements(category_id);

CREATE INDEX idx_mol_documents_category ON mol_documents(category_id);
CREATE INDEX idx_mol_documents_published_date ON mol_documents(published_date);

CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_submitted_at ON form_submissions(submitted_at);
CREATE INDEX idx_form_submissions_reference ON form_submissions(reference_number);

-- Index pentru căutare full-text
CREATE INDEX idx_search_vector ON search_index USING gin(search_vector);
CREATE INDEX idx_search_content_type ON search_index(content_type);

-- Indexuri pentru statistici
CREATE INDEX idx_page_views_date ON page_views(view_date);
CREATE INDEX idx_page_views_url ON page_views(page_url);

-- ====================================================================
-- FUNCȚII ȘI TRIGGERE
-- ====================================================================

-- Funcție pentru actualizarea timestamp-ului
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicarea trigger-ului pe toate tabelele cu updated_at
CREATE TRIGGER update_municipality_config_updated_at BEFORE UPDATE ON municipality_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mol_documents_updated_at BEFORE UPDATE ON mol_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funcție pentru generarea unui număr de referință unic
CREATE OR REPLACE FUNCTION generate_reference_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reference_number = 'REQ-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                          LPAD(nextval('form_submission_ref_seq')::text, 6, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Secvența pentru numerele de referință
CREATE SEQUENCE form_submission_ref_seq START 1;

-- Trigger pentru generarea automată a numărului de referință
CREATE TRIGGER generate_form_submission_reference BEFORE INSERT ON form_submissions
    FOR EACH ROW EXECUTE FUNCTION generate_reference_number();

-- Funcție pentru actualizarea indexului de căutare
CREATE OR REPLACE FUNCTION update_search_index()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizarea indexului când se modifică conținutul
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        DELETE FROM search_index 
        WHERE content_type = TG_ARGV[0] AND content_id = NEW.id;
        
        INSERT INTO search_index (content_type, content_id, title, content_text, url, search_vector)
        VALUES (
            TG_ARGV[0],
            NEW.id,
            COALESCE(NEW.title, ''),
            COALESCE(NEW.content, '') || ' ' || COALESCE(NEW.description, ''),
            TG_ARGV[1] || NEW.slug,
            to_tsvector('romanian', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''))
        );
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        DELETE FROM search_index 
        WHERE content_type = TG_ARGV[0] AND content_id = OLD.id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggere pentru actualizarea automată a indexului de căutare
CREATE TRIGGER update_pages_search_index AFTER INSERT OR UPDATE OR DELETE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_search_index('page', '/pagina/');

CREATE TRIGGER update_announcements_search_index AFTER INSERT OR UPDATE OR DELETE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_search_index('announcement', '/anunturi/');

-- ====================================================================
-- DATE INIȚIALE DE TEST
-- ====================================================================

-- Configurare inițială primărie (exemplu pentru testare)
INSERT INTO municipality_config (
    name, official_name, county, mayor_name,
    contact_email, contact_phone, address, postal_code,
    meta_description, working_hours, audience_hours
) VALUES (
    'Primăria Exemplu',
    'Comuna Exemplu, Județul Exemplu',
    'Exemplu',
    'Ion Popescu',
    'contact@primaria-exemplu.ro',
    '0256123456',
    'Strada Principală nr. 1, Comuna Exemplu',
    '123456',
    'Site oficial al Primăriei Exemplu - servicii digitale pentru cetățeni',
    '{"monday": "08:00-16:00", "tuesday": "08:00-16:00", "wednesday": "08:00-16:00", "thursday": "08:00-16:00", "friday": "08:00-14:00"}',
    '{"monday": "10:00-12:00", "wednesday": "14:00-16:00"}'
);

-- Utilizator admin inițial (parola: admin123)
INSERT INTO admin_users (
    email, hashed_password, full_name, is_superuser
) VALUES (
    'admin@primaria-exemplu.ro',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFIHQFhYQvP.SYG', -- admin123
    'Administrator Primărie',
    TRUE
);

-- Categorii de conținut inițiale
INSERT INTO content_categories (name, slug, description, menu_order) VALUES
('Despre Primărie', 'despre-primarie', 'Informații despre organizarea și conducerea primăriei', 1),
('Informații de Interes Public', 'informatii-interes-public', 'Informații obligatorii pentru transparență', 2),
('Transparență Decizională', 'transparenta-decizionala', 'Proiecte și procese decizionale', 3),
('Integritate Instituțională', 'integritate-institutionala', 'Măsuri și politici de integritate', 4),
('Servicii Publice', 'servicii-publice', 'Servicii oferite cetățenilor', 5),
('Comunitate', 'comunitate', 'Informații despre viața comunitară', 6);

-- Șabloane email inițiale
INSERT INTO email_templates (name, subject, body_text, variables) VALUES
('form_submission_confirmation', 
 'Confirmarea primirii cererii {{reference_number}}',
 'Bună ziua {{citizen_name}},

Vă confirmăm că am primit cererea dumneavoastră cu numărul de referință {{reference_number}}.

Cererea va fi procesată în maximum {{processing_days}} zile lucrătoare.

Vă mulțumim,
{{municipality_name}}',
 ARRAY['citizen_name', 'reference_number', 'processing_days', 'municipality_name']
),
('form_status_update',
 'Actualizare status cerere {{reference_number}}',
 'Bună ziua {{citizen_name}},

Statusul cererii dumneavoastră {{reference_number}} a fost actualizat la: {{new_status}}.

{{status_notes}}

Pentru întrebări, ne puteți contacta la {{contact_email}}.

Vă mulțumim,
{{municipality_name}}',
 ARRAY['citizen_name', 'reference_number', 'new_status', 'status_notes', 'contact_email', 'municipality_name']
);

-- Comentarii pentru documentație
COMMENT ON TABLE municipality_config IS 'Configurarea generală a primăriei - o singură înregistrare per instalare';
COMMENT ON TABLE admin_users IS 'Utilizatori cu acces administrativ la sistem';
COMMENT ON TABLE pages IS 'Pagini statice cu conținut editabil';
COMMENT ON TABLE announcements IS 'Anunțuri și evenimente publice';
COMMENT ON TABLE mol_documents IS 'Documente pentru Monitorul Oficial Local conform legislației';
COMMENT ON TABLE form_submissions IS 'Cererile depuse online de către cetățeni';
COMMENT ON TABLE search_index IS 'Index pentru căutarea rapidă în tot conținutul site-ului';

-- Verificarea integrității schemei
SELECT 'Schema de bază de date pentru Template Primărie Digitală a fost creată cu succes!' as message;