// 手机外壳通用系统
// 提供可复用的手机外观组件，支持主题颜色自定义和响应式缩放

(function (window) {
  'use strict';

  const PhoneShell = {
    // 当前主题
    currentTheme: 'classic',

    // 调试模式
    debugMode: false,

    // 时间更新相关
    timeUpdateInterval: null,
    timeInitialTimeout: null,

    // 可用主题列表
    themes: {
      classic: {
        name: '经典白色',
        class: 'phone-theme-classic',
        description: '简洁的白色主题，适合日常使用',
      },
      dark: {
        name: '深色主题',
        class: 'phone-theme-dark',
        description: '护眼的深色主题，适合夜间使用',
      },
      pink: {
        name: '粉色主题',
        class: 'phone-theme-pink',
        description: '温馨的粉色主题，充满活力',
      },
      blue: {
        name: '蓝色主题',
        class: 'phone-theme-blue',
        description: '清新的蓝色主题，专业感十足',
      },
      green: {
        name: '绿色主题',
        class: 'phone-theme-green',
        description: '自然的绿色主题，清新舒适',
      },
    },

    // 初始化手机外壳系统
    init: function () {
      console.log('🏗️ 初始化手机外壳系统...');

      // 加载保存的主题
      this.loadSavedTheme();

      // 初始化响应式缩放
      this.initResponsiveScaling();

      console.log('✅ 手机外壳系统初始化完成');
    },

    // 创建手机外壳HTML结构
    createShellHTML: function (contentHTML = '', shellId = 'phone_shell') {
      return `
        <div id="${shellId}" class="phone-shell ${this.themes[this.currentTheme].class}">
          <div class="phone-shell-screen">
            <!-- 动态岛 -->
            <div class="phone-shell-dynamic-island"></div>
            
            <!-- 状态栏 -->
            <div class="phone-shell-status-bar">
              <div class="phone-shell-status-time" id="${shellId}_status_time">9:41</div>
              <div class="phone-shell-status-icons">
                <span class="phone-shell-signal-icon"></span>
                <span class="phone-shell-battery-icon"></span>
              </div>
            </div>
            
            <!-- 应用内容区域 -->
            <div class="phone-shell-content">
              ${contentHTML}
            </div>
          </div>
        </div>
      `;
    },

    // 显示手机外壳
    show: function (shellId = 'phone_shell') {
      const $shell = $(`#${shellId}`);
      if ($shell.length === 0) {
        console.error(`❌ 手机外壳元素 #${shellId} 不存在`);
        return false;
      }

      $shell.addClass('show').show();
      this.updateTime(shellId);
      this.updateResponsiveScale(shellId);

      console.log(`📱 手机外壳 #${shellId} 已显示`);
      return true;
    },

    // 隐藏手机外壳
    hide: function (shellId = 'phone_shell') {
      const $shell = $(`#${shellId}`);
      if ($shell.length === 0) {
        console.error(`❌ 手机外壳元素 #${shellId} 不存在`);
        return false;
      }

      $shell.removeClass('show');
      console.log(`📱 手机外壳 #${shellId} 已隐藏`);
      return true;
    },

    // 切换主题
    setTheme: function (themeName, shellId = 'phone_shell') {
      if (!this.themes[themeName]) {
        console.error(`❌ 主题 "${themeName}" 不存在`);
        return false;
      }

      const $shell = $(`#${shellId}`);
      if ($shell.length === 0) {
        console.error(`❌ 手机外壳元素 #${shellId} 不存在`);
        return false;
      }

      // 移除旧主题类
      Object.values(this.themes).forEach(theme => {
        $shell.removeClass(theme.class);
      });

      // 添加新主题类
      $shell.addClass(this.themes[themeName].class);
      this.currentTheme = themeName;

      // 保存主题设置
      this.saveTheme();

      console.log(`🎨 手机外壳主题已切换为: ${this.themes[themeName].name}`);
      return true;
    },

    // 获取当前主题
    getCurrentTheme: function () {
      return {
        name: this.currentTheme,
        ...this.themes[this.currentTheme],
      };
    },

    // 获取所有可用主题
    getAllThemes: function () {
      return this.themes;
    },

    // 更新时间显示 - 与现有时间显示代码保持一致
    updateTime: function (shellId = 'phone_shell') {
      const now = new Date();

      // 格式化时间为 HH:MM 格式（与phone-interface.js保持一致）
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      // 更新状态栏时间显示
      $(`#${shellId}_status_time`).text(timeString);

      // 如果存在调试模式，输出时间更新信息
      if (this.debugMode) {
        console.log(`⏰ 时间更新 (${shellId}): ${timeString}`);
      }
    },

    // 开始时间更新循环 - 优化的时间同步机制
    startTimeUpdate: function (shellId = 'phone_shell') {
      // 清除可能存在的旧定时器
      if (this.timeUpdateInterval) {
        clearInterval(this.timeUpdateInterval);
      }
      if (this.timeInitialTimeout) {
        clearTimeout(this.timeInitialTimeout);
      }

      // 立即更新一次时间
      this.updateTime(shellId);

      // 计算到下一分钟的毫秒数，实现精确的时间同步
      const now = new Date();
      const delay = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());

      // 先设置一个定时器，在下一个整分钟时触发
      this.timeInitialTimeout = setTimeout(() => {
        // 更新时间
        this.updateTime(shellId);

        // 然后设置每分钟更新一次的定时器
        this.timeUpdateInterval = setInterval(() => {
          this.updateTime(shellId);
        }, 60000);
      }, delay);

      console.log(`⏰ 时间更新已启动 (${shellId}), ${delay}ms后同步到整分钟`);
    },

    // 停止时间更新
    stopTimeUpdate: function () {
      if (this.timeUpdateInterval) {
        clearInterval(this.timeUpdateInterval);
        this.timeUpdateInterval = null;
      }
      if (this.timeInitialTimeout) {
        clearTimeout(this.timeInitialTimeout);
        this.timeInitialTimeout = null;
      }
      console.log('⏰ 时间更新已停止');
    },

    // 初始化响应式缩放
    initResponsiveScaling: function () {
      console.log('🔧 初始化响应式缩放系统...');

      // 监听窗口大小变化
      $(window).on('resize.phoneShell', () => {
        this.updateAllShellsScale();
      });

      // 监听设备方向变化
      $(window).on('orientationchange.phoneShell', () => {
        setTimeout(() => {
          this.updateAllShellsScale();
        }, 100);
      });

      console.log('✅ 响应式缩放系统初始化完成');
    },

    // 更新单个外壳的响应式缩放 - 增强版算法
    updateResponsiveScale: function (shellId = 'phone_shell') {
      const $shell = $(`#${shellId}`);
      if ($shell.length === 0) return;

      const windowWidth = $(window).width();
      const windowHeight = $(window).height();

      // 基础手机尺寸（包含边框）
      const baseWidth = 375;
      const baseHeight = 812;
      const baseBorder = 8;
      const totalWidth = baseWidth + baseBorder * 2;
      const totalHeight = baseHeight + baseBorder * 2;

      // 计算可用空间（留出安全边距）
      const safeMargin = 0.9; // 90%的可用空间
      const availableWidth = windowWidth * safeMargin;
      const availableHeight = windowHeight * safeMargin;

      // 计算基于宽度和高度的缩放比例
      const scaleByWidth = availableWidth / totalWidth;
      const scaleByHeight = availableHeight / totalHeight;

      // 选择较小的缩放比例以确保完全适配
      let scale = Math.min(scaleByWidth, scaleByHeight);

      // 设置缩放范围限制 - 最大100%，最小30%
      scale = Math.max(0.3, Math.min(1.0, scale));

      // 特殊情况处理：极小屏幕
      if (windowWidth <= 320 || windowHeight <= 400) {
        scale = Math.min(scale, 0.5);
      }

      // 横屏模式特殊处理
      if (windowWidth > windowHeight && windowHeight < 500) {
        scale = scale * 0.8;
      }

      // 应用缩放
      $shell.css('--phone-scale', scale);

      // 调试信息
      if (this.debugMode) {
        console.log(
          `📱 响应式缩放更新 (${shellId}): 窗口${windowWidth}x${windowHeight}, 可用${availableWidth.toFixed(
            0,
          )}x${availableHeight.toFixed(0)}, 缩放${scale.toFixed(3)}`,
        );
      }
    },

    // 更新所有外壳的缩放
    updateAllShellsScale: function () {
      $('.phone-shell').each((index, element) => {
        const shellId = $(element).attr('id');
        if (shellId) {
          this.updateResponsiveScale(shellId);
        }
      });
    },

    // 销毁响应式缩放监听器
    destroyResponsiveScaling: function () {
      $(window).off('resize.phoneShell orientationchange.phoneShell');
      console.log('🗑️ 响应式缩放监听器已销毁');
    },

    // 保存主题设置
    saveTheme: function () {
      try {
        localStorage.setItem('phoneShellTheme', this.currentTheme);
        console.log(`💾 主题设置已保存: ${this.currentTheme}`);
      } catch (error) {
        console.warn('⚠️ 无法保存主题设置:', error);
      }
    },

    // 加载保存的主题
    loadSavedTheme: function () {
      try {
        const savedTheme = localStorage.getItem('phoneShellTheme');
        if (savedTheme && this.themes[savedTheme]) {
          this.currentTheme = savedTheme;
          console.log(`📂 已加载保存的主题: ${this.themes[savedTheme].name}`);
        }
      } catch (error) {
        console.warn('⚠️ 无法加载保存的主题设置:', error);
      }
    },

    // 创建主题选择器HTML
    createThemeSelector: function (containerId = 'theme_selector') {
      const themesHTML = Object.entries(this.themes)
        .map(([key, theme]) => {
          const isActive = key === this.currentTheme ? 'active' : '';
          return `
          <div class="theme-option ${isActive}" data-theme="${key}">
            <div class="theme-preview ${theme.class}"></div>
            <div class="theme-info">
              <div class="theme-name">${theme.name}</div>
              <div class="theme-description">${theme.description}</div>
            </div>
          </div>
        `;
        })
        .join('');

      return `
        <div id="${containerId}" class="phone-theme-selector">
          <div class="theme-selector-header">
            <h3>选择手机主题</h3>
            <p>个性化您的手机外观</p>
          </div>
          <div class="theme-options">
            ${themesHTML}
          </div>
        </div>
      `;
    },

    // 绑定主题选择器事件
    bindThemeSelector: function (containerId = 'theme_selector', shellId = 'phone_shell') {
      $(`#${containerId}`).on('click', '.theme-option', e => {
        const themeName = $(e.currentTarget).data('theme');

        // 更新选中状态
        $(`#${containerId} .theme-option`).removeClass('active');
        $(e.currentTarget).addClass('active');

        // 应用主题
        this.setTheme(themeName, shellId);
      });
    },

    // 设置调试模式
    setDebugMode: function (enabled) {
      this.debugMode = enabled;
      console.log(`🔧 调试模式${enabled ? '已启用' : '已禁用'}`);
    },

    // 获取系统状态信息
    getSystemInfo: function () {
      return {
        currentTheme: this.currentTheme,
        debugMode: this.debugMode,
        timeUpdateActive: !!this.timeUpdateInterval,
        availableThemes: Object.keys(this.themes),
        version: '1.0.0',
      };
    },

    // 验证外壳是否正确显示
    validateShell: function (shellId = 'phone_shell') {
      const $shell = $(`#${shellId}`);
      const issues = [];

      if ($shell.length === 0) {
        issues.push('外壳元素不存在');
      } else {
        if (!$shell.hasClass('show')) {
          issues.push('外壳未显示');
        }
        if (!$shell.find('.phone-shell-status-bar').length) {
          issues.push('状态栏缺失');
        }
        if (!$shell.find('.phone-shell-dynamic-island').length) {
          issues.push('动态岛缺失');
        }
      }

      return {
        valid: issues.length === 0,
        issues: issues,
      };
    },

    // 销毁外壳系统
    destroy: function () {
      this.stopTimeUpdate();
      this.destroyResponsiveScaling();
      console.log('🗑️ 手机外壳系统已销毁');
    },
  };

  // 导出到全局
  window.PhoneShell = PhoneShell;
})(window);
