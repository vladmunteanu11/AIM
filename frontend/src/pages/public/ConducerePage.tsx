/**
 * Pagina "Conducerea" - Profiluri detaliate ale conducerii primăriei
 * Include primar, viceprimar(i), secretar și membrii consiliului local
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Person,
  Phone,
  Email,
  Schedule,
  Group,
  Gavel,
  Close,
  ContactMail,
  BusinessCenter,
  School,
  DateRange,
  LocationOn,
} from '@mui/icons-material';
import { useMunicipalityConfig } from '../../hooks/useMunicipalityConfig';

interface Leader {
  id: string;
  name: string;
  title: string;
  photo?: string;
  phone: string;
  email: string;
  office: string;
  officeHours: string;
  audienceSchedule: string;
  biography: string;
  education: string[];
  experience: string[];
  responsibilities: string[];
  achievements: string[];
  startDate: string;
}

interface CouncilMember {
  id: string;
  name: string;
  party: string;
  position?: string;
  committee: string;
  phone?: string;
  email?: string;
  biography?: string;
  profession: string;
  startDate: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const ConducerePage: React.FC = () => {
  const { config } = useMunicipalityConfig();
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Date exemplu pentru conducere
  const leaders: Leader[] = [
    {
      id: 'primar',
      name: config?.mayor_name || 'Ion Popescu',
      title: 'Primar',
      photo: '/assets/photos/primar.jpg',
      phone: '0256 123 456',
      email: 'primar@primarie.ro',
      office: 'Camera 101, etajul 1',
      officeHours: 'Luni - Joi: 08:00-16:00, Vineri: 08:00-14:00',
      audienceSchedule: 'Miercuri: 14:00-16:00 (cu programare)',
      biography: 'Ales primar în anul 2020, cu experiență vastă în administrația publică și dezvoltarea locală. Licențiat în științe politice și masterat în management public.',
      education: [
        'Masterat în Management Public - Universitatea din București (2010)',
        'Licență în Științe Politice - Universitatea Babeș-Bolyai Cluj (2008)',
        'Cursuri de perfecționare în Administrația Publică Locală (2015-2020)'
      ],
      experience: [
        'Primar - Primăria Exemplu (2020 - prezent)',
        'Consilier local - Consiliul Local Exemplu (2016 - 2020)',
        'Director executiv - Camera de Comerț Județeană (2012 - 2016)',
        'Specialist în administrația publică - Prefectura Exemplu (2008 - 2012)'
      ],
      responsibilities: [
        'Conducerea executivă a primăriei',
        'Reprezentarea UAT în relațiile cu alte instituții',
        'Coordonarea implementării strategiei de dezvoltare locală',
        'Asigurarea respectării legilor și hotărârilor consiliului local',
        'Gestionarea situațiilor de urgență'
      ],
      achievements: [
        'Atragerea a 2.5 milioane euro fonduri europene pentru modernizarea infrastructurii',
        'Implementarea programului de digitalizare a serviciilor publice',
        'Creșterea cu 30% a veniturilor la bugetul local',
        'Finalizarea proiectului de reabilitare a școlilor din comună'
      ],
      startDate: '2020-10-15'
    },
    {
      id: 'viceprimar',
      name: 'Maria Ionescu',
      title: 'Viceprimar',
      photo: '/assets/photos/viceprimar.jpg',
      phone: '0256 123 457',
      email: 'viceprimar@primarie.ro',
      office: 'Camera 102, etajul 1',
      officeHours: 'Luni - Joi: 08:00-16:00, Vineri: 08:00-14:00',
      audienceSchedule: 'Joi: 10:00-12:00 (cu programare)',
      biography: 'Economist cu experiență în dezvoltarea proiectelor europene și managementul investițiilor publice.',
      education: [
        'Masterat în Economie Europeană - Academia de Studii Economice (2012)',
        'Licență în Economie - Universitatea Babeș-Bolyai Cluj (2010)'
      ],
      experience: [
        'Viceprimar - Primăria Exemplu (2020 - prezent)',
        'Manager de proiect - Agenția pentru Dezvoltare Regională (2015 - 2020)',
        'Economist principal - Consiliul Județean (2012 - 2015)'
      ],
      responsibilities: [
        'Dezvoltare locală și investiții',
        'Coordonarea proiectelor cu finanțare europeană',
        'Relația cu mediul de afaceri local',
        'Supervizarea departamentelor tehnice'
      ],
      achievements: [
        'Coordonarea a 5 proiecte europene în valoare de 4 milioane euro',
        'Implementarea sistemului de management al proiectelor',
        'Crearea parcului industrial local'
      ],
      startDate: '2020-10-15'
    },
    {
      id: 'secretar',
      name: 'Gheorghe Vasilescu',
      title: 'Secretar',
      photo: '/assets/photos/secretar.jpg',
      phone: '0256 123 458',
      email: 'secretar@primarie.ro',
      office: 'Camera 103, etajul 1',
      officeHours: 'Luni - Joi: 08:00-16:00, Vineri: 08:00-14:00',
      audienceSchedule: 'Marți: 09:00-11:00',
      biography: 'Funcționar public de carieră cu experiență vastă în administrația publică locală și legislația în domeniu.',
      education: [
        'Masterat în Drept Administrativ - Universitatea din București (2008)',
        'Licență în Drept - Universitatea Babeș-Bolyai Cluj (2006)',
        'Școala Națională de Administrație Publică (2007)'
      ],
      experience: [
        'Secretar - Primăria Exemplu (2015 - prezent)',
        'Secretar adjunct - Primăria Exemplu (2010 - 2015)',
        'Consilier juridic - Prefectura Județeană (2008 - 2010)'
      ],
      responsibilities: [
        'Asigurarea respectării legalității actelor administrative',
        'Coordonarea aparatului de specialitate al primăriei',
        'Pregătirea ședințelor consiliului local',
        'Gestionarea documentelor și arhivei instituției'
      ],
      achievements: [
        'Implementarea sistemului de management al calității ISO 9001',
        'Modernizarea sistemului de arhivă electronică',
        'Coordonarea procesului de digitalizare a procedurilor interne'
      ],
      startDate: '2015-01-15'
    }
  ];

  // Date exemplu pentru consiliul local
  const councilMembers: CouncilMember[] = [
    {
      id: 'cl1',
      name: 'Andrei Popescu',
      party: 'PNL',
      position: 'Președinte Consiliu Local',
      committee: 'Comisia pentru dezvoltare locală',
      phone: '0256 123 470',
      email: 'a.popescu@consiliul-local.ro',
      profession: 'Inginer',
      startDate: '2020-10-15',
      biography: 'Inginer cu experiență în infrastructura locală și dezvoltare durabilă.'
    },
    {
      id: 'cl2',
      name: 'Elena Marin',
      party: 'PSD',
      position: 'Vicepreședinte',
      committee: 'Comisia pentru buget-finanțe',
      phone: '0256 123 471',
      email: 'e.marin@consiliul-local.ro',
      profession: 'Economist',
      startDate: '2020-10-15'
    },
    {
      id: 'cl3',
      name: 'Mihai Georgescu',
      party: 'USR',
      committee: 'Comisia pentru urbanism',
      profession: 'Arhitect',
      startDate: '2020-10-15'
    },
    {
      id: 'cl4',
      name: 'Ana Stoica',
      party: 'PNL',
      committee: 'Comisia pentru servicii publice',
      profession: 'Medic',
      startDate: '2020-10-15'
    },
    {
      id: 'cl5',
      name: 'Radu Constantin',
      party: 'PSD',
      committee: 'Comisia pentru dezvoltare locală',
      profession: 'Agricultor',
      startDate: '2020-10-15'
    }
  ];

  const handleLeaderClick = (leader: Leader) => {
    setSelectedLeader(leader);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedLeader(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, bgcolor: 'primary.50' }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Conducerea Primăriei
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Persoanele care conduc și reprezintă {config?.name || 'primăria'} în relațiile cu cetățenii și instituțiile
        </Typography>
      </Paper>

      {/* Tabs Navigation */}
      <Paper elevation={1} sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Conducerea Executivă" icon={<Person />} />
          <Tab label="Consiliul Local" icon={<Group />} />
        </Tabs>
      </Paper>

      {/* Tab Panel 1 - Conducerea Executivă */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {leaders.map((leader) => (
            <Grid item xs={12} md={4} key={leader.id}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  '&:hover': { 
                    boxShadow: 6,
                    transform: 'translateY(-4px)',
                    transition: 'all 0.3s ease-in-out'
                  }
                }}
                onClick={() => handleLeaderClick(leader)}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar 
                    src={leader.photo}
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      mx: 'auto', 
                      mb: 3,
                      border: '4px solid',
                      borderColor: leader.id === 'primar' ? 'primary.main' : 
                                  leader.id === 'viceprimar' ? 'secondary.main' : 'success.main',
                      fontSize: '2.5rem'
                    }}
                  >
                    {leader.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  
                  <Typography variant="h5" color="primary" gutterBottom>
                    {leader.title}
                  </Typography>
                  
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    {leader.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {leader.biography.substring(0, 120)}...
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ textAlign: 'left' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Phone sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2">{leader.phone}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Email sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2">{leader.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Schedule sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2">
                        {leader.audienceSchedule}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    startIcon={<ContactMail />}
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    Vezi profil complet
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Tab Panel 2 - Consiliul Local */}
      <TabPanel value={tabValue} index={1}>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom color="primary">
            <Gavel sx={{ mr: 1, verticalAlign: 'middle' }} />
            Consiliul Local - Mandatul 2020-2024
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Consiliul Local este autoritatea deliberativă a unității administrativ-teritoriale, 
            ales prin vot universal, direct, secret și liber exprimat pentru un mandat de 4 ani.
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Chip label="15 consilieri locali" color="primary" sx={{ mr: 1 }} />
            <Chip label="5 comisii de specialitate" color="secondary" sx={{ mr: 1 }} />
            <Chip label="Ședințe lunare" color="default" />
          </Box>
        </Paper>

        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.50' }}>
                <TableCell><strong>Nume și Prenume</strong></TableCell>
                <TableCell><strong>Partidul</strong></TableCell>
                <TableCell><strong>Funcția</strong></TableCell>
                <TableCell><strong>Comisia</strong></TableCell>
                <TableCell><strong>Profesia</strong></TableCell>
                <TableCell><strong>Contact</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {councilMembers.map((member) => (
                <TableRow key={member.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.main' }}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {member.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={member.party} 
                      size="small" 
                      color={
                        member.party === 'PNL' ? 'primary' : 
                        member.party === 'PSD' ? 'secondary' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {member.position && (
                      <Chip label={member.position} size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{member.committee}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{member.profession}</Typography>
                  </TableCell>
                  <TableCell>
                    {member.phone && (
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2">{member.phone}</Typography>
                        {member.email && (
                          <Typography variant="body2" color="text.secondary">
                            {member.email}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Paper elevation={1} sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Notă:</strong> Pentru audiențe la consilierii locali, vă rugăm să luați legătura telefonic 
            pentru stabilirea unei programări. Ședințele consiliului local sunt publice și au loc în ultima joi a fiecărei luni.
          </Typography>
        </Paper>
      </TabPanel>

      {/* Dialog pentru profil complet */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        {selectedLeader && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={selectedLeader.photo}
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    mr: 2,
                    fontSize: '1.5rem'
                  }}
                >
                  {selectedLeader.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Box>
                  <Typography variant="h6" color="primary">
                    {selectedLeader.title}
                  </Typography>
                  <Typography variant="h5">
                    {selectedLeader.name}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={handleDialogClose} size="small">
                <Close />
              </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="body1" paragraph>
                    {selectedLeader.biography}
                  </Typography>
                  
                  <Typography variant="h6" gutterBottom sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
                    <BusinessCenter sx={{ mr: 1 }} />
                    Responsabilități principale
                  </Typography>
                  <List dense>
                    {selectedLeader.responsibilities.map((resp, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Gavel color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={resp} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="h6" gutterBottom sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
                    <School sx={{ mr: 1 }} />
                    Pregătire profesională
                  </Typography>
                  <List dense>
                    {selectedLeader.education.map((edu, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={edu} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Realizări principale
                  </Typography>
                  <List dense>
                    {selectedLeader.achievements.map((achievement, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={achievement} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Informații de contact
                    </Typography>
                    
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <Phone color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Telefon"
                          secondary={selectedLeader.phone}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          <Email color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Email"
                          secondary={selectedLeader.email}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          <LocationOn color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Biroul"
                          secondary={selectedLeader.office}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          <Schedule color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Program audiențe"
                          secondary={selectedLeader.audienceSchedule}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          <DateRange color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="În funcție din"
                          secondary={new Date(selectedLeader.startDate).toLocaleDateString('ro-RO')}
                        />
                      </ListItem>
                    </List>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Program de lucru
                    </Typography>
                    <Typography variant="body2">
                      {selectedLeader.officeHours}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, pt: 1 }}>
              <Button 
                variant="contained" 
                startIcon={<ContactMail />}
                href={`mailto:${selectedLeader.email}`}
              >
                Trimite email
              </Button>
              <Button onClick={handleDialogClose}>Închide</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default ConducerePage;