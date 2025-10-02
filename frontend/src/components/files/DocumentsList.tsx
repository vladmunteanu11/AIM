/**
 * Componentă pentru afișarea și managementul documentelor
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Stack,
  Grid,
  Pagination,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  InsertDriveFile as FileIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { 
  filesService, 
  Document, 
  DocumentCategory, 
  DocumentFilters 
} from '../../services/filesService';

interface DocumentsListProps {
  onDocumentEdit?: (document: Document) => void;
  onDocumentDelete?: (document: Document) => void;
  showControls?: boolean;
  categoryId?: number;
  maxHeight?: string | number;
  compact?: boolean;
}

const DocumentsList: React.FC<DocumentsListProps> = ({
  onDocumentEdit,
  onDocumentDelete,
  showControls = true,
  categoryId,
  maxHeight,
  compact = false
}) => {
  // State pentru documente și filtrare
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State pentru paginare
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = compact ? 5 : 12;

  // State pentru filtrare
  const [filters, setFilters] = useState<DocumentFilters>({
    category_id: categoryId,
    page: 1,
    per_page: perPage
  });

  // State pentru UI
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Încarcă categoriile
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await filesService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Eroare la încărcarea categoriilor:', err);
      }
    };
    loadCategories();
  }, []);

  // Încarcă documentele
  const loadDocuments = useCallback(async (newFilters: DocumentFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await filesService.getDocuments(newFilters);
      setDocuments(response.documents);
      setTotalPages(response.pages);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la încărcarea documentelor');
    } finally {
      setLoading(false);
    }
  }, []);

  // Efect pentru încărcarea inițială și la schimbarea filtrelor
  useEffect(() => {
    loadDocuments(filters);
  }, [filters, loadDocuments]);

  // Handler pentru căutare
  const handleSearch = useCallback(() => {
    const newFilters = {
      ...filters,
      search_term: searchTerm || undefined,
      page: 1
    };
    setFilters(newFilters);
    setPage(1);
  }, [filters, searchTerm]);

  // Handler pentru schimbarea categoriei
  const handleCategoryChange = useCallback((value: number | '') => {
    setSelectedCategory(value);
    const newFilters = {
      ...filters,
      category_id: value || undefined,
      page: 1
    };
    setFilters(newFilters);
    setPage(1);
  }, [filters]);

  // Handler pentru paginare
  const handlePageChange = useCallback((_: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
    setFilters(prev => ({ ...prev, page: newPage }));
  }, []);

  // Descarcă un document
  const handleDownload = useCallback(async (document: Document, event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      const blob = await filesService.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Eroare la descărcarea documentului: ${err}`);
    }
  }, []);

  // Meniu pentru acțiuni document
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, document: Document) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedDocument(document);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setSelectedDocument(null);
  }, []);

  // Șterge document
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedDocument) return;

    try {
      await filesService.deleteDocument(selectedDocument.id);
      setDocuments(prev => prev.filter(doc => doc.id !== selectedDocument.id));
      setDeleteDialogOpen(false);
      onDocumentDelete?.(selectedDocument);
    } catch (err) {
      setError(`Eroare la ștergerea documentului: ${err}`);
    } finally {
      handleMenuClose();
    }
  }, [selectedDocument, onDocumentDelete]);

  // Formatează data
  const formatDate = useCallback((dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: ro });
  }, []);

  // Obține iconița pentru tipul de fișier
  const getFileIcon = useCallback((fileType: string) => {
    const type = fileType.toLowerCase();
    let color = 'text.secondary';
    
    if (type.includes('pdf')) color = 'error.main';
    else if (type.includes('image')) color = 'success.main';
    else if (type.includes('word') || type.includes('doc')) color = 'primary.main';
    else if (type.includes('excel') || type.includes('sheet')) color = 'warning.main';

    return <FileIcon sx={{ color }} />;
  }, []);

  if (loading && documents.length === 0) {
    return (
      <Box>
        {[...Array(compact ? 3 : 6)].map((_, index) => (
          <Card key={index} sx={{ mb: 1 }}>
            <CardContent>
              <Stack spacing={1}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="rectangular" height={20} />
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight, overflow: 'auto' }}>
      {/* Bara de căutare și filtrare */}
      {!compact && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              placeholder="Caută documente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              size="small"
              InputProps={{
                endAdornment: (
                  <IconButton size="small" onClick={handleSearch}>
                    <SearchIcon />
                  </IconButton>
                )
              }}
              sx={{ minWidth: 300 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Categorie</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value as number | '')}
                label="Categorie"
              >
                <MenuItem value="">Toate categoriile</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* Informații rezultate */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {total} documente găsite
          </Typography>
        </Box>
      )}

      {/* Mesaj eroare */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Lista documentelor */}
      {documents.length === 0 && !loading ? (
        <Alert severity="info">
          Nu au fost găsite documente.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {documents.map((document) => (
            <Grid item xs={12} sm={compact ? 12 : 6} md={compact ? 12 : 4} key={document.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  '&:hover': {
                    elevation: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease'
                  }
                }}
                onClick={() => handleDownload(document)}
              >
                <CardContent>
                  <Stack spacing={2} height="100%">
                    {/* Header cu tipul fișierului și meniu */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack direction="row" spacing={1} alignItems="center" flex={1}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'transparent' }}>
                          {getFileIcon(document.file_type)}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6" component="h3" noWrap>
                            {document.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {document.file_type.toUpperCase()} • {document.file_size_formatted}
                          </Typography>
                        </Box>
                      </Stack>
                      
                      {showControls && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, document)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      )}
                    </Stack>

                    {/* Descriere */}
                    {document.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: compact ? 2 : 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {document.description}
                      </Typography>
                    )}

                    {/* Tags */}
                    {document.tags.length > 0 && (
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {document.tags.slice(0, 3).map((tag, index) => (
                          <Chip key={index} label={tag} size="small" variant="outlined" />
                        ))}
                        {document.tags.length > 3 && (
                          <Chip label={`+${document.tags.length - 3}`} size="small" variant="outlined" />
                        )}
                      </Stack>
                    )}

                    {/* Footer cu data și categoria */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mt="auto">
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(document.uploaded_at)}
                      </Typography>
                      
                      {document.category && (
                        <Chip 
                          label={document.category.name} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      )}
                    </Stack>

                    {/* Status indicators */}
                    <Stack direction="row" spacing={1} alignItems="center">
                      {!document.is_public && (
                        <Chip label="Privat" size="small" color="warning" />
                      )}
                      {document.requires_auth && (
                        <Chip label="Necesită autentificare" size="small" color="error" />
                      )}
                      {document.download_count > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {document.download_count} descărcări
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Paginare */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Meniu acțiuni document */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedDocument && handleDownload(selectedDocument)}>
          <DownloadIcon sx={{ mr: 1 }} />
          Descarcă
        </MenuItem>
        
        {showControls && onDocumentEdit && (
          <MenuItem onClick={() => {
            if (selectedDocument) {
              onDocumentEdit(selectedDocument);
              handleMenuClose();
            }
          }}>
            <EditIcon sx={{ mr: 1 }} />
            Editează
          </MenuItem>
        )}
        
        {showControls && (
          <MenuItem 
            onClick={() => setDeleteDialogOpen(true)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Șterge
          </MenuItem>
        )}
      </Menu>

      {/* Dialog confirmare ștergere */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmă ștergerea</DialogTitle>
        <DialogContent>
          <Typography>
            Ești sigur că vrei să ștergi documentul "{selectedDocument?.title}"?
            Această acțiune nu poate fi anulată.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Anulează
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Șterge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsList;