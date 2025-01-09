export interface User {
  id: string;
  created_at: string;
  username: string;
  password: string;
  token: string;
  status: 'online' | 'offline' | 'away' | 'do_not_disturb' | 'invisible';
  profile_picture: string;
}

export interface Message {
  id: string;
  sent: string;
  text: string;
  content: string;
  channel_id: string;
  sender: {
    id: string;
    username: string;
    profile_picture: string;
    status: UserStatus;
  };
  reactions: { [emoji: string]: number };
  has_thread: boolean;
  has_image: boolean;
  thread_id: string;
  image?: string;
}

export interface PopulatedMessage extends Omit<Message, 'sender'> {
  sender: User;
}

export enum ChannelType {
  CONVERSATION = 'conversation',
  THREAD = 'thread',
  DM = 'dm',
  ALL = 'all',
}

export interface Channel {
  id: string;
  name: string;
  created_at: string;
  channel_type: ChannelType;
  description: string;
  members_count: number;
}

export interface ChannelMembership {
  user_id: string;
  channel_id: string;
  created_at: string;
}

export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  DO_NOT_DISTURB = 'do_not_disturb',
  INVISIBLE = 'invisible',
}

export interface BaseResponse {
  message: string;
  ok: boolean;
}

export interface UserResponse extends BaseResponse {
  user: User;
}