/**
 * Pagina de Configurare Primărie - Personalizare Template
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  IconButton,
  Alert,
  Snackbar,
  Divider,
  FormControlLabel,
  Switch,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  PhotoCamera,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Palette as PaletteIcon,
  Preview as PreviewIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
// import { HexColorPicker } from 'react-colorful';
import { useMunicipalityConfig } from '../../hooks/useMunicipalityConfig';
import { styled } from '@mui/material/styles';

const ColorPickerContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2)
}));

const ColorPreview = styled(Box)<{ color: string }>(({ color }) => ({
  width: 60,
  height: 40,
  backgroundColor: color,
  borderRadius: 8,
  border: '2px solid #ddd',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '0.75rem'
}));

const LogoUploadArea = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.grey[300]}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'border-color 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main
  }
}));

export const ConfigurationPage: React.FC = () => {
  const { config, loading, updateConfig } = useMunicipalityConfig();
  const [formData, setFormData] = useState({
    name: '',
    official_name: '',
    mayor_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    website_url: '',
    primary_color: '#004990',
    secondary_color: '#0079C1'
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [colorDialogOpen, setColorDialogOpen] = useState<'primary' | 'secondary' | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Populează formularul cu datele existente
  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name || '',
        official_name: config.official_name || '',
        mayor_name: config.mayor_name || '',
        contact_email: config.contact_email || '',
        contact_phone: config.contact_phone || '',
        address: config.address || '',
        website_url: config.website_url || '',
        primary_color: config.primary_color || '#004990',
        secondary_color: config.secondary_color || '#0079C1'
      });
    }
  }, [config]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleColorChange = (type: 'primary' | 'secondary') => (color: string) => {
    setFormData(prev => ({
      ...prev,
      [`${type}_color`]: color
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateConfig(formData);
      setMessage({ type: 'success', text: 'Configurația a fost salvată cu succes!' });
      
      // Refresh pagina pentru a vedea schimbările
      if (previewMode) {
        window.location.reload();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Eroare la salvarea configurației' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulare upload logo
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, logo_url: result }));
        setMessage({ type: 'success', text: 'Logo încărcat cu succes!' });
      };
      reader.readAsDataURL(file);
    }
  };

  const previewColors = () => {
    // Aplică culorile în CSS pentru preview live
    document.documentElement.style.setProperty('--primary-color', formData.primary_color);
    document.documentElement.style.setProperty('--secondary-color', formData.secondary_color);
    setPreviewMode(true);
    setMessage({ type: 'success', text: 'Preview activat! Salvați pentru a aplica permanent.' });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Configurare Primărie
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Personalizați informațiile și aspectul template-ului primăriei dumneavoastră
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Informații Generale */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Informații Generale
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Numele Primăriei"
                    value={formData.name}
                    onChange={handleChange('name')}
                    required
                    helperText="Ex: Primăria Municipiului București"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Denumirea Oficială"
                    value={formData.official_name}
                    onChange={handleChange('official_name')}
                    required
                    helperText="Ex: Municipiul București, Sectorul 1"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Numele Primarului"
                    value={formData.mayor_name}
                    onChange={handleChange('mayor_name')}
                    helperText="Ex: Ion Popescu"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={formData.website_url}
                    onChange={handleChange('website_url')}
                    helperText="Ex: https://primaria-ta.ro"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adresa Completă"
                    value={formData.address}
                    onChange={handleChange('address')}
                    multiline
                    rows={2}
                    helperText="Adresa completă a sediului primăriei"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Informații de Contact
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Principal"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleChange('contact_email')}
                    required
                    helperText="Email-ul principal pentru contact"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Telefon Principal"
                    value={formData.contact_phone}
                    onChange={handleChange('contact_phone')}
                    required
                    helperText="Ex: 0256 123 456"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Personalizare Vizuală */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Personalizare Vizuală
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Culoare Principală
                  </Typography>
                  <ColorPickerContainer>
                    <ColorPreview 
                      color={formData.primary_color}
                      onClick={() => setColorDialogOpen('primary')}
                    >
                      <PaletteIcon fontSize="small" />
                    </ColorPreview>
                    <TextField
                      value={formData.primary_color}
                      onChange={handleChange('primary_color')}
                      size="small"
                      sx={{ width: 120 }}
                    />
                    <Chip label="PANTONE 280C" size="small" />
                  </ColorPickerContainer>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Culoare Secundară
                  </Typography>
                  <ColorPickerContainer>
                    <ColorPreview 
                      color={formData.secondary_color}
                      onClick={() => setColorDialogOpen('secondary')}
                    >
                      <PaletteIcon fontSize="small" />
                    </ColorPreview>
                    <TextField
                      value={formData.secondary_color}
                      onChange={handleChange('secondary_color')}
                      size="small"
                      sx={{ width: 120 }}
                    />
                    <Chip label="PANTONE 300C" size="small" />
                  </ColorPickerContainer>
                </Grid>
              </Grid>
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={previewColors}
                sx={{ mt: 2 }}
              >
                Preview Culori Live
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Logo și Preview */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Logo Primărie
              </Typography>
              
              <Box display="flex" justifyContent="center" mb={3}>
                <Avatar
                  src={config?.logo_url}
                  sx={{ 
                    width: 120, 
                    height: 120,
                    bgcolor: formData.primary_color,
                    fontSize: '2rem'
                  }}
                >
                  {config?.name?.charAt(0) || 'P'}
                </Avatar>
              </Box>

              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="logo-upload"
                type="file"
                onChange={handleLogoUpload}
              />
              <label htmlFor="logo-upload">
                <LogoUploadArea>
                  <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Încărcați logo nou
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    PNG, JPG până la 2MB
                  </Typography>
                </LogoUploadArea>
              </label>
            </CardContent>
          </Card>

          {/* Preview Template */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Preview Template
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Salvați configurația pentru a vedea schimbările pe site
              </Typography>
              
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                textAlign: 'center'
              }}>
                <Box 
                  sx={{ 
                    height: 8, 
                    bgcolor: formData.primary_color, 
                    borderRadius: 1, 
                    mb: 1 
                  }} 
                />
                <Typography variant="h6" sx={{ color: formData.primary_color }}>
                  {formData.name || 'Primăria Exemplu'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formData.contact_phone} • {formData.contact_email}
                </Typography>
                <Box 
                  sx={{ 
                    height: 4, 
                    bgcolor: formData.secondary_color, 
                    borderRadius: 1, 
                    mt: 1 
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Butoane de acțiune */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          size="large"
        >
          {saving ? 'Se salvează...' : 'Salvează Configurația'}
        </Button>
      </Box>

      {/* Color Picker Dialog */}
      <Dialog 
        open={colorDialogOpen !== null} 
        onClose={() => setColorDialogOpen(null)}
        maxWidth="sm"
      >
        <DialogTitle>
          Alegeți culoarea {colorDialogOpen === 'primary' ? 'principală' : 'secundară'}
        </DialogTitle>
        <DialogContent>
          {colorDialogOpen && (
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                label="Cod culoare (hex)"
                value={formData[`${colorDialogOpen}_color`]}
                onChange={(e) => handleColorChange(colorDialogOpen)(e.target.value)}
                placeholder="#004990"
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        backgroundColor: formData[`${colorDialogOpen}_color`],
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        mr: 1
                      }}
                    />
                  )
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Introduceți codul hex al culorii (ex: #004990)
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setColorDialogOpen(null)}>Închide</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pentru mesaje */}
      {message && (
        <Snackbar
          open={message !== null}
          autoHideDuration={6000}
          onClose={() => setMessage(null)}
        >
          <Alert 
            onClose={() => setMessage(null)} 
            severity={message.type}
          >
            {message.text}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};