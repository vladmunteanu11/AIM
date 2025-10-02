/**
 * Service pentru gestionarea formularelor online și cererilor administrative
 */
import { apiService } from './api';

// Tipuri pentru formulare online
export interface FormType {
  id: number;
  name: string;
  slug: string;
  description?: string;
  instructions?: string;
  requires_auth: boolean;
  is_active: boolean;
  estimated_processing_days?: number;
  form_schema: any;
  required_documents?: string[];
}

export interface FormSubmission {
  id: string;
  form_type_id: number;
  reference_number: string;
  citizen_name: string;
  citizen_email?: string;
  citizen_phone?: string;
  citizen_cnp?: string;
  citizen_address?: string;
  submission_data: any;
  status: string;
  submitted_at: string;
  consent_given: boolean;
  attached_files?: string[];
  processing_notes?: string;
}

export interface FormSubmissionCreate {
  form_type_id: number;
  citizen_name: string;
  citizen_email?: string;
  citizen_phone?: string;
  citizen_cnp?: string;
  citizen_address?: string;
  submission_data: any;
  consent_given: boolean;
}

export interface FormSubmissionStats {
  total_submissions: number;
  submitted_this_week: number;
  status_breakdown: Record<string, number>;
  form_type_breakdown: Record<string, number>;
  pending_review: number;
  in_review: number;
  completed_this_month: number;
}

class FormsService {
  private baseUrl = '/api/v1';

