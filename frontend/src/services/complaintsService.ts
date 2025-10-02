/**
 * Serviciu pentru gestionarea sesizărilor și formularelor online
 */
import { apiService } from './api';

// Tipuri pentru sesizări
export interface ComplaintCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  requires_location: boolean;
  requires_photos: boolean;
  responsible_department?: string;
  response_time_hours: number;
  resolution_time_days: number;
  sort_order: number;
  is_active: boolean;
}

export interface Complaint {
  id: string;
  category_id: number;
  title: string;
  description: string;
  citizen_name: string;
  citizen_email?: string;
  citizen_phone?: string;
  citizen_address?: string;
  is_anonymous: boolean;
  location_address?: string;
  location_details?: string;
  urgency_level: 'low' | 'normal' | 'high' | 'critical';
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
  reference_number: string;
  submitted_at: string;
  acknowledged_at?: string;
  started_at?: string;
  resolved_at?: string;
  admin_notes?: string;
  consent_given: boolean;
  attached_photos?: string[];
  attached_documents?: string[];
}

export interface ComplaintCreate {
  category_id: number;
  title: string;
  description: string;
  citizen_name: string;
  citizen_email?: string;
  citizen_phone?: string;
  citizen_address?: string;
  is_anonymous: boolean;
  location_address?: string;
  location_details?: string;
  urgency_level: 'low' | 'normal' | 'high' | 'critical';
  consent_given: boolean;
}

export interface ComplaintStatusUpdate {
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
  admin_notes?: string;
}

export interface ComplaintStats {
  total_complaints: number;
  submitted_this_week: number;
  status_breakdown: Record<string, number>;
  category_breakdown: Record<string, number>;
  average_resolution_days: number;
  pending_response: number;
  in_progress: number;
  resolved_this_month: number;
}

export interface ComplaintFilters {
  category_id?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

class ComplaintsService {
  private readonly baseUrl = '/api/v1/complaints';

  // Mock data pentru categorii
  private mockCategories: ComplaintCategory[] = [
    {
      id: 1,
      name: 'Infrastructură și Drumuri',
      slug: 'infrastructura-drumuri',
      description: 'Sesizări privind starea drumurilor, trotuarelor, poduri, etc.',
      requires_location: true,
      requires_photos: true,
      responsible_department: 'Direcția Tehnică',
      response_time_hours: 24,
      resolution_time_days: 30,
      sort_order: 1,
      is_active: true
    },
    {
      id: 2,
      name: 'Spații Verzi și Curățenie',
      slug: 'spatii-verzi-curatenie',
      description: 'Probleme legate de parcuri, zone verzi, curățenia stradală',
      requires_location: true,
      requires_photos: false,
      responsible_department: 'Serviciul Spații Verzi',
      response_time_hours: 48,
      resolution_time_days: 15,
      sort_order: 2,
      is_active: true
    },
    {
      id: 3,
      name: 'Utilități Publice',
      slug: 'utilitati-publice',
      description: 'Apă, canalizare, iluminat public, energie electrică',
      requires_location: true,
      requires_photos: true,
      responsible_department: 'Serviciul Utilități',
      response_time_hours: 12,
      resolution_time_days: 7,
      sort_order: 3,
      is_active: true
    },
    {
      id: 4,
      name: 'Transport Public',
      slug: 'transport-public',
      description: 'Sesizări privind transportul în comun',
      requires_location: false,
      requires_photos: false,
      responsible_department: 'Serviciul Transport',
      response_time_hours: 72,
      resolution_time_days: 30,
      sort_order: 4,
      is_active: true
    },
    {
      id: 5,
      name: 'Servicii Publice',
      slug: 'servicii-publice',
      description: 'Probleme cu serviciile administrative',
      requires_location: false,
      requires_photos: false,
      responsible_department: 'Relații cu Publicul',
      response_time_hours: 24,
      resolution_time_days: 10,
      sort_order: 5,
      is_active: true
    },
    {
      id: 6,
      name: 'Altele',
      slug: 'altele',
      description: 'Alte tipuri de sesizări',
      requires_location: false,
      requires_photos: false,
      responsible_department: 'Secretariat',
      response_time_hours: 48,
      resolution_time_days: 20,
      sort_order: 6,
      is_active: true
    }
  ];

  // Categorii de sesizări
  async getCategories(): Promise<ComplaintCategory[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockCategories;
  }

  async getCategory(categoryId: number): Promise<ComplaintCategory> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    const category = this.mockCategories.find(c => c.id === categoryId);
    if (!category) {
      throw new Error('Categoria nu a fost găsită');
    }
    return category;
  }

  // Sesizări
  async getComplaints(filters?: ComplaintFilters): Promise<Complaint[]> {
    const params = new URLSearchParams();
    
    if (filters?.category_id) {
      params.append('category_id', filters.category_id.toString());
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.offset) {
      params.append('offset', filters.offset.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    return apiService.get<Complaint[]>(url);
  }

  async getComplaint(complaintId: string): Promise<Complaint> {
    return apiService.get<Complaint>(`${this.baseUrl}/${complaintId}`);
  }

  async getComplaintByReference(referenceNumber: string): Promise<Complaint> {
    return apiService.get<Complaint>(`${this.baseUrl}/reference/${referenceNumber}`);
  }

  async createComplaint(complaintData: ComplaintCreate): Promise<Complaint> {
    return apiService.post<Complaint>(this.baseUrl, complaintData);
  }

  async updateComplaintStatus(
    complaintId: string, 
    statusUpdate: ComplaintStatusUpdate
  ): Promise<Complaint> {
    return apiService.put<Complaint>(`${this.baseUrl}/${complaintId}/status`, statusUpdate);
  }

  // Statistici
  async getStats(): Promise<ComplaintStats> {
    return apiService.get<ComplaintStats>(`${this.baseUrl}/stats`);
  }

  // Upload fotografii
  async uploadPhotos(complaintId: string, files: File[]): Promise<{ message: string; uploaded_files: string[] }> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });

    // Use the uploadFile method for single file or direct axios call for multiple
    return apiService.post(`${this.baseUrl}/${complaintId}/photos`, formData);
  }

  // Căutare sesizare după numărul de referință
  async searchByReference(referenceNumber: string): Promise<Complaint | null> {
    try {
      return await this.getComplaintByReference(referenceNumber);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Validare număr de telefon românesc
  validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^(\+40|0040|0)[7][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s|-|\./g, ''));
  }

  // Validare email
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Formatare status pentru afișare
  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'submitted': 'Înregistrată',
      'acknowledged': 'Confirmată',
      'in_progress': 'În lucru',
      'resolved': 'Rezolvată',
      'closed': 'Închisă'
    };
    return statusMap[status] || status;
  }

  // Formatare nivel urgență
  formatUrgencyLevel(level: string): string {
    const urgencyMap: Record<string, string> = {
      'low': 'Scăzută',
      'normal': 'Normală',
      'high': 'Ridicată',
      'critical': 'Critică'
    };
    return urgencyMap[level] || level;
  }

  // Culoarea pentru status
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'submitted': '#f57c00', // orange
      'acknowledged': '#1976d2', // blue
      'in_progress': '#7b1fa2', // purple
      'resolved': '#388e3c', // green
      'closed': '#616161' // grey
    };
    return colorMap[status] || '#616161';
  }

  // Culoarea pentru urgență
  getUrgencyColor(level: string): string {
    const colorMap: Record<string, string> = {
      'low': '#4caf50', // green
      'normal': '#ff9800', // orange
      'high': '#f44336', // red
      'critical': '#d32f2f' // dark red
    };
    return colorMap[level] || '#ff9800';
  }

  // Calculare timpii de răspuns
  calculateResponseTime(complaint: Complaint, category: ComplaintCategory): {
    isOverdue: boolean;
    hoursRemaining: number;
    daysToResolution: number;
  } {
    const submittedAt = new Date(complaint.submitted_at);
    const now = new Date();
    
    // Timp răspuns
    const responseDeadline = new Date(submittedAt.getTime() + category.response_time_hours * 60 * 60 * 1000);
    const hoursRemaining = Math.max(0, Math.floor((responseDeadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
    const isOverdue = complaint.status === 'submitted' && now > responseDeadline;
    
    // Timp rezolvare
    const resolutionDeadline = new Date(submittedAt.getTime() + category.resolution_time_days * 24 * 60 * 60 * 1000);
    const daysToResolution = Math.max(0, Math.floor((resolutionDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    return {
      isOverdue,
      hoursRemaining,
      daysToResolution
    };
  }

  // ============================================================================
  // METODE PENTRU ADMINISTRAREA SESIZĂRILOR (ADMIN PANEL)
  // ============================================================================

  /**
   * Obține sesizări pentru panoul admin cu paginare și filtrare avansată
   */
  async getAdminComplaints(params?: {
    status?: string;
    category?: string;
    page?: number;
    size?: number;
  }): Promise<{
    complaints: any[];
    total: number;
    page: number;
    size: number;
    total_pages: number;
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.status && params.status !== 'toate') {
      queryParams.append('status', params.status);
    }
    if (params?.category && params.category !== 'toate') {
      queryParams.append('category', params.category);
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.size) {
      queryParams.append('size', params.size.toString());
    }

    const url = `/api/v1/admin/complaints${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get(url);
  }

  /**
   * Obține detaliile unei sesizări pentru admin
   */
  async getAdminComplaintDetails(complaintId: string): Promise<any> {
    return apiService.get(`/api/v1/admin/complaints/${complaintId}`);
  }

  /**
   * Actualizează o sesizare din panoul admin
   */
  async updateAdminComplaint(complaintId: string, updates: any): Promise<any> {
    return apiService.put(`/api/v1/admin/complaints/${complaintId}`, updates);
  }

  /**
   * Atribuie o sesizare unei echipe/persoane
   */
  async assignComplaint(complaintId: string, assignedTo: string): Promise<any> {
    return apiService.post(`/api/v1/admin/complaints/${complaintId}/assign`, {
      assigned_to: assignedTo
    });
  }

  /**
   * Adaugă un răspuns oficial la o sesizare
   */
  async respondToComplaint(complaintId: string, response: string): Promise<any> {
    return apiService.post(`/api/v1/admin/complaints/${complaintId}/respond`, {
      response: response
    });
  }

  /**
   * Obține statistici pentru dashboard admin
   */
  async getAdminStats(): Promise<any> {
    return apiService.get('/api/v1/admin/complaints/stats');
  }

  /**
   * Actualizează rapid statusul unei sesizări
   */
  async updateComplaintStatusQuick(complaintId: string, status: string): Promise<any> {
    return this.updateAdminComplaint(complaintId, { status });
  }

  /**
   * Actualizează rapid prioritatea unei sesizări
   */
  async updateComplaintPriorityQuick(complaintId: string, priority: string): Promise<any> {
    return this.updateAdminComplaint(complaintId, { priority });
  }
}

export const complaintsService = new ComplaintsService();