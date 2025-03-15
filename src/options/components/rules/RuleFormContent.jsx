import React, { useState, useEffect } from 'react';
import {
  TextField,
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
import LoopIcon from '@mui/icons-material/Loop';
import { TitleRule } from '../../../models/Rule';

// 自定义样式组件
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

export const defaultRule = {
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
    titleScript: null,
    interval: 0
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

export function RuleFormContent({
  rule,
  onChange,
  error,
  existingTags = [],
  formId = "rule-form",
  onToggleEnabled,
  isPopup = false
}) {
  const [formData, setFormData] = useState(rule || defaultRule);
  const [useScript, setUseScript] = useState(false);
  const [useInterval, setUseInterval] = useState(false);

  useEffect(() => {
    if (rule) {
      setFormData(rule);
      setUseScript(!!rule.applyRules.titleScript);
      setUseInterval(rule.applyRules.interval > 0);
    } else {
      setFormData(defaultRule);
      setUseScript(false);
      setUseInterval(false);
    }
  }, [rule]);

  useEffect(() => {
    // 当表单数据变化时，通知父组件
    const finalRule = new TitleRule({
      ...formData,
      applyRules: {
        ...formData.applyRules,
        fixedTitle: useScript ? '' : (formData.applyRules.fixedTitle || ''),
        titleScript: useScript ? (formData.applyRules.titleScript || '') : null,
        interval: useInterval ? formData.applyRules.interval : 0
      }
    });

    // 只在规则实际发生变化时才通知父组件
    const currentRuleStr = JSON.stringify(formData);
    const finalRuleStr = JSON.stringify(finalRule);
    if (currentRuleStr !== finalRuleStr) {
      onChange?.(finalRule);
    }
  }, [formData, useScript, useInterval]);

  const handlePatternOptionsChange = (pattern, option) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        matchRules: {
          ...prev.matchRules,
          [pattern]: {
            ...prev.matchRules[pattern],
            [option]: !prev.matchRules[pattern][option]
          }
        }
      };
      return newData;
    });
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

  // 处理 JavaScript switch 切换
  const handleScriptToggle = (e) => {
    const newUseScript = e.target.checked;
    setUseScript(newUseScript);

    // 根据是否为编辑模式（是否有原始规则）来处理
    setFormData(prev => {
      if (rule) {
        // 编辑模式：切换时使用原始规则中的值
        return {
          ...prev,
          applyRules: {
            ...prev.applyRules,
            fixedTitle: newUseScript ? '' : (rule.applyRules.fixedTitle || ''),
            titleScript: newUseScript ? (rule.applyRules.titleScript || '') : null
          }
        };
      } else {
        // 新增模式：切换时清空输入
        return {
          ...prev,
          applyRules: {
            ...prev.applyRules,
            fixedTitle: newUseScript ? '' : '',
            titleScript: newUseScript ? '' : null
          }
        };
      }
    });
  };

  return (
    <Box id={formId}>
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
        {/* 域名输入框 - 只在 options 页面显示 */}
        {!isPopup && (
          <StyledTextField
            label="生效域名"
            value={formData.domain}
            onChange={e => setFormData(prev => ({ ...prev, domain: e.target.value }))}
            required
            fullWidth
            placeholder="例如：example.com"
          />
        )}

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
        <Box>
          <StyledTextField
            fullWidth
            label={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                则把网页标题更改为：
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
                      onChange={handleScriptToggle}
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
            value={useScript ? (formData.applyRules.titleScript || '') : (formData.applyRules.fixedTitle || '')}
            onChange={e => setFormData(prev => ({
              ...prev,
              applyRules: {
                ...prev.applyRules,
                [useScript ? 'titleScript' : 'fixedTitle']: e.target.value || ''
              }
            }))}
          />
          {useScript && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              mt: 1,
              gap: 1,
              px: 1
            }}>
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
                    <LoopIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    循环执行
                  </Box>
                }
                control={
                  <StyledSwitch
                    checked={useInterval}
                    onChange={(e) => {
                      setUseInterval(e.target.checked);
                      if (!e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          applyRules: {
                            ...prev.applyRules,
                            interval: 0
                          }
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          applyRules: {
                            ...prev.applyRules,
                            interval: 1
                          }
                        }));
                      }
                    }}
                    size="small"
                  />
                }
              />
              {useInterval && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TextField
                    size="small"
                    type="number"
                    value={formData.applyRules.interval}
                    onChange={e => {
                      const value = Math.max(1, Number(e.target.value));
                      setFormData(prev => ({
                        ...prev,
                        applyRules: {
                          ...prev.applyRules,
                          interval: value
                        }
                      }));
                    }}
                    InputProps={{
                      sx: { width: 100 }
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    秒/一次
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
}