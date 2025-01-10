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
  reactions: { [key: string]: number };
  has_thread: boolean;
  has_image: boolean;
  thread_id?: string;
  image?: string;
  file_id?: string;
  file_name?: string;
  file_content_type?: string;
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

export interface UserStatusResponse extends BaseResponse {
  user_status: UserStatus;
}

export interface SendMessageRequest {
  channel_id: string;
  user_id: string;
  content: string;
  file_id?: string;
  file_name?: string;
  file_content_type?: string;
}


/*
class SearchResult(BaseModel):
    channel_id: str
    channel_name: str
    message: Message
    previous_message: Optional[Message] = None
    next_message: Optional[Message] = None
    score: float
*/

export interface SearchResultData {
  channel_id: string;
  channel_name: string;
  message: Message;
  previous_message: Message | null;
  next_message: Message | null;
  score: number;
}

export interface SearchResponse extends BaseResponse {
  results: SearchResultData[];
}
