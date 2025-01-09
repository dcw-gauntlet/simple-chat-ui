import React, { useState, useEffect } from 'react';
import { RecentChannels } from './../RecentChannels/RecentChannels';
import { Channel, ChannelType } from './../../types';
import { ApiClient } from '../../client';
import styles from './ConversationPanel.module.css';
import { ChannelDisplay } from '../ChannelDisplay/ChannelDisplay';
import { User } from '../../types';

interface ConversationPanelProps {
  conversations: Channel[];
  onSelect: (channel: Channel) => void;
  client: ApiClient;
  user: User;
  onJoinSuccess: () => void;
}

// Create a separate component for search results
const SearchResults: React.FC<{
  isLoading: boolean;
  searchQuery: string;
  searchResults: Channel[];
  onJoinChannel: (name: string) => void;
  error: string;
}> = ({ isLoading, searchQuery, searchResults, onJoinChannel, error }) => {
  return (
    <div className={styles.searchResults}>
      {error && <div className={styles.error}>{error}</div>}
      
      {searchResults.map((channel) => (
        <div 
          key={channel.id}
          className={styles.searchResult}
          onClick={() => onJoinChannel(channel.name)}
        >
          <ChannelDisplay channel={channel} />
        </div>
      ))}
      
      {isLoading && (
        <div className={styles.loadingIndicator}>
          Searching...
        </div>
      )}
      {!isLoading && searchQuery && searchResults.length === 0 && (
        <div className={styles.loadingIndicator}>
          No conversations found
        </div>
      )}
    </div>
  );
};

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  conversations,
  onSelect,
  client,
  user,
  onJoinSuccess
}) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    if (!showSearchModal) return;

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchQuery.trim()) {
      const timeout = setTimeout(async () => {
        setIsLoading(true);
        try {
          const response = await client.searchChannels(searchQuery);
          if (response.ok) {
            setSearchResults(response.channels);
          } else {
            setError(response.message || 'Failed to search conversations');
          }
        } catch (err) {
          setError('Unable to search conversations');
        } finally {
          setIsLoading(false);
        }
      }, 300); // 300ms delay

      setSearchTimeout(timeout);
    } else {
      setSearchResults([]); // Clear results if search is empty
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery, showSearchModal]);

  const handleJoinConversation = async (channelName: string) => {
    setJoinError('');
    setError('');
    setIsLoading(true);

    try {
      const response = await client.joinChannel({
        username: user.username,
        channel_name: channelName
      });

      if (response.ok) {
        setShowSearchModal(false);
        setSearchQuery('');
        setSearchResults([]);
        onJoinSuccess();
      } else {
        if (response.message.includes('already in the channel')) {
          setJoinError('You are already a member of this conversation');
        } else {
          setJoinError(response.message || 'Failed to join conversation');
        }
      }
    } catch (err) {
      setJoinError('Unable to join conversation. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    setError('');
    setIsLoading(true);

    try {
      const createResponse = await client.createChannel({
        name: newChannelName,
        channel_type: ChannelType.CONVERSATION,
        creator_id: user.id,
        description: newChannelDescription
      });

      if (createResponse.ok && createResponse.channel) {
        const joinResponse = await client.joinChannel({
          username: user.username,
          channel_name: createResponse.channel.name
        });

        if (joinResponse.ok) {
          setShowCreateModal(false);
          setNewChannelName('');
          setNewChannelDescription('');
          onJoinSuccess();
        } else {
          setError('Created conversation but failed to join: ' + joinResponse.message);
        }
      } else {
        setError(createResponse.message || 'Failed to create conversation');
      }
    } catch (err) {
      setError('Unable to create conversation');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Conversations</h2>
        <div className={styles.buttonGroup}>
          <button
            onClick={() => setShowSearchModal(true)}
            disabled={isLoading}
            className={styles.joinButton}
          >
            Find
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={isLoading}
            className={styles.createButton}
          >
            Create
          </button>
        </div>
      </div>

      {showSearchModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.searchBar}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                disabled={isLoading}
                autoFocus
              />
            </div>
            
            <SearchResults
              isLoading={isLoading}
              searchQuery={searchQuery}
              searchResults={searchResults}
              onJoinChannel={handleJoinConversation}
              error={joinError}
            />
            
            <button 
              onClick={() => {
                setShowSearchModal(false);
                setSearchQuery('');
                setSearchResults([]);
                setJoinError('');
              }}
              className={styles.closeButton}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Create New Conversation</h3>
            <div className={styles.createForm}>
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Enter conversation name..."
                disabled={isLoading}
              />
              <textarea
                value={newChannelDescription}
                onChange={(e) => setNewChannelDescription(e.target.value)}
                placeholder="Enter conversation description..."
                disabled={isLoading}
                className={styles.descriptionInput}
              />
              <div className={styles.modalButtons}>
                <button 
                  onClick={handleCreateConversation}
                  disabled={isLoading || !newChannelName.trim()}
                  className={styles.createButton}
                >
                  Create
                </button>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewChannelName('');
                    setNewChannelDescription('');
                  }}
                  className={styles.closeButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
      
      <RecentChannels
        title="Recent Conversations"
        channels={conversations}
        onChannelSelect={onSelect}
      />
    </div>
  );
};
