/**
 * 标题匹配模式
 */
export class TitlePattern {
  pattern: string;
  caseSensitive: boolean;
  isRegex: boolean;
  wholeWord: boolean;

  constructor({
    pattern = '',
    caseSensitive = false,
    isRegex = false,
    wholeWord = false
  } = {}) {
    this.pattern = pattern;
    this.caseSensitive = caseSensitive;
    this.isRegex = isRegex;
    this.wholeWord = wholeWord;
  }

  static fromJSON(json) {
    return new TitlePattern(json);
  }

  toJSON() {
    return {
      pattern: this.pattern,
      caseSensitive: this.caseSensitive,
      isRegex: this.isRegex,
      wholeWord: this.wholeWord
    };
  }

  matches(title: string): boolean {
    try {
      const flags = this.caseSensitive ? '' : 'i';
      const pattern = this.isRegex ? this.pattern :
        this.wholeWord ? `\\b${this.pattern}\\b` : this.pattern;
      return new RegExp(pattern, flags).test(title);
    } catch (e) {
      console.error('Error matching title pattern:', e);
      return false;
    }
  }

  validate(): { isValid: boolean; error?: string } {
    if (!this.pattern) {
      return { isValid: false, error: '请输入标题匹配模式' };
    }
    return { isValid: true };
  }
}

/**
 * URL匹配模式
 */
export class URLPattern {
  pattern: string;
  caseSensitive: boolean;
  isRegex: boolean;
  wholeWord: boolean;

  constructor({
    pattern = '',
    caseSensitive = false,
    isRegex = false,
    wholeWord = false
  } = {}) {
    this.pattern = pattern;
    this.caseSensitive = caseSensitive;
    this.isRegex = isRegex;
    this.wholeWord = wholeWord;
  }

  static fromJSON(json) {
    return new URLPattern(json);
  }

  toJSON() {
    return {
      pattern: this.pattern,
      caseSensitive: this.caseSensitive,
      isRegex: this.isRegex,
      wholeWord: this.wholeWord
    };
  }

  matches(url: string): boolean {
    try {
      const flags = this.caseSensitive ? '' : 'i';
      const pattern = this.isRegex ? this.pattern :
        this.wholeWord ? `\\b${this.pattern}\\b` : this.pattern;
      return new RegExp(pattern, flags).test(url);
    } catch (e) {
      console.error('Error matching URL pattern:', e);
      return false;
    }
  }

  validate(): { isValid: boolean; error?: string } {
    if (!this.pattern) {
      return { isValid: false, error: '请输入URL匹配模式' };
    }
    return { isValid: true };
  }
}

/**
 * 规则匹配条件
 */
export class MatchRules {
  titlePattern: TitlePattern | null;
  urlPattern: URLPattern | null;

  constructor({
    titlePattern = null,
    urlPattern = null
  } = {}) {
    this.titlePattern = titlePattern ? TitlePattern.fromJSON(titlePattern) : null;
    this.urlPattern = urlPattern ? URLPattern.fromJSON(urlPattern) : null;
  }

  static fromJSON(json) {
    return new MatchRules(json);
  }

  toJSON() {
    return {
      titlePattern: this.titlePattern?.toJSON(),
      urlPattern: this.urlPattern?.toJSON()
    };
  }

  matches(url: string, title: string): boolean {
    if (this.urlPattern && !this.urlPattern.matches(url)) return false;
    if (this.titlePattern && !this.titlePattern.matches(title)) return false;
    return true;
  }

  validate(): { isValid: boolean; error?: string } {
    // 至少需要一个匹配规则
    if (!this.titlePattern?.pattern && !this.urlPattern?.pattern) {
      return { isValid: false, error: '请至少设置一个匹配规则（标题或URL）' };
    }

    // 验证标题匹配规则
    if (this.titlePattern) {
      const titleValidation = this.titlePattern.validate();
      if (!titleValidation.isValid) {
        return titleValidation;
      }
    }

    // 验证URL匹配规则
    if (this.urlPattern) {
      const urlValidation = this.urlPattern.validate();
      if (!urlValidation.isValid) {
        return urlValidation;
      }
    }

    return { isValid: true };
  }
}

