import { Typography, Box, Button, Stack, Divider } from '@mui/material';
import { Channel } from '../../types';
import { useState, } from 'react';
import { ApiClient } from '../../client'
import { AskAiModal } from './AskAIModal'
import { ChatPanelFilesModal } from './ChatPanelFilesModal'
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface ChatTitleProps {
    channel: Channel;
    client: ApiClient;
}

export const ChatTitle = ({ channel, client }: ChatTitleProps) => {
    const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
    const [isAskAiModalOpen, setIsAskAiModalOpen] = useState(false);


    return (
        <>
            <Box
                sx={{
                    p: 2,
                    backgroundColor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                }}
            >
                <Stack spacing={1}>
                    <Typography variant="h6" fontWeight="medium">
                        {channel.name}
                    </Typography>
                    <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ mb: 1 }}
                    >
                        {channel.description}
                    </Typography>
                    <Divider />
                    <Stack 
                        direction="row" 
                        spacing={2} 
                        sx={{ pt: 1 }}
                    >
                        <Button
                            variant="outlined"
                            startIcon={<FolderOpenIcon />}
                            onClick={() => setIsFilesModalOpen(true)}
                            size="small"
                        >
                            Files
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<SmartToyIcon />}
                            onClick={() => setIsAskAiModalOpen(true)}
                            size="small"
                        >
                            Ask AI
                        </Button>
                    </Stack>
                </Stack>
            </Box>
            {isFilesModalOpen && <ChatPanelFilesModal client={client} channel={channel} onClose={() => setIsFilesModalOpen(false)} />}
            {isAskAiModalOpen && <AskAiModal client={client} channel={channel} onClose={() => setIsAskAiModalOpen(false)} />}
        </>
    )
}