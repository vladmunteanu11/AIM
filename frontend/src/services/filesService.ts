/**
 * Serviciu pentru managementul fișierelor și documentelor
 */

import { apiService } from './api';

// Tipuri pentru documentele și fișierele
export interface DocumentCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
  created_at: string;
}

export interface Document {
  id: number;
  title: string;
  description?: string;
  category_id?: number;
  tags: string[];
  is_public: boolean;
  requires_auth: boolean;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  download_count: number;
  version: string;
  language: string;
  uploaded_by?: string;
  uploaded_at: string;
  updated_at: string;
  file_size_formatted: string;
  category?: DocumentCategory;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface DocumentStats {
  total_documents: number;
  public_documents: number;
  private_documents: number;
  total_size: number;
  total_size_formatted: string;
  total_downloads: number;
  categories_count: number;
  popular_documents: Document[];
}

export interface StorageStats {
  total_size: number;
  total_size_formatted: string;
  files_count: number;
  categories: Record<string, number>;
  largest_files: Array<{
    path: string;
    size: number;
    size_formatted: string;
  }>;
  file_types: Record<string, number>;
}

export interface DocumentFilters {
  category_id?: number;
  is_public?: boolean;
  search_term?: string;
  file_type?: string;
  page?: number;
  per_page?: number;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
}

export interface CreateDocumentRequest {
  title: string;
  description?: string;
  category_id?: number;
  tags?: string[];
  is_public?: boolean;
  requires_auth?: boolean;
  language?: string;
  version?: string;
}

export interface FileUploadResponse {
  success: boolean;
  file_path: string;
  file_name: string;
  file_size: number;
  file_size_formatted: string;
  file_type: string;
  upload_id: string;
  thumbnail_path?: string;
  message: string;
}

class FilesService {
  private readonly baseUrl = '/api/v1/files';

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

  // === CATEGORII ===

  /**
   * Obține toate categoriile
   */
  async getCategories(includeInactive = false): Promise<DocumentCategory[]> {
    const url = this.buildUrl('/categories', { include_inactive: includeInactive });
    return await apiService.get(url);
  }

  /**
   * Obține o categorie după ID
   */
  async getCategory(categoryId: number): Promise<DocumentCategory> {
    return await apiService.get(`${this.baseUrl}/categories/${categoryId}`);
  }

  /**
   * Creează o categorie nouă
   */
  async createCategory(categoryData: CreateCategoryRequest): Promise<DocumentCategory> {
    return await apiService.post(`${this.baseUrl}/categories`, categoryData);
  }

  /**
   * Șterge o categorie
   */
  async deleteCategory(categoryId: number, force = false): Promise<void> {
    const url = this.buildUrl(`/categories/${categoryId}`, { force });
    await apiService.delete(url);
  }

  // === DOCUMENTE ===

  /**
   * Obține lista documentelor cu filtrare
   */
  async getDocuments(filters: DocumentFilters = {}): Promise<DocumentListResponse> {
    const url = this.buildUrl('/documents', filters);
    return await apiService.get(url);
  }

  /**
   * Obține un document după ID
   */
  async getDocument(documentId: number): Promise<Document> {
    return await apiService.get(`${this.baseUrl}/documents/${documentId}`);
  }

  /**
   * Descarcă un document
   */
  async downloadDocument(documentId: number): Promise<Blob> {
    // Pentru download-uri de fișiere, trebuie să folosim axios direct
    const response = await fetch(`${this.baseUrl}/documents/${documentId}/download`);
    return await response.blob();
  }

  /**
   * Obține URL-ul pentru descărcarea unui document
   */
  getDownloadUrl(documentId: number): string {
    return `${this.baseUrl}/documents/${documentId}/download`;
  }

  /**
   * Căutare rapidă în documente
   */
  async searchDocuments(query: string, options: {
    category_id?: number;
    file_type?: string;
    limit?: number;
  } = {}): Promise<{
    query: string;
    results: number;
    documents: Document[];
  }> {
    const url = this.buildUrl('/documents/search', { q: query, ...options });
    return await apiService.get(url);
  }

  /**
   * Șterge un document
   */
  async deleteDocument(documentId: number): Promise<void> {
    await apiService.delete(`${this.baseUrl}/documents/${documentId}`);
  }

  // === UPLOAD FIȘIERE ===

  /**
   * Upload un singur fișier
   */
  async uploadFile(file: File, options: {
    subfolder?: string;
    generate_thumbnail?: boolean;
  } = {}): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.subfolder) {
      formData.append('subfolder', options.subfolder);
    }
    
    if (options.generate_thumbnail !== undefined) {
      formData.append('generate_thumbnail', options.generate_thumbnail.toString());
    }

    // Folosim fetch pentru FormData cu multipart
    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // === STATISTICI ===

  /**
   * Obține statistici despre documente
   */
  async getDocumentStats(): Promise<DocumentStats> {
    return await apiService.get(`${this.baseUrl}/stats`);
  }

  /**
   * Obține statistici despre spațiul de stocare
   */
  async getStorageStats(): Promise<StorageStats> {
    return await apiService.get(`${this.baseUrl}/storage-stats`);
  }

  // === ADMINISTRARE ===

  /**
   * Curăță fișierele orfane
   */
  async cleanupOrphanedFiles(): Promise<{
    total_files: number;
    orphaned_files: number;
    deleted_files: number;
    errors: number;
  }> {
    return await apiService.post(`${this.baseUrl}/cleanup`);
  }
}

// Export singleton
export const filesService = new FilesService();
export default filesService;