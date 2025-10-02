/**
 * Footer conform design system DigiLocal
 * Implementează structura de footer din PDF oficial
 */
import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const FooterContainer = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`,
  color: theme.palette.common.white,
  marginTop: 'auto',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.3)} 50%, transparent 100%)`
  }
}));

const FooterTop = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  padding: theme.spacing(6, 0),
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: `linear-gradient(90deg, transparent 0%, ${alpha('#ffffff', 0.2)} 50%, transparent 100%)`
  }
}));

const FooterBottom = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[900],
  padding: theme.spacing(3, 0),
  borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
}));

const LogoContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px'
});

const LogoImage = styled('img')({
  height: '50px',
  width: 'auto'
});

const ContactInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '8px'
});

const FooterLink = styled(Link, {
  shouldForwardProp: (prop) => prop !== 'component'
})(({ theme }) => ({
  color: theme.palette.grey[300],
  textDecoration: 'none',
  fontSize: '0.875rem',
  '&:hover': {
    color: theme.palette.common.white,
    textDecoration: 'underline'
  }
}));

const SocialButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.grey[400],
  borderRadius: 12,
  border: `1px solid ${alpha(theme.palette.grey[400], 0.3)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    color: theme.palette.common.white,
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
    borderColor: 'transparent',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 73, 144, 0.3)'
  }
}));

interface FooterProps {
  municipalityConfig?: {
    name: string;
    official_name: string;
    logo_url?: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    website_url?: string;
    working_hours?: Record<string, string>;
  };
}

const Footer: React.FC<FooterProps> = ({ municipalityConfig }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  console.log('Footer rendering with config:', municipalityConfig);

  const quickLinks = [
    { label: 'Programări Online', path: '/programari-online' },
    { label: 'Sesizări Cetățene', path: '/servicii-publice/sesizari/formular' },
    { label: 'Plăți Online', path: '/plati-online' },
    { label: 'Formulare Administrative', path: '/servicii-publice/formulare' },
    { label: 'Verificare Sesizări', path: '/servicii-publice/cautare-sesizare' },
    { label: 'Verificare Programări', path: '/verificare-programare' },
    { label: 'Verificare Plăți', path: '/verificare-plati' }
  ];

  const legalLinks = [
    { label: 'Termeni și Condiții', path: '/termeni-conditii' },
    { label: 'Politica de Confidențialitate', path: '/politica-confidentialitate' },
    { label: 'Politica Cookie-uri', path: '/politica-cookies' },
    { label: 'GDPR', path: '/gdpr' },
    { label: 'Declarație Accesibilitate', path: '/accesibilitate' },
    { label: 'Hartă Site', path: '/harta-site' }
  ];

  const formatWorkingHours = (hours: Record<string, string>) => {
    const daysOrder = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
    return daysOrder.map(day => {
      const dayKey = day.toLowerCase();
      const dayHours = hours[dayKey] || hours[day] || 'Închis';
      return `${day}: ${dayHours}`;
    }).slice(0, 5); // Doar zilele lucrătoare pentru footer
  };

  return (
    <FooterContainer>
      {/* Secțiunea superioară - informații principale */}
      <FooterTop>
        <Container maxWidth="xl">
          <Grid container spacing={4}>
            {/* Logo și informații primărie */}
            <Grid item xs={12} md={4}>
              <LogoContainer>
                {municipalityConfig?.logo_url && (
                  <LogoImage 
                    src={municipalityConfig.logo_url} 
                    alt={`Logo ${municipalityConfig.name}`}
                  />
                )}
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {municipalityConfig?.name || 'Primăria Digitală'}
                  </Typography>
                  <Typography variant="body2" color="grey.200">
                    {municipalityConfig?.official_name || 'Administrația Publică Locală'}
                  </Typography>
                </Box>
              </LogoContainer>
              
              <Typography variant="body2" color="grey.200" mb={2}>
                Site oficial pentru servicii digitale ale primăriei. 
                Accesați serviciile publice online și rămâneți la curent cu anunțurile oficiale.
              </Typography>
            </Grid>

            {/* Link-uri rapide */}
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Link-uri Rapide
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {quickLinks.map((link) => (
                  <RouterLink 
                    key={link.path} 
                    to={link.path} 
                    style={{ 
                      textDecoration: 'none',
                      color: theme.palette.grey[300],
                      fontSize: '0.875rem'
                    }}
                  >
                    {link.label}
                  </RouterLink>
                ))}
              </Box>
            </Grid>

            {/* Link-uri legale */}
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Informații Legale
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {legalLinks.map((link) => (
                  <RouterLink 
                    key={link.path} 
                    to={link.path} 
                    style={{ 
                      textDecoration: 'none',
                      color: theme.palette.grey[300],
                      fontSize: '0.875rem'
                    }}
                  >
                    {link.label}
                  </RouterLink>
                ))}
              </Box>
            </Grid>

            {/* Informații de contact */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Contact & Program
              </Typography>
              
              {municipalityConfig?.address && (
                <ContactInfo>
                  <LocationIcon sx={{ fontSize: '1.2rem' }} />
                  <Typography variant="body2">
                    {municipalityConfig.address}
                  </Typography>
                </ContactInfo>
              )}
              
              {municipalityConfig?.contact_phone && (
                <ContactInfo>
                  <PhoneIcon sx={{ fontSize: '1.2rem' }} />
                  <Typography variant="body2">
                    {municipalityConfig.contact_phone}
                  </Typography>
                </ContactInfo>
              )}
              
              {municipalityConfig?.contact_email && (
                <ContactInfo>
                  <EmailIcon sx={{ fontSize: '1.2rem' }} />
                  <Typography variant="body2">
                    {municipalityConfig.contact_email}
                  </Typography>
                </ContactInfo>
              )}

              {municipalityConfig?.working_hours && (
                <Box mt={2}>
                  <ContactInfo>
                    <TimeIcon sx={{ fontSize: '1.2rem' }} />
                    <Typography variant="body2" fontWeight="bold">
                      Program de funcționare:
                    </Typography>
                  </ContactInfo>
                  {formatWorkingHours(municipalityConfig.working_hours).map((schedule, index) => (
                    <Typography key={index} variant="body2" color="grey.200" ml={4}>
                      {schedule}
                    </Typography>
                  ))}
                </Box>
              )}

              {/* Social Media */}
              <Box mt={2}>
                <Typography variant="body2" gutterBottom>
                  Urmăriți-ne:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <SocialButton aria-label="Facebook">
                    <FacebookIcon />
                  </SocialButton>
                  <SocialButton aria-label="Instagram">
                    <InstagramIcon />
                  </SocialButton>
                  <SocialButton aria-label="Twitter">
                    <TwitterIcon />
                  </SocialButton>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </FooterTop>

      {/* Secțiunea inferioară - copyright */}
      <FooterBottom>
        <Container maxWidth="xl">
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 2
          }}>
            <Typography variant="body2" color="grey.400">
              © {new Date().getFullYear()} {municipalityConfig?.name || 'Primăria Digitală'}. 
              Toate drepturile rezervate.
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center'
            }}>
              <Typography variant="body2" color="grey.400">
                Dezvoltat conform standardelor #DigiLocal
              </Typography>
              <Typography variant="body2" color="grey.500" fontSize="0.75rem">
                v1.0.0
              </Typography>
            </Box>
          </Box>
        </Container>
      </FooterBottom>
    </FooterContainer>
  );
};

export default Footer;