import { useState, useEffect } from 'react';
import { MunicipalityConfig } from '../types/api';
import { municipalityService } from '../services/municipalityService';

export const useMunicipalityConfig = () => {
  const [config, setConfig] = useState<MunicipalityConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use mock data for now since backend is not running
      const mockConfig = {
        id: 1,
        name: "Primăria Digitală Demo",
        official_name: "Primăria Digitală - Template DigiLocal",
        county: "Județul Cluj",
        mayor_name: "Ion Popescu",
        logo_url: "/assets/logo-primarie.svg",
        coat_of_arms_url: undefined,
        contact_email: "contact@primarie-demo.ro",
        contact_phone: "0264 123 456",
        fax: "0264 123 457",
        address: "Str. Libertății nr. 1, Cluj-Napoca, Județul Cluj",
        postal_code: "400001",
        website_url: "https://primarie-demo.ro",
        primary_color: "#004990",
        secondary_color: "#0079C1",
        working_hours: {
          luni: "08:00-16:00",
          marti: "08:00-16:00", 
          miercuri: "08:00-16:00",
          joi: "08:00-16:00",
          vineri: "08:00-16:00",
          sambata: "Închis",
          duminica: "Închis"
        },
        audience_hours: {
          luni: "09:00-12:00",
          marti: "09:00-12:00", 
          miercuri: "09:00-12:00",
          joi: "09:00-12:00",
          vineri: "09:00-12:00",
          sambata: "Închis",
          duminica: "Închis"
        },
        meta_description: "Site oficial al Primăriei Digitale - servicii online pentru cetățeni",
        google_analytics_id: undefined,
        timezone: "Europe/Bucharest",
        language: "ro",
        maintenance_mode: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setConfig(mockConfig);
    } catch (err) {
      console.error('Error fetching municipality config:', err);
      setError('Nu s-a putut încărca configurația primăriei');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfig: Partial<MunicipalityConfig>) => {
    try {
      if (!config) return;
      const updatedConfig = { ...config, ...newConfig };
      const result = await municipalityService.updateConfig(updatedConfig);
      setConfig(result);
      return result;
    } catch (err) {
      console.error('Error updating municipality config:', err);
      throw new Error('Nu s-a putut actualiza configurația');
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    config,
    loading,
    error,
    updateConfig,
    refetch: fetchConfig
  };
};