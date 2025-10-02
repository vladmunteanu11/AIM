/**
 * Floating Action Button modern pentru acces rapid la servicii
 * Design conform standardelor DigiLocal cu UX îmbunătățit
 */
import React, { useState, useEffect } from 'react';
import {
  Fab,
  Box,
  Tooltip,
  Zoom,
  useTheme,
  useMediaQuery,
  alpha,
  IconButton,
  Typography,
  Paper,
  Popper,
  ClickAwayListener,
  MenuList,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Event as EventIcon,
  Payment as PaymentIcon,
  Help as HelpIcon,
  ChatBubble as ChatIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Animații pentru FAB
const bounce = keyframes`
  0%, 20%, 53%, 80%, 100% {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -8px, 0);
  }
  70% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -1px, 0);
  }
`;

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(0, 73, 144, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 73, 144, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 73, 144, 0);
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(180deg);
  }
`;

// Styled components
const StyledFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
  color: '#ffffff',
  boxShadow: '0 8px 24px rgba(0, 73, 144, 0.3)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  zIndex: 1050,
  
  '&:hover': {
    transform: 'scale(1.1)',
    boxShadow: '0 12px 32px rgba(0, 73, 144, 0.4)',
    animation: `${bounce} 1s`
  },

  '&.pulse': {
    animation: `${pulse} 2s infinite`
  },

  [theme.breakpoints.down('sm')]: {
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    width: 48,
    height: 48
  }
}));

const ActionButton = styled(Fab)(({ theme }) => ({
  background: '#ffffff',
  color: theme.palette.primary.main,
  boxShadow: '0 4px 12px rgba(0, 73, 144, 0.15)',
  border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  margin: theme.spacing(0.5),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.05),
    borderColor: theme.palette.primary.main,
    transform: 'scale(1.05)',
    boxShadow: '0 6px 16px rgba(0, 73, 144, 0.2)'
  }
}));

const ActionsContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(12),
  right: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  zIndex: 1049,

  [theme.breakpoints.down('sm')]: {
    bottom: theme.spacing(10),
    right: theme.spacing(2)
  }
}));

const QuickMenuPopper = styled(Popper)(({ theme }) => ({
  zIndex: 1051,
  '& .MuiPaper-root': {
    borderRadius: 16,
    boxShadow: '0 12px 40px rgba(0, 73, 144, 0.15)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
    minWidth: 200,
    maxWidth: 280
  }
}));

// Date pentru acțiunile rapide
const quickActions = [
  {
    id: 'contact',
    label: 'Contact Rapid',
    icon: <PhoneIcon />,
    path: '/contact',
    color: '#2E7D32'
  },
  {
    id: 'email',
    label: 'Trimite Email',
    icon: <EmailIcon />,
    path: '/contact',
    color: '#1976D2'
  },
  {
    id: 'appointment',
    label: 'Programare',
    icon: <EventIcon />,
    path: '/programari-online',
    color: '#7B1FA2'
  },
  {
    id: 'payment',
    label: 'Plăți Online',
    icon: <PaymentIcon />,
    path: '/plati-online',
    color: '#F57C00'
  },
  {
    id: 'help',
    label: 'Ajutor',
    icon: <HelpIcon />,
    path: '/contact',
    color: '#E91E63'
  }
];

interface FloatingActionButtonProps {
  variant?: 'simple' | 'expandable' | 'menu';
  showLabels?: boolean;
  pulseOnMount?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  variant = 'expandable',
  showLabels = true,
  pulseOnMount = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [shouldPulse, setShouldPulse] = useState(pulseOnMount);

  useEffect(() => {
    if (pulseOnMount) {
      const timer = setTimeout(() => {
        setShouldPulse(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [pulseOnMount]);

  const handleMainClick = (event: React.MouseEvent<HTMLElement>) => {
    if (variant === 'menu') {
      setAnchorEl(anchorEl ? null : event.currentTarget);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleActionClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setAnchorEl(null);
  };

  const handleClickAway = () => {
    setAnchorEl(null);
  };

  // Variant simplu - doar un buton
  if (variant === 'simple') {
    return (
      <Tooltip title="Contact rapid" placement="left">
        <StyledFab 
          onClick={() => navigate('/contact')}
          className={shouldPulse ? 'pulse' : ''}
        >
          <PhoneIcon />
        </StyledFab>
      </Tooltip>
    );
  }

  // Variant menu cu Popper
  if (variant === 'menu') {
    return (
      <ClickAwayListener onClickAway={handleClickAway}>
        <Box>
          <Tooltip title="Acțiuni rapide" placement="left">
            <StyledFab 
              onClick={handleMainClick}
              className={shouldPulse ? 'pulse' : ''}
            >
              <ChatIcon />
            </StyledFab>
          </Tooltip>

          <QuickMenuPopper
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            placement="top-end"
            transition
          >
            {({ TransitionProps }) => (
              <Zoom {...TransitionProps}>
                <Paper>
                  <MenuList dense>
                    <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}` }}>
                      <Typography variant="subtitle2" color="primary" fontWeight="bold">
                        Acțiuni Rapide
                      </Typography>
                    </Box>
                    {quickActions.map((action) => (
                      <MenuItem
                        key={action.id}
                        onClick={() => handleActionClick(action.path)}
                        sx={{
                          py: 1.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                            transform: 'translateX(4px)'
                          }
                        }}
                      >
                        <ListItemIcon sx={{ color: action.color, minWidth: 36 }}>
                          {action.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={action.label}
                          primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                        />
                      </MenuItem>
                    ))}
                  </MenuList>
                </Paper>
              </Zoom>
            )}
          </QuickMenuPopper>
        </Box>
      </ClickAwayListener>
    );
  }

  // Variant expandabil implicit
  return (
    <Box>
      <StyledFab 
        onClick={handleMainClick}
        className={shouldPulse ? 'pulse' : ''}
        sx={{
          '& svg': {
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }
        }}
      >
        {isOpen ? <CloseIcon /> : <AddIcon />}
      </StyledFab>

      <ActionsContainer>
        {quickActions.map((action, index) => (
          <Zoom
            key={action.id}
            in={isOpen}
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {showLabels && !isMobile && (
                <Paper
                  sx={{
                    px: 2,
                    py: 1,
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body2" color="text.primary" fontWeight="500">
                    {action.label}
                  </Typography>
                </Paper>
              )}
              <Tooltip title={action.label} placement="left">
                <ActionButton
                  size="small"
                  onClick={() => handleActionClick(action.path)}
                  sx={{ color: action.color }}
                >
                  {action.icon}
                </ActionButton>
              </Tooltip>
            </Box>
          </Zoom>
        ))}
      </ActionsContainer>
    </Box>
  );
};

export default FloatingActionButton;