// app.tsx
import './App.css';
import { client } from './client';
import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm/LoginForm';
import { User, Channel, Message, ChannelType } from './types';
import { ConversationPanel } from './components/ConversationPanel/ConversationPanel';
import { ChatPanel } from './components/ChatPanel/ChatPanel';

interface LoggedInProps {
  user: User;
  onLogout: () => void;
}

const LoggedIn: React.FC<LoggedInProps> = ({ user, onLogout }) => {
  const [conversationStack, setConversationStack] = useState<Channel[]>([]);
  const [conversations, setConversations] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const handleChannelSelect = (channel: Channel) => {
    setConversationStack(prevStack => {
      if (prevStack[prevStack.length - 1]?.id === channel.id) {
        return prevStack;
      }
      return [...prevStack, channel];
    });
  };

  const handleShiftConversations = () => {
    setConversationStack(prevStack => {
      if (prevStack.length <= 1) return prevStack;
      return prevStack.slice(0, -1);
    });
  };

  const pollMessages = async (channelId: string): Promise<Message[]> => {
    // TODO: Implement message polling
    return [];
  };

  const refreshConversations = async () => {
    try {
      const response = await client.getConversations(user.id);
      if (response.ok) {
        setConversations(response.channels);
        setError('');
      } else {
        setError(response.message || 'Failed to load conversations');
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
      // If opening from primary panel, drop the secondary panel first
      if (fromPrimaryPanel && prevStack.length > 1) {
        return [prevStack[0], threadChannel];
      }
      
      // Otherwise proceed with normal stack behavior
      if (prevStack[prevStack.length - 1]?.id === threadChannel.id) {
        return prevStack;
      }
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
        // Check if this message is from the primary panel by comparing channel IDs
        const fromPrimaryPanel = conversationStack.length > 0 && 
          message.channel_id === conversationStack[0].id;
        
        openThreadInStack(threadResponse.channel, fromPrimaryPanel);
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  const handleThreadOpen = (threadChannel: Channel, message: Message) => {
    // Check if this message is from the primary panel by comparing channel IDs
    const fromPrimaryPanel = conversationStack.length > 0 && 
      message.channel_id === conversationStack[0].id;
    
    openThreadInStack(threadChannel, fromPrimaryPanel);
  };

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
            username={user.username}
          />
        )}
      </div>
      <div className="main-content">
        {conversationStack.length > 0 && (
          <>
            <div className="chat-panel-container">
              <ChatPanel
                channel={conversationStack.length > 1 ? 
                  conversationStack[conversationStack.length - 2] : 
                  conversationStack[0]}
                client={client}
                onThreadOpen={(threadChannel: Channel, message: Message) => handleThreadOpen(threadChannel, message)}
                userId={user.id}
                onThreadCreate={(message: Message) => handleThreadCreate(
                  conversationStack[conversationStack.length - 1],
                  message
                )}
              />
            </div>
            
            {conversationStack.length > 1 && (
              <div className="chat-panel-container">
                <ChatPanel
                  channel={conversationStack[conversationStack.length - 1]}
                  client={client}
                  userId={user.id}
                  onThreadCreate={(message) => handleThreadCreate(
                    conversationStack[conversationStack.length - 1],
                    message
                  )}
                  onThreadOpen={(threadChannel, message) => handleThreadOpen(threadChannel, message)}
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