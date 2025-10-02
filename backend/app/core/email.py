"""
Serviciu pentru trimiterea de email-uri
"""
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any
from pathlib import Path
import jinja2
from datetime import datetime

from .config import get_settings

settings = get_settings()


class EmailService:
    """Serviciu pentru gestionarea email-urilor"""
    
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.smtp_use_tls = settings.SMTP_USE_TLS
        self.default_from_email = settings.DEFAULT_FROM_EMAIL
        self.default_from_name = settings.DEFAULT_FROM_NAME
        
        # Configurez template engine
        template_dir = Path(__file__).parent.parent / "templates" / "email"
        template_dir.mkdir(parents=True, exist_ok=True)
        
        self.jinja_env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(str(template_dir)),
            autoescape=jinja2.select_autoescape(['html', 'xml'])
        )
    
    def _create_message(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        reply_to: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> MIMEMultipart:
        """Creează mesajul email"""
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{from_name or self.default_from_name} <{from_email or self.default_from_email}>"
        msg['To'] = ", ".join(to_emails)
        
        if reply_to:
            msg['Reply-To'] = reply_to
        
        # Adaugă conținutul text
        if text_content:
            text_part = MIMEText(text_content, 'plain', 'utf-8')
            msg.attach(text_part)
        
        # Adaugă conținutul HTML
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        
        # Adaugă atașamente
        if attachments:
            for attachment in attachments:
                with open(attachment['path'], "rb") as file:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(file.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {attachment["name"]}'
                    )
                    msg.attach(part)
        
        return msg
    
    def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        reply_to: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        """Trimite un email"""
        
        try:
            msg = self._create_message(
                to_emails=to_emails,
                subject=subject,
                html_content=html_content,
                text_content=text_content,
                from_email=from_email,
                from_name=from_name,
                reply_to=reply_to,
                attachments=attachments
            )
            
            # Conectare SMTP
            if self.smtp_use_tls:
                context = ssl.create_default_context()
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                server.starttls(context=context)
            else:
                server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port)
            
            # Autentificare
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            
            # Trimitere email
            text = msg.as_string()
            server.sendmail(
                from_email or self.default_from_email,
                to_emails,
                text
            )
            server.quit()
            
            print(f"✅ Email trimis cu succes către: {', '.join(to_emails)}")
            return True
            
        except Exception as e:
            print(f"❌ Eroare la trimiterea email-ului: {e}")
            return False
    
    def render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """Renderizează un template email"""
        try:
            template = self.jinja_env.get_template(template_name)
            return template.render(context)
        except Exception as e:
            print(f"❌ Eroare la renderizarea template-ului {template_name}: {e}")
            return ""
    
    # Metode specializate pentru diferite tipuri de email-uri
    
    def send_form_submission_notification(
        self,
        form_data: Dict[str, Any],
        admin_emails: List[str]
    ) -> bool:
        """Notifică adminii despre o nouă submisie de formular"""
        
        context = {
            'form_type': form_data.get('form_type_name', 'Formular necunoscut'),
            'citizen_name': form_data.get('citizen_name', 'Necunoscut'),
            'citizen_email': form_data.get('citizen_email', 'N/A'),
            'citizen_phone': form_data.get('citizen_phone', 'N/A'),
            'reference_number': form_data.get('reference_number'),
            'submitted_at': form_data.get('submitted_at', datetime.now()).strftime("%d.%m.%Y %H:%M"),
            'admin_url': f"{settings.frontend_url}/admin/forms/{form_data.get('id')}",
            'municipality_name': settings.municipality_name
        }
        
        html_content = self.render_template('form_submission_admin.html', context)
        if not html_content:
            html_content = self._get_fallback_form_admin_template(context)
        
        subject = f"Nouă cerere: {context['reference_number']} - {context['form_type']}"
        
        return self.send_email(
            to_emails=admin_emails,
            subject=subject,
            html_content=html_content,
            from_name=f"Primăria {settings.municipality_name}"
        )
    
    def send_form_confirmation_to_citizen(
        self,
        form_data: Dict[str, Any],
        citizen_email: str
    ) -> bool:
        """Trimite confirmare cetățeanului despre submisia formularului"""
        
        context = {
            'citizen_name': form_data.get('citizen_name', 'Stimat/ă cetățean/ă'),
            'form_type': form_data.get('form_type_name', 'Formular'),
            'reference_number': form_data.get('reference_number'),
            'submitted_at': form_data.get('submitted_at', datetime.now()).strftime("%d.%m.%Y %H:%M"),
            'estimated_processing_days': form_data.get('estimated_processing_days', 15),
            'tracking_url': f"{settings.frontend_url}/verificare-cerere?ref={form_data.get('reference_number')}",
            'municipality_name': settings.municipality_name,
            'municipality_phone': settings.municipality_phone,
            'municipality_email': settings.municipality_email
        }
        
        html_content = self.render_template('form_confirmation_citizen.html', context)
        if not html_content:
            html_content = self._get_fallback_form_citizen_template(context)
        
        subject = f"Confirmare cerere {context['reference_number']} - Primăria {settings.municipality_name}"
        
        return self.send_email(
            to_emails=[citizen_email],
            subject=subject,
            html_content=html_content,
            from_name=f"Primăria {settings.municipality_name}",
            reply_to=settings.municipality_email
        )
    
    def send_appointment_confirmation(
        self,
        appointment_data: Dict[str, Any],
        citizen_email: str
    ) -> bool:
        """Trimite confirmare pentru programare"""
        
        context = {
            'citizen_name': appointment_data.get('citizen_name', 'Stimat/ă cetățean/ă'),
            'appointment_date': appointment_data.get('appointment_date'),
            'appointment_time': appointment_data.get('appointment_time'),
            'subject': appointment_data.get('subject', 'Programare'),
            'reference_number': appointment_data.get('reference_number'),
            'category': appointment_data.get('category_name', 'General'),
            'municipality_name': settings.municipality_name,
            'municipality_address': settings.municipality_address,
            'municipality_phone': settings.municipality_phone,
            'cancel_url': f"{settings.frontend_url}/anulare-programare?ref={appointment_data.get('reference_number')}"
        }
        
        html_content = self.render_template('appointment_confirmation.html', context)
        if not html_content:
            html_content = self._get_fallback_appointment_template(context)
        
        subject = f"Programare confirmată {context['reference_number']} - Primăria {settings.municipality_name}"
        
        return self.send_email(
            to_emails=[citizen_email],
            subject=subject,
            html_content=html_content,
            from_name=f"Primăria {settings.municipality_name}",
            reply_to=settings.municipality_email
        )
    
    def send_appointment_reminder(
        self,
        appointment_data: Dict[str, Any],
        citizen_email: str
    ) -> bool:
        """Trimite reminder pentru programare (cu o zi înainte)"""
        
        context = {
            'citizen_name': appointment_data.get('citizen_name', 'Stimat/ă cetățean/ă'),
            'appointment_date': appointment_data.get('appointment_date'),
            'appointment_time': appointment_data.get('appointment_time'),
            'subject': appointment_data.get('subject', 'Programare'),
            'reference_number': appointment_data.get('reference_number'),
            'municipality_name': settings.municipality_name,
            'municipality_address': settings.municipality_address,
            'municipality_phone': settings.municipality_phone
        }
        
        html_content = self.render_template('appointment_reminder.html', context)
        if not html_content:
            html_content = self._get_fallback_reminder_template(context)
        
        subject = f"Reminder: Programarea dvs. de mâine - {context['reference_number']}"
        
        return self.send_email(
            to_emails=[citizen_email],
            subject=subject,
            html_content=html_content,
            from_name=f"Primăria {settings.municipality_name}"
        )
    
    # Template-uri fallback în caz că fișierele nu există
    
    def _get_fallback_form_admin_template(self, context: Dict[str, Any]) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Nouă cerere</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #004990;">Nouă cerere primită</h2>
            <p><strong>Tip formular:</strong> {context['form_type']}</p>
            <p><strong>Solicitant:</strong> {context['citizen_name']}</p>
            <p><strong>Email:</strong> {context['citizen_email']}</p>
            <p><strong>Telefon:</strong> {context['citizen_phone']}</p>
            <p><strong>Număr referință:</strong> {context['reference_number']}</p>
            <p><strong>Data submisie:</strong> {context['submitted_at']}</p>
            
            <p style="margin: 20px 0;">
                <a href="{context['admin_url']}" 
                   style="background-color: #004990; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px;">
                    Vezi cererea în admin
                </a>
            </p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
                Email automat - Primăria {context['municipality_name']}
            </p>
        </body>
        </html>
        """
    
    def _get_fallback_form_citizen_template(self, context: Dict[str, Any]) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Confirmare cerere</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #004990;">Cererea dvs. a fost primită</h2>
            <p>Bună ziua {context['citizen_name']},</p>
            
            <p>Confirmăm primirea cererii dvs. pentru <strong>{context['form_type']}</strong>.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #004990; margin: 20px 0;">
                <p><strong>Număr referință:</strong> {context['reference_number']}</p>
                <p><strong>Data submisie:</strong> {context['submitted_at']}</p>
                <p><strong>Termen estimat de rezolvare:</strong> {context['estimated_processing_days']} zile lucrătoare</p>
            </div>
            
            <p>Puteți urmări statusul cererii dvs. aici:</p>
            <p>
                <a href="{context['tracking_url']}" 
                   style="background-color: #28a745; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px;">
                    Urmărește cererea
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
                Primăria {context['municipality_name']}
            </p>
        </body>
        </html>
        """
    
    def _get_fallback_appointment_template(self, context: Dict[str, Any]) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Programare confirmată</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #004990;">Programarea dvs. a fost confirmată</h2>
            <p>Bună ziua {context['citizen_name']},</p>
            
            <p>Confirmăm programarea dvs. la Primăria {context['municipality_name']}.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #004990; margin: 20px 0;">
                <p><strong>Data:</strong> {context['appointment_date']}</p>
                <p><strong>Ora:</strong> {context['appointment_time']}</p>
                <p><strong>Subiect:</strong> {context['subject']}</p>
                <p><strong>Număr referință:</strong> {context['reference_number']}</p>
            </div>
            
            <p><strong>Adresa:</strong> {context['municipality_address']}</p>
            <p><strong>Telefon:</strong> {context['municipality_phone']}</p>
            
            <p>Vă rugăm să vă prezentați cu 10 minute înainte de ora programată.</p>
            
            <p>
                <a href="{context['cancel_url']}" 
                   style="background-color: #dc3545; color: white; padding: 8px 16px; 
                          text-decoration: none; border-radius: 5px; font-size: 14px;">
                    Anulează programarea
                </a>
            </p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
                Cu respect,<br>
                Primăria {context['municipality_name']}
            </p>
        </body>
        </html>
        """
    
    def _get_fallback_reminder_template(self, context: Dict[str, Any]) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Reminder programare</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ffc107;">⏰ Reminder: Programarea dvs. de mâine</h2>
            <p>Bună ziua {context['citizen_name']},</p>
            
            <p>Vă reamintim că aveți o programare mâine la Primăria {context['municipality_name']}.</p>
            
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <p><strong>Data:</strong> {context['appointment_date']}</p>
                <p><strong>Ora:</strong> {context['appointment_time']}</p>
                <p><strong>Subiect:</strong> {context['subject']}</p>
                <p><strong>Număr referință:</strong> {context['reference_number']}</p>
            </div>
            
            <p><strong>Adresa:</strong> {context['municipality_address']}</p>
            <p><strong>Telefon:</strong> {context['municipality_phone']}</p>
            
            <p>Nu uitați să vă prezentați cu 10 minute înainte de ora programată!</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
                Cu respect,<br>
                Primăria {context['municipality_name']}
            </p>
        </body>
        </html>
        """


# Instanță globală
email_service = EmailService()