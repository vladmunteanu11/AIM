/**
 * Page for displaying the sitemap.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Box, List, ListItem, ListItemText, Paper } from '@mui/material';
import { navigationItems } from '../../config/navigation';

const SitemapPage: React.FC = () => {
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Hartă Site
            </Typography>
            <Paper elevation={2} sx={{ p: 3 }}>
                <List>
                    {navigationItems.map((item) => (
                        <ListItem key={item.path} sx={{ display: 'block' }}>
                            <Link to={item.path} style={{ textDecoration: 'none' }}>
                                <ListItemText primary={item.label} primaryTypographyProps={{ variant: 'h6' }} />
                            </Link>
                            {item.children && (
                                <List sx={{ pl: 4 }}>
                                    {item.children.map((child) => (
                                        <ListItem key={child.path}>
                                            <Link to={child.path} style={{ textDecoration: 'none' }}>
                                                <ListItemText primary={child.label} />
                                            </Link>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Container>
    );
};

export default SitemapPage;