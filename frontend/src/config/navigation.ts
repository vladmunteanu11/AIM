/**
 * Configurația de navigare pentru site-ul primăriei
 * Structură organizată ierarhic cu icoane și categorii
 */
import React from 'react';
import {
  Business,
  Info,
  Gavel,
  Security,
  Article,
  RoomService,
  Payment,
  Groups,
  Campaign,
  Schedule,
  ContactSupport,
  Map,
  Assignment,
  Search
} from '@mui/icons-material';

export interface NavigationItem {
  label: string;
  path: string;
  icon?: React.ReactElement;
  children?: NavigationItem[];
  description?: string;
  category?: 'main' | 'service' | 'legal' | 'other';
}

// Structura de navigare îmbunătățită cu submeniuri
export const navigationItems: NavigationItem[] = [
  {
    label: 'Despre Primărie',
    path: '/despre-primarie',
    icon: React.createElement(Business),
    category: 'main',
    description: 'Informații despre organizarea și funcționarea primăriei',
    children: [
      { 
        label: 'Organizare', 
        path: '/despre-primarie/organizare', 
        icon: React.createElement(Business),
        description: 'Structura organizatorică și compartimente'
      },
      { 
        label: 'Conducere', 
        path: '/despre-primarie/conducere', 
        icon: React.createElement(Groups),
        description: 'Conducerea primăriei și consiliul local'
      },
      { 
        label: 'Strategia de Dezvoltare', 
        path: '/despre-primarie/strategia-dezvoltare', 
        icon: React.createElement(Map),
        description: 'Strategia de dezvoltare locală și proiecte'
      }
    ]
  },
  {
    label: 'Informații Publice',
    path: '/informatii-interes-public',
    icon: React.createElement(Info),
    category: 'main',
    description: 'Informații de interes public conform legii transparenței',
    children: [
      { 
        label: 'Buget și Execuție', 
        path: '/informatii-interes-public/buget', 
        icon: React.createElement(Payment),
        description: 'Bugetul local și execuția bugetară'
      },
      { 
        label: 'Achiziții Publice', 
        path: '/informatii-interes-public/achizitii', 
        icon: React.createElement(Assignment),
        description: 'Proceduri de achiziții publice'
      },
      { 
        label: 'Taxe și Impozite', 
        path: '/informatii-interes-public/taxe-impozite', 
        icon: React.createElement(Payment),
        description: 'Taxele și impozitele locale'
      }
    ]
  },
  {
    label: 'Transparență',
    path: '/transparenta-decizionala',
    icon: React.createElement(Gavel),
    category: 'main',
    description: 'Transparența procesului decizional',
    children: [
      { 
        label: 'Proiecte Hotărâri', 
        path: '/transparenta-decizionala/proiecte-hotarari', 
        icon: React.createElement(Article),
        description: 'Proiectele de hotărâri în dezbatere'
      },
      { 
        label: 'Ședințe Consiliul Local', 
        path: '/transparenta-decizionala/sedinte-consiliu', 
        icon: React.createElement(Schedule),
        description: 'Programul și procesele-verbale ale ședințelor'
      }
    ]
  },
  {
    label: 'Integritate',
    path: '/integritate-institutionala',
    icon: React.createElement(Security),
    category: 'main',
    description: 'Măsuri de integritate instituțională',
    children: [
      { 
        label: 'Cod Etic', 
        path: '/integritate-institutionala/cod-etic', 
        icon: React.createElement(Security),
        description: 'Codul etic și deontologic'
      },
      { 
        label: 'Plan Integritate', 
        path: '/integritate-institutionala/plan-integritate', 
        icon: React.createElement(Assignment),
        description: 'Planul de integritate instituțională'
      }
    ]
  },
  {
    label: 'Servicii Online',
    path: '/servicii-publice',
    icon: React.createElement(RoomService),
    category: 'service',
    description: 'Servicii publice digitale pentru cetățeni',
    children: [
      { 
        label: 'Programări Online', 
        path: '/programari-online', 
        icon: React.createElement(Schedule),
        description: 'Programează-te online la primărie'
      },
      { 
        label: 'Sesizări Cetățene', 
        path: '/servicii-publice/sesizari/formular', 
        icon: React.createElement(Campaign),
        description: 'Trimite o sesizare online'
      },
      { 
        label: 'Formulare Administrative', 
        path: '/servicii-publice/formulare', 
        icon: React.createElement(Assignment),
        description: 'Completează formulare online'
      },
      { 
        label: 'Verificare Sesizări', 
        path: '/servicii-publice/cautare-sesizare', 
        icon: React.createElement(Search),
        description: 'Verifică statusul unei sesizări'
      },
      { 
        label: 'Verificare Programări', 
        path: '/verificare-programare', 
        icon: React.createElement(Schedule),
        description: 'Verifică statusul unei programări'
      }
    ]
  },
  {
    label: 'Plăți Online',
    path: '/plati-online',
    icon: React.createElement(Payment),
    category: 'service',
    description: 'Plătește taxele și impozitele online',
    children: [
      { 
        label: 'Plata Taxelor', 
        path: '/plati-online', 
        icon: React.createElement(Payment),
        description: 'Plătește taxele locale online'
      },
      { 
        label: 'Verificare Plăți', 
        path: '/verificare-plati', 
        icon: React.createElement(Search),
        description: 'Verifică statusul unei plăți'
      }
    ]
  }
];

