import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Box,
  Typography,
  Button,
  Switch,
  Alert,
  CircularProgress
} from '@mui/material';
import { RuleFormContent } from '../components/rules/RuleFormContent';
import { TitleRule } from '../../models/Rule';
import RuleService from '../../services/RuleService';

function Popup() {
  const [tabRule, setTabRule] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRule, setCurrentRule] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const initializePopup = async () => {
      try {
        // 获取当前标签页信息
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
          chrome.runtime.openOptionsPage();
        }
        const tab = tabs[0];
        if (!tab.url || !(tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
          chrome.runtime.openOptionsPage();
          return;
        }

        // 获取当前标签页的规则状态
        try {
          // 获取当前标签页的规则
          const rule = await RuleService.getTabRule(tab.id);
          console.debug('获取到当前页面的规则:', rule);

          if (rule) {
            // 如果有规则，进入编辑模式
            console.debug('转换规则为 TitleRule:', rule);
            const titleRule = TitleRule.fromJSON(rule);
            setTabRule(titleRule);
            setCurrentRule(titleRule);
          } else {
            // 如果没有规则，创建一个默认规则
            const title = tab.title;
            console.debug('创建默认规则，使用标题:', title);
            const defaultRule = new TitleRule({
              id: crypto.randomUUID(),
              domain: new URL(tab.url).hostname,
              tags: [],
              matchRules: {
                titlePattern: {
                  pattern: title,
                  isRegex: false,
                  caseSensitive: false,
                  wholeWord: false
                },
                urlPattern: {
                  pattern: tab.url,
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
            });
            setTabRule(null);
            setCurrentRule(defaultRule);
          }
        } catch (err) {
          console.error('获取规则时出错:', err, err.stack);
          setError(`获取规则失败: ${err.message}`);
          setTabRule(null);
        }
      } catch (err) {
        console.error('初始化 popup 时出错:', err);
        setError(err.message || '加载失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };

    initializePopup();
  }, []);

  const handleRuleChange = (rule) => {
    if (!rule) return;
    // 确保传入的是 TitleRule 实例
    setCurrentRule(TitleRule.fromJSON(rule));
  };

  const handleSaveRule = async (e) => {
    e?.preventDefault?.();

    if (!currentRule) {
      setMessage({ type: 'error', text: '没有要保存的规则' });
      return;
    }

    try {
      // 验证规则
      const validation = currentRule.validate();
      if (!validation.isValid) {
        setMessage({ type: 'error', text: validation.error });
        return;
      }

      // 使用RuleService保存规则
      await RuleService.saveRule(currentRule);

      // 显示成功提示
      setMessage({ type: 'success', text: '规则保存成功' });

      // 如果是编辑模式，更新tabRule
      if (tabRule) {
        setTabRule(currentRule);
      }
    } catch (err) {
      console.error('保存规则时出错:', err);
      setMessage({ type: 'error', text: err.message || '保存失败' });
    }
  };

  const handleMoreOptions = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('dist/options/index.html'));
    }
    window.close();
  };

  const handleToggleEnabled = async (enabled) => {
    if (!currentRule || !tabRule) return; // 只在编辑模式下生效

    try {
      // 使用RuleService切换规则状态
      const updatedRule = await RuleService.toggleRuleEnabled(currentRule.id, enabled);

      if (updatedRule) {
        // 更新当前规则状态
        const titleRule = TitleRule.fromJSON(updatedRule);
        setCurrentRule(titleRule);
        setTabRule(titleRule);
        setMessage({ type: 'success', text: `规则已${enabled ? '启用' : '禁用'}` });
      }
    } catch (err) {
      console.error('切换规则状态时出错:', err);
      setMessage({ type: 'error', text: err.message || '操作失败' });
    }
  };

  if (error) {
    return (
      <Box className="popup-container">
        <Box className="popup-header">
          <Typography variant="h6" className="popup-title">提示</Typography>
        </Box>
        <Box className="popup-content" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography>{error}</Typography>
        </Box>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box className="popup-container">
        <Box className="popup-header">
          <Typography variant="h6" className="popup-title">加载中...</Typography>
        </Box>
        <Box className="popup-content" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography>正在加载页面信息...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="popup-container">
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        {/* 标题栏 */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50'
        }}>
          <Typography variant="subtitle1" sx={{
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            {tabRule ? '当前生效规则' : '添加规则'}
            {tabRule && (
              <Switch
                checked={currentRule?.enabled || false}
                onChange={(e) => handleToggleEnabled(e.target.checked)}
                size="small"
                sx={{
                  ml: 1,
                  mr: 1,
                  '& .MuiSwitch-switchBase': {
                    '&.Mui-checked': {
                      color: 'primary.main',
                      '& + .MuiSwitch-track': {
                        backgroundColor: 'primary.main'
                      }
                    }
                  }
                }}
              />
            )}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="text"
            size="small"
            onClick={handleMoreOptions}
            sx={{
              color: 'primary.main',
              fontSize: '0.85rem',
              textTransform: 'none',
              fontWeight: 500,
              p: '4px 8px',
              minWidth: 'auto',
              '&:hover': {
                backgroundColor: 'transparent',
                color: 'primary.dark'
              }
            }}
          >
            更多选项 {'>>'}
          </Button>
        </Box>

        {/* 表单内容 */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <RuleFormContent
            rule={currentRule}
            onChange={handleRuleChange}
            formId="popup-rule-form"
            showDomainInputField={false}
          />
        </Box>

        {/* 底部按钮和提示 */}
        <Box sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          {message && (
            <Alert
              severity={message.type}
              onClose={() => setMessage(null)}
              sx={{
                '& .MuiAlert-message': {
                  padding: '6px 0'
                }
              }}
            >
              {message.text}
            </Alert>
          )}
          <Box sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1
          }}>
            <Button
              onClick={handleSaveRule}
              variant="contained"
              sx={{
                minWidth: 100,
                textTransform: 'none'
              }}
            >
              保存
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// 创建 React 根节点
const root = createRoot(document.getElementById('root'));
root.render(<Popup />);