document.addEventListener('DOMContentLoaded', () => {
  // 获取所有需要的 DOM 元素
  const elements = {
    currentUrl: document.getElementById('current-url'),
    originalTitle: document.getElementById('original-title'),
    customTitleInput: document.getElementById('custom-title-input'),
    toggleUrl: document.getElementById('toggle-url'),
    saveTitle: document.getElementById('save-title'),
    openOptions: document.getElementById('open-options'),
    useScript: document.getElementById('use-script'),
    titleScript: document.getElementById('title-script'),
    ruleTags: document.getElementById('rule-tags'),
    toggleAdvanced: document.getElementById('toggle-advanced'),
    advancedOptions: document.querySelector('.advanced-options')
  };

  // 验证所有元素都存在
  for (const [key, element] of Object.entries(elements)) {
    if (!element) {
      console.error(`找不到元素: ${key}`);
      return;
    }
  }

  let currentTab = null;
  let originalTitle = '';

  // 获取当前标签页信息
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    currentTab = tabs[0];

    // 显示当前URL
    elements.currentUrl.textContent = currentTab.url;

    // 获取原始标题和当前标题
    chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: () => {
        // 检查是否已经存储了原始标题
        const originalTitleElement = document.querySelector('meta[name="original-title"]');
        let originalTitle = '';

        if (originalTitleElement) {
          // 如果已经存储了原始标题，则使用它
          originalTitle = originalTitleElement.getAttribute('content');
        } else {
          // 否则，使用当前标题作为原始标题，并存储它
          originalTitle = document.title;
          const metaTag = document.createElement('meta');
          metaTag.setAttribute('name', 'original-title');
          metaTag.setAttribute('content', originalTitle);
          document.head.appendChild(metaTag);
        }

        return {
          originalTitle: originalTitle,
          currentTitle: document.title
        };
      }
    }).then((results) => {
      const result = results[0].result;
      originalTitle = result.originalTitle;

      // 显示原始标题和当前标题
      elements.originalTitle.textContent = originalTitle;
      elements.customTitleInput.value = result.currentTitle;

      // 检查当前标题是否与原始标题不同
      checkTitleDifference();
    });
  });

  // URL 展开/收起功能
  elements.toggleUrl.addEventListener('click', (e) => {
    e.preventDefault();

    if (elements.currentUrl.classList.contains('truncated')) {
      // 展开 URL
      elements.currentUrl.classList.remove('truncated');
      elements.toggleUrl.textContent = '收起';
    } else {
      // 收起 URL
      elements.currentUrl.classList.add('truncated');
      elements.toggleUrl.textContent = '展开';
    }
  });

  // 监听标题输入变化
  elements.customTitleInput.addEventListener('input', () => {
    checkTitleDifference();
  });

  // 验证规则对象的结构和数据
  function validateRule(rule) {
    // 检查必需的字段
    if (!rule || typeof rule !== 'object') return false;
    if (!rule.id || typeof rule.id !== 'string') return false;
    if (!rule.domain || typeof rule.domain !== 'string') return false;

    // 检查 matchRules
    if (!rule.matchRules || typeof rule.matchRules !== 'object') return false;
    if (!rule.matchRules.titlePattern && !rule.matchRules.urlPattern && !rule.matchRules.matchScript) {
      return false;
    }

    // 检查 applyRules
    if (!rule.applyRules || typeof rule.applyRules !== 'object') return false;
    if (!rule.applyRules.fixedTitle && !rule.applyRules.titleScript) {
      return false;
    }

    // 确保 tags 是数组
    if (!Array.isArray(rule.tags)) {
      rule.tags = [];
    }

    // 确保其他必需的字段存在
    rule.enabled = Boolean(rule.enabled);
    rule.createTime = Number(rule.createTime) || Date.now();
    rule.updateTime = Number(rule.updateTime) || Date.now();

    return true;
  }

  // 修改保存规则的代码
  elements.saveTitle.addEventListener('click', () => {
    const newTitle = elements.customTitleInput.value.trim();
    const useScript = elements.useScript.checked;
    const titleScript = elements.titleScript.value.trim();
    const tags = elements.ruleTags.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);

    if ((!useScript && !newTitle) || (useScript && !titleScript)) {
      alert('请输入标题或标题生成脚本');
      return;
    }

    // 创建新规则
    const newRule = {
      id: crypto.randomUUID(),
      domain: new URL(currentTab.url).hostname,
      tags: tags,
      matchRules: {
        titlePattern: escapeRegExp(originalTitle),
        urlPattern: escapeRegExp(currentTab.url)
      },
      applyRules: {
        fixedTitle: useScript ? undefined : newTitle,
        titleScript: useScript ? titleScript : undefined
      },
      enabled: true,
      createTime: Date.now(),
      updateTime: Date.now()
    };

    // 验证规则
    if (!validateRule(newRule)) {
      alert('规则格式不正确');
      return;
    }

    // 保存规则
    chrome.storage.sync.get('titleRules', (data) => {
      let rules = data.titleRules || [];

      // 清理无效的规则
      rules = rules.filter(rule => validateRule(rule));

      // 检查是否存在相同的规则
      const existingRuleIndex = rules.findIndex(rule =>
        rule.domain === newRule.domain &&
        rule.matchRules.titlePattern === newRule.matchRules.titlePattern
      );

      if (existingRuleIndex >= 0) {
        // 更新现有规则
        rules[existingRuleIndex] = {
          ...rules[existingRuleIndex],
          ...newRule,
          updateTime: Date.now()
        };
      } else {
        // 添加新规则
        rules.push(newRule);
      }

      chrome.storage.sync.set({ 'titleRules': rules }, () => {
        console.log('规则已保存:', newRule);

        // 立即应用规则
        applyRule(newRule, currentTab.id);

        // 显示成功动画
        showSaveSuccess();
      });
    });
  });

  // 辅助函数：转义正则表达式特殊字符
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // 辅助函数：显示保存成功动画
  function showSaveSuccess() {
    elements.saveTitle.classList.add('success');
    elements.saveTitle.textContent = '已保存';

    setTimeout(() => {
      elements.saveTitle.classList.add('fade-out');

      setTimeout(() => {
        elements.saveTitle.classList.remove('success');
        elements.saveTitle.classList.remove('fade-out');
        elements.saveTitle.classList.add('hidden');
        elements.saveTitle.textContent = '保存规则';
      }, 500);
    }, 1000);
  }

  // 切换高级选项显示
  elements.toggleAdvanced.addEventListener('click', () => {
    elements.advancedOptions.classList.toggle('hidden');
  });

  // 切换脚本输入框显示
  elements.useScript.addEventListener('change', (e) => {
    elements.titleScript.classList.toggle('hidden', !e.target.checked);
    elements.customTitleInput.classList.toggle('hidden', e.target.checked);
  });

  // 打开选项页按钮
  elements.openOptions.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      // 降级方案
      window.open(chrome.runtime.getURL('options.html'));
    }
  });

  // 检查标题是否与原始标题不同
  function checkTitleDifference() {
    const currentTitle = elements.customTitleInput.value.trim();

    if (currentTitle !== originalTitle && currentTitle !== '') {
      elements.saveTitle.classList.remove('hidden');
    } else {
      elements.saveTitle.classList.add('hidden');
    }
  }

  // 在 popup.js 中添加 applyRule 函数
  function applyRule(rule, tabId) {
    const { applyRules } = rule;

    if (applyRules.fixedTitle) {
      // 应用固定标题
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (newTitle) => {
          // 存储原始标题（如果尚未存储）
          if (!document.querySelector('meta[name="original-title"]')) {
            const metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'original-title');
            metaTag.setAttribute('content', document.title);
            document.head.appendChild(metaTag);
          }

          // 更改标题
          document.title = newTitle;

          // 使用定时器保持标题
          const originalSetTimeout = window.setTimeout;
          const titleKeeper = () => {
            if (document.title !== newTitle) {
              document.title = newTitle;
            }
            originalSetTimeout(titleKeeper, 1000);
          };
          originalSetTimeout(titleKeeper, 1000);
        },
        args: [applyRules.fixedTitle]
      });
    } else if (applyRules.titleScript) {
      // 应用标题生成脚本
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (script) => {
          // 存储原始标题（如果尚未存储）
          if (!document.querySelector('meta[name="original-title"]')) {
            const metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'original-title');
            metaTag.setAttribute('content', document.title);
            document.head.appendChild(metaTag);
          }

          // 执行标题生成脚本
          try {
            const newTitle = new Function('return ' + script)()();
            if (newTitle && typeof newTitle === 'string') {
              document.title = newTitle;

              // 使用定时器保持标题
              const originalSetTimeout = window.setTimeout;
              const titleKeeper = () => {
                if (document.title !== newTitle) {
                  document.title = newTitle;
                }
                originalSetTimeout(titleKeeper, 1000);
              };
              originalSetTimeout(titleKeeper, 1000);
            }
          } catch (e) {
            console.error('标题生成脚本错误:', e);
          }
        },
        args: [applyRules.titleScript]
      });
    }
  }
});