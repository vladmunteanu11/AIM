from datetime import datetime
from typing import List, Optional
import uuid
import random
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class TaxType(BaseModel):
    id: int
    code: str
    name: str
    description: str
    base_amount: float
    is_annual: bool
    penalty_percentage: float
    ghiseul_enabled: bool
    is_active: bool = True

class TaxCalculation(BaseModel):
    tax_type_code: str
    tax_type_name: str
    taxable_value: float
    calculated_amount: float
    penalty_amount: float
    total_amount: float
    due_date: str
    is_overdue: bool

class PaymentCreate(BaseModel):
    tax_type_code: str
    payer_name: str
    payer_cnp: Optional[str] = None
    payer_email: Optional[str] = None
    amount: float
    penalty_amount: float = 0.0
    property_identifier: Optional[str] = None
    description: Optional[str] = None

class Payment(BaseModel):
    id: str
    payment_id: str
    reference_number: str
    tax_type_code: str
    payer_name: str
    payer_cnp: Optional[str] = None
    payer_email: Optional[str] = None
    amount: float
    penalty_amount: float
    total_amount: float
    status: str
    created_at: str
    property_identifier: Optional[str] = None
    description: Optional[str] = None
    ghiseul_redirect_url: Optional[str] = None

mock_tax_types = [
    TaxType(id=1, code="IMP_CLADIRI", name="Impozit pe Clădiri", description="Impozitul anual pe clădirile aflate în proprietatea persoanelor fizice", base_amount=100.0, is_annual=True, penalty_percentage=0.01, ghiseul_enabled=True, is_active=True),
    TaxType(id=2, code="IMP_TEREN", name="Impozit pe Teren", description="Impozitul anual pe terenurile aflate în proprietatea persoanelor fizice", base_amount=50.0, is_annual=True, penalty_percentage=0.01, ghiseul_enabled=True, is_active=True),
    TaxType(id=3, code="TAX_GUNOI", name="Taxa pentru Salubrizare", description="Taxa anuală pentru serviciul de salubrizare și colectare deșeuri", base_amount=60.0, is_annual=True, penalty_percentage=0.01, ghiseul_enabled=True, is_active=True),
    TaxType(id=4, code="TAX_AUTO", name="Taxa Auto", description="Taxa anuală pentru vehiculele înmatriculate", base_amount=150.0, is_annual=True, penalty_percentage=0.01, ghiseul_enabled=True, is_active=True),
    TaxType(id=5, code="TAX_AUTORIZATIE", name="Taxa Autorizație de Construcție", description="Taxa pentru eliberarea autorizației de construcție", base_amount=200.0, is_annual=False, penalty_percentage=0.0, ghiseul_enabled=True, is_active=True),
    TaxType(id=6, code="TAX_CERTIFICAT_URBANISM", name="Taxa Certificat de Urbanism", description="Taxa pentru eliberarea certificatului de urbanism", base_amount=50.0, is_annual=False, penalty_percentage=0.0, ghiseul_enabled=True, is_active=True)
]

mock_payments = []

def generate_payment_reference():
    return f"PAY-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

def calculate_penalty(base_amount: float, due_date: datetime, penalty_rate: float = 0.01) -> float:
    if datetime.now().date() <= due_date.date():
        return 0.0
    months_overdue = ((datetime.now().year - due_date.year) * 12 + (datetime.now().month - due_date.month))
    if months_overdue <= 0:
        return 0.0
    penalty = base_amount * penalty_rate * months_overdue
    max_penalty = base_amount * 0.5
    return min(penalty, max_penalty)

@router.get("/tax-types", response_model=List[TaxType])
async def get_tax_types():
    return [tax for tax in mock_tax_types if tax.is_active]

@router.get("/tax-types/{tax_code}", response_model=TaxType)
async def get_tax_type_by_code(tax_code: str):
    tax_type = next((tax for tax in mock_tax_types if tax.code == tax_code.upper()), None)
    if not tax_type:
        raise HTTPException(status_code=404, detail="Tipul de taxă nu a fost găsit")
    return tax_type

