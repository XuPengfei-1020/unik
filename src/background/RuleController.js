import RuleApplier from './RuleApplier';
import RuleStorageService from './RuleStorageService';

/**
 * 规则控制器
 * 负责处理规则的CRUD操作
 */
class RuleController {
  /**
   * 初始化控制器
   */
  constructor() {
    this.ruleApplier = new RuleApplier();
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (this.handleMessage(message, sender, sendResponse)) {
        return true; // 保持消息通道开放
      }
    });

    // 监听 storage 变化
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[RuleStorageService.STORAGE_KEY]) {
        // 通知前端规则更新
        chrome.runtime.sendMessage({ type: 'RULES_UPDATED' }).catch(err => {
          // 忽略错误，可能是没有活动的前端页面
          console.debug('通知前端规则更新失败，可能没有活动的前端页面:', err);
        });
      }
    });
  }

  /**
   * 处理消息
   * @param {Object} message 消息对象
   * @param {Object} sender 发送者信息
   * @param {Function} sendResponse 响应函数
   * @returns {boolean} 是否处理了消息
   */
  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'GET_ALL_RULES':
        // 获取所有规则
        RuleStorageService.getAllRules().then(rules => {
          sendResponse({ data: rules.map(rule => rule.toJSON()) });
        }).catch(error => {
          console.error('获取所有规则失败:', error);
          sendResponse({ error: error.message || '获取所有规则失败' });
        });
        return true;

      case 'GET_RULE_BY_ID':
        // 根据ID获取规则
        RuleStorageService.getRuleById(message.id).then(rule => {
          sendResponse({ data: rule ? rule.toJSON() : null });
        }).catch(error => {
          console.error(`获取规则 ${message.id} 失败:`, error);
          sendResponse({ error: error.message || '获取规则失败' });
        });
        return true;

      case 'SAVE_RULE':
        // 保存规则
        RuleStorageService.saveRule(message.rule).then(rule => {
          sendResponse({ data: rule.toJSON() });
        }).catch(error => {
          console.error('保存规则失败:', error);
          sendResponse({ error: error.message || '保存规则失败' });
        });
        return true;

      case 'DELETE_RULE':
        // 删除规则
        RuleStorageService.deleteRule(message.id).then(success => {
          sendResponse({ success });
        }).catch(error => {
          console.error(`删除规则 ${message.id} 失败:`, error);
          sendResponse({ error: error.message || '删除规则失败' });
        });
        return true;

      case 'TOGGLE_RULE_ENABLED':
        // 切换规则启用状态
        RuleStorageService.toggleRuleEnabled(message.id, message.enabled).then(rule => {
          sendResponse({ data: rule ? rule.toJSON() : null });
        }).catch(error => {
          console.error(`切换规则 ${message.id} 状态失败:`, error);
          sendResponse({ error: error.message || '切换规则状态失败' });
        });
        return true;
      case 'GET_CURRENT_RULE_OF_TAB':
        // 获取当前标签页的规则
        const tabId = message.tabId || sender.tab?.id;
        if (!tabId) {
          console.debug('无法获取标签页ID');
          sendResponse({ error: '无法获取标签页ID' });
          return true;
        }

        const rule = this.ruleApplier.getCurrentRuleOfTab(tabId);
        console.debug(`获取标签页 ${tabId} 的规则:`, rule);

        // 如果找到规则，确保它是一个普通对象而不是类实例
        if (rule) {
          sendResponse({ data: rule.toJSON() });
        } else {
          sendResponse({ data: null });
        }
        return true;
      default:
        return false;
    }
  }
}

export default RuleController;