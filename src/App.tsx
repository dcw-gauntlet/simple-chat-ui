import './App.css';
import { client } from './client';
import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm/LoginForm';
import { User, Channel, Message, ChannelType, SearchResultData } from './types';
import { ConversationPanel } from './components/ConversationPanel/ConversationPanel';
import { ChatPanel } from './components/ChatPanel/ChatPanel';
import { UserPresence } from './UserPresence';
import { Box, IconButton, } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { theme } from './theme';
import { Stack } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

interface LoggedInProps {
  user: User;
  onLogout: () => void;
}

const LoggedIn: React.FC<LoggedInProps> = ({ user, onLogout }) => {
  const [conversationStack, setConversationStack] = useState<Channel[]>([]);
  const [conversations, setConversations] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultData[]>([]);
  const REFRESH_INTERVAL = 5_000; // 5 seconds

  const handleChannelSelect = async (channelOrId: Channel | string) => {
    console.log('App handleChannelSelect called with:', channelOrId);
    
    try {
      if (typeof channelOrId === 'string') {
        // Fetch the channel directly
        const response = await client.getChannel(channelOrId);
        if (response.ok && response.channel) {
          // Join the channel
          await client.joinChannel({
            username: user.username,
            channel_name: response.channel.name
          });
          
          // Set the conversation stack with the new channel
          setConversationStack([response.channel]);
        }
      } else {
        // If we got a Channel object directly
        setConversationStack([channelOrId]);
      }
    } catch (error) {
      console.error('Failed to fetch or join channel:', error);
    }
  };

  const handleShiftConversations = () => {
    setConversationStack(prevStack => {
      if (prevStack.length <= 1) return prevStack;
      // Remove the last conversation and return to previous state
      return prevStack.slice(0, -1);
    });
  };

  const refreshConversations = async (force: boolean = false) => {
    // Don't refresh if it's been less than REFRESH_INTERVAL since last refresh
    // unless force is true
    if (!force && Date.now() - lastRefresh < REFRESH_INTERVAL) {
      return;
    }

    try {
      setIsLoading(true);
      // Get both regular conversations and DMs in a single Promise.all
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
        setLastRefresh(Date.now());
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
    refreshConversations(true);
  }, [user.id]);

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refreshConversations();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [user.id]);

  // Update the onJoinSuccess to use the force flag
  const handleJoinSuccess = () => {
    refreshConversations(true);
  };

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
        const joinResponse = await client.joinChannel({
          username: user.username,
          channel_name: threadResponse.channel.name
        });
        
        if (joinResponse.ok) {
          // If creating thread from primary panel, drop all channels after primary
          const fromPrimaryPanel = conversationStack.length > 0 && 
            message.channel_id === conversationStack[0].id;
          
          if (fromPrimaryPanel) {
            setConversationStack(prev => [prev[0], threadResponse.channel]);
          } else {
            // If from secondary panel, just add to stack
            setConversationStack(prev => [...prev, threadResponse.channel]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to create or join thread:', error);
    }
  };

  const handleThreadOpen = (threadChannel: Channel, message: Message) => {
    // Find if the message is from the primary panel
    const primaryIndex = conversationStack.findIndex(channel => 
      channel.id === message.channel_id
    );
    
    if (primaryIndex === 0) {
      // If from primary panel, drop everything after primary and add thread
      setConversationStack(prev => [prev[0], threadChannel]);
    } else if (primaryIndex > 0) {
      // If from secondary panel, just add to stack
      setConversationStack(prev => [...prev, threadChannel]);
    } else {
      // If from somewhere else, replace entire stack
      setConversationStack([threadChannel]);
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

  // Update display logic to show last 1-2 channels
  const getDisplayChannels = (): Channel[] => {
    if (conversationStack.length === 0) {
      return [];
    }
    return conversationStack.slice(-2);
  };

  // In the render:
  const displayChannels: Channel[] = getDisplayChannels();
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Stack
      direction="column"
      spacing={0}
      sx={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
        <Stack id="conversation-stack" direction="row" spacing={0} sx={{height: '100%', width: '100%'}}>
          <ConversationPanel
                    conversations={conversations}
                    onSelect={handleChannelSelect}
                    client={client}
                    onJoinSuccess={handleJoinSuccess}
                    user={user}
                    onLogout={onLogout}
                    onChannelSelect={handleChannelSelect}
                />

          <Box
            component="main"
              sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  flex: 1,
                  overflow: 'hidden',
              }}
          >
            {/* Existing chat panels layout */}
            {displayChannels.map((channel) => (
                <Box
                key={channel.id}
                sx={{
                    flex: 1,
                    borderLeft: 1,
                    borderColor: 'divider',
                    height: '100%',
                }}
                >
                    <ChatPanel
                        channel={channel}
                        client={client}
                        userId={user.id}
                        onThreadCreate={handleChatThreadCreate}
                        onThreadOpen={handleThreadOpen}
                        onStartDM={handleStartDM}
                    />
                </Box>
            ))}
            {/* Shift button column */}
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
        </Stack>
    </Stack>} />
      </Routes>
    </Router>
    
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