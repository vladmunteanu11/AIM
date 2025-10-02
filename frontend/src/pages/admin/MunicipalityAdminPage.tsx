/**
 * Pagină administrativă pentru lucrătorii primăriei
 * Conține toate funcționalitățile necesare activității administrative
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
  Badge,
  Chip,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Assignment as RequestsIcon,
  Assessment as StatsIcon,
  Campaign as AnnouncementsIcon,
  Feedback as ComplaintsIcon,
  CheckCircle as ApproveIcon,
  Description as DocumentIcon,
  Email as EmailIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Notifications as NotificationIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { formsService, FormSubmission, FormSubmissionStats } from '../../services/formsService';
import DocumentPreview from '../../components/forms/DocumentPreview';

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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MunicipalityAdminPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [stats, setStats] = useState<FormSubmissionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string>('');

  // Dialog states
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    submission: FormSubmission | null;
    newStatus: string;
    notes: string;
  }>({
    open: false,
    submission: null,
    newStatus: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [submissionsData, statsData] = await Promise.all([
        formsService.getFormSubmissions({ limit: 50 }),
        formsService.getFormSubmissionStats()
      ]);
      
      setSubmissions(submissionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleQuickApprove = async (submission: FormSubmission) => {
    try {
      await formsService.quickApproveSubmission(submission.id);
      await loadData();
      alert(`Cererea ${submission.reference_number} a fost aprobată!`);
    } catch (error) {
      console.error('Error approving submission:', error);
      alert('Eroare la aprobarea cererii');
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusDialog.submission || !statusDialog.newStatus) return;
    
    try {
      await formsService.updateSubmissionStatus(
        statusDialog.submission.id,
        statusDialog.newStatus
      );
      
      setStatusDialog({ open: false, submission: null, newStatus: '', notes: '' });
      await loadData();
      alert('Statusul a fost actualizat cu succes!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Eroare la actualizarea statusului');
    }
  };

  const handlePreviewDocument = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    setPreviewOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUrgentSubmissions = () => {
    return submissions.filter(s => 
      s.status === 'pending' || 
      (s.status === 'in_review' && 
       new Date().getTime() - new Date(s.submitted_at).getTime() > 7 * 24 * 60 * 60 * 1000)
    );
  };

  const getRecentSubmissions = () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return submissions.filter(s => new Date(s.submitted_at) > oneDayAgo);
  };

  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LinearProgress sx={{ width: '300px' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Administrare Primărie
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Panou de control pentru lucrătorii primăriei
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Quick Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Cereri Noi
                  </Typography>
                  <Typography variant="h4">
                    {stats?.pending_review || 0}
                  </Typography>
                </Box>
                <Badge badgeContent={getUrgentSubmissions().length} color="error">
                  <RequestsIcon color="primary" sx={{ fontSize: 40 }} />
                </Badge>
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
                    În Procesare
                  </Typography>
                  <Typography variant="h4">
                    {stats?.in_review || 0}
                  </Typography>
                </Box>
                <ScheduleIcon color="warning" sx={{ fontSize: 40 }} />
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
                    Această Săptămână
                  </Typography>
                  <Typography variant="h4">
                    {stats?.submitted_this_week || 0}
                  </Typography>
                </Box>
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
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
                    Total Cereri
                  </Typography>
                  <Typography variant="h4">
                    {stats?.total_submissions || 0}
                  </Typography>
                </Box>
                <PeopleIcon color="info" sx={{ fontSize: 40 }} />
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
          <Tab
            icon={<RequestsIcon />}
            label={
              <Badge badgeContent={stats?.pending_review || 0} color="error">
                Cereri Administrative
              </Badge>
            }
          />
          <Tab icon={<StatsIcon />} label="Statistici & Rapoarte" />
          <Tab icon={<AnnouncementsIcon />} label="Anunțuri Publice" />
          <Tab icon={<ComplaintsIcon />} label="Sesizări Cetățeni" />
        </Tabs>

        {/* Tab 1: Cereri Administrative */}
        <TabPanel value={tabValue} index={0}>
          {getUrgentSubmissions().length > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="h6">Atenție!</Typography>
              Există {getUrgentSubmissions().length} cereri urgente care necesită atenție!
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Număr Referință</TableCell>
                  <TableCell>Solicitant</TableCell>
                  <TableCell>Tip Cerere</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Data Depunerii</TableCell>
                  <TableCell>Acțiuni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.slice(0, 20).map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {submission.reference_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {submission.citizen_name}
                        </Typography>
                        {submission.citizen_email && (
                          <Typography variant="caption" color="text.secondary">
                            {submission.citizen_email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Tip {submission.form_type_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formsService.formatStatus(submission.status)}
                        color={formsService.getStatusColor(submission.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(submission.submitted_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {submission.status === 'pending' && (
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleQuickApprove(submission)}
                            title="Aprobă rapid"
                          >
                            <ApproveIcon />
                          </IconButton>
                        )}
                        
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handlePreviewDocument(submission)}
                          title="Generează/Vezi document"
                        >
                          <DocumentIcon />
                        </IconButton>
                        
                        <IconButton
                          size="small"
                          onClick={() => setStatusDialog({
                            open: true,
                            submission,
                            newStatus: submission.status,
                            notes: ''
                          })}
                          title="Editează status"
                        >
                          <EditIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 2: Statistici */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Distribuție pe Status
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {stats?.status_breakdown && Object.entries(stats.status_breakdown).map(([status, count]) => (
                    <Box key={status} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body1">
                        {formsService.formatStatus(status)}
                      </Typography>
                      <Chip
                        label={count}
                        color={formsService.getStatusColor(status)}
                        size="small"
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tipuri de Cereri
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {stats?.form_type_breakdown && Object.entries(stats.form_type_breakdown).map(([type, count]) => (
                    <Box key={type} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body1">{type}</Typography>
                      <Chip label={count} variant="outlined" size="small" />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cereri Recente (Ultimele 24h)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {getRecentSubmissions().length} cereri noi în ultimele 24 de ore
                  </Typography>
                  {getRecentSubmissions().slice(0, 5).map((submission) => (
                    <Box key={submission.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2">
                        {submission.reference_number} - {submission.citizen_name}
                      </Typography>
                      <Chip
                        label={formsService.formatStatus(submission.status)}
                        color={formsService.getStatusColor(submission.status)}
                        size="small"
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Anunțuri */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Gestionare Anunțuri Publice
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Această secțiune va permite gestionarea anunțurilor pentru cetățeni.
          </Typography>
          <Button variant="contained" disabled>
            Adaugă Anunț Nou (În dezvoltare)
          </Button>
        </TabPanel>

        {/* Tab 4: Sesizări */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Monitorizare Sesizări Cetățeni
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Această secțiune va permite monitorizarea și răspunsul la sesizările cetățenilor.
          </Typography>
          <Button variant="contained" disabled>
            Vezi Toate Sesizările (În dezvoltare)
          </Button>
        </TabPanel>
      </Card>

      {/* Document Preview Dialog */}
      {selectedSubmission && (
        <DocumentPreview
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setSelectedSubmission(null);
          }}
          submissionId={selectedSubmission.id}
          citizenName={selectedSubmission.citizen_name}
        />
      )}

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialog.open}
        onClose={() => setStatusDialog({ open: false, submission: null, newStatus: '', notes: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Actualizare Status Cerere</DialogTitle>
        <DialogContent>
          {statusDialog.submission && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cererea: {statusDialog.submission.reference_number}
              </Typography>
              <TextField
                select
                fullWidth
                label="Noul Status"
                value={statusDialog.newStatus}
                onChange={(e) => setStatusDialog(prev => ({ ...prev, newStatus: e.target.value }))}
                SelectProps={{ native: true }}
                sx={{ mt: 2, mb: 2 }}
              >
                <option value="">Selectează status</option>
                <option value="pending">În așteptare</option>
                <option value="in_review">În analiză</option>
                <option value="approved">Aprobată</option>
                <option value="completed">Finalizată</option>
                <option value="rejected">Respinsă</option>
                <option value="on_hold">Suspendată</option>
              </TextField>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observații (opțional)"
                value={statusDialog.notes}
                onChange={(e) => setStatusDialog(prev => ({ ...prev, notes: e.target.value }))}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, submission: null, newStatus: '', notes: '' })}>
            Anulează
          </Button>
          <Button 
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={!statusDialog.newStatus}
          >
            Actualizează
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MunicipalityAdminPage;