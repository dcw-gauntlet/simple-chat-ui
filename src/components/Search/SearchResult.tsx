import React from 'react';
import { Stack, Typography, Paper, Box } from '@mui/material';
import { SearchResultData, Channel, Message } from '../../types';

interface SearchResultProps {
  result: SearchResultData;
  channel_id: string;
  channel_name: string;
  onChannelSelect: (channel_id: string) => void;
}

interface MessageSearchResultProps {
  message: Message;
  channel_id: string;
  channel_name: string;
  onChannelSelect: (channel_id: string) => void;
  isMainResult?: boolean;
}

const MessageSearchResult: React.FC<MessageSearchResultProps> = ({ 
  message, 
  channel_id, 
  channel_name, 
  onChannelSelect,
  isMainResult = false
}: MessageSearchResultProps & { isMainResult?: boolean }) => {
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2, 
        mb: 1,
        cursor: 'pointer',
        bgcolor: isMainResult ? 'action.selected' : 'background.paper',
        borderLeft: isMainResult ? 4 : 0,
        borderColor: 'primary.main',
        '&:hover': {
          bgcolor: 'action.hover'
        }
      }}
      onClick={() => onChannelSelect(channel_id)}
    >
      {isMainResult && (
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'primary.main' }}>
          {channel_name}
        </Typography>
      )}
      <Typography 
        variant="body1" 
        sx={{ 
          color: isMainResult ? 'text.primary' : 'text.secondary',
          fontWeight: isMainResult ? 500 : 400
        }}
      >
        {message.content}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
        {message.sent}
      </Typography>
    </Paper>
  );
};

export const SearchResult: React.FC<SearchResultProps> = ({ result, channel_id, channel_name, onChannelSelect }) => {
  return (
    <Paper
      elevation={1}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Channel Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 500,
            color: 'primary.main'
          }}
        >
          # {channel_name}
        </Typography>
      </Box>

      {/* Messages Stack */}
      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Stack>
          {result.previous_message && (
            <Box sx={{ pl: 2, borderLeft: 1, borderColor: 'divider' }}>
              <MessageSearchResult 
                message={result.previous_message} 
                channel_id={channel_id} 
                channel_name={channel_name} 
                onChannelSelect={onChannelSelect} 
              />
            </Box>
          )}
          <MessageSearchResult 
            message={result.message} 
            channel_id={channel_id} 
            channel_name={channel_name} 
            onChannelSelect={onChannelSelect}
            isMainResult={true}
          />
          {result.next_message && (
            <Box sx={{ pl: 2, borderLeft: 1, borderColor: 'divider' }}>
              <MessageSearchResult 
                message={result.next_message} 
                channel_id={channel_id} 
                channel_name={channel_name} 
                onChannelSelect={onChannelSelect} 
              />
            </Box>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};
