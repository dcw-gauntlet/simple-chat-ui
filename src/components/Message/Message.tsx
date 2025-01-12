import React, { useState } from 'react';
import { Message as MessageType, Channel, } from '../../types';
import { UserPanel } from '../UserPanel/UserPanel';
import { ApiClient } from '../../client';
import styles from './Message.module.css';
import { Avatar } from '../ui';
import { ChannelType } from '../../types';
import { ThemeProvider } from '@mui/material/styles';
import { 
  Box, 
  Grid2, 
  Typography,
  IconButton,
  Popover
} from '@mui/material';
import { 
  theme
} from '../../theme';

interface MessageProps {
  message: MessageType;
  onThreadOpen: (channel: Channel, parentMessage: MessageType) => void;
  currentUserId: string;
  onStartDM: (userId: string) => void;
  client: ApiClient;
  onReactionUpdate?: () => void;
  isSearchResult?: boolean;
}

const formatTimestamp = (timestamp: string): { display: string; relative: string } => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  // Format the relative time
  const relative = `${diffInDays}d.${diffInHours % 24}h.${diffInMinutes % 60}m ago`;

  // Format the display time
  const display = date.toLocaleString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return { display, relative };
};

export const Message: React.FC<MessageProps> = ({ 
  message, 
  onThreadOpen,
  currentUserId,
  onStartDM,
  client,
  onReactionUpdate,
  isSearchResult = false
}) => {
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  
  const handleReactionSelect = async (emoji: string) => {
    try {
      await client.addReaction({
        message_id: message.id,
        reaction: emoji,
        user_id: currentUserId
      });
      if (onReactionUpdate) {
        onReactionUpdate();
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    } finally {
      setAnchorEl(null);
    }
  };

  const handleThreadCreate = async () => {
    if (message.has_thread && message.thread_id) {
      try {
        const response = await client.getChannel(message.thread_id);
        if (response.ok && response.channel) {
          onThreadOpen(response.channel, message);
        }
      } catch (error) {
        console.error('Error fetching thread:', error);
      }
      return;
    }

    // Create new thread
    try {
      console.log('Message object:', {
        messageId: message.id,
        channelId: message.channel_id,
        messageContent: message.content
      });

      // Create the thread channel first
      const threadName = `${message.content.substring(0, 20)}${message.content.length > 20 ? '...' : ''} - Thread`;
      const createChannelResponse = await client.createChannel({
        name: threadName,
        channel_type: ChannelType.THREAD,
        creator_id: currentUserId,
        description: `Thread from message: ${message.id}`
      });

      if (!createChannelResponse.ok || !createChannelResponse.channel) {
        console.error('Failed to create thread channel');
        return;
      }

      // Add the thread to the message
      const addThreadResponse = await client.addThread({
        message_id: message.id,
        channel_id: createChannelResponse.channel.id
      });

      if (addThreadResponse.ok) {
        // Only open the thread after successfully adding it to the message
        onThreadOpen(createChannelResponse.channel, message);
      } else {
        console.error('Failed to add thread to message');
      }
    } catch (error) {
      console.error('Error creating thread:', error);
    }
  };

  const handleFileDownload = async () => {
    if (!message.file_id) return;
    
    try {
      const blob = await client.downloadFile(message.file_id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message.file_name || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Don't show interactive elements in search results
  if (isSearchResult) {
    return (
      <div className={`${styles.messageContainer} ${styles.searchResult}`}>
        <div className={styles.avatar}>
          <Avatar
            user={message.sender}
            size="small"
          />
        </div>

        <div className={styles.messageHeader}>
          <span className={styles.username}>{message.sender.username}</span>
          <span className={styles.timestamp}>{formatTimestamp(message.sent).display}</span>
        </div>

        <div className={styles.messageContent}>
          {message.content || message.text}
        </div>
      </div>
    );
  }

  // Create a theme object
  const MessageBoxSX = {
    width: '60%',
    borderRadius: 1,
    padding: 2,
    color: '#ffffff',
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    marginLeft: message.sender.id === currentUserId ? 'auto' : '0',
    bgcolor: message.sender.id === currentUserId ? 'secondary.main' : 'primary.dark',
    '&:hover': {
      bgcolor: message.sender.id === currentUserId ? 'secondary.dark' : '#004db3',
    }
  };

  const handleEmojiClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <>
    <ThemeProvider theme={theme}>
      <Grid2 container
        sx={MessageBoxSX}
        spacing={2}
      >
        {/* Avatar on the left */}
        <Grid2 size={2} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar
              user={message.sender}
              size="large"
              onClick={() => setShowUserPanel(true)}
            />
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.75rem',
                marginTop: '10px',
                cursor: 'pointer',
              }}
              onClick={() => {
                if (message.has_thread && message.thread_id) {
                  client.getChannel(message.thread_id)
                    .then(response => {
                      if (response.ok && response.channel) {
                        onThreadOpen(response.channel, message);
                      }
                    })
                    .catch(error => console.error('Error fetching thread channel:', error));
                } else {
                  handleThreadCreate();
                }
              }}
            >
              {message.has_thread ? 'View replies' : 'Reply'}
            </Typography>
        </Grid2>
        
        {/* Right side container */}
        <Grid2 size={10} sx={{ display: 'flex', flexDirection: 'column' }}>
        
            {/* User Name and Date Row */}
            <Grid2 container sx={{ alignItems: 'center', marginBottom: 0.5 }}>
              <Grid2 size={6}>
                <Typography 
                    variant="body1"
                    sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    }}
                    onClick={() => setShowUserPanel(true)}
                >{message.sender.username}</Typography>
              </Grid2>
              <Grid2 size={6} sx={{ textAlign: 'right' }}>
                <Typography 
                    variant="body1"
                    title={formatTimestamp(message.sent).relative}
                    sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.75rem'
                    }}
                >{formatTimestamp(message.sent).display}</Typography>
              </Grid2>
            </Grid2>

            {/* Message Content Row */}
            <Grid2>
                <Typography 
                    variant="body1"
                    sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '1.2rem'
                    }}
                >{message.content}</Typography>
                
                {/* Add file attachment display */}
                {message.file_id && (
                    <Box 
                        onClick={handleFileDownload}
                        sx={{
                            mt: 1,
                            p: 1.5,
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'pointer',
                            maxWidth: '300px',
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.2)'
                            }
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'rgba(255, 255, 255, 0.9)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                width: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {/* Show different icons based on content type */}
                            {message.file_content_type?.startsWith('image/') ? '🖼️' : 
                             message.file_content_type?.startsWith('video/') ? '🎥' :
                             message.file_content_type?.startsWith('audio/') ? '🎵' : '📎'}
                            {message.file_name || 'Attachment'}
                            <Typography
                                component="span"
                                sx={{
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '0.8rem',
                                    marginLeft: 'auto'
                                }}
                            >
                                Download
                            </Typography>
                        </Typography>
                    </Box>
                )}
            </Grid2>

            {/* Reactions and Emoji Picker Row */}
            <Grid2 container sx={{ alignItems: 'center', marginTop: 0.5, marginLeft: -1 }}>
                <Grid2 size={2}>
                    <IconButton
                    sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                        color: 'rgba(255, 255, 255, 0.9)',
                        }
                    }}
                    onClick={handleEmojiClick}
                    aria-label="Add reaction"
                    >
                        😊
                    </IconButton>
                     <Popover
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    onClose={() => setAnchorEl(null)}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                    >
                        <Box sx={{ 
                        p: 2, 
                        display: 'flex', 
                        gap: 1, 
                        flexWrap: 'wrap',
                        maxWidth: '200px'
                        }}>
                        {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
                            <IconButton
                            key={emoji}
                            onClick={() => {
                                handleReactionSelect(emoji);
                                setAnchorEl(null);
                            }}
                            sx={{
                                fontSize: '1.2rem',
                                padding: '8px',
                                '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                }
                            }}
                            >
                            {emoji}
                            </IconButton>
                        ))}
                        </Box>
                    </Popover>
                </Grid2>
                <Grid2 size={10}>
                    {message.reactions && Object.entries(message.reactions).length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {Object.entries(message.reactions)
                            .sort(([, countA], [, countB]) => countB - countA) // Sort by count in descending order
                            .map(([emoji, count]) => (
                            <Box
                                key={emoji}
                                sx={{
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                }
                                }}
                            >
                                <Typography 
                                sx={{ fontSize: '1rem', mr: 1 }}
                                onClick={() => handleReactionSelect(emoji)}
                                >
                                {emoji}
                                </Typography>
                                <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                {count}
                                </Typography>
                            </Box>
                            ))}
                        </Box>
                    )}
                </Grid2>
             </Grid2>
        </Grid2>
      </Grid2>
    </ThemeProvider>
    <UserPanel
        onStartDM={onStartDM}
        isOpen={showUserPanel}
        onClose={() => setShowUserPanel(false)}
        user={message.sender}
      />
    </>
  );
};