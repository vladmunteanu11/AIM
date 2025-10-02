"""
Script pentru crearea tabelelor de programări în baza de date
"""
import asyncio
from sqlalchemy import text

from app.core.database import engine
from app.models.appointments import (
    AppointmentCategory, AppointmentTimeSlot, Appointment,
    AppointmentNotification, AppointmentStats
)

async def create_tables():
    """Creează tabelele pentru sistemul de programări"""
    
    # SQL pentru crearea tabelelor
    create_tables_sql = """
    -- Tabela pentru categoriile de programări
    CREATE TABLE IF NOT EXISTS appointment_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        color VARCHAR(7),
        icon VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        requires_documents BOOLEAN DEFAULT FALSE NOT NULL,
        required_documents JSONB,
        max_appointments_per_day INTEGER DEFAULT 10 NOT NULL,
        appointment_duration_minutes INTEGER DEFAULT 30 NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Tabela pentru sloturile de timp
    CREATE TABLE IF NOT EXISTS appointment_time_slots (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES appointment_categories(id) NOT NULL,
        day_of_week INTEGER NOT NULL, -- 1=Luni, 2=Marți, etc.
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        max_appointments INTEGER DEFAULT 1 NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL
    );
    
    -- Tabela pentru programări
    CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id INTEGER REFERENCES appointment_categories(id) NOT NULL,
        
        -- Date solicitant
        citizen_name VARCHAR(255) NOT NULL,
        citizen_email VARCHAR(255) NOT NULL,
        citizen_phone VARCHAR(50) NOT NULL,
        citizen_cnp VARCHAR(13),
        citizen_address TEXT,
        
        -- Detalii programare
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        subject VARCHAR(500) NOT NULL,
        details TEXT,
        attached_files JSONB,
        
        -- Status
        status VARCHAR(50) DEFAULT 'pending' NOT NULL,
        status_notes TEXT,
        reference_number VARCHAR(50) UNIQUE NOT NULL,
        priority VARCHAR(20) DEFAULT 'normal' NOT NULL,
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        confirmed_at TIMESTAMP WITH TIME ZONE,
        cancelled_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        
        -- Admin management
        assigned_to UUID REFERENCES admin_users(id),
        admin_notes TEXT,
        
        -- GDPR
        consent_given BOOLEAN DEFAULT FALSE NOT NULL,
        data_retention_until DATE
    );
    
    -- Tabela pentru notificări
    CREATE TABLE IF NOT EXISTS appointment_notifications (
        id SERIAL PRIMARY KEY,
        appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
        notification_type VARCHAR(50) NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        sent_at TIMESTAMP WITH TIME ZONE,
        scheduled_for TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
    
    -- Tabela pentru statistici
    CREATE TABLE IF NOT EXISTS appointment_stats (
        id SERIAL PRIMARY KEY,
        stats_date DATE UNIQUE NOT NULL,
        total_appointments INTEGER DEFAULT 0 NOT NULL,
        confirmed_appointments INTEGER DEFAULT 0 NOT NULL,
        cancelled_appointments INTEGER DEFAULT 0 NOT NULL,
        completed_appointments INTEGER DEFAULT 0 NOT NULL,
        no_show_appointments INTEGER DEFAULT 0 NOT NULL,
        category_stats JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Indexuri pentru performanță
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    CREATE INDEX IF NOT EXISTS idx_appointments_reference ON appointments(reference_number);
    CREATE INDEX IF NOT EXISTS idx_appointments_citizen_email ON appointments(citizen_email);
    CREATE INDEX IF NOT EXISTS idx_appointments_category ON appointments(category_id);
    
    CREATE INDEX IF NOT EXISTS idx_appointment_categories_active ON appointment_categories(is_active);
    CREATE INDEX IF NOT EXISTS idx_appointment_categories_slug ON appointment_categories(slug);
    
    -- Trigger pentru updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    DROP TRIGGER IF EXISTS update_appointment_categories_updated_at ON appointment_categories;
    CREATE TRIGGER update_appointment_categories_updated_at 
        BEFORE UPDATE ON appointment_categories
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
    DROP TRIGGER IF EXISTS update_appointment_stats_updated_at ON appointment_stats;
    CREATE TRIGGER update_appointment_stats_updated_at 
        BEFORE UPDATE ON appointment_stats
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """
    
    # Executare SQL
    async with engine.begin() as conn:
        await conn.execute(text(create_tables_sql))
        print("✅ Tabelele pentru programări au fost create cu succes!")
        
        # Inserare categorii de test
        insert_categories_sql = """
        INSERT INTO appointment_categories (name, slug, description, color, max_appointments_per_day) 
        VALUES 
        ('Audiențe Primar', 'audiente-primar', 'Programări pentru audiențe cu domnul primar', '#004990', 5),
        ('Servicii Urbanism', 'servicii-urbanism', 'Programări pentru serviciul de urbanism și amenajarea teritoriului', '#0079C1', 8),
        ('Stare Civilă', 'stare-civila', 'Programări pentru actele de stare civilă', '#28a745', 10),
        ('Servicii Sociale', 'servicii-sociale', 'Programări pentru serviciile sociale', '#ffc107', 6)
        ON CONFLICT (slug) DO NOTHING;
        """
        
        await conn.execute(text(insert_categories_sql))
        print("✅ Categoriile de programări au fost adăugate!")

async def main():
    """Funcția principală"""
    try:
        await create_tables()
        print("🎉 Sistemul de programări a fost configurat cu succes!")
    except Exception as e:
        print(f"❌ Eroare la crearea tabelelor: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())