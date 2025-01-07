

export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  DO_NOT_DISTURB = 'do_not_disturb',
  INVISIBLE = 'invisible',
 }

export enum ChannelType {
  GROUP = 'conversation',
  THREAD = 'thread',
  DM = 'dm',
}

export type User = {
  id: string;
  created_at: string;
  username: string;
  password: string;
  token: string;
  status: UserStatus;
  profile_picture: string;
}

export type Channel = {
  id: string;
  created_at: string;
  name: string;
  type: ChannelType;
}

export type ChannelMembership = {
    user_id: string;
    channel_id: string;
}

export type Message = {
    id: string;
    sent: string;
    content: string;
    channel_id: string;
    sub_channel_id?: string;
    text: string;
    sender: User;
}

