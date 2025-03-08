export function matchRule(rule: Rule, url: string, title: string): boolean {
  if (!rule.enabled) return false;

  try {
    const urlMatches = new RegExp(rule.urlPattern).test(url);
    const titleMatches = new RegExp(rule.titlePattern).test(title);
    return urlMatches && titleMatches;
  } catch (e) {
    console.error('Error matching rule:', e);
    return false;
  }
}

export function applyRule(rule: Rule, originalTitle: string): string {
  // 直接使用替换字符串，不再执行脚本
  return rule.replacement;
}