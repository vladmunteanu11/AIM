/**
 * Component pentru breadcrumbs - navigarea ierarhică în site
 * Afișează calea curentă și permite navigarea înapoi la nivelurile superioare
 */
import React from 'react';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Typography,
  Link,
  Box,
  Container,
  Paper
} from '@mui/material';
import {
  Home,
  NavigateNext
} from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

// Maparea rutelor la titluri prietenoase
const routeLabels: Record<string, string> = {
  '': 'Acasă',
  'despre-primarie': 'Despre Primărie',
  'organizare': 'Organizare',
  'conducere': 'Conducere',
  'strategia-dezvoltare': 'Strategia de Dezvoltare',
  'informatii-interes-public': 'Informații de Interes Public',
  'buget': 'Buget și Execuție Bugetară',
  'achizitii': 'Achiziții Publice',
  'taxe-impozite': 'Taxe și Impozite Locale',
  'transparenta-decizionala': 'Transparență Decizională',
  'proiecte-hotarari': 'Proiecte de Hotărâri',
  'sedinte-consiliu': 'Ședințe Consiliul Local',
  'integritate-institutionala': 'Integritate Instituțională',
  'cod-etic': 'Cod Etic/Deontologic',
  'plan-integritate': 'Plan de Integritate',
  'monitorul-oficial-local': 'Monitorul Oficial Local',
  'mol': 'Monitorul Oficial Local',
  'statutul-uat': 'Statutul UAT',
  'regulamente': 'Regulamente Administrative',
  'hotarari': 'Hotărâri Autoritate Deliberativă',
  'dispozitii': 'Dispoziții Autoritate Executivă',
  'documente-financiare': 'Documente Financiare',
  'alte-documente': 'Alte Documente',
  'servicii-publice': 'Servicii Publice',
  'sesizari': 'Sesizări Cetățene',
  'formular': 'Formular Nou',
  'cautare-sesizare': 'Verificare Sesizări',
  'urbanism': 'Urbanism și Dezvoltare',
  'formulare': 'Formulare Administrative',
  'programari': 'Programări Online',
  'plata-taxelor': 'Plata Taxelor și Impozitelor',
  'programari-online': 'Programări Online',
  'verificare-programare': 'Verificare Programare',
  'plati-online': 'Plăți Online',
  'verificare-plati': 'Verificare Plăți',
  'comunitate': 'Comunitate',
  'educatie-cultura': 'Educație, Cultură și Sănătate',
  'mediu-turism': 'Mediu și Turism',
  'anunturi': 'Anunțuri',
  'contact': 'Contact',
  'cautare': 'Rezultate Căutare',
  'termeni-conditii': 'Termeni și Condiții',
  'politica-confidentialitate': 'Politica de Confidențialitate',
  'politica-cookies': 'Politica Cookie-uri',
  'gdpr': 'GDPR',
  'accesibilitate': 'Declarație Accesibilitate',
  'harta-site': 'Hartă Site'
};

const Breadcrumbs: React.FC = () => {
  const location = useLocation();

  // Construiește lista de breadcrumbs din path-ul curent
  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: 'Acasă',
        path: '/',
        icon: <Home sx={{ fontSize: '1rem' }} />
      }
    ];

    // Construiește breadcrumbs pentru fiecare segment din path
    let currentPath = '';
    pathnames.forEach((pathname, index) => {
      currentPath += `/${pathname}`;
      const label = routeLabels[pathname] || pathname.charAt(0).toUpperCase() + pathname.slice(1).replace('-', ' ');
      
      breadcrumbs.push({
        label,
        path: currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  // Nu afișa breadcrumbs pe pagina principală
  if (location.pathname === '/') {
    return null;
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Container maxWidth="xl">
        <MuiBreadcrumbs
          separator={<NavigateNext fontSize="small" />}
          aria-label="breadcrumb navigation"
          sx={{
            '& .MuiBreadcrumbs-ol': {
              flexWrap: 'wrap'
            }
          }}
        >
          {breadcrumbs.map((breadcrumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return isLast ? (
              <Typography
                key={breadcrumb.path}
                color="text.primary"
                variant="body2"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontWeight: 500
                }}
              >
                {breadcrumb.icon}
                {breadcrumb.label}
              </Typography>
            ) : (
              <Link
                key={breadcrumb.path}
                component={RouterLink}
                to={breadcrumb.path}
                underline="hover"
                color="text.secondary"
                variant="body2"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': {
                    color: 'primary.main'
                  }
                }}
              >
                {breadcrumb.icon}
                {breadcrumb.label}
              </Link>
            );
          })}
        </MuiBreadcrumbs>
      </Container>
    </Box>
  );
};

export default Breadcrumbs;