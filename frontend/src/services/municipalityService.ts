// Municipality Service pentru Template Primărie Digitală
import { apiService } from './api';
import { MunicipalityConfig } from '../types/api';

class MunicipalityService {
  private readonly baseUrl = '/api/v1/municipality';

  async getConfig(): Promise<MunicipalityConfig> {
    return apiService.get<MunicipalityConfig>(`${this.baseUrl}/config`);
  }

  async updateConfig(config: MunicipalityConfig): Promise<MunicipalityConfig> {
    return apiService.put<MunicipalityConfig>(`${this.baseUrl}/config`, config);
  }

  async uploadLogo(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const response = await apiService.uploadFile(`${this.baseUrl}/logo`, file, onProgress);
    return response.data.logo_url;
  }
}

export const municipalityService = new MunicipalityService();