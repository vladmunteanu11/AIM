# Template Primărie Digitală - Documentație Tehnică

## 📋 Prezentare Generală

Template Primărie Digitală este o soluție completă pentru digitalizarea serviciilor publice locale, conformă cu standardele DigiLocal din România. Platforma oferă servicii online pentru cetățeni și instrumente administrative pentru personalul primăriei.

## 🚀 Funcționalități Principale

### Pentru Cetățeni
- **Sesizări și Reclamații** - Raportarea problemelor din comunitate
- **Formulare Administrative** - Certificate, autorizații și alte acte oficiale
- **Programări Online** - Programarea întâlnirilor la ghișeele primăriei
- **Plăți Online** - Integrare cu Ghișeul.ro pentru taxe și impozite
- **Căutare Sesizări** - Urmărirea statusului sesizărilor existente

### Pentru Administrație
- **Dashboard de Gestiune** - Monitorizarea activității
- **Gestionarea Sesizărilor** - Procesarea și răspunsul la sesizări
- **Administrarea Cererilor** - Gestionarea formularelor administrative
- **Rapoarte și Statistici** - Analiză detaliată a activității
- **Configurare Municipalitate** - Personalizarea platformei

## 🛠️ Stack Tehnologic

### Frontend
- **React 19** - Framework-ul principal
- **TypeScript** - Tipizare statică
- **Material-UI (MUI)** - Biblioteca de componente UI
- **React Router** - Navigarea în aplicație
- **Axios** - Client HTTP
- **date-fns** - Manipularea datelor

### Backend
- **FastAPI** - Framework web Python
- **PostgreSQL** - Baza de date
- **SQLAlchemy** - ORM
- **Alembic** - Migrații de bază de date
- **JWT** - Autentificare
- **Docker** - Containerizare

## 🎨 Design System DigiLocal

### Paleta de Culori
```css
/* Culorile oficiale conform PDF DigiLocal */
--primary-color: #004990;    /* PANTONE 280C */
--secondary-color: #0079C1;  /* PANTONE 300C */
--background: #F8FAFC;
--surface: #FFFFFF;
```

### Tipografie
- **Font Principal**: Trebuchet MS, Arial, sans-serif
- **Font Oficial**: Trajan Pro (pentru titluri importante)

### Componente UI Moderne
- **Gradient Buttons** - Butoane cu efecte gradient
- **Glass Morphism** - Efecte de sticlă pentru header
- **Animated Cards** - Carduri cu animații fluide
- **Modern Shadows** - Umbre moderne pentru depth

## 📁 Structura Proiectului

```
aim/
├── frontend/                 # Aplicația React
│   ├── public/              # Fișiere publice
│   ├── src/
│   │   ├── components/      # Componente reutilizabile
│   │   │   ├── admin/       # Componente pentru admin
│   │   │   ├── forms/       # Componente pentru formulare
│   │   │   ├── layout/      # Layout components (Header, Footer)
│   │   │   └── ui/          # Componente UI personalizate
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Pagini ale aplicației
│   │   │   ├── admin/       # Pagini de administrare
│   │   │   └── public/      # Pagini publice
│   │   ├── services/        # Servicii API
│   │   ├── styles/          # Stiluri și teme
│   │   └── types/           # Tipuri TypeScript
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── api/            # Endpoint-uri API
│   │   ├── core/           # Configurare și utilități
│   │   ├── models/         # Modele de date
│   │   ├── schemas/        # Scheme Pydantic
│   │   └── services/       # Logica de business
├── docker-compose.yml       # Configurare Docker
└── README.md               # Documentația principală
```

## 🔧 Instalare și Configurare

### Cerințe Sistem
- Node.js 18+ și npm
- Python 3.9+
- PostgreSQL 13+
- Docker și Docker Compose (opțional)

### Instalare Frontend
```bash
cd frontend
npm install
npm start
```

