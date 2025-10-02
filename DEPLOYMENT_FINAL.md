# 🚀 Ghid de Deployment - Template Primărie Digitală #DigiLocal

## 📋 Cerințe de Sistem

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB 
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Recommended (Production)
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **Backup**: Automated daily backups
- **SSL**: Domain with valid certificate

## 🛠️ Instalare Rapidă

### 1. Descărcare Template
```bash
git clone <repository-url> primarie-digitala
cd primarie-digitala
```

### 2. Configurare Environment
```bash
# Copiază template-ul de configurare
cp .env .env.backup
nano .env

# Configurează datele primăriei tale
MUNICIPALITY_NAME="Primăria Orașului [Numele Tau]"
MUNICIPALITY_OFFICIAL_NAME="[Numele Complet Oficial]"
MAYOR_NAME="[Numele Primarului]"
CONTACT_EMAIL="contact@primaria-[oras].ro"
CONTACT_PHONE="[Telefon]"
MUNICIPALITY_ADDRESS="[Adresa Completă]"
```

### 3. Generare Chei de Securitate
```bash
# Generează cheie secretă sigură
SECRET_KEY=$(openssl rand -hex 32)
echo "SECRET_KEY=\"$SECRET_KEY\"" >> .env

# Configurează parolele bazei de date
echo "POSTGRES_PASSWORD=\"$(openssl rand -hex 16)\"" >> .env
```

### 4. Lansare Aplicație
```bash
# Build și pornire servicii
docker-compose up -d

# Verificare status
docker-compose ps
docker-compose logs -f
```

### 5. Configurare Inițială
```bash
# Creare primul administrator
docker-compose exec backend python create_admin.py \\
    --email admin@primaria-ta.ro \\
    --name "Numele Administratorului" \\
    --password "parolaInitiala123!"
```

## 🌍 Accesare Site

- **Site public**: http://localhost (sau http://domeniul-tau.ro)
- **Panou admin**: http://localhost/admin
- **API docs**: http://localhost/api/docs
- **Health check**: http://localhost/health

## ⚙️ Configurare Avansată

### SSL/HTTPS cu Let's Encrypt
```bash
# Instalează certbot
sudo apt install certbot

# Obține certificat SSL
sudo certbot --nginx -d domeniul-tau.ro -d www.domeniul-tau.ro

# Actualizează nginx.conf pentru HTTPS
# Restartează serviciile
docker-compose restart frontend
```

### Configurare SMTP (Email-uri)
```bash
# Editează .env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="noreply@primaria-ta.ro"
SMTP_PASSWORD="parola-aplicatie-gmail"
SMTP_TLS="true"
```

### Customizare Branding
```bash
# Logo primăriei (PNG, max 2MB)
cp logo-primarie.png frontend/public/assets/

# Culori personalizate (în .env)
PRIMARY_COLOR="#004990"    # PANTONE 280C oficial
SECONDARY_COLOR="#0079C1"  # PANTONE 300C oficial
```

## 📊 Monitoring și Mentenanță

### Backup Automat
```bash
# Script backup zilnic (crontab)
0 2 * * * /path/to/primarie-digitala/scripts/backup.sh
```

### Logs și Debugging
```bash
# Vezi logurile aplicației
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Monitoring în timp real
docker-compose logs -f --tail=100
```

### Update și Actualizări
```bash
# Backup înainte de update
./scripts/backup.sh

# Pull ultimele modificări
git pull origin main

# Rebuild și restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Verificare funcționalitate
curl http://localhost/health
```

## 🔐 Securitate și Compliance

### GDPR Compliance
- ✅ Consents pentru cookies
- ✅ Privacy policy template inclus
- ✅ Data retention policies
- ✅ Right to be forgotten implementat

### Security Checklist
- ✅ JWT tokens cu expirare
- ✅ Rate limiting pe API
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Security headers (nginx)

### Backup și Recovery
```bash
# Backup complet
./scripts/backup.sh full

# Restore din backup
./scripts/restore.sh backup-YYYY-MM-DD.tar.gz

# Test recovery
./scripts/test-recovery.sh
```

## 🆘 Troubleshooting

### Probleme Comune

**1. PostgreSQL nu pornește**
```bash
# Verifică logs
docker-compose logs postgres

# Reset volume (ATENȚIE: pierzi datele!)
docker-compose down -v
docker-compose up -d postgres
```

**2. Frontend nu se încarcă**
```bash
# Verifică nginx logs
docker-compose logs frontend

# Test direct backend
curl http://localhost:8000/api/v1/municipality/config
```

**3. SSL/HTTPS issues**
```bash
# Verifică certificatul
sudo certbot certificates

# Renew certificat
sudo certbot renew --dry-run
```

**4. Performance issues**
```bash
# Monitoring resurse
docker stats

# Creștere resurse în docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

## 📞 Suport

### Documentație
- **Ghid utilizare**: [USAGE.md](./USAGE.md)
- **API Reference**: http://localhost/api/docs
- **Video tutorials**: [Link la playlist]

### Contact
- **Email suport**: support@primarie-digitala.ro
- **Issues GitHub**: [Link la issues]
- **Community Discord**: [Link la Discord]

---

## ✅ Checklist Deployment

- [ ] Server configurat cu cerințe minime
- [ ] Docker și Docker Compose instalate
- [ ] Repository clonat și configurat
- [ ] .env personalizat pentru primăria ta
- [ ] Chei de securitate generate
- [ ] Servicii pornite cu docker-compose
- [ ] Primul admin creat
- [ ] SSL configurat (pentru producție)
- [ ] SMTP configurat pentru email-uri
- [ ] Backup programat
- [ ] Monitoring configurat
- [ ] Logo și branding personalizat
- [ ] Testing funcționalități cheie
- [ ] Team instruct pentru administrare

**🎉 Felicitări! Template-ul Primărie Digitală este gata pentru producție!**