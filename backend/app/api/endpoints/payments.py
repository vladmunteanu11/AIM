"""
API endpoints pentru sistemul de plăți Ghișeul.ro
"""
from datetime import datetime, timedelta
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_async_session
from ...models.payments import Payment, TaxType, CitizenTaxRecord, PaymentTransaction
from ...schemas.payments import (
    Payment as PaymentSchema,
    PaymentCreate,
    PaymentUpdate,
    TaxType as TaxTypeSchema,
    TaxTypeCreate,
    TaxCalculationRequest,
    TaxCalculationResponse,
    GhiseulPaymentRequest,
    GhiseulPaymentResponse,
    QuickPaymentRequest,
    PaymentStats,
    PaymentStatus
)
from ...services.ghiseul_service import GhiseulService, MockGhiseulService, TaxCalculationService


router = APIRouter()


def get_ghiseul_service(db: AsyncSession = Depends(get_async_session)) -> GhiseulService:
    """Dependency pentru serviciul Ghișeul.ro"""
    # În modul dezvoltare, folosim MockGhiseulService
    return MockGhiseulService(db)


# ========== ENDPOINT-URI PENTRU TIPURI DE TAXE ==========

@router.get("/tax-types", response_model=List[TaxTypeSchema])
async def get_tax_types(
    active_only: bool = True,
    db: AsyncSession = Depends(get_async_session)
):
    """Obține toate tipurile de taxe și impozite"""
    query = db.query(TaxType)
    if active_only:
        query = query.filter(TaxType.is_active == True)
    
    return query.all()


@router.get("/tax-types/{tax_type_id}", response_model=TaxTypeSchema)
async def get_tax_type(tax_type_id: int, db: AsyncSession = Depends(get_async_session)):
    """Obține un tip de taxă specific"""
    tax_type = db.query(TaxType).filter(TaxType.id == tax_type_id).first()
    if not tax_type:
        raise HTTPException(status_code=404, detail="Tipul de taxă nu a fost găsit")
    return tax_type


@router.get("/tax-types/code/{tax_code}", response_model=TaxTypeSchema)
async def get_tax_type_by_code(tax_code: str, db: AsyncSession = Depends(get_async_session)):
    """Obține un tip de taxă după cod"""
    tax_type = db.query(TaxType).filter(TaxType.code == tax_code.upper()).first()
    if not tax_type:
        raise HTTPException(status_code=404, detail="Tipul de taxă nu a fost găsit")
    return tax_type


# ========== CALCULUL TAXELOR ==========

@router.post("/calculate-tax", response_model=TaxCalculationResponse)
async def calculate_tax(
    request: TaxCalculationRequest,
    db: AsyncSession = Depends(get_async_session)
):
    """Calculează o taxă pentru o valoare dată"""
    # Găsește tipul de taxă
    tax_type = db.query(TaxType).filter(TaxType.code == request.tax_type_code.upper()).first()
    if not tax_type:
        raise HTTPException(status_code=404, detail="Tipul de taxă nu a fost găsit")
    
    # Calculează suma de bază
    calc_service = TaxCalculationService()
    
    if tax_type.code == "IMP_CLADIRI":
        calculated_amount = calc_service.calculate_property_tax(request.taxable_value)
    elif tax_type.code == "IMP_TEREN":
        # Pentru teren, presupunem că taxable_value este suprafața în mp
        # și folosim un preț mediu pe mp
        calculated_amount = calc_service.calculate_land_tax(request.taxable_value, 10.0)  # 10 lei/mp
    elif tax_type.code == "TAX_GUNOI":
        property_type = request.property_details.get("type", "residential") if request.property_details else "residential"
        calculated_amount = calc_service.calculate_waste_tax(property_type)
    elif tax_type.code == "TAX_AUTO":
        engine_capacity = request.property_details.get("engine_capacity", 1400) if request.property_details else 1400
        vehicle_age = request.property_details.get("vehicle_age", 0) if request.property_details else 0
        calculated_amount = calc_service.calculate_vehicle_tax(engine_capacity, vehicle_age)
    else:
        # Calculul implicit folosește suma de bază din configurație
        calculated_amount = tax_type.base_amount
    
    # Calculează data scadenței
    due_date = datetime(request.year, tax_type.due_date_month, tax_type.due_date_day)
    
    # Calculează penalizarea pentru întârziere
    penalty_amount = 0.0
    is_overdue = datetime.now() > due_date
    if is_overdue:
        ghiseul_service = get_ghiseul_service(db)
        penalty_amount = ghiseul_service.calculate_penalties(
            calculated_amount, due_date, tax_type.penalty_percentage
        )
    
    total_amount = calculated_amount + penalty_amount
    
    return TaxCalculationResponse(
        tax_type_code=tax_type.code,
        tax_type_name=tax_type.name,
        taxable_value=request.taxable_value,
        base_amount=tax_type.base_amount,
        calculated_amount=calculated_amount,
        penalty_amount=penalty_amount,
        total_amount=total_amount,
        due_date=due_date,
        is_overdue=is_overdue,
        calculation_details={
            "formula": "Calculat automat conform metodologiei locale",
            "tax_rate": tax_type.penalty_percentage,
            "year": request.year
        }
    )


