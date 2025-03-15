import { TitleRule } from '../models/Rule';
import RuleStorageService from './RuleStorageService';

/**
 * 规则应用器
 * 负责处理规则的应用和监听
 */
class RuleApplier {
  /**
   * 初始化应用器
   */
  constructor() {
    // 存储每个标签页当前正在生效的规则
    this.tabRuleMap = new Map();
    this.lastUpdateRules = [];
    // 获取当前所有规则
    RuleStorageService.getAllRules().then(rules => {
      // 应用当前规则
      this.handleRulesChange(rules);

      // 监听标签页更新
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        // 只在页面完成加载且有URL时处理，并且只处理 http/https 协议的页面
        if (changeInfo.status === 'complete' && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
          this.applyRules(this.lastUpdateRules, tab);
        }
      });

      // 监听标签页关闭
      chrome.tabs.onRemoved.addListener((tabId) => {
        // 清理标签页的规则状态
        if (this.tabRuleMap.has(tabId)) {
          console.debug(`标签页 ${tabId} 关闭，清理规则状态`);
          this.tabRuleMap.delete(tabId);
        }
      });

      // 监听 storage 变化
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes[RuleStorageService.STORAGE_KEY]) {
          console.debug('RuleApplier 收到规则更新消息，重新加载规则');
          RuleStorageService.getAllRules().then(rules => {
            console.debug('RuleApplier 重新加载规则', rules);
            this.handleRulesChange(rules);
          });
        }
      });
    });
  }

  /**
   * 获取当前标签页的规则
   * @param {number} tabId 标签页ID
   * @returns {TitleRule|null} 规则对象，如果不存在则返回null
   */
  getCurrentRuleOfTab(tabId) {
    return this.tabRuleMap.get(tabId) || null;
  }

  /**
   * 处理规则变化
   * @param {TitleRule[]} newRules 新规则列表
   */
  async handleRulesChange(newRules) {
    try {
      // 1. 获取到原来已存在的，发生变更的 rule
      const deletedRules = this.lastUpdateRules.filter(oldRule =>
        !newRules.some(newRule => newRule.id === oldRule.id)
      );
      const addedRules = newRules.filter(newRule =>
        !this.lastUpdateRules.some(oldRule => oldRule.id === newRule.id)
      );
      // 处理修改的规则 - 视为删除旧规则并添加新规则
      const modifiedRuleIds = newRules.filter(newRule =>
        this.lastUpdateRules.some(oldRule =>
          oldRule.id === newRule.id && JSON.stringify(oldRule) !== JSON.stringify(newRule)
        )
      ).map(rule => rule.id);
      // 将修改的规则添加到删除和新增列表中
      if (modifiedRuleIds.length > 0) {
        deletedRules.push(...this.lastUpdateRules.filter(rule => modifiedRuleIds.includes(rule.id)));
        addedRules.push(...newRules.filter(rule => modifiedRuleIds.includes(rule.id)));
      }
      if (deletedRules.length === 0 && addedRules.length === 0) {
        return; // 没有需要处理的变化
      }
      console.debug('规则变化 - 删除:', deletedRules, '新增:', addedRules);

      // 获取所有标签页
      const tabs = (await chrome.tabs.query({}))
        .filter(tab => tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://')));

      // 2. 将删除的rule所对应的tab还原
      for (const tab of tabs) {
        const currentRule = this.tabRuleMap.get(tab.id);
        if (currentRule && deletedRules.some(rule => rule.id === currentRule.id)) {
          console.debug(`清除标签页 ${tab.id} 的规则:`, currentRule);
          await this.clearRule(tab);
        }
      }

      // 3. 将新增的rule应用到tab上
      for (const tab of tabs) {
        await this.applyRules(addedRules, tab);
      }
    } catch (error) {
      console.error('处理规则变化时出错:', error);
    } finally {
      this.lastUpdateRules = newRules;
    }
  }

  /**
   * 应用单个规则
   * @param {TitleRule} rule 规则对象
   * @param {number} tabId 标签页ID
   */
  async applyRules(rules, tab) {
    const tabId = tab.id;
    try {
      // 获取 tab 的域名
      const tabDomain = new URL(tab.url).hostname;
      if (!rules.some(rule => rule.domain == tabDomain)) {
        return;
      }
      // 获取window的原始标题
      const originalTitle = (await chrome.scripting.executeScript({
        target: { tabId },
        func: () => window._originalTabTitle || window.document.title
      }))[0].result;
      // 找到第一个匹配的规则
      const matchedRule = rules.find(rule => rule.matches(tab.url, originalTitle));
      if (!matchedRule) {
        return;
      }
      console.debug(`[Tab ${tabId}] 应用匹配的规则:`, matchedRule);
      // 记录新规则
      this.tabRuleMap.set(tabId, matchedRule);
      const applyRule = matchedRule.applyRules;

      if (applyRule.fixedTitle) {
        // 应用固定标题
        console.debug(`[Tab ${tabId}] 应用固定标题:`, applyRule.fixedTitle);
        await chrome.scripting.executeScript({
          target: { tabId },
          world: 'MAIN',
          func: (newTitle) => {
            window._originalTabTitle = document.title;
            document.title = newTitle;
          },
          args: [applyRule.fixedTitle]
        });
      } else if (applyRule.titleScript) {
        console.debug(`[Tab ${tabId}] 应用自定义脚本:`, applyRule.titleScript);
        // 应用自定义脚本
        await chrome.scripting.executeScript({
          target: { tabId },
          world: 'MAIN',
          func: (script, interval) => {
            try {
              console.debug('脚本内容', script);
              // 执行用户的脚本
              const userFunc = (0, eval)(script);
              // 先立即执行一次
              let originalTitle = document.title;
              const initialTitle = userFunc(originalTitle);
              if (typeof initialTitle === 'string') {
                window._originalTabTitle = originalTitle;
                document.title = initialTitle;
                // 如果设置了循环执行间隔，则设置定时器
                if (interval > 0) {
                  window._titleTimer = setInterval(() => {
                    try {
                      const newTitle = userFunc(originalTitle);
                      if (typeof newTitle === 'string') {
                        document.title = newTitle;
                      }
                      else {
                        throw new Error('用户脚本返回值不是字符串');
                      }
                    } catch (e) {
                      console.error('更新标题错误:', e);
                      if (window._titleTimer) {
                        clearInterval(window._titleTimer);
                        window._titleTimer = null;
                      }
                    }
                  }, interval * 1000); // 转换为毫秒
                }
              } else {
                console.error('用户脚本返回值不是字符串');
              }
            } catch (e) {
              console.error('执行脚本错误:', e);
            }
          },
          args: [applyRule.titleScript, applyRule.interval]
        });
      }
    } catch (err) {
      console.error('执行脚本错误:', err);
      // 发生错误时清除规则状态
      this.tabRuleMap.delete(tabId);
    }
  }

  /**
   * 清除规则状态
   * @param {Object} tab 标签页对象
   */
  async clearRule(tab) {
    try {
      // 从 Map 中移除规则
      this.tabRuleMap.delete(tab.id);
      // 在页面中清除定时器和还原标题
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: () => {
          // 清除定时器
          console.debug('清除定时器', window._titleTimer);
          if (window._titleTimer) {
            clearInterval(window._titleTimer);
            window._titleTimer = null;
          }

          // 还原原始标题
          console.debug('还原原始标题', window._originalTabTitle);
          if (window._originalTabTitle) {
            document.title = window._originalTabTitle;
            window._originalTabTitle = null;
          }
        }
      });
    } catch (e) {
      console.error(`清除规则状态失败 [Tab ${tab.id}]:`, e);
    }
  }
}

export default RuleApplier;