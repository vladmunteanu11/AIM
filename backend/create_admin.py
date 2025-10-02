#!/usr/bin/env python3
"""
Script pentru crearea primului utilizator administrator
Template Primărie Digitală
"""
import asyncio
import argparse
from getpass import getpass
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
import os
import sys

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Simple models for admin creation
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    login_attempts = Column(Integer, default=0)
    is_locked = Column(Boolean, default=False)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def create_admin_user(email: str, password: str, full_name: str):
    """Create the first admin user"""
    
    # Database URL (adjust as needed)
    database_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./municipiu_digital.db")
    
    # Create async engine
    engine = create_async_engine(database_url, echo=True)
    
    # Create session
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with engine.begin() as conn:
        # Create tables
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        # Check if admin already exists
        from sqlalchemy import select
        result = await session.execute(select(AdminUser).where(AdminUser.email == email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"❌ User with email {email} already exists!")
            return False
        
        # Create new admin user
        hashed_password = hash_password(password)
        admin_user = AdminUser(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            is_active=True,
            is_superuser=True
        )
        
        session.add(admin_user)
        await session.commit()
        await session.refresh(admin_user)
        
        print(f"✅ Admin user created successfully!")
        print(f"   Email: {email}")
        print(f"   Name: {full_name}")
        print(f"   ID: {admin_user.id}")
        return True

def main():
    parser = argparse.ArgumentParser(description='Create first admin user for Template Primărie Digitală')
    parser.add_argument('--email', type=str, help='Admin email address')
    parser.add_argument('--password', type=str, help='Admin password (will prompt if not provided)')
    parser.add_argument('--name', type=str, help='Full name of admin user')
    
    args = parser.parse_args()
    
    # Get email
    if not args.email:
        email = input("Enter admin email: ").strip()
    else:
        email = args.email
    
    if not email or '@' not in email:
        print("❌ Please provide a valid email address")
        return
    
    # Get full name
    if not args.name:
        full_name = input("Enter full name: ").strip()
    else:
        full_name = args.name
    
    if not full_name:
        print("❌ Please provide a full name")
        return
    
    # Get password
    if not args.password:
        password = getpass("Enter admin password: ")
        password_confirm = getpass("Confirm password: ")
        
        if password != password_confirm:
            print("❌ Passwords do not match!")
            return
    else:
        password = args.password
    
    if len(password) < 8:
        print("❌ Password must be at least 8 characters long")
        return
    
    print(f"\n🔨 Creating admin user...")
    print(f"   Email: {email}")
    print(f"   Name: {full_name}")
    
    # Create admin user
    try:
        success = asyncio.run(create_admin_user(email, password, full_name))
        if success:
            print(f"\n🎉 Admin user created successfully!")
            print(f"   You can now login at: http://localhost:3000/admin")
            print(f"   Or at: https://your-domain.ro/admin")
        else:
            print(f"\n❌ Failed to create admin user")
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")

if __name__ == "__main__":
    main()