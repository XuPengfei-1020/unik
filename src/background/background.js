import RuleController from './RuleController';

/**
 * 后台脚本入口
 * 负责初始化各个模块并处理消息
 */
class Background {
  constructor() {
    this.init();
  }

  async init() {
    console.debug('初始化后台脚本');
    // 初始化规则控制器，并设置规则变化的回调
    this.ruleController = new RuleController();
    // 加载规则
    console.debug('后台脚本初始化完成');
  }
}

// 创建后台实例
const background = new Background();

// 导出实例以便测试
export default background;