/**
 * 规则应用行为
 */
export class ApplyRules {
  fixedTitle: string;
  titleScript: string | null;
  interval: number;

  constructor({
    fixedTitle = '',
    titleScript = null,
    interval = 0
  } = {}) {
    this.fixedTitle = fixedTitle;
    this.titleScript = titleScript;
    this.interval = interval;
  }

  static fromJSON(json) {
    return new ApplyRules(json);
  }

  toJSON() {
    return {
      fixedTitle: this.fixedTitle,
      titleScript: this.titleScript,
      interval: this.interval
    };
  }

  apply(originalTitle: string): string {
    // 直接使用替换字符串，不再执行脚本
    return this.fixedTitle;
  }

  validate(): { isValid: boolean; error?: string } {
    if (!this.fixedTitle && !this.titleScript) {
      return { isValid: false, error: '请输入固定标题或自定义脚本' };
    }
    if (this.titleScript && this.interval < 0) {
      return { isValid: false, error: '循环执行间隔必须大于等于0' };
    }
    return { isValid: true };
  }
}

/**
 * 标题更新规则
 */
export class TitleRule {
  id: string;
  domain: string;
  enabled: boolean;
  tags: string[];
  matchRules: MatchRules;
  applyRules: ApplyRules;
  createTime: number;
  updateTime: number;

  constructor({
    id = crypto.randomUUID(),
    domain = '',
    enabled = true,
    tags = [],
    matchRules = new MatchRules(),
    applyRules = new ApplyRules(),
    createTime = Date.now(),
    updateTime = Date.now()
  } = {}) {
    this.id = id;
    this.domain = domain;
    this.enabled = enabled;
    this.tags = Array.isArray(tags) ? tags : [];
    this.matchRules = MatchRules.fromJSON(matchRules);
    this.applyRules = ApplyRules.fromJSON(applyRules);
    this.createTime = createTime;
    this.updateTime = updateTime;
  }

  static fromJSON(json) {
    return new TitleRule(json);
  }

  toJSON() {
    return {
      id: this.id,
      domain: this.domain,
      enabled: this.enabled,
      tags: this.tags,
      matchRules: this.matchRules.toJSON(),
      applyRules: this.applyRules.toJSON(),
      createTime: this.createTime,
      updateTime: this.updateTime
    };
  }

  /**
   * 验证规则是否有效，返回验证结果和错误信息
   */
  validate(): { isValid: boolean; error?: string } {
    if (!this.id || typeof this.id !== 'string') {
      return { isValid: false, error: '规则ID无效' };
    }
    if (!this.domain || typeof this.domain !== 'string') {
      return { isValid: false, error: '请输入域名' };
    }
    if (!Array.isArray(this.tags)) {
      return { isValid: false, error: '标签格式无效' };
    }

    // 验证匹配规则
    const matchRulesValidation = this.matchRules.validate();
    if (!matchRulesValidation.isValid) {
      return matchRulesValidation;
    }

    // 验证应用规则
    const applyRulesValidation = this.applyRules.validate();
    if (!applyRulesValidation.isValid) {
      return applyRulesValidation;
    }

    return { isValid: true };
  }

  /**
   * 检查规则是否匹配给定的 URL 和标题
   */
  matches(url: string, title: string): boolean {
    if (!this.enabled) return false;
    const domain = new URL(url).hostname;
    if (domain !== this.domain) return false;
    return this.matchRules.matches(url, title);
  }

  /**
   * 应用规则到给定的标题
   */
  apply(originalTitle: string): string {
    return this.applyRules.apply(originalTitle);
  }
}