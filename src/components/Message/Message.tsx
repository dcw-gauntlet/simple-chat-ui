// Message.tsx
import React, { useState } from 'react';
import { Message as MessageType, Channel, ChannelType } from '../../types';
import { ReactionPicker } from '../ReactionPicker/ReactionPicker';
import { ApiClient } from '../../client';
import styles from './Message.module.css';

interface MessageProps {
  message: MessageType;
  onThreadCreate: (threadChannel: Channel) => void;
  onThreadOpen: (threadChannel: Channel) => void;
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

  const openThread = () => {
    if (message.has_thread && message.thread) {
      onThreadOpen(message.thread);
    }
  };

  const handleThreadCreate = async () => {
    // If thread exists, just open it and return early
    if (message.has_thread && message.thread) {
      onThreadCreate(message.thread);
      return;
    }

    // Only proceed with channel creation if there's no existing thread
    try {
      // Create a new channel for the thread
      const channelResponse = await client.createChannel({
        name: `Thread-${message.id}`,
        channel_type: ChannelType.THREAD,
        creator_id: currentUserId,
        description: `Thread for message: ${message.content || message.text}`,
        parent_message_id: message.id
      });

      if (!channelResponse.ok || !channelResponse.channel) {
        throw new Error('Failed to create thread channel');
      }

      // Associate it with the message
      const threadResponse = await client.addThread({
        message_id: message.id,
        channel_id: channelResponse.channel.id
      });

      if (!threadResponse.ok) {
        throw new Error('Failed to add thread to message');
      }

      // Update the UI
      onThreadCreate(channelResponse.channel);
    } catch (error) {
      console.error('Failed to create thread:', error);
      // You might want to show an error toast/notification here
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
              {message.thread?.members_count 
                ? `${message.thread.members_count} replies`
                : 'View replies'} →
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