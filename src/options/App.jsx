import { useState } from 'react';
import { CircularProgress, Alert, Snackbar, Box } from '@mui/material';
import { AppLayout } from './components/layout/AppLayout';
import { MainContent } from './components/layout/MainContent';
import { RuleForm } from './components/rules/RuleForm';
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
      console.log(rule);
      return (
        rule.domain.toLowerCase().includes(searchLower) ||
        (Array.isArray(rule.tags) && rule.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
        (rule.matchRules?.urlPattern?.pattern || '').toLowerCase().includes(searchLower) ||
        (rule.matchRules?.titlePattern?.pattern || '').toLowerCase().includes(searchLower) ||
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
    <AppLayout>
      {rulesError && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          variant="filled"
        >
          {rulesError.message}
        </Alert>
      )}

      <MainContent
        rules={filteredRules}
        domains={getDomains()}
        selectedDomain={selectedDomain}
        onDomainSelect={setSelectedDomain}
        onSearch={setSearchTerm}
        onEdit={rule => {
          setEditingRule(rule);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        onAddRule={() => {
          setEditingRule(null);
          setShowForm(true);
        }}
      />

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
    </AppLayout>
  );
}