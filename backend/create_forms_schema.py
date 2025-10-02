#!/usr/bin/env python3
"""
Create database schema for forms, complaints and related tables
"""
import asyncio
import asyncpg
import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.config import get_settings

settings = get_settings()

async def create_forms_schema():
    """Create tables for form management"""
    
    print("📋 Creating forms and complaints database schema...")
    
    # Connect to database
    try:
        db_url = settings.DATABASE_URL
        if db_url.startswith("postgresql+asyncpg://"):
            db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        
        conn = await asyncpg.connect(db_url)
        print("✅ Connected to PostgreSQL database")
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return False
    
    try:
        # Create form types table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS form_types (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                form_schema JSONB NOT NULL,
                validation_rules JSONB,
                is_active BOOLEAN DEFAULT TRUE NOT NULL,
                requires_auth BOOLEAN DEFAULT FALSE NOT NULL,
                max_submissions_per_day INTEGER,
                required_documents TEXT[],
                instructions TEXT,
                notification_emails TEXT[],
                auto_reply_template TEXT,
                approval_required BOOLEAN DEFAULT FALSE NOT NULL,
                estimated_processing_days INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)
        print("✅ Created form_types table")

        # Create form submissions table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS form_submissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                form_type_id INTEGER REFERENCES form_types(id) NOT NULL,
                citizen_name VARCHAR(255) NOT NULL,
                citizen_email VARCHAR(255),
                citizen_phone VARCHAR(50),
                citizen_cnp VARCHAR(13),
                citizen_address TEXT,
                submission_data JSONB NOT NULL,
                attached_files TEXT[],
                status VARCHAR(50) DEFAULT 'pending' NOT NULL,
                status_notes TEXT,
                reference_number VARCHAR(50) UNIQUE NOT NULL,
                priority VARCHAR(20) DEFAULT 'normal' NOT NULL,
                submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                assigned_at TIMESTAMP WITH TIME ZONE,
                processed_at TIMESTAMP WITH TIME ZONE,
                completed_at TIMESTAMP WITH TIME ZONE,
                assigned_to UUID REFERENCES admin_users(id),
                processing_notes TEXT,
                consent_given BOOLEAN DEFAULT FALSE NOT NULL,
                data_retention_until DATE
            );
        """)
        print("✅ Created form_submissions table")

        # Create indexes for form_submissions
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
            CREATE INDEX IF NOT EXISTS idx_form_submissions_reference ON form_submissions(reference_number);
            CREATE INDEX IF NOT EXISTS idx_form_submissions_citizen_email ON form_submissions(citizen_email);
            CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at);
        """)
        print("✅ Created form_submissions indexes")

        # Create complaint categories table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS complaint_categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE NOT NULL,
                requires_location BOOLEAN DEFAULT TRUE NOT NULL,
                requires_photos BOOLEAN DEFAULT FALSE NOT NULL,
                responsible_department VARCHAR(255),
                notification_emails TEXT[],
                response_time_hours INTEGER DEFAULT 24 NOT NULL,
                resolution_time_days INTEGER DEFAULT 7 NOT NULL,
                sort_order INTEGER DEFAULT 0 NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)
        print("✅ Created complaint_categories table")

        # Create complaints table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS complaints (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                category_id INTEGER REFERENCES complaint_categories(id) NOT NULL,
                citizen_name VARCHAR(255) NOT NULL,
                citizen_email VARCHAR(255),
                citizen_phone VARCHAR(50),
                citizen_address TEXT,
                is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
                title VARCHAR(500) NOT NULL,
                description TEXT NOT NULL,
                location_address TEXT,
                location_details TEXT,
                latitude VARCHAR(50),
                longitude VARCHAR(50),
                attached_photos TEXT[],
                attached_documents TEXT[],
                status VARCHAR(50) DEFAULT 'submitted' NOT NULL,
                urgency_level VARCHAR(20) DEFAULT 'normal' NOT NULL,
                reference_number VARCHAR(50) UNIQUE NOT NULL,
                submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                acknowledged_at TIMESTAMP WITH TIME ZONE,
                started_at TIMESTAMP WITH TIME ZONE,
                resolved_at TIMESTAMP WITH TIME ZONE,
                closed_at TIMESTAMP WITH TIME ZONE,
                assigned_to UUID REFERENCES admin_users(id),
                admin_notes TEXT,
                citizen_feedback TEXT,
                citizen_satisfaction INTEGER,
                consent_given BOOLEAN DEFAULT FALSE NOT NULL,
                data_retention_until DATE,
                notification_preferences JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)
        print("✅ Created complaints table")

        # Create indexes for complaints
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
            CREATE INDEX IF NOT EXISTS idx_complaints_reference ON complaints(reference_number);
            CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category_id);
            CREATE INDEX IF NOT EXISTS idx_complaints_submitted_at ON complaints(submitted_at);
            CREATE INDEX IF NOT EXISTS idx_complaints_citizen_email ON complaints(citizen_email);
        """)
        print("✅ Created complaints indexes")

        # Create complaint updates table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS complaint_updates (
                id SERIAL PRIMARY KEY,
                complaint_id UUID REFERENCES complaints(id) NOT NULL,
                status_from VARCHAR(50),
                status_to VARCHAR(50) NOT NULL,
                notes TEXT,
                is_public BOOLEAN DEFAULT TRUE NOT NULL,
                updated_by UUID REFERENCES admin_users(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            );
        """)
        print("✅ Created complaint_updates table")

        # Create email templates table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS email_templates (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                subject VARCHAR(255) NOT NULL,
                body_text TEXT NOT NULL,
                body_html TEXT,
                variables TEXT[],
                is_active BOOLEAN DEFAULT TRUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            );
        """)
        print("✅ Created email_templates table")

        # Create email queue table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS email_queue (
                id SERIAL PRIMARY KEY,
                to_email VARCHAR(255) NOT NULL,
                cc_emails TEXT[],
                bcc_emails TEXT[],
                subject VARCHAR(255) NOT NULL,
                body_text TEXT,
                body_html TEXT,
                attachments JSONB,
                status VARCHAR(20) DEFAULT 'pending' NOT NULL,
                attempts INTEGER DEFAULT 0 NOT NULL,
                max_attempts INTEGER DEFAULT 3 NOT NULL,
                error_message TEXT,
                send_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                sent_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            );
        """)
        print("✅ Created email_queue table")

        print("\n🎉 Forms and complaints schema created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating schema: {e}")
        return False
    finally:
        await conn.close()

