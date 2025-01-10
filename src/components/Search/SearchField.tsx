import React, { useState, ChangeEvent } from 'react';
import './SearchField.css';

interface SearchFieldProps {
  onSearch: (query: string) => void;
}

export const SearchField: React.FC<SearchFieldProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onSearch(newValue);
  };

  return (
    <div className="search-field">
      <input
        type="text"
        className="search-field__input"
        placeholder="Search messages..."
        value={searchQuery}
        onChange={handleChange}
      />
      <div className="search-field__icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M15.7 14.3L11.5 10.1C12.4 9 13 7.6 13 6C13 2.7 10.3 0 7 0C3.7 0 1 2.7 1 6C1 9.3 3.7 12 7 12C8.6 12 10 11.4 11.1 10.5L15.3 14.7C15.5 14.9 15.8 15 16 15C16.2 15 16.5 14.9 16.7 14.7C17.1 14.3 17.1 13.7 15.7 14.3ZM7 10C4.8 10 3 8.2 3 6C3 3.8 4.8 2 7 2C9.2 2 11 3.8 11 6C11 8.2 9.2 10 7 10Z"
            fill="#666666"
          />
        </svg>
      </div>
    </div>
  );
};
