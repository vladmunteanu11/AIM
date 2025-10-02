/**
 * Pagina Servicii Online - Conform modelului Florești Cluj
 * Implementează formulare de sesizări și servicii digitale
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  useTheme,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Divider
} from '@mui/material';
import {
  ReportProblem as ComplaintIcon,
  Search as SearchIcon,
  Assignment as FormIcon,
  Payment as PaymentIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router-dom';

// Import servicii și tipuri
import { complaintsService, ComplaintCategory } from '../../services/complaintsService';

// Styled components
const ServiceCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[12],
    '& .service-icon': {
      transform: 'scale(1.1)',
      transition: 'transform 0.3s ease'
    }
  }
}));

const ServiceIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: 80,
  height: 80,
  borderRadius: '50%',
  margin: '0 auto 16px',
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  fontSize: '2rem'
}));

const CategoryCard = styled(Card)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: theme.shadows[6],
    transform: 'translateY(-2px)'
  }
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ServiciiOnlinePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(0);
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComplaintCategories();
  }, []);

  const loadComplaintCategories = async () => {
    try {
      setLoading(true);
      const data = await complaintsService.getCategories();
      setCategories(data);
    } catch (err: any) {
      setError('Eroare la încărcarea categoriilor de sesizări');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCategoryClick = (categoryId: number) => {
    navigate(`/servicii-publice/sesizari/formular?category=${categoryId}`);
  };

  // Servicii principale
  const mainServices = [
    {
      title: 'Sesizări și Reclamații',
      description: 'Raportați probleme din comunitate - drumuri, iluminat, salubritate, etc.',
      icon: <ComplaintIcon className="service-icon" />,
      color: theme.palette.error.main,
      link: '/servicii-publice/sesizari',
      isActive: true
    },
    {
      title: 'Plăți Online',
      description: 'Plătește taxe și impozite locale prin Ghișeul.ro - rapid și sigur',
      icon: <PaymentIcon className="service-icon" />,
      color: '#0079C1',
      link: '/plati-online',
      isActive: true,
      featured: true
    },
    {
      title: 'Căutare Sesizare',
      description: 'Verificați statusul unei sesizări existente folosind numărul de referință',
      icon: <SearchIcon className="service-icon" />,
      color: theme.palette.info.main,
      link: '/servicii-publice/cautare-sesizare',
      isActive: true
    },
    {
      title: 'Formulare Administrative',
      description: 'Certificate, autorizații și alte documente oficiale',
      icon: <FormIcon className="service-icon" />,
      color: theme.palette.secondary.main,
      link: '/servicii-publice/formulare',
      isActive: true
    },
    {
      title: 'Programări Online',
      description: 'Programați o întâlnire la ghișeele primăriei',
      icon: <ScheduleIcon className="service-icon" />,
      color: theme.palette.success.main,
      link: '/programari-online',
      isActive: true
    }
  ];

  // Informații utile
  const usefulInfo = [
    {
      title: 'Program de Funcționare',
      items: [
        'Luni - Joi: 08:00 - 16:00',
        'Vineri: 08:00 - 14:00',
        'Sâmbătă - Duminică: Închis'
      ],
      icon: <ScheduleIcon />
    },
    {
      title: 'Contact Rapid',
      items: [
        'Telefon: 0256 123 456',
        'Email: contact@primarie.ro',
        'Email sesizări: sesizari@primarie.ro'
      ],
      icon: <PhoneIcon />
    },
    {
      title: 'Adresa Sediu',
      items: [
        'Strada Principală nr. 1',
        'Comuna Exemplu',
        'Județul Exemplu'
      ],
      icon: <LocationIcon />
    }
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Se încarcă serviciile online...
        </Typography>
      </Container>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h2" gutterBottom fontWeight="bold">
            Servicii Online
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9, maxWidth: '700px' }}>
            Accesați serviciile publice online - raportați probleme, verificați statusul sesizărilor și 
            obțineți informații administrative, totul disponibil 24/7.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Servicii Principale */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" gutterBottom color="primary" fontWeight="bold">
            Servicii Disponibile
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Selectați serviciul de care aveți nevoie pentru a începe
          </Typography>

          <Grid container spacing={4}>
            {mainServices.map((service, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <ServiceCard 
                  onClick={() => navigate(service.link)}
                >
                  <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                    <ServiceIcon sx={{ bgcolor: service.color }}>
                      {service.icon}
                    </ServiceIcon>
                    
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      {service.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {service.description}
                    </Typography>

                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button 
                      variant="contained"
                      sx={{ 
                        bgcolor: service.color,
                        '&:hover': {
                          bgcolor: service.color
                        }
                      }}
                    >
                      Accesează
                    </Button>
                  </CardActions>
                </ServiceCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 6 }} />

        {/* Tabs pentru detalii */}
        <Box sx={{ mb: 6 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            centered
            sx={{ mb: 3 }}
          >
            <Tab label="Categorii Sesizări" />
            <Tab label="Informații Utile" />
            <Tab label="Ghid Utilizare" />
          </Tabs>

          {/* Tab 0 - Categorii Sesizări */}
          <TabPanel value={activeTab} index={0}>
            <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
              Categorii de Sesizări Disponibile
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Selectați categoria care corespunde cel mai bine problemei pe care doriți să o raportați
            </Typography>

            <Grid container spacing={3}>
              {categories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <CategoryCard onClick={() => handleCategoryClick(category.id)}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        {category.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {category.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={`Răspuns: ${category.response_time_hours}h`}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                        <Chip 
                          label={`Rezolvare: ${category.resolution_time_days} zile`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </Box>

                      {category.responsible_department && (
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          Responsabil: {category.responsible_department}
                        </Typography>
                      )}
                    </CardContent>
                  </CategoryCard>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Tab 1 - Informații Utile */}
          <TabPanel value={activeTab} index={1}>
            <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
              Informații Utile
            </Typography>
            
            <Grid container spacing={4}>
              {usefulInfo.map((info, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ color: 'primary.main', mr: 1 }}>
                          {info.icon}
                        </Box>
                        <Typography variant="h6" color="primary">
                          {info.title}
                        </Typography>
                      </Box>
                      
                      {info.items.map((item, itemIndex) => (
                        <Typography key={itemIndex} variant="body2" sx={{ mb: 0.5 }}>
                          {item}
                        </Typography>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Tab 2 - Ghid Utilizare */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
              Cum să Folosiți Serviciile Online
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="secondary">
                      Pentru Sesizări Noi
                    </Typography>
                    <Box component="ol" sx={{ pl: 2 }}>
                      <li>Selectați categoria potrivită pentru problema dvs.</li>
                      <li>Completați formularul cu detalii clare și precise</li>
                      <li>Adăugați fotografii dacă este necesar</li>
                      <li>Indicați locația exactă a problemei</li>
                      <li>Acceptați termenii de prelucrare a datelor</li>
                      <li>Primiți numărul de referință pentru urmărire</li>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="secondary">
                      Pentru Urmărirea Sesizărilor
                    </Typography>
                    <Box component="ol" sx={{ pl: 2 }}>
                      <li>Accesați "Căutare Sesizare" din meniu</li>
                      <li>Introduceți numărul de referință primit</li>
                      <li>Vizualizați statusul actual al sesizării</li>
                      <li>Citiți actualizările de la administrație</li>
                      <li>Adăugați feedback dacă sesizarea a fost rezolvată</li>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 4 }}>
              <Typography variant="body2">
                <strong>Important:</strong> Pentru situații de urgență (accidente, pericole iminente), 
                vă rugăm să contactați direct serviciile de urgență la 112 sau primăria la 0256 123 456.
              </Typography>
            </Alert>
          </TabPanel>
        </Box>
      </Container>
    </Box>
  );
};

export default ServiciiOnlinePage;