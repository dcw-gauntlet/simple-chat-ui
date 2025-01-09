// Message.tsx
import React, { useState } from 'react';
import { Message as MessageType, Channel, ChannelType } from '../../types';
import { ReactionPicker } from '../ReactionPicker/ReactionPicker';
import { ApiClient } from '../../client';
import styles from './Message.module.css';

interface MessageProps {
  message: MessageType;
  onThreadCreate: (message: MessageType) => void;
  onThreadOpen: (threadChannel: Channel, message: MessageType) => void;
  currentUserId: string;
  client: ApiClient;
  onReactionUpdate: () => void;
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
};

export const Message: React.FC<MessageProps> = ({ 
  message, 
  onThreadCreate, 
  onThreadOpen,
  currentUserId,
  client,
  onReactionUpdate 
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const isOwnMessage = message.sender.id === currentUserId;
  
  const handleReactionSelect = async (emoji: string) => {
    try {
      await client.addReaction({
        message_id: message.id,
        reaction: emoji,
        user_id: currentUserId
      })
      onReactionUpdate();
    } catch (error) {
      console.error('Failed to add reaction:', error);
    } finally {
      setShowReactionPicker(false);
    }
  };

  const openThread = async () => {
    if (message.has_thread && message.thread_id) {
      try {
        // Fetch the thread channel details
        const response = await client.getChannel(message.thread_id);
        if (response.ok && response.channel) {
          console.log('Thread channel fetched:', response.channel);
          onThreadOpen(response.channel, message);
        } else {
          console.error('Failed to fetch thread channel:', response.message);
        }
      } catch (error) {
        console.error('Error fetching thread:', error);
      }
    }
  };

  const handleThreadCreate = async () => {
    // If thread exists, just open it and return early
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

  // Convert reactions object to array for rendering
  const reactionsList = Object.entries(message.reactions || {}).map(([emoji, count]) => ({
    emoji,
    count,
    users: [] // We don't have users info in the current API response
  }));

  return (
    <>
      <div className={`${styles.messageContainer} ${isOwnMessage ? styles.ownMessage : ''}`}>
        <div className={styles.avatar}>
          <img src={message.sender.profile_picture} alt={message.sender.username} />
        </div>

        <div className={styles.messageHeader}>
          <span className={styles.username}>{message.sender.username}</span>
          <span className={styles.timestamp}>{formatTimestamp(message.sent)}</span>
        </div>

        <div className={styles.messageContent}>
          {message.content || message.text}
        </div>

        {message.has_image && (
          <div className={styles.messageImage}>
            <img 
              src={message.image || `/api/messages/${message.id}/image`}
              alt="Attached media"
              className={styles.attachedImage}
              onClick={() => window.open(message.image || `/api/messages/${message.id}/image`, '_blank')}
            />
          </div>
        )}

        <div className={styles.reactions}>
          {Object.entries(message.reactions).map(([emoji, count]) => (
            <div key={emoji} className={styles.reaction}>
              <span>{emoji}</span>
              <span>{count}</span>
            </div>
          ))}
        </div>

        <div className={styles.threadSection}>
          {message.has_thread ? (
            <button 
              className={styles.viewRepliesLink}
              onClick={openThread}
            >
              View replies →
            </button>
          ) : (
            <button 
              className={styles.startThreadButton}
              onClick={handleThreadCreate}
            >
              <span role="img" aria-label="start thread">💬</span>
            </button>
          )}
        </div>
      </div>

      {showReactionPicker && (
        <ReactionPicker
          onSelect={handleReactionSelect}
          onClose={() => setShowReactionPicker(false)}
        />
      )}
    </>
  );
};