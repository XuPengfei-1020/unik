import { TitleRule } from '../models/Rule';

/**
 * 规则存储服务
 * 负责规则的持久化存储和读取
 */
class RuleStorageService {
  /**
   * 存储键名
   */
  static STORAGE_KEY = 'titleRules';

  /**
   * 获取所有规则
   * @returns {Promise<TitleRule[]>} 规则列表
   */
  static async getAllRules() {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      const rulesJSON = result[this.STORAGE_KEY] || [];
      return rulesJSON.map(rule => TitleRule.fromJSON(rule));
    } catch (error) {
      console.error('获取所有规则失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取规则
   * @param {string} id 规则ID
   * @returns {Promise<TitleRule|null>} 规则对象，如果不存在则返回null
   */
  static async getRuleById(id) {
    try {
      const rules = await this.getAllRules();
      return rules.find(rule => rule.id === id) || null;
    } catch (error) {
      console.error(`获取规则 ${id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 保存规则
   * @param {Object} ruleData 规则数据
   * @returns {Promise<TitleRule>} 保存后的规则对象
   */
  static async saveRule(ruleData) {
    try {
      // 获取所有规则
      const rules = await this.getAllRules();

      // 创建规则对象
      const rule = TitleRule.fromJSON(ruleData);

      // 查找是否已存在相同ID的规则
      const index = rules.findIndex(r => r.id === rule.id);

      // 更新或添加规则
      if (index !== -1) {
        rules[index] = rule;
      } else {
        rules.push(rule);
      }

      // 保存到存储
      await chrome.storage.local.set({
        [this.STORAGE_KEY]: rules.map(r => r.toJSON())
      });

      return rule;
    } catch (error) {
      console.error('保存规则失败:', error);
      throw error;
    }
  }

  /**
   * 删除规则
   * @param {string} id 规则ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async deleteRule(id) {
    try {
      // 获取所有规则
      const rules = await this.getAllRules();

      // 查找规则索引
      const index = rules.findIndex(rule => rule.id === id);

      // 如果找不到规则，返回false
      if (index === -1) {
        return false;
      }

      // 删除规则
      rules.splice(index, 1);

      // 保存到存储
      await chrome.storage.local.set({
        [this.STORAGE_KEY]: rules.map(rule => rule.toJSON())
      });

      return true;
    } catch (error) {
      console.error(`删除规则 ${id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 切换规则启用状态
   * @param {string} id 规则ID
   * @param {boolean} enabled 是否启用
   * @returns {Promise<TitleRule|null>} 更新后的规则对象，如果规则不存在则返回null
   */
  static async toggleRuleEnabled(id, enabled) {
    try {
      // 获取规则
      const rule = await this.getRuleById(id);

      // 如果找不到规则，返回null
      if (!rule) {
        return null;
      }

      // 更新启用状态
      rule.enabled = enabled;

      // 保存规则
      await this.saveRule(rule.toJSON());

      return rule;
    } catch (error) {
      console.error(`切换规则 ${id} 状态失败:`, error);
      throw error;
    }
  }

}

export default RuleStorageService;