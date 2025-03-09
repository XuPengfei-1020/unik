import { TitleRule } from '../models/Rule.ts';

// 存储规则列表
let rules = [];

// 存储每个标签页的规则状态
const tabRuleMap = new Map();

// 从存储中加载规则
chrome.storage.sync.get('titleRules', (data) => {
  if (data.titleRules) {
    rules = data.titleRules.map(rule => TitleRule.fromJSON(rule));
  }
});

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.titleRules) {
    const oldRules = rules;
    rules = changes.titleRules.newValue?.map(rule => TitleRule.fromJSON(rule)) || [];
    // 处理规则变化
    handleRulesChange(oldRules, rules);
  }
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 只在页面完成加载且有URL时处理，并且只处理 http/https 协议的页面
  if (changeInfo.status === 'complete' && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
    applyRules(tab);
  }
});

// 监听标签页关闭
chrome.tabs.onRemoved.addListener((tabId) => {
  // 清理标签页的规则状态
  if (tabRuleMap.has(tabId)) {
    console.log(`标签页 ${tabId} 关闭，清理规则状态`);
    tabRuleMap.delete(tabId);
  }
});

// 处理规则变化
async function handleRulesChange(oldRules, newRules) {
  try {
    // 1. 获取到删除的和新增的rule
    const deletedRules = oldRules.filter(oldRule =>
      !newRules.some(newRule => newRule.id === oldRule.id)
    );
    const addedRules = newRules.filter(newRule =>
      !oldRules.some(oldRule => oldRule.id === newRule.id)
    );
    // 处理修改的规则 - 视为删除旧规则并添加新规则
    const modifiedRuleIds = newRules.filter(newRule =>
      oldRules.some(oldRule =>
        oldRule.id === newRule.id && JSON.stringify(oldRule) !== JSON.stringify(newRule)
      )
    ).map(rule => rule.id);
    // 将修改的规则添加到删除和新增列表中
    if (modifiedRuleIds.length > 0) {
      deletedRules.push(...oldRules.filter(rule => modifiedRuleIds.includes(rule.id)));
      addedRules.push(...newRules.filter(rule => modifiedRuleIds.includes(rule.id)));
    }

    if (deletedRules.length === 0 && addedRules.length === 0) {
      return; // 没有需要处理的变化
    }

    console.log('规则变化 - 删除:', deletedRules, '新增:', addedRules);

    // 获取所有标签页
    const tabs = (await chrome.tabs.query({}))
      .filter(tab => tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://')));

    // 2. 将删除的rule所对应的tab还原
    for (const tab of tabs) {
      const currentRule = tabRuleMap.get(tab.id);
      if (currentRule && deletedRules.some(rule => rule.id === currentRule.id)) {
        console.log(`清除标签页 ${tab.id} 的规则:`, currentRule);
        await clearRule(tab);
      }
      else {
        console.log(`标签页 ${tab.id} 没有需要清除的规则`);
      }
    }

    // 3. 将新增的rule应用到tab上
    for (const tab of tabs) {
      const domain = new URL(tab.url).hostname;
      const matchingNewRules = addedRules.filter(rule => rule.enabled && rule.domain === domain);
      if (matchingNewRules.length > 0) {
        await applyRules(tab);
      }
    }
  } catch (error) {
    console.error('处理规则变化时出错:', error);
  }
}

// 应用规则
async function applyRules(tab) {
  let tabId = tab.id;
  try {
    // 获取window的原始标题
    const originalTitle = (await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => window._originalTabTitle || window.document.title
    }))[0].result;
    // 找到第一个匹配的规则
    for (const rule of rules) {
      console.log('originalTitle', originalTitle);
      // 使用Rule.ts中的matches方法
      if (rule.matches(tab.url, originalTitle)) {
        console.log(`[Tab ${tabId}] 应用匹配的规则:`, rule);
        await applyRule(rule, tabId);
        break;
      }
    }
  } catch (e) {
    console.error('应用规则错误:', e);
  }
}

// 应用单个规则
async function applyRule(rule, tabId) {
  const { applyRules } = rule;
  try {
    // 记录新规则
    tabRuleMap.set(tabId, rule);

    if (applyRules.fixedTitle) {
      // 应用固定标题
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (newTitle) => {
          document.title = newTitle;
        },
        args: [applyRules.fixedTitle]
      });
    } else if (applyRules.titleScript) {
      // 应用自定义脚本
      await chrome.scripting.executeScript({
        target: { tabId },
        world: 'MAIN',
        func: (script) => {
          try {
            console.log('脚本内容', script);
            // 执行用户的脚本
            const userFunc = (0, eval)(script);
            // 先立即执行一次
            let originalTitle = document.title;
            const initialTitle = userFunc(originalTitle);
            if (typeof initialTitle === 'string') {
              window._originalTabTitle = originalTitle;
              console.log('window._originalTabTitle', window._originalTabTitle);
              document.title = initialTitle;
              // 设置定时器每秒执行一次用户脚本
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
              }, 1000);
            } else {
              console.error('用户脚本返回值不是字符串');
            }
          } catch (e) {
            console.error('执行脚本错误:', e);
          }
        },
        args: [applyRules.titleScript]
      });
    }
  } catch (err) {
    console.error('执行脚本错误:', err);
    // 发生错误时清除规则状态
    tabRuleMap.delete(tabId);
  }
}

// 清除规则状态
async function clearRule(tab) {
  try {
    // 从 Map 中移除规则
    tabRuleMap.delete(tab.id);

    // 在页面中清除定时器和还原标题
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: () => {
        // 清除定时器
        console.log('清除定时器', window._titleTimer);
        if (window._titleTimer) {
          clearInterval(window._titleTimer);
          window._titleTimer = null;
        }

        // 还原原始标题
        console.log('还原原始标题', window._originalTabTitle);
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
