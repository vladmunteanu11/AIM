import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Grid
} from '@mui/material';
import {
  Security as SecurityIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

interface Payment {
  id: string;
  payment_id: string;
  reference_number: string;
  tax_type_code: string;
  payer_name: string;
  total_amount: number;
  status: string;
}

const MockGhiseulPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const paymentId = searchParams.get('payment_id');
  const sessionId = searchParams.get('session_id');
  const amount = searchParams.get('amount');

  useEffect(() => {
    if (paymentId) {
      loadPayment();
    } else {
      setError('ID-ul plății lipsește');
      setLoading(false);
    }
  }, [paymentId]);

  const loadPayment = async () => {
    try {
      const response = await axios.get(`http://localhost:8001/api/v1/payments/${paymentId}`);
      setPayment(response.data);
    } catch (error) {
      setError('Plata nu a fost găsită');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!paymentId) return;

    setProcessing(true);
    try {
      // Simulează procesarea plății
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Marchează plata ca finalizată
      await axios.post(`http://localhost:8001/api/v1/payments/${paymentId}/simulate-success`);
      
      // Redirecționează către pagina de succes
      navigate(`/payments/success?payment_id=${paymentId}&reference=${payment?.reference_number}`);
    } catch (error) {
      setError('Eroare la procesarea plății');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentCancel = () => {
    navigate(`/payments/cancel?payment_id=${paymentId}&reference=${payment?.reference_number}`);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Încărcăm detaliile plății...
        </Typography>
      </Container>
    );
  }

  if (error || !payment) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Plata nu a fost găsită'}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/plati-online')}>
          Înapoi la Plăți Online
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header Ghișeul.ro Style */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', 
          color: '#ffffff',
          borderRadius: 2,
          '& *': { color: '#ffffff !important' }
        }}
      >
        <Box display="flex" alignItems="center" mb={2}>
          <SecurityIcon sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Ghișeul.ro
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Sistemul Național Electronic de Plată
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Simulare Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🧪 Modul Simulare Dezvoltare
        </Typography>
        Aceasta este o simulare a platformei Ghișeul.ro pentru dezvoltare și testare.
        În producție, vei fi redirecționat către platforma reală Ghișeul.ro.
      </Alert>

      {/* Payment Details */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            <PaymentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Detalii Plată
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon><InfoIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Numărul de Referință" 
                secondary={payment.reference_number}
                secondaryTypographyProps={{ fontFamily: 'monospace', fontSize: '1.1rem' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><PaymentIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Suma de Plată" 
                secondary={`${payment.total_amount.toFixed(2)} LEI`}
                secondaryTypographyProps={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'primary.main' }}
              />
            </ListItem>
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
          </List>

          <Divider sx={{ my: 2 }} />

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Informații importante:</strong>
              <br />• Plata se va efectua în lei (RON)
              <br />• Comisionul este 0% pentru plățile către instituțiile publice
              <br />• Vei primi confirmarea plății pe email
              <br />• Documentul de plată va fi disponibil pentru download
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            color="success"
            size="large"
            fullWidth
            onClick={handlePaymentSuccess}
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
            sx={{ py: 2 }}
          >
            {processing ? 'Procesăm plata...' : 'Confirmă Plata'}
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            variant="outlined"
            color="error"
            size="large"
            fullWidth
            onClick={handlePaymentCancel}
            disabled={processing}
            startIcon={<CancelIcon />}
            sx={{ py: 2 }}
          >
            Anulează Plata
          </Button>
        </Grid>
      </Grid>

      {/* Security Info */}
      <Paper elevation={1} sx={{ p: 3, mt: 4, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom color="primary">
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Securitate și Protecție
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Platforma Ghișeul.ro utilizează cele mai avansate tehnologii de securitate pentru protejarea datelor dumneavoastră.
          Toate tranzacțiile sunt criptate SSL/TLS și respectă standardele de securitate PCI DSS.
        </Typography>
      </Paper>

      {/* Session Info */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          Sesiune: {sessionId}
          <br />
          Powered by Ghișeul.ro - Sistemul Național Electronic de Plată
        </Typography>
      </Box>
    </Container>
  );
};

export default MockGhiseulPage;