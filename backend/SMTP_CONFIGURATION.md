# 📧 Configurare SMTP pentru Sistemul de Notificări

## 🔧 Configurare generală în .env

Adaugă următoarele variabile în fișierul `.env`:

```env
# =====================================
# CONFIGURARE EMAIL/SMTP
# =====================================

# Server SMTP
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true

# Credentiale SMTP
SMTP_USERNAME=noreply@primarie-exemplu.ro
SMTP_PASSWORD=your_app_password_here

# Email-uri de sistem  
DEFAULT_FROM_EMAIL=noreply@primarie-exemplu.ro
DEFAULT_FROM_NAME=Primăria Exemplu

# Email-uri pentru notificări
ADMIN_EMAILS=["admin@primarie-exemplu.ro", "secretariat@primarie-exemplu.ro"]
FORMS_EMAIL=formulare@primarie-exemplu.ro
APPOINTMENTS_EMAIL=programari@primarie-exemplu.ro

# Informații primărie (pentru template-uri)
MUNICIPALITY_NAME=Comuna Exemplu
MUNICIPALITY_ADDRESS=Strada Principală nr. 1, Comuna Exemplu, Jud. Exemplu
MUNICIPALITY_PHONE=0256 123 456
MUNICIPALITY_EMAIL=contact@primarie-exemplu.ro
FRONTEND_URL=https://primarie-exemplu.ro
```

## 📋 Opțiuni SMTP pentru diferiți provideri

### 1. 📧 **Gmail / Google Workspace**
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=noreply@primarie-exemplu.ro
SMTP_PASSWORD=app_specific_password
```

**Pași pentru Gmail:**
1. Activează 2FA pe contul Google
2. Generează "App Password" din Security Settings
3. Folosește app password-ul în loc de parola normală

### 2. 🔷 **Microsoft 365 / Outlook**
```env
SMTP_SERVER=smtp.office365.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=noreply@primarie-exemplu.ro
SMTP_PASSWORD=your_password
```

### 3. 🟠 **Amazon SES**
```env
SMTP_SERVER=email-smtp.eu-west-1.amazonaws.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=your_ses_smtp_username
SMTP_PASSWORD=your_ses_smtp_password
```

### 4. 🟣 **SendGrid**
```env
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=apikey
SMTP_PASSWORD=your_sendgrid_api_key
```

### 5. 🔴 **Mailgun**
```env
SMTP_SERVER=smtp.mailgun.org
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=postmaster@mg.your-domain.com
SMTP_PASSWORD=your_mailgun_password
```

### 6. 🏢 **Server propriu / cPanel**
```env
SMTP_SERVER=mail.your-domain.com
SMTP_PORT=587  # sau 465 pentru SSL
SMTP_USE_TLS=true  # false pentru SSL
SMTP_USERNAME=noreply@your-domain.com
SMTP_PASSWORD=your_email_password
```

## 🔐 Securitate și Best Practices

### **1. Variabile de mediu securizate:**
```bash
# Nu pune niciodată credentialele în cod!
# Folosește doar variabile de mediu

# Pentru producție, folosește Azure Key Vault, AWS Secrets Manager etc.
SMTP_PASSWORD=${AZURE_KEYVAULT_SECRET}
```

### **2. Rate limiting pentru email:**
```env
# Limitări pentru evitarea spam-ului
EMAIL_RATE_LIMIT_PER_MINUTE=30
EMAIL_RATE_LIMIT_PER_HOUR=500
EMAIL_RATE_LIMIT_PER_DAY=2000
```

### **3. Configurare SSL/TLS:**
```env
# Pentru TLS (port 587) - recomandat
SMTP_USE_TLS=true
SMTP_PORT=587

# Pentru SSL (port 465) - alternativă
SMTP_USE_TLS=false
SMTP_PORT=465
```

## 🧪 Testare configurație SMTP

### **1. Test rapid din cod:**
```python
# În backend/test_email.py
import asyncio
from app.services.notification_service import NotificationService

async def test_smtp():
    result = NotificationService.test_email_configuration()
    print("Configurație SMTP:", result)
    
    if not result['errors']:
        print("✅ SMTP configurat corect!")
    else:
        print("❌ Probleme SMTP:", result['errors'])

asyncio.run(test_smtp())
```

### **2. Test prin API:**
```bash
# Verifică statusul configurației
curl -X GET "http://localhost:8001/api/v1/notifications/config/test"

# Trimite email de test
curl -X POST "http://localhost:8001/api/v1/notifications/test/send" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "subject": "Test SMTP Configuration",
    "message": "Dacă primești acest email, SMTP funcționează!"
  }'
```

## 🚀 Configurare pentru producție

### **1. Docker Compose cu secrets:**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    environment:
      - SMTP_SERVER=${SMTP_SERVER}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USERNAME=${SMTP_USERNAME}
    secrets:
      - smtp_password
    
secrets:
  smtp_password:
    external: true
```

