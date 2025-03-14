import { Box, Paper, Typography, useMediaQuery, useTheme, Button } from '@mui/material';
import { FilterList as FilterIcon, Add as AddIcon } from '@mui/icons-material';
import { DomainList } from '../filter/DomainList';
import { SearchBar } from '../filter/SearchBar';
import { RuleList } from '../rules/RuleList';

export function MainContent({
  rules,
  domains,
  selectedDomain,
  onDomainSelect,
  onSearch,
  onEdit,
  onDelete,
  onAddRule
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box>
      <Box
        display="flex"
        className="responsive-container"
        sx={{ gap: 3 }}
      >
        <Paper
          elevation={0}
          className="domain-list-container domain-list-paper"
          sx={{
            width: isMobile ? '100%' : 280,
            mb: isMobile ? 2 : 0
          }}
        >
          <Typography
            variant="subtitle1"
            className="domain-list-title"
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 1.5,
              borderColor: 'divider'
            }}
          >
            <FilterIcon sx={{ mr: 1, fontSize: 20 }} />
            域名筛选
          </Typography>
          <DomainList
            domains={domains}
            selectedDomain={selectedDomain}
            onDomainSelect={onDomainSelect}
          />
        </Paper>

        <Box flex={1}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2
              }}
              className="search-bar"
            >
              <SearchBar onSearch={onSearch} />
            </Paper>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={onAddRule}
              sx={{
                borderRadius: '20px',
                px: 2,
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                }
              }}
            >
              添加规则
            </Button>
          </Box>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                规则列表 {rules.length > 0 && `(${rules.length})`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedDomain ? `当前筛选: ${selectedDomain}` : '显示所有规则'}
              </Typography>
            </Box>
            <RuleList
              rules={rules}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}