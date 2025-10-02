/**
 * Pagina "Despre Primărie" - Implementare conformă DigiLocal
 * Informații generale despre primărie, istorie, misiune, viziune
 */
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material';
import {
  LocationOn,
  Phone,
  Email,
  Schedule,
  AccountBalance,
  People,
  Gavel,
  Description,
} from '@mui/icons-material';
import { useMunicipalityConfig } from '../../hooks/useMunicipalityConfig';

const DesprePrimariePage: React.FC = () => {
  const { config } = useMunicipalityConfig();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, bgcolor: 'primary.50' }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Despre {config?.name || 'Primăria'}
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          {config?.official_name || 'Informații generale despre primărie'}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body1" paragraph>
          Primăria noastră servește comunitatea cu dedicare și transparență, oferind servicii publice 
          de calitate și promovând dezvoltarea durabilă a localității. Suntem aici pentru a răspunde 
          nevoilor cetățenilor și pentru a construi împreună o comunitate mai bună.
        </Typography>
      </Paper>

      <Grid container spacing={4}>
        {/* Informații Contact */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AccountBalance sx={{ mr: 1 }} />
                Date de Contact
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <LocationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Adresa"
                    secondary={config?.address || 'Strada Principală nr. 1'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Phone color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Telefon"
                    secondary={config?.contact_phone || '0256 123 456'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Email color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={config?.contact_email || 'contact@primarie.ro'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Schedule color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Program de lucru"
                    secondary="Luni - Joi: 08:00 - 16:00, Vineri: 08:00 - 14:00"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Misiune și Viziune */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <People sx={{ mr: 1 }} />
                Misiune și Viziune
              </Typography>
              
              <Box mb={3}>
                <Typography variant="h6" gutterBottom color="secondary">
                  Misiunea noastră
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Să oferim servicii publice de înaltă calitate, să promovăm dezvoltarea economică și socială 
                  durabilă, și să asigurăm o administrație transparentă și eficientă în beneficiul tuturor cetățenilor.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom color="secondary">
                  Viziunea noastră
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  O comunitate modernă, digitalizată și prosperă, unde fiecare cetățean are acces la servicii 
                  publice de calitate și poate participa activ la viața democratică locală.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Structura Organizatorică - Preview */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Gavel sx={{ mr: 1 }} />
              Structura Organizatorică
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      Primar
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', my: 1 }}>
                      {config?.mayor_name || 'Numele Primarului'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Autoritatea executivă locală
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      Consiliul Local
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Autoritatea deliberativă locală
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      Aparatul de Specialitate
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Compartimente și servicii
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Pentru detalii complete despre structura organizatorică, vizitați pagina{' '}
                <Typography component="span" color="primary" sx={{ fontWeight: 'bold' }}>
                  "Organizare"
                </Typography>
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Informații Generale */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Description sx={{ mr: 1 }} />
              Informații Generale
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color="secondary">
                  Atribuții principale
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Description color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Servicii publice locale" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Description color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Urbanism și amenajarea teritoriului" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Description color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Administrarea bunurilor publice" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Description color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Dezvoltare locală și investiții" />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color="secondary">
                  Servicii pentru cetățeni
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Description color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Acte de stare civilă" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Description color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Autorizații de construire" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Description color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Taxe și impozite locale" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Description color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Asistență socială" />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Footer cu link-uri utile */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            Pentru informații detaliate despre organizare, conducere și strategii, vizitați secțiunile dedicate din meniul principal.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default DesprePrimariePage;