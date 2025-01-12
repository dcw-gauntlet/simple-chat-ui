import React from 'react';
import { Channel } from '../../types';
import { Box, Typography, Paper } from '@mui/material';

interface ChannelDisplayProps {
  channel: Channel;
}

export const ChannelDisplay: React.FC<ChannelDisplayProps> = ({ channel }) => {
  const formattedDate = new Date(channel.created_at).toLocaleDateString();
  
  return (
    <Paper 
      elevation={1}
      sx={{
        width: '100%',
        height: '100px', // Fixed height
        maxWidth: '360px',
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
          borderColor: 'primary.main',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <Box 
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between'
        }}
      >
        <Box 
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 'medium',
              color: 'text.primary'
            }}
          >
            {channel.name}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              bgcolor: 'action.hover',
              px: 1,
              py: 0.5,
              borderRadius: 1
            }}
          >
            {channel.members_count} {channel.members_count === 1 ? 'member' : 'members'}
          </Typography>
        </Box>
        
        {channel.description && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.2em',
              height: '2.4em'
            }}
          >
            {channel.description}
          </Typography>
        )}
        
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'text.secondary',
            mt: 'auto'
          }}
        >
          Created: {formattedDate}
        </Typography>
      </Box>
    </Paper>
  );
};