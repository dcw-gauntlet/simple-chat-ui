import React from 'react';
import { SearchResult } from './SearchResult';
import './SearchPanel.css';
import { Message, User } from '../../types';

interface SearchResultData {
  channel_name: string;
  channel_id: string;
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
}

interface SearchPanelProps {
  searchResults?: SearchResultData[];
  onResultClick: (channelId: string) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ 
  searchResults = [],
  onResultClick 
}) => {
  if (!searchResults || searchResults.length === 0) {
    return (
      <div className="search-panel__empty">
        <span className="search-panel__empty-text">No results found</span>
      </div>
    );
  }

  return (
    <div className="search-panel">
      {searchResults.map((result) => (
        <SearchResult
          key={result.message.id}
          channelName={result.channel_name}
          channelId={result.channel_id}
          message={result.message}
          previous_message={result.previous_message}
          next_message={result.next_message}
          score={result.score}
          onClick={() => onResultClick(result.channel_id)}
        />
      ))}
    </div>
  );
};
