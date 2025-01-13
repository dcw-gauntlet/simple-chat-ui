import React, { useState } from 'react';
import { 
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchFieldProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchField: React.FC<SearchFieldProps> = ({ 
  onSearch,
  placeholder = "Search..."
}) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <TextField
        fullWidth
        size="small"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconButton 
                size="small" 
                type="submit"
                sx={{ p: '4px' }}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'background.paper',
          }
        }}
      />
    </form>
  );
};
