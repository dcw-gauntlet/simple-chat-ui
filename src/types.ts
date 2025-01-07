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
  sender: User;
  content: string;
  channel_id: string;
  reactions: Record<string, number>;
}

export interface PopulatedMessage extends Omit<Message, 'sender'> {
  sender: User;
}

export interface Channel {
  id: string;
  name: string;
  created_at: string;
}