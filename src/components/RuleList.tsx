const columns: GridColDef[] = [
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'enabled', headerName: 'Enabled', type: 'boolean', width: 100 },
  { field: 'urlPattern', headerName: 'URL Pattern', flex: 1 },
  { field: 'titlePattern', headerName: 'Title Pattern', flex: 1 },
  { field: 'replacement', headerName: 'Replacement', flex: 1 },
  { field: 'priority', headerName: 'Priority', type: 'number', width: 100 },
  // ... 操作列保持不变
];