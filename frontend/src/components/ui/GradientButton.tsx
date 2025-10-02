/**
 * Buton cu gradient modern pentru Template Primărie Digitală
 * Respectă culorile DigiLocal PANTONE cu efecte moderne
 */
import React from 'react';
import { Button, ButtonProps, alpha } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Animații pentru buton
const ripple = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`;

const glow = keyframes`
  0%, 100% {
    box-shadow: 0 4px 12px rgba(0, 73, 144, 0.25);
  }
  50% {
    box-shadow: 0 8px 24px rgba(0, 73, 144, 0.4);
  }
`;

const slideIn = keyframes`
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 100% 0;
  }
`;

interface GradientButtonProps extends ButtonProps {
  gradient?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'custom';
  customColors?: [string, string];
  animation?: 'none' | 'glow' | 'slide' | 'ripple';
  glowIntensity?: 'low' | 'medium' | 'high';
  component?: React.ElementType;
  to?: string;
}

const StyledGradientButton = styled(Button, {
  shouldForwardProp: (prop) => 
    !['gradient', 'customColors', 'animation', 'glowIntensity'].includes(prop as string)
})<GradientButtonProps>(({ 
  theme, 
  gradient = 'primary',
  customColors,
  animation = 'none',
  glowIntensity = 'medium'
}) => {
  // Definirea gradienților pentru fiecare variantă
  const primaryGradient = `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`;
  const gradients = {
    primary: primaryGradient,
    secondary: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.info.main} 90%)`,
    success: `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.success.light} 90%)`,
    warning: `linear-gradient(45deg, ${theme.palette.warning.main} 30%, ${theme.palette.warning.light} 90%)`,
    error: `linear-gradient(45deg, ${theme.palette.error.main} 30%, ${theme.palette.error.light} 90%)`,
    custom: customColors ? `linear-gradient(45deg, ${customColors[0]} 30%, ${customColors[1]} 90%)` : primaryGradient
  };

  // Intensitatea glow-ului
  const glowIntensities = {
    low: '0.15',
    medium: '0.25',
    high: '0.35'
  };

  const baseGlowColor = gradient === 'primary' ? '0, 73, 144' : 
                       gradient === 'secondary' ? '0, 121, 193' :
                       gradient === 'success' ? '46, 125, 50' :
                       gradient === 'warning' ? '245, 124, 0' :
                       gradient === 'error' ? '211, 47, 47' : '0, 73, 144';

  return {
    borderRadius: 12,
    padding: theme.spacing(1.5, 4),
    fontWeight: 600,
    fontSize: '0.875rem',
    textTransform: 'none',
    letterSpacing: '0.5px',
    position: 'relative',
    overflow: 'hidden',
    background: gradients[gradient],
    border: 'none',
    color: '#ffffff',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: `0 4px 12px rgba(${baseGlowColor}, ${glowIntensities[glowIntensity]})`,

    // Efect de ripple la click
    ...(animation === 'ripple' && {
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '0',
        height: '0',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.5)',
        transform: 'translate(-50%, -50%)',
        transition: 'width 0.6s, height 0.6s'
      },
      '&:active::before': {
        width: '300px',
        height: '300px',
        transition: '0s'
      }
    }),

    // Animația de glow
    ...(animation === 'glow' && {
      '&:hover': {
        animation: `${glow} 1.5s ease-in-out infinite`
      }
    }),

    // Animația de slide
    ...(animation === 'slide' && {
      backgroundSize: '200% 100%',
      '&:hover': {
        animation: `${slideIn} 0.8s ease-in-out`
      }
    }),

    // Hover effects generale
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 24px rgba(${baseGlowColor}, ${parseFloat(glowIntensities[glowIntensity]) + 0.1})`,
      filter: 'brightness(1.1)'
    },

    '&:active': {
      transform: 'translateY(0px)',
      transition: 'transform 0.1s ease'
    },

    // Disabled state
    '&.Mui-disabled': {
      background: alpha(theme.palette.action.disabled, 0.12),
      color: alpha(theme.palette.action.disabled, 0.26),
      boxShadow: 'none',
      transform: 'none'
    },

    // Size variants
    '&.MuiButton-sizeSmall': {
      padding: theme.spacing(1, 2.5),
      fontSize: '0.8125rem',
      borderRadius: 10
    },

    '&.MuiButton-sizeLarge': {
      padding: theme.spacing(2, 5),
      fontSize: '0.9375rem',
      borderRadius: 14
    }
  };
});

const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  gradient = 'primary',
  customColors,
  animation = 'none',
  glowIntensity = 'medium',
  ...props
}) => {
  return (
    <StyledGradientButton
      gradient={gradient}
      customColors={customColors}
      animation={animation}
      glowIntensity={glowIntensity}
      {...props}
    >
      {children}
    </StyledGradientButton>
  );
};

export default GradientButton;