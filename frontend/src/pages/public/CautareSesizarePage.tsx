/**
 * Pagina pentru căutarea și urmărirea sesizărilor
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Chip,
  Grid,
  Divider,
  CircularProgress,
  Paper,
  Avatar,
  Step,
  StepLabel,
  Stepper
} from '@mui/material';
import {
  Search as SearchIcon,
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Done as DoneIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate, useSearchParams } from 'react-router-dom';
// import { format } from 'date-fns';
// import { ro } from 'date-fns/locale';

// Import servicii și tipuri
import { complaintsService } from '../../services/complaintsService';
import { Complaint } from '../../types/api';

// Styled components
const StatusChip = styled(Chip)<{ status: string }>(({ theme, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'submitted': return theme.palette.warning.main;
      case 'acknowledged': return theme.palette.info.main;
      case 'in_progress': return theme.palette.secondary.main;
      case 'resolved': return theme.palette.success.main;
      case 'closed': return theme.palette.grey[600];
      default: return theme.palette.grey[500];
    }
  };

  return {
    backgroundColor: getStatusColor(),
    color: 'white',
    fontWeight: 'bold'
  };
});

const UrgencyChip = styled(Chip)<{ urgency: string }>(({ theme, urgency }) => {
  const getUrgencyColor = () => {
    switch (urgency) {
      case 'low': return theme.palette.success.main;
      case 'normal': return theme.palette.warning.main;
      case 'high': return theme.palette.error.main;
      case 'critical': return theme.palette.error.dark;
      default: return theme.palette.grey[500];
    }
  };

  return {
    backgroundColor: getUrgencyColor(),
    color: 'white'
  };
});

const CautareSesizarePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  const [referenceNumber, setReferenceNumber] = useState(initialRef);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  useEffect(() => {
    if (initialRef) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    if (!referenceNumber.trim()) {
      setError('Vă rugăm să introduceți numărul de referință');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearchAttempted(true);

      const result = await complaintsService.searchByReference(referenceNumber.trim());
      setComplaint(result);
      
      if (!result) {
        setError('Nu a fost găsită nicio sesizare cu acest număr de referință');
      }
    } catch (err: any) {
      setError('Eroare la căutarea sesizării. Vă rugăm să încercați din nou.');
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'submitted': 'Înregistrată',
      'acknowledged': 'Confirmată',
      'in_progress': 'În lucru',
      'resolved': 'Rezolvată',
      'closed': 'Închisă'
    };
    return statusMap[status] || status;
  };

  const formatUrgencyLevel = (level: string): string => {
    const urgencyMap: Record<string, string> = {
      'low': 'Scăzută',
      'normal': 'Normală',
      'high': 'Ridicată',
      'critical': 'Critică'
    };
    return urgencyMap[level] || level;
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Nu este disponibil';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data invalidă';
    }
  };

  const getTimelineIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <AssignmentIcon />;
      case 'acknowledged': return <InfoIcon />;
      case 'in_progress': return <ScheduleIcon />;
      case 'resolved': return <CheckIcon />;
      case 'closed': return <DoneIcon />;
      default: return <InfoIcon />;
    }
  };

  const getTimelineColor = (status: string, isActive: boolean) => {
    if (!isActive) return 'grey.300';
    
    switch (status) {
      case 'submitted': return 'warning.main';
      case 'acknowledged': return 'info.main';
      case 'in_progress': return 'secondary.main';
      case 'resolved': return 'success.main';
      case 'closed': return 'primary.main';
      default: return 'grey.300';
    }
  };

  const timelineSteps = [
    { key: 'submitted', label: 'Înregistrată', field: 'submitted_at' },
    { key: 'acknowledged', label: 'Confirmată', field: 'acknowledged_at' },
    { key: 'in_progress', label: 'În lucru', field: 'started_at' },
    { key: 'resolved', label: 'Rezolvată', field: 'resolved_at' }
  ];

  const getCurrentStepIndex = (status: string): number => {
    const statusOrder = ['submitted', 'acknowledged', 'in_progress', 'resolved', 'closed'];
    return statusOrder.indexOf(status);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/servicii-publice')}
          sx={{ mb: 2 }}
        >
          Înapoi la Servicii Online
        </Button>
        
        <Typography variant="h3" gutterBottom color="primary">
          Căutare Sesizare
        </Typography>
        
        <Typography variant="body1" color="text.secondary">
          Introduceți numărul de referință pentru a urmări statusul sesizării dumneavoastră.
        </Typography>
      </Box>

      {/* Search Form */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Numărul de Referință
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'start' }}>
            <TextField
              fullWidth
              label="Numărul de referință"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Ex: SES-20241216-1234"
              helperText="Formatul: SES-AAAAMMDD-NNNN"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
              sx={{ minWidth: 120, height: 56 }}
            >
              {loading ? 'Caută...' : 'Caută'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* No Results */}
      {searchAttempted && !complaint && !loading && !error && (
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body1">
            Nu a fost găsită nicio sesizare cu numărul de referință "{referenceNumber}".
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Verificați că ați introdus corect numărul de referință sau contactați primăria 
            pentru asistență la <strong>0256 123 456</strong>.
          </Typography>
        </Alert>
      )}

      {/* Complaint Details */}
      {complaint && (
        <Box>
          {/* Basic Info */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {complaint.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Numărul de referință: <strong>{complaint.reference_number}</strong>
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'end' }}>
                  <StatusChip 
                    label={formatStatus(complaint.status)} 
                    status={complaint.status}
                  />
                  <UrgencyChip 
                    label={formatUrgencyLevel(complaint.urgency_level)}
                    urgency={complaint.urgency_level}
                    size="small"
                  />
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Data înregistrării:</Typography>
                  <Typography variant="body1">{formatDate(complaint.submitted_at)}</Typography>
                </Grid>
                
                {complaint.location_address && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Locația:</Typography>
                    <Typography variant="body1">{complaint.location_address}</Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Descrierea problemei:</Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {complaint.description}
                  </Typography>
                </Grid>

                {complaint.location_details && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Detalii locație:</Typography>
                    <Typography variant="body1">{complaint.location_details}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Timeline ca Stepper */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Evoluția Sesizării
              </Typography>
              
              <Stepper 
                activeStep={getCurrentStepIndex(complaint.status)} 
                orientation="vertical"
                sx={{ mt: 2 }}
              >
                {timelineSteps.map((step, index) => {
                  const currentStep = getCurrentStepIndex(complaint.status);
                  const isActive = index <= currentStep;
                  const date = complaint[step.field as keyof Complaint] as string;
                  
                  return (
                    <Step key={step.key} completed={index < currentStep}>
                      <StepLabel
                        StepIconComponent={() => (
                          <Avatar 
                            sx={{ 
                              bgcolor: isActive ? getTimelineColor(step.key, isActive) : 'grey.300',
                              color: 'white',
                              width: 32,
                              height: 32
                            }}
                          >
                            {getTimelineIcon(step.key)}
                          </Avatar>
                        )}
                      >
                        <Box>
                          <Typography 
                            variant="subtitle1" 
                            color={isActive ? 'primary' : 'text.secondary'}
                            fontWeight={isActive ? 'bold' : 'normal'}
                          >
                            {step.label}
                          </Typography>
                          {date && (
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(date)}
                            </Typography>
                          )}
                          {step.key === complaint.status && complaint.admin_notes && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              <strong>Notă:</strong> {complaint.admin_notes}
                            </Typography>
                          )}
                        </Box>
                      </StepLabel>
                    </Step>
                  );
                })}
              </Stepper>
            </CardContent>
          </Card>

          {/* Photos */}
          {complaint.attached_photos && complaint.attached_photos.length > 0 && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Fotografii Atașate
                </Typography>
                
                <Grid container spacing={2}>
                  {complaint.attached_photos.map((photo, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <img
                        src={photo}
                        alt={`Fotografie ${index + 1}`}
                        style={{
                          width: '100%',
                          height: 150,
                          objectFit: 'cover',
                          borderRadius: 8,
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(photo, '_blank')}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {complaint.status === 'resolved' && (
            <Alert severity="success">
              <Typography variant="body1">
                <strong>Sesizarea a fost rezolvată!</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Dacă considerați că problema nu a fost rezolvată în mod satisfăcător, 
                vă rugăm să contactați primăria la <strong>0256 123 456</strong> sau 
                să creați o nouă sesizare.
              </Typography>
            </Alert>
          )}

          {complaint.status === 'closed' && (
            <Alert severity="info">
              <Typography variant="body1">
                <strong>Sesizarea a fost închisă.</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Pentru informații suplimentare, contactați primăria la <strong>0256 123 456</strong>.
              </Typography>
            </Alert>
          )}
        </Box>
      )}

      {/* Help Section */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Aveți nevoie de ajutor?
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" fontWeight="bold">Telefon:</Typography>
              <Typography variant="body2">0256 123 456</Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="body2" fontWeight="bold">Email:</Typography>
              <Typography variant="body2">sesizari@primarie.ro</Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="body2" fontWeight="bold">Program:</Typography>
              <Typography variant="body2">L-J: 08:00-16:00, V: 08:00-14:00</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CautareSesizarePage;