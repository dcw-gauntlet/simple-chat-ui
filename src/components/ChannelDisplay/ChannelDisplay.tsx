import React from 'react';
import { Channel } from '../../types';
import styles from './ChannelDisplay.module.css';

interface ChannelDisplayProps {
  channel: Channel;
}

export const ChannelDisplay: React.FC<ChannelDisplayProps> = ({ channel }) => {
  const formattedDate = new Date(channel.created_at).toLocaleDateString();
  
  return (
    <div className={styles.channelContainer}>
      <div className={styles.channelHeader}>
        <h3 className={styles.channelName}>{channel.name}</h3>
        <span className={styles.memberCount}>
          {channel.members_count} {channel.members_count === 1 ? 'member' : 'members'}
        </span>
      </div>
      
      {channel.description && (
        <p className={styles.description}>{channel.description}</p>
      )}
      
      <div className={styles.metadata}>
        <span className={styles.created}>Created: {formattedDate}</span>
      </div>
    </div>
  );
};