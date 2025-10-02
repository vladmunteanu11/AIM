/**
 * Pagină Super Admin pentru echipa tehnică IT
 * Conține configurări și setări tehnice avansate
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Alert,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Storage as DatabaseIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  CloudUpload as BackupIcon,
  Code as CodeIcon,
  BugReport as BugIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Computer as SystemIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`super-admin-tabpanel-${index}`}
      aria-labelledby={`super-admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SuperAdminPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState({
    api: 'healthy',
    database: 'healthy',
    storage: 'warning',
    email: 'error'
  });

  const [configs, setConfigs] = useState({
    maintenanceMode: false,
    debugMode: false,
    emailNotifications: true,
    backupEnabled: true,
    maxFileSize: '10',
    sessionTimeout: '30',
    logLevel: 'info'
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfigs(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfigs = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    alert('Configurația a fost salvată!');
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <SuccessIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <WarningIcon />;
    }
  };

  const getHealthColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Super Admin - Configurări Tehnice
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Panou de control pentru echipa IT - configurări avansate și monitorizare sistem
        </Typography>
      </Box>

      {/* System Health Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    API Server
                  </Typography>
                  <Chip 
                    label={systemHealth.api.toUpperCase()} 
                    color={getHealthColor(systemHealth.api)}
                    size="small"
                  />
                </Box>
                {getHealthIcon(systemHealth.api)}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Baza de Date
                  </Typography>
                  <Chip 
                    label={systemHealth.database.toUpperCase()} 
                    color={getHealthColor(systemHealth.database)}
                    size="small"
                  />
                </Box>
                {getHealthIcon(systemHealth.database)}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Stocare Fișiere
                  </Typography>
                  <Chip 
                    label={systemHealth.storage.toUpperCase()} 
                    color={getHealthColor(systemHealth.storage)}
                    size="small"
                  />
                </Box>
                {getHealthIcon(systemHealth.storage)}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Email Service
                  </Typography>
                  <Chip 
                    label={systemHealth.email.toUpperCase()} 
                    color={getHealthColor(systemHealth.email)}
                    size="small"
                  />
                </Box>
                {getHealthIcon(systemHealth.email)}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<SettingsIcon />} label="Configurări Sistem" />
          <Tab icon={<DatabaseIcon />} label="Baza de Date" />
          <Tab icon={<SecurityIcon />} label="Securitate" />
          <Tab icon={<AnalyticsIcon />} label="Logs & Analytics" />
          <Tab icon={<BackupIcon />} label="Backup & Restore" />
          <Tab icon={<CodeIcon />} label="API & Webhooks" />
        </Tabs>

        {/* Tab 1: Configurări Sistem */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Configurări Generale Sistem
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Modul de Funcționare
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configs.maintenanceMode}
                        onChange={(e) => handleConfigChange('maintenanceMode', e.target.checked)}
                      />
                    }
                    label="Mod Mentenanță"
                  />
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
                    Activează pentru a restricționa accesul utilizatorilor
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configs.debugMode}
                        onChange={(e) => handleConfigChange('debugMode', e.target.checked)}
                      />
                    }
                    label="Mod Debug"
                  />
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
                    Activează pentru informații detaliate în log-uri
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configs.emailNotifications}
                        onChange={(e) => handleConfigChange('emailNotifications', e.target.checked)}
                      />
                    }
                    label="Notificări Email"
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configurări Avansate
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <TextField
                    fullWidth
                    label="Dimensiune Maximă Fișier (MB)"
                    value={configs.maxFileSize}
                    onChange={(e) => handleConfigChange('maxFileSize', e.target.value)}
                    type="number"
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Timeout Sesiune (minute)"
                    value={configs.sessionTimeout}
                    onChange={(e) => handleConfigChange('sessionTimeout', e.target.value)}
                    type="number"
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    select
                    fullWidth
                    label="Nivel Log"
                    value={configs.logLevel}
                    onChange={(e) => handleConfigChange('logLevel', e.target.value)}
                    SelectProps={{ native: true }}
                  >
                    <option value="error">Error</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </TextField>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSaveConfigs}
              disabled={loading}
              startIcon={loading ? <LinearProgress /> : <SuccessIcon />}
            >
              Salvează Configurația
            </Button>
            <Button variant="outlined" startIcon={<RefreshIcon />}>
              Resetează la Default
            </Button>
          </Box>
        </TabPanel>

        {/* Tab 2: Baza de Date */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Administrare Bază de Date
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Statistici Bază de Date
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Tabele Active:</Typography>
                    <Typography fontWeight="bold">12</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Înregistrări Totale:</Typography>
                    <Typography fontWeight="bold">1,247</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Dimensiune DB:</Typography>
                    <Typography fontWeight="bold">45.2 MB</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Ultimul Backup:</Typography>
                    <Typography fontWeight="bold">Azi, 03:00</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Operațiuni Bază de Date
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<BackupIcon />}
                    sx={{ mb: 2 }}
                  >
                    Creează Backup Manual
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    sx={{ mb: 2 }}
                  >
                    Optimizează Tabele
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AnalyticsIcon />}
                    sx={{ mb: 2 }}
                  >
                    Analizează Performanță
                  </Button>
                  
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Operațiunile de mentenanță pot afecta temporar performanța
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Securitate */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Configurări Securitate
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Încercări de Autentificare
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>IP Address</TableCell>
                          <TableCell>Încercări</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>192.168.1.100</TableCell>
                          <TableCell>3</TableCell>
                          <TableCell>
                            <Chip label="Blocată" color="error" size="small" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>10.0.0.15</TableCell>
                          <TableCell>1</TableCell>
                          <TableCell>
                            <Chip label="OK" color="success" size="small" />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Politici Securitate
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Forțează HTTPS"
                  />
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
                    Redirecționează automat la HTTPS
                  </Typography>
                  
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Rate Limiting"
                  />
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
                    Limitează numărul de cereri per IP
                  </Typography>
                  
                  <FormControlLabel
                    control={<Switch />}
                    label="2FA Obligatoriu"
                  />
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
                    Autentificare cu doi factori pentru admin
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 4: Logs & Analytics */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Log-uri Sistem și Analytics
          </Typography>
          
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Log-uri Recente</Typography>
                <Button startIcon={<DownloadIcon />} size="small">
                  Export Logs
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', margin: 0 }}>
{`[2025-08-16 23:49:15] INFO: Document generat pentru cererea AD-20250816-2944
[2025-08-16 23:49:11] INFO: Cerere aprobată: de9116a4-0ca5-48a8-81f1-2b0b714e1548
[2025-08-16 23:48:36] INFO: Cerere nouă creată: AD-20250816-4535
[2025-08-16 23:37:30] INFO: Document generat pentru cererea CF-20250816-9631
[2025-08-16 23:34:34] INFO: Sistem pornit cu succes`}
                </Typography>
              </Paper>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button variant="outlined" size="small">
                  Filtrează Log-uri
                </Button>
                <Button variant="outlined" size="small">
                  Șterge Log-uri Vechi
                </Button>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Tab 5: Backup & Restore */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Backup și Restore
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Backup-uri Automate
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configs.backupEnabled}
                        onChange={(e) => handleConfigChange('backupEnabled', e.target.checked)}
                      />
                    }
                    label="Backup Automat"
                  />
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
                    Backup zilnic la ora 03:00
                  </Typography>
                  
                  <TextField
                    select
                    fullWidth
                    label="Frecvența Backup"
                    defaultValue="daily"
                    SelectProps={{ native: true }}
                    sx={{ mb: 2 }}
                  >
                    <option value="hourly">La fiecare oră</option>
                    <option value="daily">Zilnic</option>
                    <option value="weekly">Săptămânal</option>
                  </TextField>
                  
                  <TextField
                    fullWidth
                    label="Păstrează backup-uri (zile)"
                    defaultValue="30"
                    type="number"
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Operațiuni Backup
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<BackupIcon />}
                    sx={{ mb: 2 }}
                  >
                    Creează Backup Complet
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    sx={{ mb: 2 }}
                  >
                    Încarcă Backup
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    sx={{ mb: 2 }}
                  >
                    Descarcă Ultimul Backup
                  </Button>
                  
                  <Alert severity="info">
                    Ultimul backup: Azi la 03:00 (45.2 MB)
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 6: API & Webhooks */}
        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" gutterBottom>
            API Management și Webhooks
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    API Statistics
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Total API Calls (24h):</Typography>
                    <Typography fontWeight="bold">1,543</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Errori (24h):</Typography>
                    <Typography fontWeight="bold" color="error.main">12</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Response Time Mediu:</Typography>
                    <Typography fontWeight="bold">127ms</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Rate Limit Hits:</Typography>
                    <Typography fontWeight="bold" color="warning.main">3</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Webhooks
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AddIcon />}
                    sx={{ mb: 2 }}
                  >
                    Adaugă Webhook
                  </Button>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Webhook-uri configurate: 0
                  </Typography>
                  
                  <Alert severity="info">
                    Webhook-urile permit integrări cu sisteme externe
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default SuperAdminPage;