/**
 * Pagina de Management Programări pentru Administrarea Primăriei
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Alert,
  InputAdornment,
  Tooltip,
  CircularProgress,
  LinearProgress,
  Snackbar,
  Avatar,
  Stack,
  Divider
} from '@mui/material';
import {
  Visibility,
  Edit,
  CheckCircle,
  Cancel,
  Search,
  Download,
  Event,
  Person,
  Phone,
  Email,
  Business,
  AccessTime,
  CalendarToday,
  Schedule,
  Group,
  TrendingUp
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { appointmentsService } from '../../services/appointmentsService';
import type { Appointment } from '../../services/appointmentsService';

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  '& .MuiTableCell-head': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 600
  }
}));

const StatusChip = styled(Chip)<{ status: string }>(({ theme, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending': return { bg: theme.palette.warning.light, color: theme.palette.warning.contrastText };
      case 'confirmed': return { bg: theme.palette.info.light, color: theme.palette.info.contrastText };
      case 'completed': return { bg: theme.palette.success.light, color: theme.palette.success.contrastText };
      case 'cancelled': return { bg: theme.palette.grey[400], color: theme.palette.common.white };
      default: return { bg: theme.palette.grey[300], color: theme.palette.text.primary };
    }
  };
  
  const colors = getStatusColor();
  return {
    backgroundColor: colors.bg,
    color: colors.color,
    fontWeight: 500
  };
});


const AppointmentsManagementPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsData, setAppointmentsData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('toate');
  const [filterDepartment, setFilterDepartment] = useState('toate');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Mock data for demonstration
  const mockAppointments: Appointment[] = [
    {
      id: '1',
      citizen_name: 'Maria Popescu',
      citizen_email: 'maria.popescu@email.com',
      citizen_phone: '0721234567',
      department: 'Urbanism',
      service: 'Certificat de urbanism',
      appointment_date: '2024-03-25',
      appointment_time: '10:00',
      status: 'confirmed',
      notes: 'Documentație completă',
      created_at: '2024-03-20T14:30:00Z',
      updated_at: '2024-03-21T09:15:00Z'
    },
    {
      id: '2',
      citizen_name: 'Ion Gheorghe',
      citizen_email: 'ion.gheorghe@email.com',
      citizen_phone: '0732123456',
      department: 'Taxe și Impozite',
      service: 'Consultanță taxe locale',
      appointment_date: '2024-03-26',
      appointment_time: '14:30',
      status: 'pending',
      notes: 'Prima programare',
      created_at: '2024-03-21T16:20:00Z',
      updated_at: '2024-03-21T16:20:00Z'
    },
    {
      id: '3',
      citizen_name: 'Ana Dumitrescu',
      citizen_email: 'ana.dumitrescu@email.com',
      citizen_phone: '0743234567',
      department: 'Stare Civilă',
      service: 'Certificat de naștere',
      appointment_date: '2024-03-27',
      appointment_time: '09:30',
      status: 'completed',
      notes: 'Certificat eliberat cu succes',
      created_at: '2024-03-19T11:45:00Z',
      updated_at: '2024-03-22T10:30:00Z'
    },
    {
      id: '4',
      citizen_name: 'Mihai Stoica',
      citizen_email: 'mihai.stoica@email.com',
      citizen_phone: '0754345678',
      department: 'Juridic',
      service: 'Consultanță juridică',
      appointment_date: '2024-03-28',
      appointment_time: '11:00',
      status: 'cancelled',
      notes: 'Anulată de cetățean',
      created_at: '2024-03-20T09:20:00Z',
      updated_at: '2024-03-23T15:45:00Z'
    }
  ];

  const mockStats = {
    total_appointments: 42,
    pending_appointments: 8,
    confirmed_appointments: 15,
    completed_appointments: 16,
    cancelled_appointments: 3,
    today_appointments: 6
  };

  useEffect(() => {
    loadData();
  }, [page, rowsPerPage, filterStatus, filterDepartment]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Încarcă statistici și programări în paralel
      const [statsData, appointmentsData] = await Promise.all([
        appointmentsService.getAppointmentsStats(),
        appointmentsService.getAppointments({
          page: page + 1, // API folosește page 1-based
          size: rowsPerPage,
          status: filterStatus !== 'toate' ? filterStatus : undefined,
          department: filterDepartment !== 'toate' ? filterDepartment : undefined
        })
      ]);

      setStats(statsData);
      setAppointmentsData(appointmentsData);
      setAppointments(appointmentsData.appointments || []);
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      setError('Eroare la încărcarea programărilor: ' + (err?.message || 'Eroare necunoscută'));
      // Fallback la mock data în caz de eroare
      setStats(mockStats);
      setAppointmentsData({
        appointments: mockAppointments,
        total: mockAppointments.length,
        page: page + 1,
        size: rowsPerPage,
        total_pages: Math.ceil(mockAppointments.length / rowsPerPage)
      });
      setAppointments(mockAppointments);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailsOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditOpen(true);
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      setActionLoading(appointmentId);
      await appointmentsService.updateAppointmentStatus(appointmentId, newStatus);
      
      // Actualizează lista locală
      setAppointments(prev => prev.map(a => 
        a.id === appointmentId 
          ? { ...a, status: newStatus, updated_at: new Date().toISOString() }
          : a
      ));
      
      setSuccess('Status actualizat cu succes!');
      
      // Re-încarcă statisticile
      const newStats = await appointmentsService.getAppointmentsStats();
      setStats(newStats);
      
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError('Eroare la actualizarea statusului: ' + (err?.message || 'Eroare necunoscută'));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'În așteptare',
      confirmed: 'Confirmată',
      completed: 'Finalizată',
      cancelled: 'Anulată'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getTabCounts = () => {
    if (!stats) {
      return {
        toate: appointmentsData?.total || 0,
        pending: 0,
        confirmed: 0,
        completed: 0
      };
    }
    
    return {
      toate: stats.total_appointments || 0,
      pending: stats.pending_appointments || 0,
      confirmed: stats.confirmed_appointments || 0,
      completed: stats.completed_appointments || 0
    };
  };

  const tabCounts = getTabCounts();

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.citizen_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'toate' || appointment.status === filterStatus;
    const matchesDepartment = filterDepartment === 'toate' || appointment.department === filterDepartment;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Management Programări
      </Typography>

      {/* Mesaje de eroare și succes */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistici rapide */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Event sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {tabCounts.toate}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Programări
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="success.main">
                    {tabCounts.completed}
                  </Typography>
                  <Typography color="text.secondary">
                    Finalizate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="info.main">
                    {tabCounts.confirmed}
                  </Typography>
                  <Typography color="text.secondary">
                    Confirmate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTime sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {tabCounts.pending}
                  </Typography>
                  <Typography color="text.secondary">
                    În așteptare
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtre și căutare */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Căutare programări..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="toate">Toate</MenuItem>
              <MenuItem value="pending">În așteptare</MenuItem>
              <MenuItem value="confirmed">Confirmată</MenuItem>
              <MenuItem value="completed">Finalizată</MenuItem>
              <MenuItem value="cancelled">Anulată</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Departament"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <MenuItem value="toate">Toate</MenuItem>
              <MenuItem value="Urbanism">Urbanism</MenuItem>
              <MenuItem value="Taxe și Impozite">Taxe și Impozite</MenuItem>
              <MenuItem value="Stare Civilă">Stare Civilă</MenuItem>
              <MenuItem value="Juridic">Juridic</MenuItem>
              <MenuItem value="Asistență Socială">Asistență Socială</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Download />}
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs pentru filtrare rapidă */}
      <Tabs 
        value={currentTab} 
        onChange={(_, newValue) => setCurrentTab(newValue)}
        sx={{ mb: 2 }}
      >
        <Tab label={`Toate (${tabCounts.toate})`} />
        <Tab label={`În așteptare (${tabCounts.pending})`} />
        <Tab label={`Confirmate (${tabCounts.confirmed})`} />
        <Tab label={`Finalizate (${tabCounts.completed})`} />
      </Tabs>

      {/* Tabelul cu programări */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading && <LinearProgress />}
        
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <StyledTableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Cetățean</TableCell>
                <TableCell>Departament</TableCell>
                <TableCell>Serviciu</TableCell>
                <TableCell>Data & Ora</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Creată</TableCell>
                <TableCell align="center">Acțiuni</TableCell>
              </TableRow>
            </StyledTableHead>
            
            <TableBody>
              {filteredAppointments.map((appointment) => (
                <TableRow 
                  hover 
                  key={appointment.id}
                >
                  <TableCell>#{appointment.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {appointment.citizen_name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                          {appointment.citizen_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {appointment.citizen_phone}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={appointment.department} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {appointment.service}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {new Date(appointment.appointment_date).toLocaleDateString('ro-RO')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {appointment.appointment_time}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <StatusChip 
                      label={getStatusLabel(appointment.status)}
                      size="small"
                      status={appointment.status}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(appointment.created_at).toLocaleDateString('ro-RO')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Vezi detalii">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewDetails(appointment)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editează">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit(appointment)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    {appointment.status === 'pending' && (
                      <Tooltip title="Confirmă">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                          disabled={actionLoading === appointment.id}
                        >
                          {actionLoading === appointment.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <CheckCircle />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                    {appointment.status === 'confirmed' && (
                      <Tooltip title="Finalizează">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                          disabled={actionLoading === appointment.id}
                        >
                          {actionLoading === appointment.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <Event />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={appointmentsData?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Rânduri pe pagină:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} din ${count}`}
        />
      </Paper>

      {/* Dialog pentru detalii */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Detalii Programare #{selectedAppointment?.id}
        </DialogTitle>
        
        <DialogContent>
          {selectedAppointment && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedAppointment.service}
                </Typography>
                <Typography variant="body1" paragraph color="text.secondary">
                  Departament: {selectedAppointment.department}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle2">Cetățean</Typography>
                      <Typography variant="body2">{selectedAppointment.citizen_name}</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Email sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle2">Email</Typography>
                      <Typography variant="body2">{selectedAppointment.citizen_email}</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Phone sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle2">Telefon</Typography>
                      <Typography variant="body2">{selectedAppointment.citizen_phone}</Typography>
                    </Box>
                  </Box>
                </Stack>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle2">Data programării</Typography>
                      <Typography variant="body2">
                        {new Date(selectedAppointment.appointment_date).toLocaleDateString('ro-RO')}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTime sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle2">Ora</Typography>
                      <Typography variant="body2">{selectedAppointment.appointment_time}</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Business sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle2">Departament</Typography>
                      <Typography variant="body2">{selectedAppointment.department}</Typography>
                    </Box>
                  </Box>
                </Stack>
              </Grid>
              
              {selectedAppointment.notes && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Observații:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedAppointment.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Închide
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setDetailsOpen(false);
              handleEdit(selectedAppointment!);
            }}
          >
            Editează
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pentru editare */}
      <Dialog 
        open={editOpen} 
        onClose={() => setEditOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Editare Programare #{selectedAppointment?.id}
        </DialogTitle>
        
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Status"
            defaultValue={selectedAppointment?.status}
            sx={{ mb: 2, mt: 1 }}
          >
            <MenuItem value="pending">În așteptare</MenuItem>
            <MenuItem value="confirmed">Confirmată</MenuItem>
            <MenuItem value="completed">Finalizată</MenuItem>
            <MenuItem value="cancelled">Anulată</MenuItem>
          </TextField>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Observații"
            defaultValue={selectedAppointment?.notes || ''}
            placeholder="Introduceți observații pentru această programare..."
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>
            Anulează
          </Button>
          <Button variant="contained">
            Salvează
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pentru mesaje de succes */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSuccess(null)}
          sx={{ width: '100%' }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AppointmentsManagementPage;