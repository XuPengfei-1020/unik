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
function applyRule(rule, tabId) {
  const { applyRules } = rule;
  console.log('开始应用规则:', rule);

  // 首先检查标签页是否还存在
  chrome.tabs.get(tabId, async (tab) => {
    if (chrome.runtime.lastError) {
      console.error('标签页不存在:', chrome.runtime.lastError);
      return;
    }

    try {
      // 先清除所有可能的定时器和脚本，并等待清理完成
      console.log('清理旧的定时器和脚本...');
      const cleanupResult = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          console.log('[Title Updater] 开始清理...');

          // 清除定时器
          if (window._titleTimer) {
            console.log('[Title Updater] 清除旧的定时器');
            clearInterval(window._titleTimer);
            window._titleTimer = null;
          }

          // 移除旧的脚本
          const oldScript = document.querySelector('script[data-title-updater]');
          if (oldScript) {
            console.log('[Title Updater] 移除旧的脚本');
            oldScript.remove();
          }

          return new Promise((resolve) => {
            setTimeout(() => {
              console.log('[Title Updater] 清理完成');
              resolve(true);
            }, 100);
          });
        }
      });
      console.log('清理结果:', cleanupResult);

      if (applyRules.fixedTitle) {
        console.log('应用固定标题:', applyRules.fixedTitle);
        // 应用固定标题
        const result = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: (newTitle) => {
            console.log('[Title Updater] 应用固定标题:', newTitle);
            return new Promise((resolve) => {
              try {
                // 确保没有活跃的定时器
                if (window._titleTimer) {
                  console.log('[Title Updater] 清除已存在的定时器');
                  clearInterval(window._titleTimer);
                  window._titleTimer = null;
                }

                // 更改标题
                document.title = newTitle;
                console.log('[Title Updater] 标题已更新为:', newTitle);

                // 使用 setInterval 替代 setTimeout
                window._titleTimer = setInterval(() => {
                  if (document.title !== newTitle) {
                    console.log('[Title Updater] 检测到标题被修改，重新设置');
                    document.title = newTitle;
                  }
                }, 1000);

                resolve(true);
              } catch (e) {
                console.error('[Title Updater] 设置标题错误:', e);
                resolve(false);
              }
            });
          },
          args: [applyRules.fixedTitle]
        });
        console.log('固定标题应用结果:', result);
      } else if (applyRules.titleScript) {
        console.log('应用自定义脚本');
        await executeScript(applyRules.titleScript, tabId);
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

// 预定义的标题更新函数
const TITLE_FUNCTIONS = {
  'time': (originalTitle) => {
    const now = new Date();
    return `[${now.toLocaleTimeString()}] ${originalTitle}`;
  },
  'date': (originalTitle) => {
    const now = new Date();
    return `[${now.toLocaleDateString()} ${now.toLocaleTimeString()}] ${originalTitle}`;
  },
  'duration': (originalTitle, startTime) => {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const timeStr = hours > 0 ?
      `${hours}时${minutes % 60}分` :
      `${minutes}分${seconds % 60}秒`;
    return `[${timeStr}] ${originalTitle}`;
  },
  'video': (originalTitle) => {
    const video = document.querySelector('video');
    if (!video) return originalTitle;
    const progress = Math.floor((video.currentTime / video.duration) * 100);
    return `[${progress}%] ${originalTitle}`;
  },
  'custom_time': (originalTitle) => {
    const now = new Date();
    return `[${now.getHours()}:${now.getMinutes()}] ${originalTitle}`;
  },
  'custom_counter': (originalTitle, startTime) => {
    const count = Math.floor((Date.now() - startTime) / 1000);
    return `(${count}) ${originalTitle}`;
  }
  // ... 可以添加更多预定义函数
};

// 应用标题生成脚本
async function executeScript(script, tabId) {
  try {
    console.log('开始执行自定义脚本'); // Background context log

    // 1. 创建一个 Blob URL 包含用户脚本
    const scriptContent = `
      (function() {
        return new Promise((resolve) => {
          try {
            console.log('[Title Updater] 开始执行自定义脚本');

            // 清理函数
            function cleanup() {
              console.log('[Title Updater] 执行清理');
              if (window._titleTimer) {
                clearInterval(window._titleTimer);
                window._titleTimer = null;
                console.log('[Title Updater] 清理了定时器');
              }
              const oldScript = document.querySelector('script[data-title-updater]');
              if (oldScript) {
                oldScript.remove();
                console.log('[Title Updater] 清理了旧脚本');
              }
            }

            // 先清理旧的定时器和脚本
            cleanup();

            // 存储原始标题
            if (!window._originalTitle) {
              window._originalTitle = document.title;
              console.log('[Title Updater] 保存原始标题:', window._originalTitle);
            }

            // 工具函数
            const utils = {
              getOriginalTitle: () => window._originalTitle,
              getTime: () => new Date().toLocaleTimeString(),
              getDate: () => new Date().toLocaleDateString(),
              getSeconds: () => Math.floor((Date.now() - window._startTime) / 1000),
              getMinutes: () => Math.floor((Date.now() - window._startTime) / 60000),
              getHours: () => Math.floor((Date.now() - window._startTime) / 3600000),
              select: selector => document.querySelector(selector),
              selectAll: selector => document.querySelectorAll(selector),
              getText: selector => document.querySelector(selector)?.textContent?.trim(),
              getVideoProgress: () => {
                const video = document.querySelector('video');
                return video ? Math.floor((video.currentTime / video.duration) * 100) : null;
              }
            };

            // 初始化
            window._startTime = Date.now();
            console.log('[Title Updater] 初始化完成');

            // 执行用户脚本
            console.log('[Title Updater] 开始执行用户脚本');
            const userScript = ${JSON.stringify(script)};
            let updateTitle;

            try {
              // 验证用户脚本返回的是函数
              updateTitle = (new Function('utils', 'return ' + userScript))(utils);
              console.log('[Title Updater] 脚本执行结果类型:', typeof updateTitle);

              if (typeof updateTitle !== 'function') {
                throw new Error('脚本必须返回一个函数');
              }

              // 测试函数是否能正常执行并返回字符串
              const testResult = updateTitle();
              console.log('[Title Updater] 测试执行结果:', testResult);

              if (typeof testResult !== 'string') {
                throw new Error('函数必须返回字符串');
              }
            } catch (e) {
              console.error('[Title Updater] 脚本验证错误:', e);
              cleanup();
              resolve(false);
              return;
            }

            // 设置定时更新
            console.log('[Title Updater] 设置定时更新');
            window._titleTimer = setInterval(() => {
              try {
                const newTitle = updateTitle();
                if (newTitle && typeof newTitle === 'string') {
                  document.title = newTitle;
                }
              } catch (e) {
                console.error('[Title Updater] 更新标题错误:', e);
                cleanup();
              }
            }, 1000);

            // 立即执行一次
            const initialTitle = updateTitle();
            if (initialTitle && typeof initialTitle === 'string') {
              document.title = initialTitle;
              console.log('[Title Updater] 初始标题已设置:', initialTitle);
            }

            resolve(true);
          } catch (e) {
            console.error('[Title Updater] 初始化标题错误:', e);
            cleanup();
            resolve(false);
          }
        });
      })();
    `;

    // 2. 注入脚本
    console.log('注入脚本到页面'); // Background context log
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: (code) => {
        return new Promise((resolve) => {
          try {
            console.log('[Title Updater] 开始注入脚本');
            const script = document.createElement('script');
            script.setAttribute('data-title-updater', 'true');
            script.textContent = code;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
            console.log('[Title Updater] 脚本注入完成');
            setTimeout(() => resolve(true), 100);
          } catch (e) {
            console.error('[Title Updater] 注入脚本错误:', e);
            resolve(false);
          }
        });
      },
      args: [scriptContent]
    });
    console.log('脚本注入结果:', result); // Background context log

  } catch (e) {
    console.error('执行脚本错误:', e); // Background context log
  }
}

// 预定义一个通用的脚本执行器
function executeUserScript(script) {
  // 存储原始标题
  if (!document.querySelector('meta[name="original-title"]')) {
    const metaTag = document.createElement('meta');
    metaTag.setAttribute('name', 'original-title');
    metaTag.setAttribute('content', document.title);
    document.head.appendChild(metaTag);
  }

  // 提供一些通用的工具函数和变量
  const originalTitle = document.querySelector('meta[name="original-title"]')?.content || document.title;
  const getTime = () => new Date().toLocaleTimeString();
  const getDate = () => new Date().toLocaleDateString();
  const getSeconds = () => Math.floor((Date.now() - window._startTime) / 1000);
  const getMinutes = () => Math.floor(getSeconds() / 60);
  const getHours = () => Math.floor(getMinutes() / 60);

  // 执行用户脚本
  try {
    // 用户脚本可以访问上面定义的所有变量和函数
    return eval(script);
  } catch (e) {
    console.error('脚本执行错误:', e);
    return originalTitle;
  }
}