  // Mock data pentru tipurile de formulare
  private mockFormTypes: FormType[] = [
    {
      id: 1,
      name: 'Certificat de Urbanism',
      slug: 'certificat-urbanism',
      description: 'Certificat necesar pentru obținerea autorizației de construire sau pentru verificarea regimului urbanistic al unui teren',
      requires_auth: false,
      is_active: true,
      estimated_processing_days: 15,
      form_schema: {
        type: 'object',
        properties: {
          nume_solicitant: { type: 'string', title: 'Nume complet solicitant' },
          cnp: { type: 'string', title: 'CNP' },
          adresa_solicitant: { type: 'string', title: 'Adresa solicitant' },
          telefon: { type: 'string', title: 'Telefon contact' },
          email: { type: 'string', title: 'Email contact' },
          adresa_imobil: { type: 'string', title: 'Adresa imobilului pentru care se solicită certificatul' },
          destinatia_constructiei: { type: 'string', title: 'Destinația construcției' }
        },
        required: ['nume_solicitant', 'cnp', 'adresa_solicitant', 'adresa_imobil']
      },
      required_documents: ['Copie CI', 'Extras cadastral', 'Dovada proprietății']
    },
    {
      id: 2,
      name: 'Autorizație de Construcție',
      slug: 'autorizatie-constructie',
      description: 'Autorizație necesară pentru execuția lucrărilor de construcții, modificări sau extinderi ale construcțiilor existente',
      requires_auth: false,
      is_active: true,
      estimated_processing_days: 30,
      form_schema: {
        type: 'object',
        properties: {
          nume_solicitant: { type: 'string', title: 'Nume complet solicitant' },
          cnp: { type: 'string', title: 'CNP' },
          adresa_solicitant: { type: 'string', title: 'Adresa solicitant' },
          telefon: { type: 'string', title: 'Telefon contact' },
          email: { type: 'string', title: 'Email contact' },
          adresa_constructie: { type: 'string', title: 'Adresa construcției' },
          tip_lucrari: { type: 'string', enum: ['construire', 'extindere', 'modificare', 'consolidare'], title: 'Tipul lucrărilor' },
          valoare_investitie: { type: 'number', title: 'Valoarea estimată a investiției (lei)' }
        },
        required: ['nume_solicitant', 'cnp', 'adresa_solicitant', 'adresa_constructie', 'tip_lucrari']
      },
      required_documents: ['Copie CI', 'Certificat de urbanism', 'Proiect tehnic', 'Dovada proprietății', 'Raport expertiza tehnică']
    },
    {
      id: 3,
      name: 'Certificat Fiscal',
      slug: 'certificat-fiscal',
      description: 'Document care certifică situația fiscală a contribuabilului la bugetul local',
      requires_auth: false,
      is_active: true,
      estimated_processing_days: 5,
      form_schema: {
        type: 'object',
        properties: {
          nume_solicitant: { type: 'string', title: 'Nume complet solicitant' },
          cnp: { type: 'string', title: 'CNP' },
          adresa_solicitant: { type: 'string', title: 'Adresa solicitant' },
          telefon: { type: 'string', title: 'Telefon contact' },
          tip_contribuabil: { type: 'string', enum: ['persoana_fizica', 'persoana_juridica'], title: 'Tip contribuabil' },
          scopul_solicitarii: { type: 'string', title: 'Scopul pentru care se solicită certificatul' }
        },
        required: ['nume_solicitant', 'cnp', 'adresa_solicitant', 'tip_contribuabil']
      },
      required_documents: ['Copie CI', 'Dovada plății taxelor și impozitelor']
    },
    {
      id: 4,
      name: 'Adeverință de Domiciliu',
      slug: 'adeverinta-domiciliu',
      description: 'Adeverință care certifică domiciliul/reședința unei persoane în localitate',
      requires_auth: false,
      is_active: true,
      estimated_processing_days: 3,
      form_schema: {
        type: 'object',
        properties: {
          nume_complet: { type: 'string', title: 'Nume complet' },
          cnp: { type: 'string', title: 'CNP' },
          adresa_domiciliu: { type: 'string', title: 'Adresa domiciliului' },
          telefon: { type: 'string', title: 'Telefon contact' },
          scopul_solicitarii: { type: 'string', title: 'Scopul pentru care se solicită adeverința' }
        },
        required: ['nume_complet', 'cnp', 'adresa_domiciliu']
      },
      required_documents: ['Copie CI', 'Copie extras rol (dacă este proprietar)', 'Contract închiriere (dacă este chiriaș)']
    },
    {
      id: 5,
      name: 'Cerere Racordare Utilități',
      slug: 'cerere-racordare',
      description: 'Cerere pentru racordarea la rețelele publice de utilități (apă, canalizare, gaz)',
      requires_auth: false,
      is_active: true,
      estimated_processing_days: 20,
      form_schema: {
        type: 'object',
        properties: {
          nume_solicitant: { type: 'string', title: 'Nume complet solicitant' },
          cnp: { type: 'string', title: 'CNP' },
          adresa_solicitant: { type: 'string', title: 'Adresa solicitant' },
          telefon: { type: 'string', title: 'Telefon contact' },
          adresa_racordare: { type: 'string', title: 'Adresa pentru racordare' },
          tip_utilitate: { type: 'string', enum: ['apa', 'canalizare', 'gaz', 'energie_electrica'], title: 'Tipul utilității' },
          putere_instalata: { type: 'string', title: 'Puterea instalată (pentru energie)' }
        },
        required: ['nume_solicitant', 'cnp', 'adresa_solicitant', 'adresa_racordare', 'tip_utilitate']
      },
      required_documents: ['Copie CI', 'Dovada proprietății', 'Proiect tehnic de racordare']
    },
    {
      id: 6,
      name: 'Licență de Funcționare',
      slug: 'licenta-functionare',
      description: 'Licență necesară pentru desfășurarea anumitor activități economice în localitate',
      requires_auth: false,
      is_active: true,
      estimated_processing_days: 25,
      form_schema: {
        type: 'object',
        properties: {
          denumire_firma: { type: 'string', title: 'Denumirea firmei' },
          cui: { type: 'string', title: 'CUI/CIF' },
          reprezentant_legal: { type: 'string', title: 'Reprezentant legal' },
          adresa_firma: { type: 'string', title: 'Adresa sediului social' },
          telefon: { type: 'string', title: 'Telefon contact' },
          email: { type: 'string', title: 'Email contact' },
          tip_activitate: { type: 'string', title: 'Tipul activității' },
          cod_caen: { type: 'string', title: 'Cod CAEN principal' }
        },
        required: ['denumire_firma', 'cui', 'reprezentant_legal', 'adresa_firma', 'tip_activitate']
      },
      required_documents: ['Certificat constatator ONRC', 'Copie CI reprezentant legal', 'Dovada proprietății/închirierii spațiului']
    }
  ];

