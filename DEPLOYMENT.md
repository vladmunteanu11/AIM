# 🚀 Template Primărie Digitală - Ghid de Deployment

## 📋 Checklist Pre-Deployment

### ✅ Pregătire Server

- [ ] Server cu Ubuntu 20.04+ / CentOS 8+ instalat
- [ ] Accès SSH cu chei publice
- [ ] Domeniu configurat și DNS pointând către server
- [ ] Certificate SSL obținute (Let's Encrypt recomandat)
- [ ] Firewall configurat (porturi 80, 443, 22)
- [ ] Backup strategie implementată

### ✅ Configurație Aplicație

- [ ] Toate variabilele din `.env` completate
- [ ] Chei secrete generate și sigure
- [ ] Logo și imagini primăriei încărcate
- [ ] Informații contact verificate
- [ ] Email SMTP configurat și testat

## 🐳 Deployment cu Docker (Recomandat)

### 1. Pregătire Server

```bash
# Conectare la server
ssh root@your-server-ip

# Actualizare sistem
apt update && apt upgrade -y

# Instalare Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalare Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verificare instalare
docker --version
docker-compose --version
```

### 2. Configurare Firewall

```bash
# UFW (Ubuntu)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Verificare status
ufw status verbose
```

### 3. Transfer și Configurare Aplicație

```bash
# Creează directorul aplicației
mkdir -p /opt/primarie-digitala
cd /opt/primarie-digitala

# Transfer fișiere (de pe mașina locală)
scp -r . root@your-server-ip:/opt/primarie-digitala/

# SAU clonează din repository
git clone <repository-url> .
```

### 4. Configurare Environment

```bash
# Copiază și editează configurația
cp .env.example .env
nano .env
```

**Configurații CRITICE de schimbat:**
```bash
# Securitate
SECRET_KEY="genereaza-o-cheie-foarte-lunga-si-complexa-aici"
POSTGRES_PASSWORD="parola-foarte-sigura-pentru-baza-de-date"

# Domeniu
DOMAIN_NAME="primaria-ta.ro"
ALLOWED_HOSTS="primaria-ta.ro,www.primaria-ta.ro"

# Primăria ta
MUNICIPALITY_NAME="Primăria Ta"
CONTACT_EMAIL="contact@primaria-ta.ro"
# ... toate datele primăriei
```

### 5. SSL și HTTPS Setup

```bash
# Instalare Certbot
apt install certbot python3-certbot-nginx

# Oprește temporar orice serviciu pe port 80
docker-compose down 2>/dev/null || true

# Obține certificat SSL
certbot certonly --standalone -d primaria-ta.ro -d www.primaria-ta.ro

# Verifică certificatele
ls -la /etc/letsencrypt/live/primaria-ta.ro/
```

### 6. Actualizare Nginx pentru SSL

Creează `/opt/primarie-digitala/nginx-ssl.conf`:
```nginx
server {
    listen 80;
    server_name primaria-ta.ro www.primaria-ta.ro;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name primaria-ta.ro www.primaria-ta.ro;
    
    ssl_certificate /etc/letsencrypt/live/primaria-ta.ro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/primaria-ta.ro/privkey.pem;
    
    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # API Proxy
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Health Check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 7. Actualizare Docker Compose pentru SSL

Editează `docker-compose.yml`:
```yaml
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: primarie_frontend
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./nginx-ssl.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - primarie_network
    restart: unless-stopped
```

### 8. Lansare Aplicație

```bash
# Pornire servicii
docker-compose up -d

# Verificare status
docker-compose ps

# Monitorizare logs
docker-compose logs -f
```

### 9. Verificare Deployment

```bash
# Test conectivitate
curl -I https://primaria-ta.ro

# Test SSL
openssl s_client -connect primaria-ta.ro:443 -servername primaria-ta.ro

# Test API
curl https://primaria-ta.ro/api/v1/municipality/config
```

## 📊 Monitoring și Backup

### 1. Setup Monitoring

```bash
# Crează script de monitorizare
cat > /opt/primarie-digitala/monitoring.sh << 'EOF'
#!/bin/bash

# Check services
docker-compose ps | grep -q "Up" || echo "ALERT: Some services are down!"

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "ALERT: Disk usage is ${DISK_USAGE}%"
fi

# Check SSL expiry
DAYS_TO_EXPIRE=$(openssl x509 -checkend 604800 -noout -in /etc/letsencrypt/live/primaria-ta.ro/cert.pem)
if [ $? -ne 0 ]; then
    echo "ALERT: SSL certificate expires in less than 7 days"
fi
EOF

chmod +x /opt/primarie-digitala/monitoring.sh

# Adaugă la crontab pentru monitorizare zilnică
echo "0 8 * * * /opt/primarie-digitala/monitoring.sh | mail -s 'Primarie Monitoring' admin@primaria-ta.ro" | crontab -
```

### 2. Setup Backup

```bash
# Crează script de backup
cat > /opt/primarie-digitala/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/backups/primarie"
DATE=$(date +%Y%m%d_%H%M%S)

# Crează director backup
mkdir -p $BACKUP_DIR

# Backup baza de date
docker-compose exec -T postgres pg_dump -U primarie_user primarie_digital > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /opt/primarie-digitala backend/uploads/

# Backup configurație
cp /opt/primarie-digitala/.env $BACKUP_DIR/config_$DATE.env

# Curățare backup-uri vechi (păstrează 30 zile)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.env" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/primarie-digitala/backup.sh

# Backup zilnic la 2 AM
echo "0 2 * * * /opt/primarie-digitala/backup.sh" | crontab -
```

### 3. SSL Auto-Renewal

```bash
# Test renewal
certbot renew --dry-run

# Adaugă auto-renewal la crontab
echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose restart frontend" | crontab -
```

## 🔄 Update și Mentenanță

### Update Template

```bash
cd /opt/primarie-digitala

# Backup înainte de update
./backup.sh

# Download ultima versiune
git pull origin main

# Rebuild și restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Verificare update
docker-compose logs -f
```

### Mentenanță Regulată

```bash
# Curățare Docker
docker system prune -a -f

# Verificare logs mari
find /var/lib/docker -name "*.log" -size +100M -exec rm {} \;

# Update sistem
apt update && apt upgrade -y && reboot
```

## 🆘 Troubleshooting Deployment

### 1. Site nu se încarcă

```bash
# Verifică serviciile
docker-compose ps
systemctl status docker

# Verifică porturile
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# Verifică logs
docker-compose logs frontend
docker-compose logs backend
```

### 2. SSL Issues

```bash
# Verifică certificatele
certbot certificates

# Test SSL
openssl s_client -connect primaria-ta.ro:443

# Renew manual
certbot renew --force-renewal
```

### 3. Database Issues

```bash
# Conectare la baza de date
docker-compose exec postgres psql -U primarie_user -d primarie_digital

# Verifică conexiunea
docker-compose exec backend python -c "from app.core.database import engine; print('DB OK')"
```

### 4. Performance Issues

```bash
# Monitorizare resurse
htop
docker stats

# Verifică disk space
df -h

# Optimizare PostgreSQL
docker-compose exec postgres psql -U primarie_user -d primarie_digital -c "VACUUM ANALYZE;"
```

## 📞 Post-Deployment

### 1. Configurare Inițială Admin

1. Navighează la `https://primaria-ta.ro/admin`
2. Crează primul cont de administrator
3. Configurează toate setările primăriei
4. Testează toate funcționalitățile

### 2. Content și Personalizare

1. Încarcă logo-ul oficial
2. Adaugă conținut pentru toate paginile
3. Configurează anunțurile
4. Testează formularul de contact

### 3. SEO și Performance

1. Configurează Google Analytics
2. Adaugă site-ul în Google Search Console
3. Testează viteza cu PageSpeed Insights
4. Verifică conformitatea cu WebAIM

---

**🎉 Deployment complet! Site-ul primăriei este acum live și conform cu standardele #DigiLocal!**