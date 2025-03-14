// 页面加载时执行
document.addEventListener('DOMContentLoaded', function() {
  // 获取当前标题
  const currentTitle = '😊🤣😁💕👍😀😁😃😆😉🥰😛😜😝😺😸😻🐙🎉🍕🍿🎂🍰🍭🚀☃️🌈';

  // 提取所有 emoji
  // 使用正则表达式匹配 emoji 字符
  const emojiRegex = /(\p{Emoji})/gu;
  const emojis = [...currentTitle.matchAll(emojiRegex)].map(match => match[0]);

  // 如果找到 emoji
  if (emojis.length > 0) {
    // 随机选择一个 emoji
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    // 重复三次作为新标题
    document.title = randomEmoji.repeat(3);
  }
});