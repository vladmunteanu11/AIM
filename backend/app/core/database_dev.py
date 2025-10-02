"""
Development database configuration using SQLite
For production, use the PostgreSQL configuration in database.py
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Development database URL (SQLite)
DATABASE_URL = "sqlite:///./municipiu_digital.db"

# Create SQLite engine for development
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=True  # Log SQL queries in development
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Create all tables in development"""
    Base.metadata.create_all(bind=engine)

def drop_tables():
    """Drop all tables in development"""
    Base.metadata.drop_all(bind=engine)