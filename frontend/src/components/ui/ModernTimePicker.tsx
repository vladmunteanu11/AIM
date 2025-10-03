/**
 * Time Picker Component - Selector de ore simplu și intuitiv
 */
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  alpha,
  styled,
  useTheme
} from '@mui/material';
import {
  AccessTime,
  CheckCircle
} from '@mui/icons-material';

interface TimeSlot {
  time: string;
  is_available: boolean;
  display_time: string;
}

interface ModernTimePickerProps {
  timeSlots: TimeSlot[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  selectedDate: string;
}

const TimePickerContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0, 73, 144, 0.08)',
}));

const TimeButton = styled(Button, {
  shouldForwardProp: (prop) => !['isSelected'].includes(prop as string)
})<{ isSelected?: boolean }>(({ theme, isSelected }) => ({
  padding: theme.spacing(2),
  borderRadius: 12,
  fontSize: '1.1rem',
  fontWeight: 700,
  transition: 'all 0.2s ease',
  
  background: isSelected
    ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
    : alpha(theme.palette.primary.main, 0.05),
    
  color: isSelected ? '#ffffff' : theme.palette.primary.main,
  border: `2px solid ${isSelected ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.2)}`,
  
  '&:hover': {
    background: isSelected
      ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
      : alpha(theme.palette.primary.main, 0.15),
    border: `2px solid ${theme.palette.primary.main}`,
    transform: 'translateY(-2px)',
  },
  
  '&:disabled': {
    opacity: 0.4,
    cursor: 'not-allowed',
  }
}));

const ModernTimePicker: React.FC<ModernTimePickerProps> = ({ 
  timeSlots, 
  selectedTime, 
  onTimeSelect 
}) => {
  const theme = useTheme();

  return (
    <TimePickerContainer elevation={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AccessTime sx={{ fontSize: 32, color: theme.palette.primary.main }} />
        <Typography variant="h5" fontWeight={700} color="primary">
          Selectează Ora
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {timeSlots.map((slot) => {
          const isSelected = selectedTime === slot.time;
          const isAvailable = slot.is_available;

          return (
            <Grid item xs={6} sm={4} md={3} key={slot.time}>
              <TimeButton
                fullWidth
                isSelected={isSelected}
                disabled={!isAvailable}
                onClick={() => isAvailable && onTimeSelect(slot.time)}
                startIcon={isSelected ? <CheckCircle /> : <AccessTime />}
              >
                {slot.display_time}
              </TimeButton>
            </Grid>
          );
        })}
      </Grid>

      {selectedTime && (
        <Box 
          sx={{ 
            mt: 3, 
            p: 2.5, 
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.1)})`,
            border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <CheckCircle sx={{ fontSize: 32, color: theme.palette.success.main }} />
          <Box>
            <Typography variant="body1" fontWeight={700} color="primary">
              Ora selectată: {selectedTime}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Durata estimată: 30 minute
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip label="Disponibil" size="small" color="primary" variant="outlined" />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip label="Ocupat" size="small" disabled />
        </Box>
      </Box>
    </TimePickerContainer>
  );
};

export default ModernTimePicker;
