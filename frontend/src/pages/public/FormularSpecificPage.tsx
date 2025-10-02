/**
 * Pagina pentru completarea unui formular specific
 * Formular dinamic bazat pe schema JSON din backend
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Card,
  CardContent,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormHelperText
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as BackIcon,
  CheckCircle as SuccessIcon,
  Description as DocumentIcon,
  Schedule as TimeIcon,
  Info as InfoIcon,
  AttachFile as AttachIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate, useParams, Link } from 'react-router-dom';

// Import servicii și tipuri
import { formsService, FormType, FormSubmissionCreate } from '../../services/formsService';

// Styled components
const RequiredDocumentsList = styled(List)(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.spacing(1),
  padding: theme.spacing(2)
}));

const steps = ['Informații Formular', 'Date Solicitant', 'Detalii Cerere', 'Confirmare'];

const FormularSpecificPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [formType, setFormType] = useState<FormType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState<any>({
    citizen_name: '',
    citizen_email: '',
    citizen_phone: '',
    citizen_cnp: '',
    citizen_address: '',
    submission_data: {},
    consent_given: false
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (slug) {
      loadFormType();
    }
  }, [slug]);

  const loadFormType = async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      const data = await formsService.getFormTypeBySlug(slug);
      setFormType(data);
    } catch (err: any) {
      setError('Tipul de formular nu a fost găsit');
      console.error('Error loading form type:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('submission_data.')) {
      const submissionField = field.replace('submission_data.', '');
      setFormData((prev: any) => ({
        ...prev,
        submission_data: {
          ...prev.submission_data,
          [submissionField]: value
        }
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateCurrentStep = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (activeStep === 1) {
      // Validare date solicitant
      if (!formData.citizen_name || formData.citizen_name.length < 2) {
        newErrors.citizen_name = 'Numele este obligatoriu (min. 2 caractere)';
      }
      
      if (!formData.citizen_email) {
        newErrors.citizen_email = 'Emailul este obligatoriu';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.citizen_email)) {
        newErrors.citizen_email = 'Emailul nu este valid';
      }
      
      if (formData.citizen_phone && !/^(\+40|0040|0)[7][0-9]{8}$/.test(formData.citizen_phone.replace(/\s|-|\./g, ''))) {
        newErrors.citizen_phone = 'Numărul de telefon nu este valid (format: 07xxxxxxxx)';
      }
      
      if (formData.citizen_cnp && !/^[0-9]{13}$/.test(formData.citizen_cnp)) {
        newErrors.citizen_cnp = 'CNP-ul trebuie să aibă 13 cifre';
      }
    }
    
    if (activeStep === 2 && formType) {
      // Validare date cerere bazate pe schema formularului
      const validationResult = formsService.validateFormData(formData.submission_data, formType.form_schema);
      for (const [field, errorMessage] of Object.entries(validationResult.errors)) {
        newErrors[`submission_data.${field}`] = errorMessage;
      }
    }
    
    if (activeStep === 3) {
      // Validare consimțământ
      if (!formData.consent_given) {
        newErrors.consent_given = 'Consimțământul pentru prelucrarea datelor este obligatoriu';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    if (!formType || !validateCurrentStep()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const submissionData: FormSubmissionCreate = {
        form_type_id: formType.id,
        citizen_name: formData.citizen_name,
        citizen_email: formData.citizen_email,
        citizen_phone: formData.citizen_phone,
        citizen_cnp: formData.citizen_cnp,
        citizen_address: formData.citizen_address,
        submission_data: formData.submission_data,
        consent_given: formData.consent_given
      };

      const submission = await formsService.createFormSubmission(submissionData);
      setSubmissionResult(submission);
      setActiveStep(steps.length);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la trimiterea cererii');
    } finally {
      setLoading(false);
    }
  };

  const renderFormField = (field: any, fieldName: string) => {
    const fieldKey = `submission_data.${fieldName}`;
    const value = formData.submission_data[fieldName] || '';
    const error = errors[fieldKey];

    if (field.type === 'string' && field.options) {
      // Select dropdown
      return (
        <FormControl fullWidth error={!!error} key={fieldName}>
          <InputLabel>{field.title} {field.required && '*'}</InputLabel>
          <Select
            value={value}
            onChange={(e) => handleInputChange(fieldKey, e.target.value)}
            label={`${field.title} ${field.required ? '*' : ''}`}
          >
            {field.options.map((option: string) => (
              <MenuItem key={option} value={option}>
                {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </MenuItem>
            ))}
          </Select>
          {error && <FormHelperText>{error}</FormHelperText>}
        </FormControl>
      );
    }

    if (field.type === 'boolean') {
      // Checkbox
      return (
        <FormControlLabel
          key={fieldName}
          control={
            <Checkbox
              checked={value === true}
              onChange={(e) => handleInputChange(fieldKey, e.target.checked)}
            />
          }
          label={field.title}
        />
      );
    }

    if (field.type === 'number') {
      // Number input
      return (
        <TextField
          key={fieldName}
          fullWidth
          type="number"
          label={`${field.title} ${field.required ? '*' : ''}`}
          value={value}
          onChange={(e) => handleInputChange(fieldKey, parseFloat(e.target.value) || '')}
          error={!!error}
          helperText={error}
        />
      );
    }

    if (field.format === 'date') {
      // Date input
      return (
        <TextField
          key={fieldName}
          fullWidth
          type="date"
          label={`${field.title} ${field.required ? '*' : ''}`}
          value={value}
          onChange={(e) => handleInputChange(fieldKey, e.target.value)}
          error={!!error}
          helperText={error}
          InputLabelProps={{ shrink: true }}
        />
      );
    }

    // Default text input
    return (
      <TextField
        key={fieldName}
        fullWidth
        label={`${field.title} ${field.required ? '*' : ''}`}
        value={value}
        onChange={(e) => handleInputChange(fieldKey, e.target.value)}
        error={!!error}
        helperText={error}
        multiline={fieldName.includes('notes') || fieldName.includes('purpose')}
        rows={fieldName.includes('notes') || fieldName.includes('purpose') ? 3 : 1}
      />
    );
  };

  if (loading && !formType) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Se încarcă formularul...
        </Typography>
      </Container>
    );
  }

  if (!formType) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Tipul de formular nu a fost găsit sau nu este disponibil.
        </Alert>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/servicii-publice/formulare')}
          sx={{ mt: 2 }}
        >
          Înapoi la Formulare
        </Button>
      </Container>
    );
  }

  // Success screen
  if (submissionResult) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
            
            <Typography variant="h4" gutterBottom color="success.main">
              Cerere Trimisă cu Succes!
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Numărul de referință: {submissionResult.reference_number}
            </Typography>
            
            <Alert severity="success" sx={{ mt: 3, mb: 3 }}>
              <Typography variant="body1">
                Cererea dumneavoastră pentru <strong>{formType.name}</strong> a fost înregistrată cu succes. 
                Veți primi o confirmare prin email și veți fi notificat despre evoluția acesteia.
              </Typography>
            </Alert>

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/servicii-publice/cautare-sesizare?ref=${submissionResult.reference_number}`)}
              >
                Urmărește Cererea
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/servicii-publice/formulare')}
              >
                Înapoi la Formulare
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const formFields = formsService.generateFormFields(formType.form_schema);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/servicii-publice/formulare')}
          sx={{ mb: 2 }}
        >
          Înapoi la Formulare Online
        </Button>
        
        <Typography variant="h3" gutterBottom color="primary">
          {formType.name}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {formType.description}
        </Typography>

        {formType.estimated_processing_days && (
          <Chip 
            label={`Timp de procesare: ${formType.estimated_processing_days} zile`}
            color="info"
            icon={<TimeIcon />}
            sx={{ mr: 2 }}
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        {/* Step 0 - Informații Formular */}
        {activeStep === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Informații despre Formular
              </Typography>

              {formType.instructions && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Instrucțiuni:</strong> {formType.instructions}
                  </Typography>
                </Alert>
              )}

              {formType.required_documents && formType.required_documents.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Documente Necesare
                  </Typography>
                  <RequiredDocumentsList>
                    {formType.required_documents.map((document, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemIcon>
                          <DocumentIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText primary={document} />
                      </ListItem>
                    ))}
                  </RequiredDocumentsList>
                </Box>
              )}

              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Important:</strong> Asigurați-vă că aveți toate documentele necesare 
                  înainte de a continua. Informațiile trebuie să fie corecte pentru a evita 
                  întârzierile în procesare.
                </Typography>
              </Alert>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Continuă
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Step 1 - Date Solicitant */}
        {activeStep === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Date Solicitant
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Numele complet *"
                    value={formData.citizen_name}
                    onChange={(e) => handleInputChange('citizen_name', e.target.value)}
                    error={!!errors.citizen_name}
                    helperText={errors.citizen_name}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Adresa de email *"
                    type="email"
                    value={formData.citizen_email}
                    onChange={(e) => handleInputChange('citizen_email', e.target.value)}
                    error={!!errors.citizen_email}
                    helperText={errors.citizen_email || 'Pentru notificări despre statusul cererii'}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Număr de telefon"
                    value={formData.citizen_phone}
                    onChange={(e) => handleInputChange('citizen_phone', e.target.value)}
                    error={!!errors.citizen_phone}
                    helperText={errors.citizen_phone || 'Format: 07xxxxxxxx'}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="CNP"
                    value={formData.citizen_cnp}
                    onChange={(e) => handleInputChange('citizen_cnp', e.target.value)}
                    error={!!errors.citizen_cnp}
                    helperText={errors.citizen_cnp || '13 cifre'}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adresa de domiciliu"
                    value={formData.citizen_address}
                    onChange={(e) => handleInputChange('citizen_address', e.target.value)}
                    error={!!errors.citizen_address}
                    helperText={errors.citizen_address}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack}>
                  Înapoi
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Continuă
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Step 2 - Detalii Cerere */}
        {activeStep === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Detalii Cerere
              </Typography>

              <Grid container spacing={3}>
                {formFields.map((field) => (
                  <Grid item xs={12} sm={field.type === 'boolean' ? 12 : 6} key={field.name}>
                    {renderFormField(field, field.name)}
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack}>
                  Înapoi
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Continuă
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Step 3 - Confirmare */}
        {activeStep === 3 && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Confirmare Cerere
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Vă rugăm să verificați toate informațiile înainte de a trimite cererea.
                </Typography>
              </Alert>

              {/* Summary */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Rezumat Cerere
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Tip cerere:</Typography>
                    <Typography variant="body1">{formType.name}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Solicitant:</Typography>
                    <Typography variant="body1">{formData.citizen_name}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Email:</Typography>
                    <Typography variant="body1">{formData.citizen_email}</Typography>
                  </Grid>
                  
                  {Object.entries(formData.submission_data).map(([key, value]) => {
                    const field = formFields.find(f => f.name === key);
                    if (!value || !field) return null;
                    
                    return (
                      <Grid item xs={12} sm={6} key={key}>
                        <Typography variant="body2" color="text.secondary">{field.title}:</Typography>
                        <Typography variant="body1">
                          {field.type === 'boolean' ? (value ? 'Da' : 'Nu') : String(value)}
                        </Typography>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>

              {/* GDPR Consent */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.consent_given}
                    onChange={(e) => handleInputChange('consent_given', e.target.checked)}
                    required
                  />
                }
                label={
                  <Typography variant="body2">
                    Sunt de acord cu prelucrarea datelor personale conform 
                    <Link to="/gdpr" target="_blank" style={{ marginLeft: 4 }}>
                      politicii de confidențialitate
                    </Link> *
                  </Typography>
                }
              />
              {errors.consent_given && (
                <Typography variant="caption" color="error" display="block">
                  {errors.consent_given}
                </Typography>
              )}

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack}>
                  Înapoi
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  disabled={loading || !formData.consent_given}
                >
                  {loading ? 'Se trimite...' : 'Trimite Cererea'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </form>
    </Container>
  );
};

export default FormularSpecificPage;