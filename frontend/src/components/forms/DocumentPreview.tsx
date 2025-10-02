/**
 * Componentă pentru preview și descărcare documente oficiale
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Typography,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { formsService } from '../../services/formsService';

interface DocumentPreviewProps {
  open: boolean;
  onClose: () => void;
  submissionId: string;
  referenceNumber?: string;
  citizenName?: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  open,
  onClose,
  submissionId,
  referenceNumber,
  citizenName
}) => {
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [documentStatus, setDocumentStatus] = useState<'pending' | 'generated' | 'error'>('pending');
  const [currentRefNumber, setCurrentRefNumber] = useState<string>(referenceNumber || '');

  useEffect(() => {
    if (open) {
      checkDocumentStatus();
    }
  }, [open, submissionId]);

  const checkDocumentStatus = async () => {
    try {
      setLoading(true);
      setError('');
      
      const status = await formsService.getDocumentStatus(submissionId);
      
      if (status.status === 'generated' && status.reference_number) {
        setCurrentRefNumber(status.reference_number);
        setDocumentStatus('generated');
        await loadPreview(status.reference_number);
      } else if (status.status === 'pending') {
        setDocumentStatus('pending');
      } else {
        setDocumentStatus('error');
        setError('Documentul nu a putut fi generat');
      }
    } catch (error) {
      console.error('Error checking document status:', error);
      setError('Eroare la verificarea statusului documentului');
      setDocumentStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async (refNumber: string) => {
    try {
      setLoading(true);
      const html = await formsService.previewDocument(refNumber);
      setPreviewHtml(html);
    } catch (error) {
      console.error('Error loading preview:', error);
      setError('Eroare la încărcarea preview-ului documentului');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDocument = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Aprobă rapid cererea pentru testare
      await formsService.quickApproveSubmission(submissionId);
      
      // Generează documentul
      const result = await formsService.generateDocument(submissionId);
      setCurrentRefNumber(result.reference_number);
      setDocumentStatus('generated');
      
      // Încarcă preview-ul
      await loadPreview(result.reference_number);
    } catch (error) {
      console.error('Error generating document:', error);
      setError('Eroare la generarea documentului');
      setDocumentStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!currentRefNumber) return;
    
    try {
      setLoading(true);
      const blob = await formsService.downloadDocument(currentRefNumber);
      
      // Creează URL pentru descărcare
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `document_${currentRefNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Eroare la descărcarea documentului');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!previewHtml) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(previewHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleEmailSend = () => {
    // TODO: Implementare trimitere email
    alert('Funcționalitatea de trimitere email va fi implementată în curând');
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Document Oficial
            {citizenName && ` - ${citizenName}`}
            {currentRefNumber && ` (${currentRefNumber})`}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Încărcare document...
            </Typography>
          </Box>
        )}
        
        {error && (
          <Box p={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
        
        {documentStatus === 'pending' && !loading && (
          <Box p={4} textAlign="center">
            <Typography variant="h6" gutterBottom>
              Documentul nu a fost încă generat
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Pentru a genera documentul oficial, cererea trebuie să fie aprobată.
            </Typography>
            <Button
              variant="contained"
              onClick={handleGenerateDocument}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Generează Document
            </Button>
          </Box>
        )}
        
        {documentStatus === 'generated' && previewHtml && !loading && (
          <Box 
            flex={1} 
            sx={{ 
              iframe: { 
                width: '100%', 
                height: '100%', 
                border: 'none',
                backgroundColor: 'white'
              }
            }}
          >
            <iframe
              srcDoc={previewHtml}
              title="Document Preview"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </Box>
        )}
      </DialogContent>
      
      {documentStatus === 'generated' && !loading && (
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={!previewHtml}
          >
            Printează
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={handleEmailSend}
          >
            Trimite Email
          </Button>
          
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={!currentRefNumber}
          >
            Descarcă
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default DocumentPreview;