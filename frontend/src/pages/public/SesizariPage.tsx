import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  useTheme,
  Paper,
  Alert,
  Chip
} from '@mui/material';
import {
  ReportProblem as ComplaintIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import './SesizariPage.css';

const SesizariPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Categorii de sesizări
  const categories = [
    { id: 1, name: 'Infrastructură Rutieră', icon: '🛣️', description: 'Gropi, marcaje, semne de circulație' },
    { id: 2, name: 'Iluminat Public', icon: '💡', description: 'Stâlpi defecți, becuri arse' },
    { id: 3, name: 'Salubritate', icon: '♻️', description: 'Gunoaie neridicate, zone murdare' },
    { id: 4, name: 'Spații Verzi', icon: '🌳', description: 'Parcuri, zone de joacă' },
    { id: 5, name: 'Transport Public', icon: '🚌', description: 'Stații, program, curățenie' },
    { id: 6, name: 'Altele', icon: '📋', description: 'Alte tipuri de sesizări' }
  ];

  const handleCategoryClick = (categoryId: number) => {
    navigate(`/servicii-publice/sesizari/formular?category=${categoryId}`);
  };

  // Cardul principal pentru crearea unei sesizări
  const createComplaintCard = {
    title: 'Sesizări și Reclamații',
    description: 'Raportați probleme din comunitate - drumuri, iluminat, salubritate, spații verzi, etc.',
    icon: <ComplaintIcon className="service-icon" />,
    color: theme.palette.error.main,
    link: '/servicii-publice/sesizari',
    isActive: true
  };

  // Cardul pentru căutarea unei sesizări
  const searchComplaintCard = {
    title: 'Căutare Sesizare',
    description: 'Verificați statusul unei sesizări existente folosind numărul de referință',
    icon: <SearchIcon className="service-icon" />,
    color: theme.palette.info.main,
    link: '/servicii-publice/cautare-sesizare',
    isActive: true
  };

  return (
    <div className="sesizari-page">
      {/* Hero Section */}
      <Box className="hero-section" sx={{ 
        background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
        color: 'white',
        py: 8,
        mb: 6
      }}>
        <Container maxWidth="lg">
          <Typography variant="h2" gutterBottom sx={{ fontWeight: 700 }}>
            Sesizări și Reclamații
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.95, maxWidth: '800px' }}>
            Raportați probleme din comunitate și urmăriți rezolvarea lor în timp real
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Acțiuni Principale */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* Card Creare Sesizare */}
          <Grid item xs={12} md={6}>
            <Card 
              className="action-card"
              elevation={3}
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: theme.shadows[10]
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 4 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3,
                  color: createComplaintCard.color 
                }}>
                  <Box sx={{ fontSize: '3rem', mr: 2 }}>
                    {createComplaintCard.icon}
                  </Box>
                  <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
                    {createComplaintCard.title}
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: '1.1rem' }}>
                  {createComplaintCard.description}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="Rapid" size="small" color="success" />
                  <Chip label="Urmărire în timp real" size="small" color="info" />
                  <Chip label="24/7" size="small" color="warning" />
                </Box>
              </CardContent>
              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(createComplaintCard.link)}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    backgroundColor: createComplaintCard.color,
                    '&:hover': {
                      backgroundColor: theme.palette.error.dark
                    }
                  }}
                >
                  Creează Sesizare Nouă
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Card Căutare Sesizare */}
          <Grid item xs={12} md={6}>
            <Card 
              className="action-card"
              elevation={3}
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: theme.shadows[10]
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 4 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3,
                  color: searchComplaintCard.color 
                }}>
                  <Box sx={{ fontSize: '3rem', mr: 2 }}>
                    {searchComplaintCard.icon}
                  </Box>
                  <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
                    {searchComplaintCard.title}
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: '1.1rem' }}>
                  {searchComplaintCard.description}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="Verificare status" size="small" color="info" />
                  <Chip label="Istoric complet" size="small" color="default" />
                </Box>
              </CardContent>
              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(searchComplaintCard.link)}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    backgroundColor: searchComplaintCard.color,
                    '&:hover': {
                      backgroundColor: theme.palette.info.dark
                    }
                  }}
                >
                  Caută Sesizare Existentă
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        {/* Categorii de Sesizări */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Selectează Categoria Sesizării
          </Typography>
          <Grid container spacing={3}>
            {categories.map((category) => (
              <Grid item xs={12} sm={6} md={4} key={category.id}>
                <Card
                  className="category-card"
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: selectedCategory === category.id ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[6],
                      borderColor: theme.palette.primary.main
                    }
                  }}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box sx={{ fontSize: '3rem', mb: 2 }}>
                      {category.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {category.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Cum funcționează */}
        <Paper elevation={2} sx={{ p: 4, mb: 6, backgroundColor: '#f5f9ff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <InfoIcon sx={{ fontSize: 40, mr: 2, color: theme.palette.info.main }} />
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Cum funcționează?
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ 
                  backgroundColor: theme.palette.primary.main, 
                  color: 'white',
                  borderRadius: '50%',
                  width: 60,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '1.5rem',
                  fontWeight: 700
                }}>
                  1
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Selectează Categoria
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Alege tipul problemei din categoriile disponibile
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ 
                  backgroundColor: theme.palette.primary.main, 
                  color: 'white',
                  borderRadius: '50%',
                  width: 60,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '1.5rem',
                  fontWeight: 700
                }}>
                  2
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Completează Formularul
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Descrie problema și adaugă fotografii dacă este necesar
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ 
                  backgroundColor: theme.palette.primary.main, 
                  color: 'white',
                  borderRadius: '50%',
                  width: 60,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '1.5rem',
                  fontWeight: 700
                }}>
                  3
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Primești Număr de Referință
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Notează numărul pentru a urmări statusul sesizării
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ 
                  backgroundColor: theme.palette.success.main, 
                  color: 'white',
                  borderRadius: '50%',
                  width: 60,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '1.5rem',
                  fontWeight: 700
                }}>
                  <CheckIcon />
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Urmărește Rezolvarea
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verifică statusul și primește notificări despre progres
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Informații de Contact */}
        <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Informații de Contact
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PhoneIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Telefon
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    0256 123 456
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmailIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email Sesizări
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    sesizari@primarie.ro
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScheduleIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Program
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Luni - Vineri: 08:00 - 16:00
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Alert informativ */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body1">
            <strong>Timp mediu de răspuns:</strong> 24-48 ore pentru sesizările urgente, 3-5 zile lucrătoare pentru celelalte categorii.
            Veți primi un email de confirmare după înregistrarea sesizării.
          </Typography>
        </Alert>
      </Container>
    </div>
  );
};

export default SesizariPage;
