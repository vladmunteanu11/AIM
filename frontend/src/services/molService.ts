/**
 * Serviciu pentru Monitorul Oficial Local (MOL)
 */

import { apiService } from './api';

// Tipuri pentru MOL
export interface MOLCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_required: boolean;
  section_order?: number;
  parent_id?: number;
  created_at: string;
}

export interface MOLDocument {
  id: number;
  category_id: number;
  title: string;
  document_number?: string;
  description?: string;
  content?: string;
  file_path?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  file_size_formatted?: string;
  adoption_date?: string;
  effective_date?: string;
  published_date: string;
  status: string;
  is_public: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  category?: MOLCategory;
  is_effective: boolean;
}

export interface MOLDocumentListResponse {
  documents: MOLDocument[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface MOLStats {
  total_documents: number;
  categories_count: number;
  published_this_month: number;
  published_this_year: number;
  categories_stats: Array<{
    category: string;
    count: number;
    latest_document?: string;
  }>;
  recent_documents: MOLDocument[];
}

class MOLService {
  private readonly baseUrl = '/api/v1/mol';

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

  // === CATEGORII MOL ===

  /**
   * Obține toate categoriile MOL
   */
  async getCategories(includeInactive = false): Promise<MOLCategory[]> {
    const url = this.buildUrl('/categories', { include_inactive: includeInactive });
    return await apiService.get(url);
  }

  /**
   * Obține categoriile obligatorii (required by law)
   */
  async getRequiredCategories(): Promise<MOLCategory[]> {
    return await apiService.get(`${this.baseUrl}/categories/required`);
  }

  /**
   * Obține o categorie după ID
   */
  async getCategory(categoryId: number): Promise<MOLCategory> {
    return await apiService.get(`${this.baseUrl}/categories/${categoryId}`);
  }

  // === DOCUMENTE MOL ===

  /**
   * Obține lista documentelor MOL cu filtrare
   */
  async getDocuments(filters: Record<string, any> = {}): Promise<MOLDocumentListResponse> {
    const url = this.buildUrl('/documents', filters);
    return await apiService.get(url);
  }

  /**
   * Obține documentele publice pentru afișare pe site
   */
  async getPublicDocuments(filters: Record<string, any> = {}): Promise<MOLDocumentListResponse> {
    const url = this.buildUrl('/documents/public', filters);
    return await apiService.get(url);
  }

  /**
   * Obține documentele dintr-o categorie specifică
   */
  async getDocumentsByCategory(categorySlug: string, filters: Record<string, any> = {}): Promise<MOLDocumentListResponse> {
    const url = this.buildUrl(`/categories/${categorySlug}/documents`, filters);
    return await apiService.get(url);
  }

  /**
   * Obține un document după ID
   */
  async getDocument(documentId: number): Promise<MOLDocument> {
    return await apiService.get(`${this.baseUrl}/documents/${documentId}`);
  }

  /**
   * Descarcă un document MOL
   */
  async downloadDocument(documentId: number): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/documents/${documentId}/download`);
    return await response.blob();
  }

  /**
   * Obține URL-ul pentru descărcarea unui document MOL
   */
  getDownloadUrl(documentId: number): string {
    return `${this.baseUrl}/documents/${documentId}/download`;
  }

  // === CĂUTARE ===

  /**
   * Căutare în documentele MOL
   */
  async searchDocuments(query: string, options: {
    category_id?: number;
    status?: string;
    limit?: number;
  } = {}): Promise<{
    query: string;
    results: number;
    documents: MOLDocument[];
  }> {
    const url = this.buildUrl('/search', { q: query, ...options });
    return await apiService.get(url);
  }

  // === STATISTICI ===

  /**
   * Obține statistici MOL
   */
  async getStats(): Promise<MOLStats> {
    return await apiService.get(`${this.baseUrl}/stats`);
  }

  // === UTILITĂȚI PUBLICE ===

  /**
   * Obține structura completă MOL pentru afișare publică
   */
  async getPublicStructure(): Promise<Array<{
    category: MOLCategory;
    documents: MOLDocument[];
    document_count: number;
  }>> {
    return await apiService.get(`${this.baseUrl}/public/structure`);
  }

  /**
   * Obține ultimele documente publicate
   */
  async getLatestPublications(limit = 10): Promise<MOLDocument[]> {
    const url = this.buildUrl('/public/latest', { limit });
    return await apiService.get(url);
  }
}

// Export singleton
export const molService = new MOLService();
export default molService;