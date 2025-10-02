/**
 * Pagina pentru Programări Online la Primărie
 * Implementează sistem complet de programări pentru serviciile publice
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  AlertTitle,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  IconButton,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  AccessTime,
  Person,
  CalendarToday,
  LocationOn,
  Description,
  CheckCircle,
  Info,
  Phone,
  Email,
  Assignment,
  Schedule,
  Close,
  NavigateNext,
  NavigateBefore
} from '@mui/icons-material';
import { format, addDays, parseISO, isWeekend } from 'date-fns';
import { ro } from 'date-fns/locale';
import axios from 'axios';

// Types
interface AppointmentService {
  id: number;
  name: string;
  slug: string;
  description: string;
  duration_minutes: number;
  max_daily_appointments: number;
  advance_booking_days: number;
  department: string;
  requires_documents: boolean;
  required_documents: string[];
  is_active: boolean;
}

interface AvailableDate {
  date: string;
  display_date: string;
  day_name: string;
  available_slots: number;
}

interface TimeSlot {
  time: string;
  is_available: boolean;
  display_time: string;
}

interface Appointment {
  id: string;
  appointment_number: string;
  service_id: number;
  citizen_name: string;
  citizen_email?: string;
  citizen_phone: string;
  citizen_cnp?: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  purpose?: string;
  additional_notes?: string;
  created_at: string;
  consent_given: boolean;
}

interface AppointmentForm {
  service_id: number;
  citizen_name: string;
  citizen_email: string;
  citizen_phone: string;
  citizen_cnp: string;
  appointment_date: string;
  appointment_time: string;
  purpose: string;
  additional_notes: string;
  consent_given: boolean;
}

const API_BASE_URL = 'http://localhost:8001/api/v1';

// Mock data pentru serviciile de programări
const mockServices: AppointmentService[] = [
  {
    id: 1,
    name: 'Eliberare Certificate',
    slug: 'certificate',
    description: 'Obținere certificate de urbanism, fiscale și alte acte oficiale',
    duration_minutes: 30,
    max_daily_appointments: 20,
    advance_booking_days: 3,
    department: 'Registratură',
    requires_documents: true,
    required_documents: ['Cartea de identitate', 'Dovada plății taxelor'],
    is_active: true
  },
  {
    id: 2,
    name: 'Consulturi Juridice',
    slug: 'juridice',
    description: 'Consultanță juridică în probleme administrative și legale',
    duration_minutes: 45,
    max_daily_appointments: 10,
    advance_booking_days: 7,
    department: 'Serviciul Juridic',
    requires_documents: false,
    required_documents: [],
    is_active: true
  },
  {
    id: 3,
    name: 'Autorizații Construcții',
    slug: 'constructii',
    description: 'Depunere și urmărire cereri pentru autorizații de construcție',
    duration_minutes: 60,
    max_daily_appointments: 8,
    advance_booking_days: 5,
    department: 'Direcția Tehnică',
    requires_documents: true,
    required_documents: ['Proiect tehnic', 'Certificat urbanism', 'Dovada proprietății'],
    is_active: true
  },
  {
    id: 4,
    name: 'Taxe și Impozite',
    slug: 'taxe',
    description: 'Clarificări privind plata taxelor și impozitelor locale',
    duration_minutes: 30,
    max_daily_appointments: 15,
    advance_booking_days: 2,
    department: 'Contabilitate',
    requires_documents: true,
    required_documents: ['Cartea de identitate', 'Documente proprietate'],
    is_active: true
  }
];

// Funcție pentru generarea datelor disponibile
const generateAvailableDates = (serviceId: number): AvailableDate[] => {
  const dates: AvailableDate[] = [];
  const service = mockServices.find(s => s.id === serviceId);
  if (!service) return dates;

  for (let i = 1; i <= service.advance_booking_days + 7; i++) {
    const date = addDays(new Date(), i);
    if (!isWeekend(date)) {
      dates.push({
        date: format(date, 'yyyy-MM-dd'),
        display_date: format(date, 'dd MMM yyyy', { locale: ro }),
        day_name: format(date, 'EEEE', { locale: ro }),
        available_slots: Math.floor(Math.random() * service.max_daily_appointments) + 1
      });
    }
  }
  return dates;
};

// Funcție pentru generarea intervalelor de timp disponibile
const generateTimeSlots = (serviceId: number, date: string): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const service = mockServices.find(s => s.id === serviceId);
  if (!service) return slots;

  // Programul de lucru: 8:00 - 16:00, cu pauză 12:00 - 13:00
  const morningSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
  const afternoonSlots = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30'];
  
  const allSlots = [...morningSlots, ...afternoonSlots];
  
  allSlots.forEach(time => {
    slots.push({
      time,
      is_available: Math.random() > 0.3, // 70% șanse să fie disponibil
      display_time: time
    });
  });
  
  return slots;
};

const ProgramariOnlinePage: React.FC = () => {
  const [services, setServices] = useState<AppointmentService[]>([]);
  const [selectedService, setSelectedService] = useState<AppointmentService | null>(null);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  const [appointmentForm, setAppointmentForm] = useState<AppointmentForm>({
    service_id: 0,
    citizen_name: '',
    citizen_email: '',
    citizen_phone: '',
    citizen_cnp: '',
    appointment_date: '',
    appointment_time: '',
    purpose: '',
    additional_notes: '',
    consent_given: false
  });

  // Load services on component mount
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setServices(mockServices);
    } catch (error) {
      setError('Eroare la încărcarea serviciilor. Vă rugăm să încercați din nou.');
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDates = async (serviceId: number) => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      const dates = generateAvailableDates(serviceId);
      setAvailableDates(dates);
    } catch (error) {
      setError('Eroare la încărcarea datelor disponibile.');
      console.error('Error loading dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async (serviceId: number, date: string) => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));
      const slots = generateTimeSlots(serviceId, date);
      setAvailableSlots(slots);
    } catch (error) {
      setError('Eroare la încărcarea orelor disponibile.');
      console.error('Error loading slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = async (service: AppointmentService) => {
    setSelectedService(service);
    setAppointmentForm(prev => ({ ...prev, service_id: service.id }));
    setActiveStep(1);
    await loadAvailableDates(service.id);
  };

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setAppointmentForm(prev => ({ ...prev, appointment_date: date }));
    setActiveStep(2);
    if (selectedService) {
      await loadAvailableSlots(selectedService.id, date);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setAppointmentForm(prev => ({ ...prev, appointment_time: time }));
    setActiveStep(3);
  };

  const handleFormSubmit = async () => {
    if (!appointmentForm.consent_given) {
      setError('Trebuie să acceptați prelucrarea datelor personale.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Simulate API delay and create mock appointment
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockAppointment: Appointment = {
        id: `apt_${Date.now()}`,
        appointment_number: `APP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        service_id: appointmentForm.service_id,
        citizen_name: appointmentForm.citizen_name,
        citizen_email: appointmentForm.citizen_email,
        citizen_phone: appointmentForm.citizen_phone,
        citizen_cnp: appointmentForm.citizen_cnp,
        appointment_date: appointmentForm.appointment_date,
        appointment_time: appointmentForm.appointment_time,
        status: 'confirmed',
        purpose: appointmentForm.purpose,
        additional_notes: appointmentForm.additional_notes || '',
        created_at: new Date().toISOString(),
        consent_given: appointmentForm.consent_given
      };
      
      setCreatedAppointment(mockAppointment);
      setSuccess('Programarea a fost creată cu succes!');
      setActiveStep(4);
    } catch (error: any) {
      const errorMessage = 'Eroare la crearea programării. Vă rugăm să încercați din nou.';
      setError(errorMessage);
      console.error('Error creating appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedService(null);
    setSelectedDate('');
    setSelectedTime('');
    setActiveStep(0);
    setAppointmentForm({
      service_id: 0,
      citizen_name: '',
      citizen_email: '',
      citizen_phone: '',
      citizen_cnp: '',
      appointment_date: '',
      appointment_time: '',
      purpose: '',
      additional_notes: '',
      consent_given: false
    });
    setCreatedAppointment(null);
    setError('');
    setSuccess('');
  };

  const steps = [
    'Selectează serviciul',
    'Alege data',
    'Selectează ora',
    'Completează datele',
    'Confirmare'
  ];

  if (loading && services.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Se încarcă serviciile disponibile...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Programări Online
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Programează-te online pentru serviciile primăriei. Evită cozile și alege ora care ți se potrivește.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Informații importante</AlertTitle>
          <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
            <li>Programările se pot face doar în zilele lucrătoare (Luni - Vineri)</li>
            <li>Programul de lucru: 08:00 - 16:00 cu pauză 12:00 - 13:00</li>
            <li>Vă rugăm să ajungeți cu 5 minute mai devreme</li>
            <li>Aveți nevoie de actele de identitate și documentele solicitate</li>
          </Box>
        </Alert>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Stepper */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} orientation="horizontal" alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      <Box>
        {/* Step 0: Select Service */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Selectează serviciul pentru care vrei să te programezi
            </Typography>
            
            <Grid container spacing={3}>
              {services.map((service) => (
                <Grid item xs={12} md={6} key={service.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 4 }
                    }}
                    onClick={() => handleServiceSelect(service)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {service.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {service.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip 
                          icon={<AccessTime />} 
                          label={`${service.duration_minutes} min`} 
                          size="small" 
                        />
                        <Chip 
                          icon={<LocationOn />} 
                          label={service.department} 
                          size="small" 
                        />
                        <Chip 
                          icon={<CalendarToday />} 
                          label={`${service.advance_booking_days} zile în avans`} 
                          size="small" 
                        />
                      </Box>

                      {service.requires_documents && (
                        <Box>
                          <Typography variant="caption" color="primary" fontWeight="bold">
                            Documente necesare:
                          </Typography>
                          <List dense>
                            {service.required_documents.map((doc, index) => (
                              <ListItem key={index} sx={{ py: 0, pl: 2 }}>
                                <ListItemIcon sx={{ minWidth: 20 }}>
                                  <Assignment fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={doc} 
                                  primaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </CardContent>
                    
                    <CardActions>
                      <Button 
                        variant="contained" 
                        fullWidth
                        endIcon={<NavigateNext />}
                      >
                        Selectează acest serviciu
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Step 1: Select Date */}
        {activeStep === 1 && selectedService && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Alege data programării pentru {selectedService.name}
            </Typography>
            
            <Grid container spacing={2}>
              {availableDates.map((dateOption) => (
                <Grid item xs={6} sm={4} md={3} key={dateOption.date}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 3 }
                    }}
                    onClick={() => handleDateSelect(dateOption.date)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6">
                        {dateOption.display_date}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dateOption.day_name}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={`${dateOption.available_slots} sloturi`} 
                          size="small" 
                          color="primary"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ mt: 3 }}>
              <Button 
                variant="outlined" 
                onClick={() => setActiveStep(0)}
                startIcon={<NavigateBefore />}
              >
                Înapoi la servicii
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 2: Select Time */}
        {activeStep === 2 && selectedService && selectedDate && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Selectează ora pentru {format(parseISO(selectedDate), 'dd MMMM yyyy', { locale: ro })}
            </Typography>
            
            <Grid container spacing={2}>
              {availableSlots.map((slot) => (
                <Grid item xs={6} sm={4} md={3} key={slot.time}>
                  <Card 
                    sx={{ 
                      cursor: slot.is_available ? 'pointer' : 'not-allowed',
                      opacity: slot.is_available ? 1 : 0.5,
                      '&:hover': slot.is_available ? { boxShadow: 3 } : {}
                    }}
                    onClick={() => slot.is_available && handleTimeSelect(slot.time)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6">
                        {slot.display_time}
                      </Typography>
                      <Chip 
                        label={slot.is_available ? 'Disponibil' : 'Ocupat'} 
                        size="small" 
                        color={slot.is_available ? 'success' : 'error'}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ mt: 3 }}>
              <Button 
                variant="outlined" 
                onClick={() => setActiveStep(1)}
                startIcon={<NavigateBefore />}
              >
                Înapoi la date
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 3: Fill Form */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Completează datele pentru programare
            </Typography>
            
            <Paper elevation={1} sx={{ p: 3, mb: 3, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom color="primary">
                Rezumat programare
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Serviciu:</strong> {selectedService?.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Departament:</strong> {selectedService?.department}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Data:</strong> {selectedDate && format(parseISO(selectedDate), 'dd MMMM yyyy', { locale: ro })}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Ora:</strong> {selectedTime}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Durata:</strong> {selectedService?.duration_minutes} minute
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Nume complet"
                  value={appointmentForm.citizen_name}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, citizen_name: e.target.value }))}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Telefon"
                  type="tel"
                  value={appointmentForm.citizen_phone}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, citizen_phone: e.target.value }))}
                  InputProps={{
                    startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email (opțional)"
                  type="email"
                  value={appointmentForm.citizen_email}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, citizen_email: e.target.value }))}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CNP (opțional)"
                  value={appointmentForm.citizen_cnp}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, citizen_cnp: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Scopul programării"
                  multiline
                  rows={2}
                  value={appointmentForm.purpose}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="De exemplu: Solicitare certificat de urbanism pentru construcție garaj"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observații suplimentare (opțional)"
                  multiline
                  rows={2}
                  value={appointmentForm.additional_notes}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, additional_notes: e.target.value }))}
                  placeholder="Orice informații suplimentare care ar putea fi utile"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={appointmentForm.consent_given}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, consent_given: e.target.checked }))}
                      required
                    />
                  }
                  label="Sunt de acord cu prelucrarea datelor personale conform Regulamentului GDPR"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => setActiveStep(2)}
                startIcon={<NavigateBefore />}
              >
                Înapoi la ore
              </Button>
              
              <Button 
                variant="contained" 
                onClick={handleFormSubmit}
                disabled={!appointmentForm.citizen_name || !appointmentForm.citizen_phone || !appointmentForm.consent_given}
                endIcon={<CheckCircle />}
              >
                Creează programarea
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 4: Confirmation */}
        {activeStep === 4 && createdAppointment && (
          <Box>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom color="success.main">
                Programare confirmată!
              </Typography>
            </Box>

            <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Detalii programare
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Număr programare:</strong> {createdAppointment.appointment_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Serviciu:</strong> {selectedService?.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Data și ora:</strong> {format(parseISO(createdAppointment.appointment_date), 'dd MMMM yyyy', { locale: ro })} la {createdAppointment.appointment_time}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Departament:</strong> {selectedService?.department}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1">
                    <strong>Status:</strong> <Chip label="Programat" color="success" size="small" />
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Alert severity="info">
              <AlertTitle>Ce urmează?</AlertTitle>
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                <li>Notați numărul programării: <strong>{createdAppointment.appointment_number}</strong></li>
                <li>Ajungeți cu 5 minute mai devreme la sediul primăriei</li>
                <li>Aveți asupra dumneavoastră actele de identitate și documentele necesare</li>
                <li>Pentru modificări sau anulări, contactați primăria</li>
              </Box>
            </Alert>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button 
                variant="contained" 
                onClick={resetForm}
                size="large"
              >
                Fă o nouă programare
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default ProgramariOnlinePage;