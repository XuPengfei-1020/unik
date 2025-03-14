import { Box, Paper, Typography, useMediaQuery, useTheme, Button } from '@mui/material';
import { FilterList as FilterIcon, Add as AddIcon } from '@mui/icons-material';
import { DomainList } from '../filter/DomainList';
import { SearchBar } from '../filter/SearchBar';
import { RuleList } from '../rules/RuleList';
import { styled } from '@mui/material/styles';

// 添加自定义滚动条样式
const ScrollableBox = styled(Box)({
  '&::-webkit-scrollbar': {
    display: 'none'
  },
  scrollbarWidth: 'none',
  msOverflowStyle: 'none'
});

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
  const isWideScreen = useMediaQuery(theme.breakpoints.up('xl'));

  return (
    <Box sx={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      p: '10px 24px',
      boxSizing: 'border-box'
    }}>
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flex: 1,
          overflow: 'hidden',
          width: '100%',
          maxWidth: isWideScreen ? '1600px' : '1200px',
          mx: 'auto'
        }}
      >
        {!isMobile && (
          <Paper
            elevation={0}
            sx={{
              width: 280,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <ScrollableBox sx={{
              flex: 1,
              overflow: 'auto',
              pt: 1
            }}>
              <DomainList
                domains={domains}
                selectedDomain={selectedDomain}
                onDomainSelect={onDomainSelect}
              />
            </ScrollableBox>
          </Paper>
        )}

        <Box sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          <Paper
            elevation={0}
            sx={{
              p: 1,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              border: '1px solid',
              borderColor: 'divider'
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
              overflow: 'hidden',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid',
              borderColor: 'divider'
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
            <ScrollableBox sx={{
              flex: 1,
              overflow: 'auto'
            }}>
              <RuleList
                rules={rules}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </ScrollableBox>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}