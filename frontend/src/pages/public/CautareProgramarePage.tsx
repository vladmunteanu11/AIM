/**
 * Pagina pentru căutarea programărilor existente
 * Permite verificarea statusului unei programări după numărul de programare
 */
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import {
  Search,
  Event,
  AccessTime,
  Person,
  Phone,
  Email,
  LocationOn,
  Assignment,
  CheckCircle,
  Schedule,
  Cancel,
  Warning
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import axios from 'axios';

interface Appointment {
  id: string;
  appointment_number: string;
  service_id: number;
  citizen_name: string;
  citizen_email?: string;
  citizen_phone: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  purpose?: string;
  additional_notes?: string;
  created_at: string;
  confirmed_at?: string;
  cancelled_at?: string;
}

interface AppointmentService {
  id: number;
  name: string;
  department: string;
  duration_minutes: number;
}

const API_BASE_URL = 'http://localhost:8001/api/v1';

const CautareProgramarePage: React.FC = () => {
  const [appointmentNumber, setAppointmentNumber] = useState('');
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [service, setService] = useState<AppointmentService | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'no_show':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programat';
      case 'confirmed':
        return 'Confirmat';
      case 'completed':
        return 'Finalizat';
      case 'cancelled':
        return 'Anulat';
      case 'no_show':
        return 'Nu s-a prezentat';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Schedule />;
      case 'confirmed':
        return <CheckCircle />;
      case 'completed':
        return <CheckCircle />;
      case 'cancelled':
        return <Cancel />;
      case 'no_show':
        return <Warning />;
      default:
        return <Schedule />;
    }
  };

  const handleSearch = async () => {
    if (!appointmentNumber.trim()) {
      setError('Introduceți numărul programării');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setAppointment(null);
      setService(null);

      // Caută programarea
      const appointmentResponse = await axios.get(
        `${API_BASE_URL}/appointments/number/${appointmentNumber.trim()}`
      );
      setAppointment(appointmentResponse.data);

      // Obține informațiile serviciului
      const serviceResponse = await axios.get(
        `${API_BASE_URL}/appointments/services/${appointmentResponse.data.service_id}`
      );
      setService(serviceResponse.data);

    } catch (error: any) {
      if (error.response?.status === 404) {
        setError('Programarea cu acest număr nu a fost găsită. Verificați numărul și încercați din nou.');
      } else {
        setError('Eroare la căutarea programării. Vă rugăm să încercați din nou.');
      }
      console.error('Error searching appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Verifică Programarea
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Introduceți numărul programării pentru a verifica statusul și detaliile
        </Typography>
      </Box>

      {/* Search Form */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            label="Numărul programării"
            placeholder="Ex: PROG-20241201-1234"
            value={appointmentNumber}
            onChange={(e) => setAppointmentNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            error={!!error && !appointment}
            helperText="Numărul programării se găsește în confirmarea primită"
            InputProps={{
              startAdornment: <Assignment sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            sx={{ minWidth: 120, height: 56 }}
            startIcon={loading ? <CircularProgress size={20} /> : <Search />}
          >
            {loading ? 'Caută...' : 'Caută'}
          </Button>
        </Box>
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Appointment Details */}
      {appointment && service && (
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              {getStatusIcon(appointment.status)}
              <Typography variant="h5" sx={{ ml: 1, flexGrow: 1 }}>
                Detalii Programare
              </Typography>
              <Chip
                label={getStatusLabel(appointment.status)}
                color={getStatusColor(appointment.status) as any}
                size="medium"
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assignment sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Număr programare
                    </Typography>
                    <Typography variant="h6">
                      {appointment.appointment_number}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Serviciu
                    </Typography>
                    <Typography variant="h6">
                      {service.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {service.department}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Event sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Data programării
                    </Typography>
                    <Typography variant="h6">
                      {format(parseISO(appointment.appointment_date), 'EEEE, dd MMMM yyyy', { locale: ro })}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Ora și durata
                    </Typography>
                    <Typography variant="h6">
                      {appointment.appointment_time}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {service.duration_minutes} minute
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Persoana programată
                    </Typography>
                    <Typography variant="h6">
                      {appointment.citizen_name}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Telefon contact
                    </Typography>
                    <Typography variant="h6">
                      {appointment.citizen_phone}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {appointment.citizen_email && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Email sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {appointment.citizen_email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {appointment.purpose && (
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Scopul programării
                    </Typography>
                    <Typography variant="body1">
                      {appointment.purpose}
                    </Typography>
                  </Box>
                </Grid>
              )}

              {appointment.additional_notes && (
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Observații
                    </Typography>
                    <Typography variant="body1">
                      {appointment.additional_notes}
                    </Typography>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Programat la
                  </Typography>
                  <Typography variant="body2">
                    {format(parseISO(appointment.created_at), 'dd MMMM yyyy, HH:mm', { locale: ro })}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Status-specific information */}
            {appointment.status === 'scheduled' && (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Programarea este confirmată.</strong> Vă rugăm să ajungeți cu 5 minute mai devreme 
                  la sediul primăriei și să aveți asupra dumneavoastră actele de identitate necesare.
                </Typography>
              </Alert>
            )}

            {appointment.status === 'confirmed' && (
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>Programarea este confirmată oficial.</strong> Vă așteptăm la data și ora stabilite.
                  {appointment.confirmed_at && (
                    <span> Confirmată la: {format(parseISO(appointment.confirmed_at), 'dd MMMM yyyy, HH:mm', { locale: ro })}</span>
                  )}
                </Typography>
              </Alert>
            )}

            {appointment.status === 'completed' && (
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>Programarea a fost finalizată cu succes.</strong> Mulțumim că ați folosit serviciile online ale primăriei.
                </Typography>
              </Alert>
            )}

            {appointment.status === 'cancelled' && (
              <Alert severity="error">
                <Typography variant="body2">
                  <strong>Programarea a fost anulată.</strong>
                  {appointment.cancelled_at && (
                    <span> Anulată la: {format(parseISO(appointment.cancelled_at), 'dd MMMM yyyy, HH:mm', { locale: ro })}</span>
                  )}
                  {' '}Pentru o nouă programare, accesați pagina de programări online.
                </Typography>
              </Alert>
            )}

            {appointment.status === 'no_show' && (
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Nu v-ați prezentat la programare.</strong> Pentru o nouă programare, vă rugăm să 
                  contactați primăria sau să utilizați din nou sistemul online.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help section */}
      <Paper elevation={1} sx={{ p: 3, mt: 4, backgroundColor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          Aveți nevoie de ajutor?
        </Typography>
        <Typography variant="body2" paragraph>
          Dacă nu găsiți programarea sau aveți probleme, vă rugăm să contactați primăria:
        </Typography>
        <Typography variant="body2">
          • <strong>Telefon:</strong> 0256 123 456<br/>
          • <strong>Email:</strong> contact@primarie-exemplu.ro<br/>
          • <strong>Program:</strong> Luni - Vineri, 08:00 - 16:00
        </Typography>
      </Paper>
    </Container>
  );
};

export default CautareProgramarePage;