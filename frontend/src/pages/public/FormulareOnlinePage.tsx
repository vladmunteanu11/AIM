/**
 * Pagina pentru Formulare Online - Cereri Administrative
 * Implementează toate tipurile de formulare administrative disponibile
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
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Description as FormIcon,
  AccountBalance as BankIcon,
  Home as HomeIcon,
  Build as ConstructionIcon,
  Business as BusinessIcon,
  Water as WaterIcon,
  ArrowBack as BackIcon,
  Schedule as TimeIcon,
  CheckCircle as CheckIcon,
  Assignment as DocumentIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router-dom';

// Import servicii și tipuri
import { formsService, FormType } from '../../services/formsService';

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
  backgroundColor: theme.palette.secondary.main,
  color: 'white',
  fontSize: '2rem'
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

const FormulareOnlinePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(0);
  const [formTypes, setFormTypes] = useState<FormType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFormTypes();
  }, []);

  const loadFormTypes = async () => {
    try {
      setLoading(true);
      const data = await formsService.getFormTypes();
      setFormTypes(data);
    } catch (err: any) {
      setError('Eroare la încărcarea tipurilor de formulare');
      console.error('Error loading form types:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFormClick = (formType: FormType) => {
    navigate(`/servicii-publice/formulare/${formType.slug}`);
  };

  // Iconuri pentru tipurile de formulare
  const getFormIcon = (slug: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'certificat-urbanism': <HomeIcon className="service-icon" />,
      'autorizatie-constructie': <ConstructionIcon className="service-icon" />,
      'certificat-fiscal': <BankIcon className="service-icon" />,
      'adeverinta-domiciliu': <HomeIcon className="service-icon" />,
      'cerere-racordare': <WaterIcon className="service-icon" />,
      'licenta-functionare': <BusinessIcon className="service-icon" />
    };
    return iconMap[slug] || <FormIcon className="service-icon" />;
  };

  // Culori pentru tipurile de formulare
  const getFormColor = (slug: string) => {
    const colorMap: Record<string, string> = {
      'certificat-urbanism': theme.palette.success.main,
      'autorizatie-constructie': theme.palette.warning.main,
      'certificat-fiscal': theme.palette.info.main,
      'adeverinta-domiciliu': theme.palette.secondary.main,
      'cerere-racordare': theme.palette.primary.main,
      'licenta-functionare': theme.palette.error.main
    };
    return colorMap[slug] || theme.palette.grey[600];
  };

  // Informații utile
  const usefulInfo = [
    {
      title: 'Program de Audiențe',
      items: [
        'Luni - Joi: 08:00 - 15:00',
        'Vineri: 08:00 - 13:00',
        'Pauza: 12:00 - 13:00',
        'Sâmbătă - Duminică: Închis'
      ],
      icon: <TimeIcon />
    },
    {
      title: 'Documente Generale Necesare',
      items: [
        'Carte de identitate (copie)',
        'Dovada plății taxelor',
        'Împuternicire notarială (dacă este cazul)',
        'Documentele specifice cererii'
      ],
      icon: <DocumentIcon />
    },
    {
      title: 'Modalități de Plată',
      items: [
        'Numerar la casieria primăriei',
        'Card bancar la ghișeu',
        'Transfer bancar',
        'Online banking (în dezvoltare)'
      ],
      icon: <BankIcon />
    }
  ];

  // Instrucțiuni generale
  const generalInstructions = [
    {
      title: 'Pregătirea Documentelor',
      content: 'Verificați lista documentelor necesare pentru fiecare tip de cerere. Asigurați-vă că aveți toate documentele în copie și original pentru verificare.'
    },
    {
      title: 'Completarea Formularului',
      content: 'Completați toate câmpurile obligatorii marcate cu *. Informațiile trebuie să fie corecte și actualizate pentru a evita întârzierile în procesare.'
    },
    {
      title: 'Depunerea Cererii',
      content: 'Puteți depune cererea online prin acest portal sau la ghișeul primăriei în programul de audiențe. Pentru cererile online veți primi un număr de referință.'
    },
    {
      title: 'Urmărirea Statusului',
      content: 'Utilizați numărul de referință pentru a urmări statusul cererii dumneavoastră. Veți fi notificat prin email despre orice schimbare de status.'
    },
    {
      title: 'Ridicarea Documentelor',
      content: 'Documentele finalizate pot fi ridicate de la ghișeul primăriei cu buletinul și numărul de referință, sau pot fi trimise prin poștă (taxă suplimentară).'
    }
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Se încarcă formularele online...
        </Typography>
      </Container>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ bgcolor: 'secondary.main', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/servicii-publice')}
            sx={{ mb: 2, color: 'white' }}
          >
            Înapoi la Servicii Online
          </Button>
          
          <Typography variant="h2" gutterBottom fontWeight="bold">
            Formulare Administrative Online
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9, maxWidth: '700px' }}>
            Solicitați online certificate, autorizații și alte documente oficiale. 
            Procesare rapidă și urmărire în timp real a statusului cererii.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Formulare Disponibile */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" gutterBottom color="primary" fontWeight="bold">
            Formulare Disponibile
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Selectați tipul de document de care aveți nevoie
          </Typography>

          <Grid container spacing={4}>
            {formTypes.map((formType) => (
              <Grid item xs={12} sm={6} md={4} key={formType.id}>
                <ServiceCard onClick={() => handleFormClick(formType)}>
                  <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                    <ServiceIcon sx={{ bgcolor: getFormColor(formType.slug) }}>
                      {getFormIcon(formType.slug)}
                    </ServiceIcon>
                    
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      {formType.name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 60 }}>
                      {formType.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {formType.estimated_processing_days && (
                        <Chip 
                          label={`${formType.estimated_processing_days} zile`}
                          size="small"
                          color="info"
                          variant="outlined"
                          icon={<TimeIcon />}
                        />
                      )}
                      <Chip 
                        label="Online"
                        size="small"
                        color="success"
                        variant="outlined"
                        icon={<CheckIcon />}
                      />
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button 
                      variant="contained"
                      sx={{ 
                        bgcolor: getFormColor(formType.slug),
                        '&:hover': {
                          bgcolor: getFormColor(formType.slug)
                        }
                      }}
                    >
                      Completează Cererea
                    </Button>
                  </CardActions>
                </ServiceCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 6 }} />

        {/* Tabs pentru informații */}
        <Box sx={{ mb: 6 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            centered
            sx={{ mb: 3 }}
          >
            <Tab label="Informații Utile" />
            <Tab label="Instrucțiuni Generale" />
            <Tab label="Taxe și Timbre" />
          </Tabs>

          {/* Tab 0 - Informații Utile */}
          <TabPanel value={activeTab} index={0}>
            <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
              Informații Utile
            </Typography>
            
            <Grid container spacing={4}>
              {usefulInfo.map((info, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ color: 'secondary.main', mr: 1 }}>
                          {info.icon}
                        </Box>
                        <Typography variant="h6" color="secondary">
                          {info.title}
                        </Typography>
                      </Box>
                      
                      {info.items.map((item, itemIndex) => (
                        <Typography key={itemIndex} variant="body2" sx={{ mb: 0.5 }}>
                          • {item}
                        </Typography>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Tab 1 - Instrucțiuni Generale */}
          <TabPanel value={activeTab} index={1}>
            <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
              Instrucțiuni Generale pentru Cereri Online
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              {generalInstructions.map((instruction, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6" color="secondary">
                      {index + 1}. {instruction.title}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body1">
                      {instruction.content}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>

            <Alert severity="info" sx={{ mt: 4 }}>
              <Typography variant="body2">
                <strong>Important:</strong> Pentru întrebări specifice despre documentația necesară 
                sau procedurile administrative, vă rugăm să contactați primăria la numerele de telefon 
                afișate sau să veniți personal în programul de audiențe.
              </Typography>
            </Alert>
          </TabPanel>

          {/* Tab 2 - Taxe și Timbre */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
              Taxe și Timbre
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 4 }}>
              <Typography variant="body2">
                <strong>Atenție:</strong> Taxele și tarifele de mai jos sunt orientative. 
                Pentru informații exacte și actualizate, consultați hotărârile consiliului local 
                sau contactați direct primăria.
              </Typography>
            </Alert>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="secondary">
                Tarife Estimate (în lei)
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <HomeIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Certificat de Urbanism" 
                    secondary="50 - 200 lei (în funcție de tipul și complexitatea cererii)"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <ConstructionIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Autorizație de Construcție" 
                    secondary="0.5% - 2% din valoarea investiției (minim 100 lei)"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <BankIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Certificat Fiscal" 
                    secondary="10 - 25 lei (urgent: +50% la tarif)"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <DocumentIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Adeverință de Domiciliu" 
                    secondary="5 - 15 lei"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <WaterIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Cerere Racordare Utilități" 
                    secondary="50 - 300 lei (în funcție de tipul utilității)"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <BusinessIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Licență de Funcționare" 
                    secondary="100 - 500 lei (în funcție de tipul activității)"
                  />
                </ListItem>
              </List>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                * Taxele pot varia în funcție de complexitatea cererii și de reglementările locale în vigoare.
                <br />
                * Pentru cererile urgente se aplică o taxă suplimentară de 50% la tariful standard.
              </Typography>
            </Paper>
          </TabPanel>
        </Box>

        {/* Call to Action */}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Paper sx={{ p: 4, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h5" gutterBottom>
              Aveți nevoie de ajutor?
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Echipa noastră este disponibilă pentru a vă ajuta cu orice întrebări 
              privind formularele online și procedurile administrative.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="outlined" 
                sx={{ 
                  color: 'white', 
                  borderColor: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'white'
                  }
                }}
                component={Link}
                to="/contact"
              >
                Contact Primărie
              </Button>
              <Button 
                variant="outlined" 
                sx={{ 
                  color: 'white', 
                  borderColor: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'white'
                  }
                }}
                component={Link}
                to="/servicii-publice/cautare-sesizare"
              >
                Urmărește o Cerere
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default FormulareOnlinePage;