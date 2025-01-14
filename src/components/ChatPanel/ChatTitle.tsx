import { Typography, Box, Button, } from '@mui/material';
import { Channel } from '../../types';
import { useState, } from 'react';
import { ApiClient } from '../../client'
import { AskAiModal } from './AskAIModal'
import { ChatPanelFilesModal } from './ChatPanelFilesModal'

interface ChatTitleProps {
    channel: Channel;
    client: ApiClient;
}

export const ChatTitle = ({ channel, client }: ChatTitleProps) => {
    const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
    const [isAskAiModalOpen, setIsAskAiModalOpen] = useState(false);


    return (
        <>
            <Box>
                <Typography variant="h6">{channel.name}</Typography>
                <Typography variant="body2">{channel.description}</Typography>
                <Button onClick={() => setIsFilesModalOpen(true)}>Files</Button>
                <Button onClick={() => setIsAskAiModalOpen(true)}>Ask AI</Button>
            </Box>
            {isFilesModalOpen && <ChatPanelFilesModal client={client} channel={channel} onClose={() => setIsFilesModalOpen(false)} />}
            {isAskAiModalOpen && <AskAiModal client={client} channel={channel} onClose={() => setIsAskAiModalOpen(false)} />}
        </>
    )
}