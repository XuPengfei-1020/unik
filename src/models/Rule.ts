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
}

/**
 * 规则应用行为
 */
export class ApplyRules {
  fixedTitle: string;
  titleScript: string | null;

  constructor({
    fixedTitle = '',
    titleScript = null
  } = {}) {
    this.fixedTitle = fixedTitle;
    this.titleScript = titleScript;
  }

  static fromJSON(json) {
    return new ApplyRules(json);
  }

  toJSON() {
    return {
      fixedTitle: this.fixedTitle,
      titleScript: this.titleScript
    };
  }

  apply(originalTitle: string): string {
    // 直接使用替换字符串，不再执行脚本
    return this.fixedTitle;
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
   * 验证规则是否有效
   */
  validate(): boolean {
    if (!this.id || typeof this.id !== 'string') return false;
    if (!this.domain || typeof this.domain !== 'string') return false;
    if (!Array.isArray(this.tags)) return false;
    if (!this.matchRules) return false;
    if (!this.applyRules) return false;
    if (!this.applyRules.fixedTitle && !this.applyRules.titleScript) return false;
    return true;
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