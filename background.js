// 存储规则列表
let rules = [];

// 从存储中加载规则
chrome.storage.sync.get('titleRules', (data) => {
  if (data.titleRules) {
    rules = data.titleRules;
  }
});

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.titleRules) {
    rules = changes.titleRules.newValue;
  }
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 只在页面完成加载且有URL时处理
  if (changeInfo.status === 'complete' && tab.url) {
    applyRules(tabId, tab);
  }
});

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'reloadRules') {
    console.log('收到重新加载规则的请求');

    // 重新加载规则
    chrome.storage.sync.get('titleRules', async (data) => {
      console.log('从存储中加载规则:', data.titleRules);

      if (data.titleRules) {
        rules = data.titleRules;

        try {
          // 对所有打开的标签页重新应用规则
          const tabs = await chrome.tabs.query({});
          console.log('找到的标签页数量:', tabs.length);

          let processedTabs = 0;
          const promises = [];

          for (const tab of tabs) {
            if (tab.url && tab.url.startsWith('http')) {
              console.log('处理标签页:', tab.url);
              promises.push(
                new Promise(async (resolve) => {
                  await applyRules(tab.id, tab);
                  processedTabs++;
                  resolve();
                })
              );
            }
          }

          // 等待所有标签页处理完成
          await Promise.all(promises);
          console.log('完成处理的标签页数量:', processedTabs);
          sendResponse({ success: true, processedTabs });
        } catch (error) {
          console.error('处理标签页时出错:', error);
          sendResponse({ success: false, error: error.message });
        }
      } else {
        console.log('没有找到规则');
        sendResponse({ success: false, error: 'No rules found' });
      }
    });

    return true; // 保持消息通道打开
  }
});

// 应用规则
async function applyRules(tabId, tab) {
  try {
    // 获取当前域名
    const domain = new URL(tab.url).hostname;
    console.log(`[Tab ${tabId}] 检查域名:`, domain);

    // 过滤出当前域名的启用规则
    const domainRules = rules
      .filter(rule => validateRule(rule))
      .filter(rule => rule.enabled && rule.domain === domain);

    if (domainRules.length > 0) {
      // 在检查规则之前保存原始标题，并返回它
      try {
        const [titleResult] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // 先尝试获取已保存的原始标题
            const existingMeta = document.querySelector('meta[name="original-page-title"]');
            if (existingMeta) {
              return existingMeta.getAttribute('content');
            }

            // 如果没有，则保存当前标题作为原始标题
            const meta = document.createElement('meta');
            meta.name = 'original-page-title';
            meta.content = document.title;
            document.head.appendChild(meta);
            console.log('[Title Updater] 保存原始标题:', document.title);
            return document.title;
          }
        });

        if (titleResult && titleResult.result) {
          tab.originalTitle = titleResult.result;
          console.log(`[Tab ${tabId}] 设置原始标题:`, tab.originalTitle);
        }
      } catch (e) {
        console.error('保存原始标题失败:', e);
      }
    }

    console.log(`[Tab ${tabId}] 找到匹配域名的规则数量:`, domainRules.length);
    console.log(`[Tab ${tabId}] 匹配的规则:`, domainRules);

    // 找到第一个匹配的规则
    for (const rule of domainRules) {
      console.log(`[Tab ${tabId}] 检查规则:`, rule);
      const matches = await matchesRule(rule, tab);
      console.log(`[Tab ${tabId}] 规则匹配结果:`, matches);

      if (matches) {
        console.log(`[Tab ${tabId}] 开始应用匹配的规则:`, rule);
        await applyRule(rule, tabId);
        break;
      }
    }
  } catch (e) {
    console.error('应用规则错误:', e);
  }
}

