import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
  Chip,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface TaxType {
  id: number;
  code: string;
  name: string;
  description: string;
  base_amount: number;
  is_annual: boolean;
  penalty_percentage: number;
  ghiseul_enabled: boolean;
}

interface TaxCalculation {
  tax_type_code: string;
  tax_type_name: string;
  taxable_value: number;
  calculated_amount: number;
  penalty_amount: number;
  total_amount: number;
  due_date: string;
  is_overdue: boolean;
}

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
  created_at: string;
  ghiseul_redirect_url?: string;
}

const PlatiOnlinePage: React.FC = () => {
  const navigate = useNavigate();
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [selectedTaxType, setSelectedTaxType] = useState<TaxType | null>(null);
  const [calculation, setCalculation] = useState<TaxCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // Dialog states
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  
  // Form data
  const [calculatorData, setCalculatorData] = useState({
    taxCode: '',
    taxableValue: '',
    year: new Date().getFullYear()
  });
  
  const [paymentData, setPaymentData] = useState({
    payerName: '',
    payerCnp: '',
    payerEmail: '',
    amount: '',
    propertyIdentifier: '',
    description: ''
  });
  
  // Active step for payment process
  const [activeStep, setActiveStep] = useState(0);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);

  const steps = ['Selectează Taxa', 'Completează Datele', 'Confirmă și Plătește'];

  useEffect(() => {
    loadTaxTypes();
  }, []);

  const loadTaxTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8001/api/v1/payments/tax-types');
      setTaxTypes(response.data);
    } catch (error) {
      setError('Eroare la încărcarea tipurilor de taxe');
    } finally {
      setLoading(false);
    }
  };

  const calculateTax = async () => {
    if (!calculatorData.taxCode || !calculatorData.taxableValue) {
      setError('Completează toate câmpurile obligatorii');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:8001/api/v1/payments/calculate', null, {
        params: {
          tax_code: calculatorData.taxCode,
          taxable_value: parseFloat(calculatorData.taxableValue),
          year: calculatorData.year
        }
      });
      setCalculation(response.data);
      setError('');
    } catch (error) {
      setError('Eroare la calculul taxei');
    } finally {
      setLoading(false);
    }
  };

  const startPayment = (taxType: TaxType) => {
    setSelectedTaxType(taxType);
    setPaymentData({
      ...paymentData,
      amount: taxType.base_amount.toString(),
      description: `Plată ${taxType.name}`
    });
    setActiveStep(1);
    setPaymentFormOpen(true);
  };

  const createPayment = async () => {
    if (!selectedTaxType || !paymentData.payerName) {
      setError('Completează toate câmpurile obligatorii');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:8001/api/v1/payments/create', {
        tax_type_code: selectedTaxType.code,
        payer_name: paymentData.payerName,
        payer_cnp: paymentData.payerCnp,
        payer_email: paymentData.payerEmail,
        amount: parseFloat(paymentData.amount),
        property_identifier: paymentData.propertyIdentifier,
        description: paymentData.description
      });
      
      setCurrentPayment(response.data);
      setActiveStep(2);
      setError('');
    } catch (error) {
      setError('Eroare la crearea plății');
    } finally {
      setLoading(false);
    }
  };

  const initiateGhiseulPayment = async () => {
    if (!currentPayment) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `http://localhost:8001/api/v1/payments/${currentPayment.payment_id}/initiate-ghiseul`
      );
      
      if (response.data.success && response.data.redirect_url) {
        // Salvează payment_id în localStorage pentru verificarea ulterioară
        localStorage.setItem('current_payment_id', currentPayment.payment_id);
        localStorage.setItem('current_reference_number', currentPayment.reference_number);
        
        // Redirect către Ghișeul.ro (sau simulare)
        window.location.href = response.data.redirect_url;
      } else {
        setError('Eroare la inițierea plății prin Ghișeul.ro');
      }
    } catch (error) {
      setError('Eroare la inițierea plății prin Ghișeul.ro');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPaymentFormOpen(false);
    setCalculatorOpen(false);
    setActiveStep(0);
    setSelectedTaxType(null);
    setCurrentPayment(null);
    setCalculation(null);
    setPaymentData({
      payerName: '',
      payerCnp: '',
      payerEmail: '',
      amount: '',
      propertyIdentifier: '',
      description: ''
    });
    setCalculatorData({
      taxCode: '',
      taxableValue: '',
      year: new Date().getFullYear()
    });
    setError('');
    setSuccess('');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #004990 0%, #0079C1 100%)', color: 'white' }}>
        <Box display="flex" alignItems="center" mb={2}>
          <PaymentIcon sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h3" component="h1" fontWeight="bold">
            Plăți Online
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Plătește taxele și impozitele locale online prin Ghișeul.ro
        </Typography>
      </Paper>

      {/* Alerts */}
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

      {/* Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <CalculateIcon sx={{ fontSize: 48, color: '#004990', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Calculator Taxe
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Calculează suma de plată pentru taxele și impozitele locale
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setCalculatorOpen(true)}
                fullWidth
              >
                Calculează Taxa
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <BankIcon sx={{ fontSize: 48, color: '#0079C1', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Verifică Plăți
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Verifică statusul plăților efectuate anterior
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/verificare-plati')}
                fullWidth
              >
                Verifică Status
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tax Types Grid */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3, color: '#004990' }}>
        Tipuri de Taxe și Impozite
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {taxTypes.map((taxType) => (
            <Grid item xs={12} md={6} lg={4} key={taxType.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h3">
                      {taxType.name}
                    </Typography>
                    {taxType.ghiseul_enabled && (
                      <Chip label="Ghișeul.ro" color="primary" size="small" />
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {taxType.description}
                  </Typography>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" color="primary">
                      {taxType.base_amount} lei
                    </Typography>
                    {taxType.is_annual && (
                      <Chip label="Anual" color="secondary" size="small" />
                    )}
                  </Box>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => startPayment(taxType)}
                    disabled={!taxType.ghiseul_enabled}
                  >
                    Plătește Online
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Calculator Dialog */}
      <Dialog open={calculatorOpen} onClose={() => setCalculatorOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Calculator Taxe</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipul de Taxă</InputLabel>
                <Select
                  value={calculatorData.taxCode}
                  onChange={(e) => setCalculatorData({ ...calculatorData, taxCode: e.target.value })}
                >
                  {taxTypes.map((taxType) => (
                    <MenuItem key={taxType.code} value={taxType.code}>
                      {taxType.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valoarea Impozabilă"
                type="number"
                value={calculatorData.taxableValue}
                onChange={(e) => setCalculatorData({ ...calculatorData, taxableValue: e.target.value })}
                helperText="Pentru clădiri: valoarea (lei), pentru teren: suprafața (mp), pentru auto: cilindreea (cm³)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Anul"
                type="number"
                value={calculatorData.year}
                onChange={(e) => setCalculatorData({ ...calculatorData, year: parseInt(e.target.value) })}
              />
            </Grid>
            
            {calculation && (
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Rezultatul Calculului
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Tip Taxă" secondary={calculation.tax_type_name} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Suma de Bază" secondary={`${calculation.calculated_amount.toFixed(2)} lei`} />
                    </ListItem>
                    {calculation.penalty_amount > 0 && (
                      <ListItem>
                        <ListItemText 
                          primary="Penalizări" 
                          secondary={`${calculation.penalty_amount.toFixed(2)} lei`}
                          sx={{ color: 'error.main' }}
                        />
                      </ListItem>
                    )}
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="TOTAL DE PLATĂ" 
                        secondary={`${calculation.total_amount.toFixed(2)} lei`}
                        primaryTypographyProps={{ fontWeight: 'bold', color: 'primary' }}
                        secondaryTypographyProps={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'primary' }}
                      />
                    </ListItem>
                  </List>
                  {calculation.is_overdue && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      Taxa este restantă. S-au aplicat penalizări pentru întârziere.
                    </Alert>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalculatorOpen(false)}>Închide</Button>
          <Button onClick={calculateTax} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Calculează'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Form Dialog */}
      <Dialog open={paymentFormOpen} onClose={resetForm} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            Plată Online - {selectedTaxType?.name}
            <SecurityIcon color="primary" />
          </Box>
          <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </DialogTitle>
        <DialogContent>
          {activeStep === 1 && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Completează datele pentru plata {selectedTaxType?.name}
                </Alert>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Nume Complet"
                  value={paymentData.payerName}
                  onChange={(e) => setPaymentData({ ...paymentData, payerName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CNP"
                  value={paymentData.payerCnp}
                  onChange={(e) => setPaymentData({ ...paymentData, payerCnp: e.target.value })}
                  inputProps={{ maxLength: 13 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={paymentData.payerEmail}
                  onChange={(e) => setPaymentData({ ...paymentData, payerEmail: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Suma de Plată (lei)"
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Identificator Proprietate"
                  value={paymentData.propertyIdentifier}
                  onChange={(e) => setPaymentData({ ...paymentData, propertyIdentifier: e.target.value })}
                  helperText="Nr. cadastral, adresa proprietății, nr. înmatriculare auto, etc."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observații"
                  value={paymentData.description}
                  onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          )}

          {activeStep === 2 && currentPayment && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="success">
                  <Typography variant="h6">Plată Pregătită cu Succes!</Typography>
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Detalii Plată
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon><ReceiptIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Numărul de Referință" 
                        secondary={currentPayment.reference_number} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PaymentIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Suma Totală" 
                        secondary={`${currentPayment.total_amount} lei`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Status" 
                        secondary="Pregătit pentru plată" 
                      />
                    </ListItem>
                  </List>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Vei fi redirecționat către platforma Ghișeul.ro pentru finalizarea plății în siguranță.
                  </Alert>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm}>Anulează</Button>
          {activeStep === 1 && (
            <Button onClick={createPayment} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Continuă'}
            </Button>
          )}
          {activeStep === 2 && (
            <Button onClick={initiateGhiseulPayment} variant="contained" color="success" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Plătește prin Ghișeul.ro'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PlatiOnlinePage;