// Navigare suplimentară pentru footer și meniuri secundare
export const additionalNavItems: NavigationItem[] = [
  {
    label: 'Anunțuri',
    path: '/anunturi',
    icon: React.createElement(Campaign),
    category: 'main',
    description: 'Anunțuri oficiale ale primăriei'
  },
  {
    label: 'Monitorul Oficial Local',
    path: '/monitorul-oficial-local',
    icon: React.createElement(Article),
    category: 'main',
    description: 'Monitorul Oficial Local - MOL',
    children: [
      { label: 'Statutul UAT', path: '/mol/statutul-uat', icon: React.createElement(Article) },
      { label: 'Regulamente', path: '/mol/regulamente', icon: React.createElement(Article) },
      { label: 'Hotărâri', path: '/mol/hotarari', icon: React.createElement(Article) },
      { label: 'Dispoziții', path: '/mol/dispozitii', icon: React.createElement(Article) },
      { label: 'Documente Financiare', path: '/mol/documente-financiare', icon: React.createElement(Payment) },
      { label: 'Alte Documente', path: '/mol/alte-documente', icon: React.createElement(Article) }
    ]
  },
  {
    label: 'Comunitate',
    path: '/comunitate',
    icon: React.createElement(Groups),
    category: 'other',
    description: 'Informații despre comunitatea locală',
    children: [
      { label: 'Educație și Cultură', path: '/comunitate/educatie-cultura', icon: React.createElement(Groups) },
      { label: 'Mediu și Turism', path: '/comunitate/mediu-turism', icon: React.createElement(Map) }
    ]
  },
  {
    label: 'Contact',
    path: '/contact',
    icon: React.createElement(ContactSupport),
    category: 'other',
    description: 'Date de contact și program'
  }
];

// Linkuri legale pentru footer
export const legalNavItems: NavigationItem[] = [
  { label: 'Termeni și Condiții', path: '/termeni-conditii', category: 'legal' },
  { label: 'Politica de Confidențialitate', path: '/politica-confidentialitate', category: 'legal' },
  { label: 'Politica Cookie-uri', path: '/politica-cookies', category: 'legal' },
  { label: 'GDPR', path: '/gdpr', category: 'legal' },
  { label: 'Declarație Accesibilitate', path: '/accesibilitate', category: 'legal' },
  { label: 'Hartă Site', path: '/harta-site', category: 'legal' }
];

// Toate elementele de navigare împreună
export const allNavItems: NavigationItem[] = [
  ...navigationItems,
  ...additionalNavItems,
  ...legalNavItems
];

// Helper functions
export const findNavItemByPath = (path: string): NavigationItem | null => {
  const searchInItems = (items: NavigationItem[]): NavigationItem | null => {
    for (const item of items) {
      if (item.path === path) {
        return item;
      }
      if (item.children) {
        const found = searchInItems(item.children);
        if (found) return found;
      }
    }
    return null;
  };
  
  return searchInItems(allNavItems);
};

export const getNavItemsByCategory = (category: NavigationItem['category']): NavigationItem[] => {
  return allNavItems.filter(item => item.category === category);
};