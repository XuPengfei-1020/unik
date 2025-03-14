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
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: isMobile ? '100%' : 280,
            mb: isMobile ? 2 : 0,
            flexShrink: 0
          }}
        >
          <Typography
            variant="subtitle1"
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

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <SearchBar onSearch={onSearch} />
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={onAddRule}
              sx={{
                height: '45px',
                px: 2,
                backgroundColor: 'white',
                color: 'primary.main',
                flexShrink: 0,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                }
              }}
            >
              添加规则
            </Button>
          </Paper>

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