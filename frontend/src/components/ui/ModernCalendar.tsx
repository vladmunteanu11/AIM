/**
 * Calendar Component - Calendar de perete modern și elegant
 */
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  alpha,
  styled,
  useTheme,
  Divider
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CalendarToday,
  Circle
} from '@mui/icons-material';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths,
  subMonths,
  parseISO,
  isSameDay,
  getDay,
  startOfWeek,
  endOfWeek,
  isSameMonth
} from 'date-fns';
import { ro } from 'date-fns/locale';

interface AvailableDate {
  date: string;
  display_date: string;
  day_name: string;
  available_slots: number;
}

interface ModernCalendarProps {
  availableDates: AvailableDate[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
}

const CalendarContainer = styled(Paper)(({ theme }) => ({
  maxWidth: 380,
  margin: '0 auto',
  borderRadius: 20,
  overflow: 'hidden',
  boxShadow: '0 10px 40px rgba(0, 73, 144, 0.15)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const CalendarHeader = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  padding: theme.spacing(3),
  color: '#ffffff',
}));

const MonthNavigation = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
});

const CalendarBody = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 2, 3, 2),
  background: '#ffffff',
}));

const WeekDaysRow = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 4,
  marginBottom: 8,
});

const WeekDayCell = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(1, 0),
  fontSize: '0.75rem',
  fontWeight: 700,
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
}));

const DaysGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 4,
});

const DayCell = styled(Box, {
  shouldForwardProp: (prop) => !['isSelected', 'isAvailable', 'isToday', 'isCurrentMonth'].includes(prop as string)
})<{
  isSelected?: boolean;
  isAvailable?: boolean;
  isToday?: boolean;
  isCurrentMonth?: boolean;
}>(({ theme, isSelected, isAvailable, isToday, isCurrentMonth }) => ({
  aspectRatio: '1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  cursor: isAvailable ? 'pointer' : 'default',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  fontSize: '0.875rem',
  fontWeight: isSelected || isToday ? 700 : 500,
  
  background: isSelected
    ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
    : isToday
    ? alpha(theme.palette.primary.main, 0.1)
    : 'transparent',
  
  color: isSelected 
    ? '#ffffff' 
    : !isCurrentMonth
    ? theme.palette.text.disabled
    : isToday 
    ? theme.palette.primary.main
    : theme.palette.text.primary,
    
  opacity: !isCurrentMonth ? 0.4 : 1,
  
  border: isToday && !isSelected 
    ? `2px solid ${theme.palette.primary.main}`
    : 'none',
  
  '&:hover': isAvailable && isCurrentMonth ? {
    background: isSelected 
      ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
      : alpha(theme.palette.primary.main, 0.15),
    transform: 'scale(1.1)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
  } : {},
}));

const ModernCalendar: React.FC<ModernCalendarProps> = ({ 
  availableDates, 
  selectedDate, 
  onDateSelect 
}) => {
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const isDateAvailable = (date: Date) => {
    return availableDates.some(d => isSameDay(parseISO(d.date), date));
  };

  const handleDateClick = (date: Date) => {
    if (isDateAvailable(date) && isSameMonth(date, currentMonth)) {
      onDateSelect(format(date, 'yyyy-MM-dd'));
    }
  };

  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const today = new Date();

  return (
    <CalendarContainer elevation={3}>
      {/* Header cu gradient */}
      <CalendarHeader>
        <MonthNavigation>
          <IconButton 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            sx={{ 
              color: '#ffffff',
              '&:hover': { 
                background: alpha('#ffffff', 0.1),
                transform: 'scale(1.1)'
              }
            }}
            size="small"
          >
            <ChevronLeft />
          </IconButton>
          
          <Typography 
            variant="h6" 
            fontWeight={700}
            sx={{ 
              textTransform: 'capitalize',
              letterSpacing: '0.5px'
            }}
          >
            {format(currentMonth, 'MMMM yyyy', { locale: ro })}
          </Typography>
          
          <IconButton 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            sx={{ 
              color: '#ffffff',
              '&:hover': { 
                background: alpha('#ffffff', 0.1),
                transform: 'scale(1.1)'
              }
            }}
            size="small"
          >
            <ChevronRight />
          </IconButton>
        </MonthNavigation>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.9 }}>
          <CalendarToday sx={{ fontSize: 18 }} />
          <Typography variant="body2">
            Selectează data programării
          </Typography>
        </Box>
      </CalendarHeader>

      {/* Calendar body */}
      <CalendarBody>
        {/* Zilele săptămânii */}
        <WeekDaysRow>
          {weekDays.map((day, index) => (
            <WeekDayCell key={index}>
              {day}
            </WeekDayCell>
          ))}
        </WeekDaysRow>

        {/* Grid-ul cu zilele */}
        <DaysGrid>
          {allDays.map((date) => {
            const isCurrentMonthDay = isSameMonth(date, currentMonth);
            const isAvailable = isDateAvailable(date);
            const isSelected = selectedDate ? isSameDay(parseISO(selectedDate), date) : false;
            const isToday = isSameDay(date, today);

            return (
              <DayCell
                key={date.toString()}
                isSelected={isSelected}
                isAvailable={isAvailable && isCurrentMonthDay}
                isToday={isToday}
                isCurrentMonth={isCurrentMonthDay}
                onClick={() => handleDateClick(date)}
              >
                {format(date, 'd')}
                {isAvailable && isCurrentMonthDay && !isSelected && (
                  <Circle 
                    sx={{ 
                      position: 'absolute',
                      bottom: 4,
                      fontSize: 6,
                      color: theme.palette.success.main
                    }} 
                  />
                )}
              </DayCell>
            );
          })}
        </DaysGrid>

        {/* Legendă */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Circle sx={{ fontSize: 10, color: theme.palette.success.main }} />
            <Typography variant="caption" color="text.secondary">Disponibil</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box 
              sx={{ 
                width: 20, 
                height: 20, 
                borderRadius: '50%',
                border: `2px solid ${theme.palette.primary.main}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
                {format(today, 'd')}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">Astăzi</Typography>
          </Box>
        </Box>
      </CalendarBody>
    </CalendarContainer>
  );
};

export default ModernCalendar;
