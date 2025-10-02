"""
Configurația bazei de date și sesiunile SQLAlchemy
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import MetaData, text
from .config import get_settings

settings = get_settings()

# Configurarea engine-ului async pentru PostgreSQL
DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=300
)

# Session factory pentru async sessions
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base pentru modelele SQLAlchemy
Base = declarative_base()

# Metadata cu convenție de nume pentru constraint-uri
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

Base.metadata = MetaData(naming_convention=convention)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency pentru obținerea unei sesiuni async de bază de date
    """
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    """
    Creează toate tabelele în baza de date
    Folosit pentru inițializarea aplicației
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_tables():
    """
    Șterge toate tabelele din baza de date
    Folosit pentru resetarea în dezvoltare
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


class DatabaseConnection:
    """
    Singleton pentru managementul conexiunii la baza de date
    """
    _instance = None
    _engine = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @property
    def engine(self):
        if self._engine is None:
            self._engine = engine
        return self._engine
    
    async def connect(self):
        """Inițializează conexiunea la baza de date"""
        try:
            # Test conexiunea
            async with self.engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            print("✅ Database connection established successfully")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            raise
    
    async def disconnect(self):
        """Închide conexiunea la baza de date"""
        if self._engine:
            await self._engine.dispose()
            print("✅ Database connection closed")


# Instanța globală pentru conexiune
db_connection = DatabaseConnection()