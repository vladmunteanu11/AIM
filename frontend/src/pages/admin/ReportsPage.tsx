/**
 * Pagina de Rapoarte și Statistici pentru Administrarea Primăriei
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  MenuItem,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  PieChart,
  BarChart,
  Download,
  DateRange,
  Assignment,
  Event,
  People,
  CheckCircle,
  Warning,
  Error,
  Info
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-2px)'
  }
}));

const TrendIndicator = styled(Box)<{ trend: 'up' | 'down' | 'neutral' }>(({ theme, trend }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: trend === 'up' ? theme.palette.success.main : 
         trend === 'down' ? theme.palette.error.main : 
         theme.palette.text.secondary,
  fontWeight: 500,
  fontSize: '0.875rem'
}));

interface StatItem {
  title: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [error, setError] = useState<string | null>(null);

  // Mock data pentru statistici
  const stats: StatItem[] = [
    {
      title: 'Total Sesizări',
      value: 142,
      change: 12,
      trend: 'up',
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: 'primary.main'
    },
    {
      title: 'Programări',
      value: 89,
      change: -5,
      trend: 'down', 
      icon: <Event sx={{ fontSize: 40 }} />,
      color: 'info.main'
    },
    {
      title: 'Cetățeni Activi',
      value: 234,
      change: 18,
      trend: 'up',
      icon: <People sx={{ fontSize: 40 }} />,
      color: 'success.main'
    },
    {
      title: 'Rata Rezolvare',
      value: 87,
      change: 3,
      trend: 'up',
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: 'warning.main'
    }
  ];

  const complaintsCategories: CategoryData[] = [
    { name: 'Infrastructură', value: 45, percentage: 32, color: '#1976d2' },
    { name: 'Utilități publice', value: 32, percentage: 23, color: '#388e3c' },
    { name: 'Salubritate', value: 28, percentage: 20, color: '#f57c00' },
    { name: 'Mediu', value: 20, percentage: 14, color: '#7b1fa2' },
    { name: 'Transport', value: 15, percentage: 11, color: '#d32f2f' }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'complaint',
      title: 'Sesizare nouă - Groapă în carosabil',
      time: '2 ore în urmă',
      status: 'new',
      priority: 'high'
    },
    {
      id: 2,
      type: 'appointment',
      title: 'Programare confirmată - Certificat urbanism',
      time: '4 ore în urmă',
      status: 'confirmed',
      priority: 'normal'
    },
    {
      id: 3,
      type: 'complaint',
      title: 'Sesizare rezolvată - Iluminat public defect',
      time: '6 ore în urmă',
      status: 'resolved',
      priority: 'medium'
    },
    {
      id: 4,
      type: 'appointment',
      title: 'Programare finalizată - Certificat naștere',
      time: '1 zi în urmă',
      status: 'completed',
      priority: 'normal'
    }
  ];

  useEffect(() => {
    const loadReportsData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setError(null);
      } catch (err: any) {
        setError('Eroare la încărcarea rapoartelor: ' + (err?.message || 'Eroare necunoscută'));
      } finally {
        setLoading(false);
      }
    };

    loadReportsData();
  }, [selectedPeriod]);

  const getActivityIcon = (type: string, status: string) => {
    if (type === 'complaint') {
      switch (status) {
        case 'new': return <Info color="info" />;
        case 'resolved': return <CheckCircle color="success" />;
        default: return <Warning color="warning" />;
      }
    } else {
      switch (status) {
        case 'confirmed': return <Event color="info" />;
        case 'completed': return <CheckCircle color="success" />;
        default: return <Warning color="warning" />;
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Rapoarte și Statistici
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            size="small"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="7">Ultima săptămână</MenuItem>
            <MenuItem value="30">Ultima lună</MenuItem>
            <MenuItem value="90">Ultimele 3 luni</MenuItem>
            <MenuItem value="365">Ultimul an</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            startIcon={<Download />}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistici generale */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatsCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: stat.color, mr: 2 }}>
                    {stat.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: stat.color }}>
                      {stat.title === 'Rata Rezolvare' ? `${stat.value}%` : stat.value}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
                <TrendIndicator trend={stat.trend}>
                  {stat.trend === 'up' ? <TrendingUp /> : 
                   stat.trend === 'down' ? <TrendingDown /> : <BarChart />}
                  {Math.abs(stat.change)}% față de perioada precedentă
                </TrendIndicator>
              </CardContent>
            </StatsCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Sesizări pe categorii */}
        <Grid item xs={12} md={6}>
          <StatsCard>
            <CardHeader 
              title="Sesizări pe Categorii"
              subheader={`Ultimele ${selectedPeriod} zile`}
              action={<PieChart color="action" />}
            />
            <CardContent>
              {loading ? (
                <LinearProgress sx={{ mb: 2 }} />
              ) : (
                <>
                  {complaintsCategories.map((category, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {category.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {category.value} ({category.percentage}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={category.percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: category.color,
                            borderRadius: 4
                          }
                        }}
                      />
                    </Box>
                  ))}
                </>
              )}
            </CardContent>
          </StatsCard>
        </Grid>

        {/* Activitate recentă */}
        <Grid item xs={12} md={6}>
          <StatsCard>
            <CardHeader 
              title="Activitate Recentă"
              subheader="Ultimele acțiuni din sistem"
              action={<Assessment color="action" />}
            />
            <CardContent sx={{ p: 0 }}>
              <List>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getActivityIcon(activity.type, activity.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.title}
                        secondary={activity.time}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                      <Chip
                        label={activity.priority}
                        size="small"
                        color={activity.priority === 'high' ? 'error' : 
                               activity.priority === 'medium' ? 'warning' : 'default'}
                        variant="outlined"
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </StatsCard>
        </Grid>

        {/* Performanța departamentelor */}
        <Grid item xs={12}>
          <StatsCard>
            <CardHeader 
              title="Performanța Departamentelor"
              subheader="Timp mediu de răspuns și rata de rezolvare"
              action={<BarChart color="action" />}
            />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Departament</TableCell>
                      <TableCell align="center">Sesizări Totale</TableCell>
                      <TableCell align="center">Rezolvate</TableCell>
                      <TableCell align="center">În lucru</TableCell>
                      <TableCell align="center">Timp mediu (ore)</TableCell>
                      <TableCell align="center">Rata rezolvare</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Urbanism</TableCell>
                      <TableCell align="center">45</TableCell>
                      <TableCell align="center">38</TableCell>
                      <TableCell align="center">7</TableCell>
                      <TableCell align="center">24</TableCell>
                      <TableCell align="center">
                        <Chip label="84%" color="success" size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Utilități publice</TableCell>
                      <TableCell align="center">32</TableCell>
                      <TableCell align="center">29</TableCell>
                      <TableCell align="center">3</TableCell>
                      <TableCell align="center">18</TableCell>
                      <TableCell align="center">
                        <Chip label="91%" color="success" size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Salubritate</TableCell>
                      <TableCell align="center">28</TableCell>
                      <TableCell align="center">26</TableCell>
                      <TableCell align="center">2</TableCell>
                      <TableCell align="center">12</TableCell>
                      <TableCell align="center">
                        <Chip label="93%" color="success" size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Mediu</TableCell>
                      <TableCell align="center">20</TableCell>
                      <TableCell align="center">15</TableCell>
                      <TableCell align="center">5</TableCell>
                      <TableCell align="center">36</TableCell>
                      <TableCell align="center">
                        <Chip label="75%" color="warning" size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Transport</TableCell>
                      <TableCell align="center">15</TableCell>
                      <TableCell align="center">12</TableCell>
                      <TableCell align="center">3</TableCell>
                      <TableCell align="center">48</TableCell>
                      <TableCell align="center">
                        <Chip label="80%" color="warning" size="small" />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsPage;