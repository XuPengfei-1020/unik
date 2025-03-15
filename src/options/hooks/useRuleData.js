import { useState, useEffect, useCallback } from 'react';
import RuleService from '../../services/RuleService';

/**
 * 规则数据Hook
 * 通过消息与后台脚本通信，管理规则数据
 */
const useRuleData = () => {
  // 规则列表状态
  const [rules, setRules] = useState([]);
  // 加载状态
  const [loading, setLoading] = useState(true);
  // 错误状态
  const [error, setError] = useState(null);

  /**
   * 加载所有规则
   */
  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rulesData = await RuleService.getAllRules();
      setRules(rulesData);
    } catch (err) {
      console.error('加载规则失败:', err);
      setError(err.message || '加载规则失败');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 保存规则
   * @param {Object} rule 规则对象
   * @returns {Promise<Object>} 保存后的规则
   */
  const saveRule = useCallback(async (rule) => {
    try {
      setError(null);
      return await RuleService.saveRule(rule);
    } catch (err) {
      console.error('保存规则失败:', err);
      setError(err.message || '保存规则失败');
      throw err;
    }
  }, [loadRules]);

  /**
   * 删除规则
   * @param {string} id 规则ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  const deleteRule = useCallback(async (id) => {
    try {
      setError(null);
      return await RuleService.deleteRule(id);
    } catch (err) {
      console.error('删除规则失败:', err);
      setError(err.message || '删除规则失败');
      throw err;
    }
  }, [loadRules]);

  /**
   * 切换规则启用状态
   * @param {string} id 规则ID
   * @param {boolean} enabled 是否启用
   * @returns {Promise<Object>} 更新后的规则
   */
  const toggleRuleEnabled = useCallback(async (id, enabled) => {
    try {
      setError(null);
      return await RuleService.toggleRuleEnabled(id, enabled);
    } catch (err) {
      console.error('切换规则状态失败:', err);
      setError(err.message || '切换规则状态失败');
      throw err;
    }
  }, [loadRules]);

  /**
   * 获取所有标签
   * @returns {string[]} 标签列表
   */
  const getTags = useCallback(() => {
    const tagSet = new Set();
    rules.forEach(rule => {
      if (rule.tags && Array.isArray(rule.tags)) {
        rule.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            tagSet.add(tag.trim());
          }
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [rules]);

  /**
   * 获取所有域名
   * @returns {string[]} 域名列表
   */
  const getDomains = useCallback(() => {
    const domainSet = new Set();
    rules.forEach(rule => {
      if (rule.domain && typeof rule.domain === 'string') {
        domainSet.add(rule.domain.trim());
      }
    });
    return Array.from(domainSet).sort();
  }, [rules]);

  // 初始加载规则
  useEffect(() => {
    loadRules();
  }, [loadRules]);

  // 监听来自后台的消息
  useEffect(() => {
    const handleMessage = (message) => {
      if (message.type === 'RULES_UPDATED') {
        console.debug('收到规则更新消息，重新加载规则');
        loadRules();
      }
    };

    // 添加消息监听器
    chrome.runtime.onMessage.addListener(handleMessage);

    // 清理函数
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [loadRules]);

  return {
    rules,
    loading,
    error,
    loadRules,
    saveRule,
    deleteRule,
    toggleRuleEnabled,
    getTags,
    getDomains
  };
};

export default useRuleData;