  /**
   * Obține toate tipurile de formulare active
   */
  async getFormTypes(): Promise<FormType[]> {
    try {
      console.log('Fetching form types...');
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('Form types loaded:', this.mockFormTypes);
      return this.mockFormTypes;
    } catch (error) {
      console.error('Error fetching form types:', error);
      throw error;
    }
  }

  /**
   * Obține un tip de formular specific după ID
   */
  async getFormType(formTypeId: number): Promise<FormType> {
    try {
      console.log(`Fetching form type ${formTypeId}...`);
      const response = await apiService.get<FormType>(`${this.baseUrl}/form-types/${formTypeId}`);
      console.log('Form type loaded:', response);
      return response;
    } catch (error) {
      console.error(`Error fetching form type ${formTypeId}:`, error);
      throw error;
    }
  }

  /**
   * Obține un tip de formular după slug
   */
  async getFormTypeBySlug(slug: string): Promise<FormType> {
    try {
      console.log(`Fetching form type by slug: ${slug}...`);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));
      const formType = this.mockFormTypes.find(f => f.slug === slug);
      if (!formType) {
        throw new Error('Tipul de formular nu a fost găsit');
      }
      console.log('Form type loaded:', formType);
      return formType;
    } catch (error) {
      console.error(`Error fetching form type by slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Creează o cerere administrativă nouă
   */
  async createFormSubmission(submissionData: FormSubmissionCreate): Promise<FormSubmission> {
    try {
      console.log('Creating form submission:', submissionData);
      const response = await apiService.post<FormSubmission>(`${this.baseUrl}/form-submissions`, submissionData);
      console.log('Form submission created:', response);
      return response;
    } catch (error) {
      console.error('Error creating form submission:', error);
      throw error;
    }
  }

  /**
   * Obține o cerere după numărul de referință
   */
  async getFormSubmissionByReference(referenceNumber: string): Promise<FormSubmission> {
    try {
      console.log(`Fetching form submission by reference: ${referenceNumber}...`);
      const response = await apiService.get<FormSubmission>(`${this.baseUrl}/form-submissions/reference/${referenceNumber}`);
      console.log('Form submission loaded:', response);
      return response;
    } catch (error) {
      console.error(`Error fetching form submission by reference ${referenceNumber}:`, error);
      throw error;
    }
  }

  /**
   * Obține o cerere după ID
   */
  async getFormSubmission(submissionId: string): Promise<FormSubmission> {
    try {
      console.log(`Fetching form submission ${submissionId}...`);
      const response = await apiService.get<FormSubmission>(`${this.baseUrl}/form-submissions/${submissionId}`);
      console.log('Form submission loaded:', response);
      return response;
    } catch (error) {
      console.error(`Error fetching form submission ${submissionId}:`, error);
      throw error;
    }
  }

  /**
   * Obține lista cererilor cu filtrare
   */
  async getFormSubmissions(filters: {
    form_type_id?: number;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<FormSubmission[]> {
    try {
      console.log('Fetching form submissions with filters:', filters);
      const params = new URLSearchParams();
      
      if (filters.form_type_id) {
        params.append('form_type_id', filters.form_type_id.toString());
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }
      if (filters.offset) {
        params.append('offset', filters.offset.toString());
      }

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}/form-submissions?${queryString}` : `${this.baseUrl}/form-submissions`;
      
      const response = await apiService.get<FormSubmission[]>(url);
      console.log('Form submissions loaded:', response);
      return response;
    } catch (error) {
      console.error('Error fetching form submissions:', error);
      throw error;
    }
  }

  /**
   * Obține statistici despre cererile administrative
   */
  async getFormSubmissionStats(): Promise<FormSubmissionStats> {
    try {
      console.log('Fetching form submission stats...');
      const response = await apiService.get<FormSubmissionStats>(`${this.baseUrl}/form-submissions/stats`);
      console.log('Form submission stats loaded:', response);
      return response;
    } catch (error) {
      console.error('Error fetching form submission stats:', error);
      throw error;
    }
  }

  /**
   * Formatează statusul cererii pentru afișare
   */
  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'În așteptare',
      'in_review': 'În analiză',
      'approved': 'Aprobată',
      'completed': 'Finalizată',
      'rejected': 'Respinsă',
      'on_hold': 'Suspendată'
    };
    return statusMap[status] || status;
  }

  /**
   * Obține culoarea pentru status
   */
  getStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
    const colorMap: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      'pending': 'warning',
      'in_review': 'info',
      'approved': 'success',
      'completed': 'success',
      'rejected': 'error',
      'on_hold': 'secondary'
    };
    return colorMap[status] || 'default';
  }

  /**
   * Calculează timpul de procesare în zile
   */
  getProcessingTimeDays(submittedAt: string, completedAt?: string): number {
    const startDate = new Date(submittedAt);
    const endDate = completedAt ? new Date(completedAt) : new Date();
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Verifică dacă o cerere este întârziată
   */
  isOverdue(submission: FormSubmission, formType: FormType): boolean {
    if (submission.status === 'completed' || submission.status === 'rejected') {
      return false;
    }

    if (!formType.estimated_processing_days) {
      return false;
    }

    const submittedDate = new Date(submission.submitted_at);
    const expectedCompletionDate = new Date(submittedDate);
    expectedCompletionDate.setDate(expectedCompletionDate.getDate() + formType.estimated_processing_days);

    return new Date() > expectedCompletionDate;
  }

  /**
   * Validează datele formularului bazat pe schema JSON
   */
  validateFormData(formData: any, formSchema: any): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    
    if (!formSchema || !formSchema.properties) {
      return { valid: true, errors };
    }

    // Verifică câmpurile obligatorii
    if (formSchema.required && Array.isArray(formSchema.required)) {
      for (const requiredField of formSchema.required) {
        if (!formData[requiredField] || formData[requiredField] === '') {
          const fieldTitle = formSchema.properties[requiredField]?.title || requiredField;
          errors[requiredField] = `${fieldTitle} este obligatoriu`;
        }
      }
    }

    // Validări de tip pentru câmpurile completate
    for (const [fieldName, fieldValue] of Object.entries(formData)) {
      if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
        continue;
      }

      const fieldSchema = formSchema.properties[fieldName];
      if (!fieldSchema) {
        continue;
      }

      // Validare tip număr
      if (fieldSchema.type === 'number') {
        const numValue = Number(fieldValue);
        if (isNaN(numValue)) {
          errors[fieldName] = `${fieldSchema.title || fieldName} trebuie să fie un număr valid`;
        }
      }

      // Validare tip dată
      if (fieldSchema.format === 'date' && fieldSchema.type === 'string') {
        const dateValue = new Date(fieldValue as string);
        if (isNaN(dateValue.getTime())) {
          errors[fieldName] = `${fieldSchema.title || fieldName} trebuie să fie o dată validă`;
        }
      }

      // Validare enum
      if (fieldSchema.enum && Array.isArray(fieldSchema.enum)) {
        if (!fieldSchema.enum.includes(fieldValue)) {
          errors[fieldName] = `${fieldSchema.title || fieldName} are o valoare nevalidă`;
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Generează câmpuri de formular bazate pe schema JSON
   */
  generateFormFields(formSchema: any): Array<{
    name: string;
    title: string;
    type: string;
    required: boolean;
    options?: string[];
    format?: string;
  }> {
    if (!formSchema || !formSchema.properties) {
      return [];
    }

    const requiredFields = formSchema.required || [];
    const fields = [];

    for (const [fieldName, fieldSchema] of Object.entries<any>(formSchema.properties)) {
      fields.push({
        name: fieldName,
        title: fieldSchema.title || fieldName,
        type: fieldSchema.type || 'string',
        required: requiredFields.includes(fieldName),
        options: fieldSchema.enum,
        format: fieldSchema.format
      });
    }

    return fields;
  }

  /**
   * Generează document oficial pentru o cerere aprobată
   */
  async generateDocument(submissionId: string): Promise<{message: string; reference_number: string}> {
    try {
      console.log(`Generating document for submission ${submissionId}...`);
      const response = await apiService.post<{message: string; reference_number: string}>(`${this.baseUrl}/documents/generate/${submissionId}`);
      console.log('Document generated:', response);
      return response;
    } catch (error) {
      console.error(`Error generating document for submission ${submissionId}:`, error);
      throw error;
    }
  }

  /**
   * Descarcă documentul generat
   */
  async downloadDocument(referenceNumber: string): Promise<Blob> {
    try {
      console.log(`Downloading document ${referenceNumber}...`);
      const response = await fetch(`${window.location.origin}/api/v1/documents/download/${referenceNumber}`);
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.statusText}`);
      }
      const blob = await response.blob();
      console.log('Document downloaded');
      return blob;
    } catch (error) {
      console.error(`Error downloading document ${referenceNumber}:`, error);
      throw error;
    }
  }

  /**
   * Obține preview HTML pentru document
   */
  async previewDocument(referenceNumber: string): Promise<string> {
    try {
      console.log(`Previewing document ${referenceNumber}...`);
      const response = await fetch(`${window.location.origin}/api/v1/documents/preview/${referenceNumber}`);
      if (!response.ok) {
        throw new Error(`Failed to preview document: ${response.statusText}`);
      }
      const html = await response.text();
      console.log('Document preview loaded');
      return html;
    } catch (error) {
      console.error(`Error previewing document ${referenceNumber}:`, error);
      throw error;
    }
  }

  /**
   * Verifică statusul generării documentului
   */
  async getDocumentStatus(submissionId: string): Promise<{status: string; reference_number?: string}> {
    try {
      console.log(`Checking document status for submission ${submissionId}...`);
      const response = await apiService.get<{status: string; reference_number?: string}>(`${this.baseUrl}/documents/status/${submissionId}`);
      console.log('Document status:', response);
      return response;
    } catch (error) {
      console.error(`Error checking document status for submission ${submissionId}:`, error);
      throw error;
    }
  }

  /**
   * Aprobă rapid o cerere pentru testare
   */
  async quickApproveSubmission(submissionId: string): Promise<{message: string}> {
    try {
      console.log(`Quick approving submission ${submissionId}...`);
      const response = await apiService.post<{message: string}>(`${this.baseUrl}/form-submissions/${submissionId}/quick-approve`);
      console.log('Submission approved:', response);
      return response;
    } catch (error) {
      console.error(`Error approving submission ${submissionId}:`, error);
      throw error;
    }
  }

  /**
   * Actualizează statusul unei cereri
   */
  async updateSubmissionStatus(submissionId: string, status: string): Promise<FormSubmission> {
    try {
      console.log(`Updating submission ${submissionId} status to ${status}...`);
      const response = await apiService.patch<FormSubmission>(`${this.baseUrl}/form-submissions/${submissionId}/status`, { status });
      console.log('Submission status updated:', response);
      return response;
    } catch (error) {
      console.error(`Error updating submission ${submissionId} status:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const formsService = new FormsService();
export default formsService;