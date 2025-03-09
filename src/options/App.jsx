import { useState, useCallback } from 'react';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { RuleList } from './components/RuleList';
import { RuleForm } from './components/RuleForm';
import { DomainList } from './components/DomainList';
import { SearchBar } from './components/SearchBar';
import { useRules } from './hooks/useRules';

export function App() {
  const {
    rules,
    loading,
    error: rulesError,
    saveRule,
    deleteRule,
    getDomains
  } = useRules();

  const [selectedDomain, setSelectedDomain] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRule, setEditingRule] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 确保 rules 是数组
  const ruleList = Array.isArray(rules) ? rules : [];

  const handleSave = async (rule) => {
    try {
      await saveRule(rule);
      setShowForm(false);
      setEditingRule(null);
      setNotification({
        type: 'success',
        message: '规则保存成功'
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这条规则吗？')) {
      return;
    }

    try {
      await deleteRule(id);
      setNotification({
        type: 'success',
        message: '规则删除成功'
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message
      });
    }
  };

  const filteredRules = ruleList.filter(rule => {
    if (selectedDomain && rule.domain !== selectedDomain) {
      return false;
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        rule.domain.toLowerCase().includes(searchLower) ||
        (Array.isArray(rule.tags) && rule.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
        (rule.applyRules?.fixedTitle || '').toLowerCase().includes(searchLower) ||
        (rule.applyRules?.titleScript || '').toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        className="fade-in"
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="fade-in">
      <AppBar position="static" elevation={0} className="MuiAppBar-root">
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 500 }}>
            标题更新规则管理
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingRule(null);
              setShowForm(true);
            }}
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
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="lg"
        sx={{
          mt: 3,
          mb: 4,
          flex: 1,
          px: isMobile ? 2 : 3
        }}
      >
        {rulesError && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 2 }}
            variant="filled"
          >
            {rulesError.message}
          </Alert>
        )}

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
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <FilterIcon sx={{ mr: 1, fontSize: 20 }} />
              域名筛选
            </Typography>
            <DomainList
              domains={getDomains()}
              selectedDomain={selectedDomain}
              onDomainSelect={setSelectedDomain}
            />
          </Paper>

          <Box flex={1}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2
              }}
              className="search-bar"
            >
              <SearchBar onSearch={setSearchTerm} />
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
                  规则列表 {filteredRules.length > 0 && `(${filteredRules.length})`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedDomain ? `当前筛选: ${selectedDomain}` : '显示所有规则'}
                </Typography>
              </Box>
              <RuleList
                rules={filteredRules}
                onEdit={rule => {
                  setEditingRule(rule);
                  setShowForm(true);
                }}
                onDelete={handleDelete}
              />
            </Paper>
          </Box>
        </Box>

        <RuleForm
          open={showForm}
          rule={editingRule}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingRule(null);
          }}
        />

        <Snackbar
          open={!!notification}
          autoHideDuration={3000}
          onClose={() => setNotification(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {notification && (
            <Alert
              onClose={() => setNotification(null)}
              severity={notification.type}
              variant="filled"
              sx={{ width: '100%', borderRadius: 2 }}
            >
              {notification.message}
            </Alert>
          )}
        </Snackbar>
      </Container>

      <Box
        component="footer"
        sx={{
          py: 2,
          textAlign: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
          mt: 'auto'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          标题规则管理 © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
}