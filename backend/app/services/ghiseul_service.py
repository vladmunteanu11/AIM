"""
Serviciu pentru integrarea cu Ghișeul.ro
Template Primărie Digitală #DigiLocal
"""
import hashlib
import hmac
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models.payments import Payment, GhiseulConfiguration, PaymentTransaction
from ..schemas.payments import (
    GhiseulPaymentRequest, 
    GhiseulPaymentResponse, 
    GhiseulCallback,
    PaymentStatus
)


class GhiseulService:
    """Serviciu pentru integrarea cu platforma Ghișeul.ro"""
    
    def __init__(self, db: Session):
        self.db = db
        self.config = self._get_configuration()
        
    def _get_configuration(self) -> Optional[GhiseulConfiguration]:
        """Obține configurația Ghișeul.ro din baza de date"""
        return self.db.query(GhiseulConfiguration).filter(
            GhiseulConfiguration.is_active == True
        ).first()
    
    def _generate_signature(self, data: Dict[str, Any]) -> str:
        """Generează semnătura pentru securizarea comunicării cu Ghișeul.ro"""
        if not self.config:
            raise HTTPException(status_code=500, detail="Configurația Ghișeul.ro nu este disponibilă")
        
        # Sortează parametrii și creează string-ul pentru semnătură
        sorted_params = sorted(data.items())
        params_string = '&'.join([f"{k}={v}" for k, v in sorted_params])
        
        # Generează HMAC SHA256
        signature = hmac.new(
            self.config.api_secret.encode('utf-8'),
            params_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return signature
    
    def _validate_signature(self, data: Dict[str, Any], received_signature: str) -> bool:
        """Validează semnătura primită de la Ghișeul.ro"""
        expected_signature = self._generate_signature(data)
        return hmac.compare_digest(expected_signature, received_signature)
    
    async def initiate_payment(self, payment_request: GhiseulPaymentRequest) -> GhiseulPaymentResponse:
        """Inițiază o plată prin Ghișeul.ro"""
        if not self.config:
            raise HTTPException(status_code=500, detail="Configurația Ghișeul.ro nu este disponibilă")
        
        try:
            # Pregătește datele pentru Ghișeul.ro
            session_id = str(uuid.uuid4())
            
            payment_data = {
                'merchant_id': self.config.merchant_id,
                'session_id': session_id,
                'amount': f"{payment_request.amount:.2f}",
                'currency': 'RON',
                'description': payment_request.description,
                'order_id': payment_request.payment_id,
                'payer_name': payment_request.payer_name,
                'payer_cnp': payment_request.payer_cnp or '',
                'payer_email': payment_request.payer_email or '',
                'tax_code': payment_request.tax_code,
                'institution_account': self.config.institution_account,
                'return_url': payment_request.return_url,
                'cancel_url': payment_request.cancel_url,
                'callback_url': self.config.callback_url,
                'timestamp': datetime.utcnow().isoformat(),
                'test_mode': str(self.config.test_mode).lower()
            }
            
            # Generează semnătura
            payment_data['signature'] = self._generate_signature(payment_data)
            
            # În mod dezvoltare, simulăm răspunsul Ghișeul.ro
            if self.config.test_mode:
                return self._simulate_ghiseul_response(session_id, payment_data)
            
            # Apelează API-ul real Ghișeul.ro
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.config.api_base_url}/payment/initiate",
                    json=payment_data,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return GhiseulPaymentResponse(
                        success=result.get('success', False),
                        session_id=result.get('session_id'),
                        redirect_url=result.get('redirect_url'),
                        error_message=result.get('error_message'),
                        error_code=result.get('error_code')
                    )
                else:
                    return GhiseulPaymentResponse(
                        success=False,
                        error_message=f"Eroare API Ghișeul.ro: {response.status_code}",
                        error_code="API_ERROR"
                    )
                    
        except Exception as e:
            return GhiseulPaymentResponse(
                success=False,
                error_message=f"Eroare la inițierea plății: {str(e)}",
                error_code="SYSTEM_ERROR"
            )
    
    def _simulate_ghiseul_response(self, session_id: str, payment_data: Dict) -> GhiseulPaymentResponse:
        """Simulează răspunsul Ghișeul.ro în modul de dezvoltare"""
        redirect_url = f"{self.config.payment_url}?{urlencode({'session_id': session_id})}"
        
        return GhiseulPaymentResponse(
            success=True,
            session_id=session_id,
            redirect_url=redirect_url
        )
    
    async def handle_callback(self, callback_data: Dict[str, Any]) -> bool:
        """Procesează callback-ul de la Ghișeul.ro"""
        try:
            # Validează semnătura
            signature = callback_data.pop('signature', '')
            if not self._validate_signature(callback_data, signature):
                raise HTTPException(status_code=400, detail="Semnătură invalidă")
            
            # Parsează datele callback-ului
            callback = GhiseulCallback(**callback_data)
            
            # Găsește plata în baza de date
            payment = self.db.query(Payment).filter(
                Payment.payment_id == callback.payment_id
            ).first()
            
            if not payment:
                raise HTTPException(status_code=404, detail="Plata nu a fost găsită")
            
            # Actualizează plata
            old_status = payment.status
            
            if callback.status == "completed":
                payment.status = PaymentStatus.COMPLETED
                payment.ghiseul_payment_id = callback.ghiseul_payment_id
                payment.payment_date = callback.payment_date
                payment.confirmed_at = datetime.utcnow()
            elif callback.status == "failed":
                payment.status = PaymentStatus.FAILED
            elif callback.status == "cancelled":
                payment.status = PaymentStatus.CANCELLED
            
            payment.ghiseul_callback_data = json.dumps(callback_data)
            
            # Salvează tranzacția pentru audit
            transaction = PaymentTransaction(
                payment_id=payment.id,
                transaction_id=str(uuid.uuid4()),
                action="callback_received",
                status_before=old_status,
                status_after=payment.status,
                external_reference=callback.ghiseul_payment_id,
                external_data=json.dumps(callback_data)
            )
            
            self.db.add(transaction)
            self.db.commit()
            
            return True
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Eroare la procesarea callback-ului: {str(e)}")
    
    async def check_payment_status(self, payment_id: str) -> Optional[Payment]:
        """Verifică statusul unei plăți"""
        payment = self.db.query(Payment).filter(
            Payment.payment_id == payment_id
        ).first()
        
        if not payment:
            return None
        
        # Dacă plata este în curs și a expirat, marchează-o ca expirată
        if (payment.status == PaymentStatus.PROCESSING and 
            payment.expires_at and 
            datetime.utcnow() > payment.expires_at):
            payment.status = PaymentStatus.EXPIRED
            self.db.commit()
        
        return payment
    
    def generate_payment_url(self, session_id: str, amount: float, description: str) -> str:
        """Generează URL-ul de plată pentru Ghișeul.ro"""
        if not self.config:
            raise HTTPException(status_code=500, detail="Configurația Ghișeul.ro nu este disponibilă")
        
        params = {
            'session_id': session_id,
            'merchant_id': self.config.merchant_id,
            'amount': f"{amount:.2f}",
            'description': description,
            'test_mode': str(self.config.test_mode).lower()
        }
        
        return f"{self.config.payment_url}?{urlencode(params)}"
    
    def calculate_penalties(self, base_amount: float, due_date: datetime, penalty_rate: float = 0.01) -> float:
        """Calculează penalizările pentru întârziere"""
        if datetime.now().date() <= due_date.date():
            return 0.0
        
        # Calculează numărul de luni de întârziere
        months_overdue = ((datetime.now().year - due_date.year) * 12 + 
                         (datetime.now().month - due_date.month))
        
        if months_overdue <= 0:
            return 0.0
        
        # Calculează penalizarea (1% pe lună, de exemplu)
        penalty = base_amount * penalty_rate * months_overdue
        
        # Limitează penalizarea la maximum 50% din suma de bază
        max_penalty = base_amount * 0.5
        return min(penalty, max_penalty)


