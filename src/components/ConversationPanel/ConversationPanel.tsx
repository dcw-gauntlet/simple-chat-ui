import React, { useState } from 'react';
import { RecentChannels } from './../RecentChannels/RecentChannels';
import { Channel, ChannelType } from './../../types';
import { ApiClient } from '../../client';
import styles from './ConversationPanel.module.css';

interface ConversationPanelProps {
  conversations: Channel[];
  onSelect: (channel: Channel) => void;
  client: ApiClient;
  username: string;
  onJoinSuccess: () => void;
}

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  conversations,
  onSelect,
  client,
  username,
  onJoinSuccess
}) => {
  const [channelName, setChannelName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleJoinConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await client.joinChannel({
        username: username,
        channel_name: channelName
      });

      if (response.ok) {
        setChannelName('');
        onJoinSuccess();
      } else {
        setError(response.message || 'Failed to join conversation');
      }
    } catch (err) {
      setError('Unable to join conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await client.createChannel({
        name: channelName,
        channel_type: ChannelType.GROUP,
        creator_id: username
      });

      if (response.ok) {
        setChannelName('');
        onJoinSuccess();
      } else {
        setError(response.message || 'Failed to create conversation');
      }
    } catch (err) {
      setError('Unable to create conversation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={isCreating ? handleCreateConversation : handleJoinConversation} className={styles.joinForm}>
        <input
          type="text"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder={isCreating ? "New conversation name" : "Enter conversation name"}
          disabled={isLoading}
        />
        <div className={styles.buttonGroup}>
          <button 
            type="submit" 
            disabled={isLoading}
            className={isCreating ? styles.createButton : styles.joinButton}
          >
            {isLoading 
              ? 'Please wait...' 
              : isCreating 
                ? 'Create' 
                : 'Join'}
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(!isCreating)}
            disabled={isLoading}
            className={styles.switchButton}
          >
            {isCreating ? 'Join Instead' : 'Create New'}
          </button>
        </div>
      </form>
      {error && <div className={styles.error}>{error}</div>}
      
      <RecentChannels
        title="Recent Conversations"
        channels={conversations}
        onChannelSelect={onSelect}
      />
    </div>
  );
};
