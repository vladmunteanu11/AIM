/**
 * Pagina de Management Sesizări pentru Administrarea Primăriei
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
  Snackbar
} from '@mui/material';
import {
  Visibility,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Search,
  FilterList,
  Download,
  Assignment,
  Phone,
  Email,
  LocationOn,
  CalendarToday,
  Person,
  Category
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { complaintsService } from '../../services/complaintsService';

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
      case 'nou': return { bg: theme.palette.info.light, color: theme.palette.info.contrastText };
      case 'in_progress': return { bg: theme.palette.warning.light, color: theme.palette.warning.contrastText };
      case 'resolved': return { bg: theme.palette.success.light, color: theme.palette.success.contrastText };
      case 'closed': return { bg: theme.palette.grey[400], color: theme.palette.common.white };
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

const PriorityIndicator = styled(Box)<{ priority: string }>(({ priority }) => ({
  width: 8,
  height: 40,
  backgroundColor: priority === 'high' ? '#f44336' : priority === 'medium' ? '#ff9800' : '#4caf50',
  borderRadius: '4px 0 0 4px',
  position: 'absolute',
  left: 0,
  top: '50%',
  transform: 'translateY(-50%)'
}));

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'nou' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  citizen_name: string;
  citizen_email: string;
  citizen_phone: string;
  location: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  response?: string;
  attachments?: string[];
}

const ComplaintsManagementPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintsData, setComplaintsData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('toate');
  const [filterCategory, setFilterCategory] = useState('toate');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Încarcă datele inițiale
  useEffect(() => {
    loadData();
  }, [page, rowsPerPage, filterStatus, filterCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Încarcă statistici și sesizări în paralel
      const [statsData, complaintsData] = await Promise.all([
        complaintsService.getAdminStats(),
        complaintsService.getAdminComplaints({
          page: page + 1, // API folosește page 1-based
          size: rowsPerPage,
          status: filterStatus !== 'toate' ? filterStatus : undefined,
          category: filterCategory !== 'toate' ? filterCategory : undefined
        })
      ]);

      setStats(statsData);
      setComplaintsData(complaintsData);
      setComplaints(complaintsData.complaints || []);
    } catch (err: any) {
      console.error('Error loading complaints:', err);
      setError('Eroare la încărcarea sesizărilor: ' + (err?.message || 'Eroare necunoscută'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setDetailsOpen(true);
  };

  const handleEdit = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setEditOpen(true);
  };

  const handleStatusUpdate = async (complaintId: string, newStatus: Complaint['status']) => {
    try {
      setActionLoading(complaintId);
      await complaintsService.updateComplaintStatusQuick(complaintId, newStatus);
      
      // Actualizează lista locală
      setComplaints(prev => prev.map(c => 
        c.id === complaintId 
          ? { ...c, status: newStatus, updated_at: new Date().toISOString() }
          : c
      ));
      
      setSuccess('Status actualizat cu succes!');
      
      // Re-încarcă statisticile
      const newStats = await complaintsService.getAdminStats();
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
      nou: 'Nou',
      in_progress: 'În progres',
      resolved: 'Rezolvat',
      closed: 'Închis'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Scăzută',
      medium: 'Medie',
      high: 'Înaltă'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.citizen_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'toate' || complaint.status === filterStatus;
    const matchesCategory = filterCategory === 'toate' || complaint.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getTabCounts = () => {
    if (!stats) {
      return {
        toate: complaintsData?.total || 0,
        nou: 0,
        in_progress: 0,
        resolved: 0
      };
    }
    
    return {
      toate: stats.total_complaints || 0,
      nou: stats.new_complaints || 0,
      in_progress: stats.in_progress_complaints || 0,
      resolved: stats.resolved_complaints || 0
    };
  };

  const tabCounts = getTabCounts();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Management Sesizări
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
                <Assignment sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {tabCounts.toate}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Sesizări
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
                    {tabCounts.resolved}
                  </Typography>
                  <Typography color="text.secondary">
                    Rezolvate
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
                <Assignment sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {tabCounts.in_progress}
                  </Typography>
                  <Typography color="text.secondary">
                    În progres
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
                <Assignment sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="info.main">
                    {tabCounts.nou}
                  </Typography>
                  <Typography color="text.secondary">
                    Noi
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
              placeholder="Căutare sesizări..."
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
              <MenuItem value="nou">Nou</MenuItem>
              <MenuItem value="in_progress">În progres</MenuItem>
              <MenuItem value="resolved">Rezolvat</MenuItem>
              <MenuItem value="closed">Închis</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Categorie"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <MenuItem value="toate">Toate</MenuItem>
              <MenuItem value="Infrastructură">Infrastructură</MenuItem>
              <MenuItem value="Utilități publice">Utilități publice</MenuItem>
              <MenuItem value="Salubritate">Salubritate</MenuItem>
              <MenuItem value="Mediu">Mediu</MenuItem>
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
        <Tab label={`Noi (${tabCounts.nou})`} />
        <Tab label={`În progres (${tabCounts.in_progress})`} />
        <Tab label={`Rezolvate (${tabCounts.resolved})`} />
      </Tabs>

      {/* Tabelul cu sesizări */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading && <LinearProgress />}
        
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <StyledTableHead>
              <TableRow>
                <TableCell sx={{ width: 50 }}></TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Titlu</TableCell>
                <TableCell>Categorie</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Prioritate</TableCell>
                <TableCell>Cetățean</TableCell>
                <TableCell>Data</TableCell>
                <TableCell align="center">Acțiuni</TableCell>
              </TableRow>
            </StyledTableHead>
            
            <TableBody>
              {complaints.map((complaint) => (
                  <TableRow 
                    hover 
                    key={complaint.id}
                    sx={{ position: 'relative' }}
                  >
                    <TableCell sx={{ p: 0 }}>
                      <PriorityIndicator priority={complaint.priority} />
                    </TableCell>
                    <TableCell>#{complaint.id}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                        {complaint.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {complaint.location}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={complaint.category} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <StatusChip 
                        label={getStatusLabel(complaint.status)}
                        size="small"
                        status={complaint.status}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={
                          complaint.priority === 'high' ? 'error' :
                          complaint.priority === 'medium' ? 'warning.main' : 'success.main'
                        }
                        sx={{ fontWeight: 500 }}
                      >
                        {getPriorityLabel(complaint.priority)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {complaint.citizen_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(complaint.created_at).toLocaleDateString('ro-RO')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Vezi detalii">
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewDetails(complaint)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editează">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEdit(complaint)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      {complaint.status === 'nou' && (
                        <Tooltip title="Marchează în progres">
                          <IconButton 
                            size="small" 
                            color="warning"
                            onClick={() => handleStatusUpdate(complaint.id, 'in_progress')}
                            disabled={actionLoading === complaint.id}
                          >
                            {actionLoading === complaint.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <Assignment />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}
                      {complaint.status === 'in_progress' && (
                        <Tooltip title="Marchează rezolvat">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleStatusUpdate(complaint.id, 'resolved')}
                            disabled={actionLoading === complaint.id}
                          >
                            {actionLoading === complaint.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <CheckCircle />
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
          count={complaintsData?.total || 0}
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
          Detalii Sesizare #{selectedComplaint?.id}
        </DialogTitle>
        
        <DialogContent>
          {selectedComplaint && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedComplaint.title}
                </Typography>
                <Typography variant="body1" paragraph>
                  {selectedComplaint.description}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2">Cetățean</Typography>
                    <Typography variant="body2">{selectedComplaint.citizen_name}</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2">Email</Typography>
                    <Typography variant="body2">{selectedComplaint.citizen_email}</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Phone sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2">Telefon</Typography>
                    <Typography variant="body2">{selectedComplaint.citizen_phone}</Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2">Locația</Typography>
                    <Typography variant="body2">{selectedComplaint.location}</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Category sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2">Categorie</Typography>
                    <Typography variant="body2">{selectedComplaint.category}</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2">Data creării</Typography>
                    <Typography variant="body2">
                      {new Date(selectedComplaint.created_at).toLocaleString('ro-RO')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              {selectedComplaint.response && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Răspuns oficial:
                    </Typography>
                    <Typography variant="body2">
                      {selectedComplaint.response}
                    </Typography>
                  </Alert>
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
              handleEdit(selectedComplaint!);
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
          Editare Sesizare #{selectedComplaint?.id}
        </DialogTitle>
        
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Status"
            defaultValue={selectedComplaint?.status}
            sx={{ mb: 2, mt: 1 }}
          >
            <MenuItem value="nou">Nou</MenuItem>
            <MenuItem value="in_progress">În progres</MenuItem>
            <MenuItem value="resolved">Rezolvat</MenuItem>
            <MenuItem value="closed">Închis</MenuItem>
          </TextField>
          
          <TextField
            select
            fullWidth
            label="Prioritate"
            defaultValue={selectedComplaint?.priority}
            sx={{ mb: 2 }}
          >
            <MenuItem value="low">Scăzută</MenuItem>
            <MenuItem value="medium">Medie</MenuItem>
            <MenuItem value="high">Înaltă</MenuItem>
          </TextField>
          
          <TextField
            fullWidth
            label="Atribuit către"
            defaultValue={selectedComplaint?.assigned_to || ''}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Răspuns oficial"
            defaultValue={selectedComplaint?.response || ''}
            placeholder="Introduceți răspunsul oficial pentru această sesizare..."
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

export default ComplaintsManagementPage;