import React from 'react';
import './SearchResult.css';
import { Message as MessageComponent } from '../Message/Message';
import { Message, User } from '../../types';
import { client } from '../../client';

interface SearchResultProps {
  channelName: string;
  channelId: string;
  message: {
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
  };
  previous_message: Message | null;
  next_message: Message | null;
  score: number;
  onClick: () => void;
}

export const SearchResult: React.FC<SearchResultProps> = ({
  channelName,
  message,
  previous_message,
  next_message,
  onClick,
}) => {
  // Dummy handlers since we don't need thread/reaction functionality in search results
  const noopHandler = () => {};
  
  return (
    <div onClick={onClick} className="search-result">
      <div className="search-result__channel">
        #{channelName}
      </div>
      
      <div className="search-result__messages">
        {previous_message && (
          <div className="search-result__context-message">
            <MessageComponent
              message={previous_message}
              onThreadCreate={noopHandler}
              onThreadOpen={noopHandler}
              currentUserId=""
              onStartDM={noopHandler}
              client={client}
              isSearchResult={true} // New prop to disable interactive features
            />
          </div>
        )}
        
        <div className="search-result__matched-message">
          <MessageComponent
            message={message}
            onThreadCreate={noopHandler}
            onThreadOpen={noopHandler}
            currentUserId=""
            onStartDM={noopHandler}
            client={client}
            isSearchResult={true}
          />
        </div>
        
        {next_message && (
          <div className="search-result__context-message">
            <MessageComponent
              message={next_message}
              onThreadCreate={noopHandler}
              onThreadOpen={noopHandler}
              currentUserId=""
              onStartDM={noopHandler}
              client={client}
              isSearchResult={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};
