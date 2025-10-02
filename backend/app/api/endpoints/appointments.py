"""
Endpoint-uri pentru sistemul de programări online
"""
from datetime import datetime, date, timedelta
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload

from ...core.database import get_async_session
from ...models.appointments import (
    Appointment, AppointmentCategory, AppointmentTimeSlot, 
    AppointmentStats, AppointmentNotification
)
from ...models.admin import AdminUser, AdminAuditLog
from ...schemas.appointments import (
    AppointmentResponse, AppointmentCreate, AppointmentUpdate,
    AppointmentCategoryResponse, AppointmentCategoryCreate, AppointmentCategoryUpdate,
    AppointmentStatsResponse, AppointmentFilter, AppointmentSearchResponse,
    AppointmentPublicResponse, AvailableSlotResponse, BookingRequest, BookingConfirmation,
    TimeSlotCreate, TimeSlotResponse
)
from ..endpoints.auth import get_current_active_admin

router = APIRouter()


# ====================
# ADMIN ENDPOINTS
# ====================

@router.get("/admin/appointments/stats", response_model=AppointmentStatsResponse)
async def get_appointment_stats(
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține statisticile pentru programări (admin dashboard)
    """
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)
    
    # Statistici generale
    total_query = select(func.count(Appointment.id))
    total_result = await db.execute(total_query)
    total_appointments = total_result.scalar() or 0
    
    # Statistici pe status
    status_queries = {
        'pending': select(func.count(Appointment.id)).where(Appointment.status == 'pending'),
        'confirmed': select(func.count(Appointment.id)).where(Appointment.status == 'confirmed'),
        'cancelled': select(func.count(Appointment.id)).where(Appointment.status == 'cancelled'),
        'completed': select(func.count(Appointment.id)).where(Appointment.status == 'completed'),
        'no_show': select(func.count(Appointment.id)).where(Appointment.status == 'no_show'),
    }
    
    status_counts = {}
    for status_name, query in status_queries.items():
        result = await db.execute(query)
        status_counts[status_name] = result.scalar() or 0
    
    # Statistici pe perioada
    period_queries = {
        'today': select(func.count(Appointment.id)).where(Appointment.appointment_date == today),
        'this_week': select(func.count(Appointment.id)).where(Appointment.appointment_date >= week_start),
        'this_month': select(func.count(Appointment.id)).where(Appointment.appointment_date >= month_start),
    }
    
    period_counts = {}
    for period_name, query in period_queries.items():
        result = await db.execute(query)
        period_counts[period_name] = result.scalar() or 0
    
    # Top categorii
    popular_categories_query = select(
        AppointmentCategory.name,
        func.count(Appointment.id).label('count')
    ).join(Appointment).group_by(AppointmentCategory.id, AppointmentCategory.name)\
     .order_by(desc('count')).limit(5)
    
    categories_result = await db.execute(popular_categories_query)
    popular_categories = [
        {"name": row[0], "count": row[1]} 
        for row in categories_result.fetchall()
    ]
    
    # Programări viitoare (următoarele 5)
    upcoming_query = select(Appointment).options(selectinload(Appointment.category))\
        .where(and_(
            Appointment.appointment_date >= today,
            Appointment.status.in_(['pending', 'confirmed'])
        )).order_by(Appointment.appointment_date, Appointment.appointment_time).limit(5)
    
    upcoming_result = await db.execute(upcoming_query)
    upcoming_appointments = upcoming_result.scalars().all()
    
    return AppointmentStatsResponse(
        total_appointments=total_appointments,
        pending_appointments=status_counts['pending'],
        confirmed_appointments=status_counts['confirmed'],
        cancelled_appointments=status_counts['cancelled'],
        completed_appointments=status_counts['completed'],
        no_show_appointments=status_counts['no_show'],
        today_appointments=period_counts['today'],
        this_week_appointments=period_counts['this_week'],
        this_month_appointments=period_counts['this_month'],
        popular_categories=popular_categories,
        upcoming_appointments=upcoming_appointments
    )


@router.get("/admin/appointments", response_model=AppointmentSearchResponse)
async def get_appointments_admin(
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None)
):
    """
    Obține lista programărilor pentru admin cu filtrare și paginare
    """
    # Construire query cu filtre
    query = select(Appointment).options(
        selectinload(Appointment.category),
        selectinload(Appointment.assigned_admin)
    )
    
    conditions = []
    if status:
        conditions.append(Appointment.status == status)
    if category_id:
        conditions.append(Appointment.category_id == category_id)
    if date_from:
        conditions.append(Appointment.appointment_date >= date_from)
    if date_to:
        conditions.append(Appointment.appointment_date <= date_to)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    # Count total pentru paginare
    count_query = select(func.count(Appointment.id))
    if conditions:
        count_query = count_query.where(and_(*conditions))
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Aplicare paginare și sortare
    query = query.order_by(desc(Appointment.created_at))\
                 .offset((page - 1) * size)\
                 .limit(size)
    
    result = await db.execute(query)
    appointments = result.scalars().all()
    
    pages = (total + size - 1) // size
    
    return AppointmentSearchResponse(
        appointments=appointments,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/admin/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment_admin(
    appointment_id: UUID,
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține detaliile unei programări (admin)
    """
    query = select(Appointment).options(
        selectinload(Appointment.category),
        selectinload(Appointment.assigned_admin)
    ).where(Appointment.id == appointment_id)
    
    result = await db.execute(query)
    appointment = result.scalar_one_or_none()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Programarea nu a fost găsită"
        )
    
    return appointment


