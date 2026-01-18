/**
 * Geek Minimal v2 - 优化版
 * 性能优化 + 移动端体验增强
 */
(function () {
  'use strict';

  const THEME_CONFIG = window.__THEME_CONFIG__ || {};

  // ============================================
  // 工具函数
  // ============================================
  const Utils = {
    // 检测移动设备
    isMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    // 防抖
    debounce(func, wait) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    },

    // 节流
    throttle(func, limit) {
      let inThrottle;
      return function (...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    // 显示用户提示
    showToast(message, type = 'info', duration = 3000) {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        bottom: calc(20px + env(safe-area-inset-bottom));
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        padding: 12px 20px;
        background: var(--bg-code);
        color: #fff;
        border-radius: 8px;
        font-size: 0.875rem;
        z-index: 9999;
        opacity: 0;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;

      document.body.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
      });

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  };

  // ============================================
  // 打字机效果 - 性能优化版
  // ============================================
  class Typewriter {
    constructor(el, texts, options = {}) {
      if (!el) return;
      this.el = el;
      // ✨ 随机打乱文案顺序
      this.texts = this.shuffle([...texts]);
      this.options = {
        typeSpeed: 80,      // 打字速度（更慢）
        deleteSpeed: 40,    // 删除速度
        pauseTime: 3000,    // 显示完整后停顿时间（3秒）
        ...options
      };
      this.textIndex = 0;
      this.charIndex = 0;
      this.isDeleting = false;
      this.isPausing = false;  // 是否正在停顿中
      this.rafId = null;
      this.lastTime = 0;

      // 移动端优化：降低速度，减少重排
      if (Utils.isMobile()) {
        this.options.typeSpeed = 80;
        this.options.deleteSpeed = 40;
      }

      this.start();
    }

    // Fisher-Yates 随机打乱算法
    shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    start() {
      this.lastTime = performance.now();
      this.tick();
    }

    tick(currentTime = performance.now()) {
      const elapsed = currentTime - this.lastTime;
      const current = this.texts[this.textIndex];

      // 如果正在停顿中，检查是否停顿时间已到
      if (this.isPausing) {
        if (elapsed >= this.options.pauseTime) {
          this.isPausing = false;
          this.isDeleting = true;
          this.lastTime = currentTime;
        }
        this.rafId = requestAnimationFrame((time) => this.tick(time));
        return;
      }

      let delay = this.isDeleting ? this.options.deleteSpeed : this.options.typeSpeed;

      if (elapsed >= delay) {
        if (this.isDeleting) {
          this.charIndex--;
        } else {
          this.charIndex++;
        }

        // 使用 textContent 而不是 innerHTML，性能更好
        this.el.textContent = current.substring(0, this.charIndex);
        this.lastTime = currentTime;

        // 打完一句后，进入停顿状态
        if (!this.isDeleting && this.charIndex === current.length) {
          this.isPausing = true;
          this.lastTime = currentTime;
        } else if (this.isDeleting && this.charIndex === 0) {
          this.isDeleting = false;
          this.textIndex++;
          // 当所有文案都展示过一遍后，重新打乱
          if (this.textIndex >= this.texts.length) {
            this.texts = this.shuffle(this.texts);
            this.textIndex = 0;
          }
        }
      }

      this.rafId = requestAnimationFrame((time) => this.tick(time));
    }

    destroy() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }
    }
  }

  // ============================================
  // 主题切换
  // ============================================
  class ThemeToggle {
    constructor() {
      this.KEY = 'theme';
      this.meta = document.querySelector('meta[name="theme-color"]');
      // 主题开关按钮（当前主题可能没有这个元素，但仍需要初始化主题）
      this.btn = document.getElementById('themeSwitch');
      this.init();
    }

    init() {
      try {
        // 仅接受 light/dark，其它值视为未设置（避免“默认模式不明确”）
        const savedRaw = localStorage.getItem(this.KEY);
        const saved = (savedRaw === 'light' || savedRaw === 'dark') ? savedRaw : null;
        if (savedRaw && !saved) {
          localStorage.removeItem(this.KEY);
        }
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved || (prefersDark ? 'dark' : 'light');

        this.set(theme);

        if (this.btn) {
          this.btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
          this.btn.addEventListener('click', () => {
            const current = document.documentElement.dataset.theme;
            const next = current === 'light' ? 'dark' : 'light';
            this.set(next);
            localStorage.setItem(this.KEY, next);
            Utils.showToast(`已切换到${next === 'dark' ? '深色' : '浅色'}模式`);
          });
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
          if (!localStorage.getItem(this.KEY)) {
            this.set(e.matches ? 'dark' : 'light');
          }
        });
      } catch (e) {
        console.error('主题切换初始化失败:', e);
      }
    }

    set(theme) {
      // ✨ 添加主题切换过渡动画
      document.documentElement.classList.add('theme-transitioning');

      // 设置 data-theme
      document.documentElement.dataset.theme = theme;

      // 同步更新内联样式（与防闪白脚本保持一致）
      const palette = THEME_CONFIG.themeColor || { light: '#faf9f7', dark: '#111110' };
      const colors = THEME_CONFIG.textColor || { light: '#1a1a1a', dark: '#e8e6e3' };
      document.documentElement.style.background = palette[theme];
      document.documentElement.style.color = colors[theme];

      if (this.meta) {
        this.meta.setAttribute('content', palette[theme] || palette.light);
      }
      if (this.btn) {
        this.btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
        this.btn.setAttribute('aria-label', theme === 'dark' ? '切换为浅色模式' : '切换为深色模式');
        const label = this.btn.querySelector('.switch-label');
        if (label) {
          label.textContent = theme === 'dark' ? '浅色模式' : '深色模式';
        }
      }

      // 动画结束后移除类
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 300);
    }
  }

  // ============================================
  // （已移除）移动端菜单
  // ============================================
  // 移动端菜单已按需求彻底移除（HTML/CSS/JS）

  // ============================================
  // 搜索 - 添加键盘导航 + 错误处理 + 结果缓存
  // ============================================
  class Search {
    constructor(options = {}) {
      const {
        inputId = 'searchInput',
        resultsId = 'searchResults',
        resultsWrapId = '',
        deferLoad = false
      } = options || {};
      this.input = document.getElementById(inputId);
      this.results = document.getElementById(resultsId);
      this.resultsWrap = resultsWrapId ? document.getElementById(resultsWrapId) : null;
      this.config = THEME_CONFIG.search || {};
      const root = (this.config.root || '/').trim();
      this.root = root.endsWith('/') ? root : `${root}/`;
      this.posts = [];
      this.currentIndex = -1;
      // deferLoad 用于：tabbar 场景优先复用主搜索索引，避免重复 fetch / 竞态
      this.isLoading = !!deferLoad;
      this.cache = new Map(); // ✨ 添加搜索结果缓存
      this.ready = Promise.resolve(); // 允许外部 await 搜索索引就绪

      if (this.input && this.results) {
        if (!deferLoad) {
          this.ready = this.loadPosts();
        }
        this.bindEvents();
      }
    }

    setResultsWrapOpen(open) {
      if (!this.resultsWrap) return;
      if (open) {
        this.resultsWrap.classList.add('is-open');
        this.resultsWrap.setAttribute('aria-hidden', 'false');
        // 兜底：确保面板可见且可点击（避免被其它样式覆盖导致“只露出一条缝/点不到”）
        this.resultsWrap.style.opacity = '1';
        this.resultsWrap.style.pointerEvents = 'auto';
        this.resultsWrap.style.transform = 'translateY(0)';
      } else {
        this.resultsWrap.classList.remove('is-open');
        this.resultsWrap.setAttribute('aria-hidden', 'true');
        this.resultsWrap.style.opacity = '0';
        this.resultsWrap.style.pointerEvents = 'none';
        this.resultsWrap.style.transform = 'translateY(12px)';
      }
    }

    async loadPosts() {
      if (this.config.enabled === false) {
        this.buildFromDom();
        return;
      }

      this.isLoading = true;
      const searchUrl = `${this.root}search.json`;

      try {
        const response = await fetch(searchUrl, {
          credentials: 'same-origin',
          timeout: 5000
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          this.posts = data.map(item => this.normalizeItem(item)).filter(Boolean);
        } else if (Array.isArray(data?.posts)) {
          this.posts = data.posts.map(item => this.normalizeItem(item)).filter(Boolean);
        }

        if (!this.posts.length) {
          this.buildFromDom();
        }
      } catch (error) {
        console.warn('搜索索引加载失败，使用DOM构建:', error);
        this.buildFromDom();
      } finally {
        this.isLoading = false;

        // ✨ 修复：移动端常见“先输入、后加载完成”时序问题
        // 当用户在索引加载过程中已输入关键字时，load 完成后自动再触发一次搜索，
        // 否则结果会停留在“搜索中...”或空态，造成“搜不到”的体感。
        const q = (this.input && this.input.value ? this.input.value : '').trim();
        if (q) {
          this.search(q);
        }
      }
    }

    buildFromDom() {
      document.querySelectorAll('.post-item, .archive-item').forEach(item => {
        const link = item.querySelector('a[href]');
        const title = item.querySelector('.post-title, a')?.textContent?.trim() || '';
        const excerpt = item.querySelector('.post-excerpt')?.textContent?.trim() || '';

        if (link && title) {
          const href = link.getAttribute('href') || link.href || '';
          const normalized = this.normalizeItem({
            title,
            excerpt,
            url: href
          });
          if (normalized) {
            this.posts.push(normalized);
          }
        }
      });
    }

    normalizeItem(item = {}) {
      const title = (item.title || '').toString().trim();
      if (!title) return null;
      const rawExcerpt = (item.excerpt || item.text || item.content || '').toString().replace(/\s+/g, ' ').trim();
      const url = (item.url || item.permalink || item.path || item.href || '').toString();
      if (!url) return null;
      const href = url.startsWith('http') ? url : this.root + url.replace(/^\//, '');

      // ✨ PC优化1: 提取标签和分类用于搜索
      const tags = Array.isArray(item.tags)
        ? item.tags.map(t => typeof t === 'string' ? t : (t.name || '')).join(' ')
        : (item.tags || '').toString();
      const categories = Array.isArray(item.categories)
        ? item.categories.map(c => typeof c === 'string' ? c : (c.name || '')).join(' ')
        : (item.categories || '').toString();

      const searchText = `${title} ${rawExcerpt} ${tags} ${categories}`.toLowerCase();

      return {
        href,
        title,
        excerpt: rawExcerpt,
        tags,
        categories,
        searchText,
        titleLower: title.toLowerCase(),
        excerptLower: rawExcerpt.toLowerCase()
      };
    }

    bindEvents() {
      // 输入搜索 - ✨ 增加防抖时间，减少搜索频率
      this.input.addEventListener('input', Utils.debounce(() => {
        this.search(this.input.value.trim());
      }, 200));

      // 键盘快捷键（仅PC端）
      if (!Utils.isMobile()) {
        document.addEventListener('keydown', (e) => {
          // / 聚焦搜索
          if (e.key === '/' && document.activeElement !== this.input) {
            e.preventDefault();
            this.input.focus();
          }

          // ESC 取消搜索
          if (e.key === 'Escape' && document.activeElement === this.input) {
            this.input.blur();
            this.input.value = '';
            this.results.innerHTML = '';
            this.currentIndex = -1;
          }

          // 键盘导航搜索结果
          if (document.activeElement === this.input && this.results.children.length) {
            this.handleKeyboardNav(e);
          }
        });
      }

      // 处理虚拟键盘遮挡（移动端）
      if (Utils.isMobile() && 'visualViewport' in window) {
        this.handleVirtualKeyboard();
      }
    }

    handleKeyboardNav(e) {
      const items = Array.from(this.results.querySelectorAll('.search-result'));
      if (!items.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.currentIndex = Math.min(this.currentIndex + 1, items.length - 1);
        this.highlightResult(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.currentIndex = Math.max(this.currentIndex - 1, -1);
        this.highlightResult(items);
      } else if (e.key === 'Enter' && this.currentIndex >= 0) {
        e.preventDefault();
        items[this.currentIndex].click();
      }
    }

    highlightResult(items) {
      items.forEach((item, index) => {
        if (index === this.currentIndex) {
          item.classList.add('is-active');
          item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
          item.classList.remove('is-active');
        }
      });
    }

    handleVirtualKeyboard() {
      const viewport = window.visualViewport;

      const handleResize = () => {
        if (document.activeElement === this.input) {
          // 虚拟键盘弹出时，调整搜索结果位置
          const keyboardHeight = window.innerHeight - viewport.height;
          if (keyboardHeight > 100) {
            this.results.style.maxHeight = `${viewport.height - this.input.getBoundingClientRect().bottom - 20}px`;
            this.results.style.overflowY = 'auto';

            // 滚动到输入框
            setTimeout(() => {
              this.input.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
          } else {
            this.results.style.maxHeight = '';
            this.results.style.overflowY = '';
          }
        }
      };

      viewport.addEventListener('resize', Utils.debounce(handleResize, 100));

      this.input.addEventListener('focus', handleResize);
      this.input.addEventListener('blur', () => {
        setTimeout(() => {
          this.results.style.maxHeight = '';
          this.results.style.overflowY = '';
        }, 300);
      });
    }

    search(query) {
      if (!query) {
        this.results.innerHTML = '';
        this.currentIndex = -1;
        this.setResultsWrapOpen(false);
        return;
      }

      if (this.isLoading) {
        this.results.innerHTML = '<div class="search-empty">搜索中...</div>';
        this.setResultsWrapOpen(true);
        return;
      }

      const lower = query.toLowerCase();

      // ✨ 检查缓存
      if (this.cache.has(lower)) {
        this.renderResults(this.cache.get(lower), query);
        return;
      }

      // ✨ PC优化5: 添加相关性评分和智能排序
      const matches = this.posts.map(p => {
        let score = 0;

        // 使用统一搜索字段（包含标题、内容、标签、分类）
        if (!p.searchText.includes(lower)) return null;

        // 标题完全匹配：最高分
        if (p.titleLower === lower) score += 100;
        // 标题开头匹配：高分
        else if (p.titleLower.startsWith(lower)) score += 80;
        // 标题包含：中高分
        else if (p.titleLower.includes(lower)) score += 50;
        // 标题单词匹配
        else if (p.titleLower.split(/\s+/).some(word => word.includes(lower))) score += 30;

        // 内容匹配：中等分
        if (p.excerptLower.includes(lower)) score += 20;

        // 标签/分类匹配：加分
        if (p.tags && p.tags.toLowerCase().includes(lower)) score += 15;
        if (p.categories && p.categories.toLowerCase().includes(lower)) score += 15;

        return { ...p, score };
      })
        .filter(p => p && p.score > 0)
        .sort((a, b) => b.score - a.score) // 按相关性排序
        .slice(0, 8); // 只取前8个结果

      // ✨ 缓存结果
      this.cache.set(lower, matches);

      // 限制缓存大小
      if (this.cache.size > 50) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      this.renderResults(matches, query);
    }

    renderResults(matches, query) {
      if (!matches.length) {
        this.results.innerHTML = '<div class="search-empty">未找到相关文章</div>';
        this.setResultsWrapOpen(true);
        return;
      }

      const lower = query.toLowerCase();  // 从 query 计算 lower

      this.results.innerHTML = matches.map(p => {
        // 简化搜索结果：只显示标题和匹配的关键词片段
        let matchExcerpt = '';
        if (p.excerpt) {
          const lowerExcerpt = p.excerpt.toLowerCase();
          const index = lowerExcerpt.indexOf(lower);
          if (index !== -1) {
            // 找到关键词，提取前后30个字符
            const start = Math.max(0, index - 30);
            const end = Math.min(p.excerpt.length, index + lower.length + 30);
            matchExcerpt = (start > 0 ? '...' : '') +
              p.excerpt.slice(start, end) +
              (end < p.excerpt.length ? '...' : '');
          }
        }

        return `
          <a href="${p.href}" class="search-result">
            <div class="search-result-title">${this.hl(p.title, query)}</div>
            ${matchExcerpt ? `<div class="search-result-excerpt">${this.hl(matchExcerpt, query)}</div>` : ''}
          </a>
        `;
      }).join('');

      this.currentIndex = -1;
      this.setResultsWrapOpen(true);
    }

    hl(text, query) {
      const safe = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return safe.replace(regex, '<span class="search-highlight">$1</span>');
    }
  }

  // ============================================
  // 代码块增强 - 简化版
  // ============================================
  class CodeEnhancer {
    constructor() {
      this.init();
    }

    init() {
      document.querySelectorAll('.prose pre').forEach(pre => {
        pre.style.position = 'relative';

        // ✨ 移动端简化：只保留滚动指示器
        if (Utils.isMobile()) {
          const updateScrollIndicator = () => {
            const isScrolledToEnd = pre.scrollLeft + pre.clientWidth >= pre.scrollWidth - 5;
            pre.classList.toggle('scrolled-to-end', isScrolledToEnd);
          };

          pre.addEventListener('scroll', updateScrollIndicator, { passive: true });
          setTimeout(updateScrollIndicator, 100);

          // ✨ 移除换行按钮功能
        }
      });
    }
  }

  // ============================================
  // 图片懒加载（H5优化3）
  // ============================================
  class LazyLoader {
    constructor() {
      this.images = document.querySelectorAll('.prose img:not([loading])');
      this.init();
    }

    init() {
      if ('loading' in HTMLImageElement.prototype) {
        // 浏览器原生支持
        this.images.forEach(img => {
          img.loading = 'lazy';
        });
      } else if ('IntersectionObserver' in window) {
        // 使用 IntersectionObserver
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.classList.add('loading');

              const src = img.dataset.src || img.src;
              if (src && !img.complete) {
                img.src = src;
              }

              img.onload = () => {
                img.classList.remove('loading');
                img.classList.add('loaded');
                observer.unobserve(img);
              };

              img.onerror = () => {
                img.classList.add('error');
                observer.unobserve(img);
              };

              // 如果已经加载完成
              if (img.complete) {
                img.classList.add('loaded');
                observer.unobserve(img);
              }
            }
          });
        }, {
          rootMargin: '50px' // 提前50px开始加载
        });

        this.images.forEach(img => {
          if (!img.complete) {
            observer.observe(img);
          }
        });
      }
    }
  }

  // ============================================
  // Service Worker（通用优化1）
  // ============================================
  class ServiceWorkerManager {
    constructor() {
      this.init();
    }

    init() {
      if ('serviceWorker' in navigator && location.protocol === 'https:') {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('✓ Service Worker 已注册'))
            .catch(err => console.warn('Service Worker 注册失败:', err));
        });
      }
    }
  }

  // ============================================
  // 滚动性能优化（H5优化6）
  // ============================================
  class ScrollOptimizer {
    constructor() {
      if (!Utils.isMobile()) return;

      this.scrollTimeout = null;
      this.init();
    }

    init() {
      // 滚动时禁用动画，提升性能
      window.addEventListener('scroll', () => {
        document.body.classList.add('is-scrolling');

        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
          document.body.classList.remove('is-scrolling');
        }, 150);
      }, { passive: true });
    }
  }

  // 列表项滑动操作已移除

  // ============================================
  // 初始化
  // ============================================
  document.addEventListener('DOMContentLoaded', () => {
    try {
      // 打字机
      const tagline = document.getElementById('tagline');
      if (tagline) {
        const configTexts = Array.isArray(THEME_CONFIG.typewriterTexts) ? THEME_CONFIG.typewriterTexts : [];
        const texts = configTexts.length ? configTexts : [
          '能',
          'Keep hacking, keep learning',
          'Less is more',
          '代码即诗'
        ];
        new Typewriter(tagline, texts);
      }

      // 主题
      new ThemeToggle();
      // 移动端菜单已移除

      // 搜索索引 - 只加载索引,不绑定UI(PC端使用弹窗,H5使用tabbar)
      window.__mainSearch__ = new Search({
        inputId: '__dummy__', // 不存在的ID,只用于加载索引
        resultsId: '__dummy__'
      });

      // PC端全屏搜索弹窗
      (function initPCSearchModal() {
        const modal = document.getElementById('pcSearchModal');
        const searchBtn = document.getElementById('pcFloatSearchBtn');
        const closeBtn = document.getElementById('pcSearchCloseBtn');
        const backdrop = document.getElementById('pcSearchBackdrop');
        const input = document.getElementById('pcSearchInput');
        const results = document.getElementById('pcSearchResults');

        if (!modal || !searchBtn || !input || !results) return;

        // 仅PC端启用
        if (Utils.isMobile()) {
          modal.style.display = 'none';
          return;
        }

        let pcSearch = null;
        let isClosing = false;

        const open = () => {
          // 防重复触发：避免多次点击/重复事件导致“开两次”的不协调动画
          if (modal.getAttribute('aria-hidden') === 'false' || isClosing) return;

          // 计算滚动条宽度
          const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

          // 先锁定滚动/补偿宽度，下一帧再打开弹窗，避免“遮罩出现后页面再位移”的二段抖动
          document.documentElement.style.setProperty('--pc-scrollbar-width', `${Math.max(0, scrollbarWidth)}px`);
          document.body.classList.add('pc-search-open');
          requestAnimationFrame(() => {
            modal.setAttribute('aria-hidden', 'false');
          });

          // 初始化搜索实例
          if (!pcSearch) {
            pcSearch = new Search({
              inputId: 'pcSearchInput',
              resultsId: 'pcSearchResults'
            });

            // 共享主搜索的索引
            const main = window.__mainSearch__;
            if (main && main.posts && main.posts.length) {
              pcSearch.posts = main.posts;
              pcSearch.cache = main.cache || new Map();
              pcSearch.isLoading = false;
            }
          }

          // 聚焦输入框
          setTimeout(() => {
            try {
              input.focus({ preventScroll: true });
            } catch (e) {
              input.focus();
            }
          }, 100);
        };

        const close = () => {
          // 防重复触发：避免重复 close 导致样式抖动
          if (modal.getAttribute('aria-hidden') === 'true' || isClosing) return;
          isClosing = true;

          modal.setAttribute('aria-hidden', 'true');
          input.value = '';
          results.innerHTML = '';

          // 等弹窗淡出动画结束后再恢复滚动/补偿，避免背景内容在淡出过程中位移
          const cleanup = () => {
            document.body.classList.remove('pc-search-open');
            document.documentElement.style.removeProperty('--pc-scrollbar-width');
            isClosing = false;
          };

          // 监听 opacity 的 transitionend；同时做一个兜底定时器（防止某些情况下不触发）
          let done = false;
          const onEnd = (e) => {
            if (done) return;
            if (e && e.propertyName && e.propertyName !== 'opacity') return;
            done = true;
            modal.removeEventListener('transitionend', onEnd);
            cleanup();
          };
          modal.addEventListener('transitionend', onEnd);
          setTimeout(() => {
            if (done) return;
            done = true;
            modal.removeEventListener('transitionend', onEnd);
            cleanup();
          }, 380);
        };

        // 打开弹窗
        if (searchBtn) {
          searchBtn.addEventListener('click', open);
        }

        // 关闭按钮
        if (closeBtn) {
          closeBtn.addEventListener('click', close);
        }

        // 点击遮罩关闭
        if (backdrop) {
          backdrop.addEventListener('click', close);
        }

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
            close();
          }

          // / 键打开搜索(仅当弹窗未打开且焦点不在输入框时)
          if (e.key === '/' && modal.getAttribute('aria-hidden') === 'true' &&
            document.activeElement.tagName !== 'INPUT' &&
            document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            open();
          }
        });

        // 标签点击：填入搜索框并触发搜索
        const tagsContainer = document.getElementById('pcSearchTags');
        if (tagsContainer) {
          tagsContainer.addEventListener('click', (e) => {
            const tagBtn = e.target.closest('.pc-search-tag');
            if (!tagBtn) return;

            const tagName = tagBtn.getAttribute('data-tag');
            if (!tagName) return;

            // 填入搜索框
            input.value = tagName;

            // 触发搜索（等待搜索实例初始化）
            if (pcSearch && !pcSearch.isLoading) {
              pcSearch.search(tagName);
            } else {
              // 如果搜索实例还未初始化，触发 input 事件让其自动搜索
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // 聚焦输入框，方便继续修改关键词
            input.focus({ preventScroll: true });
          });
        }
      })();

      // 低栏 TabBar：默认隐藏；滚动下滑出现，上滑隐藏（仅存在于首页/归档/关于）
      (function initMobileTabbar() {
        const tabbar = document.getElementById('mobileTabbar');
        const floats = document.getElementById('mobileFloatActions');
        if (!tabbar) return;

        let lastY = Math.max(0, window.pageYOffset || 0);
        let ticking = false;
        let scrollAccumulator = 0; // 累积滚动距离，让触发更平滑
        let isInitialized = false; // 标记是否已完成初始化
        let currentlyVisible = false; // 跟踪当前显示状态，避免重复触发

        const show = () => {
          if (currentlyVisible) return; // 已经显示，无需重复操作
          currentlyVisible = true;

          // 使用 requestAnimationFrame 确保 DOM 状态稳定后再添加 class
          // 这确保 CSS transition 能正确触发
          requestAnimationFrame(() => {
            tabbar.classList.add('is-visible');
            tabbar.setAttribute('aria-hidden', 'false');
            if (floats) {
              floats.classList.add('is-visible');
              floats.setAttribute('aria-hidden', 'false');
            }
          });
        };

        const hide = () => {
          if (!currentlyVisible) return; // 已经隐藏，无需重复操作
          currentlyVisible = false;

          requestAnimationFrame(() => {
            tabbar.classList.remove('is-visible');
            tabbar.setAttribute('aria-hidden', 'true');
            if (floats) {
              floats.classList.remove('is-visible');
              floats.setAttribute('aria-hidden', 'true');
            }
          });
        };

        // 初始隐藏（不通过 hide() 函数，避免设置 currentlyVisible）
        tabbar.classList.remove('is-visible');
        tabbar.setAttribute('aria-hidden', 'true');
        if (floats) {
          floats.classList.remove('is-visible');
          floats.setAttribute('aria-hidden', 'true');
        }

        const onScroll = () => {
          // 搜索形变中保持显示，避免交互被滚动打断
          if (tabbar.classList.contains('is-searching')) {
            show();
            lastY = Math.max(0, window.pageYOffset || 0);
            scrollAccumulator = 0;
            return;
          }

          const y = Math.max(0, window.pageYOffset || 0);
          const dy = y - lastY;

          // 顶部区域保持隐藏
          if (y < 30) {
            hide();
            lastY = y;
            scrollAccumulator = 0;
            return;
          }

          // 累积滚动距离，方向改变时重置
          if ((scrollAccumulator > 0 && dy < 0) || (scrollAccumulator < 0 && dy > 0)) {
            scrollAccumulator = 0; // 方向改变，重置累积值
          }
          scrollAccumulator += dy;

          // 增大阈值，让触发更平滑
          // 下滑（内容向上）-> 显示（阈值较小，快速响应）
          // 上滑（内容向下）-> 隐藏（阈值较大，不那么灵敏）
          if (scrollAccumulator > 20) {
            show();
            scrollAccumulator = 0;
          } else if (scrollAccumulator < -40) {
            hide();
            scrollAccumulator = 0;
          }

          lastY = y;
        };

        // 延迟初始化滚动监听，确保页面渲染完成后 CSS 过渡能正常工作
        setTimeout(() => {
          isInitialized = true;
          lastY = Math.max(0, window.pageYOffset || 0);

          window.addEventListener('scroll', () => {
            if (!ticking) {
              ticking = true;
              requestAnimationFrame(() => {
                onScroll();
                ticking = false;
              });
            }
          }, { passive: true });
        }, 100); // 100ms 延迟，确保初始渲染完成
      })();

      // TabBar Search：按钮形变为输入框 + 结果面板（更接近系统交互）
      (function initTabbarSearchMorph() {
        const tabbar = document.getElementById('mobileTabbar');
        const group = document.getElementById('mobileTabbarGroup');
        const pill = document.getElementById('mobileTabbarSearchPill');
        const btn = document.getElementById('mobileTabSearchBtn');
        const closeBtn = document.getElementById('tabbarSearchCloseBtn');
        const input = document.getElementById('tabbarSearchInput');
        const resultsWrap = document.getElementById('tabbarSearchResultsWrap');
        const results = document.getElementById('tabbarSearchResults');
        if (!tabbar || !pill || !btn || !input || !resultsWrap || !results) return;

        let tabSearch = null;

        const open = () => {
          // 确保可见
          tabbar.classList.add('is-visible');
          tabbar.setAttribute('aria-hidden', 'false');

          tabbar.classList.add('is-searching');
          btn.setAttribute('aria-expanded', 'true');
          pill.querySelector('.mobile-tabbar-searchInput')?.setAttribute('aria-hidden', 'false');

          if (!tabSearch) {
            // ✨ 新思路：tabbar 搜索不自己拉索引，直接 await 主搜索 ready 后共享
            // 彻底避免“setTimeout 等不准 -> 永远空数据/加载中”的竞态
            tabSearch = new Search({
              inputId: 'tabbarSearchInput',
              resultsId: 'tabbarSearchResults',
              resultsWrapId: 'tabbarSearchResultsWrap',
              deferLoad: true
            });

            const main = window.__mainSearch__;

            const attachOrFallback = async () => {
              try {
                if (main && main.ready && typeof main.ready.then === 'function') {
                  await main.ready;
                }

                if (main && main.posts && main.posts.length) {
                  tabSearch.posts = main.posts;
                  tabSearch.cache = main.cache || new Map();
                  tabSearch.isLoading = false;
                } else {
                  // 主搜索不可用/索引为空：tabbar 自己拉一次兜底
                  tabSearch.ready = tabSearch.loadPosts();
                  await tabSearch.ready;
                }
              } catch (e) {
                // 最终兜底：尝试自己拉一次
                try {
                  tabSearch.ready = tabSearch.loadPosts();
                  await tabSearch.ready;
                } catch (_) { }
              } finally {
                // 如果用户已输入关键字，确保立刻出结果（并打开面板）
                const q = (input.value || '').trim();
                if (q) {
                  tabSearch.search(q);
                  syncResultsVisibility();
                }
              }
            };

            // 不阻塞打开动画：异步挂载数据
            attachOrFallback();
          }

          resultsWrap.classList.remove('is-open');
          resultsWrap.setAttribute('aria-hidden', 'true');

          setTimeout(() => {
            try {
              input.focus({ preventScroll: true });
            } catch (e) {
              input.focus();
            }
          }, 50);
        };

        const close = () => {
          tabbar.classList.remove('is-searching');
          btn.setAttribute('aria-expanded', 'false');
          pill.querySelector('.mobile-tabbar-searchInput')?.setAttribute('aria-hidden', 'true');

          input.value = '';
          results.innerHTML = '';
          resultsWrap.classList.remove('is-open');
          resultsWrap.setAttribute('aria-hidden', 'true');
        };

        const syncResultsVisibility = () => {
          const hasQuery = (input.value || '').trim().length > 0;
          if (hasQuery && tabbar.classList.contains('is-searching')) {
            resultsWrap.classList.add('is-open');
            resultsWrap.setAttribute('aria-hidden', 'false');
          } else {
            resultsWrap.classList.remove('is-open');
            resultsWrap.setAttribute('aria-hidden', 'true');
          }
        };

        btn.addEventListener('click', () => {
          if (tabbar.classList.contains('is-searching')) {
            close();
          } else {
            open();
          }
        });

        if (closeBtn) {
          closeBtn.addEventListener('click', close);
        }

        input.addEventListener('input', syncResultsVisibility);

        // 点击结果链接后自动收起（导航交给链接本身）
        resultsWrap.addEventListener('click', (e) => {
          const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
          if (a) {
            close();
          }
        });

        // 点击外部收起
        document.addEventListener('pointerdown', (e) => {
          if (!tabbar.classList.contains('is-searching')) return;
          const t = e.target;
          const inPill = pill.contains(t);
          const inResults = resultsWrap.contains(t);
          if (!inPill && !inResults) {
            close();
          }
        });

        // 键盘 ESC 收起
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && tabbar.classList.contains('is-searching')) {
            close();
          }
        });

        // 失焦收起（给点击结果一点时间）
        input.addEventListener('blur', () => {
          setTimeout(() => {
            if (!tabbar.classList.contains('is-searching')) return;
            const active = document.activeElement;
            if (pill.contains(active) || resultsWrap.contains(active)) return;
            close();
          }, 120);
        });

        // 导航点击更丝滑：淡出再跳转（仅底栏三项）
        if (group) {
          group.addEventListener('click', (e) => {
            const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
            if (!a) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const href = a.getAttribute('href') || '';
            if (!href || href.startsWith('#')) return;
            // 同页不处理
            const targetUrl = a.href;
            const currentUrl = location.href.split('#')[0];
            if (targetUrl.split('#')[0] === currentUrl) return;

            e.preventDefault();
            document.documentElement.classList.add('is-page-leaving');
            setTimeout(() => {
              location.href = targetUrl;
            }, 150);
          });
        }

        window.addEventListener('pageshow', () => {
          document.documentElement.classList.remove('is-page-leaving');
        });
      })();

      // 右侧悬浮按钮：主题切换/回到顶部
      (function initMobileFloatActions() {
        const floats = document.getElementById('mobileFloatActions');
        if (!floats) return;
        const themeBtn = document.getElementById('mobileFloatThemeBtn');
        const topBtn = document.getElementById('mobileFloatTopBtn');

        if (themeBtn) {
          themeBtn.addEventListener('click', () => {
            // 统一逻辑：切换 + 持久化（跨页面继承）+ 更新 theme-color
            const current = document.documentElement.dataset.theme || 'light';
            const next = current === 'light' ? 'dark' : 'light';

            document.documentElement.classList.add('theme-transitioning');
            document.documentElement.dataset.theme = next;
            try {
              localStorage.setItem('theme', next);
            } catch (e) { /* ignore */ }

            const meta = document.querySelector('meta[name="theme-color"]');
            const palette = THEME_CONFIG.themeColor || { light: '#faf9f7', dark: '#111110' };
            if (meta) {
              meta.setAttribute('content', next === 'dark' ? palette.dark : palette.light);
            }

            setTimeout(() => {
              document.documentElement.classList.remove('theme-transitioning');
            }, 300);

            Utils.showToast(`已切换到${next === 'dark' ? '深色' : '浅色'}模式`);
          });
        }

        if (topBtn) {
          topBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        }
      })();

      // PC端浮动按钮：下滑触发显示（深色模式切换 + 返回顶部）
      (function initPCFloatActions() {
        const floats = document.getElementById('pcFloatActions');
        if (!floats) return;

        // 仅PC端启用
        if (Utils.isMobile()) {
          floats.style.display = 'none';
          return;
        }

        const themeBtn = document.getElementById('pcFloatThemeBtn');
        const topBtn = document.getElementById('pcFloatTopBtn');

        let lastY = Math.max(0, window.pageYOffset || 0);
        let ticking = false;
        let scrollAccumulator = 0;
        let currentlyVisible = false;

        const show = () => {
          if (currentlyVisible) return;
          currentlyVisible = true;
          requestAnimationFrame(() => {
            floats.classList.add('is-visible');
            floats.setAttribute('aria-hidden', 'false');
          });
        };

        const hide = () => {
          if (!currentlyVisible) return;
          currentlyVisible = false;
          requestAnimationFrame(() => {
            floats.classList.remove('is-visible');
            floats.setAttribute('aria-hidden', 'true');
          });
        };

        // 初始隐藏
        floats.classList.remove('is-visible');
        floats.setAttribute('aria-hidden', 'true');

        const onScroll = () => {
          const y = Math.max(0, window.pageYOffset || 0);
          const dy = y - lastY;

          // 顶部区域保持隐藏
          if (y < 100) {
            hide();
            lastY = y;
            scrollAccumulator = 0;
            return;
          }

          // 累积滚动距离,方向改变时重置
          if ((scrollAccumulator > 0 && dy < 0) || (scrollAccumulator < 0 && dy > 0)) {
            scrollAccumulator = 0;
          }
          scrollAccumulator += dy;

          // 下滑显示,上滑隐藏
          if (scrollAccumulator > 30) {
            show();
            scrollAccumulator = 0;
          } else if (scrollAccumulator < -50) {
            hide();
            scrollAccumulator = 0;
          }

          lastY = y;
        };

        // 延迟初始化,确保页面渲染完成
        setTimeout(() => {
          lastY = Math.max(0, window.pageYOffset || 0);
          window.addEventListener('scroll', () => {
            if (!ticking) {
              ticking = true;
              requestAnimationFrame(() => {
                onScroll();
                ticking = false;
              });
            }
          }, { passive: true });
        }, 100);

        // 深色模式切换
        if (themeBtn) {
          themeBtn.addEventListener('click', () => {
            const current = document.documentElement.dataset.theme || 'light';
            const next = current === 'light' ? 'dark' : 'light';

            // 添加过渡动画
            document.documentElement.classList.add('theme-transitioning');
            document.documentElement.dataset.theme = next;
            localStorage.setItem('theme', next);

            // 更新meta标签
            const meta = document.querySelector('meta[name="theme-color"]');
            const palette = THEME_CONFIG.themeColor || { light: '#faf9f7', dark: '#111110' };
            if (meta) {
              meta.setAttribute('content', next === 'dark' ? palette.dark : palette.light);
            }

            // 移除过渡类
            setTimeout(() => {
              document.documentElement.classList.remove('theme-transitioning');
            }, 300);

            Utils.showToast(`已切换到${next === 'dark' ? '深色' : '浅色'}模式`);
          });
        }

        // 返回顶部
        if (topBtn) {
          topBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        }
      })();

      // 代码块增强
      new CodeEnhancer();

      // ✨ 移动端表格优化
      if (Utils.isMobile()) {
        document.querySelectorAll('.prose table').forEach(table => {
          // 检查表格是否需要滚动
          const wrapper = table.parentElement;
          const needsScroll = table.scrollWidth > table.clientWidth;

          if (!needsScroll && table.querySelector('::after')) {
            // 不需要滚动时隐藏提示
            table.style.setProperty('--show-scroll-hint', 'none');
          }

          // 添加滚动指示器
          let isScrolling = false;
          table.addEventListener('scroll', () => {
            if (!isScrolling) {
              isScrolling = true;
              table.classList.add('is-scrolling');

              setTimeout(() => {
                isScrolling = false;
                table.classList.remove('is-scrolling');
              }, 150);
            }
          }, { passive: true });
        });
      }

      // ✨ 新增功能初始化
      new LazyLoader();        // 图片懒加载
      new ScrollOptimizer();   // 滚动性能优化
      new ServiceWorkerManager(); // Service Worker

      // ✨ 新功能: 首页分类筛选
      const categoryBtns = document.querySelectorAll('.category-filter-btn');
      if (categoryBtns.length) {
        // 检查是否在首页
        const isHomePage = document.body.classList.contains('is-home');

        // 页面加载时检查URL参数，自动应用分类筛选
        const urlParams = new URLSearchParams(window.location.search);
        const categoryFromUrl = urlParams.get('category');

        const applyFilter = (category) => {
          // 更新按钮状态
          categoryBtns.forEach(b => {
            if (b.dataset.category === category) {
              b.classList.add('active');
            } else {
              b.classList.remove('active');
            }
          });

          // 筛选文章
          const posts = document.querySelectorAll('.post-item');
          posts.forEach(post => {
            if (category === 'all' || post.dataset.category === category) {
              post.classList.remove('filtered-out');
              post.style.display = '';
            } else {
              post.classList.add('filtered-out');
            }
          });

          // 重新应用动画延迟
          const visiblePosts = document.querySelectorAll('.post-item:not(.filtered-out)');
          visiblePosts.forEach((post, index) => {
            post.style.setProperty('--delay', `${index * 0.05}s`);
          });
        };

        // 如果URL有分类参数且在首页，自动应用筛选
        if (isHomePage && categoryFromUrl) {
          applyFilter(categoryFromUrl);
        }

        categoryBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            const category = btn.dataset.category;

            if (isHomePage) {
              // 在首页：直接筛选
              applyFilter(category);
            } else {
              // 不在首页：跳转到首页并带上分类参数
              const root = (THEME_CONFIG.search?.root || '/').trim();
              const homeUrl = root.endsWith('/') ? root : `${root}/`;
              window.location.href = `${homeUrl}?category=${encodeURIComponent(category)}`;
            }
          });
        });
      }

      // 外部链接
      document.querySelectorAll('a[href^="http"]').forEach(a => {
        if (!a.href.includes(location.hostname)) {
          a.target = '_blank';
          a.rel = 'noopener';
        }
      });

      // 页面加载完成提示
      if (performance.navigation.type === 1) {
        // 刷新后不显示
      } else {
        console.log('%cGeek Minimal v2 已加载', 'color: #a78bfa; font-size: 14px; font-weight: bold;');
      }
    } catch (error) {
      console.error('主题初始化失败:', error);
      Utils.showToast('主题加载出现问题，部分功能可能无法使用', 'error', 5000);
    }
  });
})();
