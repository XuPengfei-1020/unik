// 验证域名是否合法
export function isValidDomain(domain) {
  if (!domain) return false;
  // 简单的域名验证规则
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
  return domainRegex.test(domain);
}

// 获取域名图标
export async function getDomainIcon(domain) {
  if (!isValidDomain(domain)) return null;

  // 设置超时时间为 2 秒
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    // 尝试获取 favicon
    const response = await fetch(`https://${domain}/favicon.ico`, {
      signal: controller.signal,
      mode: 'no-cors' // 避免跨域问题
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return `https://${domain}/favicon.ico`;
    }
  } catch (error) {
    // 如果获取失败，尝试使用 Google 的 favicon 服务
    try {
      const response = await fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=32`, {
        signal: controller.signal
      });

      if (response.ok) {
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      }
    } catch (error) {
      console.debug('Failed to fetch domain icon:', error);
    }
  } finally {
    clearTimeout(timeoutId);
  }

  return null;
}

// 对域名列表进行排序
export function sortDomains(domains) {
  return [...domains].sort((a, b) => {
    // 将域名转换为小写进行比较
    const domainA = a.toLowerCase();
    const domainB = b.toLowerCase();
    return domainA.localeCompare(domainB);
  });
}