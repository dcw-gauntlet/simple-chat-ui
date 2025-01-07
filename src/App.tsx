import './App.css';
import { client } from './client';
import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm/LoginForm';
import { User } from './types';
import { ConversationPanel } from './components/ConversationPanel/ConversationPanel';
import { ChatPanel } from './components/ChatPanel/ChatPanel';
import { Channel, Message } from './types';

interface LoggedInProps {
  user: User;
  onLogout: () => void;
}

const LoggedIn: React.FC<LoggedInProps> = ({ user, onLogout }) => {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [conversations, setConversations] = useState<Channel[]>([]);
  const [stackDepth, setStackDepth] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    setStackDepth(1);
  };

  const handleThreadCreate = (channel: Channel, messageId: string) => {
    // TODO: Create thread implementation
    setStackDepth(stackDepth + 1);
  };

  const handlePopStack = () => {
    setStackDepth(Math.max(1, stackDepth - 1));
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
        <ChatPanel
          channel={selectedChannel}
          stackDepth={stackDepth}
          onPopStack={handlePopStack}
          onThreadCreate={handleThreadCreate}
          client={client}
          userId={user.id}
        />
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