### **2. Kubernetes ConfigMap/Secret:**
```yaml
# k8s-email-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: email-config
data:
  SMTP_SERVER: "smtp.gmail.com"
  SMTP_PORT: "587"
  SMTP_USE_TLS: "true"
---
apiVersion: v1
kind: Secret
metadata:
  name: email-secrets
type: Opaque
data:
  smtp_password: <base64_encoded_password>
```

## 📊 Monitoring și Logging

### **1. Logs pentru debugging:**
```python
# În app/core/email.py - pentru debugging
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_email(self, ...):
    logger.info(f"Attempting to send email to: {to_emails}")
    try:
        # ... send email logic
        logger.info(f"✅ Email sent successfully to: {to_emails}")
    except Exception as e:
        logger.error(f"❌ Failed to send email: {str(e)}")
```

### **2. Metrici pentru monitoring:**
```bash
# Adaugă în prometheus.yml pentru monitoring
- job_name: 'email_metrics'
  static_configs:
    - targets: ['backend:8001']
  metrics_path: /metrics
```

## 🔧 Troubleshooting common issues

### **Problem: "Authentication failed"**
```bash
# Soluții:
1. Verifică username/password sunt corecte
2. Pentru Gmail: folosește App Password, nu parola normală
3. Pentru 2FA: generează token specific aplicației
4. Verifică că contul nu e blocat
```

### **Problem: "Connection timeout"**
```bash
# Verifică:
1. SMTP_SERVER este corect
2. SMTP_PORT este corect (587 TLS, 465 SSL, 25 fără criptare)
3. Firewall-ul permite conexiuni pe portul respectiv
4. ISP-ul nu blochează SMTP
```

### **Problem: "SSL/TLS errors"**
```bash
# Pentru TLS (port 587):
SMTP_USE_TLS=true
SMTP_PORT=587

# Pentru SSL (port 465):
SMTP_USE_TLS=false  
SMTP_PORT=465
```

## 📋 Template de configurație pentru diferite scenarii

### **🏢 Primărie mică (Gmail)**
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=primaria.exemplu@gmail.com
SMTP_PASSWORD=your_gmail_app_password

DEFAULT_FROM_EMAIL=primaria.exemplu@gmail.com
DEFAULT_FROM_NAME=Primăria Exemplu

ADMIN_EMAILS=["primar@gmail.com", "secretar@gmail.com"]
FORMS_EMAIL=primaria.exemplu@gmail.com
APPOINTMENTS_EMAIL=primaria.exemplu@gmail.com
```

### **🏛️ Primărie mare (domeniu propriu)**
```env
SMTP_SERVER=mail.primarie-exemplu.ro
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=noreply@primarie-exemplu.ro
SMTP_PASSWORD=secure_password_123

DEFAULT_FROM_EMAIL=noreply@primarie-exemplu.ro
DEFAULT_FROM_NAME=Primăria Exemplu

ADMIN_EMAILS=["primar@primarie-exemplu.ro", "secretariat@primarie-exemplu.ro", "it@primarie-exemplu.ro"]
FORMS_EMAIL=formulare@primarie-exemplu.ro
APPOINTMENTS_EMAIL=programari@primarie-exemplu.ro
```

### **☁️ Primărie cu servicii cloud (SendGrid)**
```env
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=apikey
SMTP_PASSWORD=SG.your_sendgrid_api_key_here

DEFAULT_FROM_EMAIL=noreply@primarie-exemplu.ro
DEFAULT_FROM_NAME=Primăria Exemplu

ADMIN_EMAILS=["admin@primarie-exemplu.ro"]
FORMS_EMAIL=formulare@primarie-exemplu.ro
APPOINTMENTS_EMAIL=programari@primarie-exemplu.ro
```

## ✅ Checklist implementare

- [ ] **Configurare .env** cu credentialele SMTP
- [ ] **Test configurație** prin `/api/v1/notifications/config/test`
- [ ] **Test email real** prin `/api/v1/notifications/test/send`
- [ ] **Configurare DNS** (SPF, DKIM, DMARC pentru domeniu propriu)
- [ ] **Monitoring** - setup alertă pentru email-uri failed
- [ ] **Rate limiting** - configurare limite trimitere
- [ ] **Backup SMTP** - configurat server secundar
- [ ] **Template-uri** - personalizate cu logo/culori primărie
- [ ] **Cron jobs** - pentru reminder-uri programări

## 🎯 Recomandări finale

1. **Pentru development**: Gmail cu App Password
2. **Pentru producție mică**: Microsoft 365 sau Gmail Workspace  
3. **Pentru producție mare**: Amazon SES sau SendGrid
4. **Pentru siguranță maximă**: Server SMTP propriu cu certificat SSL

**Sistemul este gata pentru producție odată configurate credentialele SMTP!** 🚀