// apiClient.ts
import {
  UserStatus,
  ChannelType,
  User,
  Channel,
  ChannelMembership,
  Message,
  UserResponse,
  UserStatusResponse,
  SearchResponse,
  BaseResponse
} from './types';

const API_URL = 'http://venus:8080';

// ----- Server response types -----

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

// Add new response type
interface SearchChannelsResponse extends BaseResponse {
  channels: Channel[];
}

// Add new request/response types
interface AddThreadRequest {
  message_id: string;
  channel_id: string;
}

// Add new response type
interface GetChannelResponse extends BaseResponse {
  channel: Channel;
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
  channel_type: ChannelType;
  creator_id: string;
  description: string;
  recipient_id?: string;
  parent_channel_id?: string;
  parent_message_id?: string;
}

interface JoinChannelRequest {
  username: string;
  channel_name: string;
}

interface SendMessageRequest {
  channel_id: string;
  user_id: string;
  content: string;
  file_id?: string;
  filename?: string;
  content_type?: string;
}

interface SendMessageResponse extends BaseResponse {
  sent_message: Message;  // This should contain the server-generated message ID
}

interface ReactionRequest {
  message_id: string;
  reaction: string;
  user_id: string;
}

interface UserStatusCache {
  status: UserStatus;
  lastCheck: number;
}

// Add new response type
interface FileUploadResponse extends BaseResponse {
  file_id: string;
}

// Add new request/response types
interface SearchRequest {
  query: string;
  userId: string;
}


export class ApiClient {
  private baseUrl: string;
  // optionally store the token if you want to authenticate future calls
  private token: string | null = null;
  private userStatusCache: Map<string, UserStatusCache> = new Map();
  private readonly STATUS_CACHE_TTL = 5000; // 5 seconds in milliseconds
  // Add new property for pending requests
  private pendingStatusRequests: Map<string, Promise<UserStatus>> = new Map();

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    console.log(this.token);
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

  async createChannel(params: CreateChannelRequest): Promise<ChannelResponse> {
    return this.request<ChannelResponse>('/create_channel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          channel_type: ChannelType.CONVERSATION
        })
      });
      return response;
    } catch (error) {
      console.error('Get conversations error:', error);
      return {
        ok: false,
        message: 'Failed to get conversations',
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

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>('/send_message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel_id: request.channel_id,
        user_id: request.user_id,
        content: request.content,
        file_id: request.file_id,
        filename: request.filename,
        content_type: request.content_type
      })
    });
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

  async searchChannels(prefix: string): Promise<SearchChannelsResponse> {
    try {
      return this.request<SearchChannelsResponse>('/search_channels', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        params: { prefix }
      });
    } catch (error) {
      console.error('Search channels error:', error);
      return {
        ok: false,
        message: 'Failed to search channels',
        channels: []
      };
    }
  }

  async addThread(data: AddThreadRequest): Promise<BaseResponse> {
    try {
      return this.request<BaseResponse>('/add_thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: data.message_id,
          channel_id: data.channel_id
        })
      });
    } catch (error) {
      console.error('Add thread error:', error);
      return {
        ok: false,
        message: 'Failed to add thread'
      };
    }
  }

  async getChannel(channelId: string): Promise<GetChannelResponse> {
    try {
      return this.request<GetChannelResponse>(`/get_channel/${channelId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Get channel error:', error);
      return {
        ok: false,
        message: 'Failed to get channel',
        channel: null as any
      };
    }
  }

  // Add a method specifically for getting thread channels if needed
  async getThreadChannels(userId: string): Promise<GetConversationsResponse> {
    try {
      return this.request<GetConversationsResponse>('/my_channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          channel_type: ChannelType.THREAD
        })
      });
    } catch (error) {
      console.error('Get thread channels error:', error);
      return {
        ok: false,
        message: 'Failed to get thread channels',
        channels: []
      };
    }
  }

  // Add a method for getting DM channels if needed
  async getDMChannels(userId: string): Promise<GetConversationsResponse> {
    try {
      const response = await this.request<GetConversationsResponse>('/my_channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          channel_type: ChannelType.DM
        })
      });
      return response;
    } catch (error) {
      console.error('Get DM channels error:', error);
      return {
        ok: false,
        message: 'Failed to get DM channels',
        channels: []
      };
    }
  }

  async getUser(userId: string): Promise<UserResponse> {
    return this.request<UserResponse>('/get_user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
  }

  async getUserStatus(userId: string): Promise<UserStatus> {
    const now = Date.now();
    const cached = this.userStatusCache.get(userId);

    // Return cached value if it's fresh
    if (cached && (now - cached.lastCheck < this.STATUS_CACHE_TTL)) {
      return cached.status;
    }

    // Check if there's already a pending request for this user
    const pendingRequest = this.pendingStatusRequests.get(userId);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Create new request and store it
    const statusPromise = (async () => {
      try {
        const response = await this.request<UserStatusResponse>('/user_status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request_user_id: userId })
        });

        // Update cache
        this.userStatusCache.set(userId, {
          status: response.user_status,
          lastCheck: now
        });

        return response.user_status;
      } catch (error) {
        console.error('Get user status error:', error);
        if (cached) {
          return cached.status;
        }
        return UserStatus.OFFLINE;
      } finally {
        // Clean up pending request
        this.pendingStatusRequests.delete(userId);
      }
    })();

    // Store the pending request
    this.pendingStatusRequests.set(userId, statusPromise);
    return statusPromise;
  }

  // Update clear cache method to also clear pending requests
  clearUserStatusCache(userId?: string) {
    if (userId) {
      this.userStatusCache.delete(userId);
      this.pendingStatusRequests.delete(userId);
    } else {
      this.userStatusCache.clear();
      this.pendingStatusRequests.clear();
    }
  }

  async uploadFile(file: File): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      return this.request<FileUploadResponse>('/upload_file', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      });
    } catch (error) {
      console.error('Upload file error:', error);
      return {
        ok: false,
        message: 'Failed to upload file',
        file_id: null as any
      };
    }
  }

  // Returns a URL that can be used to download the file
  getFileDownloadUrl(fileId: string): string {
    return `${this.baseUrl}/download_file/${fileId}`;
  }

  // Helper method to directly download a file
  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(this.getFileDownloadUrl(fileId));
    if (!response.ok) {
      throw new Error('Failed to download file');
    }
    return response.blob();
  }

  async searchMessages(request: SearchRequest): Promise<SearchResponse> {
    try {
      return this.request<SearchResponse>('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search_query: request.query,
          user_id: request.userId
        })
      });
    } catch (error) {
      console.error('Search messages error:', error);
      return {
        ok: false,
        message: 'Failed to search messages',
        results: []
      };
    }
  }
}


export const client = new ApiClient(API_URL);