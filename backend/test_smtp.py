#!/usr/bin/env python3
"""
Script pentru testarea configurației SMTP
Rulare: python test_smtp.py
"""

import asyncio
import sys
import os
from pathlib import Path

# Adaugă calea către modulele aplicației
sys.path.insert(0, str(Path(__file__).parent))

from app.core.email import email_service
from app.core.config import get_settings
from app.services.notification_service import NotificationService

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🔧 {title}")
    print(f"{'='*60}")

def print_status(check, status, details=None):
    icon = "✅" if status else "❌"
    print(f"{icon} {check}")
    if details and not status:
        print(f"   💡 {details}")

def print_config_summary():
    print_header("CONFIGURARE SMTP ACTUALĂ")
    
    settings = get_settings()
    
    config_items = [
        ("SMTP Server", settings.SMTP_SERVER),
        ("SMTP Port", settings.SMTP_PORT),
        ("SMTP TLS", settings.SMTP_USE_TLS),
        ("SMTP Username", settings.SMTP_USERNAME),
        ("SMTP Password", "***" if settings.SMTP_PASSWORD else None),
        ("From Email", settings.DEFAULT_FROM_EMAIL),
        ("From Name", settings.DEFAULT_FROM_NAME),
        ("Admin Emails", ", ".join(settings.ADMIN_EMAILS)),
        ("Forms Email", settings.FORMS_EMAIL),
        ("Appointments Email", settings.APPOINTMENTS_EMAIL),
    ]
    
    for label, value in config_items:
        status = "✅" if value else "❌"
        display_value = value if value else "Nu este configurat"
        print(f"{status} {label:<20}: {display_value}")

def test_smtp_configuration():
    print_header("TESTARE CONFIGURAȚIE SMTP")
    
    # Test configurația folosind NotificationService
    results = NotificationService.test_email_configuration()
    
    print_status(
        "Server SMTP configurat", 
        results['smtp_configured'],
        "Configurați SMTP_SERVER în .env"
    )
    
    print_status(
        "Credentiale SMTP configurate", 
        results['credentials_configured'],
        "Configurați SMTP_USERNAME și SMTP_PASSWORD în .env"
    )
    
    print_status(
        "Email-uri admin configurate", 
        results['admin_emails_configured'],
        "Configurați ADMIN_EMAILS în .env"
    )
    
    print_status(
        "Informații primărie complete", 
        results['municipality_info_configured'],
        "Completați informațiile primăriei în .env"
    )
    
    if results['errors']:
        print_header("ERORI DETECTATE")
        for error in results['errors']:
            print(f"❌ {error}")
    
    return len(results['errors']) == 0

def test_email_sending(test_email):
    print_header(f"TEST TRIMITERE EMAIL către {test_email}")
    
    try:
        success = email_service.send_email(
            to_emails=[test_email],
            subject="🧪 Test SMTP - Primăria Digitală",
            html_content="""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Test SMTP</title>
            </head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #004990;">🧪 Test SMTP - Primăria Digitală</h2>
                <div style="background-color: #d1ecf1; padding: 20px; border-left: 4px solid #0079C1; margin: 20px 0;">
                    <h3>✅ Configurația SMTP funcționează corect!</h3>
                    <p>Acest email confirmă că sistemul de notificări este configurat și funcțional.</p>
                </div>
                
                <h3>Funcționalități disponibile:</h3>
                <ul>
                    <li>📋 Notificări pentru formulare noi</li>
                    <li>✉️ Confirmări pentru programări</li>
                    <li>⏰ Reminder-uri programări</li>
                    <li>🔄 Notificări schimbare status</li>
                    <li>📊 Rapoarte și statistici</li>
                </ul>
                
                <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <p><strong>📅 Data test:</strong> {}</p>
                    <p><strong>🖥️ Server:</strong> Test development</p>
                    <p><strong>📧 Template:</strong> Fallback HTML</p>
                </div>
                
                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                    Email de test generat automat - Sistemul Primăria Digitală<br>
                    Dacă ați primit acest email, configurația SMTP este corectă! 🎉
                </p>
            </body>
            </html>
            """.format(asyncio.get_event_loop().time())
        )
        
        print_status("Email trimis cu succes", success)
        if success:
            print(f"📧 Verificați inbox-ul pentru {test_email}")
        
        return success
        
    except Exception as e:
        print_status("Email trimis cu succes", False, str(e))
        return False

def provide_setup_guidance():
    print_header("GHID CONFIGURARE SMTP")
    
    print("""
🔧 Pentru a configura SMTP, editați fișierul .env și adăugați:

# Pentru Gmail:
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password  # Nu parola normală!

# Pentru domeniu propriu:
SMTP_SERVER=mail.your-domain.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=noreply@your-domain.com
SMTP_PASSWORD=your_password

# Email-uri pentru notificări:
DEFAULT_FROM_EMAIL=noreply@primarie-exemplu.ro
DEFAULT_FROM_NAME=Primăria Exemplu
ADMIN_EMAILS=["admin@primarie.ro", "secretariat@primarie.ro"]

📖 Pentru ghid complet, vezi: SMTP_CONFIGURATION.md
""")

def main():
    print("🚀 TESTER CONFIGURAȚIE SMTP - Primăria Digitală")
    print("=" * 60)
    
    # Arată configurarea actuală
    print_config_summary()
    
    # Testează configurația
    config_ok = test_smtp_configuration()
    
    if not config_ok:
        provide_setup_guidance()
        print("\n❌ Configurația SMTP nu este completă. Rulați din nou după configurare.")
        return 1
    
    # Dacă configurația e OK, întreabă pentru test real
    print(f"\n✅ Configurația SMTP pare corectă!")
    
    test_email = input("\n📧 Introduceți un email pentru test (Enter pentru a sări): ").strip()
    
    if test_email:
        if "@" not in test_email:
            print("❌ Email invalid!")
            return 1
            
        print(f"\n🧪 Testez trimiterea email către {test_email}...")
        email_success = test_email_sending(test_email)
        
        if email_success:
            print(f"\n🎉 SUCCES! Sistemul SMTP funcționează corect!")
            print(f"📧 Verificați inbox-ul pentru {test_email}")
            return 0
        else:
            print(f"\n❌ Nu s-a putut trimite email-ul. Verificați configurația.")
            return 1
    else:
        print("\n✅ Test de configurație complet. Pentru test real, rulați din nou cu un email.")
        return 0

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⏹️  Test întrerupt de utilizator.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Eroare neașteptată: {e}")
        sys.exit(1)