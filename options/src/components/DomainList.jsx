import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography
} from '@mui/material';

export function DomainList({ domains, selectedDomain, onDomainSelect }) {
  return (
    <Paper sx={{ width: 240, mr: 2 }}>
      <List>
        <ListItem disablePadding>
          <ListItemButton
            selected={!selectedDomain}
            onClick={() => onDomainSelect('')}
          >
            <ListItemText primary="所有域名" />
          </ListItemButton>
        </ListItem>
        {domains.map(domain => (
          <ListItem key={domain} disablePadding>
            <ListItemButton
              selected={domain === selectedDomain}
              onClick={() => onDomainSelect(domain)}
            >
              <ListItemText primary={domain} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {!domains.length && (
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ p: 2 }}
        >
          暂无域名
        </Typography>
      )}
    </Paper>
  );
}