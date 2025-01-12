// app.tsx
import './App.css';
import { client } from './client';
import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm/LoginForm';
import { User, Channel, Message, ChannelType, SearchResultData } from './types';
import { ConversationPanel } from './components/ConversationPanel/ConversationPanel';
import { ChatPanel } from './components/ChatPanel/ChatPanel';
import { UserPresence } from './UserPresence';
import { SearchField } from './components/Search/SearchField';
import { SearchPanel } from './components/Search/SearchPanel';
import { Box, useTheme, useMediaQuery, IconButton, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { theme } from './theme';
interface LoggedInProps {
  user: User;
  onLogout: () => void;
}

const LoggedIn: React.FC<LoggedInProps> = ({ user, onLogout }) => {
  const [conversationStack, setConversationStack] = useState<Channel[]>([]);
  const [conversations, setConversations] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultData[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChannelSelect = (channel: Channel) => {
    setConversationStack([channel]);
  };

  const handleShiftConversations = () => {
    setConversationStack(prevStack => {
      if (prevStack.length <= 1) return prevStack;
      // Remove the last conversation and return to previous state
      return prevStack.slice(0, -1);
    });
  };

  const refreshConversations = async () => {
    try {
      // Get both regular conversations and DMs
      const [conversationsResponse, dmsResponse] = await Promise.all([
        client.getConversations(user.id),
        client.getDMChannels(user.id)
      ]);

      
      if (conversationsResponse.ok && dmsResponse.ok) {
        const allChannels = [
          ...conversationsResponse.channels,
          ...dmsResponse.channels
        ];
        setConversations(allChannels);
        setError('');
      } else {
        setError('Failed to load conversations');
      }
    } catch (err) {
      setError('Unable to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load of conversations
  useEffect(() => {
    refreshConversations();
  }, [user.id]);

  // New helper function to handle opening a thread in the conversation stack
  const openThreadInStack = (threadChannel: Channel, fromPrimaryPanel: boolean = false) => {
    setConversationStack(prevStack => {
      const newStack = fromPrimaryPanel ? 
        [prevStack[0], threadChannel] : 
        [...prevStack, threadChannel];
      console.log('New stack:', newStack); // Debug log
      return newStack;
    });
  };

  const handleThreadCreate = async (parentChannel: Channel, message: Message) => {
    try {
      const messagePreview = (message.content || message.text || '')
        .trim()
        .substring(0, 30)
        + ((message.content || message.text || '').length > 30 ? '...' : '');

      const threadResponse = await client.createChannel({
        name: `${parentChannel.name} >> ${messagePreview} - Thread`,
        channel_type: ChannelType.THREAD,
        creator_id: user.id,
        description: `Thread from message: ${message.id}`,
        parent_channel_id: parentChannel.id,
        parent_message_id: message.id
      });

      if (threadResponse.ok && threadResponse.channel) {
        // Join the channel immediately after creation
        const joinResponse = await client.joinChannel({
          username: user.username,
          channel_name: threadResponse.channel.name
        });
        
        if (joinResponse.ok) {
          // Check if this message is from the primary panel by comparing channel IDs
          const fromPrimaryPanel = conversationStack.length > 0 && 
            message.channel_id === conversationStack[0].id;
          
          openThreadInStack(threadResponse.channel, fromPrimaryPanel);
        } else {
          console.error('Failed to join thread:', joinResponse.message);
        }
      }
    } catch (error) {
      console.error('Failed to create or join thread:', error);
    }
  };

  const handleThreadOpen = (threadChannel: Channel, message: Message) => {
    console.log('Opening thread:', threadChannel, message);
    
    // Find the index of the primary panel's channel
    const primaryIndex = conversationStack.findIndex(channel => 
      channel.id === message.channel_id
    );
    
    if (primaryIndex !== -1) {
      // If message is from a channel in our stack
      setConversationStack(prevStack => {
        // Keep everything up to and including the primary channel, then add the new thread
        const newStack = [
          ...prevStack.slice(0, primaryIndex + 1),
          threadChannel
        ];
        console.log('New stack:', newStack);
        return newStack;
      });
    } else {
      // If opening from somewhere else, add to the stack
      setConversationStack(prevStack => [...prevStack, threadChannel]);
    }
  };

  const handleStartDM = async (targetUserId: string, targetUsername?: string) => {
    try {
      // First check if we already have a DM channel with this user
      const existingDM = conversations.find(channel => {
        if (channel.channel_type !== ChannelType.DM) return false;
        
        // Check for channel ID that contains both user IDs
        const id1 = `${user.id}_dm_${targetUserId}`;
        const id2 = `${targetUserId}_dm_${user.id}`;
        return channel.id === id1 || channel.id === id2;
      });

      if (existingDM) {
        // If DM exists, make sure both users are members
        await Promise.all([
          client.joinChannel({
            username: user.username,
            channel_name: existingDM.name
          }),
          client.joinChannel({
            username: targetUsername!,
            channel_name: existingDM.name
          })
        ]);
        handleChannelSelect(existingDM);
        return;
      }

      // If we don't have the username, fetch the user details
      let username = targetUsername;
      if (!username) {
        const userResponse = await client.getUser(targetUserId);
        if (!userResponse.ok || !userResponse.user) {
          console.error('Failed to get target user details');
          return;
        }
        username = userResponse.user.username;
      }

      // Create new DM channel
      const response = await client.createChannel({
        name: `DM ${user.username} ${username}`,
        channel_type: ChannelType.DM,
        creator_id: user.id,
        description: `Direct messages between ${user.username} and ${username}`,
        recipient_id: targetUserId
      });

      if (response.ok && response.channel) {
        // Add both users to the channel
        await Promise.all([
          client.joinChannel({
            username: user.username,
            channel_name: response.channel.name
          }),
          client.joinChannel({
            username: username!,
            channel_name: response.channel.name
          })
        ]);

        // Add the channel to conversations if it's not already there
        setConversations(prev => {
          if (!prev.find(c => c.id === response.channel.id)) {
            return [...prev, response.channel];
          }
          return prev;
        });

        // Open the channel
        handleChannelSelect(response.channel);
      }
    } catch (error) {
      console.error('Failed to start DM:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await client.searchMessages({
        query: query,
        userId: user.id
      });

      if (response.ok) {
        setSearchResults(response.results);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Add UserPresence setup
  useEffect(() => {
    const presence = new UserPresence(user.id);
    
    // Cleanup on unmount
    return () => {
      presence.disconnect();
    };
  }, [user.id]); // Only re-run if user.id changes

  const handleChatThreadCreate = async (message: Message) => {
    try {
      const messagePreview = (message.content || message.text || '')
        .trim()
        .substring(0, 30)
        + ((message.content || message.text || '').length > 30 ? '...' : '');

      const threadResponse = await client.createChannel({
        name: `Thread: ${messagePreview}`,
        channel_type: ChannelType.THREAD,
        creator_id: user.id,
        description: `Thread from message: ${message.id}`,
        parent_channel_id: message.channel_id,
        parent_message_id: message.id
      });

      if (threadResponse.ok && threadResponse.channel) {
        // Join the channel immediately after creation
        const joinResponse = await client.joinChannel({
          username: user.username,
          channel_name: threadResponse.channel.name
        });
        
        if (joinResponse.ok) {
          // Add the new thread to the conversation stack
          setConversationStack(prevStack => [prevStack[0], threadResponse.channel]);
        } else {
          console.error('Failed to join thread:', joinResponse.message);
        }
      }
    } catch (error) {
      console.error('Failed to create or join thread:', error);
    }
  };

  // Get the last two channels from the stack for display
  const displayChannels = conversationStack.slice(-2);
  
  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <ConversationPanel
        conversations={conversations}
        onSelect={handleChannelSelect}
        client={client}
        onJoinSuccess={refreshConversations}
        user={user}
        onLogout={onLogout}
      />
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'row',
          width: 'calc(100% - 320px)',
          overflow: 'hidden'
        }}
      >
        {/* Primary Panel */}
        <Box 
          sx={{
            flex: 1,
            borderLeft: 1,
            borderColor: 'divider'
          }}
        >
          <ChatPanel
            channel={displayChannels[0] || null}
            client={client}
            userId={user.id}
            onThreadCreate={handleChatThreadCreate}
            onThreadOpen={handleThreadOpen}
            onStartDM={handleStartDM}
          />
        </Box>

        {/* Secondary Panel */}
        {displayChannels.length > 1 && (
          <Box 
            sx={{
              flex: 1,
              borderLeft: 1,
              borderColor: 'divider'
            }}
          >
            <ChatPanel
              channel={displayChannels[1]}
              client={client}
              userId={user.id}
              onThreadCreate={handleChatThreadCreate}
              onThreadOpen={handleThreadOpen}
              onStartDM={handleStartDM}
            />
          </Box>
        )}

        {/* Shift Button Column */}
        {displayChannels.length > 1 && (
          <Box 
            sx={{
              width: '48px',
              borderLeft: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: theme.palette.background.paper,
              pt: 2,
              height: '100%',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: theme.palette.action.hover
              }
            }}
            onClick={handleShiftConversations}
          >
            <IconButton
              size="small"
              title="Shift conversations"
              sx={{
                '&:hover': {
                  bgcolor: theme.palette.action.hover
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );
};




export default function App() {
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [password, setPassword] = useState(localStorage.getItem('password') || '');
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  const login = (user: User) => {
    localStorage.setItem('token', user.token);
    setLoggedIn(true);
    setUser(user);
  }

  const logout = () => {
    // Clear all stored credentials
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    
    // Clear all application state
    setLoggedIn(false);
    setUser(null);
    setUsername('');
    setPassword('');
  };

  React.useEffect(() => {
    const loginResponse = client.login({
      username: username,
      password: password,
    });
    
    loginResponse.then((response) => {
      if(response.ok) {
        login(response.user);
      } else {
        logout();
      }
    });
  }, []);

  console.log(user, loggedIn);
  
  return (
    <div className="app-container">
      {!user ? (
        <div className="login-container">
          <LoginForm client={client} onLoginSuccess={login} />
        </div>
      ) : (
        <LoggedIn user={user} onLogout={logout} />
      )}
    </div>
  );
}