class TaxCalculationService:
    """Serviciu pentru calculul taxelor și impozitelor locale"""
    
    @staticmethod
    def calculate_property_tax(property_value: float, tax_rate: float = 0.001) -> float:
        """Calculează impozitul pe clădiri"""
        # Formula simplificată: valoarea proprietății * cota de impozitare
        return property_value * tax_rate
    
    @staticmethod
    def calculate_land_tax(land_area: float, price_per_sqm: float, tax_rate: float = 0.003) -> float:
        """Calculează impozitul pe teren"""
        land_value = land_area * price_per_sqm
        return land_value * tax_rate
    
    @staticmethod
    def calculate_waste_tax(property_type: str = "residential") -> float:
        """Calculează taxa pentru salubrizare"""
        # Taxe fixe în funcție de tipul proprietății
        rates = {
            "residential": 50.0,  # lei/an pentru locuințe
            "commercial": 200.0,  # lei/an pentru spații comerciale
            "industrial": 500.0   # lei/an pentru spații industriale
        }
        return rates.get(property_type, rates["residential"])
    
    @staticmethod
    def calculate_vehicle_tax(engine_capacity: int, vehicle_age: int = 0) -> float:
        """Calculează taxa auto"""
        # Formula simplificată bazată pe capacitatea cilindrică
        if engine_capacity <= 1200:
            base_tax = 29.0
        elif engine_capacity <= 2000:
            base_tax = 75.0
        elif engine_capacity <= 3000:
            base_tax = 224.0
        else:
            base_tax = 483.0
        
        # Reducere pentru vehicule vechi (dacă au peste 15 ani)
        if vehicle_age > 15:
            base_tax *= 0.5
        
        return base_tax


# Mock pentru simularea Ghișeul.ro în dezvoltare
class MockGhiseulService(GhiseulService):
    """Mock service pentru testare și dezvoltare"""
    
    async def initiate_payment(self, payment_request: GhiseulPaymentRequest) -> GhiseulPaymentResponse:
        """Simulează inițierea plății"""
        session_id = str(uuid.uuid4())
        redirect_url = f"http://localhost:3000/payments/mock-ghiseul?session_id={session_id}&amount={payment_request.amount}"
        
        return GhiseulPaymentResponse(
            success=True,
            session_id=session_id,
            redirect_url=redirect_url
        )
    
    async def handle_callback(self, callback_data: Dict[str, Any]) -> bool:
        """Simulează callback-ul de success"""
        # În modul mock, considerăm toate plățile ca fiind de succes
        payment = self.db.query(Payment).filter(
            Payment.payment_id == callback_data.get('payment_id')
        ).first()
        
        if payment:
            payment.status = PaymentStatus.COMPLETED
            payment.ghiseul_payment_id = f"mock_ghiseul_{uuid.uuid4().hex[:8]}"
            payment.payment_date = datetime.utcnow()
            payment.confirmed_at = datetime.utcnow()
            self.db.commit()
            return True
        
        return False