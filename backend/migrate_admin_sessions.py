#!/usr/bin/env python3
"""
Migration script pentru actualizarea tabelei admin_sessions cu JWT refresh tokens
"""
import asyncio
import asyncpg
from app.core.config import get_settings

settings = get_settings()

async def migrate_admin_sessions():
    """Actualizează schema tabelei admin_sessions"""
    
    # Conectare la baza de date
    db_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    conn = await asyncpg.connect(settings.DATABASE_URL)
    
    try:
        print("Starting migration for admin_sessions table...")
        
        # Șterge toate sesiunile existente (pentru că schema se schimbă radical)
        await conn.execute("DELETE FROM admin_sessions")
        print("Cleared existing admin sessions")
        
        # Șterge și recreează tabela cu noua schema
        await conn.execute("DROP TABLE IF EXISTS admin_sessions")
        print("Dropped old admin_sessions table")
        
        # Recreează tabela cu noua schema
        create_table_sql = """
        CREATE TABLE admin_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
        """
        
        await conn.execute(create_table_sql)
        print("Created new admin_sessions table with JWT support")
        
        # Creează indexuri
        await conn.execute("CREATE INDEX idx_admin_sessions_access_token_hash ON admin_sessions(access_token_hash)")
        await conn.execute("CREATE INDEX idx_admin_sessions_refresh_token_hash ON admin_sessions(refresh_token_hash)")
        await conn.execute("CREATE INDEX idx_admin_sessions_user_id ON admin_sessions(user_id)")
        await conn.execute("CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(access_expires_at)")
        print("Created indexes for admin_sessions table")
        
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        raise
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate_admin_sessions())