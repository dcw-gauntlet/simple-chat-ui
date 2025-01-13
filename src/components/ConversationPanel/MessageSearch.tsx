import { Box, Typography, Stack } from '@mui/material';
import { TextField } from '@mui/material';
import { useState } from 'react';
import { theme } from '../../theme';
import { ApiClient } from '../../client';
import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, Modal, IconButton } from '@mui/material';
import { SearchResult } from '../Search/SearchResult';
import { SearchResultData } from '../../types';
import CloseIcon from '@mui/icons-material/Close';
import { Channel } from '../../types';

interface MessageSearchProps {
    client: ApiClient,
    onChannelSelect: (channelOrId: Channel | string) => void,
    userId: string,
}

export const MessageSearch = ({ client, onChannelSelect, userId }: MessageSearchProps) => {

    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResultData[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            setIsSearching(true);
            setShowSearchModal(true);
            
            try {
                const response = await client.searchMessages({
                    query: searchQuery.trim(),
                    userId: userId
                });
                
                if (response.ok) {
                    setSearchResults(response.results);
                } else {
                    console.error('Search failed:', response.message);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }
    };

    const handleCloseModal = () => {
        setShowSearchModal(false);
        setSearchQuery('');
    };

    return (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: theme.palette.divider }}>
            <TextField 
                fullWidth
                placeholder="Search all messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />
            
            <Modal
                open={showSearchModal}
                onClose={handleCloseModal}
                aria-labelledby="search-results-modal"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    maxWidth: 800,
                    maxHeight: '80vh',
                    overflow: 'auto',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 1,
                }}>
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 3 
                    }}>
                        <Typography variant="h6" component="h2">
                            Search Results
                        </Typography>
                        <IconButton 
                            onClick={handleCloseModal}
                            aria-label="close"
                            size="small"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    
                    {isSearching ? (
                        <Typography>Searching...</Typography>
                    ) : searchResults.length === 0 ? (
                        <Typography>No results found</Typography>
                    ) : (
                        <Stack spacing={3}>
                            {searchResults.map((result) => (
                                <Box 
                                    key={result.message.id}
                                    sx={{ 
                                        backgroundColor: 'background.default',
                                        borderRadius: 1,
                                        p: 2 
                                    }}
                                >
                                    <SearchResult
                                        result={result}
                                        channel_id={result.message.channel_id}
                                        channel_name={result.channel_name || 'Unknown Channel'}
                                        onChannelSelect={(channelId) => {
                                            console.log('Search result clicked:', channelId);
                                            onChannelSelect(channelId);
                                            handleCloseModal();
                                        }}
                                    />
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Box>
            </Modal>
        </Box>
    )
}

