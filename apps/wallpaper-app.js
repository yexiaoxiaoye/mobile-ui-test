// 美化应用模块 - 壁纸更换功能
(function (window) {
  'use strict';

  const WallpaperApp = {
    // 壁纸历史记录
    wallpaperHistory: [],
    currentWallpaper: '',

    // 配置选项
    useFileStorage: false, // 是否使用文件存储（需要后端支持）
    apiBaseUrl: 'http://localhost:3001/api', // 后端API地址
    configFileName: 'wallpaper-config.json', // 配置文件名

    // QQ背景管理
    qqBackgrounds: {
      home: '', // QQ主页背景（包括好友管理、群聊管理、头像修改）
      homeBlur: 0, // QQ主页背景模糊程度 (0-20)
      chats: {}, // 聊天详情背景 {chatId: {url: '', blur: 0}}
    },

    // 当前编辑的背景类型和ID
    currentEditType: 'phone', // 'phone', 'qq-home', 'qq-chat'
    currentChatId: null, // 当前编辑的聊天ID

    // 初始化应用
    async init() {
      console.log('🎨 美化应用初始化...');
      await this.loadWallpaperHistory();

      // 创建动态样式表
      this.createStyleSheet();

      this.bindEvents();

      // 延迟应用当前壁纸和QQ背景，确保手机界面已经创建
      setTimeout(() => {
        this.applyCurrentWallpaper();
        this.applyCurrentQQBackgrounds();
      }, 500);

      console.log('✅ 美化应用初始化完成');
    },

    // 启用文件存储模式
    enableFileStorage(apiUrl = 'http://localhost:3001/api') {
      this.useFileStorage = true;
      this.apiBaseUrl = apiUrl;
      console.log('📁 已启用文件存储模式:', apiUrl);
    },

    // 禁用文件存储模式（回到localStorage）
    disableFileStorage() {
      this.useFileStorage = false;
      console.log('💾 已切换到localStorage存储模式');
    },

    // 检查后端服务是否可用
    async checkBackendAvailable() {
      try {
        const response = await fetch(`${this.apiBaseUrl}/wallpaper-config`);
        return response.ok;
      } catch (error) {
        return false;
      }
    },

    // 创建应用界面 - 不需要创建独立界面，使用手机界面内的容器
    createInterface() {
      // 美化应用将直接在手机界面内显示，不需要创建独立的界面
      console.log('✅ 美化应用将使用手机界面内的容器');
    },

    // 绑定事件
    bindEvents() {
      const self = this;

      // 返回按钮
      $(document).on('click', '.wallpaper-back-btn', function (e) {
        e.stopPropagation();
        console.log('🔙 点击返回按钮');
        self.hide();
      });

      // URL输入和预览
      $(document).on('input', '.wallpaper-url-input', function () {
        const url = $(this).val().trim();
        if (url) {
          self.previewWallpaper(url);
        }
      });

      // 应用壁纸
      $(document).on('click', '.wallpaper-apply-btn', function (e) {
        e.stopPropagation();
        const url = $('.wallpaper-url-input').val().trim();
        if (url) {
          self.applyWallpaper(url);
        } else {
          alert('请先输入壁纸URL');
        }
      });

      // 恢复默认壁纸
      $(document).on('click', '.wallpaper-reset-btn', function (e) {
        e.stopPropagation();
        self.resetWallpaper();
      });

      // 历史记录点击
      $(document).on('click', '.wallpaper-history-item', function (e) {
        e.stopPropagation();
        const url = $(this).data('url');
        if (url) {
          $('.wallpaper-url-input').val(url);
          self.previewWallpaper(url);
        }
      });

      // 导出配置按钮
      $(document).on('click', '.wallpaper-export-btn', function (e) {
        e.stopPropagation();
        const data = {
          currentWallpaper: self.currentWallpaper,
          history: self.wallpaperHistory,
          qqBackgrounds: self.qqBackgrounds, // 包含QQ背景数据
        };
        self.exportConfig(data);
      });

      // 导入配置按钮
      $(document).on('click', '.wallpaper-import-btn', function (e) {
        e.stopPropagation();
        self
          .importConfig()
          .then(() => {
            // 刷新界面显示
            self.loadCurrentWallpaper();
            self.refreshHistoryDisplay();
            alert('✅ 配置文件导入成功！');
          })
          .catch(error => {
            alert('❌ 导入失败: ' + error.message);
          });
      });

      // 模糊滑块事件
      $(document).on('input', '.wallpaper-blur-slider', function (e) {
        const blurValue = $(this).val();
        $('.wallpaper-blur-value').text(blurValue + 'px');

        // 实时预览模糊效果
        self.previewBlur(blurValue);
      });

      console.log('✅ 美化应用事件已绑定');
    },

    // 显示应用
    show() {
      console.log('🎨 显示美化应用');

      // 在手机界面内显示美化应用
      this.showInPhoneInterface();

      console.log('✅ 美化应用已显示');
    },

    // 隐藏应用
    hide() {
      console.log('🎨 隐藏美化应用');

      // 清空手机界面中的美化应用容器
      const $wallpaperContainer = $('#phone_interface .wallpaper-app-container');
      $wallpaperContainer.empty();

      // 确保手机界面保持显示状态，移除美化应用模式
      $('#phone_interface').addClass('show').removeClass('show-wallpaper-app-content');
      $('body').removeClass('wallpaper-app-mode');

      // 显示手机主屏幕的核心元素
      $('#phone_interface .phone-background').show();
      $('#phone_interface .dynamic-island').show();
      $('#phone_interface .phone-status-bar').show();
      $('#phone_interface .phone-home-screen').show();
      $('#phone_interface .phone-dock').show();

      console.log('✅ 已返回手机主界面');
    },

    // 在手机界面内显示美化应用
    showInPhoneInterface() {
      console.log('📱 开始在手机界面内显示美化应用');

      // 检查手机界面是否存在美化应用容器，如果不存在则创建
      let $wallpaperContainer = $('#phone_interface .wallpaper-app-container');
      if ($wallpaperContainer.length === 0) {
        // 在手机界面中添加美化应用容器
        $('#phone_interface .phone-screen').append('<div class="wallpaper-app-container"></div>');
        $wallpaperContainer = $('#phone_interface .wallpaper-app-container');
        console.log('📦 已创建美化应用容器');
      }

      // 创建美化应用的内容
      const wallpaperContent = this.createWallpaperContent();
      $wallpaperContainer.empty().append(wallpaperContent);

      // 设置手机界面为美化应用模式
      $('#phone_interface').addClass('show show-wallpaper-app-content');
      $('body').addClass('wallpaper-app-mode');

      // 更新时间显示
      this.updateTime();

      // 加载当前壁纸状态
      this.loadCurrentWallpaper();

      // 刷新历史记录显示
      this.refreshHistoryDisplay();

      console.log('✅ 美化应用已在手机界面内显示');
    },

    // 创建美化应用内容
    createWallpaperContent() {
      return $(`
        <div class="wallpaper-app-content">
          <!-- 应用头部 -->
          <div class="wallpaper-app-header">
            <button class="wallpaper-back-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
            <h1 class="wallpaper-app-title">${this.getEditTitle()}</h1>
          </div>

          <!-- 应用主体 -->
          <div class="wallpaper-app-body">
            ${this.getEditContent()}
          </div>
        </div>
      `);
    },

    // 获取编辑标题
    getEditTitle() {
      switch (this.currentEditType) {
        case 'phone':
          return '美化 - 手机壁纸';
        case 'qq-home':
          return '美化 - QQ主页背景';
        case 'qq-chat':
          return '美化 - 聊天背景';
        default:
          return '美化';
      }
    },

    // 获取编辑内容
    getEditContent() {
      const isPhoneMode = this.currentEditType === 'phone';
      const isQQMode = this.currentEditType.startsWith('qq');
      const currentBg = this.getCurrentBackground();
      const currentBlur = this.getCurrentBlur();

      return `
        <!-- 当前背景预览 -->
        <div class="wallpaper-preview-section">
          <h3>当前${isPhoneMode ? '壁纸' : '背景'}</h3>
          <div class="wallpaper-preview-container">
            <div class="wallpaper-preview-frame">
              <div class="wallpaper-preview-image"></div>
            </div>
            <p class="wallpaper-preview-tip">预览效果</p>
          </div>
        </div>

        <!-- 背景设置 -->
        <div class="wallpaper-settings-section">
          <h3>设置${isPhoneMode ? '壁纸' : '背景'}</h3>
          <div class="wallpaper-url-input-section">
            <input type="text" class="wallpaper-url-input" placeholder="输入图片URL地址" value="${currentBg}">
          </div>

          ${
            isQQMode
              ? `
          <!-- 模糊程度设置 -->
          <div class="wallpaper-blur-section">
            <h4>背景模糊程度</h4>
            <div class="wallpaper-blur-control">
              <input type="range" class="wallpaper-blur-slider" min="0" max="20" value="${currentBlur}" step="1">
              <span class="wallpaper-blur-value">${currentBlur}px</span>
            </div>
          </div>
          `
              : ''
          }

          <div class="wallpaper-actions">
            <button class="wallpaper-apply-btn">应用${isPhoneMode ? '壁纸' : '背景'}</button>
            <button class="wallpaper-reset-btn">恢复默认</button>
          </div>

          ${
            isPhoneMode
              ? `
          <!-- 配置文件管理 -->
          <div class="wallpaper-config-section">
            <h4>配置文件</h4>
            <div class="wallpaper-config-actions">
              <button class="wallpaper-export-btn">📁 导出配置</button>
              <button class="wallpaper-import-btn">📂 导入配置</button>
            </div>
            <p class="wallpaper-config-tip">导出配置文件可在其他设备或浏览器中使用</p>
          </div>
          `
              : ''
          }
        </div>

        <!-- 历史记录 -->
        <div class="wallpaper-history-section">
          <h3>历史记录</h3>
          <div class="wallpaper-history-list">
            <!-- 历史记录项将动态添加 -->
          </div>
        </div>
      `;
    },

    // 获取当前背景URL
    getCurrentBackground() {
      switch (this.currentEditType) {
        case 'phone':
          return this.currentWallpaper;
        case 'qq-home':
          return this.qqBackgrounds.home;
        case 'qq-chat':
          return this.qqBackgrounds.chats[this.currentChatId]?.url || '';
        default:
          return '';
      }
    },

    // 获取当前模糊程度
    getCurrentBlur() {
      switch (this.currentEditType) {
        case 'qq-home':
          return this.qqBackgrounds.homeBlur;
        case 'qq-chat':
          return this.qqBackgrounds.chats[this.currentChatId]?.blur || 0;
        default:
          return 0;
      }
    },

    // 更新时间显示
    updateTime() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      // 更新手机界面的状态栏时间
      $('#phone_interface .phone-status-time').text(timeStr);
    },

    // 预览壁纸
    previewWallpaper(url) {
      console.log('🖼️ 预览壁纸:', url);

      const $previewImage = $('.wallpaper-preview-image');

      // 创建临时图片元素测试URL是否有效
      const testImg = new Image();
      testImg.onload = function () {
        $previewImage.css({
          'background-image': `url(${url})`,
          'background-size': 'cover',
          'background-position': 'center',
          'background-repeat': 'no-repeat',
        });
        console.log('✅ 壁纸预览成功');
      };
      testImg.onerror = function () {
        console.error('❌ 壁纸URL无效:', url);
        alert('壁纸URL无效，请检查链接');
      };
      testImg.src = url;
    },

    // 应用壁纸
    applyWallpaper(url) {
      console.log('🎨 应用壁纸:', url);

      // 创建临时图片元素测试URL是否有效
      const testImg = new Image();
      testImg.onload = () => {
        // 根据当前编辑类型应用背景
        this.updateCurrentBackground(url);

        // 保存到历史记录
        this.addToHistory(url);

        // 保存数据
        this.saveWallpaperHistory();

        // 显示成功消息
        const message = this.currentEditType === 'phone' ? '壁纸设置成功！' : '背景设置成功！';
        this.showSuccessMessage(message);

        console.log('✅ 背景应用成功');
      };
      testImg.onerror = () => {
        console.error('❌ 图片URL无效:', url);
        alert('图片URL无效，请检查链接');
      };
      testImg.src = url;
    },

    // 更新手机界面背景
    updatePhoneBackground(url) {
      // 只更新手机屏幕背景（这是主要的背景容器）
      $('#phone_interface .phone-screen').css({
        'background-image': `url(${url})`,
        'background-size': 'cover',
        'background-position': 'center',
        'background-repeat': 'no-repeat',
      });

      // 清除主屏幕的背景设置，避免影响状态栏布局
      $('#phone_interface .phone-home-screen').css({
        'background-image': 'none',
        'background-size': '',
        'background-position': '',
        'background-repeat': '',
      });

      console.log('🖼️ 手机背景已更新，状态栏布局已保护');
    },

    // 更新当前背景（根据编辑类型）
    updateCurrentBackground(url) {
      const blurValue = $('.wallpaper-blur-slider').val() || 0;

      switch (this.currentEditType) {
        case 'phone':
          this.currentWallpaper = url;
          this.updatePhoneBackground(url);
          break;
        case 'qq-home':
          this.qqBackgrounds.home = url;
          this.qqBackgrounds.homeBlur = parseInt(blurValue);
          this.updateQQHomeBackground(url, blurValue);
          break;
        case 'qq-chat':
          if (!this.qqBackgrounds.chats[this.currentChatId]) {
            this.qqBackgrounds.chats[this.currentChatId] = {};
          }
          this.qqBackgrounds.chats[this.currentChatId].url = url;
          this.qqBackgrounds.chats[this.currentChatId].blur = parseInt(blurValue);
          this.updateQQChatBackground(this.currentChatId, url, blurValue);
          break;
      }
    },

    // 更新QQ主页背景
    updateQQHomeBackground(url, blur = 0) {
      console.log('🎨 开始更新QQ主页背景:', url, 'blur:', blur + 'px');

      // 使用CSS规则来设置伪元素背景，确保能覆盖现有背景
      this.updateQQBackgroundCSS('qq-home', url, blur);

      console.log('✅ QQ主页背景已更新完成');
    },

    // 更新QQ聊天详情背景
    updateQQChatBackground(chatId, url, blur = 0) {
      console.log(`🎨 开始更新聊天${chatId}背景:`, url, 'blur:', blur + 'px');

      // 使用CSS规则来设置聊天背景
      this.updateQQBackgroundCSS('qq-chat', url, blur, chatId);

      console.log(`✅ 聊天${chatId}背景已更新完成`);
    },

    // 更新QQ背景CSS规则（核心方法）
    updateQQBackgroundCSS(type, url, blur = 0, chatId = null) {
      // 确保有样式表可以操作
      if (!this.styleSheet) {
        this.createStyleSheet();
      }

      // 根据类型生成不同的CSS选择器和规则
      let selectors = [];
      let ruleId = '';

      switch (type) {
        case 'qq-home':
          selectors = ['#history_content::before'];
          ruleId = 'qq-home-background';
          break;

        case 'qq-chat':
          if (chatId) {
            selectors = [
              `.qq-contact-wrapper[data-qq-number="${chatId}"] .chat-messages`,
              `.qq-group-wrapper[data-group-id="${chatId}"] .chat-messages`,
            ];
            ruleId = `qq-chat-background-${chatId}`;
          }
          break;
      }

      if (selectors.length === 0) {
        console.warn('⚠️ 未找到有效的CSS选择器');
        return;
      }

      // 生成CSS规则（根据类型使用不同的规则）
      const cssRule = this.generateBackgroundCSSRule(selectors, url, blur, type);

      // 应用CSS规则
      this.applyCSSRule(ruleId, cssRule);

      console.log(`📝 已应用CSS规则 [${ruleId}]:`, cssRule.substring(0, 100) + '...');
    },

    // 创建样式表
    createStyleSheet() {
      // 查找或创建专用的样式表
      let styleElement = document.getElementById('wallpaper-dynamic-styles');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'wallpaper-dynamic-styles';
        styleElement.type = 'text/css';
        document.head.appendChild(styleElement);
      }
      this.styleSheet = styleElement.sheet || styleElement.styleSheet;
      console.log('📋 动态样式表已创建');
    },

    // 生成背景CSS规则
    generateBackgroundCSSRule(selectors, url, blur, type = 'qq-home') {
      const selectorString = selectors.join(', ');

      if (type === 'qq-chat') {
        // 聊天背景直接设置在元素上，不使用伪元素
        return `
          ${selectorString} {
            background-image: url('${url}') !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-attachment: fixed !important;
            opacity: 0.95 !important;
            filter: blur(${blur}px) !important;
          }
        `;
      } else {
        // QQ主页背景使用伪元素
        return `
          ${selectorString} {
            content: '' !important;
            position: absolute !important;
            inset: 0 !important;
            background-image: url('${url}') !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            opacity: 0.95 !important;
            filter: blur(${blur}px) !important;
            z-index: 0 !important;
          }
        `;
      }
    },

    // 应用CSS规则
    applyCSSRule(ruleId, cssRule) {
      // 先删除同ID的旧规则
      this.removeCSSRule(ruleId);

      // 添加新规则
      try {
        const ruleIndex = this.styleSheet.insertRule(cssRule, this.styleSheet.cssRules.length);

        // 存储规则ID和索引的映射
        if (!this.cssRuleMap) {
          this.cssRuleMap = new Map();
        }
        this.cssRuleMap.set(ruleId, ruleIndex);

        console.log(`✅ CSS规则已应用 [${ruleId}] 索引: ${ruleIndex}`);
      } catch (error) {
        console.error('❌ 应用CSS规则失败:', error, cssRule);
      }
    },

    // 删除CSS规则
    removeCSSRule(ruleId) {
      if (!this.cssRuleMap || !this.cssRuleMap.has(ruleId)) {
        return;
      }

      try {
        const ruleIndex = this.cssRuleMap.get(ruleId);
        this.styleSheet.deleteRule(ruleIndex);
        this.cssRuleMap.delete(ruleId);

        // 更新其他规则的索引（因为删除规则会影响后续规则的索引）
        this.cssRuleMap.forEach((index, id) => {
          if (index > ruleIndex) {
            this.cssRuleMap.set(id, index - 1);
          }
        });

        console.log(`🗑️ 已删除CSS规则 [${ruleId}]`);
      } catch (error) {
        console.error('❌ 删除CSS规则失败:', error);
      }
    },

    // 预览模糊效果
    previewBlur(blurValue) {
      const url = $('.wallpaper-url-input').val().trim();
      if (!url) return;

      switch (this.currentEditType) {
        case 'qq-home':
          this.updateQQHomeBackground(url, blurValue);
          break;
        case 'qq-chat':
          this.updateQQChatBackground(this.currentChatId, url, blurValue);
          break;
      }
    },

    // 恢复默认壁纸
    resetWallpaper() {
      console.log('🔄 恢复默认背景');

      switch (this.currentEditType) {
        case 'phone':
          // 恢复默认手机壁纸
          const defaultWallpaper = 'https://files.catbox.moe/5kqdkh.jpg';
          this.updatePhoneBackground(defaultWallpaper);
          this.currentWallpaper = '';
          break;
        case 'qq-home':
          // 清除QQ主页背景 - 删除CSS规则
          this.removeCSSRule('qq-home-background');
          this.qqBackgrounds.home = '';
          this.qqBackgrounds.homeBlur = 0;
          break;
        case 'qq-chat':
          // 清除特定聊天背景 - 删除CSS规则
          if (this.currentChatId) {
            this.removeCSSRule(`qq-chat-background-${this.currentChatId}`);
            if (this.qqBackgrounds.chats[this.currentChatId]) {
              delete this.qqBackgrounds.chats[this.currentChatId];
            }
          }
          break;
      }

      // 清空输入框和预览
      $('.wallpaper-url-input').val('');
      $('.wallpaper-preview-image').css('background-image', '');
      $('.wallpaper-blur-slider').val(0);
      $('.wallpaper-blur-value').text('0px');

      // 保存状态
      this.saveWallpaperHistory();

      const message = this.currentEditType === 'phone' ? '已恢复默认壁纸' : '已清除背景';
      this.showSuccessMessage(message);
      console.log('✅ 默认背景已恢复');
    },

    // 添加到历史记录
    addToHistory(url) {
      // 避免重复添加
      const existingIndex = this.wallpaperHistory.findIndex(item => item.url === url);
      if (existingIndex !== -1) {
        // 如果已存在，移到最前面
        const existing = this.wallpaperHistory.splice(existingIndex, 1)[0];
        existing.timestamp = Date.now();
        this.wallpaperHistory.unshift(existing);
      } else {
        // 添加新记录
        this.wallpaperHistory.unshift({
          url: url,
          timestamp: Date.now(),
          name: this.generateWallpaperName(url),
        });
      }

      // 限制历史记录数量
      if (this.wallpaperHistory.length > 10) {
        this.wallpaperHistory = this.wallpaperHistory.slice(0, 10);
      }

      this.refreshHistoryDisplay();
    },

    // 生成壁纸名称
    generateWallpaperName(url) {
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      const nameWithoutExt = filename.split('.')[0];
      return nameWithoutExt || '未命名壁纸';
    },

    // 刷新历史记录显示
    refreshHistoryDisplay() {
      const $historyList = $('.wallpaper-history-list');
      $historyList.empty();

      if (this.wallpaperHistory.length === 0) {
        $historyList.html('<p class="wallpaper-no-history">暂无历史记录</p>');
        return;
      }

      this.wallpaperHistory.forEach((item, index) => {
        const date = new Date(item.timestamp);
        const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(
          date.getMinutes(),
        ).padStart(2, '0')}`;

        const $historyItem = $(`
          <div class="wallpaper-history-item" data-url="${item.url}">
            <div class="wallpaper-history-preview" style="background-image: url(${item.url})"></div>
            <div class="wallpaper-history-info">
              <div class="wallpaper-history-name">${item.name}</div>
              <div class="wallpaper-history-time">${timeStr}</div>
            </div>
          </div>
        `);

        $historyList.append($historyItem);
      });
    },

    // 加载当前壁纸状态
    loadCurrentWallpaper() {
      const currentBg = this.getCurrentBackground();
      const currentBlur = this.getCurrentBlur();

      if (currentBg) {
        $('.wallpaper-url-input').val(currentBg);
        this.previewWallpaper(currentBg);
      }

      // 更新模糊滑块的值
      if (this.currentEditType.startsWith('qq')) {
        $('.wallpaper-blur-slider').val(currentBlur);
        $('.wallpaper-blur-value').text(currentBlur + 'px');
      }

      console.log('📋 已加载当前背景状态:', this.currentEditType, currentBg, 'blur:', currentBlur);
    },

    // 显示成功消息
    showSuccessMessage(message) {
      const $message = $(`
        <div class="wallpaper-success-message">
          <div class="wallpaper-success-content">
            <span class="wallpaper-success-icon">✅</span>
            <span class="wallpaper-success-text">${message}</span>
          </div>
        </div>
      `);

      $('body').append($message);

      setTimeout(() => {
        $message.fadeOut(300, function () {
          $(this).remove();
        });
      }, 2000);
    },

    // 保存壁纸历史记录
    async saveWallpaperHistory() {
      try {
        const data = {
          currentWallpaper: this.currentWallpaper,
          history: this.wallpaperHistory,
          qqBackgrounds: this.qqBackgrounds, // 包含QQ背景数据
        };

        if (this.useFileStorage) {
          // 使用文件存储
          await this.saveToFile(data);
        } else {
          // 使用localStorage存储
          localStorage.setItem('wallpaper_data', JSON.stringify(data));
        }

        console.log('💾 壁纸数据已保存');
      } catch (error) {
        console.error('❌ 保存壁纸数据失败:', error);
      }
    },

    // 保存到文件
    async saveToFile(data) {
      try {
        const response = await fetch(`${this.apiBaseUrl}/wallpaper-config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📁 壁纸数据已保存到文件:', result);
      } catch (error) {
        console.error('❌ 保存到文件失败:', error);
        // 回退到localStorage
        localStorage.setItem('wallpaper_data', JSON.stringify(data));
        console.log('🔄 已回退到localStorage存储');
      }
    },

    // 加载壁纸历史记录
    async loadWallpaperHistory() {
      try {
        let data = null;

        if (this.useFileStorage) {
          // 从文件加载
          data = await this.loadFromFile();
        } else {
          // 从localStorage加载
          const saved = localStorage.getItem('wallpaper_data');
          if (saved) {
            data = JSON.parse(saved);
          }
        }

        if (data) {
          this.currentWallpaper = data.currentWallpaper || '';
          this.wallpaperHistory = data.history || [];
          this.qqBackgrounds = data.qqBackgrounds || {
            home: '',
            homeBlur: 0,
            chats: {},
          };
          console.log('📂 壁纸数据已加载');
        }
      } catch (error) {
        console.error('❌ 加载壁纸数据失败:', error);
        this.wallpaperHistory = [];
        this.currentWallpaper = '';
      }
    },

    // 从文件加载
    async loadFromFile() {
      try {
        const response = await fetch(`${this.apiBaseUrl}/wallpaper-config`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📁 从文件加载壁纸数据:', data);
        return data;
      } catch (error) {
        console.error('❌ 从文件加载失败:', error);
        // 回退到localStorage
        const saved = localStorage.getItem('wallpaper_data');
        if (saved) {
          console.log('🔄 已回退到localStorage加载');
          return JSON.parse(saved);
        }
        return null;
      }
    },

    // 导出配置文件
    exportConfig(data) {
      try {
        // 创建配置文件内容
        const configContent = JSON.stringify(data, null, 2);

        // 创建Blob对象
        const blob = new Blob([configContent], { type: 'application/json' });

        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.configFileName;

        // 设置样式和属性，避免触发外部点击检测
        link.style.display = 'none';
        link.style.position = 'absolute';
        link.style.left = '-9999px';
        link.setAttribute('data-mobile-ui-element', 'true'); // 标记为移动UI元素

        // 添加到手机界面内部，而不是body
        const phoneInterface = document.getElementById('phone_interface');
        if (phoneInterface) {
          phoneInterface.appendChild(link);
        } else {
          document.body.appendChild(link);
        }

        // 延迟触发下载，避免与点击事件冲突
        setTimeout(() => {
          link.click();

          // 延迟清理
          setTimeout(() => {
            if (link.parentNode) {
              link.parentNode.removeChild(link);
            }
            URL.revokeObjectURL(url);
          }, 100);
        }, 50);

        console.log('📁 配置文件已导出:', this.configFileName);
      } catch (error) {
        console.error('❌ 导出失败:', error);
      }
    },

    // 导入配置文件
    importConfig() {
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        input.style.position = 'absolute';
        input.style.left = '-9999px';
        input.setAttribute('data-mobile-ui-element', 'true'); // 标记为移动UI元素

        input.onchange = event => {
          const file = event.target.files[0];
          if (!file) {
            reject(new Error('未选择文件'));
            return;
          }

          const reader = new FileReader();
          reader.onload = e => {
            try {
              const data = JSON.parse(e.target.result);
              this.currentWallpaper = data.currentWallpaper || '';
              this.wallpaperHistory = data.history || [];
              this.qqBackgrounds = data.qqBackgrounds || {
                home: '',
                homeBlur: 0,
                chats: {},
              };

              // 应用导入的壁纸
              if (this.currentWallpaper) {
                this.updatePhoneBackground(this.currentWallpaper);
              }

              // 应用导入的QQ背景
              if (this.qqBackgrounds.home) {
                this.updateQQHomeBackground(this.qqBackgrounds.home, this.qqBackgrounds.homeBlur);
              }

              // 应用导入的聊天背景
              Object.keys(this.qqBackgrounds.chats).forEach(chatId => {
                const chatBg = this.qqBackgrounds.chats[chatId];
                if (chatBg.url) {
                  this.updateQQChatBackground(chatId, chatBg.url, chatBg.blur);
                }
              });

              // 保存到localStorage
              localStorage.setItem('wallpaper_data', JSON.stringify(data));

              console.log('📁 配置文件已导入，包含所有背景设置');
              resolve(data);
            } catch (error) {
              reject(new Error('配置文件格式错误'));
            }
          };

          reader.readAsText(file);
        };

        // 添加到手机界面内部，而不是body
        const phoneInterface = document.getElementById('phone_interface');
        if (phoneInterface) {
          phoneInterface.appendChild(input);
        } else {
          document.body.appendChild(input);
        }

        input.click();

        // 延迟清理
        setTimeout(() => {
          if (input.parentNode) {
            input.parentNode.removeChild(input);
          }
        }, 100);
      });
    },

    // 应用当前壁纸（在初始化时调用）
    applyCurrentWallpaper() {
      if (this.currentWallpaper) {
        console.log('🖼️ 应用保存的壁纸:', this.currentWallpaper);
        this.updatePhoneBackground(this.currentWallpaper);
      } else {
        console.log('📱 没有保存的壁纸，使用默认壁纸');
      }
    },

    // 应用当前QQ背景（在初始化时调用）
    applyCurrentQQBackgrounds() {
      console.log('🎨 开始应用保存的QQ背景');

      // 应用QQ主页背景
      if (this.qqBackgrounds.home) {
        console.log('🏠 应用QQ主页背景:', this.qqBackgrounds.home, 'blur:', this.qqBackgrounds.homeBlur);
        this.updateQQHomeBackground(this.qqBackgrounds.home, this.qqBackgrounds.homeBlur);
      }

      // 应用所有聊天背景
      Object.keys(this.qqBackgrounds.chats).forEach(chatId => {
        const chatBg = this.qqBackgrounds.chats[chatId];
        if (chatBg && chatBg.url) {
          console.log(`💬 应用聊天${chatId}背景:`, chatBg.url, 'blur:', chatBg.blur);
          this.updateQQChatBackground(chatId, chatBg.url, chatBg.blur);
        }
      });

      console.log('✅ QQ背景应用完成');
    },

    // 打开QQ主页背景编辑器
    openQQHomeEditor() {
      this.currentEditType = 'qq-home';
      this.currentChatId = null;
      this.show();
    },

    // 打开QQ聊天背景编辑器
    openQQChatEditor(chatId) {
      this.currentEditType = 'qq-chat';
      this.currentChatId = chatId;
      this.show();
    },

    // 打开手机壁纸编辑器
    openPhoneEditor() {
      this.currentEditType = 'phone';
      this.currentChatId = null;
      this.show();
    },
  };

  // 导出到全局
  window.WallpaperApp = WallpaperApp;
})(window);
