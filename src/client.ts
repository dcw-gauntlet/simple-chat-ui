// apiClient.ts
import {
  UserStatus,
  ChannelType,
  User,
  Channel,
  ChannelMembership,
  Message,
} from './types';

const API_URL = 'http://venus:8080';

// ----- Server response types -----

// Generic "Response" from the Python server
export interface BaseResponse {
  message: string;
  ok: boolean;
}

// Response for the /login endpoint
interface LoginResponse extends BaseResponse {
  token: string;
  user: User;
}

// Response for the /create_channel endpoint
export interface ChannelResponse extends BaseResponse {
  channel: Channel;
}

// Response for the /join_channel endpoint
export interface JoinChannelResponse extends BaseResponse {
  channel_membership: ChannelMembership;
}

// Add new response type
interface GetConversationsResponse {
  ok: boolean;
  message: string;
  channels: Channel[];
}

// Add new response type
interface GetChannelMessagesResponse extends BaseResponse {
  messages: Message[];
}

// ----- Request body types -----

interface RegisterRequest {
  username: string;
  password: string;
  profile_picture: File;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  user: User;
  ok: boolean;
}

interface RegisterResponse {
  user: User;
  ok: boolean;
}

interface CreateChannelRequest {
  name: string;
  channel_type: ChannelType; // 'conversation' | 'thread' | 'dm'
  creator_id: string;
}

interface JoinChannelRequest {
  username: string;
  channel_name: string;
}

interface SendMessageRequest {
  channel_id: string;
  user_id: string;
  content: string;
}

interface SendMessageResponse extends BaseResponse {
  sent_message: Message;  // Changed from user_message to sent_message
}

interface ReactionRequest {
  message_id: string;
  reaction: string;
  user_id: string;
}

export class ApiClient {
  private baseUrl: string;
  // optionally store the token if you want to authenticate future calls
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // ----- Helper method for all fetch calls -----
  private async request<T>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, string> }
  ): Promise<T> {
    const { params, ...fetchOptions } = options;
    const queryString = params 
      ? '?' + new URLSearchParams(params).toString() 
      : '';
    
    const response = await fetch(
      `${this.baseUrl}${endpoint}${queryString}`, 
      fetchOptions
    );
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  // ----- Auth endpoints -----

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const formData = new FormData();
    formData.append('profile_picture', data.profile_picture);

    return this.request<RegisterResponse>('/register', {
      method: 'POST',
      body: formData,
      // Add query parameters for username and password
      params: {
        username: data.username,
        password: data.password
      }
    });
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  // ----- Channel endpoints -----

  async createChannel(data: CreateChannelRequest): Promise<ChannelResponse> {
    return this.request<ChannelResponse>('/create_channel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // If your server requires auth, pass the token here:
        // 'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(data),
    });
  }

  async joinChannel(data: JoinChannelRequest): Promise<JoinChannelResponse> {
    return this.request<JoinChannelResponse>('/join_channel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async getConversations(userId: string): Promise<GetConversationsResponse> {
    try {
      const response = await this.request<GetConversationsResponse>('/my_channels', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
        },
        // Add query parameter for user_id
        params: { user_id: userId }
      });
      return response;
    } catch (error) {
      return {
        ok: false,
        message: 'Failed to load conversations',
        channels: []
      };
    }
  }

  async getChannelMessages(channelId: string): Promise<GetChannelMessagesResponse> {
    try {
      return this.request<GetChannelMessagesResponse>('/get_channel_messages', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        params: { channel_id: channelId }
      });
    } catch (error) {
      console.error('Get messages error:', error);
      return {
        ok: false,
        message: 'Failed to load messages',
        messages: []
      };
    }
  }

  async sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await this.request<SendMessageResponse>('/send_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: data.channel_id,
          user_id: data.user_id,
          content: data.content
        })
      });
      console.log('Send message response:', response);
      return response;
    } catch (error) {
      console.error('Send message error:', error);
      return {
        ok: false,
        message: 'Failed to send message',
        sent_message: null as any
      };
    }
  }

  async addReaction(data: ReactionRequest): Promise<BaseResponse> {
    return this.request<BaseResponse>('/add_reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async removeReaction(data: ReactionRequest): Promise<BaseResponse> {
    return this.request<BaseResponse>('/remove_reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
}

export const client = new ApiClient(API_URL);