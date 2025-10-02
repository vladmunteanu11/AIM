/**
 * Enhanced Material-UI Theme conform Design System DigiLocal
 * Implementează culorile PANTONE și fonturile specificate în PDF oficial
 * Cu îmbunătățiri moderne pentru UX superior
 */
import { createTheme, ThemeOptions } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Culorile DigiLocal conform PDF oficial cu îmbunătățiri moderne
const digiLocalColors = {
  // PANTONE 280C - Culoarea principală cu gradiente
  primary: {
    main: '#004990',
    light: '#1565C0',
    dark: '#002855',
    contrastText: '#FFFFFF',
    // Adăugări pentru gradiente moderne
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#004990',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1'
  },
  // PANTONE 300C - Culoarea secundară cu variații
  secondary: {
    main: '#0079C1',
    light: '#29B6F6',
    dark: '#0277BD',
    contrastText: '#FFFFFF',
    // Variații pentru design modern
    50: '#E1F5FE',
    100: '#B3E5FC',
    200: '#81D4FA',
    300: '#4FC3F7',
    400: '#29B6F6',
    500: '#0079C1',
    600: '#039BE5',
    700: '#0288D1',
    800: '#0277BD',
    900: '#01579B'
  },
  // Palette extinsă pentru DigiLocal
  info: {
    main: '#0079C1',
    light: '#E3F2FD',
    dark: '#0D47A1'
  },
  success: {
    main: '#2E7D32',
    light: '#4CAF50',
    dark: '#1B5E20'
  },
  warning: {
    main: '#F57C00',
    light: '#FF9800',
    dark: '#E65100'
  },
  error: {
    main: '#D32F2F',
    light: '#F44336',
    dark: '#C62828'
  },
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121'
  },
  background: {
    default: '#F8FAFC',
    paper: '#FFFFFF',
    // Fundal pentru secțiuni speciale
    accent: '#F1F8FF',
    hero: 'linear-gradient(135deg, #004990 0%, #0079C1 100%)',
    section: '#FAFAFB'
  },
  text: {
    primary: '#212121',
    secondary: '#616161',
    disabled: '#9E9E9E'
  }
};

// Typography conform PDF DigiLocal - Trebuchet MS principal
const typography = {
  fontFamily: [
    'Trebuchet MS',
    'Arial',
    'Helvetica',
    'sans-serif'
  ].join(','),
  
  // Font pentru titlurile oficiale - Trajan PRO
  h1: {
    fontFamily: 'Trajan Pro, Trebuchet MS, serif',
    fontSize: '3.5rem',
    lineHeight: 1.2,
    fontWeight: 600,
    '@media (max-width:600px)': {
      fontSize: '2.5rem'
    }
  },
  h2: {
    fontFamily: 'Trebuchet MS, Arial, sans-serif',
    fontSize: '3rem',
    lineHeight: 1.2,
    fontWeight: 600,
    '@media (max-width:600px)': {
      fontSize: '2.25rem'
    }
  },
  h3: {
    fontFamily: 'Trebuchet MS, Arial, sans-serif',
    fontSize: '2.5rem',
    lineHeight: 1.2,
    fontWeight: 600,
    '@media (max-width:600px)': {
      fontSize: '2rem'
    }
  },
  h4: {
    fontFamily: 'Trebuchet MS, Arial, sans-serif',
    fontSize: '2rem',
    lineHeight: 1.3,
    fontWeight: 500,
    '@media (max-width:600px)': {
      fontSize: '1.5rem'
    }
  },
  h5: {
    fontFamily: 'Trebuchet MS, Arial, sans-serif',
    fontSize: '1.5rem',
    lineHeight: 1.4,
    fontWeight: 500,
    '@media (max-width:600px)': {
      fontSize: '1.25rem'
    }
  },
  h6: {
    fontFamily: 'Trebuchet MS, Arial, sans-serif',
    fontSize: '1.25rem',
    lineHeight: 1.4,
    fontWeight: 500,
    '@media (max-width:600px)': {
      fontSize: '1.125rem'
    }
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.5,
    fontWeight: 400
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    fontWeight: 400
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'none' as const
  }
};

