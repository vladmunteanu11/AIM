"""
Model pentru configurația primăriei
"""
from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from ..core.database import Base


class MunicipalityConfig(Base):
    """Configurarea generală a primăriei - o singură înregistrare per instalare"""
    __tablename__ = "municipality_config"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Informații de bază
    name = Column(String(255), nullable=False)
    official_name = Column(String(255), nullable=False)
    county = Column(String(100), nullable=False)
    mayor_name = Column(String(255), nullable=True)
    
    # Identitate vizuală
    logo_url = Column(String(500), nullable=True)
    coat_of_arms_url = Column(String(500), nullable=True)
    primary_color = Column(String(7), default="#004990", nullable=False)  # PANTONE 280C
    secondary_color = Column(String(7), default="#0079C1", nullable=False)  # PANTONE 300C
    
    # Date de contact
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    fax = Column(String(50), nullable=True)
    address = Column(Text, nullable=False)
    postal_code = Column(String(10), nullable=True)
    website_url = Column(String(255), nullable=True)
    
    # Program funcționare (JSON format)
    working_hours = Column(JSONB, nullable=True)  # {"monday": "08:00-16:00", ...}
    audience_hours = Column(JSONB, nullable=True)  # program audiențe
    
    # SEO și Analytics
    meta_description = Column(Text, nullable=True)
    google_analytics_id = Column(String(50), nullable=True)
    
    # Setări avansate
    timezone = Column(String(50), default="Europe/Bucharest", nullable=False)
    language = Column(String(5), default="ro", nullable=False)
    maintenance_mode = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<MunicipalityConfig(name='{self.name}', county='{self.county}')>"
    
    @property
    def display_name(self) -> str:
        """Numele de afișare al primăriei"""
        return self.official_name or self.name
    
    @property
    def full_address(self) -> str:
        """Adresa completă formatată"""
        address_parts = [self.address]
        if self.postal_code:
            address_parts.append(f"CP {self.postal_code}")
        if self.county:
            address_parts.append(self.county)
        return ", ".join(address_parts)
    
    @property
    def contact_info(self) -> dict:
        """Informațiile de contact structurate"""
        return {
            "email": self.contact_email,
            "phone": self.contact_phone,
            "fax": self.fax,
            "address": self.full_address,
            "website": self.website_url
        }
    
    @property
    def brand_colors(self) -> dict:
        """Culorile brandului pentru frontend"""
        return {
            "primary": self.primary_color,
            "secondary": self.secondary_color
        }
    
    def get_working_hours_display(self) -> dict:
        """Returnează program de lucru formatat pentru afișare"""
        if not self.working_hours:
            return {}
        
        days_ro = {
            "monday": "Luni",
            "tuesday": "Marți", 
            "wednesday": "Miercuri",
            "thursday": "Joi",
            "friday": "Vineri",
            "saturday": "Sâmbătă",
            "sunday": "Duminică"
        }
        
        return {
            days_ro.get(day, day): hours 
            for day, hours in self.working_hours.items()
        }
    
    def get_audience_hours_display(self) -> dict:
        """Returnează programul de audiențe formatat pentru afișare"""
        if not self.audience_hours:
            return {}
        
        days_ro = {
            "monday": "Luni",
            "tuesday": "Marți",
            "wednesday": "Miercuri", 
            "thursday": "Joi",
            "friday": "Vineri",
            "saturday": "Sâmbătă",
            "sunday": "Duminică"
        }
        
        return {
            days_ro.get(day, day): hours
            for day, hours in self.audience_hours.items()
        }
    
    @classmethod
    def create_default_config(
        cls,
        name: str,
        official_name: str,
        county: str,
        address: str,
        contact_email: str = None,
        contact_phone: str = None
    ):
        """Factory method pentru crearea unei configurări implicite"""
        return cls(
            name=name,
            official_name=official_name,
            county=county,
            address=address,
            contact_email=contact_email,
            contact_phone=contact_phone,
            working_hours={
                "monday": "08:00-16:00",
                "tuesday": "08:00-16:00", 
                "wednesday": "08:00-16:00",
                "thursday": "08:00-16:00",
                "friday": "08:00-14:00"
            },
            audience_hours={
                "monday": "10:00-12:00",
                "wednesday": "14:00-16:00"
            },
            meta_description=f"Site oficial al {official_name} - servicii digitale pentru cetățeni"
        )