async def create_sample_data():
    """Create some sample form types and complaint categories"""
    
    print("\n📝 Creating sample form types and complaint categories...")
    
    try:
        db_url = settings.DATABASE_URL
        if db_url.startswith("postgresql+asyncpg://"):
            db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        
        conn = await asyncpg.connect(db_url)
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return False
    
    try:
        # Create sample form types
        await conn.execute("""
            INSERT INTO form_types (name, slug, description, form_schema, estimated_processing_days)
            VALUES 
            ('Cerere Certificat de Urbanism', 'certificat-urbanism', 'Cerere pentru obținerea certificatului de urbanism', 
             '{"fields": [{"name": "applicant_name", "type": "text", "required": true}, {"name": "property_address", "type": "text", "required": true}]}', 10),
            ('Cerere Autorizație de Construire', 'autorizatie-construire', 'Cerere pentru obținerea autorizației de construire',
             '{"fields": [{"name": "applicant_name", "type": "text", "required": true}, {"name": "construction_type", "type": "select", "required": true}]}', 30),
            ('Cerere Copie Conformă', 'copie-conforma', 'Cerere pentru obținerea unei copii conforme',
             '{"fields": [{"name": "document_type", "type": "text", "required": true}, {"name": "purpose", "type": "text", "required": true}]}', 3)
            ON CONFLICT (slug) DO NOTHING;
        """)
        print("✅ Created sample form types")

        # Create sample complaint categories
        await conn.execute("""
            INSERT INTO complaint_categories (name, slug, description, responsible_department, response_time_hours, resolution_time_days)
            VALUES
            ('Infrastructură și Drumuri', 'infrastructura-drumuri', 'Probleme legate de drumuri, trotuare, iluminat public', 'Serviciul Tehnic', 24, 14),
            ('Mediu și Salubritate', 'mediu-salubritate', 'Probleme de mediu, gunoi, poluare', 'Serviciul de Mediu', 12, 7),
            ('Transport Public', 'transport-public', 'Probleme legate de transportul public local', 'Serviciul Transport', 24, 10),
            ('Servicii Publice', 'servicii-publice', 'Probleme cu serviciile publice oferite de primărie', 'Secretariatul General', 24, 7),
            ('Altele', 'altele', 'Alte tipuri de sesizări', 'Secretariatul General', 24, 14)
            ON CONFLICT (slug) DO NOTHING;
        """)
        print("✅ Created sample complaint categories")

        print("🎉 Sample data created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        return False
    finally:
        await conn.close()

if __name__ == "__main__":
    success = asyncio.run(create_forms_schema())
    if success:
        sample_success = asyncio.run(create_sample_data())
        sys.exit(0 if sample_success else 1)
    else:
        sys.exit(1)