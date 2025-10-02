#!/usr/bin/env python3
"""
Database schema creation script for Template Primărie Digitală
Creates all tables with proper relations and constraints
"""
import asyncio
import asyncpg
import sys
import os
from datetime import datetime

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.config import get_settings

settings = get_settings()

async def create_database_schema():
    """Creates complete database schema for Template Primărie Digitală"""
    
    print("🏛️  Creating database schema for Template Primărie Digitală...")
    
    # Connect to database
    try:
        # Parse DATABASE_URL to get connection details
        db_url = settings.DATABASE_URL
        if db_url.startswith("postgresql+asyncpg://"):
            db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        
        conn = await asyncpg.connect(db_url)
        print("✅ Connected to PostgreSQL database")
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        print(f"DATABASE_URL: {settings.DATABASE_URL}")
        return False
    
    try:
        # Enable UUID extension
        await conn.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")
        print("✅ UUID extension enabled")
        
        # Create admin users table
        await conn.execute("""
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
            )
        """)
        print("✅ Created admin_users table")
        
        # Create admin sessions table (with JWT support)
        await conn.execute("""
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
            )
        """)
        print("✅ Created admin_sessions table")
        
        # Create admin audit log table
        await conn.execute("""
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
            )
        """)
        print("✅ Created admin_audit_log table")
        
        # Create municipality config table
        await conn.execute("""
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
            )
        """)
        print("✅ Created municipality_config table")
        
        # Create pages table
        await conn.execute("""
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
            )
        """)
        print("✅ Created pages table")
        
        # Create announcements table
        await conn.execute("""
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
            )
        """)
        print("✅ Created announcements table")
        
        # Create documents table
        await conn.execute("""
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
            )
        """)
        print("✅ Created documents table")
        
        # Create MOL (Monitorul Oficial Local) documents table
        await conn.execute("""
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
            )
        """)
        print("✅ Created mol_documents table")
        
        # Create form types table
        await conn.execute("""
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
            )
        """)
        print("✅ Created form_types table")
        
        # Create form submissions table
        await conn.execute("""
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
            )
        """)
        print("✅ Created form_submissions table")
        
        # Create attachments table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS attachments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size INTEGER,
                mime_type VARCHAR(100),
                uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            )
        """)
        print("✅ Created attachments table")
        
        # Create search index table
        await conn.execute("""
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
            )
        """)
        print("✅ Created search_index table")
        
        # Create page views table for analytics
        await conn.execute("""
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
            )
        """)
        print("✅ Created page_views table")
        
        # Create indexes for better performance
        print("📊 Creating database indexes...")
        
        # Admin tables indexes
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_admin_sessions_access_token ON admin_sessions(access_token_hash)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_admin_sessions_refresh_token ON admin_sessions(refresh_token_hash)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_admin_audit_user_id ON admin_audit_log(user_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_log(action)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_log(created_at)")
        
        # Content indexes
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_pages_parent_id ON pages(parent_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_announcements_slug ON announcements(slug)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at)")
        
        # Documents indexes
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_documents_public ON documents(is_public)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_mol_documents_category ON mol_documents(category)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_mol_documents_type ON mol_documents(document_type)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_mol_documents_published_date ON mol_documents(published_date)")
        
        # Forms indexes
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_form_types_slug ON form_types(slug)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_form_types_active ON form_types(is_active)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_form_submissions_form_type ON form_submissions(form_type_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_form_submissions_reference ON form_submissions(reference_number)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_form_submissions_citizen_email ON form_submissions(citizen_email)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at)")
        
        # Search and analytics indexes
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_search_content_type ON search_index(content_type)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_search_public ON search_index(is_public)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_search_vector ON search_index USING gin(search_vector)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(view_date)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_page_views_url ON page_views(page_url)")
        
        print("✅ Created all database indexes")
        
        # Create full-text search trigger for search_index
        await conn.execute("""
            CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $$
            BEGIN
                NEW.search_vector := to_tsvector('romanian', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """)
        
        await conn.execute("""
            CREATE TRIGGER update_search_vector_trigger
            BEFORE INSERT OR UPDATE ON search_index
            FOR EACH ROW EXECUTE FUNCTION update_search_vector();
        """)
        print("✅ Created full-text search trigger")
        
        # Insert default municipality configuration
        await conn.execute("""
            INSERT INTO municipality_config 
            (name, official_name, county, mayor_name, contact_email, contact_phone, address, website)
            VALUES 
            ('Primăria Orașului Brașov', 'Orașul Brașov, Județul Brașov', 'Brașov', 
             'Maria Ionescu', 'contact@primaria-brasov.ro', '0256 123 456',
             'Strada Principală nr. 1, Brașov', 'https://primaria-brasov.ro')
            ON CONFLICT DO NOTHING
        """)
        print("✅ Inserted default municipality configuration")
        
        # Create default admin user
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        admin_password = pwd_context.hash("admin123")
        superadmin_password = pwd_context.hash("super123")
        
        await conn.execute("""
            INSERT INTO admin_users 
            (id, email, hashed_password, full_name, role, is_superuser)
            VALUES 
            ('11111111-1111-1111-1111-111111111111', 'admin@primarie.ro', $1, 'Administrator Primărie', 'admin', false),
            ('22222222-2222-2222-2222-222222222222', 'superadmin@primarie.ro', $2, 'Super Administrator', 'superuser', true)
            ON CONFLICT (email) DO UPDATE SET
                hashed_password = EXCLUDED.hashed_password,
                updated_at = NOW()
        """, admin_password, superadmin_password)
        print("✅ Created default admin users")
        
        print("🎉 Database schema created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating database schema: {e}")
        return False
    finally:
        await conn.close()

if __name__ == "__main__":
    success = asyncio.run(create_database_schema())
    sys.exit(0 if success else 1)