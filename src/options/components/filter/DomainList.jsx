import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Paper,
  Typography,
  Divider,
  Badge,
  Box
} from '@mui/material';
import {
  Language as LanguageIcon,
  Public as PublicIcon,
  ArrowRight as ArrowRightIcon
} from '@mui/icons-material';

export function DomainList({ domains, selectedDomain, onDomainSelect }) {
  return (
    <List sx={{ py: 0 }}>
      <ListItem disablePadding>
        <ListItemButton
          selected={!selectedDomain}
          onClick={() => onDomainSelect('')}
          sx={{
            borderRadius: '4px',
            py: 1
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <PublicIcon
              fontSize="small"
              color={!selectedDomain ? 'primary' : 'action'}
            />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: !selectedDomain ? 500 : 400
                  }}
                >
                  所有域名
                </Typography>
                <Badge
                  badgeContent={domains.length}
                  color="primary"
                  sx={{ ml: 1 }}
                  size="small"
                />
              </Box>
            }
          />
        </ListItemButton>
      </ListItem>

      {domains.length > 0 && <Divider sx={{ my: 1 }} />}

      {domains.map(domain => (
        <ListItem key={domain} disablePadding>
          <ListItemButton
            selected={domain === selectedDomain}
            onClick={() => onDomainSelect(domain)}
            sx={{
              borderRadius: '4px',
              py: 1
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <LanguageIcon
                fontSize="small"
                color={domain === selectedDomain ? 'primary' : 'action'}
              />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: domain === selectedDomain ? 500 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {domain}
                </Typography>
              }
            />
            {domain === selectedDomain && (
              <ArrowRightIcon
                fontSize="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </ListItemButton>
        </ListItem>
      ))}

      {!domains.length && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            暂无域名
          </Typography>
        </Box>
      )}
    </List>
  );
}