/**
 * Pagina de Login pentru Panoul de Administrare
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  InputAdornment,
  IconButton,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  AdminPanelSettings as AdminIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { authService } from '../../services/authService';

const LoginContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2)
}));

const LoginCard = styled(Card)(({ theme }) => ({
  maxWidth: 450,
  width: '100%',
  boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
  borderRadius: theme.spacing(3),
  overflow: 'hidden'
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(4, 0, 2),
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: 'white',
  '& .admin-icon': {
    fontSize: '4rem',
    marginBottom: theme.spacing(1)
  }
}));

const FormContainer = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(4)
}));

const DemoAccounts = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.spacing(1)
}));

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verifică dacă utilizatorul este deja autentificat
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [navigate, location]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Vă rugăm să completați toate câmpurile');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.login(formData.email, formData.password);
      
      // Redirect la pagina inițială sau dashboard
      const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err?.response?.data?.detail || 
        err?.message || 
        'Eroare la autentificare. Verificați datele introduse.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (email: string, password: string) => {
    setFormData({ email, password });
  };

  return (
    <LoginContainer>
      <Container maxWidth="sm">
        <LoginCard>
          <LogoContainer>
            <AdminIcon className="admin-icon" />
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Admin Panel
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Panoul de Administrare al Primăriei
            </Typography>
          </LogoContainer>

          <FormContainer>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                variant="outlined"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={loading}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                fullWidth
                label="Parolă"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                sx={{ 
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: '1rem'
                }}
              >
                {loading ? 'Se autentifică...' : 'Conectare'}
              </Button>
            </form>

            <DemoAccounts>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
                Conturi Demo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Pentru testare, puteți folosi următoarele conturi:
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box>
                  <Chip 
                    label="Admin Standard"
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                  <Typography variant="body2" component="div">
                    <strong>Email:</strong> admin@primarie.ro<br />
                    <strong>Parolă:</strong> admin123
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1, mt: 0.5 }}
                      onClick={() => handleDemoLogin('admin@primarie.ro', 'admin123')}
                      disabled={loading}
                    >
                      Completează
                    </Button>
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box>
                  <Chip 
                    label="Super Admin"
                    size="small" 
                    color="secondary" 
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                  <Typography variant="body2" component="div">
                    <strong>Email:</strong> superadmin@primarie.ro<br />
                    <strong>Parolă:</strong> super123
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1, mt: 0.5 }}
                      onClick={() => handleDemoLogin('superadmin@primarie.ro', 'super123')}
                      disabled={loading}
                    >
                      Completează
                    </Button>
                  </Typography>
                </Box>
              </Box>
            </DemoAccounts>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Probleme cu autentificarea?{' '}
                <Button 
                  variant="text" 
                  size="small"
                  onClick={() => setError('Pentru suport tehnic contactați IT: it@primarie.ro')}
                >
                  Contact IT
                </Button>
              </Typography>
            </Box>
          </FormContainer>
        </LoginCard>
      </Container>
    </LoginContainer>
  );
};

export default LoginPage;