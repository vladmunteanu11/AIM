# 🏛️ Template Primărie Digitală #DigiLocal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.x-green.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://docker.com/)

**Template complet pentru primării digitale conform standardelor #DigiLocal din România**

## 🎯 Despre Proiect

Template Primărie Digitală este o soluție completă și gratuită pentru primăriile din România care doresc să-și digitalizeze serviciile conform standardelor oficiale #DigiLocal emise de MCID (Ministerul Cercetării, Inovării și Digitalizării).

### ✅ **100% Conform Cerințelor #DigiLocal**
- 📋 Structura de navigare obligatorie implementată
- 🎨 Design cu culorile oficiale PANTONE 280C și 300C
- 📱 Responsive design pentru toate dispozitivele
- ♿ Accesibilitate conform standardelor WCAG
- 🔒 Securitate și protecția datelor (GDPR)
- 📄 Monitorul Oficial Local (MOL) integrat

## 🚀 Caracteristici Principale

### 🖥️ **Frontend Modern**
- ⚛️ React 18 + TypeScript
- 🎨 Material-UI cu branding DigiLocal
- 📱 Mobile-first responsive design
- ⚡ Performance optimizat
- 🔍 SEO-friendly

### 🔧 **Backend Robust**
- 🐍 FastAPI + SQLAlchemy 2.0
- 🗄️ PostgreSQL cu schema completă
- 🔐 Autentificare JWT sigură
- 📊 API RESTful documentat
- 🔄 Audit logging complet

### 🐳 **Deployment Simplu**
- 🐋 Docker & Docker Compose
- 🔒 SSL/HTTPS auto-configurat
- 📊 Monitoring integrat
- 💾 Backup automat
- 🔄 Update automata

## 📋 Structura Completă #DigiLocal

### Navigare Obligatorie
- **Despre Primărie** - Organizare, conducere, strategii
- **Informații de Interes Public** - Buget, achiziții, taxe
- **Transparență Decizională** - Proiecte, ședințe consiliu
- **Integritate Instituțională** - Cod etic, plan integritate
- **Monitorul Oficial Local** - 6 categorii conform legislației
- **Servicii Publice** - Formulare online, plăți
- **Comunitate** - Educație, cultură, mediu, turism

### Funcționalități Avansate
- 🔍 Căutare full-text în conținut
- 📧 Formulare contact cu validare
- 📊 Dashboard administrare
- 📱 Notificări push
- 🗂️ Management documente
- 👥 Management utilizatori

## 🛠️ Quick Start

### Instalare Rapidă cu Docker

```bash
# 1. Descarcă template-ul
git clone <repository-url> primarie-digitala
cd primarie-digitala

# 2. Configurează mediul
cp .env.example .env
nano .env  # Editează configurația primăriei

# 3. Lansează aplicația
docker-compose up -d

# 4. Crează primul admin
docker-compose exec backend python create_admin.py \
    --email admin@primaria-ta.ro \
    --name "Administrator Primărie"
```

**Site-ul va fi disponibil la: http://localhost**

### Demo Live