### Instalare Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### Cu Docker
```bash
docker-compose up -d
```

## 🗃️ Baza de Date

### Tabele Principale
- **municipality_config** - Configurația primăriei
- **admin_users** - Utilizatori administrativi
- **complaints** - Sesizări și reclamații
- **complaint_categories** - Categorii de sesizări
- **form_types** - Tipuri de formulare
- **form_submissions** - Cererile administrative
- **appointments** - Programările online

## 🔐 Securitate și Autentificare

### Autentificare JWT
- **Access Token** - Validitate 30 minute
- **Refresh Token** - Validitate 7 zile
- **Roluri**: `super_admin`, `admin`, `user`

### Securitate Frontend
- Validare input-urilor
- Sanitizare date
- Protecție CSRF
- Headers de securitate

## 📊 Servicii și API

### Servicii Mock Implementate
Pentru dezvoltare fără backend, au fost implementate servicii mock complete:

#### FormsService - Mock Data
```typescript
// 6 tipuri de formulare administrative
const mockFormTypes = [
  {
    id: 1,
    name: 'Certificat de Urbanism',
    slug: 'certificat-urbanism',
    estimated_processing_days: 15,
    required_documents: ['Copie CI', 'Extras cadastral', 'Dovada proprietății']
  },
  // ... alte formulare
];
```

#### ComplaintsService - Mock Data
```typescript
// 6 categorii de sesizări
const mockCategories = [
  {
    id: 1,
    name: 'Infrastructură și Drumuri',
    response_time_hours: 24,
    resolution_time_days: 30
  },
  // ... alte categorii
];
```

#### AppointmentsService - Mock Data
```typescript
// 4 servicii de programări
const mockServices = [
  {
    id: 1,
    name: 'Eliberare Certificate',
    duration_minutes: 30,
    max_daily_appointments: 20
  },
  // ... alte servicii
];
```

## 🎨 Componentele UI Personalizate

### AnimatedCard
```typescript
// Card cu animații și efecte hover
<AnimatedCard customVariant="elevation">
  <CardContent>Conținutul cardului</CardContent>
</AnimatedCard>
```

### GradientButton
```typescript
// Buton cu gradient și efecte moderne
<GradientButton variant="primary" size="large">
  Click Me
</GradientButton>
```

### FloatingActionButton
```typescript
// FAB cu animații fluide
<FloatingActionButton color="primary">
  <AddIcon />
</FloatingActionButton>
```

## 🔧 Configurări Importante

### Tema Personalizată (theme.ts)
```typescript
export const digiLocalTheme = createTheme({
  palette: {
    primary: { main: '#004990' },
    secondary: { main: '#0079C1' }
  },
  typography: {
    fontFamily: 'Trebuchet MS, Arial, sans-serif'
  },
  components: {
    // Customizări pentru componente MUI
  }
});
```

### Configurare API (api.ts)
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

export const apiService = {
  get: <T>(url: string) => Promise<T>,
  post: <T>(url: string, data?: any) => Promise<T>,
  // ... alte metode
};
```

## 📱 Responsive Design

### Breakpoints
- **xs**: 0px
- **sm**: 600px
- **md**: 900px
- **lg**: 1200px
- **xl**: 1536px

### Mobile-First Approach
Toate componentele sunt dezvoltate cu abordarea mobile-first și sunt complet responsive.

## ✨ Funcționalități Speciale

### Header Glassmorphism
```typescript
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#FFFFFF',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 4px 20px rgba(0, 73, 144, 0.08)'
}));
```

### Contact Bar cu Text Alb
```typescript
const ContactBar = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  '& *': {
    color: '#ffffff !important'
  }
}));
```

## 🐛 Debugging și Logging

### Console Logging
```typescript
// Toate serviciile au logging detaliat
console.log('Form types loaded:', this.mockFormTypes);
console.error('Error loading services:', error);
```

### Error Handling
```typescript
try {
  const data = await service.getData();
  setData(data);
} catch (error) {
  setError('Mesaj de eroare user-friendly');
  console.error('Detailed error:', error);
}
```

## 📦 Build și Deployment

### Build Frontend
```bash
npm run build
# Generează directorul build/ cu fișierele optimizate
```

### Build Backend
```bash
# Folosind Docker
docker build -t primarie-backend .
```

### Environment Variables
```bash
# Frontend (.env)
REACT_APP_API_URL=http://localhost:8001
REACT_APP_ENVIRONMENT=development

# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost/db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 🔍 Căutare și Filtrare

### Căutare Sesizări
```typescript
// Căutare după numărul de referință
const result = await complaintsService.searchByReference(referenceNumber);
```

### Filtrare Formulare
```typescript
// Filtrare după tip și status
const forms = await formsService.getFormSubmissions({
  form_type_id: 1,
  status: 'pending'
});
```

## 📈 Performanță și Optimizare

### Code Splitting
- Lazy loading pentru rute
- Bundle splitting pentru vendor libraries
- Tree shaking pentru eliminarea codului neutilizat

### Caching
- Service Worker pentru caching static assets
- Memory caching pentru date frecvent accesate
- LocalStorage pentru preferințe utilizator

## 🧪 Testing

### Unit Tests
```bash
npm test
# Rulează testele cu Jest și React Testing Library
```

### E2E Tests
```bash
npm run e2e
# Rulează testele end-to-end cu Cypress
```

## 📋 Checklist Implementare

### ✅ Finalizate
- [x] Design system DigiLocal complet
- [x] Header și Footer moderne cu glassmorphism
- [x] Servicii mock complete pentru dezvoltare offline
- [x] Formulare administrative funcționale
- [x] Sistem de programări online
- [x] Gestionarea sesizărilor
- [x] Responsive design complet
- [x] Componente UI personalizate
- [x] Tema și stilizare conformă DigiLocal
- [x] Validări și error handling

### 🔄 În Progres
- [ ] Integrare completă cu backend
- [ ] Testare automată
- [ ] Optimizări performanță

### 📅 Planificate
- [ ] PWA (Progressive Web App)
- [ ] Notificări push
- [ ] Integrare cu servicii guvernamentale
- [ ] Multi-limbă (română/maghiară)

## 🤝 Contribuții

### Standarde Cod
- ESLint și Prettier pentru formatare
- Conventional commits pentru mesajele de commit
- TypeScript strict mode
- Componente funcționale cu hooks

### Git Workflow
```bash
# Crearea unei noi funcționalități
git checkout -b feature/nume-functionalitate
git add .
git commit -m "feat: adaugă funcționalitate nouă"
git push origin feature/nume-functionalitate
```

## 📞 Suport și Contact

Pentru întrebări tehnice sau probleme:
- **Email**: support@primarie-digitala.ro
- **GitHub Issues**: [Repository Issues](https://github.com/your-org/primarie-digitala)
- **Documentație**: [Wiki](https://github.com/your-org/primarie-digitala/wiki)

## 📝 Changelog

### v2.0.0 (Actuala versiune)
- ✨ Design system modern cu glassmorphism
- ✨ Mock services complete pentru dezvoltare offline
- ✨ Header și footer redesign
- ✨ Componente UI personalizate
- 🐛 Fix pentru vizibilitatea textului în contact bar
- 🐛 Rezolvarea erorilor în paginile de formulare și programări

### v1.0.0 (Versiunea inițială)
- 🎉 Lansarea inițială a platformei
- 📋 Funcționalități de bază pentru sesizări
- 👥 Panel de administrare
- 🎨 Design conform standardelor DigiLocal

---

**Această documentație este actualizată la data de: 7 Septembrie 2025**

*Template Primărie Digitală - Soluție completă pentru digitalizarea serviciilor publice locale în România*