
import React from 'react';
import { RecentChannels } from '../RecentChannels/RecentChannels';
import { Channel, ChannelType } from './../../types';

interface UserPanelProps {
  dms: Channel[];
  onSelect: (channel: Channel) => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({
  dms,
  onSelect
}) => (
  <RecentChannels
    title="Direct Messages"
    channels={dms}
    channelType={ChannelType.DM}
    onChannelSelect={onSelect}
  />
);