# ========== PLĂȚI ==========

@router.post("/payments", response_model=PaymentSchema)
async def create_payment(
    payment_data: PaymentCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Creează o plată nouă"""
    # Verifică tipul de taxă
    tax_type = db.query(TaxType).filter(TaxType.id == payment_data.tax_type_id).first()
    if not tax_type:
        raise HTTPException(status_code=404, detail="Tipul de taxă nu a fost găsit")
    
    # Generează ID-urile unice
    payment_id = str(uuid.uuid4())
    reference_number = f"PAY-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    
    # Calculează suma totală
    total_amount = payment_data.amount + payment_data.penalty_amount
    
    # Creează plata
    payment = Payment(
        payment_id=payment_id,
        reference_number=reference_number,
        tax_type_id=payment_data.tax_type_id,
        tax_record_id=payment_data.tax_record_id,
        payer_name=payment_data.payer_name,
        payer_cnp=payment_data.payer_cnp,
        payer_cui=payment_data.payer_cui,
        payer_email=payment_data.payer_email,
        payer_phone=payment_data.payer_phone,
        amount=payment_data.amount,
        penalty_amount=payment_data.penalty_amount,
        total_amount=total_amount,
        payment_year=payment_data.payment_year,
        description=payment_data.description or f"Plată {tax_type.name}",
        notes=payment_data.notes,
        status=PaymentStatus.PENDING,
        payment_method=payment_data.payment_method,
        expires_at=datetime.utcnow() + timedelta(minutes=30)  # Expiră în 30 de minute
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return payment


@router.post("/payments/quick", response_model=dict)
async def create_quick_payment(
    request: QuickPaymentRequest,
    db: AsyncSession = Depends(get_async_session),
    ghiseul_service: GhiseulService = Depends(get_ghiseul_service)
):
    """Creează o plată rapidă și redirecționează către Ghișeul.ro"""
    # Găsește tipul de taxă
    tax_type = db.query(TaxType).filter(TaxType.code == request.tax_type_code.upper()).first()
    if not tax_type:
        raise HTTPException(status_code=404, detail="Tipul de taxă nu a fost găsit")
    
    # Creează plata
    payment_data = PaymentCreate(
        tax_type_id=tax_type.id,
        payer_name=request.payer_name,
        payer_cnp=request.payer_cnp,
        payer_email=request.payer_email,
        amount=request.amount,
        penalty_amount=0.0,
        description=request.description or f"Plată rapidă {tax_type.name}"
    )
    
    payment = await create_payment(payment_data, db)
    
    # Inițiază plata prin Ghișeul.ro
    ghiseul_request = GhiseulPaymentRequest(
        payment_id=payment.payment_id,
        amount=payment.total_amount,
        description=payment.description,
        payer_name=payment.payer_name,
        payer_cnp=payment.payer_cnp,
        payer_email=payment.payer_email,
        tax_code=tax_type.code,
        return_url=f"http://localhost:3000/payments/success?payment_id={payment.payment_id}",
        cancel_url=f"http://localhost:3000/payments/cancel?payment_id={payment.payment_id}"
    )
    
    ghiseul_response = await ghiseul_service.initiate_payment(ghiseul_request)
    
    if ghiseul_response.success:
        # Actualizează plata cu datele de sesiune
        payment.status = PaymentStatus.PROCESSING
        payment.ghiseul_session_id = ghiseul_response.session_id
        payment.ghiseul_redirect_url = ghiseul_response.redirect_url
        db.commit()
        
        return {
            "success": True,
            "payment_id": payment.payment_id,
            "reference_number": payment.reference_number,
            "redirect_url": ghiseul_response.redirect_url,
            "session_id": ghiseul_response.session_id
        }
    else:
        payment.status = PaymentStatus.FAILED
        db.commit()
        
        raise HTTPException(
            status_code=400, 
            detail=f"Eroare la inițierea plății: {ghiseul_response.error_message}"
        )


@router.get("/payments", response_model=List[PaymentSchema])
async def get_payments(
    status: Optional[PaymentStatus] = None,
    tax_type_id: Optional[int] = None,
    payer_cnp: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_async_session)
):
    """Obține lista plăților cu filtrare"""
    query = db.query(Payment)
    
    if status:
        query = query.filter(Payment.status == status)
    if tax_type_id:
        query = query.filter(Payment.tax_type_id == tax_type_id)
    if payer_cnp:
        query = query.filter(Payment.payer_cnp == payer_cnp)
    
    query = query.order_by(Payment.created_at.desc())
    query = query.offset(offset).limit(limit)
    
    return query.all()


@router.get("/payments/{payment_id}", response_model=PaymentSchema)
async def get_payment(payment_id: str, db: AsyncSession = Depends(get_async_session)):
    """Obține o plată specifică"""
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Plata nu a fost găsită")
    return payment


@router.get("/payments/reference/{reference_number}", response_model=PaymentSchema)
async def get_payment_by_reference(reference_number: str, db: AsyncSession = Depends(get_async_session)):
    """Obține o plată după numărul de referință"""
    payment = db.query(Payment).filter(Payment.reference_number == reference_number).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Plata nu a fost găsită")
    return payment


@router.post("/payments/{payment_id}/initiate-ghiseul")
async def initiate_ghiseul_payment(
    payment_id: str,
    db: AsyncSession = Depends(get_async_session),
    ghiseul_service: GhiseulService = Depends(get_ghiseul_service)
):
    """Inițiază plata prin Ghișeul.ro pentru o plată existentă"""
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Plata nu a fost găsită")
    
    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(status_code=400, detail="Plata nu poate fi inițiată")
    
    tax_type = db.query(TaxType).filter(TaxType.id == payment.tax_type_id).first()
    
    ghiseul_request = GhiseulPaymentRequest(
        payment_id=payment.payment_id,
        amount=payment.total_amount,
        description=payment.description,
        payer_name=payment.payer_name,
        payer_cnp=payment.payer_cnp,
        payer_email=payment.payer_email,
        tax_code=tax_type.code,
        return_url=f"http://localhost:3000/payments/success?payment_id={payment.payment_id}",
        cancel_url=f"http://localhost:3000/payments/cancel?payment_id={payment.payment_id}"
    )
    
    response = await ghiseul_service.initiate_payment(ghiseul_request)
    
    if response.success:
        payment.status = PaymentStatus.PROCESSING
        payment.ghiseul_session_id = response.session_id
        payment.ghiseul_redirect_url = response.redirect_url
        db.commit()
    
    return response


# ========== CALLBACK ȘI CONFIRMĂRI ==========

@router.post("/payments/ghiseul-callback")
async def ghiseul_callback(
    request: Request,
    db: AsyncSession = Depends(get_async_session),
    ghiseul_service: GhiseulService = Depends(get_ghiseul_service)
):
    """Endpoint pentru callback-ul de la Ghișeul.ro"""
    try:
        callback_data = await request.json()
        success = await ghiseul_service.handle_callback(callback_data)
        
        if success:
            return {"status": "success", "message": "Callback procesat cu succes"}
        else:
            return {"status": "error", "message": "Eroare la procesarea callback-ului"}
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Eroare callback: {str(e)}")


@router.post("/payments/{payment_id}/simulate-success")
async def simulate_payment_success(
    payment_id: str,
    db: AsyncSession = Depends(get_async_session)
):
    """Simulează succesul unei plăți (doar pentru dezvoltare)"""
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Plata nu a fost găsită")
    
    # Simulează callback de succes
    callback_data = {
        "payment_id": payment_id,
        "ghiseul_payment_id": f"mock_{uuid.uuid4().hex[:8]}",
        "status": "completed",
        "amount": float(payment.total_amount),
        "payment_date": datetime.utcnow().isoformat()
    }
    
    ghiseul_service = MockGhiseulService(db)
    await ghiseul_service.handle_callback(callback_data)
    
    return {"status": "success", "message": "Plata a fost marcată ca finalizată"}


# ========== STATISTICI ==========

@router.get("/payments/stats", response_model=PaymentStats)
async def get_payment_stats(db: AsyncSession = Depends(get_async_session)):
    """Obține statistici despre plăți"""
    total_payments = db.query(Payment).count()
    total_amount = db.query(Payment).with_entities(Payment.total_amount).all()
    total_amount = sum([p[0] for p in total_amount if p[0]])
    
    completed_payments = db.query(Payment).filter(Payment.status == PaymentStatus.COMPLETED).count()
    completed_amount = db.query(Payment).filter(Payment.status == PaymentStatus.COMPLETED)\
        .with_entities(Payment.total_amount).all()
    completed_amount = sum([p[0] for p in completed_amount if p[0]])
    
    pending_payments = db.query(Payment).filter(Payment.status == PaymentStatus.PENDING).count()
    pending_amount = db.query(Payment).filter(Payment.status == PaymentStatus.PENDING)\
        .with_entities(Payment.total_amount).all()
    pending_amount = sum([p[0] for p in pending_amount if p[0]])
    
    failed_payments = db.query(Payment).filter(Payment.status == PaymentStatus.FAILED).count()
    
    return PaymentStats(
        total_payments=total_payments,
        total_amount=total_amount,
        completed_payments=completed_payments,
        completed_amount=completed_amount,
        pending_payments=pending_payments,
        pending_amount=pending_amount,
        failed_payments=failed_payments,
        payments_by_method={
            "ghiseul_ro": completed_payments,
            "cash": 0,
            "bank_transfer": 0
        },
        payments_by_tax_type={},
        monthly_stats=[]
    )