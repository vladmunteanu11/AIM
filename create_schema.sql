-- Database schema for Template Primărie Digitală
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_superuser BOOLEAN DEFAULT FALSE NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0 NOT NULL,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create admin sessions table (with JWT support)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    access_token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    access_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE NOT NULL
);

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create municipality config table
CREATE TABLE IF NOT EXISTS municipality_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    official_name VARCHAR(255) NOT NULL,
    county VARCHAR(255) NOT NULL,
    mayor_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_fax VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    working_hours JSONB,
    audience_schedule TEXT,
    primary_color VARCHAR(7) DEFAULT '#004990',
    secondary_color VARCHAR(7) DEFAULT '#0079C1',
    logo_url VARCHAR(255),
    favicon_url VARCHAR(255),
    hero_image_url VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    gdpr_enabled BOOLEAN DEFAULT TRUE,
    cookie_consent_required BOOLEAN DEFAULT TRUE,
    dpo_name VARCHAR(255),
    dpo_email VARCHAR(255),
    dpo_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    status VARCHAR(20) DEFAULT 'draft' NOT NULL,
    page_type VARCHAR(50) DEFAULT 'standard',
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    featured_image VARCHAR(255),
    order_index INTEGER DEFAULT 0,
    parent_id UUID REFERENCES pages(id) ON DELETE SET NULL,
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    status VARCHAR(20) DEFAULT 'draft' NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    category VARCHAR(100),
    tags JSONB,
    featured_image VARCHAR(255),
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    category VARCHAR(100),
    tags JSONB,
    is_public BOOLEAN DEFAULT TRUE,
    download_count INTEGER DEFAULT 0,
    uploaded_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create MOL (Monitorul Oficial Local) documents table
CREATE TABLE IF NOT EXISTS mol_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    document_number VARCHAR(100),
    document_type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT,
    file_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'published',
    published_date DATE,
    valid_from DATE,
    valid_until DATE,
    tags JSONB,
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create form types table
CREATE TABLE IF NOT EXISTS form_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    fields JSONB NOT NULL,
    validation_rules JSONB,
    email_template TEXT,
    auto_reply_enabled BOOLEAN DEFAULT FALSE,
    requires_appointment BOOLEAN DEFAULT FALSE,
    processing_time_days INTEGER,
    required_documents JSONB,
    fee_amount DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create form submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_type_id UUID NOT NULL REFERENCES form_types(id),
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    form_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'normal',
    citizen_name VARCHAR(255),
    citizen_email VARCHAR(255),
    citizen_phone VARCHAR(50),
    citizen_cnp VARCHAR(13),
    notes TEXT,
    internal_notes TEXT,
    assigned_to UUID REFERENCES admin_users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    response_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create search index table
CREATE TABLE IF NOT EXISTS search_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(50) NOT NULL,
    content_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    url VARCHAR(500),
    keywords JSONB,
    search_vector TSVECTOR,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create page views table for analytics
CREATE TABLE IF NOT EXISTS page_views (
    id SERIAL PRIMARY KEY,
    page_url VARCHAR(500) NOT NULL,
    page_title VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    referrer VARCHAR(500),
    session_id VARCHAR(100),
    view_date DATE NOT NULL,
    view_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
-- Admin tables indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_access_token ON admin_sessions(access_token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_refresh_token ON admin_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_audit_user_id ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_log(created_at);

-- Content indexes
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_parent_id ON pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_announcements_slug ON announcements(slug);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_public ON documents(is_public);
CREATE INDEX IF NOT EXISTS idx_mol_documents_category ON mol_documents(category);
CREATE INDEX IF NOT EXISTS idx_mol_documents_type ON mol_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_mol_documents_published_date ON mol_documents(published_date);

-- Forms indexes
CREATE INDEX IF NOT EXISTS idx_form_types_slug ON form_types(slug);
CREATE INDEX IF NOT EXISTS idx_form_types_active ON form_types(is_active);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_type ON form_submissions(form_type_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_reference ON form_submissions(reference_number);
CREATE INDEX IF NOT EXISTS idx_form_submissions_citizen_email ON form_submissions(citizen_email);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at);

-- Search and analytics indexes
CREATE INDEX IF NOT EXISTS idx_search_content_type ON search_index(content_type);
CREATE INDEX IF NOT EXISTS idx_search_public ON search_index(is_public);
CREATE INDEX IF NOT EXISTS idx_search_vector ON search_index USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(view_date);
CREATE INDEX IF NOT EXISTS idx_page_views_url ON page_views(page_url);

-- Create full-text search trigger for search_index
CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('romanian', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_vector_trigger
    BEFORE INSERT OR UPDATE ON search_index
    FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Insert default municipality configuration
INSERT INTO municipality_config 
(name, official_name, county, mayor_name, contact_email, contact_phone, address, website)
VALUES 
('Primăria Orașului Brașov', 'Orașul Brașov, Județul Brașov', 'Brașov', 
 'Maria Ionescu', 'contact@primaria-brasov.ro', '0256 123 456',
 'Strada Principală nr. 1, Brașov', 'https://primaria-brasov.ro')
ON CONFLICT DO NOTHING;