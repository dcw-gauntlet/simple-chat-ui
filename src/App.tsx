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

  const pollMessages = async (channelId: string): Promise<Message[]> => {
    // TODO: Implement message polling
    return [];
  };

  const refreshConversations = async () => {
    try {
      // Get both regular conversations and DMs
      const [conversationsResponse, dmsResponse] = await Promise.all([
        client.getConversations(user.id),
        client.getDMChannels(user.id)
      ]);

      console.log('Polling - DMs response:', dmsResponse);
      console.log('Polling - Conversations response:', conversationsResponse);

      if (conversationsResponse.ok && dmsResponse.ok) {
        const allChannels = [
          ...conversationsResponse.channels,
          ...dmsResponse.channels
        ];
        console.log('Polling - Combined channels:', allChannels);
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
      // If opening from primary panel, drop everything after primary and add new channel
      if (fromPrimaryPanel) {
        return [prevStack[0], threadChannel];
      }
      
      // If opening from secondary panel, just add the new channel to the stack
      return [...prevStack, threadChannel];
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
    // Check if this message is from the primary panel by comparing channel IDs
    const fromPrimaryPanel = conversationStack.length > 0 && 
      message.channel_id === conversationStack[0].id;
    
    openThreadInStack(threadChannel, fromPrimaryPanel);
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

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="user-profile">
          {user.profile_picture && (
            <img 
              src={user.profile_picture} 
              alt="Profile" 
              style={{ 
                width: 50, 
                height: 50, 
                borderRadius: '50%',
                objectFit: 'cover'
              }} 
            />
          )}
          <h3>{user.username}</h3>
          <button onClick={onLogout}>Logout</button>
        </div>
        {isLoading ? (
          <div className="loading">Loading conversations...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <ConversationPanel
            conversations={conversations}
            onSelect={handleChannelSelect}
            client={client}
            onJoinSuccess={refreshConversations}
            user={user}
          />
        )}
      </div>
      <div className="main-content">
        <SearchField onSearch={handleSearch} />
        
        {searchQuery ? (
          <SearchPanel 
            searchResults={searchResults || []}
            onResultClick={(channelId) => {
              const channel = conversations.find(c => c.id === channelId);
              if (channel) {
                handleChannelSelect(channel);
                setSearchQuery(''); // Clear search when selecting a channel
                setSearchResults([]);
              }
            }}
          />
        ) : (
          conversationStack.length > 0 ? (
            <>
              <div className="chat-panel-container">
                <ChatPanel
                  channel={conversationStack.length > 1 
                    ? conversationStack[conversationStack.length - 2] 
                    : conversationStack[0]}
                  client={client}
                  onThreadOpen={handleThreadOpen}
                  userId={user.id}
                  onThreadCreate={(message: Message) => handleThreadCreate(
                    conversationStack.length > 1 
                      ? conversationStack[conversationStack.length - 2]
                      : conversationStack[0],
                    message
                  )}
                  onStartDM={handleStartDM}
                />
              </div>
              
              {conversationStack.length > 1 && (
                <div className="chat-panel-container">
                  <ChatPanel
                    // For secondary panel, show the last channel in stack
                    channel={conversationStack[conversationStack.length - 1]}
                    client={client}
                    userId={user.id}
                    onThreadCreate={(message) => handleThreadCreate(
                      conversationStack[conversationStack.length - 1],
                      message
                    )}
                    onThreadOpen={(threadChannel, message) => 
                      handleThreadOpen(threadChannel, message)}
                    onStartDM={handleStartDM}
                  />
                </div>
              )}

              {conversationStack.length > 1 && (
                <button 
                  className="shift-button"
                  onClick={handleShiftConversations}
                >
                  Shift Conversations
                </button>
              )}
            </>
          ) : (
            <div className="chat-panel-container">
              <div className="placeholder-message">
                Select a conversation to begin chatting
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};




export default function App() {
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [password, setPassword] = useState(localStorage.getItem('password') || '');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
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
    
    setLoggedIn(false);
    setUser(null);
    setUsername('');  // Clear the state variables too
    setPassword('');
  }

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