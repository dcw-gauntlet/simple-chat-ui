import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Box, Button } from '@mui/material';
import { ApiClient } from '../../client';
import { Channel } from '../../types';

const markdownStyles = {
    '& p': { 
        marginBottom: '1em' 
    },
    '& ul, & ol': { 
        marginLeft: '1.5em',
        marginBottom: '1em'
    },
    '& li': { 
        marginBottom: '0.5em' 
    },
    '& h1, & h2, & h3, & h4': {
        marginTop: '1em',
        marginBottom: '0.5em'
    },
    '& code': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        padding: '0.2em 0.4em',
        borderRadius: '3px',
        fontSize: '85%'
    },
    '& strong': {
        fontWeight: 'bold'
    }
};

export const AskAiModal = ({ client, channel, onClose }: { client: ApiClient, channel: Channel, onClose: () => void }) => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleClose = () => {
        // Clear state when closing
        setQuery('');
        setResult(null);
        setIsSearching(false);
        onClose();
    };

    const handleSearch = async () => {
        if (!query.trim()) return;
        
        setIsSearching(true);
        try {
            const response = await client.ragSearch(query, channel.id);
            if (response.ok && response.result) {
                setResult(response.result);
            } else {
                setResult("No relevant information found to answer your question.");
            }
        } catch (error) {
            console.error('RAG search failed:', error);
            setResult("Sorry, an error occurred while searching.");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <Dialog 
            open={true}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            disableEnforceFocus
            disableRestoreFocus
            keepMounted={false}
        >
            <DialogTitle>Ask AI about Channel Files</DialogTitle>
            <DialogContent>
                <TextField
                    label="Your question"
                    fullWidth
                    multiline
                    rows={3}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    margin="normal"
                    disabled={isSearching}
                    autoFocus
                />
                {isSearching && (
                    <Box sx={{ mt: 2 }}>
                        <Typography>Searching...</Typography>
                    </Box>
                )}
                {result && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6">Answer:</Typography>
                        <Box sx={markdownStyles}>
                            <ReactMarkdown>{result}</ReactMarkdown>
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Close</Button>
                <Button 
                    onClick={handleSearch}
                    disabled={isSearching || !query.trim()}
                    variant="contained"
                >
                    {isSearching ? 'Searching...' : 'Ask'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AskAiModal;