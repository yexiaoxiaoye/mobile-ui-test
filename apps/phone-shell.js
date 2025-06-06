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
                ${this.getStatusIconsSVG()}
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

    // 设置边框颜色（独立控制）
    setBorderColor: function (color, shellId = 'phone_shell') {
      const $shell = $(`#${shellId}`);
      if ($shell.length === 0) {
        console.error(`❌ 手机外壳元素 #${shellId} 不存在`);
        return false;
      }

      $shell.css('--phone-border-color', color);
      console.log(`🎨 边框颜色已设置为: ${color}`);
      return true;
    },

    // 设置图标颜色（独立控制时间和电量信号图标）
    setIconColors: function (timeColor, iconColor, shellId = 'phone_shell') {
      const $shell = $(`#${shellId}`);
      if ($shell.length === 0) {
        console.error(`❌ 手机外壳元素 #${shellId} 不存在`);
        return false;
      }

      if (timeColor) {
        $shell.css('--status-bar-time-color', timeColor);
        console.log(`🕐 时间颜色已设置为: ${timeColor}`);
      }

      if (iconColor) {
        $shell.css('--status-bar-icon-color', iconColor);
        // 根据图标颜色自动计算filter
        const filter = this.calculateIconFilter(iconColor);
        $shell.css('--status-bar-icon-filter', filter);
        console.log(`📱 图标颜色已设置为: ${iconColor}`);
      }

      return true;
    },

    // 计算图标filter（根据颜色自动生成）- 增强版本
    calculateIconFilter: function (color) {
      // 预设颜色的精确映射
      const colorMap = {
        '#000000': 'brightness(0)',
        '#ffffff': 'brightness(0) invert(1)',
        '#831843': 'brightness(0) saturate(100%) invert(8%) sepia(96%) saturate(4456%) hue-rotate(316deg)',
        '#1e40af': 'brightness(0) saturate(100%) invert(25%) sepia(95%) saturate(1749%) hue-rotate(216deg)',
        '#15803d': 'brightness(0) saturate(100%) invert(29%) sepia(96%) saturate(1003%) hue-rotate(88deg)',
        '#dc2626': 'brightness(0) saturate(100%) invert(17%) sepia(95%) saturate(7471%) hue-rotate(356deg)',
        '#7c3aed': 'brightness(0) saturate(100%) invert(25%) sepia(95%) saturate(6500%) hue-rotate(271deg)',
        '#ea580c': 'brightness(0) saturate(100%) invert(45%) sepia(95%) saturate(6500%) hue-rotate(15deg)',
      };

      const lowerColor = color.toLowerCase();

      // 如果有预设映射，直接返回
      if (colorMap[lowerColor]) {
        return colorMap[lowerColor];
      }

      // 动态计算filter - 基于RGB值
      return this.generateDynamicFilter(color);
    },

    // 动态生成CSS filter（基于RGB值）- 修复版本
    generateDynamicFilter: function (color) {
      try {
        // 解析颜色值
        const rgb = this.hexToRgb(color);
        if (!rgb) {
          console.warn('⚠️ 无法解析颜色:', color);
          return 'brightness(0)'; // 默认黑色
        }

        const { r, g, b } = rgb;
        console.log(`🎨 生成动态filter: ${color} -> RGB(${r}, ${g}, ${b})`);

        // 使用更精确的颜色转换算法
        // 参考: https://css-tricks.com/converting-color-spaces-in-javascript/

        // 将RGB转换为0-1范围
        const rNorm = r / 255;
        const gNorm = g / 255;
        const bNorm = b / 255;

        // 计算相对亮度
        const luminance = 0.2126 * rNorm + 0.7152 * gNorm + 0.0722 * bNorm;

        // 计算HSL值
        const max = Math.max(rNorm, gNorm, bNorm);
        const min = Math.min(rNorm, gNorm, bNorm);
        const diff = max - min;

        // 色相计算
        let hue = 0;
        if (diff !== 0) {
          switch (max) {
            case rNorm:
              hue = ((gNorm - bNorm) / diff) % 6;
              break;
            case gNorm:
              hue = (bNorm - rNorm) / diff + 2;
              break;
            case bNorm:
              hue = (rNorm - gNorm) / diff + 4;
              break;
          }
        }
        hue = Math.round(hue * 60);
        if (hue < 0) hue += 360;

        // 饱和度计算
        const lightness = (max + min) / 2;
        const saturation = diff === 0 ? 0 : diff / (1 - Math.abs(2 * lightness - 1));

        // 生成filter
        const satPercent = Math.round(saturation * 100);
        const brightPercent = Math.round(luminance * 100);

        // 根据亮度选择策略
        if (luminance < 0.5) {
          // 深色：使用invert策略
          const filter = `brightness(0) invert(1) hue-rotate(${hue}deg) saturate(${satPercent}%) brightness(${brightPercent}%)`;
          console.log(`🔧 深色filter: ${filter}`);
          return filter;
        } else {
          // 浅色：直接调整
          const filter = `brightness(0) saturate(${satPercent}%) hue-rotate(${hue}deg) brightness(${
            brightPercent + 50
          }%)`;
          console.log(`🔧 浅色filter: ${filter}`);
          return filter;
        }
      } catch (error) {
        console.error('❌ 动态filter生成失败:', error);
        return 'brightness(0)';
      }
    },

    // 十六进制颜色转RGB
    hexToRgb: function (hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    },

    // RGB转色相
    rgbToHue: function (r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;

      if (diff === 0) return 0;

      let hue;
      switch (max) {
        case r:
          hue = (g - b) / diff + (g < b ? 6 : 0);
          break;
        case g:
          hue = (b - r) / diff + 2;
          break;
        case b:
          hue = (r - g) / diff + 4;
          break;
      }

      return Math.round(hue * 60);
    },

    // RGB转饱和度
    rgbToSaturation: function (r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;

      if (max === 0) return 0;

      return Math.round((diff / max) * 100);
    },

    // 高级主题配置（支持分别设置边框和图标颜色）
    setAdvancedTheme: function (config, shellId = 'phone_shell') {
      const $shell = $(`#${shellId}`);
      if ($shell.length === 0) {
        console.error(`❌ 手机外壳元素 #${shellId} 不存在`);
        return false;
      }

      // 设置基础主题
      if (config.baseTheme && this.themes[config.baseTheme]) {
        this.setTheme(config.baseTheme, shellId);
      }

      // 覆盖边框颜色
      if (config.borderColor) {
        this.setBorderColor(config.borderColor, shellId);
      }

      // 覆盖图标颜色
      if (config.timeColor || config.iconColor) {
        this.setIconColors(config.timeColor, config.iconColor, shellId);
      }

      console.log('🎨 高级主题配置已应用:', config);
      return true;
    },

    // 获取当前主题配置
    getCurrentThemeConfig: function (shellId = 'phone_shell') {
      const $shell = $(`#${shellId}`);
      if ($shell.length === 0) {
        console.warn(`⚠️ 手机外壳元素 #${shellId} 不存在`);
        return {
          borderColor: '#e0e0e0',
          timeColor: '#000000',
          iconColor: '#000000',
        };
      }

      // 从CSS变量中读取当前配置
      const computedStyle = window.getComputedStyle($shell[0]);
      const borderColor = computedStyle.getPropertyValue('--phone-border-color').trim() || '#e0e0e0';
      const timeColor = computedStyle.getPropertyValue('--status-bar-time-color').trim() || '#000000';
      const iconColor = computedStyle.getPropertyValue('--status-bar-icon-color').trim() || '#000000';

      return {
        borderColor,
        timeColor,
        iconColor,
      };
    },

    // 获取状态栏图标SVG内容（只保留信号和电量图标）
    getStatusIconsSVG: function () {
      return `
        <svg width="50" height="14" viewBox="0 0 50 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 信号强度图标 -->
          <path fill-rule="evenodd" clip-rule="evenodd" d="M19.8498 2.03301C19.8498 1.39996 19.3723 0.88678 18.7832 0.88678H17.7165C17.1274 0.88678 16.6498 1.39996 16.6498 2.03301V11.967C16.6498 12.6 17.1274 13.1132 17.7165 13.1132H18.7832C19.3723 13.1132 19.8498 12.6 19.8498 11.967V2.03301ZM12.4157 3.33206H13.4824C14.0715 3.33206 14.5491 3.85756 14.5491 4.5058V11.9395C14.5491 12.5877 14.0715 13.1132 13.4824 13.1132H12.4157C11.8266 13.1132 11.3491 12.5877 11.3491 11.9395V4.5058C11.3491 3.85756 11.8266 3.33206 12.4157 3.33206ZM8.08396 5.98111H7.01729C6.42819 5.98111 5.95062 6.5133 5.95062 7.16979V11.9245C5.95062 12.581 6.42819 13.1132 7.01729 13.1132H8.08396C8.67306 13.1132 9.15062 12.581 9.15062 11.9245V7.16979C9.15062 6.5133 8.67306 5.98111 8.08396 5.98111ZM2.78317 8.4264H1.71651C1.1274 8.4264 0.649841 8.95099 0.649841 9.5981V11.9415C0.649841 12.5886 1.1274 13.1132 1.71651 13.1132H2.78317C3.37228 13.1132 3.84984 12.5886 3.84984 11.9415V9.5981C3.84984 8.95099 3.37228 8.4264 2.78317 8.4264Z" fill="currentColor"/>

          <!-- 电池图标 -->
          <g transform="translate(-25, 0)">
            <rect x="51" y="2" width="24" height="10" rx="2" stroke="currentColor" stroke-width="1" fill="none"/>
            <rect x="75.5" y="4.5" width="2" height="5" rx="1" fill="currentColor"/>
            <rect x="53" y="4" width="18" height="6" rx="1" fill="currentColor" opacity="0.8"/>
            <text x="63" y="9" font-family="Arial, sans-serif" font-size="6" text-anchor="middle" fill="currentColor" font-weight="bold">80</text>
          </g>
        </svg>
      `;
    },

    // 更新时间显示 - 确保正确获取系统时间
    updateTime: function (shellId = 'phone_shell') {
      // 获取当前系统时间
      const now = new Date();

      // 格式化时间为 HH:MM 格式
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      // 更新状态栏时间显示
      const timeElement = $(`#${shellId}_status_time`);
      if (timeElement.length > 0) {
        timeElement.text(timeString);
      } else {
        // 如果找不到指定ID的元素，尝试通用选择器
        $('.phone-shell-status-time').text(timeString);
      }

      // 如果存在调试模式，输出时间更新信息
      if (this.debugMode) {
        console.log(`⏰ 时间更新 (${shellId}): ${timeString} - 系统时间: ${now.toLocaleString()}`);
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
