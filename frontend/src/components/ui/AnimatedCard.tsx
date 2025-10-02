/**
 * Componentă de card animat pentru interfața modernă
 * Respectă standardele DigiLocal cu îmbunătățiri UX
 */
import React from 'react';
import { Card, CardProps, alpha } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Animații pentru card
const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-4px);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
`;

interface AnimatedCardProps extends CardProps {
  customVariant?: 'default' | 'hover-float' | 'hover-lift' | 'shimmer' | 'pulse';
  glowColor?: string;
  borderGradient?: boolean;
}

const StyledAnimatedCard = styled(Card, {
  shouldForwardProp: (prop) => 
    !['customVariant', 'glowColor', 'borderGradient'].includes(prop as string)
})<AnimatedCardProps>(({ theme, customVariant = 'default', glowColor, borderGradient }) => ({
  borderRadius: 16,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
  background: borderGradient 
    ? `linear-gradient(145deg, #ffffff, ${alpha('#ffffff', 0.95)})`
    : '#ffffff',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Border gradient effect
  ...(borderGradient && {
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 16,
      padding: '1px',
      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      maskComposite: 'subtract',
      opacity: 0,
      transition: 'opacity 0.3s ease',
      zIndex: 1
    }
  }),

  // Variante de animație
  ...(customVariant === 'hover-float' && {
    '&:hover': {
      animation: `${float} 2s ease-in-out infinite`,
      boxShadow: `0 12px 32px ${alpha(glowColor || theme.palette.primary.main, 0.15)}`,
      ...(borderGradient && {
        '&::before': {
          opacity: 1
        }
      })
    }
  }),

  ...(customVariant === 'hover-lift' && {
    '&:hover': {
      transform: 'translateY(-8px) scale(1.02)',
      boxShadow: `0 20px 40px ${alpha(glowColor || theme.palette.primary.main, 0.2)}`,
      borderColor: alpha(theme.palette.primary.main, 0.2),
      ...(borderGradient && {
        '&::before': {
          opacity: 1
        }
      })
    }
  }),

  ...(customVariant === 'shimmer' && {
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(
        90deg,
        transparent,
        ${alpha('#ffffff', 0.4)},
        transparent
      )`,
      backgroundSize: '200px 100%',
      animation: `${shimmer} 2s infinite`,
      pointerEvents: 'none'
    },
    '&:hover::after': {
      animationDuration: '1s'
    }
  }),

  ...(customVariant === 'pulse' && {
    '&:hover': {
      animation: `${pulse} 1.5s ease-in-out infinite`,
      boxShadow: `0 0 20px ${alpha(glowColor || theme.palette.primary.main, 0.3)}`
    }
  }),

  // Efect de glow la hover pentru toate variantele
  '&:hover': {
    ...(glowColor && {
      boxShadow: `0 8px 32px ${alpha(glowColor, 0.15)}, 0 0 0 1px ${alpha(glowColor, 0.1)}`
    })
  }
}));

const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  customVariant = 'default', 
  glowColor,
  borderGradient = false,
  ...props 
}) => {
  return (
    <StyledAnimatedCard
      customVariant={customVariant}
      glowColor={glowColor}
      borderGradient={borderGradient}
      {...props}
    >
      {children}
    </StyledAnimatedCard>
  );
};

export default AnimatedCard;