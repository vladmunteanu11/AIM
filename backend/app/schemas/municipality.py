"""
Scheme Pydantic pentru configurația municipalității
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, validator, HttpUrl


class WorkingHours(BaseModel):
    """Schema pentru programul de lucru"""
    monday: Optional[str] = None
    tuesday: Optional[str] = None
    wednesday: Optional[str] = None
    thursday: Optional[str] = None
    friday: Optional[str] = None
    saturday: Optional[str] = None
    sunday: Optional[str] = None
    
    @validator('*', pre=True)
    def validate_time_format(cls, v):
        if v is not None and v != "":
            # Validare simplă pentru format HH:MM-HH:MM
            if not isinstance(v, str) or (v != "Închis" and "-" not in v):
                raise ValueError('Formatul trebuie să fie HH:MM-HH:MM sau "Închis"')
        return v


class MunicipalityConfigBase(BaseModel):
    """Schema de bază pentru configurația municipalității"""
    name: str
    official_name: str
    county: str
    mayor_name: Optional[str] = None
    
    # Identitate vizuală
    logo_url: Optional[HttpUrl] = None
    coat_of_arms_url: Optional[HttpUrl] = None
    primary_color: str = "#004990"
    secondary_color: str = "#0079C1"
    
    # Contact
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    fax: Optional[str] = None
    address: str
    postal_code: Optional[str] = None
    website_url: Optional[HttpUrl] = None
    
    # Program
    working_hours: Optional[Dict[str, str]] = None
    audience_hours: Optional[Dict[str, str]] = None
    
    # SEO
    meta_description: Optional[str] = None
    google_analytics_id: Optional[str] = None
    
    # Setări
    timezone: str = "Europe/Bucharest"
    language: str = "ro"
    maintenance_mode: bool = False
    
    @validator('primary_color', 'secondary_color')
    def validate_hex_color(cls, v):
        if not v.startswith('#') or len(v) != 7:
            raise ValueError('Culoarea trebuie să fie în format hexadecimal #RRGGBB')
        try:
            int(v[1:], 16)
        except ValueError:
            raise ValueError('Culoarea trebuie să fie în format hexadecimal valid')
        return v
    
    @validator('postal_code')
    def validate_postal_code(cls, v):
        if v is not None and (len(v) != 6 or not v.isdigit()):
            raise ValueError('Codul poștal trebuie să aibă 6 cifre')
        return v
    
    @validator('contact_phone', 'fax')
    def validate_phone(cls, v):
        if v is not None:
            # Eliminarea spațiilor și caracterelor speciale
            clean_phone = ''.join(c for c in v if c.isdigit() or c in '+()-')
            if len(clean_phone) < 10:
                raise ValueError('Numărul de telefon trebuie să aibă cel puțin 10 cifre')
        return v


class MunicipalityConfigCreate(MunicipalityConfigBase):
    """Schema pentru crearea configurației municipalității"""
    pass


class MunicipalityConfigUpdate(BaseModel):
    """Schema pentru actualizarea configurației municipalității"""
    name: Optional[str] = None
    official_name: Optional[str] = None
    county: Optional[str] = None
    mayor_name: Optional[str] = None
    
    # Identitate vizuală
    logo_url: Optional[HttpUrl] = None
    coat_of_arms_url: Optional[HttpUrl] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    
    # Contact
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    fax: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    website_url: Optional[HttpUrl] = None
    
    # Program
    working_hours: Optional[Dict[str, str]] = None
    audience_hours: Optional[Dict[str, str]] = None
    
    # SEO
    meta_description: Optional[str] = None
    google_analytics_id: Optional[str] = None
    
    # Setări
    timezone: Optional[str] = None
    language: Optional[str] = None
    maintenance_mode: Optional[bool] = None
    
    @validator('primary_color', 'secondary_color')
    def validate_hex_color(cls, v):
        if v is not None:
            if not v.startswith('#') or len(v) != 7:
                raise ValueError('Culoarea trebuie să fie în format hexadecimal #RRGGBB')
            try:
                int(v[1:], 16)
            except ValueError:
                raise ValueError('Culoarea trebuie să fie în format hexadecimal valid')
        return v


class MunicipalityConfigResponse(MunicipalityConfigBase):
    """Schema pentru răspunsul cu configurația municipalității"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MunicipalityPublicInfo(BaseModel):
    """Schema pentru informațiile publice ale municipalității"""
    name: str
    official_name: str
    county: str
    mayor_name: Optional[str]
    contact_info: Dict[str, Any]
    working_hours: Dict[str, str]
    audience_hours: Dict[str, str]
    brand_colors: Dict[str, str]
    logo_url: Optional[str]
    coat_of_arms_url: Optional[str]
    website_url: Optional[str]


class MunicipalityContactInfo(BaseModel):
    """Schema pentru informațiile de contact"""
    contact_email: Optional[str]
    contact_phone: Optional[str]
    fax: Optional[str]
    address: str
    working_hours: Dict[str, str]
    audience_hours: Dict[str, str]


class MunicipalityBrandingInfo(BaseModel):
    """Schema pentru informațiile de branding"""
    primary_color: str
    secondary_color: str
    logo_url: Optional[str]
    coat_of_arms_url: Optional[str]
    name: str
    official_name: str