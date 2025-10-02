/**
 * Dashboard Principal pentru Panoul de Administrare
 * Refăcut complet cu funcționalități moderne
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ReportProblem as ComplaintsIcon,
  Schedule as AppointmentsIcon,
  People as UsersIcon,
  Analytics as AnalyticsIcon,
  TrendingUp,
  TrendingDown,
  Notifications as NotificationIcon,
  MoreVert as MoreIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { authService, AdminStats } from '../../services/authService';

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8]
  }
}));

const StatsContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3)
}));

const StatsIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 60,
  height: 60,
  borderRadius: '50%',
  marginRight: theme.spacing(2),
  fontSize: '1.5rem'
}));

const QuickActionCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[6]
  }
}));

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Mock data pentru activități recente
  const recentActivities = [
    {
      id: 1,
      type: 'complaint',
      title: 'Sesizare nouă: Gropi în carosabil',
      time: '5 minute',
      status: 'new',
      priority: 'high'
    },
    {
      id: 2,
      type: 'appointment',
      title: 'Programare confirmată: Certificate',
      time: '15 minute',
      status: 'confirmed',
      priority: 'normal'
    },
    {
      id: 3,
      type: 'complaint',
      title: 'Sesizare rezolvată: Iluminat public',
      time: '1 oră',
      status: 'resolved',
      priority: 'normal'
    },
    {
      id: 4,
      type: 'user',
      title: 'Utilizator nou în sistem',
      time: '2 ore',
      status: 'active',
      priority: 'low'
    }
  ];

  // Mock data pentru sesizări urgente
  const urgentComplaints = [
    {
      id: 'CMP-2024-001',
      title: 'Conducta spartă pe strada Principală',
      submittedAt: '2024-08-21T10:30:00Z',
      category: 'Utilități Publice',
      status: 'acknowledged',
      priority: 'critical'
    },
    {
      id: 'CMP-2024-002', 
      title: 'Copac căzut pe carosabil',
      submittedAt: '2024-08-21T11:15:00Z',
      category: 'Spații Verzi',
      status: 'in_progress',
      priority: 'high'
    }
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await authService.getAdminStats();
      setStats(data);
    } catch (err: any) {
      setError('Eroare la încărcarea statisticilor');
      console.error('Stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'complaint': return <ComplaintsIcon color="error" />;
      case 'appointment': return <AppointmentsIcon color="primary" />;
      case 'user': return <UsersIcon color="success" />;
      default: return <InfoIcon color="info" />;
    }
  };

  const getStatusChip = (status: string) => {
    const statusMap = {
      'new': { label: 'Nou', color: 'error' as const },
      'confirmed': { label: 'Confirmat', color: 'success' as const },
      'resolved': { label: 'Rezolvat', color: 'success' as const },
      'active': { label: 'Activ', color: 'primary' as const },
      'acknowledged': { label: 'Confirmat', color: 'warning' as const },
      'in_progress': { label: 'În lucru', color: 'info' as const }
    };

    const config = statusMap[status as keyof typeof statusMap] || { label: status, color: 'default' as const };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button onClick={loadStats}>Reîncarcă</Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Dashboard Administrare
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Bine ați venit în panoul de administrare al primăriei
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={loadStats} color="primary">
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={handleMenuClick}>
            <MoreIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleMenuClose}>Exportă Raport</MenuItem>
            <MenuItem onClick={handleMenuClose}>Setări Dashboard</MenuItem>
          </Menu>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Statistici Principale */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <StatsContent>
              <StatsIcon sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
                <ComplaintsIcon />
              </StatsIcon>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" fontWeight="bold">
                  {stats?.total_complaints || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Sesizări
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip 
                    label={`${stats?.pending_complaints || 0} în așteptare`}
                    size="small" 
                    color="warning"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </StatsContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <StatsContent>
              <StatsIcon sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <AppointmentsIcon />
              </StatsIcon>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" fontWeight="bold">
                  {stats?.total_appointments || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Programări
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip 
                    label={`${stats?.today_appointments || 0} astăzi`}
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </StatsContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <StatsContent>
              <StatsIcon sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}>
                <UsersIcon />
              </StatsIcon>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" fontWeight="bold">
                  {stats?.total_users || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Utilizatori Admin
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip 
                    label="Activi"
                    size="small" 
                    color="success"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </StatsContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <StatsContent>
              <StatsIcon sx={{ bgcolor: 'info.main', color: 'info.contrastText' }}>
                <AnalyticsIcon />
              </StatsIcon>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" fontWeight="bold">
                  {stats?.system_uptime || '99.9%'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Uptime Sistem
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp color="success" fontSize="small" />
                  <Typography variant="caption" color="success.main" sx={{ ml: 0.5 }}>
                    Excelent
                  </Typography>
                </Box>
              </Box>
            </StatsContent>
          </StatsCard>
        </Grid>

        {/* Acțiuni Rapide */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Acțiuni Rapide
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Link to="/admin/complaints" style={{ textDecoration: 'none' }}>
                    <QuickActionCard>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <ComplaintsIcon color="error" sx={{ fontSize: '2rem', mb: 1 }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Gestionare Sesizări
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Vezi și răspunde la sesizări
                        </Typography>
                      </CardContent>
                    </QuickActionCard>
                  </Link>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Link to="/admin/appointments" style={{ textDecoration: 'none' }}>
                    <QuickActionCard>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <AppointmentsIcon color="primary" sx={{ fontSize: '2rem', mb: 1 }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Programări
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Gestionează programările
                        </Typography>
                      </CardContent>
                    </QuickActionCard>
                  </Link>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Link to="/admin/reports" style={{ textDecoration: 'none' }}>
                    <QuickActionCard>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <AnalyticsIcon color="success" sx={{ fontSize: '2rem', mb: 1 }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Rapoarte
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Statistici și rapoarte
                        </Typography>
                      </CardContent>
                    </QuickActionCard>
                  </Link>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Link to="/admin/users" style={{ textDecoration: 'none' }}>
                    <QuickActionCard>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <UsersIcon color="info" sx={{ fontSize: '2rem', mb: 1 }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Utilizatori
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Administrează userii
                        </Typography>
                      </CardContent>
                    </QuickActionCard>
                  </Link>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Activități Recente */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Activități Recente
                </Typography>
                <Button size="small" component={Link} to="/admin/activity-log">
                  Vezi Tot
                </Button>
              </Box>
              
              <List dense>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {activity.title}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              acum {activity.time}
                            </Typography>
                            {getStatusChip(activity.status)}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Sesizări Urgente */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Sesizări Urgente
                </Typography>
                <Button variant="contained" color="error" component={Link} to="/admin/complaints?filter=urgent">
                  Vezi Toate Urgentele
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Număr</TableCell>
                      <TableCell>Descriere</TableCell>
                      <TableCell>Categorie</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Prioritate</TableCell>
                      <TableCell align="center">Acțiuni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {urgentComplaints.map((complaint) => (
                      <TableRow key={complaint.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {complaint.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {complaint.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={complaint.category} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(complaint.submittedAt).toLocaleDateString('ro-RO')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(complaint.status)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={complaint.priority}
                            color={complaint.priority === 'critical' ? 'error' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            component={Link}
                            to={`/admin/complaints/${complaint.id}`}
                          >
                            Vezi
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;