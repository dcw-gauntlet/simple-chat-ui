import React from 'react';
import { Channel } from '../../types';
import { ChannelDisplay } from '../ChannelDisplay/ChannelDisplay';
import { Box, Typography, List, ListItem, Paper } from '@mui/material';

interface RecentChannelsProps {
  title: string;
  channels: Channel[];
  onChannelSelect: (channel: Channel) => void;
}

export const RecentChannels: React.FC<RecentChannelsProps> = ({
  title,
  channels,
  onChannelSelect,
}) => {
  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 2,
          color: 'text.primary',
          fontWeight: 'medium'
        }}
      >
        {title}
      </Typography>
      
      {channels.length === 0 ? (
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
            fontStyle: 'italic',
            pl: 2 
          }}
        >
          No conversations yet
        </Typography>
      ) : (
        <Paper 
          elevation={0}
          sx={{ 
            maxHeight: 360,
            overflow: 'auto',
            bgcolor: 'transparent'
          }}
        >
          <List sx={{ p: 0 }}>
            {channels.map((channel) => (
              <ListItem
                key={channel.id}
                onClick={() => onChannelSelect(channel)}
                sx={{
                  p: 1,
                  cursor: 'pointer',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ChannelDisplay channel={channel} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};
