/**
 * Page for displaying search results.
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchService } from '../../services/searchService';
import { SearchResult } from '../../types/api';
import { 
    Container, 
    Typography, 
    TextField, 
    Button, 
    Box, 
    List, 
    ListItem, 
    ListItemText, 
    CircularProgress, 
    Alert, 
    Paper, 
    Divider 
} from '@mui/material';

const SearchResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const query = searchParams.get('q') || '';

    useEffect(() => {
        if (query) {
            const fetchResults = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await searchService.search(query);
                    setResults(response.results);
                } catch (err) { 
                    setError('A apărut o eroare la căutarea rezultatelor.');
                }
                setLoading(false);
            };
            fetchResults();
        }
    }, [query]);

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom color="primary">
                Rezultate Căutare
            </Typography>
            
            <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
                <form action="/cautare" method="get">
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField 
                            name="q" 
                            defaultValue={query} 
                            label="Caută în site" 
                            variant="outlined" 
                            fullWidth 
                            placeholder="Ex: programari online, plati taxe, sesizari..."
                        />
                        <Button 
                            type="submit" 
                            variant="contained" 
                            size="large"
                            sx={{ minWidth: 120 }}
                        >
                            Caută
                        </Button>
                    </Box>
                </form>
            </Paper>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                    <Typography variant="body1" sx={{ ml: 2 }}>
                        Se caută...
                    </Typography>
                </Box>
            )}
            
            {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

            {!loading && !error && query && (
                <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        {results.length} rezultate găsite pentru "<strong>{query}</strong>"
                    </Typography>
                    
                    {results.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                Nu am găsit rezultate pentru căutarea ta.
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Încearcă termeni mai generali sau verifică ortografia.
                            </Typography>
                            
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Căutări populare:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {['programari online', 'plati taxe', 'sesizari', 'formulare', 'contact'].map((term) => (
                                        <Button
                                            key={term}
                                            variant="outlined"
                                            size="small"
                                            onClick={() => window.location.href = `/cautare?q=${encodeURIComponent(term)}`}
                                        >
                                            {term}
                                        </Button>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    ) : (
                        <List sx={{ mt: 2 }}>
                            {results.map((result, index) => (
                                <React.Fragment key={result.id}>
                                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                        <ListItemText
                                            primary={
                                                <Link 
                                                    to={result.url} 
                                                    style={{ 
                                                        textDecoration: 'none', 
                                                        color: '#1976d2',
                                                        fontSize: '1.1rem',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {result.title}
                                                </Link>
                                            }
                                            secondary={
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography 
                                                        variant="body2" 
                                                        color="text.secondary"
                                                        sx={{ mb: 1 }}
                                                        dangerouslySetInnerHTML={{ 
                                                            __html: result.excerpt || 'Fără descriere disponibilă' 
                                                        }} 
                                                    />
                                                    <Typography 
                                                        variant="caption" 
                                                        color="success.main"
                                                        sx={{ fontWeight: 500 }}
                                                    >
                                                        {result.url}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < results.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Paper>
            )}

            {!query && !loading && (
                <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                        Caută în site
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Folosește bara de căutare de mai sus pentru a găsi informații despre:
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mt: 3 }}>
                        <Button variant="outlined" onClick={() => window.location.href = '/cautare?q=programari online'}>
                            Programări Online
                        </Button>
                        <Button variant="outlined" onClick={() => window.location.href = '/cautare?q=plati taxe'}>
                            Plăți Taxe
                        </Button>
                        <Button variant="outlined" onClick={() => window.location.href = '/cautare?q=sesizari'}>
                            Sesizări Cetățene
                        </Button>
                        <Button variant="outlined" onClick={() => window.location.href = '/cautare?q=formulare'}>
                            Formulare Administrative
                        </Button>
                        <Button variant="outlined" onClick={() => window.location.href = '/cautare?q=contact'}>
                            Contact și Program
                        </Button>
                        <Button variant="outlined" onClick={() => window.location.href = '/cautare?q=buget'}>
                            Buget Local
                        </Button>
                    </Box>
                </Paper>
            )}
        </Container>
    );
};

export default SearchResultsPage;