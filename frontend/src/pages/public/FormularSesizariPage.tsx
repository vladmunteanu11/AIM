/**
 * Formular pentru crearea de sesizări noi
 * Implementare conform standardelor DigiLocal și modelului Florești Cluj
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
  IconButton
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as BackIcon,
  CheckCircle as SuccessIcon,
  PhotoCamera as PhotoIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
// import { useFormik } from 'formik';
// import * as Yup from 'yup';

// Import servicii și tipuri
import { complaintsService } from '../../services/complaintsService';
import { ComplaintForm, ComplaintCategory } from '../../types/api';

// Styled components
const PhotoPreview = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'inline-block',
  margin: theme.spacing(1),
  '& img': {
    width: 100,
    height: 100,
    objectFit: 'cover',
    borderRadius: theme.spacing(1),
    border: `2px solid ${theme.palette.grey[300]}`
  }
}));

const DeleteButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: -8,
  right: -8,
  backgroundColor: theme.palette.error.main,
  color: 'white',
  width: 24,
  height: 24,
  '&:hover': {
    backgroundColor: theme.palette.error.dark
  }
}));

// Validare manuală
const validateForm = (values: ComplaintForm) => {
  const errors: { [key: string]: string } = {};
  
  if (!values.category_id) {
    errors.category_id = 'Categoria este obligatorie';
  }
  
  if (!values.title || values.title.length < 10) {
    errors.title = 'Titlul trebuie să aibă minimum 10 caractere';
  } else if (values.title.length > 500) {
    errors.title = 'Titlul nu poate depăși 500 de caractere';
  }
  
  if (!values.description || values.description.length < 20) {
    errors.description = 'Descrierea trebuie să aibă minimum 20 de caractere';
  } else if (values.description.length > 5000) {
    errors.description = 'Descrierea nu poate depăși 5000 de caractere';
  }
  
  if (!values.is_anonymous) {
    if (!values.citizen_name || values.citizen_name.length < 2) {
      errors.citizen_name = 'Numele este obligatoriu pentru sesizările ne-anonime';
    }
    
    if (!values.citizen_email) {
      errors.citizen_email = 'Emailul este obligatoriu pentru sesizările ne-anonime';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.citizen_email)) {
      errors.citizen_email = 'Emailul nu este valid';
    }
  }
  
  if (values.citizen_phone && !/^(\+40|0040|0)[7][0-9]{8}$/.test(values.citizen_phone.replace(/\s|-|\./g, ''))) {
    errors.citizen_phone = 'Numărul de telefon nu este valid (format: 07xxxxxxxx)';
  }
  
  if (values.location_details && values.location_details.length > 1000) {
    errors.location_details = 'Detaliile locației nu pot depăși 1000 de caractere';
  }
  
  if (!values.consent_given) {
    errors.consent_given = 'Consimțământul pentru prelucrarea datelor este obligatoriu';
  }
  
  return errors;
};

const steps = ['Selectare Categorie', 'Detalii Sesizare', 'Date Contact', 'Confirmare'];

const FormularSesizariPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedCategoryId = searchParams.get('category');

  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<ComplaintForm>({
    category_id: selectedCategoryId ? parseInt(selectedCategoryId) : 0,
    title: '',
    description: '',
    citizen_name: '',
    citizen_email: '',
    citizen_phone: '',
    citizen_address: '',
    is_anonymous: false,
    location_address: '',
    location_details: '',
    urgency_level: 'normal',
    consent_given: false
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId && categories.length > 0) {
      const category = categories.find(c => c.id === parseInt(selectedCategoryId));
      if (category) {
        setSelectedCategory(category);
        setFormData(prev => ({ ...prev, category_id: category.id }));
        setActiveStep(1); // Skip category selection
      }
    }
  }, [selectedCategoryId, categories]);

  useEffect(() => {
    if (formData.category_id && categories.length > 0) {
      const category = categories.find(c => c.id === formData.category_id);
      setSelectedCategory(category || null);
    }
  }, [formData.category_id, categories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      console.log('Loading categories...');
      const data = await complaintsService.getCategories();
      console.log('Categories loaded:', data);
      setCategories(data);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      setError('Eroare la încărcarea categoriilor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ComplaintForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateCurrentStep = () => {
    const currentErrors = validateForm(formData);
    console.log('Validation errors:', currentErrors);
    setErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called', { formData, activeStep });
    
    if (!validateCurrentStep()) {
      console.log('Validation failed:', errors);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Creating complaint with data:', formData);

      const complaint = await complaintsService.createComplaint(formData);
      
      // Upload photos if any
      if (photos.length > 0) {
        try {
          // Mock upload for now since API method needs fixing
          console.log('Photos to upload:', photos.length);
        } catch (photoError) {
          console.warn('Error uploading photos:', photoError);
        }
      }

      setSubmissionResult(complaint);
      setActiveStep(steps.length);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Eroare la trimiterea sesizării');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB
    );
    
    setPhotos(prev => [...prev, ...validFiles]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const formatUrgencyLevel = (level: string): string => {
    const levels: Record<string, string> = {
      'low': 'Scăzută',
      'normal': 'Normală',
      'high': 'Ridicată',
      'critical': 'Critică'
    };
    return levels[level] || level;
  };

  const getUrgencyColor = (level: string) => {
    const colors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      'low': 'success',
      'normal': 'default',
      'high': 'warning',
      'critical': 'error'
    };
    return colors[level] || 'default';
  };

  if (loading && categories.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Se încarcă formularul...
        </Typography>
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
              Sesizare Trimisă cu Succes!
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Numărul de referință: {submissionResult.reference_number}
            </Typography>
            
            <Alert severity="success" sx={{ mt: 3, mb: 3 }}>
              <Typography variant="body1">
                Sesizarea dumneavoastră a fost înregistrată cu succes. Veți primi o confirmare 
                prin email (dacă ați furnizat adresa) și veți fi notificat despre evoluția acesteia.
              </Typography>
            </Alert>

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/servicii-publice/cautare-sesizare?ref=${submissionResult.reference_number}`)}
              >
                Urmărește Sesizarea
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/servicii-publice')}
              >
                Înapoi la Servicii
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

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
          Formular Sesizare Nouă
        </Typography>
        
        <Typography variant="body1" color="text.secondary">
          Completați formularul pentru a raporta o problemă din comunitate. 
          Toate câmpurile marcate cu * sunt obligatorii.
        </Typography>
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
        {/* Step 0 - Category Selection */}
        {activeStep === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Selectați Categoria Sesizării
              </Typography>
              
              <FormControl fullWidth error={!!errors.category_id}>
                <InputLabel>Categorie *</InputLabel>
                <Select
                  name="category_id"
                  value={formData.category_id}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                  label="Categorie *"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category_id && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    {errors.category_id}
                  </Typography>
                )}
              </FormControl>

              {selectedCategory && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>{selectedCategory.name}</strong><br />
                    {selectedCategory.description}<br />
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        size="small" 
                        label={`Timp răspuns: ${selectedCategory.response_time_hours}h`}
                        color="info" 
                        sx={{ mr: 1 }}
                      />
                      <Chip 
                        size="small" 
                        label={`Timp rezolvare: ${selectedCategory.resolution_time_days} zile`}
                        color="success"
                      />
                    </Box>
                  </Typography>
                </Alert>
              )}

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!formData.category_id}
                >
                  Continuă
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Step 1 - Complaint Details */}
        {activeStep === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Detaliile Sesizării
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="title"
                    label="Titlul sesizării *"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    error={!!errors.title}
                    helperText={errors.title || 'Descrieți pe scurt problema (min. 10 caractere)'}
                    multiline
                    maxRows={2}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="description"
                    label="Descrierea detaliată *"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    error={!!errors.description}
                    helperText={errors.description || 'Descrieți problema în detaliu (min. 20 caractere)'}
                    multiline
                    rows={4}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="location_address"
                    label="Adresa/Locația problemei"
                    value={formData.location_address}
                    onChange={(e) => handleInputChange('location_address', e.target.value)}
                    error={!!errors.location_address}
                    helperText={errors.location_address || 'Ex: Str. Principală nr. 10'}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Urgența</InputLabel>
                    <Select
                      name="urgency_level"
                      value={formData.urgency_level}
                      onChange={(e) => handleInputChange('urgency_level', e.target.value)}
                      label="Urgența"
                    >
                      <MenuItem value="low">Scăzută</MenuItem>
                      <MenuItem value="normal">Normală</MenuItem>
                      <MenuItem value="high">Ridicată</MenuItem>
                      <MenuItem value="critical">Critică</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="location_details"
                    label="Detalii suplimentare despre locație"
                    value={formData.location_details}
                    onChange={(e) => handleInputChange('location_details', e.target.value)}
                    error={!!errors.location_details}
                    helperText={errors.location_details || 'Ex: Lângă stația de autobuz, în fața magazinului'}
                    multiline
                    rows={2}
                  />
                </Grid>

                {/* Photo Upload */}
                {selectedCategory?.requires_photos && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Fotografii (opțional)
                    </Typography>
                    
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="photo-upload"
                      multiple
                      type="file"
                      onChange={handlePhotoUpload}
                    />
                    <label htmlFor="photo-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<PhotoIcon />}
                      >
                        Adaugă Fotografii
                      </Button>
                    </label>

                    {photos.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        {photos.map((photo, index) => (
                          <PhotoPreview key={index}>
                            <img 
                              src={URL.createObjectURL(photo)} 
                              alt={`Preview ${index + 1}`}
                            />
                            <DeleteButton
                              size="small"
                              onClick={() => removePhoto(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </DeleteButton>
                          </PhotoPreview>
                        ))}
                      </Box>
                    )}
                  </Grid>
                )}
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack}>
                  Înapoi
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!formData.title || !formData.description}
                >
                  Continuă
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Step 2 - Contact Details */}
        {activeStep === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Date de Contact
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox
                    name="is_anonymous"
                    checked={formData.is_anonymous}
                    onChange={(e) => handleInputChange('is_anonymous', e.target.checked)}
                  />
                }
                label="Sesizare anonimă"
                sx={{ mb: 3 }}
              />

              {!formData.is_anonymous && (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="citizen_name"
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
                      name="citizen_email"
                      label="Adresa de email *"
                      type="email"
                      value={formData.citizen_email}
                      onChange={(e) => handleInputChange('citizen_email', e.target.value)}
                      error={!!errors.citizen_email}
                      helperText={errors.citizen_email || 'Pentru notificări despre evoluția sesizării'}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="citizen_phone"
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
                      name="citizen_address"
                      label="Adresa de domiciliu"
                      value={formData.citizen_address}
                      onChange={(e) => handleInputChange('citizen_address', e.target.value)}
                      error={!!errors.citizen_address}
                      helperText={errors.citizen_address}
                    />
                  </Grid>
                </Grid>
              )}

              {formData.is_anonymous && (
                <Alert severity="info">
                  <Typography variant="body2">
                    Ați selectat o sesizare anonimă. Nu veți putea urmări statusul sesizării 
                    sau primi notificări despre evoluția acesteia.
                  </Typography>
                </Alert>
              )}

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

        {/* Step 3 - Confirmation */}
        {activeStep === 3 && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Confirmarea Sesizării
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Vă rugăm să verificați toate informațiile înainte de a trimite sesizarea.
                </Typography>
              </Alert>

              {/* Summary */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Rezumat Sesizare
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Categorie:</Typography>
                    <Typography variant="body1">{selectedCategory?.name}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Urgență:</Typography>
                    <Chip 
                      label={formatUrgencyLevel(formData.urgency_level)}
                      color={getUrgencyColor(formData.urgency_level)}
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Titlu:</Typography>
                    <Typography variant="body1">{formData.title}</Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Descriere:</Typography>
                    <Typography variant="body1">{formData.description}</Typography>
                  </Grid>
                  
                  {formData.location_address && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Locația:</Typography>
                      <Typography variant="body1">{formData.location_address}</Typography>
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Tip sesizare:</Typography>
                    <Typography variant="body1">
                      {formData.is_anonymous ? 'Anonimă' : `${formData.citizen_name} (${formData.citizen_email})`}
                    </Typography>
                  </Grid>
                  
                  {photos.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Fotografii atașate:</Typography>
                      <Typography variant="body1">{photos.length} fișier(e)</Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* GDPR Consent */}
              <FormControlLabel
                control={
                  <Checkbox
                    name="consent_given"
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

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button onClick={handleBack}>
                    Înapoi
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    disabled={loading || !formData.consent_given}
                  >
                    {loading ? 'Se trimite...' : 'Trimite Sesizarea'}
                  </Button>
                </Box>
                
                {/* DEBUG: Test button */}
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  onClick={() => {
                    console.log('DEBUG - formData:', formData);
                    console.log('DEBUG - errors:', errors);
                    console.log('DEBUG - consent_given:', formData.consent_given);
                    console.log('DEBUG - loading:', loading);
                    console.log('DEBUG - button disabled:', loading || !formData.consent_given);
                  }}
                >
                  🐛 Debug Info (vezi Console)
                </Button>
                
                {!formData.consent_given && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    Trebuie să acceptați politica de confidențialitate pentru a trimite sesizarea.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </form>
    </Container>
  );
};

export default FormularSesizariPage;