// Shadouri moderne pentru depth și eleganță
const modernShadows = [
  'none',
  '0px 2px 4px rgba(0, 73, 144, 0.08)',
  '0px 4px 8px rgba(0, 73, 144, 0.12)',
  '0px 8px 16px rgba(0, 73, 144, 0.16)',
  '0px 12px 24px rgba(0, 73, 144, 0.20)',
  '0px 16px 32px rgba(0, 73, 144, 0.24)',
  '0px 20px 40px rgba(0, 73, 144, 0.28)',
  '0px 24px 48px rgba(0, 73, 144, 0.32)',
  '0px 32px 64px rgba(0, 73, 144, 0.36)',
  '0px 40px 80px rgba(0, 73, 144, 0.40)',
];

// Componente MUI customizate pentru DigiLocal cu design modern
const components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        fontFamily: "'Trebuchet MS', Arial, Helvetica, sans-serif"
      }
    }
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: '#FFFFFF',
        color: digiLocalColors.primary.main,
        boxShadow: '0 2px 20px rgba(0, 73, 144, 0.08)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${alpha('#004990', 0.08)}`
      }
    }
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        textTransform: 'none' as const,
        fontWeight: 600,
        padding: '12px 32px',
        fontSize: '0.875rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        letterSpacing: '0.5px'
      },
      contained: {
        boxShadow: '0 4px 12px rgba(0, 73, 144, 0.25)',
        background: 'linear-gradient(45deg, #004990 30%, #0079C1 90%)',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0, 73, 144, 0.35)',
          transform: 'translateY(-2px)'
        },
        '&:active': {
          transform: 'translateY(0px)'
        }
      },
      outlined: {
        borderWidth: 2,
        borderRadius: 12,
        '&:hover': {
          borderWidth: 2,
          backgroundColor: alpha('#004990', 0.08),
          transform: 'translateY(-1px)'
        }
      },
      text: {
        '&:hover': {
          backgroundColor: alpha('#004990', 0.06)
        }
      }
    }
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0, 73, 144, 0.08)',
        border: `1px solid ${alpha('#004990', 0.08)}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 12px 40px rgba(0, 73, 144, 0.15)',
          transform: 'translateY(-4px)',
          borderColor: alpha('#004990', 0.12)
        }
      }
    }
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 12,
          backgroundColor: alpha('#004990', 0.02),
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: alpha('#004990', 0.04),
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: digiLocalColors.primary.main,
              borderWidth: 2
            }
          },
          '&.Mui-focused': {
            backgroundColor: alpha('#004990', 0.06),
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: digiLocalColors.primary.main,
              borderWidth: 2
            }
          }
        }
      }
    }
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 20,
        fontWeight: 600,
        fontSize: '0.75rem',
        letterSpacing: '0.5px',
        height: 28,
        transition: 'all 0.2s ease'
      },
      filled: {
        '&:hover': {
          transform: 'scale(1.05)'
        }
      }
    }
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        backgroundImage: 'none'
      },
      elevation1: {
        boxShadow: '0 4px 12px rgba(0, 73, 144, 0.08)'
      },
      elevation2: {
        boxShadow: '0 8px 24px rgba(0, 73, 144, 0.12)'
      },
      elevation3: {
        boxShadow: '0 12px 32px rgba(0, 73, 144, 0.16)'
      }
    }
  },
  MuiTypography: {
    styleOverrides: {
      h1: {
        background: 'linear-gradient(45deg, #004990 30%, #0079C1 90%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.5px'
      },
      h3: {
        fontWeight: 600
      }
    }
  }
} as const;

// Breakpoints responsive conform PDF
const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536
  }
};

// Spacing consistent
const spacing = 8;

// Configurația completă a temei DigiLocal cu îmbunătățiri moderne
const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    ...digiLocalColors
  },
  typography,
  components,
  breakpoints,
  spacing,
  shadows: modernShadows as any,
  shape: {
    borderRadius: 12
  },
  transitions: {
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
    },
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195
    }
  }
};

// Crearea temei principale
export const digiLocalTheme = createTheme(themeOptions);

// Varianta dark (opțională pentru admin panel)
export const digiLocalDarkTheme = createTheme({
  ...themeOptions,
  palette: {
    mode: 'dark',
    ...digiLocalColors,
    background: {
      default: '#121212',
      paper: '#1E1E1E'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#AAAAAA'
    }
  }
});

// Utilități pentru acces rapid la culorile DigiLocal
export const colors = digiLocalColors;

// Hook pentru folosirea culorilor în componente
export const useDigiLocalColors = () => digiLocalColors;

export default digiLocalTheme;