# 🚀 SMTP Quick Start - Primăria Digitală

## ⚡ Configurare rapidă în 5 minute

### **Pasul 1: Copiază template-ul**
```bash
cp .env.smtp.example .env.local
```

### **Pasul 2: Alege providerul SMTP**

#### 📧 **Gmail (cel mai simplu pentru test)**
```bash
# În .env adaugă:
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=your.email@gmail.com
SMTP_PASSWORD=your_app_password  # Nu parola normală!
```

**Cum obții App Password pentru Gmail:**
1. Du-te la [Google Account Security](https://myaccount.google.com/security)
2. Activează 2-Factor Authentication 
3. Mergi la "App passwords" 
4. Generează password pentru "Mail"
5. Folosește password-ul generat în .env

### **Pasul 3: Configurează email-urile**
```bash
# În .env completează:
DEFAULT_FROM_EMAIL=noreply@primarie-exemplu.ro
ADMIN_EMAILS=["your.email@gmail.com"]  # Pentru notificări admin
MUNICIPALITY_EMAIL=contact@primarie-exemplu.ro
```

### **Pasul 4: Testează configurația**
```bash
python test_smtp.py
```

### **Pasul 5: Test email real**
Când script-ul îți cere, introdu email-ul tău pentru a primi un test real.

---

## 🎯 Configurări rapide pentru provideri populari

### **Gmail Workspace**
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=noreply@your-domain.com
SMTP_PASSWORD=your_workspace_password
```

### **Microsoft 365**
```env
SMTP_SERVER=smtp.office365.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=noreply@your-domain.com
SMTP_PASSWORD=your_office365_password
```

### **SendGrid (pentru volume mari)**
```env
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=apikey
SMTP_PASSWORD=SG.your_sendgrid_api_key
```

---

## ⚠️  Troubleshooting rapid

### **"Authentication failed"**
- Pentru Gmail: folosești App Password (nu parola normală)?
- Username-ul este corect (email complet)?
- Password-ul nu conține spații/caractere speciale nedorite?

### **"Connection timeout"**
- Server-ul este corect (`smtp.gmail.com` pentru Gmail)?
- Port-ul este corect (587 pentru TLS)?
- Firewall-ul blochează port-ul 587?

### **"SSL/TLS error"**
- Pentru port 587: `SMTP_USE_TLS=true`
- Pentru port 465: `SMTP_USE_TLS=false`

---

## 🧪 Testare completă

```bash
# 1. Verifică configurația
curl http://localhost:8001/api/v1/notifications/config/test

# 2. Trimite email de test
curl -X POST http://localhost:8001/api/v1/notifications/test/send \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","subject":"Test SMTP"}'

# 3. Verifică stats
curl http://localhost:8001/api/v1/notifications/stats
```

---

## 🎉 Gata! Sistemul tău de email funcționează

Odată configurat SMTP, sistemul va trimite automat:
- ✉️ Confirmări pentru formulare noi
- 📅 Confirmări pentru programări  
- ⏰ Reminder-uri cu o zi înainte
- 📊 Notificări schimbare status
- 🔧 Email-uri de test și debug

**Pentru configurare avansată, vezi `SMTP_CONFIGURATION.md`**