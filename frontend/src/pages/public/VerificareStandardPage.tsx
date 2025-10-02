import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Grid,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Payment {
  id: string;
  payment_id: string;
  reference_number: string;
  tax_type_code: string;
  payer_name: string;
  amount: number;
  penalty_amount: number;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  payment_date?: string;
}

const VerificarePlatiPage: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError('Introduceți numărul de referință pentru căutare');
      return;
    }

    setLoading(true);
    setError('');
    setPayment(null);
    setSearchPerformed(true);

    try {
      const response = await axios.get(
        `http://localhost:8001/api/v1/payments/reference/${searchValue.trim()}`
      );
      setPayment(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError('Nu a fost găsită nicio plată cu acest număr de referință');
      } else {
        setError('Eroare la căutarea plății. Încercați din nou.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon color="success" />;
      case 'pending':
        return <ScheduleIcon color="warning" />;
      case 'processing':
        return <ScheduleIcon color="info" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'cancelled':
        return <CancelIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Finalizată';
      case 'pending':
        return 'În așteptare';
      case 'processing':
        return 'În procesare';
      case 'failed':
        return 'Eșuată';
      case 'cancelled':
        return 'Anulată';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): "success" | "warning" | "info" | "error" | "default" => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'failed':
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #004990 0%, #0079C1 100%)', color: 'white' }}>
        <Box display="flex" alignItems="center" mb={2}>
          <SearchIcon sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h3" component="h1" fontWeight="bold">
            Verificare Plăți
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Verifică statusul plăților efectuate prin Ghișeul.ro
        </Typography>
      </Paper>

      {/* Search Form */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            <SearchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Căutare Plată
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Numărul de Referință"
                placeholder="Ex: PAY-20250821-1234"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                helperText="Introduceți numărul de referință primit la efectuarea plății"
                InputProps={{
                  style: { fontFamily: 'monospace' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleSearch}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                fullWidth
                sx={{ py: 1.5 }}
              >
                {loading ? 'Caută...' : 'Caută Plata'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* No Results */}
      {searchPerformed && !payment && !loading && !error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Nu a fost găsită nicio plată cu numărul de referință specificat.
          Verificați că ați introdus corect numărul de referință.
        </Alert>
      )}

      {/* Payment Details */}
      {payment && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
              <Typography variant="h6" color="primary">
                <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Detalii Plată
              </Typography>
              <Chip
                icon={getStatusIcon(payment.status)}
                label={getStatusLabel(payment.status)}
                color={getStatusColor(payment.status)}
                size="medium"
              />
            </Box>

            <List>
              <ListItem>
                <ListItemIcon><ReceiptIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Numărul de Referință" 
                  secondary={
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold' }}>
                      {payment.reference_number}
                    </Typography>
                  }
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon><PaymentIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Suma Totală" 
                  secondary={
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      {payment.total_amount.toFixed(2)} LEI
                    </Typography>
                  }
                />
              </ListItem>

              {payment.penalty_amount > 0 && (
                <ListItem>
                  <ListItemIcon><InfoIcon color="warning" /></ListItemIcon>
                  <ListItemText 
                    primary="Detaliu Sumă" 
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Suma de bază: {payment.amount.toFixed(2)} LEI
                        </Typography>
                        <Typography variant="body2" color="warning.main">
                          Penalizări: {payment.penalty_amount.toFixed(2)} LEI
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              )}

              <ListItem>
                <ListItemIcon><InfoIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Plătitor" 
                  secondary={payment.payer_name} 
                />
              </ListItem>

              <ListItem>
                <ListItemIcon><InfoIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Tipul Taxei" 
                  secondary={payment.tax_type_code} 
                />
              </ListItem>

              <ListItem>
                <ListItemIcon><InfoIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Metoda de Plată" 
                  secondary={
                    <Chip 
                      label={payment.payment_method === 'ghiseul_ro' ? 'Ghișeul.ro' : payment.payment_method}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  }
                />
              </ListItem>

              <Divider sx={{ my: 2 }} />

              <ListItem>
                <ListItemIcon><ScheduleIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Data Creării" 
                  secondary={formatDate(payment.created_at)} 
                />
              </ListItem>

              {payment.payment_date && (
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Data Plății" 
                    secondary={formatDate(payment.payment_date)} 
                  />
                </ListItem>
              )}
            </List>

            {/* Status-specific information */}
            {payment.status === 'completed' && (
              <Alert severity="success" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Plata a fost finalizată cu succes!</strong>
                  <br />
                  Confirmarea a fost trimisă pe email și plata a fost înregistrată în sistemul primăriei.
                </Typography>
              </Alert>
            )}

            {payment.status === 'pending' && (
              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Plata este în așteptare.</strong>
                  <br />
                  Procesul de plată nu a fost încă finalizat. Dacă ați inițiat plata prin Ghișeul.ro, 
                  vă rugăm să finalizați tranzacția.
                </Typography>
              </Alert>
            )}

            {payment.status === 'processing' && (
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Plata este în procesare.</strong>
                  <br />
                  Tranzacția este în curs de procesare prin Ghișeul.ro. 
                  Statusul va fi actualizat în scurt timp.
                </Typography>
              </Alert>
            )}

            {(payment.status === 'failed' || payment.status === 'cancelled') && (
              <Alert severity="error" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Plata nu a fost finalizată.</strong>
                  <br />
                  Pentru a relua procesul de plată, vă rugăm să accesați din nou secțiunea de plăți online.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            ℹ️ Informații Utile
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="• Numărul de referință este format din prefixul PAY urmat de data și un cod unic" 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="• Plățile prin Ghișeul.ro sunt procesate în timp real" 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="• Pentru plățile finalizate, confirmarea este trimisă automat pe email" 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="• În caz de probleme, contactați serviciul clienți al primăriei" 
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Container>
  );
};

export default VerificarePlatiPage;