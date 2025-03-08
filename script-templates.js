// 标题模板函数
const titleTemplates = {
  // 显示当前时间
  showTime: function() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const originalTitle = document.querySelector('meta[name="original-title"]')?.content || document.title;
    return `[${timeStr}] ${originalTitle}`;
  },

  // 显示页面停留时间
  showDuration: function() {
    if (!window._startTime) {
      window._startTime = Date.now();
    }
    const seconds = Math.floor((Date.now() - window._startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const timeStr = hours > 0 ?
      `${hours}时${minutes % 60}分` :
      `${minutes}分${seconds % 60}秒`;

    const originalTitle = document.querySelector('meta[name="original-title"]')?.content || document.title;
    return `[${timeStr}] ${originalTitle}`;
  },

  // 显示视频进度
  showVideoProgress: function() {
    const video = document.querySelector('video');
    if (!video) return document.title;

    const progress = Math.floor((video.currentTime / video.duration) * 100);
    const originalTitle = document.querySelector('meta[name="original-title"]')?.content || document.title;
    return `[${progress}%] ${originalTitle}`;
  },

  // 显示未读消息数
  showUnreadCount: function() {
    const unreadCount = document.querySelectorAll('.unread-message').length;
    const originalTitle = document.querySelector('meta[name="original-title"]')?.content || document.title;
    return unreadCount > 0 ? `(${unreadCount}) ${originalTitle}` : originalTitle;
  }
};

// 匹配模板函数
const matchTemplates = {
  // 检查是否有视频
  hasVideo: function() {
    return document.querySelector('video') !== null;
  },

  // 检查特定路径
  checkPath: function(path) {
    return location.pathname.startsWith(path);
  },

  // 检查特定元素
  hasElement: function(selector) {
    return document.querySelector(selector) !== null;
  }
};