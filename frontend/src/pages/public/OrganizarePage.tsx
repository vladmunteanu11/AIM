/**
 * Pagina "Organizare" - Organigramă interactivă și structură organizatorică
 * Conformă cu cerințele DigiLocal pentru transparență administrativă
 */
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  ExpandMore,
  AccountBalance,
  People,
  Person,
  Group,
  Phone,
  Email,
  LocationOn,
  Info,
  Close,
  Download,
} from '@mui/icons-material';
import { useMunicipalityConfig } from '../../hooks/useMunicipalityConfig';

// Tipuri pentru structura organizatorică
interface Department {
  id: string;
  name: string;
  head: string;
  headTitle: string;
  phone?: string;
  email?: string;
  employees: number;
  description: string;
  subdivisions?: Department[];
}

interface OrganizationData {
  mayor: {
    name: string;
    title: string;
    phone: string;
    email: string;
    description: string;
  };
  viceHayors: Array<{
    name: string;
    title: string;
    phone: string;
    email: string;
    responsibilities: string[];
  }>;
  secretary: {
    name: string;
    title: string;
    phone: string;
    email: string;
    description: string;
  };
  departments: Department[];
}

const OrganizarePage: React.FC = () => {
  const { config } = useMunicipalityConfig();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Date exemplu pentru organizare (în implementarea reală, acestea vin din API)
  const organizationData: OrganizationData = {
    mayor: {
      name: config?.mayor_name || 'Ion Popescu',
      title: 'Primar',
      phone: '0256 123 456',
      email: 'primar@primarie.ro',
      description: 'Autoritatea executivă a unității administrativ-teritoriale, ales prin vot universal, direct, secret și liber exprimat.'
    },
    viceHayors: [
      {
        name: 'Maria Ionescu',
        title: 'Viceprimar',
        phone: '0256 123 457',
        email: 'viceprimar@primarie.ro',
        responsibilities: ['Dezvoltare locală', 'Investiții', 'Proiecte europene']
      }
    ],
    secretary: {
      name: 'Gheorghe Vasilescu',
      title: 'Secretar',
      phone: '0256 123 458',
      email: 'secretar@primarie.ro',
      description: 'Funcționar public de conducere, cu pregătire de specialitate în administrația publică.'
    },
    departments: [
      {
        id: 'administrativa',
        name: 'Compartimentul Administrativ',
        head: 'Ana Popescu',
        headTitle: 'Șef Compartiment',
        phone: '0256 123 460',
        email: 'administrativ@primarie.ro',
        employees: 8,
        description: 'Gestionează activitățile administrative generale, resurse umane și logistică.',
        subdivisions: [
          {
            id: 'rh',
            name: 'Biroul Resurse Umane',
            head: 'Elena Marin',
            headTitle: 'Șef Birou',
            employees: 3,
            description: 'Management personal, salarii, dezvoltare profesională'
          },
          {
            id: 'achizitii',
            name: 'Biroul Achiziții Publice',
            head: 'Mihai Georgescu',
            headTitle: 'Șef Birou',
            employees: 2,
            description: 'Organizarea și derularea procedurilor de achiziție publică'
          }
        ]
      },
      {
        id: 'financiar',
        name: 'Compartimentul Financiar-Contabil',
        head: 'Cristina Dumitrescu',
        headTitle: 'Șef Compartiment',
        phone: '0256 123 461',
        email: 'financiar@primarie.ro',
        employees: 6,
        description: 'Elaborează și execută bugetul local, gestionează veniturile și cheltuielile.',
        subdivisions: [
          {
            id: 'buget',
            name: 'Biroul Buget',
            head: 'Florin Stancu',
            headTitle: 'Șef Birou',
            employees: 3,
            description: 'Elaborarea și monitorizarea bugetului local'
          },
          {
            id: 'taxe',
            name: 'Biroul Taxe și Impozite',
            head: 'Alina Radu',
            headTitle: 'Șef Birou',
            employees: 3,
            description: 'Calcularea și încasarea taxelor și impozitelor locale'
          }
        ]
      },
      {
        id: 'urbanism',
        name: 'Compartimentul Urbanism',
        head: 'Radu Constantinescu',
        headTitle: 'Arhitect Șef',
        phone: '0256 123 462',
        email: 'urbanism@primarie.ro',
        employees: 5,
        description: 'Eliberează autorizații de construire și amenajarea teritoriului.',
        subdivisions: [
          {
            id: 'autorizatii',
            name: 'Biroul Autorizații',
            head: 'Sorina Pavel',
            headTitle: 'Șef Birou',
            employees: 3,
            description: 'Eliberarea autorizațiilor de construire și desființare'
          }
        ]
      },
      {
        id: 'social',
        name: 'Compartimentul Asistență Socială',
        head: 'Carmen Mihai',
        headTitle: 'Șef Compartiment',
        phone: '0256 123 463',
        email: 'social@primarie.ro',
        employees: 4,
        description: 'Acordă servicii sociale și de asistență pentru categoriile defavorizate.'
      },
      {
        id: 'registru',
        name: 'Serviciul Registrul de Stare Civilă',
        head: 'Luminița Ionescu',
        headTitle: 'Șef Serviciu',
        phone: '0256 123 464',
        email: 'stare-civila@primarie.ro',
        employees: 3,
        description: 'Eliberează acte de stare civilă și gestionează registrele de evidență.'
      }
    ]
  };

  const handleDepartmentClick = (department: Department) => {
    setSelectedDepartment(department);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedDepartment(null);
  };

  const renderDepartmentCard = (department: Department, level: number = 0) => (
    <Card 
      key={department.id} 
      elevation={2} 
      sx={{ 
        mb: 2, 
        ml: level * 3,
        cursor: 'pointer',
        '&:hover': { 
          boxShadow: 6,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
      onClick={() => handleDepartmentClick(department)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <Group />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" color="primary">
              {department.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {department.head} - {department.headTitle}
            </Typography>
          </Box>
          <Chip 
            label={`${department.employees} angajați`} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {department.description}
        </Typography>
        
        {department.phone && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">{department.phone}</Typography>
          </Box>
        )}
        
        {department.email && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">{department.email}</Typography>
          </Box>
        )}
        
        {department.subdivisions && department.subdivisions.length > 0 && (
          <Chip 
            label={`${department.subdivisions.length} birouri`} 
            size="small" 
            sx={{ mt: 1 }} 
          />
        )}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, bgcolor: 'primary.50' }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Organizarea Primăriei
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Structura organizatorică și funcțională a {config?.name || 'primăriei'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Download />}
          sx={{ mt: 2 }}
        >
          Descarcă Organigramă (PDF)
        </Button>
      </Paper>

      {/* Consiliul Local */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AccountBalance sx={{ mr: 1 }} />
          Consiliul Local
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Autoritatea deliberativă a unității administrativ-teritoriale, constituită din consilierii locali 
          aleși prin vot universal, direct, secret și liber exprimat. Consiliul Local adoptă hotărâri și 
          exercită controlul asupra modului de îndeplinire a mandatului de către primar.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Chip label="Numărul de consilieri: 15" color="primary" sx={{ mr: 1 }} />
          <Chip label="Mandat: 2020-2024" color="secondary" sx={{ mr: 1 }} />
          <Chip label="Ședințe: Ultima joi a lunii" color="default" />
        </Box>
      </Paper>

      {/* Conducerea Executivă */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Person sx={{ mr: 1 }} />
          Conducerea Executivă
        </Typography>
        
        <Grid container spacing={3}>
          {/* Primar */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    bgcolor: 'primary.main', 
                    mx: 'auto', 
                    mb: 2,
                    fontSize: '2rem'
                  }}
                >
                  {organizationData.mayor.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Typography variant="h6" color="primary">
                  {organizationData.mayor.title}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', my: 1 }}>
                  {organizationData.mayor.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {organizationData.mayor.description}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Phone sx={{ fontSize: 16, mr: 1 }} />
                    {organizationData.mayor.phone}
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Email sx={{ fontSize: 16, mr: 1 }} />
                    {organizationData.mayor.email}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Viceprimar */}
          {organizationData.viceHayors.map((vice, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: 'secondary.main', 
                      mx: 'auto', 
                      mb: 2,
                      fontSize: '2rem'
                    }}
                  >
                    {vice.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Typography variant="h6" color="secondary">
                    {vice.title}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', my: 1 }}>
                    {vice.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Responsabilități:
                  </Typography>
                  {vice.responsibilities.map((resp, idx) => (
                    <Chip key={idx} label={resp} size="small" sx={{ m: 0.5 }} />
                  ))}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Phone sx={{ fontSize: 16, mr: 1 }} />
                      {vice.phone}
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Email sx={{ fontSize: 16, mr: 1 }} />
                      {vice.email}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Secretar */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    bgcolor: 'success.main', 
                    mx: 'auto', 
                    mb: 2,
                    fontSize: '2rem'
                  }}
                >
                  {organizationData.secretary.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Typography variant="h6" color="success.main">
                  {organizationData.secretary.title}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', my: 1 }}>
                  {organizationData.secretary.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {organizationData.secretary.description}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Phone sx={{ fontSize: 16, mr: 1 }} />
                    {organizationData.secretary.phone}
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Email sx={{ fontSize: 16, mr: 1 }} />
                    {organizationData.secretary.email}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Aparatul de Specialitate */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <People sx={{ mr: 1 }} />
          Aparatul de Specialitate
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Aparatul de specialitate al primăriei este format din compartimente funcționale 
          care asigură îndeplinirea atribuțiilor și competențelor autorităților administrației 
          publice locale.
        </Typography>

        <Box sx={{ mt: 3 }}>
          {organizationData.departments.map(department => (
            <Box key={department.id}>
              {renderDepartmentCard(department)}
              {department.subdivisions && department.subdivisions.map(sub => 
                renderDepartmentCard(sub, 1)
              )}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Dialog pentru detalii departament */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        {selectedDepartment && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Group sx={{ mr: 1, color: 'primary.main' }} />
                {selectedDepartment.name}
              </Box>
              <IconButton onClick={handleDialogClose} size="small">
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="body1" paragraph>
                    {selectedDepartment.description}
                  </Typography>
                  
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Date de contact
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Person />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${selectedDepartment.headTitle}: ${selectedDepartment.head}`}
                      />
                    </ListItem>
                    {selectedDepartment.phone && (
                      <ListItem>
                        <ListItemIcon>
                          <Phone />
                        </ListItemIcon>
                        <ListItemText primary={selectedDepartment.phone} />
                      </ListItem>
                    )}
                    {selectedDepartment.email && (
                      <ListItem>
                        <ListItemIcon>
                          <Email />
                        </ListItemIcon>
                        <ListItemText primary={selectedDepartment.email} />
                      </ListItem>
                    )}
                  </List>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {selectedDepartment.employees}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Angajați
                    </Typography>
                    
                    {selectedDepartment.subdivisions && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" color="secondary">
                          {selectedDepartment.subdivisions.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Birouri subordonate
                        </Typography>
                      </>
                    )}
                  </Paper>
                </Grid>
              </Grid>

              {selectedDepartment.subdivisions && selectedDepartment.subdivisions.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Birouri subordonate
                  </Typography>
                  {selectedDepartment.subdivisions.map(sub => (
                    <Paper key={sub.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" color="primary" gutterBottom>
                        {sub.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {sub.description}
                      </Typography>
                      <Typography variant="body2">
                        <strong>{sub.headTitle}:</strong> {sub.head}
                      </Typography>
                      <Chip 
                        label={`${sub.employees} angajați`} 
                        size="small" 
                        sx={{ mt: 1 }}
                      />
                    </Paper>
                  ))}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDialogClose}>Închide</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default OrganizarePage;