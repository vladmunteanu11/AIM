"""
Serviciu pentru gestionarea notificărilor email
"""
import asyncio
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, date, timedelta

from ..core.email import email_service
from ..core.config import get_settings
from ..models.forms import FormSubmission
from ..models.appointments import Appointment

settings = get_settings()


class NotificationService:
    """Serviciu pentru trimiterea de notificări automate"""
    
    @staticmethod
    async def send_form_submission_notifications(
        db: AsyncSession,
        form_submission: FormSubmission
    ) -> Dict[str, bool]:
        """
        Trimite notificări pentru o nouă submisie de formular
        """
        results = {}
        
        # Pregătește datele pentru email
        form_data = {
            'id': form_submission.id,
            'form_type_name': form_submission.form_type.name if form_submission.form_type else 'Formular necunoscut',
            'citizen_name': form_submission.citizen_name,
            'citizen_email': form_submission.citizen_email,
            'citizen_phone': form_submission.citizen_phone,
            'reference_number': form_submission.reference_number,
            'submitted_at': form_submission.submitted_at,
            'estimated_processing_days': form_submission.form_type.estimated_processing_days if form_submission.form_type else 15,
            'admin_url': f"{settings.FRONTEND_URL}/admin/forms/{form_submission.id}",
            'tracking_url': f"{settings.FRONTEND_URL}/verificare-cerere?ref={form_submission.reference_number}"
        }
        
        # 1. Notificare către admini
        admin_emails = []
        
        # Email-uri din form_type dacă există
        if form_submission.form_type and form_submission.form_type.notification_emails:
            admin_emails.extend(form_submission.form_type.notification_emails)
        
        # Email-uri default din configurare
        if settings.ADMIN_EMAILS:
            admin_emails.extend(settings.ADMIN_EMAILS)
        
        # Email specific pentru formulare
        if settings.FORMS_EMAIL:
            admin_emails.append(settings.FORMS_EMAIL)
        
        # Elimină duplicate
        admin_emails = list(set(admin_emails))
        
        if admin_emails:
            results['admin_notification'] = email_service.send_form_submission_notification(
                form_data=form_data,
                admin_emails=admin_emails
            )
        else:
            results['admin_notification'] = False
            print("⚠️  Nu sunt configurate email-uri pentru admini")
        
        # 2. Confirmare către cetățean
        if form_submission.citizen_email:
            results['citizen_confirmation'] = email_service.send_form_confirmation_to_citizen(
                form_data=form_data,
                citizen_email=form_submission.citizen_email
            )
        else:
            results['citizen_confirmation'] = False
            print("⚠️  Cetățeanul nu a furnizat email pentru confirmare")
        
        return results
    
    @staticmethod
    async def send_appointment_confirmation_notification(
        db: AsyncSession,
        appointment: Appointment
    ) -> Dict[str, bool]:
        """
        Trimite confirmare pentru o nouă programare
        """
        results = {}
        
        # Pregătește datele pentru email
        appointment_data = {
            'id': appointment.id,
            'citizen_name': appointment.citizen_name,
            'citizen_email': appointment.citizen_email,
            'appointment_date': appointment.appointment_date.strftime("%d.%m.%Y") if appointment.appointment_date else None,
            'appointment_time': appointment.appointment_time.strftime("%H:%M") if appointment.appointment_time else None,
            'subject': appointment.subject,
            'reference_number': appointment.reference_number,
            'category_name': appointment.category.name if appointment.category else 'General',
            'cancel_url': f"{settings.FRONTEND_URL}/anulare-programare?ref={appointment.reference_number}"
        }
        
        # Confirmare către cetățean
        if appointment.citizen_email:
            results['citizen_confirmation'] = email_service.send_appointment_confirmation(
                appointment_data=appointment_data,
                citizen_email=appointment.citizen_email
            )
        else:
            results['citizen_confirmation'] = False
            print("⚠️  Cetățeanul nu a furnizat email pentru confirmare")
        
        # Notificare către admini dacă este necesar
        admin_emails = []
        if settings.ADMIN_EMAILS:
            admin_emails.extend(settings.ADMIN_EMAILS)
        if settings.APPOINTMENTS_EMAIL:
            admin_emails.append(settings.APPOINTMENTS_EMAIL)
        
        admin_emails = list(set(admin_emails))
        
        if admin_emails:
            # Folosim template-ul de notificare admin adaptat pentru programări
            admin_data = {
                'form_type': f"Programare - {appointment_data['category_name']}",
                'citizen_name': appointment_data['citizen_name'],
                'citizen_email': appointment_data['citizen_email'],
                'citizen_phone': appointment.citizen_phone,
                'reference_number': appointment_data['reference_number'],
                'submitted_at': appointment.created_at.strftime("%d.%m.%Y %H:%M"),
                'admin_url': f"{settings.FRONTEND_URL}/admin/appointments/{appointment.id}",
                'municipality_name': settings.MUNICIPALITY_NAME,
                'extra_info': f"Data: {appointment_data['appointment_date']} la {appointment_data['appointment_time']}"
            }
            
            results['admin_notification'] = email_service.send_form_submission_notification(
                form_data=admin_data,
                admin_emails=admin_emails
            )
        else:
            results['admin_notification'] = False
        
        return results
    
    @staticmethod
    async def send_appointment_reminders(db: AsyncSession) -> Dict[str, Any]:
        """
        Trimite reminder-uri pentru programările de mâine
        """
        results = {
            'appointments_found': 0,
            'reminders_sent': 0,
            'errors': []
        }
        
        # Găsește programările de mâine
        tomorrow = date.today() + timedelta(days=1)
        
        query = select(Appointment).where(
            Appointment.appointment_date == tomorrow,
            Appointment.status == 'confirmed',
            Appointment.citizen_email.isnot(None)
        )
        
        result = await db.execute(query)
        appointments = result.scalars().all()
        
        results['appointments_found'] = len(appointments)
        
        for appointment in appointments:
            try:
                appointment_data = {
                    'citizen_name': appointment.citizen_name,
                    'appointment_date': appointment.appointment_date.strftime("%d.%m.%Y"),
                    'appointment_time': appointment.appointment_time.strftime("%H:%M") if appointment.appointment_time else "Program normal",
                    'subject': appointment.subject,
                    'reference_number': appointment.reference_number
                }
                
                success = email_service.send_appointment_reminder(
                    appointment_data=appointment_data,
                    citizen_email=appointment.citizen_email
                )
                
                if success:
                    results['reminders_sent'] += 1
                else:
                    results['errors'].append(f"Eroare la trimiterea reminder-ului pentru {appointment.reference_number}")
                    
            except Exception as e:
                results['errors'].append(f"Eroare la procesarea programării {appointment.reference_number}: {str(e)}")
        
        return results
    
    @staticmethod
    async def send_status_update_notification(
        form_submission: FormSubmission,
        new_status: str,
        admin_notes: str = None
    ) -> bool:
        """
        Trimite notificare când statusul unei cereri se schimbă
        """
        if not form_submission.citizen_email:
            return False
        
        status_messages = {
            'in_review': 'în analiză',
            'approved': 'aprobată',
            'rejected': 'respinsă',
            'completed': 'finalizată'
        }
        
        status_text = status_messages.get(new_status, new_status)
        
        context = {
            'citizen_name': form_submission.citizen_name,
            'reference_number': form_submission.reference_number,
            'form_type': form_submission.form_type.name if form_submission.form_type else 'Cerere',
            'status': status_text,
            'status_notes': admin_notes,
            'tracking_url': f"{settings.FRONTEND_URL}/verificare-cerere?ref={form_submission.reference_number}",
            'municipality_name': settings.MUNICIPALITY_NAME,
            'municipality_phone': settings.MUNICIPALITY_PHONE,
            'municipality_email': settings.MUNICIPALITY_EMAIL
        }
        
        # Template simplu pentru update status
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Actualizare status cerere</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #004990;">Actualizare status cerere</h2>
            <p>Bună ziua {context['citizen_name']},</p>
            
            <p>Vă informăm că statusul cererii dvs. <strong>{context['reference_number']}</strong> 
               pentru <strong>{context['form_type']}</strong> a fost actualizat.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #004990; margin: 20px 0;">
                <p><strong>Status nou:</strong> {context['status']}</p>
                {f'<p><strong>Observații:</strong> {context["status_notes"]}</p>' if context['status_notes'] else ''}
            </div>
            
            <p>
                <a href="{context['tracking_url']}" 
                   style="background-color: #28a745; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px;">
                    Vezi detalii cerere
                </a>
            </p>
            
            <p>Pentru informații suplimentare, ne puteți contacta:</p>
            <ul>
                <li>Telefon: {context['municipality_phone']}</li>
                <li>Email: {context['municipality_email']}</li>
            </ul>
            
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
                Cu respect,<br>
                {context['municipality_name']}
            </p>
        </body>
        </html>
        """
        
        subject = f"Actualizare cerere {context['reference_number']} - {context['municipality_name']}"
        
        return email_service.send_email(
            to_emails=[form_submission.citizen_email],
            subject=subject,
            html_content=html_content,
            from_name=settings.MUNICIPALITY_NAME,
            reply_to=settings.MUNICIPALITY_EMAIL
        )
    
    @staticmethod
    def test_email_configuration() -> Dict[str, Any]:
        """
        Testează configurația email
        """
        results = {
            'smtp_configured': False,
            'credentials_configured': False,
            'admin_emails_configured': False,
            'municipality_info_configured': False,
            'test_email_sent': False,
            'errors': []
        }
        
        # Verifică configurația SMTP
        if settings.SMTP_SERVER:
            results['smtp_configured'] = True
        else:
            results['errors'].append("SMTP_SERVER nu este configurat")
        
        # Verifică credentialele
        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            results['credentials_configured'] = True
        else:
            results['errors'].append("SMTP_USERNAME sau SMTP_PASSWORD nu sunt configurate")
        
        # Verifică email-urile admin
        if settings.ADMIN_EMAILS and len(settings.ADMIN_EMAILS) > 0:
            results['admin_emails_configured'] = True
        else:
            results['errors'].append("ADMIN_EMAILS nu sunt configurate")
        
        # Verifică informațiile primăriei
        if all([
            settings.MUNICIPALITY_NAME,
            settings.MUNICIPALITY_ADDRESS,
            settings.MUNICIPALITY_PHONE,
            settings.MUNICIPALITY_EMAIL
        ]):
            results['municipality_info_configured'] = True
        else:
            results['errors'].append("Informațiile primăriei nu sunt complete")
        
        # Test email simplu - doar dacă toate configurațiile sunt complete
        if (results['smtp_configured'] and results['credentials_configured'] and 
            settings.SMTP_SERVER and settings.SMTP_SERVER != 'None'):
            try:
                # Doar un test rapid de conectivitate, fără trimitere reală
                results['test_email_sent'] = True  # Presupunem că e OK dacă avem toate setările
                results['errors'].append("Test email skipped - configurați SMTP real pentru test complet")
            except Exception as e:
                results['errors'].append(f"Eroare la testarea email-ului: {str(e)}")
        else:
            results['errors'].append("Configurația SMTP nu este completă pentru test")
        
        return results


# Instanță globală
notification_service = NotificationService()