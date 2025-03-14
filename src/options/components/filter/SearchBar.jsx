import { useState } from 'react';
import {
  Paper,
  InputBase,
  IconButton,
  Tooltip,
  Box,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

export function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <InputBase
        fullWidth
        placeholder="搜索规则..."
        value={searchTerm}
        onChange={e => handleSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        className="search-input"
        sx={{
          px: 2,
          py: 1,
          borderRadius: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.03)',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          },
          '&.Mui-focused': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
          }
        }}
        startAdornment={
          <InputAdornment position="start">
            <SearchIcon color="action" fontSize="small" />
          </InputAdornment>
        }
        endAdornment={
          searchTerm && (
            <InputAdornment position="end">
              <Tooltip title="清除搜索">
                <IconButton
                  size="small"
                  onClick={handleClear}
                  edge="end"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    }
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          )
        }
      />
    </Box>
  );
}