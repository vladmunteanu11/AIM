/**
 * Pagină administrativă pentru gestionarea documentelor oficiale
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  CheckCircle as ApproveIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import { formsService, FormSubmission } from '../../services/formsService';
import DocumentPreview from '../../components/forms/DocumentPreview';

const DocumentsAdminPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState<{
    open: boolean;
    submission: FormSubmission | null;
    newStatus: string;
  }>({
    open: false,
    submission: null,
    newStatus: ''
  });

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Încarcă toate cererile
      const allSubmissions = await formsService.getFormSubmissions({ limit: 100 });
      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Error loading submissions:', error);
      setError('Eroare la încărcarea cererilor');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApprove = async (submission: FormSubmission) => {
    try {
      await formsService.quickApproveSubmission(submission.id);
      await loadSubmissions(); // Reîncarcă lista
      alert(`Cererea ${submission.reference_number} a fost aprobată!`);
    } catch (error) {
      console.error('Error approving submission:', error);
      alert('Eroare la aprobarea cererii');
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdateDialog.submission || !statusUpdateDialog.newStatus) return;
    
    try {
      await formsService.updateSubmissionStatus(
        statusUpdateDialog.submission.id,
        statusUpdateDialog.newStatus
      );
      
      setStatusUpdateDialog({ open: false, submission: null, newStatus: '' });
      await loadSubmissions();
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Încărcare cereri...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Administrare Documente Oficiale
      </Typography>
      
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Gestionați cererile administrative și generați documentele oficiale
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cereri Administrative
          </Typography>
          
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
                {submissions.map((submission) => (
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
                        {submission.status !== 'approved' && submission.status !== 'completed' && (
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
                          title="Preview document"
                        >
                          <DocumentIcon />
                        </IconButton>
                        
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setStatusUpdateDialog({
                            open: true,
                            submission,
                            newStatus: submission.status
                          })}
                        >
                          Status
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                
                {submissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">
                        Nu există cereri în sistem
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      {/* Dialog pentru preview document */}
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
      
      {/* Dialog pentru actualizare status */}
      <Dialog
        open={statusUpdateDialog.open}
        onClose={() => setStatusUpdateDialog({ open: false, submission: null, newStatus: '' })}
      >
        <DialogTitle>Actualizare Status</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Noul Status"
            value={statusUpdateDialog.newStatus}
            onChange={(e) => setStatusUpdateDialog(prev => ({ ...prev, newStatus: e.target.value }))}
            SelectProps={{ native: true }}
            sx={{ mt: 2 }}
          >
            <option value="">Selectează status</option>
            <option value="pending">În așteptare</option>
            <option value="in_review">În analiză</option>
            <option value="approved">Aprobată</option>
            <option value="completed">Finalizată</option>
            <option value="rejected">Respinsă</option>
            <option value="on_hold">Suspendată</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusUpdateDialog({ open: false, submission: null, newStatus: '' })}>
            Anulează
          </Button>
          <Button 
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={!statusUpdateDialog.newStatus}
          >
            Actualizează
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsAdminPage;