// Message.tsx
import React, { useState } from 'react';
import { Message as MessageType, Channel } from '../../types';
import { ReactionPicker } from '../ReactionPicker/ReactionPicker';
import { UserPanel } from '../UserPanel/UserPanel';
import { ApiClient } from '../../client';
import styles from './Message.module.css';
import { Avatar } from '../ui';
import { ChannelType, UserStatus } from '../../types';

interface MessageProps {
  message: MessageType;
  onThreadCreate: (messageId: string) => void;
  onThreadOpen: (channel: Channel, parentMessage: MessageType) => void;
  currentUserId: string;
  onStartDM: (userId: string) => void;
  client: ApiClient;
  onReactionUpdate?: () => void;
  isSearchResult?: boolean;
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
  onStartDM,
  client,
  onReactionUpdate,
  isSearchResult = false
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const isOwnMessage = message.sender.id === currentUserId;
  
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
      setShowReactionPicker(false);
    }
  };

  const openThread = async () => {
    if (message.has_thread && message.thread_id) {
      try {
        const response = await client.getChannel(message.thread_id);
        if (response.ok && response.channel) {
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

  // Convert reactions object to array for rendering
  const reactionsList = Object.entries(message.reactions || {}).map(([emoji, count]) => ({
    emoji,
    count,
    users: [] // We don't have users info in the current API response
  }));

  // Don't show interactive elements in search results
  if (isSearchResult) {
    return (
      <div className={`${styles.messageContainer} ${styles.searchResult}`}>
        <div className={styles.avatar}>
          <Avatar
            src={message.sender.profile_picture}
            username={message.sender.username}
            userId={message.sender.id}
            size="small"
          />
        </div>

        <div className={styles.messageHeader}>
          <span className={styles.username}>{message.sender.username}</span>
          <span className={styles.timestamp}>{formatTimestamp(message.sent)}</span>
        </div>

        <div className={styles.messageContent}>
          {message.content || message.text}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${styles.messageContainer} ${isOwnMessage ? styles.ownMessage : ''}`}>
        <div className={styles.avatar}>
          <Avatar
            src={message.sender.profile_picture}
            username={message.sender.username}
            userId={message.sender.id}
            size="medium"
            onClick={() => setShowUserPanel(true)}
          />
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

        {message.file_id && (
          <div className={styles.fileAttachment}>
            <div className={styles.fileIcon}>
              📎
            </div>
            <div className={styles.fileInfo}>
              <span className={styles.fileName}>{message.file_name}</span>
              <span className={styles.fileType}>{message.file_content_type}</span>
            </div>
            <button 
              className={styles.downloadButton}
              onClick={handleFileDownload}
              aria-label="Download file"
            >
              Download
            </button>
          </div>
        )}

        <div className={styles.reactions}>
          {reactionsList.map(({emoji, count}) => (
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
      
      <UserPanel
        isOpen={showUserPanel}
        onClose={() => setShowUserPanel(false)}
        username={message.sender.username}
        avatarUrl={message.sender.profile_picture}
        status={message.sender.status as UserStatus}
        userId={message.sender.id}
        onStartDM={onStartDM}
      />
    </>
  );
};