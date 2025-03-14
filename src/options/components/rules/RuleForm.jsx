import React, { useState, useEffect } from 'react';
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
} from '../icons';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { TitleRule } from '../../../models/Rule';

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
  },
  '& .MuiInputLabel-root': {
    '&:not(.MuiInputLabel-shrink)': {
      transform: 'translate(14px, -9px) scale(0.75)'
    }
  }
}));

const StyledSwitch = styled(Switch)(({ theme }) => ({
  width: 32,
  height: 16,
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
    width: 12,
    height: 12
  },
  '& .MuiSwitch-track': {
    borderRadius: 16 / 2,
    backgroundColor: theme.palette.grey[400],
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500
    })
  }
}));

const HelpIcon = styled(HelpOutlineIcon)({
  fontSize: '16px',
  marginLeft: '4px',
  color: 'rgba(0, 0, 0, 0.54)',
  verticalAlign: 'middle',
  cursor: 'help'
});

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
              label="生效域名"
              value={formData.domain}
              onChange={e => setFormData(prev => ({ ...prev, domain: e.target.value }))}
              required
              fullWidth
              placeholder="例如：example.com"
            />

            {/* 标签输入 */}
            <Box component="div" sx={{ position: 'relative' }}>
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
                    label={
                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                        标签
                        <Tooltip title="可选，用于规则分类筛选">
                          <HelpIcon />
                        </Tooltip>
                      </Box>
                    }
                    placeholder="输入标签后按回车添加"
                  />
                )}
              />
            </Box>

            {/* 标题匹配规则 */}
            <StyledTextField
              label={
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  当原标题包含：
                  <Tooltip title="留空则全匹配">
                    <HelpIcon />
                  </Tooltip>
                </Box>
              }
              fullWidth
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

            {/* URL匹配规则 */}
            <StyledTextField
              label={
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  当网址URL包含：
                  <Tooltip title="留空则全匹配">
                    <HelpIcon />
                  </Tooltip>
                </Box>
              }
              fullWidth
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

            {/* 标题更新方式 */}
            <StyledTextField
              fullWidth
              label={
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  则把网址标题更改为：
                  <FormControlLabel
                    sx={{
                      margin: 0,
                      '& .MuiFormControlLabel-label': {
                        fontSize: '0.75rem',
                        color: 'rgba(0, 0, 0, 0.6)',
                        marginLeft: '8px'
                      }
                    }}
                    labelPlacement="end"
                    label={
                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                        使用 JavaScript
                        <Tooltip title="可以通过写一个 JS function 来修改标题。此 Function 入参为网站的原始标题，返回值为修改后的标题，返回值必须是 String 类型，方法内可访问 document 对象">
                          <HelpIcon />
                        </Tooltip>
                      </Box>
                    }
                    control={
                      <StyledSwitch
                        checked={useScript}
                        onChange={(e) => setUseScript(e.target.checked)}
                        size="small"
                      />
                    }
                  />
                </Box>
              }
              InputLabelProps={{
                shrink: true
              }}
              multiline={useScript}
              rows={useScript ? 4 : 1}
              placeholder={useScript ? "eg: (originalTitle) => originalTitle + '😊😊😊'" : "可以将标题替换为emoj哦，比如😊😊😊"}
              value={useScript ? (formData.applyRules.titleScript || '') : formData.applyRules.fixedTitle}
              onChange={e => setFormData(prev => ({
                ...prev,
                applyRules: {
                  ...prev.applyRules,
                  [useScript ? 'titleScript' : 'fixedTitle']: e.target.value
                }
              }))}
            />
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