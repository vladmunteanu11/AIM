/**
 * Layout principal pentru aplicația DigiLocal
 * Combină Header și Footer cu conținutul principal
 */
import React from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';
import { digiLocalTheme } from '../../styles/theme';

interface LayoutProps {
  municipalityConfig?: {
    name: string;
    official_name: string;
    logo_url?: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    website_url?: string;
    working_hours?: Record<string, string>;
  };
}

const Layout: React.FC<LayoutProps> = ({ municipalityConfig }) => {
  return (
    <ThemeProvider theme={digiLocalTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}
      >
        <Header municipalityConfig={municipalityConfig} />
        <Breadcrumbs />
        
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Outlet />
        </Box>
        
        <Footer municipalityConfig={municipalityConfig} />
      </Box>
    </ThemeProvider>
  );
};

export default Layout;