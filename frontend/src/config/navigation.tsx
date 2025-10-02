import React from 'react';
import { Assignment } from '@mui/icons-material';
import {
    Search as SearchIcon,
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
    Map
  } from '@mui/icons-material';

export const navigationItems = [
    {
      label: 'Despre Primărie',
      path: '/despre-primarie',
      icon: <Business />,
      children: [
        { label: 'Organizare', path: '/despre-primarie/organizare', icon: <Business /> },
        { label: 'Conducere', path: '/despre-primarie/conducere', icon: <Groups /> },
        { label: 'Strategia de Dezvoltare', path: '/despre-primarie/strategia-dezvoltare', icon: <Map /> }
      ]
    },
    {
      label: 'Informații Publice',
      path: '/informatii-interes-public',
      icon: <Info />,
      children: [
        { label: 'Buget și Execuție', path: '/informatii-interes-public/buget', icon: <Payment /> },
        { label: 'Achiziții Publice', path: '/informatii-interes-public/achizitii', icon: <Assignment /> },
        { label: 'Taxe și Impozite', path: '/informatii-interes-public/taxe-impozite', icon: <Payment /> }
      ]
    },
    {
      label: 'Transparență',
      path: '/transparenta-decizionala',
      icon: <Gavel />,
      children: [
        { label: 'Proiecte Hotărâri', path: '/transparenta-decizionala/proiecte-hotarari', icon: <Article /> },
        { label: 'Ședințe Consiliul Local', path: '/transparenta-decizionala/sedinte-consiliu', icon: <Schedule /> }
      ]
    },
    {
      label: 'Integritate',
      path: '/integritate-institutionala',
      icon: <Security />,
      children: [
        { label: 'Cod Etic', path: '/integritate-institutionala/cod-etic', icon: <Security /> },
        { label: 'Plan Integritate', path: '/integritate-institutionala/plan-integritate', icon: <Assignment /> }
      ]
    },
    {
      label: 'Servicii Online',
      path: '/servicii-publice',
      icon: <RoomService />,
      children: [
        { label: 'Programări Online', path: '/programari-online', icon: <Schedule /> },
        { label: 'Sesizări Cetățene', path: '/servicii-publice/sesizari/formular', icon: <Campaign /> },
        { label: 'Formulare Administrative', path: '/servicii-publice/formulare', icon: <Assignment /> },
        { label: 'Verificare Sesizări', path: '/servicii-publice/cautare-sesizare', icon: <SearchIcon /> },
        { label: 'Verificare Programări', path: '/verificare-programare', icon: <Schedule /> }
      ]
    },
    {
      label: 'Plăți Online',
      path: '/plati-online',
      icon: <Payment />,
      children: [
        { label: 'Plata Taxelor', path: '/plati-online', icon: <Payment /> },
        { label: 'Verificare Plăți', path: '/verificare-plati', icon: <SearchIcon /> }
      ]
    }
  ];
