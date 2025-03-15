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

function Popup() {
  const [currentTab, setCurrentTab] = useState(null);
  const [tabRule, setTabRule] = useState(null);
  const [originalTitle, setOriginalTitle] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRule, setCurrentRule] = useState(null);
  const [existingTags, setExistingTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const initializePopup = async () => {
      try {
        // 获取当前标签页信息
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
          throw new Error('无法获取当前标签页');
        }
        const tab = tabs[0];
        if (!tab.url || !(tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
          setError('当前页面不支持修改标题');
          return;
        }

        setCurrentTab(tab);

        // 获取当前标签页的规则状态
        try {
          // 获取原始标题
          const titleResult = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            world: 'MAIN',
            func: () => window._originalTabTitle || document.title
          });
          const title = titleResult[0].result;
          console.debug('获取到的原始标题:', title);
          setOriginalTitle(title);

          // 获取当前标签页的规则
          const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ type: 'GET_TAB_RULE', tabId: tab.id }, (response) => {
              const error = chrome.runtime.lastError;
              if (error) {
                console.error('发送消息时出错:', error, JSON.stringify(error));
                reject(new Error(error.message || '无法获取规则状态'));
              } else if (response.error) {
                reject(new Error(response.error));
              } else {
                resolve(response.data);
              }
            });
          });

          console.debug('获取到的响应:', response);

          if (response) {
            // 如果有规则，进入编辑模式
            console.debug('转换规则为 TitleRule:', response);
            const titleRule = TitleRule.fromJSON(response);
            setTabRule(titleRule);
            setCurrentRule(titleRule);
          } else {
            // 如果没有规则，创建一个默认规则
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

        // 获取所有已有标签
        try {
          const data = await chrome.storage.sync.get('titleRules');
          const allTags = data.titleRules?.reduce((tags, rule) => {
            rule.tags?.forEach(tag => {
              if (!tags.includes(tag)) {
                tags.push(tag);
              }
            });
            return tags;
          }, []) || [];
          setExistingTags(allTags);
        } catch (err) {
          console.error('获取标签时出错:', err);
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
    console.debug('规则变更:', rule);
    if (!rule) return;

    // 确保传入的是 TitleRule 实例
    const titleRule = rule instanceof TitleRule ? rule : TitleRule.fromJSON(rule);
    setCurrentRule(titleRule);
  };

  const handleSaveRule = async (e) => {
    e?.preventDefault?.();

    if (!currentRule) {
      setMessage({ type: 'error', text: '没有要保存的规则' });
      return;
    }

    try {
      setSaving(true);
      console.group('保存规则');
      console.debug('当前规则对象:', currentRule);

      // 确保currentRule是TitleRule实例
      const ruleToSave = currentRule instanceof TitleRule
        ? currentRule
        : TitleRule.fromJSON(currentRule);

      console.debug('验证规则...');
      const validation = ruleToSave.validate();
      if (!validation.isValid) {
        console.error('规则验证失败:', validation.error);
        setMessage({ type: 'error', text: validation.error });
        return;
      }

      console.debug('开始保存规则...');

      // 直接使用chrome.storage.sync保存
      const data = await chrome.storage.sync.get('titleRules');
      const rules = data.titleRules || [];

      // 查找是否存在相同ID的规则
      const index = rules.findIndex(r => r.id === ruleToSave.id);
      const ruleJSON = ruleToSave.toJSON();

      let newRules;
      if (index !== -1) {
        console.debug(`更新现有规则，索引位置: ${index}`);
        newRules = [
          ...rules.slice(0, index),
          ruleJSON,
          ...rules.slice(index + 1)
        ];
      } else {
        console.debug('添加新规则');
        newRules = [...rules, ruleJSON];
      }

      console.debug('保存规则列表:', newRules);
      await chrome.storage.sync.set({ titleRules: newRules });

      console.debug('规则保存成功');

      // 显示成功提示
      setMessage({ type: 'success', text: '规则保存成功' });

      // 如果是编辑模式，更新tabRule
      if (tabRule) {
        setTabRule(ruleToSave);
      }

      // 通知background更新规则
      try {
        await chrome.runtime.sendMessage({
          type: 'UPDATE_RULES',
          data: { rules: newRules }
        });
        console.debug('已通知background更新规则');
      } catch (msgErr) {
        console.warn('通知background更新规则失败，但规则已保存:', msgErr);
      }
    } catch (err) {
      console.error('保存规则时出错:', err);
      console.error('错误堆栈:', err.stack);
      setMessage({ type: 'error', text: err.message || '保存失败' });
    } finally {
      setSaving(false);
      console.groupEnd();
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
      console.group('切换规则状态');
      console.debug('当前规则:', currentRule);
      console.debug(`切换状态为: ${enabled}`);

      // 确保currentRule是TitleRule实例
      const ruleToUpdate = currentRule instanceof TitleRule
        ? currentRule
        : TitleRule.fromJSON(currentRule);

      // 更新启用状态
      ruleToUpdate.enabled = enabled;

      // 直接使用chrome.storage.sync保存
      const data = await chrome.storage.sync.get('titleRules');
      const rules = data.titleRules || [];

      // 查找并更新规则
      const index = rules.findIndex(r => r.id === ruleToUpdate.id);
      if (index === -1) {
        throw new Error('找不到要更新的规则');
      }

      const ruleJSON = ruleToUpdate.toJSON();
      const newRules = [
        ...rules.slice(0, index),
        ruleJSON,
        ...rules.slice(index + 1)
      ];

      console.debug('保存规则列表:', newRules);
      await chrome.storage.sync.set({ titleRules: newRules });

      // 更新当前规则状态
      setCurrentRule(ruleToUpdate);
      setTabRule(ruleToUpdate);

      console.debug('规则状态已更新');

      // 通知background更新规则
      try {
        await chrome.runtime.sendMessage({
          type: 'UPDATE_RULES',
          data: { rules: newRules }
        });
        console.debug('已通知background更新规则');
      } catch (msgErr) {
        console.warn('通知background更新规则失败，但规则已保存:', msgErr);
      }
    } catch (err) {
      console.error('切换规则状态时出错:', err);
      console.error('错误堆栈:', err.stack);
      setMessage({ type: 'error', text: err.message || '保存失败' });
    } finally {
      console.groupEnd();
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
            existingTags={existingTags}
            formId="popup-rule-form"
            isPopup={true}
            onToggleEnabled={handleToggleEnabled}
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
              disabled={saving}
              sx={{
                minWidth: 100,
                textTransform: 'none'
              }}
            >
              {saving ? (
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
              ) : null}
              {saving ? '保存中' : '保存'}
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