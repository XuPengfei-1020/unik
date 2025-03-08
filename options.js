// 全局变量
let rules = [];
let editingIndex = -1;

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  // 获取所有需要的 DOM 元素
  const elements = {
    searchInput: document.getElementById('search-rules'),
    domainList: document.getElementById('domain-list'),
    rulesList: document.getElementById('rules-list'),
    currentDomain: document.getElementById('current-domain'),
    addRuleButton: document.getElementById('add-rule'),
    ruleDialog: document.getElementById('rule-dialog'),
    ruleForm: document.getElementById('rule-form'),
    cancelEditButton: document.getElementById('cancel-edit'),
    importRulesButton: document.getElementById('import-rules'),
    exportRulesButton: document.getElementById('export-rules')
  };

  let currentDomainFilter = '';

  // 加载规则
  loadRules();

  // 检查是否有新规则要添加（从弹出窗口传递过来）
  chrome.storage.local.get('newRule', (data) => {
    if (data.newRule) {
      document.getElementById('url-pattern').value = data.newRule.urlPattern || '';
      document.getElementById('title-pattern').value = data.newRule.titlePattern || '';
      document.getElementById('custom-title').focus();

      // 清除临时存储
      chrome.storage.local.remove('newRule');
    }
  });

  // 从存储中加载规则
  function loadRules() {
    chrome.storage.sync.get('titleRules', (data) => {
      try {
        let loadedRules = data.titleRules || [];

        // 迁移旧数据
        loadedRules = loadedRules.map(rule => {
          if (!rule) return null;

          // 处理旧版本的数据结构
          if (rule.matchRules) {
            if (typeof rule.matchRules.titlePattern === 'string') {
              rule.matchRules.titlePattern = {
                pattern: rule.matchRules.titlePattern,
                isRegex: true,
                caseSensitive: true
              };
            }
            if (typeof rule.matchRules.urlPattern === 'string') {
              rule.matchRules.urlPattern = {
                pattern: rule.matchRules.urlPattern,
                isRegex: true,
                caseSensitive: true
              };
            }
          }

          return rule;
        }).filter(rule => rule !== null);

        // 过滤无效规则
        rules = loadedRules.filter(rule => validateRule(rule));

        // 如果有规则被更新，保存回存储
        if (JSON.stringify(loadedRules) !== JSON.stringify(rules)) {
          chrome.storage.sync.set({ titleRules: rules });
        }

        updateDomainList();
        renderRules();
      } catch (e) {
        console.error('加载规则错误:', e);
        rules = [];
        updateDomainList();
        renderRules();
      }
    });
  }

  // 更新域名列表
  function updateDomainList() {
    try {
      const validRules = rules.filter(validateRule);
      const domains = [...new Set(validRules.map(rule => rule.domain))];

      elements.domainList.innerHTML = `
        <div class="domain-item ${!currentDomainFilter ? 'active' : ''}" data-domain="">
          所有域名
        </div>
        ${domains.map(domain => `
          <div class="domain-item ${domain === currentDomainFilter ? 'active' : ''}" data-domain="${domain}">
            ${domain}
          </div>
        `).join('')}
      `;

      // 添加域名点击事件
      document.querySelectorAll('.domain-item').forEach(item => {
        item.addEventListener('click', () => {
          currentDomainFilter = item.dataset.domain;
          document.querySelectorAll('.domain-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          elements.currentDomain.textContent = currentDomainFilter || '所有规则';
          renderRules();
        });
      });
    } catch (e) {
      console.error('更新域名列表错误:', e);
      elements.domainList.innerHTML = '<div class="error">加载域名列表时出错</div>';
    }
  }

  // 渲染规则列表
  function renderRules() {
    try {
      const filteredRules = currentDomainFilter
        ? rules.filter(rule => validateRule(rule) && rule.domain === currentDomainFilter)
        : rules.filter(validateRule);

      const searchTerm = elements.searchInput.value.toLowerCase();
      const searchedRules = searchTerm
        ? filteredRules.filter(rule => {
            try {
              return (
                rule.domain.toLowerCase().includes(searchTerm) ||
                (Array.isArray(rule.tags) && rule.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
                (rule.applyRules?.fixedTitle && rule.applyRules.fixedTitle.toLowerCase().includes(searchTerm))
              );
            } catch (e) {
              console.error('搜索规则错误:', e);
              return false;
            }
          })
        : filteredRules;

      elements.rulesList.innerHTML = searchedRules.map(rule => {
        try {
          if (!validateRule(rule)) return '';

          const safeRule = {
            id: rule.id || crypto.randomUUID(),
            domain: rule.domain || '未知域名',
            tags: Array.isArray(rule.tags) ? rule.tags : [],
            matchRules: rule.matchRules || {},
            applyRules: rule.applyRules || {}
          };

          return `
            <div class="rule-card" data-id="${safeRule.id}">
              <div class="rule-header">
                <div>
                  <div class="rule-title">${safeRule.domain}</div>
                  <div class="rule-tags">
                    ${safeRule.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                  </div>
                </div>
                <div class="rule-actions">
                  <button class="edit-rule-btn btn-icon">
                    <svg viewBox="0 0 24 24">
                      <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    编辑
                  </button>
                  <button class="delete-rule-btn btn-icon" type="button">
                    <svg viewBox="0 0 24 24">
                      <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    删除
                  </button>
                </div>
              </div>
              <div class="rule-content">
                ${safeRule.matchRules.titlePattern ? `
                  <div class="rule-content-item">
                    <span class="rule-content-label">标题匹配:</span>
                    <span class="rule-content-value">
                      ${getPatternValue(safeRule.matchRules.titlePattern)}
                      ${getMatchTypeTag(safeRule.matchRules.titlePattern)}
                    </span>
                  </div>
                ` : ''}
                ${safeRule.matchRules.urlPattern ? `
                  <div class="rule-content-item">
                    <span class="rule-content-label">URL匹配:</span>
                    <span class="rule-content-value">
                      ${getPatternValue(safeRule.matchRules.urlPattern)}
                      ${getMatchTypeTag(safeRule.matchRules.urlPattern)}
                    </span>
                  </div>
                ` : ''}
                <div class="rule-content-item">
                  <span class="rule-content-label">应用规则:</span>
                  <span class="rule-content-value">${safeRule.applyRules.fixedTitle || safeRule.applyRules.titleScript || '无效规则'}</span>
                </div>
              </div>
            </div>
          `;
        } catch (e) {
          console.error('渲染规则错误:', e);
          return '';
        }
      }).join('');

      // 添加事件监听器
      addRuleCardEventListeners();
    } catch (e) {
      console.error('渲染规则列表错误:', e);
      elements.rulesList.innerHTML = '<div class="error">加载规则时出错</div>';
    }
  }

  // 添加规则卡片的事件监听器
  function addRuleCardEventListeners() {
    // 编辑按钮
    document.querySelectorAll('.edit-rule-btn').forEach(btn => {
      const ruleCard = btn.closest('.rule-card');
      if (ruleCard) {
        btn.addEventListener('click', () => editRule(ruleCard.dataset.id));
      }
    });

    // 删除按钮
    document.querySelectorAll('.delete-rule-btn').forEach(btn => {
      const ruleCard = btn.closest('.rule-card');
      if (ruleCard) {
        btn.addEventListener('click', () => deleteRule(ruleCard.dataset.id));
      }
    });
  }

  // 初始化事件监听
  function initializeEventListeners() {
    // 搜索输入
    elements.searchInput.addEventListener('input', renderRules);

    // 添加规则按钮
    elements.addRuleButton.addEventListener('click', () => {
      resetForm(); // 重置表单
      elements.ruleDialog.showModal();
    });

    // 取消编辑按钮
    elements.cancelEditButton.addEventListener('click', () => {
      elements.ruleDialog.close();
      resetForm();
    });

    // 规则表单提交
    elements.ruleForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveRule();
    });

    // 导入规则按钮
    elements.importRulesButton.addEventListener('click', importRules);

    // 导出规则按钮
    elements.exportRulesButton.addEventListener('click', exportRules);
  }

  // 添加匹配选项处理
  function initializePatternOptions() {
    const patterns = ['title', 'url'];
    const options = ['case', 'word', 'regex'];

    // 创建隐藏的状态字段（如果不存在）
    patterns.forEach(pattern => {
      let optionsInput = document.getElementById(`${pattern}-options`);
      if (!optionsInput) {
        optionsInput = document.createElement('input');
        optionsInput.type = 'hidden';
        optionsInput.id = `${pattern}-options`;
        optionsInput.value = '{}';
        document.getElementById(`${pattern}-pattern`).parentNode.appendChild(optionsInput);
      }
    });

    // 添加按钮事件监听
    patterns.forEach(pattern => {
      options.forEach(option => {
        const btn = document.querySelector(`.pattern-option[data-option="${option}"][data-for="${pattern}"]`);
        if (btn) {
          btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            updatePatternState(pattern);
          });
        }
      });
    });
  }

  // 更新匹配选项的状态
  function updatePatternState(pattern) {
    const optionsInput = document.getElementById(`${pattern}-options`);
    if (!optionsInput) return;

    const getOption = (option) =>
      document.querySelector(`.pattern-option[data-option="${option}"][data-for="${pattern}"]`)
      ?.classList.contains('active') || false;

    const state = {
      caseSensitive: getOption('case'),
      wholeWord: getOption('word'),
      isRegex: getOption('regex')
    };

    optionsInput.value = JSON.stringify(state);
  }

  // 设置匹配选项的状态
  function setPatternState(pattern, options = {}) {
    const { caseSensitive, wholeWord, isRegex } = options;

    ['case', 'word', 'regex'].forEach(option => {
      const btn = document.querySelector(`.pattern-option[data-option="${option}"][data-for="${pattern}"]`);
      if (btn) {
        btn.classList.toggle('active',
          option === 'case' ? caseSensitive :
          option === 'word' ? wholeWord :
          option === 'regex' ? isRegex : false
        );
      }
    });

    updatePatternState(pattern);
  }

  // 修改保存规则的逻辑
  function saveRule() {
    const titleType = document.querySelector('input[name="title-type"]:checked').value;

    const formData = {
      id: elements.ruleForm.dataset.editId || crypto.randomUUID(),
      domain: document.getElementById('rule-domain').value,
      tags: document.getElementById('rule-tags').value.split(',').map(t => t.trim()).filter(t => t),
      matchRules: {
        titlePattern: {
          pattern: document.getElementById('title-pattern').value,
          isRegex: JSON.parse(document.getElementById('title-options').value || '{}').isRegex || false,
          caseSensitive: JSON.parse(document.getElementById('title-options').value || '{}').caseSensitive || false,
          wholeWord: JSON.parse(document.getElementById('title-options').value || '{}').wholeWord || false
        },
        urlPattern: {
          pattern: document.getElementById('url-pattern').value,
          isRegex: JSON.parse(document.getElementById('url-options').value || '{}').isRegex || false,
          caseSensitive: JSON.parse(document.getElementById('url-options').value || '{}').caseSensitive || false,
          wholeWord: JSON.parse(document.getElementById('url-options').value || '{}').wholeWord || false
        }
      },
      applyRules: {
        fixedTitle: titleType === 'fixed' ? document.getElementById('fixed-title').value : undefined,
        titleScript: titleType === 'script' ? document.getElementById('title-script').value : undefined
      },
      enabled: true,
      createTime: elements.ruleForm.dataset.createTime || Date.now()
    };

    // 验证并保存规则
    if (validateRule(formData)) {
      console.log('保存规则:', formData);
      const index = rules.findIndex(r => r.id === formData.id);
      if (index >= 0) {
        rules[index] = formData;
      } else {
        rules.push(formData);
      }

      // 保存到存储并立即应用
      chrome.storage.sync.set({ titleRules: rules }, () => {
        if (chrome.runtime.lastError) {
          console.error('保存规则失败:', chrome.runtime.lastError);
          return;
        }

        console.log('规则已保存到存储');

        // 通知后台服务工作进程重新加载规则
        chrome.runtime.sendMessage({ type: 'reloadRules' }, (response) => {
          console.log('收到后台响应:', response);

          if (chrome.runtime.lastError) {
            console.error('通知后台重新加载规则失败:', chrome.runtime.lastError);
          } else if (response && response.success) {
            console.log(`成功处理了 ${response.processedTabs} 个标签页`);
            // 关闭对话框
            elements.ruleDialog.close();
            // 重置表单
            resetForm();
            // 重新加载规则列表
            loadRules();
          } else {
            console.error('规则应用失败:', response);
          }
        });
      });
    } else {
      console.error('规则验证失败:', formData);
    }
  }

  // 验证规则
  function validateRule(rule) {
    try {
      // 检查必需的字段
      if (!rule || typeof rule !== 'object') return false;
      if (!rule.id || typeof rule.id !== 'string') return false;
      if (!rule.domain || typeof rule.domain !== 'string') return false;

      // 检查 matchRules
      if (!rule.matchRules || typeof rule.matchRules !== 'object') return false;

      // 处理旧版本的数据结构
      if (typeof rule.matchRules.titlePattern === 'string') {
        rule.matchRules.titlePattern = {
          pattern: rule.matchRules.titlePattern,
          isRegex: true,
          caseSensitive: true
        };
      }
      if (typeof rule.matchRules.urlPattern === 'string') {
        rule.matchRules.urlPattern = {
          pattern: rule.matchRules.urlPattern,
          isRegex: true,
          caseSensitive: true
        };
      }

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

      if (!hasMatchRule) {
        console.error('规则缺少匹配条件:', rule);
        return false;
      }

      // 检查 applyRules
      if (!rule.applyRules || typeof rule.applyRules !== 'object') return false;
      if (!rule.applyRules.fixedTitle && !rule.applyRules.titleScript) {
        console.error('规则缺少应用规则:', rule);
        return false;
      }

      return true;
    } catch (e) {
      console.error('规则验证错误:', e, rule);
      return false;
    }
  }

  // 编辑规则
  function editRule(id) {
    try {
      const rule = rules.find(r => validateRule(r) && r.id === id);
      if (!rule) {
        console.error('找不到有效的规则:', id);
        return;
      }

      // 设置表单数据
      const form = document.getElementById('rule-form');
      form.dataset.editId = rule.id;
      form.dataset.createTime = rule.createTime;

      // 设置基本信息
      document.getElementById('rule-domain').value = rule.domain;
      document.getElementById('rule-tags').value = rule.tags.join(',');

      // 设置匹配规则
      document.getElementById('title-pattern').value = rule.matchRules.titlePattern?.pattern || '';
      document.getElementById('title-options').value = JSON.stringify({
        isRegex: rule.matchRules.titlePattern?.isRegex || false,
        caseSensitive: rule.matchRules.titlePattern?.caseSensitive || false,
        wholeWord: rule.matchRules.titlePattern?.wholeWord || false
      });

      document.getElementById('url-pattern').value = rule.matchRules.urlPattern?.pattern || '';
      document.getElementById('url-options').value = JSON.stringify({
        isRegex: rule.matchRules.urlPattern?.isRegex || false,
        caseSensitive: rule.matchRules.urlPattern?.caseSensitive || false,
        wholeWord: rule.matchRules.urlPattern?.wholeWord || false
      });

      // 设置应用规则
      if (rule.applyRules.fixedTitle) {
        document.querySelector('input[name="title-type"][value="fixed"]').checked = true;
        document.getElementById('fixed-title').value = rule.applyRules.fixedTitle;
      } else if (rule.applyRules.titleScript) {
        document.querySelector('input[name="title-type"][value="script"]').checked = true;
        document.getElementById('title-script').value = rule.applyRules.titleScript;
      }

      // 显示对话框
      document.getElementById('rule-dialog').showModal();

    } catch (e) {
      console.error('编辑规则错误:', e);
      alert('编辑规则时出错');
    }
  }

  // 删除规则
  function deleteRule(id) {
    if (!confirm('确定要删除这条规则吗？')) return;

    const index = rules.findIndex(r => r.id === id);
    if (index >= 0) {
      rules.splice(index, 1);
      chrome.storage.sync.set({ titleRules: rules }, loadRules);
    }
  }

  // 导入规则
  function importRules() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedRules = JSON.parse(event.target.result);
          if (Array.isArray(importedRules)) {
            chrome.storage.sync.set({ titleRules: importedRules }, () => {
              alert('规则导入成功');
              loadRules();
            });
          } else {
            alert('无效的规则文件格式');
          }
        } catch (error) {
          alert('导入失败：' + error.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // 导出规则
  function exportRules() {
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'title-rules.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // 修改匹配类型标签生成函数
  function getMatchTypeTag(matchRule) {
    if (!matchRule) return '';

    const tags = [];
    if (matchRule.caseSensitive) {
      tags.push(`
        <span class="match-type-tag" title="大小写敏感">
          <span style="font-weight: 600;">Aa</span>
        </span>
      `);
    }
    if (matchRule.wholeWord) {
      tags.push(`
        <span class="match-type-tag" title="完整匹配">
          <span class="word-match-icon">ab</span>
        </span>
      `);
    }
    if (matchRule.isRegex) {
      tags.push(`
        <span class="match-type-tag" title="正则表达式">
          <span style="font-weight: 600;">.*</span>
        </span>
      `);
    }
    return tags.join('');
  }

  // 在渲染规则时添加安全检查
  function getPatternValue(pattern) {
    if (!pattern) return '';
    return typeof pattern === 'string' ? pattern : pattern.pattern || '';
  }

  // 初始化
  loadRules();
  initializeEventListeners();
  initializePatternOptions();
});

// 重置表单
function resetForm() {
  const form = document.getElementById('rule-form');
  if (form) {
    form.reset();
    delete form.dataset.editId;
    delete form.dataset.createTime;
  }
}