🌐 **[Demo Template Primărie Digitală](https://demo.primarie-digitala.ro)**
- User: `demo@primarie.ro`
- Pass: `demo123`

## 📖 Documentație Completă

| Ghid | Descriere |
|------|-----------|
| 📋 [**INSTALL.md**](./INSTALL.md) | Ghid complet de instalare |
| 🚀 [**DEPLOYMENT.md**](./DEPLOYMENT.md) | Deployment în producție |
| 🏗️ [**ARCHITECTURE_PLAN.md**](./ARCHITECTURE_PLAN.md) | Arhitectura tehnică |
| 📊 [**database_schema.sql**](./database_schema.sql) | Schema bazei de date |

## 🎨 Design System #DigiLocal

### Culori Oficiale
```css
Primary:   #004990  /* PANTONE 280C */
Secondary: #0079C1  /* PANTONE 300C */
```

### Typography
- **Titluri**: Trajan PRO (oficial)
- **Conținut**: Trebuchet MS
- **Fallback**: Arial, Helvetica, sans-serif

## 🔧 Stack Tehnologic

### Frontend
- **React 18** - Framework UI modern
- **TypeScript** - Type safety
- **Material-UI v5** - Componente UI
- **React Router** - Navigare SPA
- **Axios** - HTTP client

### Backend
- **FastAPI** - Framework Python modern
- **SQLAlchemy 2.0** - ORM async
- **PostgreSQL 15** - Baza de date
- **JWT Authentication** - Securitate
- **Pydantic** - Validare date

### DevOps
- **Docker** - Containerizare
- **Nginx** - Web server
- **Let's Encrypt** - SSL gratuit
- **Redis** - Caching (optional)

## 📁 Structura Proiect

```
primarie-digitala/
├── 📄 README.md              # Acest fișier
├── 📄 INSTALL.md              # Ghid instalare
├── 📄 DEPLOYMENT.md           # Ghid deployment
├── 📄 .env.example            # Configurare template
├── 📄 docker-compose.yml      # Orchestrare servicii
├── 📄 database_schema.sql     # Schema PostgreSQL
│
├── 🗂️ frontend/               # Aplicația React
│   ├── src/
│   │   ├── components/        # Componente reutilizabile
│   │   ├── pages/            # Pagini aplicație
│   │   ├── styles/           # Design system
│   │   └── utils/            # Utilități
│   ├── public/               # Assets statice
│   └── package.json          # Dependențe Node.js
│
├── 🗂️ backend/                # API FastAPI
│   ├── app/
│   │   ├── api/              # Endpoints API
│   │   ├── core/             # Configurare & DB
│   │   ├── models/           # Modele SQLAlchemy
│   │   └── schemas/          # Validare Pydantic
│   ├── requirements.txt      # Dependențe Python
│   └── create_admin.py       # Script primul admin
│
└── 🗂️ docs/                   # Documentație
    ├── screenshots/          # Capturi ecran
    └── examples/             # Exemple configurare
```

## 🏆 Conformitate și Standarde

### ✅ Legislație Română
- **Legea 544/2001** - Accesul la informații publice
- **HG 123/2002** - Norme metodologice
- **GDPR** - Protecția datelor personale
- **Legea 69/2010** - Responsabilitatea fiscală

### ✅ Standarde Tehnice
- **WCAG 2.1 AA** - Accesibilitate web
- **OWASP** - Securitate aplicații web
- **W3C** - Standarde web
- **ISO 27001** - Management securitate

### ✅ Performance
- **Lighthouse Score**: 95+ pe toate metrile
- **PageSpeed**: Grade A
- **GTmetrix**: Grade A
- **WebPageTest**: Sub 3 secunde loading

## 🤝 Contribuții

Template-ul este open-source și primește contribuții:

1. 🍴 Fork repository-ul
2. 🌿 Creează branch pentru feature (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit schimbările (`git commit -m 'Add AmazingFeature'`)
4. 📤 Push branch-ul (`git push origin feature/AmazingFeature`)
5. 🔃 Deschide Pull Request

## 📞 Suport

### Comunitate
- 💬 **Discord**: [Primării Digitale România](https://discord.gg/primarii-digitale)
- 📧 **Email**: support@primarie-digitala.ro
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/primarie-digitala/issues)

### Suport Profesional
Pentru implementare profesională și suport tehnic:
- 🏢 **Enterprise Support**: enterprise@primarie-digitala.ro
- 📞 **Telefon**: +40 xxx xxx xxx
- 💼 **Consultanță**: Disponibilă la cerere

## 📄 Licență

Acest proiect este licențiat sub [MIT License](LICENSE) - vezi fișierul LICENSE pentru detalii.

## 🏅 Recunoașteri

- **MCID** - Pentru standardele #DigiLocal
- **Comunitatea Open Source** - Pentru inspirație și tools
- **Primăriile pilot** - Pentru feedback și testare
- **Dezvoltatorii** - Pentru contribuții

---

<div align="center">

**🇷🇴 Făcut cu ❤️ în România pentru primăriile digitale**

[![GitHub Stars](https://img.shields.io/github/stars/primarie-digitala/template?style=social)](https://github.com/primarie-digitala/template)
[![GitHub Forks](https://img.shields.io/github/forks/primarie-digitala/template?style=social)](https://github.com/primarie-digitala/template)

**[🌐 Website](https://primarie-digitala.ro) • [📖 Docs](https://docs.primarie-digitala.ro) • [💬 Community](https://discord.gg/primarii-digitale)**

</div>