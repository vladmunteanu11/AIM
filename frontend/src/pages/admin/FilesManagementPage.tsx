/**
 * Pagină administrativă pentru managementul fișierelor și documentelor
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Paper,
  Grid,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  CloudUpload as UploadIcon,
  Category as CategoryIcon,
  Assessment as StatsIcon,
  Settings as SettingsIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { 
  filesService, 
  Document, 
  DocumentCategory, 
  CreateDocumentRequest,
  CreateCategoryRequest,
  DocumentStats,
  StorageStats
} from '../../services/filesService';
import FileUpload from '../../components/files/FileUpload';
import DocumentsList from '../../components/files/DocumentsList';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const FilesManagementPage: React.FC = () => {
  // State pentru tabs
  const [tabValue, setTabValue] = useState(0);

  // State pentru documente și categorii
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(false);

  // State pentru statistici
  const [documentStats, setDocumentStats] = useState<DocumentStats | null>(null);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);

  // State pentru dialoguri
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingCategory, setEditingCategory] = useState<DocumentCategory | null>(null);

  // State pentru formulare
  const [categoryForm, setCategoryForm] = useState<CreateCategoryRequest>({
    name: '',
    slug: '',
    description: ''
  });

  // State pentru notificări
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Încarcă datele inițiale
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCategories(),
        loadStats()
      ]);
    } catch (error) {
      showSnackbar('Eroare la încărcarea datelor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await filesService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Eroare la încărcarea categoriilor:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [docStats, storStats] = await Promise.all([
        filesService.getDocumentStats(),
        filesService.getStorageStats()
      ]);
      setDocumentStats(docStats);
      setStorageStats(storStats);
    } catch (error) {
      console.error('Eroare la încărcarea statisticilor:', error);
    }
  };

  const showSnackbar = (message: string, severity: typeof snackbar.severity) => {
    setSnackbar({ open: true, message, severity });
  };

  // Handler pentru upload complet
  const handleUploadComplete = async (uploadedFiles: any[]) => {
    showSnackbar(`${uploadedFiles.length} fișiere încărcate cu succes!`, 'success');
    setUploadDialogOpen(false);
    await loadStats(); // Reîncarcă statisticile
  };

  // Handler pentru editarea documentului
  const handleDocumentEdit = (document: Document) => {
    setEditingDocument(document);
    // Aici ai putea deschide un dialog pentru editare
    showSnackbar('Funcționalitatea de editare va fi implementată în curând', 'info');
  };

  // Handler pentru ștergerea documentului
  const handleDocumentDelete = (document: Document) => {
    showSnackbar(`Documentul "${document.title}" a fost șters`, 'success');
    loadStats(); // Reîncarcă statisticile
  };

  // Handler pentru crearea categoriei
  const handleCreateCategory = async () => {
    if (!categoryForm.name || !categoryForm.slug) {
      showSnackbar('Completați toate câmpurile obligatorii', 'error');
      return;
    }

    try {
      await filesService.createCategory(categoryForm);
      setCategoryDialogOpen(false);
      setCategoryForm({ name: '', slug: '', description: '' });
      await loadCategories();
      showSnackbar('Categoria a fost creată cu succes!', 'success');
    } catch (error) {
      showSnackbar(`Eroare la crearea categoriei: ${error}`, 'error');
    }
  };

  // Generează slug automat din nume
  const handleNameChange = (name: string) => {
    setCategoryForm(prev => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
    }));
  };

  // Handler pentru curățarea fișierelor orfane
  const handleCleanupOrphanedFiles = async () => {
    try {
      const result = await filesService.cleanupOrphanedFiles();
      showSnackbar(
        `Curățare completă: ${result.deleted_files} fișiere șterse, ${result.errors} erori`,
        result.errors > 0 ? 'warning' : 'success'
      );
      await loadStats();
    } catch (error) {
      showSnackbar(`Eroare la curățarea fișierelor: ${error}`, 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Managementul Fișierelor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administrați documentele, categoriile și configurările sistemului de fișiere
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Încarcă Fișiere
          </Button>
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={() => setCategoryDialogOpen(true)}
          >
            Categorie Nouă
          </Button>
        </Stack>
      </Stack>

      {/* Statistici rapide */}
      {(documentStats || storageStats) && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <FileIcon color="primary" />
                  <Box>
                    <Typography variant="h4">
                      {documentStats?.total_documents || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Documente
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <FolderIcon color="secondary" />
                  <Box>
                    <Typography variant="h4">
                      {documentStats?.categories_count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Categorii
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <StatsIcon color="success" />
                  <Box>
                    <Typography variant="h4">
                      {storageStats?.total_size_formatted || '0 B'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Spațiu Folosit
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <UploadIcon color="warning" />
                  <Box>
                    <Typography variant="h4">
                      {documentStats?.total_downloads || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Descărcări
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="scrollable"
          >
            <Tab label="Documente" />
            <Tab label="Categorii" />
            <Tab label="Statistici" />
            <Tab label="Setări" />
          </Tabs>
        </Box>

        {/* Tab Documente */}
        <TabPanel value={tabValue} index={0}>
          <DocumentsList
            onDocumentEdit={handleDocumentEdit}
            onDocumentDelete={handleDocumentDelete}
            showControls={true}
          />
        </TabPanel>

        {/* Tab Categorii */}
        <TabPanel value={tabValue} index={1}>
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6">Categorii Documente</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCategoryDialogOpen(true)}
              >
                Adaugă Categorie
              </Button>
            </Stack>

            <Grid container spacing={2}>
              {categories.map(category => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {category.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {category.description || 'Fără descriere'}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Slug: {category.slug}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Creată: {new Date(category.created_at).toLocaleDateString('ro-RO')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}

              {categories.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Nu există categorii create încă. Creați prima categorie pentru a organiza documentele.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        </TabPanel>

        {/* Tab Statistici */}
        <TabPanel value={tabValue} index={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Statistici Detaliate
            </Typography>

            <Grid container spacing={3}>
              {/* Statistici documente */}
              {documentStats && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Documente
                      </Typography>
                      <Stack spacing={2}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Total documente:</Typography>
                          <Typography fontWeight="bold">
                            {documentStats.total_documents}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Documente publice:</Typography>
                          <Typography fontWeight="bold">
                            {documentStats.public_documents}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Documente private:</Typography>
                          <Typography fontWeight="bold">
                            {documentStats.private_documents}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Total descărcări:</Typography>
                          <Typography fontWeight="bold">
                            {documentStats.total_downloads}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Statistici stocare */}
              {storageStats && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Stocare
                      </Typography>
                      <Stack spacing={2}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Spațiu total folosit:</Typography>
                          <Typography fontWeight="bold">
                            {storageStats.total_size_formatted}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Număr de fișiere:</Typography>
                          <Typography fontWeight="bold">
                            {storageStats.files_count}
                          </Typography>
                        </Box>
                        
                        <Divider />
                        
                        <Typography variant="subtitle2">
                          Distribuția pe tipuri de fișiere:
                        </Typography>
                        {Object.entries(storageStats.file_types).map(([type, count]) => (
                          <Box key={type} display="flex" justifyContent="space-between">
                            <Typography variant="body2">{type.toUpperCase()}:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {count}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        </TabPanel>

        {/* Tab Setări */}
        <TabPanel value={tabValue} index={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Setări Sistem
            </Typography>

            <Stack spacing={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Administrare Fișiere
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={handleCleanupOrphanedFiles}
                    >
                      Curăță Fișierele Orfane
                    </Button>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Șterge fișierele care nu mai sunt asociate cu niciun document din baza de date.
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configurare Upload
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Setările pentru upload-ul de fișiere sunt configurate în backend prin variabilele de mediu.
                    Consultați documentația tehnică pentru modificări.
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        </TabPanel>
      </Card>

      {/* Dialog Upload */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Încarcă Documente Noi
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FileUpload
              onUploadComplete={handleUploadComplete}
              onError={(error) => showSnackbar(error, 'error')}
              maxFiles={10}
              multiple={true}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Închide
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Categorie Nouă */}
      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Adaugă Categorie Nouă
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Nume Categorie"
              value={categoryForm.name}
              onChange={(e) => handleNameChange(e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Slug"
              value={categoryForm.slug}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
              fullWidth
              required
              helperText="URL-friendly identifier (se generează automat din nume)"
            />

            <TextField
              label="Descriere"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>
            Anulează
          </Button>
          <Button
            onClick={handleCreateCategory}
            variant="contained"
            disabled={!categoryForm.name || !categoryForm.slug}
          >
            Creează Categoria
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pentru notificări */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FilesManagementPage;