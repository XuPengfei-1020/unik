import { useCallback } from 'react';
import { useStorage } from './useStorage';
import { TitleRule } from '../../models/Rule.ts';

export function useRules() {
  const {
    value: rules = [],
    setValue: setRules,
    loading,
    error
  } = useStorage('titleRules', []);

  const validateRule = useCallback((rule) => {
    try {
      // 检查必需的字段
      if (!rule || typeof rule !== 'object') return false;
      if (!rule.id || typeof rule.id !== 'string') return false;
      if (!rule.domain || typeof rule.domain !== 'string') return false;

      // 检查 matchRules
      if (!rule.matchRules || typeof rule.matchRules !== 'object') return false;

      // 确保 matchRules 的结构正确
      if (rule.matchRules.titlePattern && typeof rule.matchRules.titlePattern === 'object') {
        if (!rule.matchRules.titlePattern.pattern) {
          rule.matchRules.titlePattern = undefined;
        }
      }
      if (rule.matchRules.urlPattern && typeof rule.matchRules.urlPattern === 'object') {
        if (!rule.matchRules.urlPattern.pattern) {
          rule.matchRules.urlPattern = undefined;
        }
      }

      // 检查是否至少有一个匹配规则
      const hasMatchRule = (
        (rule.matchRules.titlePattern && rule.matchRules.titlePattern.pattern) ||
        (rule.matchRules.urlPattern && rule.matchRules.urlPattern.pattern)
      );

      if (!hasMatchRule) return false;

      // 检查 applyRules
      if (!rule.applyRules || typeof rule.applyRules !== 'object') return false;
      if (!rule.applyRules.fixedTitle && !rule.applyRules.titleScript) return false;

      return true;
    } catch (e) {
      console.error('规则验证错误:', e);
      return false;
    }
  }, []);

  const saveRule = useCallback(async (rule) => {
    if (!validateRule(rule)) {
      throw new Error('规则验证失败');
    }

    const newRules = [...rules];
    const index = rules.findIndex(r => r.id === rule.id);

    if (index >= 0) {
      newRules[index] = rule;
    } else {
      newRules.push(rule);
    }

    // 将规则转换为 TitleRule 实例并保存到 storage
    const titleRules = newRules.map(r => TitleRule.fromJSON(r));
    await setRules(titleRules.map(r => r.toJSON()));
  }, [rules, setRules, validateRule]);

  const deleteRule = useCallback(async (id) => {
    const newRules = rules.filter(r => r.id !== id);
    // 将规则转换为 TitleRule 实例并保存到 storage
    const titleRules = newRules.map(r => TitleRule.fromJSON(r));
    await setRules(titleRules.map(r => r.toJSON()));
  }, [rules, setRules]);

  const getDomains = useCallback(() => {
    const domains = new Set(rules.map(rule => rule.domain));
    return Array.from(domains);
  }, [rules]);

  return {
    rules,
    loading,
    error,
    saveRule,
    deleteRule,
    validateRule,
    getDomains
  };
}