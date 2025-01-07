import React from 'react';
import { Channel, ChannelType } from '../../types';
import styles from './RecentChannels.module.css';

interface RecentChannelsProps {
  title: string;
  channels: Channel[];
  onChannelSelect: (channel: Channel) => void;
}

export const RecentChannels: React.FC<RecentChannelsProps> = ({
  title,
  channels,
  onChannelSelect,
}) => {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      {channels.length === 0 ? (
        <div className={styles.empty}>No conversations yet</div>
      ) : (
        <ul className={styles.channelList}>
          {channels.map((channel) => (
            <li 
              key={channel.id}
              className={styles.channelItem}
              onClick={() => onChannelSelect(channel)}
            >
              <div className={styles.channelName}>{channel.name}</div>
              <div className={styles.channelMeta}>
                {new Date(channel.created_at).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
