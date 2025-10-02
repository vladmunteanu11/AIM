/**
 * Serviciu pentru gestionarea programărilor în panoul admin
 */
import { apiService } from './api';

export interface Appointment {
  id: string;
  citizen_name: string;
  citizen_email: string;
  citizen_phone: string;
  citizen_address?: string;
  department: string;
  service: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  required_documents?: string[];
  submitted_documents?: string[];
  created_at: string;
  updated_at: string;
  assigned_officer?: string;
}

export interface AppointmentsResponse {
  appointments: Appointment[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface AppointmentStats {
  total_appointments: number;
  pending_appointments: number;
  confirmed_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  today_appointments: number;
  tomorrow_appointments: number;
  this_week_appointments: number;
  appointments_by_department: { [key: string]: number };
  appointments_by_status: { [key: string]: number };
  average_waiting_time_days: number;
  completion_rate: number;
  no_show_rate: number;
}

export interface UpdateAppointmentRequest {
  status?: string;
  notes?: string;
  assigned_officer?: string;
}

export interface CalendarData {
  year: number;
  month: number;
  appointments: { [date: string]: CalendarAppointment[] };
}

export interface CalendarAppointment {
  id: string;
  time: string;
  citizen_name: string;
  department: string;
  service: string;
  status: string;
}

class AppointmentsService {
  /**
   * Obține lista programărilor cu filtrare și paginare
   */
  async getAppointments(params?: {
    status?: string;
    department?: string;
    date?: string;
    page?: number;
    size?: number;
  }): Promise<AppointmentsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.status && params.status !== 'toate') {
      queryParams.append('status', params.status);
    }
    if (params?.department && params.department !== 'toate') {
      queryParams.append('department', params.department);
    }
    if (params?.date) {
      queryParams.append('date', params.date);
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.size) {
      queryParams.append('size', params.size.toString());
    }

    const url = `/api/v1/admin/appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get<AppointmentsResponse>(url);
  }

  /**
   * Obține detaliile unei programări
   */
  async getAppointmentDetails(appointmentId: string): Promise<Appointment> {
    return apiService.get<Appointment>(`/api/v1/admin/appointments/${appointmentId}`);
  }

  /**
   * Actualizează o programare
   */
  async updateAppointment(appointmentId: string, updates: UpdateAppointmentRequest): Promise<any> {
    return apiService.put(`/api/v1/admin/appointments/${appointmentId}`, updates);
  }

  /**
   * Confirmă o programare
   */
  async confirmAppointment(appointmentId: string, notes?: string): Promise<any> {
    return apiService.post(`/api/v1/admin/appointments/${appointmentId}/confirm`, {
      notes: notes || ''
    });
  }

  /**
   * Anulează o programare
   */
  async cancelAppointment(appointmentId: string, reason: string): Promise<any> {
    return apiService.post(`/api/v1/admin/appointments/${appointmentId}/cancel`, {
      reason: reason
    });
  }

  /**
   * Marchează o programare ca finalizată
   */
  async completeAppointment(appointmentId: string, completionNotes?: string): Promise<any> {
    return apiService.post(`/api/v1/admin/appointments/${appointmentId}/complete`, {
      completion_notes: completionNotes || ''
    });
  }

  /**
   * Obține statistici despre programări
   */
  async getAppointmentsStats(): Promise<AppointmentStats> {
    return apiService.get<AppointmentStats>('/api/v1/admin/appointments/stats');
  }

  /**
   * Obține programările pentru calendar
   */
  async getAppointmentsCalendar(year: number, month: number): Promise<CalendarData> {
    return apiService.get<CalendarData>(`/api/v1/admin/appointments/calendar?year=${year}&month=${month}`);
  }

  /**
   * Actualizează rapid statusul unei programări
   */
  async updateAppointmentStatus(appointmentId: string, status: Appointment['status']): Promise<any> {
    return this.updateAppointment(appointmentId, { status });
  }

  /**
   * Obține departamentele disponibile
   */
  getDepartments(): string[] {
    return [
      'Urbanism',
      'Taxe și Impozite',
      'Stare Civilă',
      'Juridic',
      'Asistență Socială',
      'Administrație',
      'IT'
    ];
  }

  /**
   * Obține statusurile disponibile pentru programări
   */
  getAppointmentStatuses(): { value: string; label: string; color: string }[] {
    return [
      { value: 'pending', label: 'În așteptare', color: 'warning' },
      { value: 'confirmed', label: 'Confirmată', color: 'info' },
      { value: 'completed', label: 'Finalizată', color: 'success' },
      { value: 'cancelled', label: 'Anulată', color: 'default' }
    ];
  }

  /**
   * Formatează data pentru afișare
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formatează ora pentru afișare
   */
  formatTime(timeString: string): string {
    return timeString.slice(0, 5); // HH:MM
  }

  /**
   * Verifică dacă o programare este în trecut
   */
  isAppointmentPast(appointment: Appointment): boolean {
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    return appointmentDateTime < new Date();
  }

  /**
   * Verifică dacă o programare este azi
   */
  isAppointmentToday(appointment: Appointment): boolean {
    const today = new Date().toISOString().split('T')[0];
    return appointment.appointment_date === today;
  }

  /**
   * Obține culoarea pentru status
   */
  getStatusColor(status: string): string {
    const statusColors = {
      pending: '#ff9800',
      confirmed: '#2196f3',
      completed: '#4caf50',
      cancelled: '#9e9e9e'
    };
    return statusColors[status as keyof typeof statusColors] || '#9e9e9e';
  }
}

export const appointmentsService = new AppointmentsService();