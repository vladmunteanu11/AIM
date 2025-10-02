/**
 * Serviciu pentru managementul notificărilor email
 */

import { apiService } from './api';

// Tipuri pentru notificări
export interface EmailConfiguration {
  smtp_configured: boolean;
  credentials_configured: boolean;
  admin_emails_configured: boolean;
  municipality_info_configured: boolean;
  errors: string[];
  warnings?: string[];
}

export interface EmailStats {
  total_sent: number;
  total_failed: number;
  sent_today: number;
  sent_this_week: number;
  sent_this_month: number;
  success_rate: number;
  recent_emails: Array<{
    to: string;
    subject: string;
    status: 'sent' | 'failed';
    timestamp: string;
    error?: string;
  }>;
}

export interface TestEmailRequest {
  email: string;
  subject?: string;
  message?: string;
}

export interface SMTPConfig {
  smtp_server?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_use_tls?: boolean;
  default_from_email?: string;
  default_from_name?: string;
  admin_emails?: string[];
  forms_email?: string;
  appointments_email?: string;
}

class NotificationsService {
  private readonly baseUrl = '/api/v1/notifications';

  /**
   * Construiește URL cu parametri
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = `${this.baseUrl}${endpoint}`;
    if (!params) return url;
    
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    
    const paramString = searchParams.toString();
    return paramString ? `${url}?${paramString}` : url;
  }

  // === CONFIGURARE ===

  /**
   * Testează configurația email
   */
  async testConfiguration(): Promise<EmailConfiguration> {
    return await apiService.get(`${this.baseUrl}/config/test`);
  }

  /**
   * Obține configurația SMTP actuală
   */
  async getSMTPConfig(): Promise<SMTPConfig> {
    return await apiService.get(`${this.baseUrl}/config/smtp`);
  }

  /**
   * Actualizează configurația SMTP
   */
  async updateSMTPConfig(config: SMTPConfig): Promise<{ message: string }> {
    return await apiService.put(`${this.baseUrl}/config/smtp`, config);
  }

  /**
   * Testează conexiunea SMTP cu noile setări
   */
  async testSMTPConnection(config: SMTPConfig): Promise<{
    success: boolean;
    message: string;
    details?: string;
  }> {
    return await apiService.post(`${this.baseUrl}/config/smtp/test`, config);
  }

  // === TRIMITERE EMAIL-URI ===

  /**
   * Trimite email de test
   */
  async sendTestEmail(request: TestEmailRequest): Promise<{
    success: boolean;
    message: string;
    details?: string;
  }> {
    return await apiService.post(`${this.baseUrl}/test/send`, request);
  }

  // === STATISTICI ===

  /**
   * Obține statistici despre email-uri
   */
  async getEmailStats(): Promise<EmailStats> {
    return await apiService.get(`${this.baseUrl}/stats`);
  }

  /**
   * Obține statistici detaliate pentru o perioadă
   */
  async getDetailedStats(period: {
    start_date?: string;
    end_date?: string;
    group_by?: 'day' | 'week' | 'month';
  } = {}): Promise<{
    total_sent: number;
    total_failed: number;
    success_rate: number;
    statistics_by_period: Array<{
      period: string;
      sent: number;
      failed: number;
      success_rate: number;
    }>;
    statistics_by_type: Array<{
      type: string;
      sent: number;
      failed: number;
      success_rate: number;
    }>;
  }> {
    const url = this.buildUrl('/stats/detailed', period);
    return await apiService.get(url);
  }

  // === NOTIFICĂRI SISTEM ===

  /**
   * Obține setările de notificări
   */
  async getNotificationSettings(): Promise<{
    forms_notifications_enabled: boolean;
    appointments_notifications_enabled: boolean;
    reminders_enabled: boolean;
    admin_notifications_enabled: boolean;
    citizen_notifications_enabled: boolean;
  }> {
    return await apiService.get(`${this.baseUrl}/settings`);
  }

  /**
   * Actualizează setările de notificări
   */
  async updateNotificationSettings(settings: {
    forms_notifications_enabled?: boolean;
    appointments_notifications_enabled?: boolean;
    reminders_enabled?: boolean;
    admin_notifications_enabled?: boolean;
    citizen_notifications_enabled?: boolean;
  }): Promise<{ message: string }> {
    return await apiService.put(`${this.baseUrl}/settings`, settings);
  }

  // === UTILITĂȚI ===

  /**
   * Validează o adresă de email
   */
  async validateEmail(email: string): Promise<{
    is_valid: boolean;
    message: string;
  }> {
    return await apiService.post(`${this.baseUrl}/validate/email`, { email });
  }
}

// Export singleton
export const notificationsService = new NotificationsService();
export default notificationsService;