@router.patch("/admin/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: UUID,
    appointment_update: AppointmentUpdate,
    request: Request,
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Actualizează statusul unei programări (admin)
    """
    query = select(Appointment).where(Appointment.id == appointment_id)
    result = await db.execute(query)
    appointment = result.scalar_one_or_none()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Programarea nu a fost găsită"
        )
    
    # Salvarea valorilor vechi pentru audit
    old_values = {
        "status": appointment.status,
        "status_notes": appointment.status_notes,
        "admin_notes": appointment.admin_notes,
        "assigned_to": str(appointment.assigned_to) if appointment.assigned_to else None
    }
    
    # Actualizare câmpuri
    update_data = appointment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)
    
    # Actualizare timestamps bazat pe status
    if appointment_update.status:
        if appointment_update.status == 'confirmed':
            appointment.confirmed_at = datetime.utcnow()
        elif appointment_update.status == 'cancelled':
            appointment.cancelled_at = datetime.utcnow()
        elif appointment_update.status == 'completed':
            appointment.completed_at = datetime.utcnow()
    
    # Log audit
    audit_log = AdminAuditLog.create_log(
        user_id=current_user.id,
        action="update",
        resource_type="appointment",
        resource_id=str(appointment.id),
        old_values=old_values,
        new_values=update_data,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(appointment)
    
    return appointment


# ====================
# CATEGORY MANAGEMENT
# ====================

@router.get("/admin/categories", response_model=List[AppointmentCategoryResponse])
async def get_appointment_categories_admin(
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține categoriile de programări (admin)
    """
    query = select(AppointmentCategory).order_by(AppointmentCategory.name)
    result = await db.execute(query)
    categories = result.scalars().all()
    return categories


@router.post("/admin/categories", response_model=AppointmentCategoryResponse)
async def create_appointment_category(
    category_create: AppointmentCategoryCreate,
    request: Request,
    current_user: AdminUser = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Creează o categorie nouă de programări
    """
    category = AppointmentCategory(**category_create.dict())
    db.add(category)
    
    # Log audit
    audit_log = AdminAuditLog.create_log(
        user_id=current_user.id,
        action="create",
        resource_type="appointment_category",
        new_values=category_create.dict(),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(category)
    
    return category


# ====================
# PUBLIC ENDPOINTS
# ====================

@router.get("/categories", response_model=List[AppointmentCategoryResponse])
async def get_active_categories(
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține categoriile active pentru programări (public)
    """
    query = select(AppointmentCategory).where(
        AppointmentCategory.is_active == True
    ).order_by(AppointmentCategory.name)
    
    result = await db.execute(query)
    categories = result.scalars().all()
    return categories


@router.post("/book", response_model=BookingConfirmation)
async def book_appointment(
    booking: BookingRequest,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Rezervă o programare (endpoint public pentru cetățeni)
    """
    # Verificare categorie
    category_query = select(AppointmentCategory).where(
        and_(
            AppointmentCategory.id == booking.category_id,
            AppointmentCategory.is_active == True
        )
    )
    category_result = await db.execute(category_query)
    category = category_result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Categoria de programare nu este disponibilă"
        )
    
    # Verificare disponibilitate slot
    existing_count_query = select(func.count(Appointment.id)).where(
        and_(
            Appointment.appointment_date == booking.appointment_date,
            Appointment.appointment_time == booking.appointment_time,
            Appointment.category_id == booking.category_id,
            Appointment.status.in_(['pending', 'confirmed'])
        )
    )
    count_result = await db.execute(existing_count_query)
    existing_count = count_result.scalar() or 0
    
    if existing_count >= category.max_appointments_per_day:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slotul este ocupat. Vă rugăm alegeți altă dată/oră"
        )
    
    # Creare programare
    appointment_data = booking.dict()
    appointment_data['reference_number'] = Appointment.generate_reference_number()
    appointment_data['status'] = 'pending'
    
    appointment = Appointment(**appointment_data)
    db.add(appointment)
    
    await db.commit()
    await db.refresh(appointment)
    
    # Returnare confirmare
    return BookingConfirmation(
        reference_number=appointment.reference_number,
        appointment_date=appointment.appointment_date,
        appointment_time=appointment.appointment_time,
        category_name=category.name,
        citizen_name=appointment.citizen_name,
        citizen_email=appointment.citizen_email,
        message=f"Programarea dumneavoastră a fost înregistrată cu succces. Numărul de referință este {appointment.reference_number}. Veți fi contactat pentru confirmare."
    )


@router.get("/search/{reference_number}", response_model=AppointmentPublicResponse)
async def search_appointment_by_reference(
    reference_number: str,
    email: str = Query(..., description="Email-ul folosit la programare"),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Caută o programare după numărul de referință (public)
    """
    query = select(Appointment).where(
        and_(
            Appointment.reference_number == reference_number,
            Appointment.citizen_email == email
        )
    )
    
    result = await db.execute(query)
    appointment = result.scalar_one_or_none()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Programarea nu a fost găsită. Verificați numărul de referință și email-ul"
        )
    
    return appointment


@router.delete("/cancel/{reference_number}")
async def cancel_appointment(
    reference_number: str,
    email: str = Query(..., description="Email-ul folosit la programare"),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Anulează o programare (public)
    """
    query = select(Appointment).where(
        and_(
            Appointment.reference_number == reference_number,
            Appointment.citizen_email == email
        )
    )
    
    result = await db.execute(query)
    appointment = result.scalar_one_or_none()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Programarea nu a fost găsită"
        )
    
    if not appointment.can_be_cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Programarea nu poate fi anulată (prea aproape de data programării sau este deja finalizată)"
        )
    
    appointment.status = 'cancelled'
    appointment.cancelled_at = datetime.utcnow()
    appointment.status_notes = "Anulată de cetățean"
    
    await db.commit()
    
    return {"message": "Programarea a fost anulată cu succes"}


@router.get("/available-slots")
async def get_available_slots(
    category_id: int,
    date_from: date = Query(...),
    date_to: date = Query(...),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Obține sloturile disponibile pentru o categorie și perioada (public)
    """
    # Verificare categorie
    category_query = select(AppointmentCategory).where(
        and_(
            AppointmentCategory.id == category_id,
            AppointmentCategory.is_active == True
        )
    )
    category_result = await db.execute(category_query)
    category = category_result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Categoria nu este disponibilă"
        )
    
    # Pentru simplitate, returnez sloturile standard
    # În implementarea completă, acestea ar veni din AppointmentTimeSlot
    available_slots = []
    current_date = date_from
    
    while current_date <= date_to:
        # Skip weekend pentru exemplu
        if current_date.weekday() < 5:  # Luni-Vineri
            # Verificare câte programări există deja
            existing_query = select(func.count(Appointment.id)).where(
                and_(
                    Appointment.appointment_date == current_date,
                    Appointment.category_id == category_id,
                    Appointment.status.in_(['pending', 'confirmed'])
                )
            )
            existing_result = await db.execute(existing_query)
            existing_count = existing_result.scalar() or 0
            
            available_spots = max(0, category.max_appointments_per_day - existing_count)
            
            if available_spots > 0:
                # Adaugă sloturi standard (9:00, 10:00, 11:00, 14:00, 15:00)
                from datetime import time
                standard_times = [
                    time(9, 0), time(10, 0), time(11, 0), 
                    time(14, 0), time(15, 0)
                ]
                
                for slot_time in standard_times:
                    if available_spots > 0:
                        available_slots.append(AvailableSlotResponse(
                            date=current_date,
                            time=slot_time,
                            category_id=category_id,
                            available_spots=1,
                            total_spots=1
                        ))
                        available_spots -= 1
        
        current_date += timedelta(days=1)
    
    return available_slots