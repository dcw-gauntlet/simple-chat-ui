import React from 'react';
import { Channel } from '../../types';
import { ChannelDisplay } from '../ChannelDisplay/ChannelDisplay';
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
              <ChannelDisplay channel={channel} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
