// API Types pentru Template Primărie Digitală
export interface MunicipalityConfig {
  id: number;
  name: string;
  official_name: string;
  county?: string;
  mayor_name: string;
  logo_url?: string;
  coat_of_arms_url?: string;
  contact_email: string;
  contact_phone: string;
  fax?: string;
  address: string;
  postal_code?: string;
  website_url?: string;
  primary_color: string;
  secondary_color: string;
  working_hours?: Record<string, string>;
  audience_hours?: Record<string, string>;
  meta_description?: string;
  google_analytics_id?: string;
  timezone: string;
  language: string;
  maintenance_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  category: string;
  is_urgent: boolean;
  image_url?: string;
}

export interface Page {
  id: number;
  slug: string;
  title: string;
  content: string;
  meta_description?: string;
}

export interface SearchResultItem {
  type: string;
  id: number;
  title: string;
  excerpt: string;
  url: string;
}

export interface SearchResult {
    id: number;
    content_type: string;
    title: string;
    url: string;
    excerpt?: string;
    category?: string;
}

export interface SearchResponse {
    query: string;
    results: SearchResult[];
    total: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  is_superuser: boolean;
  is_active: boolean;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Tipuri pentru formulare și sesizări
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

export interface ComplaintForm {
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

export interface ComplaintSearchResult {
  complaint: Complaint | null;
  error?: string;
}

export interface FormValidationErrors {
  [key: string]: string;
}

export interface UploadProgress {
  [fileId: string]: number;
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