/**
 * Aplicația principală React pentru Template Primărie Digitală
 * Implementează routing-ul și structura generală conform PDF DigiLocal
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress, Typography } from '@mui/material';

// Import theme
import { digiLocalTheme } from './styles/theme';

// Import layout components
import Layout from './components/layout/Layout';

// Import pages
import HomePage from './pages/public/HomePage';
import ServiciiOnlinePage from './pages/public/ServiciiOnlinePage';
import FormularSesizariPage from './pages/public/FormularSesizariPage';
import CautareSesizarePage from './pages/public/CautareSesizarePage';
import FormulareOnlinePage from './pages/public/FormulareOnlinePage';
import FormularSpecificPage from './pages/public/FormularSpecificPage';
import PlatiOnlinePage from './pages/public/PlatiOnlinePage';
import MockGhiseulPage from './pages/public/MockGhiseulPage';
import PaymentSuccessPage from './pages/public/PaymentSuccessPage';
import VerificarePlatiPage from './pages/public/VerificareStandardPage';
import ProgramariOnlinePage from './pages/public/ProgramariOnlinePage';
import CautareProgramarePage from './pages/public/CautareProgramarePage';
import SearchResultsPage from './pages/public/SearchResultsPage';
import SitemapPage from './pages/public/SitemapPage';
import DesprePrimariePage from './pages/public/DesprePrimariePage';
import OrganizarePage from './pages/public/OrganizarePage';
import ConducerePage from './pages/public/ConducerePage';

// Import admin pages
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import ComplaintsManagementPage from './pages/admin/ComplaintsManagementPage';
import AppointmentsManagementPage from './pages/admin/AppointmentsManagementPage';
import ReportsPage from './pages/admin/ReportsPage';
import { ConfigurationPage } from './pages/admin/ConfigurationPage';
import { AnnouncementsPage } from './pages/admin/AnnouncementsPage';
import DocumentsAdminPage from './pages/admin/DocumentsAdminPage';
import MunicipalityAdminPage from './pages/admin/MunicipalityAdminPage';
import SuperAdminPage from './pages/admin/SuperAdminPage';
import { AdminLayout } from './components/admin/AdminLayout';

// Import hook pentru configurația primăriei
import { useMunicipalityConfig } from './hooks/useMunicipalityConfig';
// Componente placeholder pentru routing complet
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>Pagina: {title}</h1>
    <p>Această pagină va fi implementată conform cerințelor DigiLocal.</p>
  </div>
);

// Componenta de loading
const LoadingScreen: React.FC = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      gap: 2
    }}
  >
    <CircularProgress size={60} />
    <Typography variant="h6" color="text.secondary">
      Se încarcă configurația primăriei...
    </Typography>
  </Box>
);

function App() {
  const { config: municipalityConfig, loading, error } = useMunicipalityConfig();

  if (loading) {
    return (
      <ThemeProvider theme={digiLocalTheme}>
        <CssBaseline />
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  if (error && !municipalityConfig) {
    return (
      <ThemeProvider theme={digiLocalTheme}>
        <CssBaseline />
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            gap: 2,
            p: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="h5" color="error">
            Eroare la încărcarea configurației
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {error}
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }
  return (
    <ThemeProvider theme={digiLocalTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Layout principal cu toate paginile publice */}
          <Route 
            path="/" 
            element={<Layout municipalityConfig={municipalityConfig || undefined} />}
          >
            {/* Pagina principală */}
            <Route index element={<HomePage />} />
            
            {/* Structura de navigare obligatorie conform PDF DigiLocal */}
            
            {/* Despre Primărie */}
            <Route path="/despre-primarie" element={<DesprePrimariePage />} />
            <Route path="/despre-primarie/organizare" element={<OrganizarePage />} />
            <Route path="/despre-primarie/conducere" element={<ConducerePage />} />
            <Route path="/despre-primarie/strategia-dezvoltare" element={<PlaceholderPage title="Strategia de Dezvoltare Locală" />} />
            
            {/* Informații de Interes Public */}
            <Route path="/informatii-interes-public" element={<PlaceholderPage title="Informații de Interes Public" />} />
            <Route path="/informatii-interes-public/buget" element={<PlaceholderPage title="Buget și Execuție Bugetară" />} />
            <Route path="/informatii-interes-public/achizitii" element={<PlaceholderPage title="Achiziții Publice" />} />
            <Route path="/informatii-interes-public/taxe-impozite" element={<PlaceholderPage title="Taxe și Impozite Locale" />} />
            
            {/* Transparență Decizională */}
            <Route path="/transparenta-decizionala" element={<PlaceholderPage title="Transparență Decizională" />} />
            <Route path="/transparenta-decizionala/proiecte-hotarari" element={<PlaceholderPage title="Proiecte de Hotărâri" />} />
            <Route path="/transparenta-decizionala/sedinte-consiliu" element={<PlaceholderPage title="Ședințe ale Consiliului Local" />} />
            
            {/* Integritate Instituțională */}
            <Route path="/integritate-institutionala" element={<PlaceholderPage title="Integritate Instituțională" />} />
            <Route path="/integritate-institutionala/cod-etic" element={<PlaceholderPage title="Cod Etic/Deontologic" />} />
            <Route path="/integritate-institutionala/plan-integritate" element={<PlaceholderPage title="Plan de Integritate" />} />
            
            {/* Monitorul Oficial Local (MOL) */}
            <Route path="/monitorul-oficial-local" element={<PlaceholderPage title="Monitorul Oficial Local" />} />
            <Route path="/mol/statutul-uat" element={<PlaceholderPage title="Statutul Unității Administrativ-Teritoriale" />} />
            <Route path="/mol/regulamente" element={<PlaceholderPage title="Regulamentele privind procedurile administrative" />} />
            <Route path="/mol/hotarari" element={<PlaceholderPage title="Hotărârile autorității deliberative" />} />
            <Route path="/mol/dispozitii" element={<PlaceholderPage title="Dispozițiile autorității executive" />} />
            <Route path="/mol/documente-financiare" element={<PlaceholderPage title="Documente și informații financiare" />} />
            <Route path="/mol/alte-documente" element={<PlaceholderPage title="Alte documente" />} />
            
            {/* Servicii Publice */}
            <Route path="/servicii-publice" element={<ServiciiOnlinePage />} />
            <Route path="/servicii-publice/sesizari" element={<ServiciiOnlinePage />} />
            <Route path="/servicii-publice/sesizari/formular" element={<FormularSesizariPage />} />
            <Route path="/servicii-publice/cautare-sesizare" element={<CautareSesizarePage />} />
            <Route path="/servicii-publice/urbanism" element={<PlaceholderPage title="Urbanism și Dezvoltare" />} />
            <Route path="/servicii-publice/formulare" element={<FormulareOnlinePage />} />
            <Route path="/servicii-publice/formulare/:slug" element={<FormularSpecificPage />} />
            <Route path="/servicii-publice/plata-taxelor" element={<PlaceholderPage title="Plata Taxelor și Impozitelor" />} />
            <Route path="/servicii-publice/programari" element={<ProgramariOnlinePage />} />
            
            {/* Programări Online */}
            <Route path="/programari-online" element={<ProgramariOnlinePage />} />
            <Route path="/verificare-programare" element={<CautareProgramarePage />} />
            
            {/* Plăți Online */}
            <Route path="/plati-online" element={<PlatiOnlinePage />} />
            <Route path="/payments/mock-ghiseul" element={<MockGhiseulPage />} />
            <Route path="/payments/success" element={<PaymentSuccessPage />} />
            <Route path="/payments/cancel" element={<PlaceholderPage title="Plată Anulată" />} />
            <Route path="/verificare-plati" element={<VerificarePlatiPage />} />
            
            {/* Comunitate */}
            <Route path="/comunitate" element={<PlaceholderPage title="Comunitate" />} />
            <Route path="/comunitate/educatie-cultura" element={<PlaceholderPage title="Educație, Cultură și Sănătate" />} />
            <Route path="/comunitate/mediu-turism" element={<PlaceholderPage title="Mediu și Turism" />} />
            
            {/* Anunțuri */}
            <Route path="/anunturi" element={<PlaceholderPage title="Anunțuri" />} />
            <Route path="/anunturi/:slug" element={<PlaceholderPage title="Anunț Detaliat" />} />
            
            {/* Contact */}
            <Route path="/contact" element={<PlaceholderPage title="Contact" />} />
            
            {/* Căutare */}
            <Route path="/cautare" element={<SearchResultsPage />} />
            
            {/* Pagini legale */}
            <Route path="/termeni-conditii" element={<PlaceholderPage title="Termeni și Condiții" />} />
            <Route path="/politica-confidentialitate" element={<PlaceholderPage title="Politica de Confidențialitate" />} />
            <Route path="/politica-cookies" element={<PlaceholderPage title="Politica Cookie-uri" />} />
            <Route path="/gdpr" element={<PlaceholderPage title="GDPR" />} />
            <Route path="/accesibilitate" element={<PlaceholderPage title="Declarație Accesibilitate" />} />
            <Route path="/harta-site" element={<SitemapPage />} />
            
            {/* 404 - Pagina nu a fost găsită */}
            <Route path="*" element={<PlaceholderPage title="Pagina nu a fost găsită (404)" />} />
          </Route>
          
          {/* Admin Routes - Pentru lucrătorii primăriei */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<MunicipalityAdminPage />} />
            <Route path="complaints" element={<ComplaintsManagementPage />} />
            <Route path="appointments" element={<AppointmentsManagementPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="requests" element={<MunicipalityAdminPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="announcements/new" element={<PlaceholderPage title="Anunț Nou" />} />
            <Route path="citizens" element={<PlaceholderPage title="Gestionare Cetățeni" />} />
            <Route index element={<MunicipalityAdminPage />} />
          </Route>
          
          {/* Super Admin Routes - Pentru echipa IT */}
          <Route path="/super-admin/login" element={<LoginPage />} />
          <Route path="/super-admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<SuperAdminPage />} />
            <Route path="system" element={<SuperAdminPage />} />
            <Route path="database" element={<SuperAdminPage />} />
            <Route path="security" element={<SuperAdminPage />} />
            <Route path="logs" element={<SuperAdminPage />} />
            <Route path="backups" element={<SuperAdminPage />} />
            <Route path="api" element={<SuperAdminPage />} />
            <Route path="configuration" element={<ConfigurationPage />} />
            <Route path="technical-docs" element={<DocumentsAdminPage />} />
            <Route path="users" element={<PlaceholderPage title="Gestiune Utilizatori Sistem" />} />
            <Route path="analytics" element={<PlaceholderPage title="Analytics Tehnice" />} />
            <Route index element={<SuperAdminPage />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
