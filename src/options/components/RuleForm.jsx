import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Alert
} from '@mui/material';

const defaultRule = {
  id: crypto.randomUUID(),
  domain: '',
  tags: [],
  matchRules: {
    titlePattern: {
      pattern: '',
      isRegex: false,
      caseSensitive: false,
      wholeWord: false
    },
    urlPattern: {
      pattern: '',
      isRegex: false,
      caseSensitive: false,
      wholeWord: false
    }
  },
  applyRules: {
    fixedTitle: '',
    titleScript: ''
  },
  enabled: true,
  createTime: Date.now()
};

export function RuleForm({ open, rule, onSave, onClose }) {
  const [formData, setFormData] = useState(rule || defaultRule);
  const [titleType, setTitleType] = useState(rule?.applyRules.fixedTitle ? 'fixed' : 'script');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (rule) {
      setFormData(rule);
      setTitleType(rule.applyRules.fixedTitle ? 'fixed' : 'script');
    } else {
      setFormData(defaultRule);
      setTitleType('fixed');
    }
  }, [rule]);

  const handlePatternOptionsChange = (pattern, options) => {
    setFormData(prev => ({
      ...prev,
      matchRules: {
        ...prev.matchRules,
        [pattern]: {
          ...prev.matchRules[pattern],
          ...options
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const finalRule = {
        ...formData,
        applyRules: {
          fixedTitle: titleType === 'fixed' ? formData.applyRules.fixedTitle : undefined,
          titleScript: titleType === 'script' ? formData.applyRules.titleScript : undefined
        }
      };

      await onSave(finalRule);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, tags }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      disableAutoFocus
      onBackdropClick={onClose}
      aria-labelledby="rule-form-title"
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle id="rule-form-title">{rule ? '编辑规则' : '添加规则'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="域名"
            value={formData.domain}
            onChange={e => setFormData(prev => ({ ...prev, domain: e.target.value }))}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="标签"
            value={formData.tags.join(', ')}
            onChange={handleTagsChange}
            margin="normal"
            helperText="多个标签用逗号分隔"
          />

          <Box sx={{ mt: 2 }}>
            <FormLabel>标题匹配规则</FormLabel>
            <TextField
              fullWidth
              value={formData.matchRules.titlePattern.pattern}
              onChange={e => handlePatternOptionsChange('titlePattern', { pattern: e.target.value })}
              margin="normal"
            />
            <ToggleButtonGroup
              value={Object.entries(formData.matchRules.titlePattern)
                .filter(([key, value]) => value && key !== 'pattern')
                .map(([key]) => key)}
              onChange={(e, newValues) => {
                const options = {
                  isRegex: newValues.includes('isRegex'),
                  caseSensitive: newValues.includes('caseSensitive'),
                  wholeWord: newValues.includes('wholeWord')
                };
                handlePatternOptionsChange('titlePattern', options);
              }}
            >
              <ToggleButton value="isRegex">正则</ToggleButton>
              <ToggleButton value="caseSensitive">区分大小写</ToggleButton>
              <ToggleButton value="wholeWord">完整匹配</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ mt: 2 }}>
            <FormLabel>URL匹配规则</FormLabel>
            <TextField
              fullWidth
              value={formData.matchRules.urlPattern.pattern}
              onChange={e => handlePatternOptionsChange('urlPattern', { pattern: e.target.value })}
              margin="normal"
            />
            <ToggleButtonGroup
              value={Object.entries(formData.matchRules.urlPattern)
                .filter(([key, value]) => value && key !== 'pattern')
                .map(([key]) => key)}
              onChange={(e, newValues) => {
                const options = {
                  isRegex: newValues.includes('isRegex'),
                  caseSensitive: newValues.includes('caseSensitive'),
                  wholeWord: newValues.includes('wholeWord')
                };
                handlePatternOptionsChange('urlPattern', options);
              }}
            >
              <ToggleButton value="isRegex">正则</ToggleButton>
              <ToggleButton value="caseSensitive">区分大小写</ToggleButton>
              <ToggleButton value="wholeWord">完整匹配</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ mt: 2 }}>
            <FormControl component="fieldset">
              <FormLabel>标题更新方式</FormLabel>
              <RadioGroup
                value={titleType}
                onChange={e => setTitleType(e.target.value)}
              >
                <FormControlLabel
                  value="fixed"
                  control={<Radio />}
                  label="固定标题"
                />
                <FormControlLabel
                  value="script"
                  control={<Radio />}
                  label="自定义脚本"
                />
              </RadioGroup>
            </FormControl>

            {titleType === 'fixed' ? (
              <TextField
                fullWidth
                label="固定标题"
                value={formData.applyRules.fixedTitle}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  applyRules: {
                    ...prev.applyRules,
                    fixedTitle: e.target.value
                  }
                }))}
                margin="normal"
                required
              />
            ) : (
              <TextField
                fullWidth
                label="自定义脚本"
                value={formData.applyRules.titleScript}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  applyRules: {
                    ...prev.applyRules,
                    titleScript: e.target.value
                  }
                }))}
                margin="normal"
                required
                multiline
                rows={4}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>取消</Button>
          <Button type="submit" variant="contained" color="primary">
            保存
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}