// API Service pentru Template Primărie Digitală
import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Request interceptor pentru autentificare
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor pentru gestionarea erorilor și refresh automat
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Încearcă să reîmprospăteze token-ul
            const refreshToken = localStorage.getItem('auth_refresh_token');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
                refresh_token: refreshToken
              }, {
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              
              const { access_token, expires_in } = response.data;
              localStorage.setItem('auth_token', access_token);
              
              const expirationTime = Date.now() + (expires_in * 1000);
              localStorage.setItem('auth_token_expires', expirationTime.toString());
              
              // Reîncearcă cererea originală cu noul token
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh a eșuat, logout
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_refresh_token');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_token_expires');
            window.location.href = '/admin/login';
            return Promise.reject(refreshError);
          }
        }
        
        if (error.response?.status === 401) {
          // Token refresh a eșuat sau nu e disponibil, logout
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_refresh_token');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_token_expires');
          window.location.href = '/admin/login';
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Metode HTTP generice
  async get<T>(url: string): Promise<T> {
    const response = await this.api.get<T>(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete<T>(url);
    return response.data;
  }

  // Upload fișiere
  async uploadFile(url: string, file: File, onProgress?: (progress: number) => void): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }
}

export const apiService = new ApiService();