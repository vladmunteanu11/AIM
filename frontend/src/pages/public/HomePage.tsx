/**
 * Pagina principală conform design system DigiLocal
 * Implementează structura Hero și secțiunile principale din PDF oficial
 */
import React from 'react';
import { useMunicipalityConfig } from '../../hooks/useMunicipalityConfig';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  AccountBalance as ServicesIcon,
  Announcement as AnnouncementsIcon,
  Description as DocumentsIcon,
  Phone as ContactIcon,
  ArrowForward as ArrowIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import AnimatedCard from '../../components/ui/AnimatedCard';
import GradientButton from '../../components/ui/GradientButton';
import FloatingActionButton from '../../components/ui/FloatingActionButton';

// Styled components pentru Hero section modern
const HeroSection = styled(Box)(({ theme }) => ({
  background: `
    radial-gradient(ellipse at top left, ${alpha(theme.palette.secondary.main, 0.15)} 0%, transparent 50%),
    radial-gradient(ellipse at bottom right, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 50%),
    linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)
  `,
  color: '#ffffff',
  padding: theme.spacing(12, 0),
  position: 'relative',
  overflow: 'hidden',
  minHeight: '70vh',
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      radial-gradient(circle at 20% 50%, ${alpha('#ffffff', 0.1)} 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, ${alpha('#ffffff', 0.15)} 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, ${alpha('#ffffff', 0.08)} 0%, transparent 50%)
    `,
    zIndex: 1
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100px',
    background: 'linear-gradient(to top, rgba(248, 250, 252, 0.1) 0%, transparent 100%)',
    zIndex: 1
  }
}));

const HeroContent = styled(Box)({
  position: 'relative',
  zIndex: 2
});

// Remove unused StatsCard component

// Remove unused ServiceCard component

const AnnouncementCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: 16,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 32px rgba(0, 73, 144, 0.15)',
    borderColor: alpha(theme.palette.primary.main, 0.15)
  }
}));

const HomePage: React.FC = () => {
  const theme = useTheme();
  const { config: municipalityConfig, loading } = useMunicipalityConfig();

  // Mock data pentru demonstrație
  const stats = [
    { number: '15,234', label: 'Cetățeni', icon: '👥' },
    { number: '1,256', label: 'Cereri Procesate', icon: '📋' },
    { number: '89%', label: 'Satisfacție', icon: '⭐' },
    { number: '24/7', label: 'Servicii Online', icon: '🌐' }
  ];

  const services = [
    {
      title: 'Servicii pentru Cetățeni',
      description: 'Accesați toate serviciile publice online: certificate, autorizații, taxe și impozite.',
      icon: <ServicesIcon fontSize="large" />,
      color: theme.palette.primary.main,
      link: '/servicii-publice'
    },
    {
      title: 'Monitorul Oficial Local',
      description: 'Consultați actele normative, hotărârile și dispozițiile autorităților locale.',
      icon: <DocumentsIcon fontSize="large" />,
      color: theme.palette.secondary.main,
      link: '/monitorul-oficial-local'
    },
    {
      title: 'Transparență Decizională',
      description: 'Participați la procesul decizional și consultați proiectele în dezbatere publică.',
      icon: <AnnouncementsIcon fontSize="large" />,
      color: theme.palette.info.main,
      link: '/transparenta-decizionala'
    },
    {
      title: 'Contact și Audiențe',
      description: 'Programări online pentru audiențe și informații de contact complete.',
      icon: <ContactIcon fontSize="large" />,
      color: theme.palette.success.main,
      link: '/contact'
    }
  ];

  const announcements = [
    {
      id: 1,
      title: 'Consultare publică - Planul Urbanistic General',
      excerpt: 'Invităm cetățenii să participe la consultarea publică pentru actualizarea Planului Urbanistic General.',
      date: '15 Nov 2024',
      category: 'Urbanism',
      isUrgent: true,
      image: '/placeholder-announcement.jpg'
    },
    {
      id: 2,
      title: 'Program special de colectare deșeuri voluminoase',
      excerpt: 'În perioada 20-24 noiembrie se va desfășura programul special de colectare a deșeurilor voluminoase.',
      date: '12 Nov 2024',
      category: 'Mediu',
      isUrgent: false,
      image: '/placeholder-announcement2.jpg'
    },
    {
      id: 3,
      title: 'Modernizarea sistemului de iluminat public',
      excerpt: 'A început proiectul de modernizare a sistemului de iluminat public cu tehnologie LED.',
      date: '10 Nov 2024',
      category: 'Infrastructură',
      isUrgent: false,
      image: '/placeholder-announcement3.jpg'
    }
  ];

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography>Se încarcă...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="xl">
          <HeroContent>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography 
                  variant="h1" 
                  gutterBottom
                  sx={{ 
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    fontWeight: 700,
                    mb: 2
                  }}
                >
                  {municipalityConfig?.name || 'Primăria Digitală'}
                </Typography>
                
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 3,
                    opacity: 0.9,
                    fontSize: { xs: '1.2rem', md: '1.5rem' }
                  }}
                >
                  {municipalityConfig?.official_name || 'Servicii publice digitale pentru cetățeni'}
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 4, 
                    fontSize: '1.1rem',
                    opacity: 0.8,
                    maxWidth: '600px'
                  }}
                >
                  Accesați serviciile publice online, consultați actele oficiale și rămâneți 
                  la curent cu anunțurile importante ale primăriei. Totul într-un singur loc, 
                  disponibil 24/7.
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <GradientButton 
                    size="large"
                    gradient="secondary"
                    animation="slide"
                    endIcon={<ArrowIcon />}
                    component={Link}
                    to="/servicii-publice"
                    sx={{ 
                      py: 1.5, 
                      px: 4,
                      fontSize: '1.1rem'
                    }}
                  >
                    Servicii Publice
                  </GradientButton>
                  
                  <GradientButton 
                    size="large"
                    gradient="primary"
                    animation="glow"
                    component={Link}
                    to="/plati-online"
                    sx={{ 
                      py: 1.5, 
                      px: 4,
                      fontSize: '1.1rem'
                    }}
                  >
                    💳 Plăți Online
                  </GradientButton>
                  
                  <Button 
                    variant="outlined" 
                    size="large"
                    sx={{ 
                      py: 1.5, 
                      px: 4,
                      color: '#ffffff',
                      borderColor: alpha('#ffffff', 0.6),
                      borderRadius: 3,
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#ffffff',
                        backgroundColor: alpha('#ffffff', 0.15),
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(255, 255, 255, 0.2)'
                      }
                    }}
                    component={Link}
                    to="/contact"
                  >
                    Contact
                  </Button>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  textAlign: 'center',
                  display: { xs: 'none', md: 'block' }
                }}>
                  <img 
                    src="/municipality-illustration.svg" 
                    alt="Servicii Digitale"
                    style={{ 
                      width: '100%', 
                      maxWidth: '400px',
                      height: 'auto',
                      opacity: 0.9
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </HeroContent>
        </Container>
      </HeroSection>

      {/* Statistici cu design modern */}
      <Box sx={{ 
        py: 8,
        background: `linear-gradient(135deg, ${alpha('#F8FAFC', 0.8)} 0%, ${alpha('#F1F8FF', 0.9)} 100%)`,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at 25% 25%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 50%)`,
          pointerEvents: 'none'
        }
      }}>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <AnimatedCard 
                  customVariant="hover-lift"
                  borderGradient
                  glowColor={theme.palette.primary.main}
                  sx={{ p: 3, textAlign: 'center', height: '100%' }}
                >
                  <Typography 
                    variant="h3" 
                    sx={{
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 'bold',
                      mb: 1
                    }}
                  >
                    {stat.number}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>{stat.icon}</span>
                    {stat.label}
                  </Typography>
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Servicii Principale */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="xl">
          <Box textAlign="center" mb={6}>
            <Typography variant="h2" gutterBottom color="primary">
              Servicii Principale
            </Typography>
            <Typography variant="h6" color="text.secondary" maxWidth="600px" mx="auto">
              Accesați rapid serviciile de care aveți nevoie
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {services.map((service, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Link to={service.link} style={{ textDecoration: 'none' }}>
                  <AnimatedCard
                    customVariant="hover-float"
                    glowColor={service.color}
                    sx={{ height: '100%' }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 4, position: 'relative', zIndex: 2 }}>
                      <Box 
                        sx={{ 
                          color: service.color,
                          mb: 2,
                          p: 2,
                          borderRadius: '50%',
                          backgroundColor: alpha(service.color, 0.1),
                          display: 'inline-flex',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.1) rotate(5deg)',
                            backgroundColor: alpha(service.color, 0.15)
                          }
                        }}
                      >
                        {service.icon}
                      </Box>
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        {service.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {service.description}
                      </Typography>
                    </CardContent>
                  </AnimatedCard>
                </Link>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Anunțuri Recente */}
      <Box sx={{ py: 8, backgroundColor: 'grey.50' }}>
        <Container maxWidth="xl">
          <Grid container spacing={6}>
            {/* Lista anunțuri */}
            <Grid item={true} xs={12} md={8}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" color="primary">
                  Anunțuri Recente
                </Typography>
                <Link to="/anunturi" style={{ textDecoration: 'none' }}>
                  <Button 
                    endIcon={<ArrowIcon />}
                    color="primary"
                  >
                    Vezi toate anunțurile
                  </Button>
                </Link>
              </Box>
              
              {announcements.map((announcement) => (
                <AnnouncementCard key={announcement.id}>
                  <Grid container>
                    <Grid item xs={12} sm={8}>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Chip 
                            label={announcement.category}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {announcement.isUrgent && (
                            <Chip 
                              label="URGENT"
                              size="small"
                              color="error"
                            />
                          )}
                          <Box display="flex" alignItems="center" gap={0.5} ml="auto">
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {announcement.date}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Typography variant="h6" gutterBottom>
                          {announcement.title}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          {announcement.excerpt}
                        </Typography>
                        
                        <Link to={`/anunturi/${announcement.id}`} style={{ textDecoration: 'none' }}>
                          <Button 
                            size="small" 
                            color="primary"
                          >
                            Citește mai mult
                          </Button>
                        </Link>
                      </CardContent>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={announcement.image}
                        alt={announcement.title}
                        sx={{ objectFit: 'cover' }}
                      />
                    </Grid>
                  </Grid>
                </AnnouncementCard>
              ))}
            </Grid>
            
            {/* Sidebar informații */}
            <Grid item={true} xs={12} md={4}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Program de Funcționare
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      📅 Luni - Joi: 08:00 - 16:00
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      📅 Vineri: 08:00 - 14:00
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ⏰ Program Audiențe: Luni 10:00-12:00, Miercuri 14:00-16:00
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Contact Rapid
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      📞 0256 123 456
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      ✉️ contact@primarie.ro
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      📍 Str. Principală nr. 1
                    </Typography>
                  </Box>
                  <Link to="/contact" style={{ textDecoration: 'none' }}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      sx={{ mt: 2 }}
                    >
                      Contact Complet
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
      {/* Floating Action Button pentru acces rapid */}
      <FloatingActionButton 
        variant="expandable"
        showLabels
        pulseOnMount
      />
    </Box>
  );
};

export default HomePage;