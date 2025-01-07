import React from 'react';
import styles from './ChatPanel.module.css';
import { Message as MessageComponent } from './../Message/Message';
import { Channel, Message } from './../../types';
import { ApiClient } from './../../client';

interface ChatPanelProps {
  channel: Channel | null;
  stackDepth: number;
  onPopStack: () => void;
  onThreadCreate: (channel: Channel, messageId: string) => void;
  client: ApiClient;
  userId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  channel, 
  stackDepth,
  onPopStack,
  onThreadCreate,
  client,
  userId
}) => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load and poll messages
  React.useEffect(() => {
    if (!channel) return;

    const fetchMessages = async () => {
      try {
        const response = await client.getChannelMessages(channel.id);
        if (response.ok) {
          setMessages(response.messages);
          setError('');
          scrollToBottom();
        } else {
          setError('Failed to load messages');
        }
      } catch (err) {
        setError('Unable to load messages');
      }
    };

    // Initial fetch
    fetchMessages();

    // Set up polling
    const intervalId = setInterval(fetchMessages, 3000);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      setMessages([]);
      setError('');
    };
  }, [channel, client]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel || !newMessage.trim() || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await client.sendMessage({
        channel_id: channel.id,
        user_id: userId,
        content: newMessage.trim()
      });

      if (response.ok) {
        setNewMessage('');
        // Immediately fetch new messages
        const messagesResponse = await client.getChannelMessages(channel.id);
        if (messagesResponse.ok) {
          setMessages(messagesResponse.messages);
          scrollToBottom();
        }
      } else {
        setError('Failed to send message');
      }
    } catch (err) {
      setError('Unable to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactionUpdate = async () => {
    if (!channel) return;
    
    try {
      const response = await client.getChannelMessages(channel.id);
      if (response.ok) {
        setMessages(response.messages);
      }
    } catch (err) {
      console.error('Error refreshing messages:', err);
    }
  };

  if (!channel) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>
          Select a conversation to start chatting
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.metadata}>
          <h2 className={styles.title}>{channel.name}</h2>
          <div className={styles.details}>
            <span>Created: {new Date(channel.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        {stackDepth > 1 && (
          <button 
            onClick={onPopStack}
            className={styles.popButton}
          >
            ↓ Back
          </button>
        )}
      </div>
      <div className={styles.messageList}>
        {messages.map((message) => (
          <MessageComponent
            key={message.id}
            message={message}
            onThreadCreate={() => onThreadCreate(channel!, message.id)}
            currentUserId={userId}
            client={client}
            onReactionUpdate={handleReactionUpdate}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <form onSubmit={handleSendMessage} className={styles.messageForm}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !newMessage.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};
