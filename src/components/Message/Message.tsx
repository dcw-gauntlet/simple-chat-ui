import React, { useState } from 'react';
import { Message as MessageType } from '../../types';
import { ReactionPicker } from '../ReactionPicker/ReactionPicker';
import { ApiClient } from '../../client';
import styles from './Message.module.css';

interface MessageProps {
  message: MessageType;
  onThreadCreate: () => void;
  currentUserId: string;
  client: ApiClient;
  onReactionUpdate: () => void;
}

export const Message: React.FC<MessageProps> = ({ 
  message, 
  onThreadCreate, 
  currentUserId,
  client,
  onReactionUpdate 
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  
  // Compare the sender's ID with currentUserId
  const isOwnMessage = message.sender.id === currentUserId;

  const handleReaction = async (reaction: string) => {
    try {
      const response = await client.addReaction({
        message_id: message.id,
        reaction,
        user_id: currentUserId
      });
      
      if (response.ok) {
        onReactionUpdate();
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  return (
    <>
      <div 
        className={`${styles.messageContainer} ${isOwnMessage ? styles.ownMessage : ''}`}
        onDoubleClick={() => setShowReactionPicker(true)}
      >
        {!isOwnMessage && (
          <div className={styles.avatar}>
            <img 
              src={message.sender.profile_picture}
              alt={message.sender.username}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://placecats.com/50/50";
              }}
            />
          </div>
        )}
        <div className={styles.messageContent}>
          <div className={styles.messageHeader}>
            <span className={styles.username}>{message.sender.username}</span>
            <span className={styles.timestamp}>
              {new Date(message.sent).toLocaleTimeString()}
            </span>
          </div>
          <div className={`${styles.messageText} ${isOwnMessage ? styles.ownMessageText : ''}`}>
            {message.text}
          </div>
          {Object.entries(message.reactions || {}).length > 0 && (
            <div className={styles.reactions}>
              {Object.entries(message.reactions)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([reaction, count]) => (
                  <span key={reaction} className={styles.reaction}>
                    {reaction} {count}
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>

      {showReactionPicker && (
        <ReactionPicker
          onSelect={handleReaction}
          onClose={() => setShowReactionPicker(false)}
        />
      )}
    </>
  );
};
