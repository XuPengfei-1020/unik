import { useState } from 'react';
import {
  Paper,
  InputBase,
  IconButton,
  Tooltip
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

  return (
    <Paper
      component="form"
      sx={{
        p: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        mb: 2
      }}
      onSubmit={e => e.preventDefault()}
    >
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder="搜索规则..."
        value={searchTerm}
        onChange={e => handleSearch(e.target.value)}
      />
      {searchTerm && (
        <Tooltip title="清除">
          <IconButton
            size="small"
            onClick={handleClear}
          >
            <ClearIcon />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="搜索">
        <IconButton type="submit" sx={{ p: '10px' }}>
          <SearchIcon />
        </IconButton>
      </Tooltip>
    </Paper>
  );
}