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
  Snackbar
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
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
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            标题更新规则
          </Typography>
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingRule(null);
              setShowForm(true);
            }}
          >
            添加规则
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        {rulesError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {rulesError.message}
          </Alert>
        )}

        <Box display="flex">
          <DomainList
            domains={getDomains()}
            selectedDomain={selectedDomain}
            onDomainSelect={setSelectedDomain}
          />

          <Box flex={1}>
            <SearchBar onSearch={setSearchTerm} />
            <RuleList
              rules={filteredRules}
              onEdit={rule => {
                setEditingRule(rule);
                setShowForm(true);
              }}
              onDelete={handleDelete}
            />
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
        >
          {notification && (
            <Alert
              onClose={() => setNotification(null)}
              severity={notification.type}
              sx={{ width: '100%' }}
            >
              {notification.message}
            </Alert>
          )}
        </Snackbar>
      </Container>
    </Box>
  );
}