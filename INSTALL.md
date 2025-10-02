# 🏛️ Template Primărie Digitală - Ghid de Instalare

## 📋 Cerințe de Sistem

### Minimum Requirements
- **CPU**: 2 cores (2.0 GHz)
- **RAM**: 4 GB
- **Storage**: 20 GB available space
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **Network**: Conexiune la internet pentru descărcarea dependențelor

### Recommended Requirements
- **CPU**: 4 cores (2.5 GHz)
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Network**: Conexiune stabilă la internet

## 🛠️ Instalare Rapidă cu Docker

### 1. Instalare Docker și Docker Compose

#### Ubuntu/Debian:
```bash
# Actualizare sistem
sudo apt update && sudo apt upgrade -y

# Instalare Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalare Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Restart pentru aplicarea permisiunilor
newgrp docker
```

#### CentOS/RHEL:
```bash
# Instalare Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Instalare Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Descărcare Template

```bash
# Clonează sau descarcă template-ul
git clone <repository-url> primarie-digitala
cd primarie-digitala

# SAU descarcă și extrage arhiva
wget <download-url> -O primarie-digitala.zip
unzip primarie-digitala.zip
cd primarie-digitala
```

### 3. Configurare Rapidă

```bash
# Copiază fișierul de configurare
cp .env.example .env

# Editează configurația
nano .env
```

Configurația minimă în `.env`:
```bash
# Configurația Primăriei
MUNICIPALITY_NAME="Primăria Ta"
MUNICIPALITY_OFFICIAL_NAME="Comuna/Orașul Ta, Județul Ta"
MAYOR_NAME="Numele Primarului"
CONTACT_EMAIL="contact@primaria-ta.ro"
CONTACT_PHONE="0256 XXX XXX"
MUNICIPALITY_ADDRESS="Adresa Primăriei"

# Securitate (OBLIGATORIU DE SCHIMBAT!)
SECRET_KEY="schimba-aceasta-cheie-foarte-secreta-si-lunga"
POSTGRES_PASSWORD="schimba-parola-bazei-de-date"

# Domeniu
DOMAIN_NAME="primaria-ta.ro"
```

### 4. Lansare Aplicație

```bash
# Pornire în modul production
docker-compose up -d

# Verificare status
docker-compose ps

# Vizualizare logs
docker-compose logs -f
```

Site-ul va fi disponibil la: `http://localhost` sau `http://IP-SERVER`

## 🔧 Instalare Manuală (Fără Docker)

### 1. Instalare Dependențe

#### Backend (Python):
```bash
# Python 3.9+
sudo apt install python3 python3-pip python3-venv

# PostgreSQL
sudo apt install postgresql postgresql-contrib

# Creează mediul virtual
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Frontend (Node.js):
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# Instalare dependențe
cd frontend
npm install
npm run build
```

### 2. Configurare PostgreSQL

```bash
# Pornire PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Creare utilizator și bază de date
sudo -u postgres psql
```

În PostgreSQL:
```sql
CREATE USER primarie_user WITH PASSWORD 'parola_sigura';
CREATE DATABASE primarie_digital OWNER primarie_user;
GRANT ALL PRIVILEGES ON DATABASE primarie_digital TO primarie_user;
\q
```

```bash
# Aplicare schema
psql -U primarie_user -d primarie_digital -f database_schema.sql
```

### 3. Configurare Backend

```bash
# Variabile de mediu
export DATABASE_URL="postgresql://primarie_user:parola_sigura@localhost/primarie_digital"
export SECRET_KEY="cheia-ta-foarte-secreta"

# Pornire server
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4. Configurare Frontend

```bash
# Servire fișiere statice cu Nginx
sudo apt install nginx

# Copiază fișierele build
sudo cp -r frontend/build/* /var/www/html/

# Configurează Nginx
sudo cp nginx.conf /etc/nginx/sites-available/primarie
sudo ln -s /etc/nginx/sites-available/primarie /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔐 Configurare SSL/HTTPS (Recommended)

### Cu Certbot (Let's Encrypt):

```bash
# Instalare Certbot
sudo apt install certbot python3-certbot-nginx

# Obținere certificat SSL
sudo certbot --nginx -d primaria-ta.ro -d www.primaria-ta.ro

# Auto-renewal
sudo crontab -e
# Adaugă: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🎛️ Configurare Inițială Admin

### 1. Acces Interfață Admin

Navighează la: `http://primaria-ta.ro/admin`

### 2. Primul Admin

```bash
# Crează primul utilizator admin via CLI
cd backend
source venv/bin/activate
python create_admin.py --email admin@primaria-ta.ro --password parola_temporara
```

### 3. Configurare Primărie

1. Logează-te în panoul admin
2. Accesează **Configurare Primărie**
3. Completează toate câmpurile obligatorii:
   - Numele primăriei
   - Informații contact
   - Logo oficial
   - Culori personalizate
   - Program de funcționare

## 📊 Monitorizare și Backup

### Logs:
```bash
# Docker
docker-compose logs -f backend
docker-compose logs -f frontend

# Manual
tail -f backend/logs/app.log
tail -f /var/log/nginx/access.log
```

### Backup Bază de Date:
```bash
# Backup automat zilnic
sudo crontab -e
# Adaugă: 0 2 * * * /usr/local/bin/backup_primarie.sh

# Script backup
cat > /usr/local/bin/backup_primarie.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U primarie_user primarie_digital > /backups/primarie_${DATE}.sql
find /backups -name "primarie_*.sql" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup_primarie.sh
```

## 🔄 Update și Mentenanță

### Update Template:
```bash
# Backup înainte de update
docker-compose exec postgres pg_dump -U primarie_user primarie_digital > backup_before_update.sql

# Download noua versiune
git pull origin main

# Update și restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Mentenanță Regulată:
```bash
# Curățare Docker images vechi
docker system prune -a

# Verificare space disk
df -h

# Verificare logs mari
find /var/log -name "*.log" -size +100M
```

## 🆘 Troubleshooting

### Probleme Comune:

1. **Site nu se încarcă**:
   ```bash
   # Verifică serviciile
   docker-compose ps
   systemctl status nginx
   ```

2. **Erori bază de date**:
   ```bash
   # Verifică conexiunea
   docker-compose exec postgres psql -U primarie_user -d primarie_digital -c "SELECT 1;"
   ```

3. **Probleme SSL**:
   ```bash
   # Verifică certificatul
   sudo certbot certificates
   ```

4. **Performance issues**:
   ```bash
   # Monitorizare resurse
   htop
   docker stats
   ```

## 📞 Suport

Pentru suport tehnic și întrebări:
- 📧 Email: support@primarie-digitala.ro
- 📖 Documentație: [docs.primarie-digitala.ro]
- 🐛 Bug Reports: [github.com/primarie-digitala/issues]

---

**🎉 Felicitări! Template-ul Primărie Digitală este acum instalat și funcțional conform standardelor #DigiLocal!**