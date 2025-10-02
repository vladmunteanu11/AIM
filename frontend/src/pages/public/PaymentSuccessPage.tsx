import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Grid,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Payment as PaymentIcon
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
  payment_date: string;
  created_at: string;
}

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  const paymentId = searchParams.get('payment_id');
  const referenceNumber = searchParams.get('reference');

  useEffect(() => {
    if (paymentId) {
      loadPayment();
    }
  }, [paymentId]);

  const loadPayment = async () => {
    try {
      const response = await axios.get(`http://localhost:8001/api/v1/payments/${paymentId}`);
      setPayment(response.data);
    } catch (error) {
      console.error('Eroare la încărcarea plății:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = async () => {
    // În implementarea reală, aici s-ar descărca chitanța PDF
    alert('Funcția de descărcare chitanță va fi implementată în versiunea de producție');
  };

  const handleSendEmail = async () => {
    // În implementarea reală, aici s-ar trimite chitanța pe email
    alert('Confirmarea pe email va fi trimisă automat în versiunea de producție');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6">Încărcăm detaliile plății...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Success Header */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)', 
          color: 'white',
          textAlign: 'center',
          borderRadius: 2
        }}
      >
        <CheckIcon sx={{ fontSize: 80, mb: 2 }} />
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Plată Finalizată cu Succes!
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Tranzacția a fost procesată cu succes prin Ghișeul.ro
        </Typography>
      </Paper>

      {/* Success Alert */}
      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🎉 Felicitări! Plata a fost efectuată cu succes.
        </Typography>
        Vei primi în scurt timp o confirmare pe email cu detaliile tranzacției.
        Păstrează numărul de referință pentru evidențele tale.
      </Alert>

      {/* Payment Details */}
      {payment && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Detalii Plată
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon><ReceiptIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Numărul de Referință" 
                  secondary={
                    <Chip 
                      label={payment.reference_number} 
                      color="primary" 
                      variant="outlined"
                      sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                    />
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><PaymentIcon color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Suma Plătită" 
                  secondary={
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                      {payment.total_amount.toFixed(2)} LEI
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Status Plată" 
                  secondary={
                    <Chip 
                      label="FINALIZATĂ" 
                      color="success" 
                      size="small"
                    />
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><EmailIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Plătitor" 
                  secondary={payment.payer_name} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><ReceiptIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Tipul Taxei" 
                  secondary={payment.tax_type_code} 
                />
              </ListItem>
              {payment.payment_date && (
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Data Plății" 
                    secondary={new Date(payment.payment_date).toLocaleString('ro-RO')} 
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ py: 1.5 }}
          >
            Printează
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            startIcon={<DownloadIcon />}
            onClick={handleDownloadReceipt}
            sx={{ py: 1.5 }}
          >
            Descarcă PDF
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            startIcon={<EmailIcon />}
            onClick={handleSendEmail}
            sx={{ py: 1.5 }}
          >
            Trimite Email
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            color="inherit"
            fullWidth
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{ py: 1.5 }}
          >
            Acasă
          </Button>
        </Grid>
      </Grid>

      {/* Important Information */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            ℹ️ Informații Importante
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="• Păstrează numărul de referință pentru evidențele tale" 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="• Confirmarea pe email va sosi în maxim 30 de minute" 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="• Poți verifica statusul plății oricând pe site-ul primăriei" 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="• Pentru întrebări, contactează serviciul clienți al primăriei" 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="• Plata este irevocabilă conform reglementărilor în vigoare" 
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            🚀 Pașii Următori
          </Typography>
          <Typography variant="body1" paragraph>
            Plata ta a fost înregistrată în sistemul primăriei și va fi procesată conform procedurilor în vigoare.
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/plati-online')}
              sx={{ mr: 2 }}
            >
              Efectuează Altă Plată
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/verificare-plati')}
            >
              Verifică Alte Plăți
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Footer */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          Plată procesată prin Ghișeul.ro - Sistemul Național Electronic de Plată
          <br />
          Template Primărie Digitală #DigiLocal
        </Typography>
      </Box>
    </Container>
  );
};

export default PaymentSuccessPage;