/**
 * Pagina de Management Anunțuri
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  MenuItem,
  Alert,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Campaign as AnnouncementIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { Announcement } from '../../types/api';

export const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      title: 'Consultare publică - Planul Urbanistic General',
      content: 'Detalii complete despre consultarea publică pentru actualizarea Planului Urbanistic General...',
      excerpt: 'Invităm cetățenii să participe la consultarea publică pentru actualizarea Planului Urbanistic General.',
      date: '2024-11-15',
      category: 'Urbanism',
      is_urgent: true,
      image_url: '/announcements/urban-plan.jpg'
    },
    {
      id: 2,
      title: 'Program special de colectare deșeuri voluminoase',
      content: 'În perioada 20-24 noiembrie se va desfășura programul special...',
      excerpt: 'În perioada 20-24 noiembrie se va desfășura programul special de colectare a deșeurilor voluminoase.',
      date: '2024-11-12',
      category: 'Mediu',
      is_urgent: false,
      image_url: '/announcements/waste-collection.jpg'
    },
    {
      id: 3,
      title: 'Modernizarea sistemului de iluminat public',
      content: 'A început proiectul de modernizare a sistemului de iluminat public cu tehnologie LED...',
      excerpt: 'A început proiectul de modernizare a sistemului de iluminat public cu tehnologie LED.',
      date: '2024-11-10',
      category: 'Infrastructură',
      is_urgent: false,
      image_url: '/announcements/led-lighting.jpg'
    }
  ]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    is_urgent: false
  });

  const categories = [
    'Urbanism',
    'Mediu',
    'Infrastructură',
    'Educație',
    'Sănătate',
    'Cultură',
    'Transport',
    'Administrație'
  ];

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      excerpt: announcement.excerpt,
      category: announcement.category,
      is_urgent: announcement.is_urgent
    });
    setEditDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: 'Administrație',
      is_urgent: false
    });
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (editingAnnouncement) {
      // Update existing
      setAnnouncements(prev => prev.map(ann => 
        ann.id === editingAnnouncement.id 
          ? { ...ann, ...formData }
          : ann
      ));
    } else {
      // Add new
      const newAnnouncement: Announcement = {
        id: Math.max(...announcements.map(a => a.id)) + 1,
        ...formData,
        date: new Date().toISOString().split('T')[0],
        image_url: '/announcements/default.jpg'
      };
      setAnnouncements(prev => [newAnnouncement, ...prev]);
    }
    setEditDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Ștergeți acest anunț?')) {
      setAnnouncements(prev => prev.filter(ann => ann.id !== id));
    }
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Gestiune Anunțuri
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administrează anunțurile pentru cetățeni
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          size="large"
        >
          Anunț Nou
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <Card sx={{ minWidth: 150 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {announcements.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total anunțuri
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 150 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="error" fontWeight="bold">
              {announcements.filter(a => a.is_urgent).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Urgente
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 150 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {new Set(announcements.map(a => a.category)).size}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Categorii
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Announcements Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Anunț</TableCell>
                <TableCell>Categorie</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data</TableCell>
                <TableCell align="right">Acțiuni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {announcements.map((announcement) => (
                <TableRow key={announcement.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <AnnouncementIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {announcement.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {announcement.excerpt.substring(0, 80)}...
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={announcement.category} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    {announcement.is_urgent ? (
                      <Chip label="URGENT" size="small" color="error" />
                    ) : (
                      <Chip label="Normal" size="small" color="default" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(announcement.date).toLocaleDateString('ro-RO')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => window.open(`/anunturi/${announcement.id}`, '_blank')}
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleEdit(announcement)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingAnnouncement ? 'Editare Anunț' : 'Anunț Nou'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Titlul anunțului"
              value={formData.title}
              onChange={handleChange('title')}
              required
            />
            
            <TextField
              fullWidth
              label="Categorie"
              select
              value={formData.category}
              onChange={handleChange('category')}
              required
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Descriere scurtă"
              value={formData.excerpt}
              onChange={handleChange('excerpt')}
              multiline
              rows={2}
              helperText="Rezumatul care va apărea în listing"
            />

            <TextField
              fullWidth
              label="Conținutul complet"
              value={formData.content}
              onChange={handleChange('content')}
              multiline
              rows={6}
              helperText="Conținutul complet al anunțului"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_urgent}
                  onChange={handleChange('is_urgent')}
                  color="error"
                />
              }
              label="Anunț urgent"
            />

            {formData.is_urgent && (
              <Alert severity="warning">
                Anunțurile urgente vor fi afișate cu prioritate și marcate vizual.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} startIcon={<CancelIcon />}>
            Anulează
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={!formData.title || !formData.category}
          >
            Salvează
          </Button>
        </DialogActions>
      </Dialog>

      {/* Demo Alert */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <strong>Demo Mode:</strong> Acesta este un demo al sistemului de management anunțuri. 
        În versiunea de producție, datele vor fi salvate în baza de date.
      </Alert>
    </Box>
  );
};