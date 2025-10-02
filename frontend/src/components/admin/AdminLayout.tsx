/**
 * Layout pentru Panoul de Administrare
 */
import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  useTheme,
  useMediaQuery,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Article as PageIcon,
  Campaign as AnnouncementIcon,
  Description as DocumentIcon,
  People as UsersIcon,
  Analytics as AnalyticsIcon,
  ExitToApp as LogoutIcon,
  AccountCircle as ProfileIcon,
  Notifications as NotificationsIcon,
  Home as HomeIcon,
  Assignment as ComplaintsIcon,
  Event as AppointmentsIcon,
  Assessment as ReportsIcon
} from '@mui/icons-material';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { authService } from '../../services/authService';

const drawerWidth = 280;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    backgroundColor: theme.palette.grey[50],
    borderRight: `1px solid ${theme.palette.divider}`
  },
}));

const AppBarStyled = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: theme.palette.primary.main,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
}));

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  marginTop: '64px', // AppBar height
  [theme.breakpoints.up('md')]: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`
  }
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: 'white'
}));

const UserInfo = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.light,
  color: 'white',
  textAlign: 'center'
}));

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentUser, setCurrentUser] = useState(authService.getUser());

  // Verifică autentificarea și actualizează utilizatorul
  React.useEffect(() => {
    console.log('AdminLayout useEffect - checking auth');
    console.log('Is authenticated:', authService.isAuthenticated());
    console.log('Current user:', authService.getUser());
    
    if (!authService.isAuthenticated()) {
      console.log('Not authenticated, redirecting to login');
      navigate('/admin/login');
      return;
    }
    
    // Actualizează utilizatorul în caz că nu este încă încărcat
    const user = authService.getUser();
    if (user && !currentUser) {
      console.log('Setting user in state:', user);
      setCurrentUser(user);
    }
  }, [navigate, currentUser]);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Sesizări', icon: <ComplaintsIcon />, path: '/admin/complaints', badge: 8 },
    { text: 'Programări', icon: <AppointmentsIcon />, path: '/admin/appointments', badge: 5 },
    { text: 'Rapoarte', icon: <ReportsIcon />, path: '/admin/reports' },
    { text: 'Anunțuri', icon: <AnnouncementIcon />, path: '/admin/announcements', badge: 3 },
    { text: 'Configurare', icon: <SettingsIcon />, path: '/admin/configuration' },
    { text: 'Utilizatori', icon: <UsersIcon />, path: '/admin/users' },
    { text: 'Documente', icon: <DocumentIcon />, path: '/admin/documents' }
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      navigate('/admin/login');
    }
  };

  const handleGoToSite = () => {
    window.open('/', '_blank');
  };

  const drawer = (
    <Box>
      <LogoContainer>
        <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
          🏛️
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Admin Panel
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Primărie Digitală
          </Typography>
        </Box>
      </LogoContainer>

      <UserInfo>
        <Avatar sx={{ mx: 'auto', mb: 1, width: 48, height: 48 }}>
          {currentUser?.full_name?.charAt(0) || 'A'}
        </Avatar>
        <Typography variant="subtitle2" fontWeight="bold">
          {currentUser?.full_name || 'Administrator'}
        </Typography>
        <Chip 
          label={currentUser?.is_superuser ? 'Super Admin' : 'Admin'} 
          size="small" 
          sx={{ 
            mt: 0.5, 
            bgcolor: currentUser?.is_superuser ? 'rgba(255,193,7,0.8)' : 'rgba(33,150,243,0.8)', 
            color: 'white' 
          }} 
        />
      </UserInfo>

      <Divider />

      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.light + '20',
                  borderRight: `3px solid ${theme.palette.primary.main}`,
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                  '& .MuiListItemText-primary': {
                    fontWeight: 'bold',
                    color: theme.palette.primary.main,
                  }
                }
              }}
            >
              <ListItemIcon>
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mt: 2 }} />

      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleGoToSite}>
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Vezi Site-ul" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  // Loading state sau redirect dacă nu există user
  if (!authService.isAuthenticated()) {
    return null;
  }
  
  // Dacă nu avem încă utilizatorul, dar suntem autentificați, încercăm să îl obținem
  if (!currentUser) {
    const user = authService.getUser();
    if (user) {
      setCurrentUser(user);
    }
    // Afișăm layout-ul cu valori default până se încarcă utilizatorul
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBarStyled position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Template Primărie Digitală - Administrare
          </Typography>

          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={2} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuClick}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {currentUser?.full_name?.charAt(0) || 'A'}
            </Avatar>
          </IconButton>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <ProfileIcon fontSize="small" />
              </ListItemIcon>
              Profil
            </MenuItem>
            <MenuItem onClick={handleGoToSite}>
              <ListItemIcon>
                <HomeIcon fontSize="small" />
              </ListItemIcon>
              Vezi Site-ul
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Ieșire
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBarStyled>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <StyledDrawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
        >
          {drawer}
        </StyledDrawer>
      </Box>

      <MainContent>
        {children || <Outlet />}
      </MainContent>
    </Box>
  );
};