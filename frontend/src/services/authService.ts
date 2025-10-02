/**
 * Serviciu pentru autentificare și gestionarea sesiunilor admin
 */
import { apiService } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AdminUser;
  expires_in: number;
  refresh_expires_in: number;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_superuser: boolean;
  permissions: string[];
  department: string;
}

export interface AdminStats {
  total_complaints: number;
  pending_complaints: number;
  total_appointments: number;
  today_appointments: number;
  total_users: number;
  system_uptime: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private readonly USER_KEY = 'auth_user';
  private readonly TOKEN_EXPIRES_KEY = 'auth_token_expires';

  /**
   * Login admin
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';
      
      // Use URLSearchParams for OAuth2PasswordRequestForm (form data)
      const formData = new URLSearchParams();
      formData.append('username', email);  // OAuth2 expects 'username' not 'email'
      formData.append('password', password);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(errorData.detail || `Login failed with status ${response.status}`);
      }
      
      const data = await response.json();

      // Salvează token-urile și user în localStorage
      this.setToken(data.access_token);
      if (data.refresh_token) {
        this.setRefreshToken(data.refresh_token);
      }
      this.setTokenExpiration(data.expires_in);
      this.setUser(data.user);

      return data;
    } catch (error) {
      this.clearAuth();
      throw error;
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await apiService.post('/api/v1/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  /**
   * Obține utilizatorul curent
   */
  async getCurrentUser(): Promise<AdminUser> {
    try {
      return await apiService.get<AdminUser>('/api/v1/auth/me');
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.clearAuth();
        throw new Error('Session expired. Please log in again.');
      }
      throw error;
    }
  }

  /**
   * Verifică dacă utilizatorul este autentificat
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    
    if (!token) {
      return false;
    }

    // Dacă access token-ul este valid, returnează true
    if (!this.isTokenExpired(token)) {
      return true;
    }

    // Dacă access token-ul a expirat dar refresh token-ul este valid, returnează true
    // (refresh-ul va fi făcut automat la următoarea cerere API)
    if (refreshToken && !this.isTokenExpired(refreshToken)) {
      return true;
    }

    // Token-ul principal a expirat și nu avem refresh token valid
    this.clearAuth();
    return false;
  }

  /**
   * Verifică dacă utilizatorul este super admin
   */
  isSuperAdmin(): boolean {
    const user = this.getUser();
    return user?.is_superuser || false;
  }

  /**
   * Verifică dacă utilizatorul are o permisiune specifică
   */
  hasPermission(permission: string): boolean {
    const user = this.getUser();
    if (!user || !user.permissions) return false;

    // Verifică permisiuni wildcard (ex: "complaints.*")
    return user.permissions.some(p => {
      if (p.includes('*')) {
        const prefix = p.replace('*', '');
        return permission.startsWith(prefix);
      }
      return p === permission;
    });
  }

  /**
   * Refresh access token folosind refresh token
   */
  async refreshAccessToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearAuth();
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiService.post<RefreshResponse>('/api/v1/auth/refresh', {
        refresh_token: refreshToken
      });

      this.setToken(response.access_token);
      this.setTokenExpiration(response.expires_in);
    } catch (error: any) {
      this.clearAuth();
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error('Failed to refresh authentication token');
    }
  }

  /**
   * Obține token-ul curent
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obține refresh token-ul curent
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Obține utilizatorul curent din localStorage
   */
  getUser(): AdminUser | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Setează token-ul
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Setează refresh token-ul
   */
  private setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Setează expirarea token-ului
   */
  private setTokenExpiration(expiresIn: number): void {
    const expirationTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(this.TOKEN_EXPIRES_KEY, expirationTime.toString());
  }

  /**
   * Setează utilizatorul
   */
  private setUser(user: AdminUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Șterge datele de autentificare
   */
  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRES_KEY);
  }

  /**
   * Verifică dacă token-ul a expirat
   */
  private isTokenExpired(token: string): boolean {
    try {
      // Verifică dacă este token de development (mock)
      if (token.startsWith('dev-token-')) {
        // Pentru token-urile de development, verifică expirarea prin localStorage
        const expirationStr = localStorage.getItem(this.TOKEN_EXPIRES_KEY);
        if (!expirationStr) {
          return false; // Pentru dev tokens, dacă nu avem expirare, consideră valid
        }
        const expirationTime = parseInt(expirationStr);
        return Date.now() > expirationTime;
      }
      
      // Decodează JWT token pentru a verifica expirarea
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expTimestamp = payload.exp;
      const now = Date.now() / 1000;
      
      if (!expTimestamp) {
        return true;
      }
      
      return now > expTimestamp;
    } catch (error) {
      return true;
    }
  }

  /**
   * Obține statistici pentru dashboard
   */
  async getAdminStats(): Promise<AdminStats> {
    return apiService.get<AdminStats>('/api/v1/admin/stats');
  }

  /**
   * Obține lista utilizatorilor (doar super admin)
   */
  async getUsers(): Promise<AdminUser[]> {
    return apiService.get<AdminUser[]>('/api/v1/admin/users');
  }

  /**
   * Obține configurările site-ului (doar super admin)
   */
  async getSiteConfig(): Promise<any> {
    return apiService.get('/admin/site-config');
  }

  /**
   * Actualizează configurările site-ului (doar super admin)
   */
  async updateSiteConfig(config: any): Promise<any> {
    return apiService.put('/admin/site-config', config);
  }
}

export const authService = new AuthService();