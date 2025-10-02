/**
 * Header principal conform design system DigiLocal
 * Implementează structura de navigare obligatorie din PDF oficial
 */
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
  InputBase,
  alpha,
  Typography,
  Container,
  Divider,
  ListItemIcon
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Info,
  Campaign,
  Article,
  ContactSupport
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// Structura de navigare simplificată
const navigationItems = [
  { label: 'Despre Primărie', path: '/despre-primarie' },
  { label: 'Informații Publice', path: '/informatii-interes-public' },
  { label: 'Transparență', path: '/transparenta-decizionala' },
  { label: 'Servicii Online', path: '/servicii-publice' },
  { label: 'Programări', path: '/programari-online' },
  { label: 'Plăți Online', path: '/plati-online' }
];

// Styled components pentru header modern
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#FFFFFF',
  color: theme.palette.primary.main,
  boxShadow: '0 4px 20px rgba(0, 73, 144, 0.08)',
  backdropFilter: 'blur(20px)',
  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'sticky',
  top: 0,
  zIndex: theme.zIndex.appBar
}));

const LogoContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  textDecoration: 'none',
  color: 'inherit'
});

const LogoImage = styled('img')({
  height: '40px',
  width: 'auto'
});

const MunicipalityName = styled(Typography)(({ theme }) => ({
  fontFamily: 'Trajan Pro, serif',
  fontSize: '1.2rem',
  fontWeight: 600,
  lineHeight: 1.2,
  [theme.breakpoints.down('md')]: {
    fontSize: '1rem'
  }
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: 12,
  backgroundColor: alpha(theme.palette.primary.main, 0.04),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    borderColor: alpha(theme.palette.primary.main, 0.2),
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0, 73, 144, 0.15)'
  },
  '&:focus-within': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
  },
  marginLeft: theme.spacing(2),
  width: '100%',
  maxWidth: '350px',
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
    maxWidth: '280px'
  }
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%'
  },
}));

const ContactBar = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  padding: theme.spacing(1, 0),
  fontSize: '0.875rem',
  color: '#ffffff !important',
  position: 'relative',
  zIndex: theme.zIndex.appBar + 1,
  '& *': {
    color: '#ffffff !important'
  },
  '& .MuiTypography-root': {
    color: '#ffffff !important'
  },
  '& .MuiSvgIcon-root': {
    color: '#ffffff !important'
  }
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 600,
  fontSize: '0.875rem',
  padding: theme.spacing(1, 2),
  borderRadius: 8,
  textTransform: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  minWidth: 'auto',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },
  '&:hover': {
    color: theme.palette.primary.dark,
    transform: 'translateY(-1px)',
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    '&::before': {
      opacity: 1
    }
  }
}));

const ContactButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`,
  color: theme.palette.common.white,
  fontWeight: 600,
  borderRadius: 12,
  padding: theme.spacing(1, 3),
  textTransform: 'none',
  boxShadow: '0 4px 12px rgba(0, 121, 193, 0.3)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0, 121, 193, 0.4)'
  },
  '&:active': {
    transform: 'translateY(0px)'
  }
}));

interface HeaderProps {
  municipalityConfig?: {
    name: string;
    logo_url?: string;
    contact_email?: string;
    contact_phone?: string;
  };
}

const Header: React.FC<HeaderProps> = ({ municipalityConfig }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const navigate = useNavigate();
  
  console.log('Header rendering with config:', municipalityConfig);
  console.log('Is mobile:', isMobile);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/cautare?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const MobileMenu = (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
      PaperProps={{
        sx: { width: '320px' }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" color="primary">
          Meniu Navigare
        </Typography>
        <IconButton onClick={handleMobileMenuToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <List sx={{ py: 0 }}>
        {navigationItems.map((item) => (
          <ListItem 
            key={item.label}
            button
            onClick={() => {
              navigate(item.path);
              handleMobileMenuToggle();
            }}
            sx={{ 
              py: 1.5,
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Info />
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItem>
        ))}
        
        <Divider sx={{ my: 1 }} />
        
        {/* Links suplimentare */}
        <ListItem
          button
          onClick={() => {
            navigate('/anunturi');
            handleMobileMenuToggle();
          }}
          sx={{ 
            py: 1.5,
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Campaign />
          </ListItemIcon>
          <ListItemText 
            primary="Anunțuri"
            primaryTypographyProps={{ fontWeight: 500 }}
          />
        </ListItem>
        
        <ListItem
          button
          onClick={() => {
            navigate('/monitorul-oficial-local');
            handleMobileMenuToggle();
          }}
          sx={{ 
            py: 1.5,
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Article />
          </ListItemIcon>
          <ListItemText 
            primary="Monitorul Oficial Local"
            primaryTypographyProps={{ fontWeight: 500 }}
          />
        </ListItem>
        
        <ListItem
          button
          onClick={() => {
            navigate('/contact');
            handleMobileMenuToggle();
          }}
          sx={{ 
            py: 1.5,
            color: 'secondary.main',
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <ContactSupport />
          </ListItemIcon>
          <ListItemText 
            primary="Contact"
            primaryTypographyProps={{ fontWeight: 600 }}
          />
        </ListItem>
      </List>
    </Drawer>
  );

  return (
    <>
      {/* Bara de contact */}
      <ContactBar>
        <Container maxWidth="xl">
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            color: '#ffffff',
            fontSize: '0.75rem'
          }}>
            <Box sx={{ display: 'flex', gap: 3 }}>
              {municipalityConfig?.contact_phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: '0.875rem', color: '#ffffff' }} />
                  <Typography variant="body2" component="span" sx={{ color: '#ffffff' }}>
                    {municipalityConfig.contact_phone}
                  </Typography>
                </Box>
              )}
              {municipalityConfig?.contact_email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EmailIcon sx={{ fontSize: '0.875rem', color: '#ffffff' }} />
                  <Typography variant="body2" component="span" sx={{ color: '#ffffff' }}>
                    {municipalityConfig.contact_email}
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" component="span" sx={{ color: '#ffffff' }}>
                Program: L-V 08:00-16:00
              </Typography>
            </Box>
          </Box>
        </Container>
      </ContactBar>

      {/* Header principal */}
      <StyledAppBar position="sticky" elevation={0}>
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            {/* Logo și nume primărie */}
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <LogoContainer>
              {municipalityConfig?.logo_url && (
                <LogoImage 
                  src={municipalityConfig.logo_url} 
                  alt={`Logo ${municipalityConfig.name}`}
                />
              )}
              <MunicipalityName variant="h6">
                {municipalityConfig?.name || 'Primăria Digitală'}
              </MunicipalityName>
              </LogoContainer>
            </Link>

            {/* Navigare desktop */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {navigationItems.map((item) => (
                  <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                    <NavButton size="small">
                      {item.label}
                    </NavButton>
                  </Link>
                ))}
                
                {/* Links suplimentare în header */}
                <Link to="/anunturi" style={{ textDecoration: 'none' }}>
                  <NavButton size="small">
                    Anunțuri
                  </NavButton>
                </Link>
                
                <Link to="/monitorul-oficial-local" style={{ textDecoration: 'none' }}>
                  <NavButton size="small">
                    MOL
                  </NavButton>
                </Link>
              </Box>
            )}

            {/* Căutare și Contact */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Bara de căutare */}
              <SearchContainer component="form" onSubmit={handleSearch}>
                <SearchIconWrapper>
                  <SearchIcon />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder="Caută ce ai nevoie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  inputProps={{ 'aria-label': 'search' }}
                />
              </SearchContainer>

              {/* Buton Contact */}
              {!isMobile && (
                <Link to="/contact" style={{ textDecoration: 'none' }}>
                  <ContactButton
                    variant="contained"
                    size="small"
                  >
                  Contact
                  </ContactButton>
                </Link>
              )}

              {/* Menu mobil */}
              {isMobile && (
                <IconButton
                  color="inherit"
                  onClick={handleMobileMenuToggle}
                  aria-label="open menu"
                >
                  <MenuIcon />
                </IconButton>
              )}
            </Box>
          </Toolbar>
        </Container>
      </StyledAppBar>

      {/* Menu mobil */}
      {MobileMenu}
    </>
  );
};

export default Header;