@router.post("/calculate")
async def calculate_tax(tax_code: str, taxable_value: float, year: int = datetime.now().year):
    tax_type = next((tax for tax in mock_tax_types if tax.code == tax_code.upper()), None)
    if not tax_type:
        raise HTTPException(status_code=404, detail="Tipul de taxă nu a fost găsit")
    calculated_amount = tax_type.base_amount
    if tax_code.upper() in ["IMP_CLADIRI", "IMP_TEREN"]:
        calculated_amount = taxable_value * 0.001
    elif tax_code.upper() == "TAX_AUTO":
        if taxable_value <= 1600:
            calculated_amount = 50.0
        elif taxable_value <= 2000:
            calculated_amount = 100.0
        else:
            calculated_amount = 150.0
    penalty_amount = 0.0
    is_overdue = False
    due_date = datetime(year, 3, 31)
    if tax_type.is_annual and datetime.now() > due_date:
        is_overdue = True
        penalty_amount = calculate_penalty(calculated_amount, due_date, tax_type.penalty_percentage)
    total_amount = calculated_amount + penalty_amount
    return TaxCalculation(tax_type_code=tax_type.code, tax_type_name=tax_type.name, taxable_value=taxable_value, calculated_amount=calculated_amount, penalty_amount=penalty_amount, total_amount=total_amount, due_date=due_date.strftime("%Y-%m-%d"), is_overdue=is_overdue)

@router.post("/create", response_model=Payment)
async def create_payment(payment_data: PaymentCreate):
    tax_type = next((tax for tax in mock_tax_types if tax.code == payment_data.tax_type_code.upper()), None)
    if not tax_type:
        raise HTTPException(status_code=404, detail="Tipul de taxă nu a fost găsit")
    payment_id = str(uuid.uuid4())
    reference_number = generate_payment_reference()
    total_amount = payment_data.amount + payment_data.penalty_amount
    payment = Payment(id=payment_id, payment_id=payment_id, reference_number=reference_number, tax_type_code=tax_type.code, payer_name=payment_data.payer_name, payer_cnp=payment_data.payer_cnp, payer_email=payment_data.payer_email, amount=payment_data.amount, penalty_amount=payment_data.penalty_amount, total_amount=total_amount, status="pending", created_at=datetime.now().isoformat(), property_identifier=payment_data.property_identifier, description=payment_data.description)
    mock_payments.append(payment)
    return payment

@router.post("/{payment_id}/initiate-ghiseul")
async def initiate_ghiseul_payment(payment_id: str):
    payment = next((p for p in mock_payments if p.payment_id == payment_id), None)
    if not payment:
        raise HTTPException(status_code=404, detail="Plata nu a fost găsită")
    session_id = str(uuid.uuid4())
    redirect_url = f"http://localhost:3000/payments/mock-ghiseul?session_id={session_id}&payment_id={payment_id}&amount={payment.total_amount}"
    payment.status = "processing"
    payment.ghiseul_redirect_url = redirect_url
    return {"success": True, "redirect_url": redirect_url, "session_id": session_id, "payment_id": payment_id}

@router.get("", response_model=List[Payment])
async def get_payments(status: Optional[str] = None, payer_email: Optional[str] = None, limit: int = 50):
    payments = mock_payments.copy()
    if status:
        payments = [p for p in payments if p.status == status]
    if payer_email:
        payments = [p for p in payments if p.payer_email == payer_email]
    return payments[:limit]

@router.get("/{payment_id}", response_model=Payment)
async def get_payment(payment_id: str):
    payment = next((p for p in mock_payments if p.payment_id == payment_id), None)
    if not payment:
        raise HTTPException(status_code=404, detail="Plata nu a fost găsită")
    return payment
