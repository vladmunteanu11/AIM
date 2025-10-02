"""
Modele pentru sistemul de plăți Ghișeul.ro
Template Primărie Digitală #DigiLocal
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


class TaxType(Base):
    """Tipuri de taxe și impozite locale"""
    __tablename__ = "tax_types"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)  # ex: "IMP_TEREN", "TAX_GUNOI"
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Configurare calcul
    base_amount = Column(Float, default=0.0)  # suma de bază
    calculation_formula = Column(Text)  # formulă de calcul (JSON sau text)
    
    # Configurare plată
    is_annual = Column(Boolean, default=True)  # plată anuală sau nu
    due_date_month = Column(Integer, default=3)  # luna scadenței (martie)
    due_date_day = Column(Integer, default=31)   # ziua scadenței
    
    # Configurare penalizări
    penalty_percentage = Column(Float, default=0.01)  # 1% pe lună întârziere
    
    # Ghișeul.ro
    ghiseul_service_code = Column(String(50))  # codul serviciului în Ghișeul.ro
    ghiseul_enabled = Column(Boolean, default=True)
    
    # Metadate
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relații
    payments = relationship("Payment", back_populates="tax_type")


class CitizenTaxRecord(Base):
    """Evidența fiscală a contribuabililor"""
    __tablename__ = "citizen_tax_records"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Date contribuabil
    citizen_cnp = Column(String(13), index=True)  # CNP pentru persoane fizice
    citizen_cui = Column(String(20), index=True)  # CUI pentru persoane juridice
    citizen_name = Column(String(255), nullable=False)
    citizen_email = Column(String(255))
    citizen_phone = Column(String(20))
    citizen_address = Column(Text)
    
    # Date obiect de impozitare
    tax_type_id = Column(Integer, ForeignKey("tax_types.id"))
    property_identifier = Column(String(100))  # număr cadastral, adresă, etc.
    property_description = Column(Text)
    
    # Calcul sumă
    taxable_value = Column(Float)  # valoarea impozabilă
    calculated_amount = Column(Float)  # suma calculată
    year = Column(Integer, default=datetime.now().year)
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relații
    tax_type = relationship("TaxType")
    payments = relationship("Payment", back_populates="tax_record")


class Payment(Base):
    """Plăți efectuate prin Ghișeul.ro sau alte metode"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Identificatori
    payment_id = Column(String(100), unique=True, nullable=False, index=True)  # ID-ul nostru
    ghiseul_payment_id = Column(String(100), unique=True, index=True)  # ID-ul din Ghișeul.ro
    reference_number = Column(String(50), unique=True, nullable=False)  # numărul de referință
    
    # Relații
    tax_type_id = Column(Integer, ForeignKey("tax_types.id"))
    tax_record_id = Column(Integer, ForeignKey("citizen_tax_records.id"), nullable=True)
    
    # Date contribuabil
    payer_cnp = Column(String(13))
    payer_cui = Column(String(20))
    payer_name = Column(String(255), nullable=False)
    payer_email = Column(String(255))
    payer_phone = Column(String(20))
    
    # Detalii plată
    amount = Column(Float, nullable=False)
    penalty_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    payment_year = Column(Integer, default=datetime.now().year)
    
    # Descrierea plății
    description = Column(Text)
    notes = Column(Text)
    
    # Status și timestamps
    status = Column(String(50), default="pending")  # pending, processing, completed, failed, cancelled
    payment_method = Column(String(50), default="ghiseul_ro")  # ghiseul_ro, cash, bank_transfer
    
    # Ghișeul.ro specific
    ghiseul_session_id = Column(String(100))
    ghiseul_redirect_url = Column(String(500))
    ghiseul_callback_data = Column(Text)  # JSON cu datele de callback
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    payment_date = Column(DateTime)  # când s-a efectuat plata
    confirmed_at = Column(DateTime)  # când a fost confirmată plata
    expires_at = Column(DateTime)    # când expiră sesiunea de plată
    
    # Relații
    tax_type = relationship("TaxType", back_populates="payments")
    tax_record = relationship("CitizenTaxRecord", back_populates="payments")


class PaymentTransaction(Base):
    """Log-ul tranzacțiilor pentru audit"""
    __tablename__ = "payment_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    payment_id = Column(Integer, ForeignKey("payments.id"))
    transaction_id = Column(String(100), unique=True, nullable=False)
    
    # Detalii tranzacție
    action = Column(String(50))  # created, redirected, confirmed, failed
    status_before = Column(String(50))
    status_after = Column(String(50))
    
    # Date externe (Ghișeul.ro, bancă, etc.)
    external_reference = Column(String(100))
    external_data = Column(Text)  # JSON cu toate datele externe
    
    # Metadata
    ip_address = Column(String(45))
    user_agent = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relații
    payment = relationship("Payment")


class GhiseulConfiguration(Base):
    """Configurarea integrării cu Ghișeul.ro"""
    __tablename__ = "ghiseul_configuration"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Credențiale și configurare
    merchant_id = Column(String(100), nullable=False)
    api_key = Column(String(255), nullable=False)
    api_secret = Column(String(255), nullable=False)
    
    # URL-uri
    api_base_url = Column(String(255), default="https://www.ghiseul.ro/ghiseul/api")
    payment_url = Column(String(255), default="https://www.ghiseul.ro/ghiseul/public/platapersonalfizica")
    callback_url = Column(String(255))  # URL-ul de callback pentru confirmări
    success_url = Column(String(255))   # URL de redirect la succes
    cancel_url = Column(String(255))    # URL de redirect la anulare
    
    # Configurări
    test_mode = Column(Boolean, default=True)
    session_timeout = Column(Integer, default=1800)  # 30 minute
    auto_confirm = Column(Boolean, default=True)
    
    # Date instituție
    institution_name = Column(String(255))
    institution_code = Column(String(50))
    institution_account = Column(String(50))  # contul colector
    
    # Metadate
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)