import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Stack,
  InputAdornment,
  Typography,
  Chip,
  Alert,
  Autocomplete,
  styled
} from '@mui/material';
import {
  RegexIcon,
  CaseSensitiveIcon,
  WholeWordIcon,
  CodeIcon,
  TitleIcon
} from './icons';
import { TitleRule } from '../../models/Rule';

// 自定义样式组件
const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  color: theme.palette.text.primary,
  padding: theme.spacing(3),
  paddingBottom: theme.spacing(2),
  fontSize: '1.2rem',
  fontWeight: 500,
  backgroundColor: '#fff',
  position: 'relative',
  zIndex: 1
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    minHeight: 56
  }
}));

const StyledSwitch = styled(Switch)(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.primary.main,
        opacity: 1,
        border: 0
      }
    }
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: theme.palette.grey[400],
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500
    })
  }
}));

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
    titleScript: null
  },
  enabled: true,
  createTime: Date.now()
};

// 匹配选项按钮配置
const matchOptionButtons = [
  {
    value: 'isRegex',
    icon: <RegexIcon />,
    tooltip: '使用正则表达式'
  },
  {
    value: 'caseSensitive',
    icon: <CaseSensitiveIcon />,
    tooltip: '区分大小写'
  },
  {
    value: 'wholeWord',
    icon: <WholeWordIcon />,
    tooltip: '完整匹配'
  }
];

// 添加新的样式组件
const IconGroup = styled('div')({
  display: 'flex',
  gap: '2px',
  alignItems: 'center'
});

const IconWrapper = styled('div')(({ theme, selected }) => ({
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px',
  borderRadius: '4px',
  transition: 'all 0.2s',
  backgroundColor: 'rgba(0, 0, 0, 0.08)',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.12)'
  },
  ...(selected && {
    backgroundColor: 'rgba(25, 118, 210, 0.12)',
    color: '#1976d2',
    '&:hover': {
      backgroundColor: 'rgba(25, 118, 210, 0.2)'
    }
  })
}));

export function RuleForm({ open, rule, onSave, onClose, existingTags = [] }) {
  const [formData, setFormData] = useState(rule || defaultRule);
  const [useScript, setUseScript] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (rule) {
      setFormData(rule);
      setUseScript(!!rule.applyRules.titleScript);
    } else {
      setFormData(defaultRule);
      setUseScript(false);
    }
  }, [rule]);

  const handlePatternOptionsChange = (pattern, option) => {
    setFormData(prev => ({
      ...prev,
      matchRules: {
        ...prev.matchRules,
        [pattern]: {
          ...prev.matchRules[pattern],
          [option]: !prev.matchRules[pattern][option]
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const finalRule = new TitleRule({
      ...formData,
      applyRules: {
        fixedTitle: useScript ? '' : formData.applyRules.fixedTitle,
        titleScript: useScript ? formData.applyRules.titleScript : null
      }
    });

    const validation = finalRule.validate();
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    try {
      await onSave(finalRule);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const renderMatchOptions = (pattern) => (
    <InputAdornment position="end">
      <IconGroup>
        {matchOptionButtons.map(({ value, icon, tooltip }) => (
          <Tooltip key={value} title={tooltip}>
            <IconWrapper
              selected={formData.matchRules[pattern][value]}
              onClick={() => handlePatternOptionsChange(pattern, value)}
            >
              {icon}
            </IconWrapper>
          </Tooltip>
        ))}
      </IconGroup>
    </InputAdornment>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 3,
        sx: {
          borderRadius: 2
        }
      }}
    >
      <StyledDialogTitle>
        {rule ? '编辑规则' : '添加规则'}
      </StyledDialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <form id="rule-form" onSubmit={handleSubmit}>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              variant="filled"
            >
              {error}
            </Alert>
          )}

          <Stack spacing={3} sx={{ pt: 1 }}>
            {/* 域名输入 */}
            <StyledTextField
              label="域名"
              value={formData.domain}
              onChange={e => setFormData(prev => ({ ...prev, domain: e.target.value }))}
              required
              fullWidth
              placeholder="例如：example.com"
            />

            {/* 标签输入 */}
            <Autocomplete
              multiple
              freeSolo
              options={existingTags}
              value={formData.tags}
              onChange={(e, newValue) => setFormData(prev => ({ ...prev, tags: newValue }))}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    size="small"
                  />
                ))
              }
              renderInput={(params) => (
                <StyledTextField
                  {...params}
                  label="标签"
                  placeholder="输入标签后按回车添加"
                  helperText="可选，用于分类和筛选规则"
                />
              )}
            />

            {/* 标题匹配规则 */}
            <Box>
              <Typography variant="subtitle2" gutterBottom color="textSecondary">
                标题匹配规则
              </Typography>
              <StyledTextField
                fullWidth
                placeholder="输入标题匹配模式"
                value={formData.matchRules.titlePattern.pattern}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  matchRules: {
                    ...prev.matchRules,
                    titlePattern: {
                      ...prev.matchRules.titlePattern,
                      pattern: e.target.value
                    }
                  }
                }))}
                InputProps={{
                  endAdornment: renderMatchOptions('titlePattern')
                }}
              />
            </Box>

            {/* URL匹配规则 */}
            <Box>
              <Typography variant="subtitle2" gutterBottom color="textSecondary">
                URL匹配规则
              </Typography>
              <StyledTextField
                fullWidth
                placeholder="输入URL匹配模式"
                value={formData.matchRules.urlPattern.pattern}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  matchRules: {
                    ...prev.matchRules,
                    urlPattern: {
                      ...prev.matchRules.urlPattern,
                      pattern: e.target.value
                    }
                  }
                }))}
                InputProps={{
                  endAdornment: renderMatchOptions('urlPattern')
                }}
              />
            </Box>

            {/* 标题更新方式 */}
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="flex-end"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <FormControlLabel
                  control={
                    <StyledSwitch
                      checked={useScript}
                      onChange={(e) => setUseScript(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {useScript ? <CodeIcon fontSize="small" /> : <TitleIcon fontSize="small" />}
                    </Stack>
                  }
                />
              </Stack>

              {useScript ? (
                <StyledTextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="输入JavaScript代码来处理标题"
                  value={formData.applyRules.titleScript || ''}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    applyRules: {
                      ...prev.applyRules,
                      titleScript: e.target.value
                    }
                  }))}
                />
              ) : (
                <StyledTextField
                  fullWidth
                  placeholder="输入要替换的固定标题"
                  value={formData.applyRules.fixedTitle}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    applyRules: {
                      ...prev.applyRules,
                      fixedTitle: e.target.value
                    }
                  }))}
                />
              )}
            </Box>
          </Stack>
        </form>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', p: 3 }}>
        <Button
          type="submit"
          form="rule-form"
          variant="contained"
          size="large"
          sx={{
            minWidth: 120,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem'
          }}
        >
          保存规则
        </Button>
      </DialogActions>
    </Dialog>
  );
}