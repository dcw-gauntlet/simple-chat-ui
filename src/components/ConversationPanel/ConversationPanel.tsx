import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Modal, 
  TextField, 
  IconButton,
  Paper,
  Divider,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { RecentChannels } from './../RecentChannels/RecentChannels';
import { Channel, ChannelType } from './../../types';
import { ApiClient } from '../../client';
import { ChannelDisplay } from '../ChannelDisplay/ChannelDisplay';
import { User } from '../../types';
import { AccountDisplay } from '../AccountDisplay/AccountDisplay';
import { theme } from '../../theme';
interface ConversationPanelProps {
  conversations: Channel[];
  onSelect: (channel: Channel) => void;
  client: ApiClient;
  user: User;
  onJoinSuccess: () => void;
  onLogout: () => void;
}

// SearchResults component with Material UI
const SearchResults: React.FC<{
  isLoading: boolean;
  searchQuery: string;
  searchResults: Channel[];
  onJoinChannel: (name: string) => void;
  error: string;
}> = ({ isLoading, searchQuery, searchResults, onJoinChannel, error }) => {
  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {error && (
        <Typography color={theme.palette.error.main} sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <Stack spacing={1}>
        {searchResults.map((channel) => (
          <Box
            key={channel.id}
            onClick={() => onJoinChannel(channel.name)}
            sx={{ cursor: 'pointer' }}
          >
            <ChannelDisplay channel={channel} />
          </Box>
        ))}
      </Stack>
      
      {isLoading && (
        <Typography sx={{ mt: 2, color: theme.palette.text.secondary }}>
          Searching...
        </Typography>
      )}
      {!isLoading && searchQuery && searchResults.length === 0 && (
        <Typography sx={{ mt: 2, color: theme.palette.text.secondary }}>
          No conversations found
        </Typography>
      )}
    </Box>
  );
};

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  conversations,
  onSelect,
  client,
  user,
  onJoinSuccess,
  onLogout
}) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    if (!showSearchModal) return;

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchQuery.trim()) {
      const timeout = setTimeout(async () => {
        setIsLoading(true);
        try {
          const response = await client.searchChannels(searchQuery);
          if (response.ok) {
            setSearchResults(response.channels);
          } else {
            setError(response.message || 'Failed to search conversations');
          }
        } catch (err) {
          setError('Unable to search conversations');
        } finally {
          setIsLoading(false);
        }
      }, 300); // 300ms delay

      setSearchTimeout(timeout);
    } else {
      setSearchResults([]); // Clear results if search is empty
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery, showSearchModal]);

  // Poll for both conversations and DMs every 3 seconds
  useEffect(() => {
    const pollConversations = async () => {
      try {
        // Get both regular conversations and DMs
        const [conversationsResponse, dmsResponse] = await Promise.all([
          client.getConversations(user.id),
          client.getDMChannels(user.id)
        ]);

        if (conversationsResponse.ok && dmsResponse.ok) {
          onJoinSuccess(); // This will trigger the parent's refreshConversations
        }
      } catch (error) {
        console.error('Failed to poll conversations:', error);
      }
    };

    const pollInterval = setInterval(pollConversations, 3000);

    return () => clearInterval(pollInterval);
  }, [user.id, client, onJoinSuccess]);

  const handleJoinConversation = async (channelName: string) => {
    setJoinError('');
    setError('');
    setIsLoading(true);

    try {
      const response = await client.joinChannel({
        username: user.username,
        channel_name: channelName
      });

      if (response.ok) {
        setShowSearchModal(false);
        setSearchQuery('');
        setSearchResults([]);
        onJoinSuccess();
        const joinedChannel = searchResults.find(c => c.name === channelName);
        if (joinedChannel) {
          onSelect(joinedChannel);
        }
      } else {
        if (response.message.includes('already in the channel')) {
          setJoinError('You are already a member of this conversation');
        } else {
          setJoinError(response.message || 'Failed to join conversation');
        }
      }
    } catch (err) {
      setJoinError('Unable to join conversation. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    setError('');
    setIsLoading(true);

    try {
      const createResponse = await client.createChannel({
        name: newChannelName,
        channel_type: ChannelType.CONVERSATION,
        creator_id: user.id,
        description: newChannelDescription
      });

      if (createResponse.ok && createResponse.channel) {
        const joinResponse = await client.joinChannel({
          username: user.username,
          channel_name: createResponse.channel.name
        });

        if (joinResponse.ok) {
          setShowCreateModal(false);
          setNewChannelName('');
          setNewChannelDescription('');
          onJoinSuccess();
          onSelect(createResponse.channel);
        } else {
          setError('Created conversation but failed to join: ' + joinResponse.message);
        }
      } else {
        setError(createResponse.message || 'Failed to create conversation');
      }
    } catch (err) {
      setError('Unable to create conversation');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter channels by type
  const regularConversations = conversations.filter(
    channel => channel.channel_type === ChannelType.CONVERSATION
  );
  
  const dmConversations = conversations.filter(
    channel => channel.channel_type === ChannelType.DM
  );

  return (
    <Paper 
      elevation={0}
      sx={{ 
        width: 320,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.default,
        borderRight: 1,
        borderColor: theme.palette.divider
      }}
    >
      <AccountDisplay user={user} onLogout={onLogout} />
      <Box sx={{ p: 2, borderBottom: 1, borderColor: theme.palette.divider }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}>
          <Typography variant="h6">Conversations</Typography>
          <Box>
            <IconButton 
              onClick={() => setShowSearchModal(true)}
              color="primary"
              size="small"
              sx={{ mr: 1 }}
            >
              <SearchIcon />
            </IconButton>
            <IconButton
              onClick={() => setShowCreateModal(true)}
              color="primary"
              size="small"
              sx={{ mr: 1 }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {error && (
        <Typography color="error" sx={{ p: 2 }}>
          {error}
        </Typography>
      )}
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <RecentChannels
          title="Recent Conversations"
          channels={regularConversations}
          onChannelSelect={onSelect}
        />

        {dmConversations.length > 0 && (
          <RecentChannels
            title="Direct Messages"
            channels={dmConversations}
            onChannelSelect={onSelect}
          />
        )}
      </Box>

      {/* Search Modal */}
      <Modal
        open={showSearchModal}
        onClose={() => {
          setShowSearchModal(false);
          setSearchQuery('');
          setSearchResults([]);
          setJoinError('');
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper sx={{ 
          width: '90%',
          maxWidth: 500,
          p: 3,
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="h6">Search Conversations</Typography>
            <IconButton 
              onClick={() => setShowSearchModal(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <TextField
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            disabled={isLoading}
            autoFocus
            sx={{ mb: 2 }}
          />
          
          <SearchResults
            isLoading={isLoading}
            searchQuery={searchQuery}
            searchResults={searchResults}
            onJoinChannel={handleJoinConversation}
            error={joinError}
          />
        </Paper>
      </Modal>

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewChannelName('');
          setNewChannelDescription('');
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper sx={{ 
          width: '90%',
          maxWidth: 500,
          p: 3
        }}>
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="h6">Create New Conversation</Typography>
            <IconButton 
              onClick={() => setShowCreateModal(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Conversation Name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              disabled={isLoading}
            />
            
            <TextField
              fullWidth
              label="Description"
              value={newChannelDescription}
              onChange={(e) => setNewChannelDescription(e.target.value)}
              disabled={isLoading}
              multiline
              rows={3}
            />
            
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => setShowCreateModal(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateConversation}
                disabled={isLoading || !newChannelName.trim()}
                variant="contained"
              >
                Create
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Modal>
    </Paper>
  );
};
