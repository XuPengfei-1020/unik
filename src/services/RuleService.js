/**
 * 规则服务
 * 通过消息与后台脚本通信，提供规则相关的操作
 */
class RuleService {
  /**
   * 获取所有规则
   * @returns {Promise<Object[]>} 规则列表
   */
  static async getAllRules() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_ALL_RULES'
      });

      console.debug('获取所有规则', response);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data || [];
    } catch (error) {
      console.error('获取所有规则失败:', error);
      throw new Error('获取所有规则失败: ' + (error.message || error));
    }
  }

  /**
   * 根据ID获取规则
   * @param {string} id 规则ID
   * @returns {Promise<Object|null>} 规则对象，如果不存在则返回null
   */
  static async getRuleById(id) {
    if (!id) {
      throw new Error('规则ID不能为空');
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_RULE_BY_ID',
        id
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data;
    } catch (error) {
      console.error(`获取规则 ${id} 失败:`, error);
      throw new Error('获取规则失败: ' + (error.message || error));
    }
  }

  /**
   * 保存规则
   * @param {Object} rule 规则对象
   * @returns {Promise<Object>} 保存后的规则
   */
  static async saveRule(rule) {
    if (!rule) {
      throw new Error('规则不能为空');
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_RULE',
        rule
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data;
    } catch (error) {
      console.error('保存规则失败:', error);
      throw new Error('保存规则失败: ' + (error.message || error));
    }
  }

  /**
   * 删除规则
   * @param {string} id 规则ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async deleteRule(id) {
    if (!id) {
      throw new Error('规则ID不能为空');
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'DELETE_RULE',
        id
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.success;
    } catch (error) {
      console.error(`删除规则 ${id} 失败:`, error);
      throw new Error('删除规则失败: ' + (error.message || error));
    }
  }

  /**
   * 切换规则启用状态
   * @param {string} id 规则ID
   * @param {boolean} enabled 是否启用
   * @returns {Promise<Object|null>} 更新后的规则，如果规则不存在则返回null
   */
  static async toggleRuleEnabled(id, enabled) {
    if (!id) {
      throw new Error('规则ID不能为空');
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TOGGLE_RULE_ENABLED',
        id,
        enabled
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data;
    } catch (error) {
      console.error(`切换规则 ${id} 状态失败:`, error);
      throw new Error('切换规则状态失败: ' + (error.message || error));
    }
  }

  /**
   * 获取标签页的规则
   * @param {number} tabId 标签页ID
   * @returns {Promise<Object|null>} 标签页的规则，如果没有则返回null
   */
  static async getTabRule(tabId) {
    if (!tabId) {
      throw new Error('标签页ID不能为空');
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CURRENT_RULE_OF_TAB',
        tabId
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data;
    } catch (error) {
      console.error(`获取标签页 ${tabId} 规则失败:`, error);
      throw new Error('获取标签页规则失败: ' + (error.message || error));
    }
  }
}

export default RuleService;