// 标题更新器
window.titleUpdater = {
  // 存储原始标题
  originalTitle: document.title,

  // 初始化
  init() {
    // 存储原始标题
    if (!document.querySelector('meta[name="original-title"]')) {
      const metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'original-title');
      metaTag.setAttribute('content', document.title);
      document.head.appendChild(metaTag);
    }

    // 清除旧的计时器
    if (this._timer) {
      clearInterval(this._timer);
    }

    // 初始化开始时间
    if (!window._startTime) {
      window._startTime = Date.now();
    }
  },

  // 设置更新函数
  setUpdateFunction(func) {
    this._updateFunc = func;

    // 立即更新一次
    this.update();

    // 设置定时更新
    this._timer = setInterval(() => this.update(), 1000);
  },

  // 更新标题
  update() {
    try {
      if (this._updateFunc) {
        const newTitle = this._updateFunc();
        if (newTitle && typeof newTitle === 'string') {
          document.title = newTitle;
        }
      }
    } catch (e) {
      console.error('更新标题错误:', e);
      clearInterval(this._timer);
    }
  },

  // 工具函数
  utils: {
    // 获取原始标题
    getOriginalTitle: () =>
      document.querySelector('meta[name="original-title"]')?.content || document.title,

    // 时间相关
    getTime: () => new Date().toLocaleTimeString(),
    getDate: () => new Date().toLocaleDateString(),
    getSeconds: () => Math.floor((Date.now() - window._startTime) / 1000),
    getMinutes: () => Math.floor((Date.now() - window._startTime) / 60000),
    getHours: () => Math.floor((Date.now() - window._startTime) / 3600000),

    // DOM 辅助函数
    select: selector => document.querySelector(selector),
    selectAll: selector => document.querySelectorAll(selector),
    getText: selector => document.querySelector(selector)?.textContent?.trim(),

    // 视频相关
    getVideoProgress: () => {
      const video = document.querySelector('video');
      return video ? Math.floor((video.currentTime / video.duration) * 100) : null;
    }
  }
};