// 检查规则是否匹配
async function matchesRule(rule, tab) {
  try {
    const { matchRules } = rule;
    if (!matchRules) {
      console.log(`规则 ${rule.id} 没有匹配规则`);
      return false;
    }

    // 如果没有任何匹配规则，则认为匹配成功
    if (!matchRules.titlePattern?.pattern && !matchRules.urlPattern?.pattern) {
      console.log('没有设置任何匹配规则，默认匹配成功');
      return true;
    }

    let titleMatches = true;
    let urlMatches = true;

    // 使用之前保存的原始标题
    const originalTitle = tab.originalTitle || tab.title;
    console.log(`使用原始标题: "${originalTitle}"`);

    // 只有设置了标题匹配规则时才检查标题
    if (matchRules.titlePattern?.pattern) {
      titleMatches = matchesPattern(originalTitle, matchRules.titlePattern);
      console.log(`标题匹配检查 - 规则:"${matchRules.titlePattern.pattern}", 原始标题:"${originalTitle}", 结果:${titleMatches}`);
    } else {
      console.log('未设置标题匹配规则，跳过标题检查');
    }

    // 只有设置了URL匹配规则时才检查URL
    if (matchRules.urlPattern?.pattern) {
      urlMatches = matchesPattern(tab.url, matchRules.urlPattern);
      console.log(`URL匹配检查 - 规则:"${matchRules.urlPattern.pattern}", 当前URL:"${tab.url}", 结果:${urlMatches}`);
    } else {
      console.log('未设置URL匹配规则，跳过URL检查');
    }

    const matches = titleMatches && urlMatches;
    console.log(`最终匹配结果 - 标题:${titleMatches}, URL:${urlMatches}, 总结果:${matches}`);
    return matches;

  } catch (e) {
    console.error('规则匹配错误:', e);
    return false;
  }
}

// 修改匹配规则的检查逻辑
function matchesPattern(text, pattern) {
  if (!pattern || !pattern.pattern) {
    console.log('没有模式或模式为空');
    return true;
  }

  let testText = text;
  let testPattern = pattern.pattern;

  console.log(`开始匹配 - 原始文本:"${testText}", 原始模式:"${testPattern}"`);

  if (!pattern.caseSensitive) {
    testText = testText.toLowerCase();
    testPattern = testPattern.toLowerCase();
    console.log(`转换为小写 - 文本:"${testText}", 模式:"${testPattern}"`);
  }

  if (pattern.isRegex) {
    try {
      const regex = new RegExp(testPattern, pattern.caseSensitive ? '' : 'i');
      const result = regex.test(testText);
      console.log(`正则匹配 - 模式:"${testPattern}", 文本:"${testText}", 结果:${result}`);
      return result;
    } catch (e) {
      console.error('正则表达式错误:', e);
      return false;
    }
  }

  if (pattern.wholeWord) {
    const result = testText === testPattern;
    console.log(`完整匹配 - 模式:"${testPattern}", 文本:"${testText}", 结果:${result}`);
    return result;
  }

  const result = testText.includes(testPattern);
  console.log(`包含匹配 - 模式:"${testPattern}", 文本:"${testText}", 结果:${result}`);
  return result;
}

// 应用单个规则
async function applyRule(rule, tabId) {
  const { applyRules } = rule;
  console.log('开始应用规则:', rule);

  // 首先检查标签页是否还存在
  chrome.tabs.get(tabId, async (tab) => {
    if (chrome.runtime.lastError) {
      console.error('标签页不存在:', chrome.runtime.lastError);
      return;
    }

    try {
      // 注入核心更新逻辑并获取原始标题
      const [titleResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // 清理旧的定时器和数据
          if (window._titleTimer) {
            clearInterval(window._titleTimer);
            window._titleTimer = null;
          }

          // 保存原始标题
          if (!document.querySelector('meta[name="original-title"]')) {
            const metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'original-title');
            metaTag.setAttribute('content', document.title);
            document.head.appendChild(metaTag);
          }

          // 获取原始标题
          return document.querySelector('meta[name="original-title"]')?.content || document.title;
        }
      });

      const originalTitle = titleResult.result;

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
          func: (script, title) => {
            try {
              // 清理旧的定时器
              if (window._titleTimer) {
                clearInterval(window._titleTimer);
                window._titleTimer = null;
              }

              // 执行用户的脚本
              const userFunc = (0, eval)(script);

              // 设置定时器每秒执行一次用户脚本
              window._titleTimer = setInterval(() => {
                try {
                  const newTitle = userFunc(title);
                  if (typeof newTitle === 'string') {
                    document.title = newTitle;
                  }
                } catch (e) {
                  console.error('更新标题错误:', e);
                  if (window._titleTimer) {
                    clearInterval(window._titleTimer);
                    window._titleTimer = null;
                  }
                }
              }, 1000);

              // 立即执行一次
              const initialTitle = userFunc(title);
              if (typeof initialTitle === 'string') {
                document.title = initialTitle;
              }
            } catch (e) {
              console.error('执行脚本错误:', e);
              if (window._titleTimer) {
                clearInterval(window._titleTimer);
                window._titleTimer = null;
              }
            }
          },
          args: [applyRules.titleScript, originalTitle]
        });
      }
    } catch (err) {
      console.error('执行脚本错误:', err);
    }
  });
}

// 添加到文件开头
function validateRule(rule) {
  try {
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

    return true;
  } catch (e) {
    console.error('规则验证错误:', e);
    return false;
  }
}