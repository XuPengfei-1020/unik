import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Divider,
  Badge,
  Box,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Public as PublicIcon,
  ArrowRight as ArrowRightIcon
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { getDomainIcon, sortDomains } from '../../utils/domainUtils';

export function DomainList({ rules, domains, selectedDomain, onDomainSelect }) {
  const [domainIcons, setDomainIcons] = useState({});
  const sortedDomains = sortDomains(domains);

  useEffect(() => {
    // 异步加载所有域名的图标
    const loadDomainIcons = async () => {
      const icons = {};
      for (const domain of domains) {
        const icon = await getDomainIcon(domain);
        if (icon) {
          icons[domain] = icon;
        }
      }
      setDomainIcons(icons);
    };

    loadDomainIcons();
  }, [domains]);

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
                  所有规则
                </Typography>
                <Badge
                  badgeContent={rules.length}
                  color="primary"
                  sx={{ ml: 1 }}
                  size="small"
                />
              </Box>
            }
          />
        </ListItemButton>
      </ListItem>

      {rules.length > 0 && <Divider sx={{ my: 1 }} />}

      {sortedDomains.map((domain) => (
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
              {domainIcons[domain] ? (
                <img
                  src={domainIcons[domain]}
                  alt={`${domain} icon`}
                  style={{ width: 24, height: 24 }}
                />
              ) : (
                <LanguageIcon />
              )}
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