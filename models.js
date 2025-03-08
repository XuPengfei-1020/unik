/**
 * 标题匹配模式
 */
class TitlePattern {
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
}

/**
 * URL匹配模式
 */
class URLPattern {
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
}

/**
 * 规则匹配条件
 */
class MatchRules {
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
}

/**
 * 规则应用行为
 */
class ApplyRules {
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
}

/**
 * 标题更新规则
 */
class TitleRule {
  constructor({
    id = crypto.randomUUID(),
    domain = '',
    enabled = true,
    matchRules = new MatchRules(),
    applyRules = new ApplyRules()
  } = {}) {
    this.id = id;
    this.domain = domain;
    this.enabled = enabled;
    this.matchRules = MatchRules.fromJSON(matchRules);
    this.applyRules = ApplyRules.fromJSON(applyRules);
  }

  static fromJSON(json) {
    return new TitleRule(json);
  }

  toJSON() {
    return {
      id: this.id,
      domain: this.domain,
      enabled: this.enabled,
      matchRules: this.matchRules.toJSON(),
      applyRules: this.applyRules.toJSON()
    };
  }

  /**
   * 验证规则是否有效
   */
  validate() {
    if (!this.id || typeof this.id !== 'string') return false;
    if (!this.domain || typeof this.domain !== 'string') return false;
    if (!this.matchRules) return false;
    if (!this.applyRules) return false;
    if (!this.applyRules.fixedTitle && !this.applyRules.titleScript) return false;
    return true;
  }
}

export {
  TitlePattern,
  URLPattern,
  MatchRules,
  ApplyRules,
  TitleRule
};