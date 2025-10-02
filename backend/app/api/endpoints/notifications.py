"""
Endpoint-uri pentru sistemul de notificări email
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr

from ...core.database import get_async_session
from ...services.notification_service import NotificationService
from ...models.forms import FormSubmission
from ...models.appointments import Appointment

router = APIRouter()


class TestEmailRequest(BaseModel):
    """Schema pentru testarea email-ului"""
    email: EmailStr
    subject: str = "Test Email - Primăria Digitală"
    message: str = "Acesta este un email de test pentru verificarea configurației."


class StatusUpdateRequest(BaseModel):
    """Schema pentru actualizarea statusului"""
    form_submission_id: str
    new_status: str
    admin_notes: str = None


@router.get("/config/test")
async def test_email_configuration() -> Dict[str, Any]:
    """
    Testează configurația email și returnează statusul
    """
    
    results = NotificationService.test_email_configuration()
    
    return {
        "email_system_status": "configured" if not results['errors'] else "needs_configuration",
        "configuration_check": results,
        "recommendations": [
            "Configurați variabilele SMTP în .env" if not results['smtp_configured'] else None,
            "Adăugați credentialele email" if not results['credentials_configured'] else None,
            "Configurați email-urile admin" if not results['admin_emails_configured'] else None,
            "Completați informațiile primăriei" if not results['municipality_info_configured'] else None
        ]
    }


@router.post("/test/send")
async def send_test_email(
    request: TestEmailRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, str]:
    """
    Trimite un email de test
    """
    
    from ...core.email import email_service
    
    def send_test_email_task():
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #004990;">📧 Test Email - Primăria Digitală</h2>
            <p><strong>Mesaj:</strong> {request.message}</p>
            <p>Dacă primiți acest email, sistemul de notificări funcționează corect!</p>
            
            <div style="background-color: #d1ecf1; padding: 15px; border-left: 4px solid #0079C1; margin: 20px 0;">
                <p><strong>✅ Configurația email funcționează!</strong></p>
                <p>Sistemul poate trimite notificări pentru formulare și programări.</p>
            </div>
            
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
                Email de test generat automat
            </p>
        </body>
        </html>
        """
        
        return email_service.send_email(
            to_emails=[request.email],
            subject=request.subject,
            html_content=html_content
        )
    
    background_tasks.add_task(send_test_email_task)
    
    return {
        "message": "Email-ul de test a fost programat pentru trimitere",
        "email": request.email,
        "status": "queued"
    }


@router.post("/forms/{form_id}/resend")
async def resend_form_notifications(
    form_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_session)
) -> Dict[str, str]:
    """
    Retrimite notificările pentru un formular
    """
    
    # Găsește formularul
    query = select(FormSubmission).where(FormSubmission.id == form_id)
    result = await db.execute(query)
    form_submission = result.scalar_one_or_none()
    
    if not form_submission:
        raise HTTPException(status_code=404, detail="Formularul nu a fost găsit")
    
    # Programează trimiterea notificărilor în background
    async def resend_notifications_task():
        return await NotificationService.send_form_submission_notifications(
            db=db,
            form_submission=form_submission
        )
    
    background_tasks.add_task(resend_notifications_task)
    
    return {
        "message": "Notificările pentru formular au fost programate pentru retrimitere",
        "form_id": form_id,
        "reference_number": form_submission.reference_number
    }


@router.post("/appointments/{appointment_id}/resend")
async def resend_appointment_confirmation(
    appointment_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_session)
) -> Dict[str, str]:
    """
    Retrimite confirmarea pentru o programare
    """
    
    # Găsește programarea
    query = select(Appointment).where(Appointment.id == appointment_id)
    result = await db.execute(query)
    appointment = result.scalar_one_or_none()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Programarea nu a fost găsită")
    
    # Programează trimiterea confirmării în background
    async def resend_confirmation_task():
        return await NotificationService.send_appointment_confirmation_notification(
            db=db,
            appointment=appointment
        )
    
    background_tasks.add_task(resend_confirmation_task)
    
    return {
        "message": "Confirmarea programării a fost programată pentru retrimitere",
        "appointment_id": appointment_id,
        "reference_number": appointment.reference_number
    }


@router.post("/status-update")
async def send_status_update_notification(
    request: StatusUpdateRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_session)
) -> Dict[str, str]:
    """
    Trimite notificare despre schimbarea statusului unei cereri
    """
    
    # Găsește formularul
    query = select(FormSubmission).where(FormSubmission.id == request.form_submission_id)
    result = await db.execute(query)
    form_submission = result.scalar_one_or_none()
    
    if not form_submission:
        raise HTTPException(status_code=404, detail="Formularul nu a fost găsit")
    
    if not form_submission.citizen_email:
        raise HTTPException(
            status_code=400, 
            detail="Formularul nu are email pentru notificare"
        )
    
    # Programează trimiterea notificării în background
    def send_status_notification_task():
        return NotificationService.send_status_update_notification(
            form_submission=form_submission,
            new_status=request.new_status,
            admin_notes=request.admin_notes
        )
    
    background_tasks.add_task(send_status_notification_task)
    
    return {
        "message": "Notificarea de actualizare status a fost programată pentru trimitere",
        "form_id": request.form_submission_id,
        "new_status": request.new_status,
        "reference_number": form_submission.reference_number
    }


@router.post("/reminders/appointments")
async def send_appointment_reminders(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Trimite reminder-uri pentru toate programările de mâine
    Acest endpoint ar trebui apelat zilnic de un cron job
    """
    
    async def send_reminders_task():
        return await NotificationService.send_appointment_reminders(db=db)
    
    background_tasks.add_task(send_reminders_task)
    
    return {
        "message": "Trimiterea reminder-urilor pentru programări a fost programată",
        "status": "queued",
        "note": "Acest endpoint ar trebui apelat zilnic la ora 18:00"
    }


@router.get("/stats")
async def get_notification_stats(
    db: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Obține statistici despre notificările trimise
    """
    
    # Pentru moment returnăm informații despre configurare
    # În viitor aici ar fi statistici din logs sau baza de date
    
    config_test = NotificationService.test_email_configuration()
    
    return {
        "email_system_configured": len(config_test['errors']) == 0,
        "configuration_status": config_test,
        "supported_notifications": [
            "Form submission confirmations",
            "Form submission admin notifications", 
            "Appointment confirmations",
            "Appointment reminders",
            "Status update notifications"
        ],
        "recommended_schedule": {
            "appointment_reminders": "Daily at 18:00",
            "status_updates": "On demand",
            "form_notifications": "Immediate"
        }
    }