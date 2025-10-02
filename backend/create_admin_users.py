#!/usr/bin/env python3
"""
Create default admin users with hashed passwords
"""
import asyncio
import asyncpg
import sys
import os
from passlib.context import CryptContext

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin_users():
    """Create default admin users"""
    
    print("👤 Creating default admin users...")
    
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
        # Hash passwords
        admin_password = pwd_context.hash("admin123")
        superadmin_password = pwd_context.hash("super123")
        
        # Create default admin users
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
        
        print("✅ Created default admin users:")
        print("   📧 admin@primarie.ro / admin123 (Regular Admin)")
        print("   📧 superadmin@primarie.ro / super123 (Super Admin)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin users: {e}")
        return False
    finally:
        await conn.close()

if __name__ == "__main__":
    success = asyncio.run(create_admin_users())
    sys.exit(0 if success else 1)