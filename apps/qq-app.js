// QQ消息应用 - 重构版本
(function (window) {
  'use strict';

  // 确保QQDataManager已加载
  if (!window.QQDataManager) {
    console.error('QQDataManager 未加载，请确保已引入 qq-data-manager.js');
  }

  // 配置常量
  const CONFIG = {
    SELECTORS: {
      CHAT_HISTORY_BTN: '#chat_history_btn',
      CHAT_HISTORY_DIALOG: '#chat_history_dialog',
      HISTORY_CONTENT: '#history_content',
      PHONE_INTERFACE: '#phone_interface',
      QQ_APP_CONTAINER: '.qq-app-container',
      USER_AVATAR: '#user_avatar',
      USER_NAME: '#user_name',
    },
    REGEX: {
      AVATAR: /\[头像\|(\d+)\|([^\]]+)\]/g,
      USER_INFO: /\[用户信息\|([^|]+)\|([^\]]*)\]/g,
      USER_AVATAR: /\[用户头像\|([^\]]+)\]/g,
    },
    DELAYS: {
      UPDATE_USER_DISPLAY: 100,
      CLONE_CONTENT: 100,
      SCROLL_TO_BOTTOM: 200,
      EDIT_MESSAGE: 100,
    },
  };

  const QQApp = {
    // 数据存储
    avatarData: {},
    userData: { name: '用户', avatar: '' },

    // 添加更新防抖和缓存机制
    updateTimers: {
      userAvatar: null,
      contactAvatars: {},
      friendManager: null,
    },
    lastUpdateStates: {
      userAvatar: null,
      contactAvatars: {},
    },

    // 初始化应用
    init() {
      try {
        if (!this.checkDependencies()) return;

        this.createInterface();
        this.bindEvents();
        this.loadData();

        setTimeout(() => this.updateUserDisplay(), CONFIG.DELAYS.UPDATE_USER_DISPLAY);
      } catch (error) {
        console.error('QQ应用初始化失败:', error);
      }
    },

    // 检查依赖
    checkDependencies() {
      if (typeof $ === 'undefined') {
        console.error('jQuery未加载');
        return false;
      }
      if (!window.HQDataExtractor) {
        console.warn('HQDataExtractor未找到，某些功能可能不可用');
      }
      if (!window.QQDataManager) {
        console.warn('QQDataManager未找到，好友管理功能可能不可用');
      } else {
        console.log('✅ QQDataManager 已加载');
      }
      return true;
    },

    // 加载所有数据
    loadData() {
      this.loadAvatarDataEnhanced();
      this.loadUserData();
    },

    // 加载头像数据（增强版）
    loadAvatarDataEnhanced() {
      try {
        console.log('🔄 [数据加载] 开始加载增强头像数据');
        this.avatarData = {};
        this.extractAvatarDataFromChatEnhanced();

        console.log('🔄 [数据加载] 数据提取完成，avatarData:', this.avatarData);

        // 加载完成后，更新所有头像显示
        setTimeout(() => {
          this.updateAllAvatarDisplaysFromData();
        }, 500);
      } catch (error) {
        console.error('加载增强头像数据失败:', error);
        this.avatarData = {};
      }
    },

    // 从聊天记录提取头像数据（增强版）
    extractAvatarDataFromChatEnhanced() {
      console.log('🔄 [数据提取] 开始从聊天记录提取头像数据');
      const context = this.getSillyTavernContext();
      if (!context) {
        console.log('⚠️ [数据提取] SillyTavern上下文不可用，使用DOM扫描');
        return this.extractAvatarDataFromDOMEnhanced();
      }

      const chatData = context.getContext();
      if (!chatData?.chat) {
        console.log('⚠️ [数据提取] 聊天数据不可用，使用DOM扫描');
        return this.extractAvatarDataFromDOMEnhanced();
      }

      console.log(`🔄 [数据提取] 找到 ${chatData.chat.length} 条聊天记录，开始处理`);
      this.processMessagesForAvatarsEnhanced(chatData.chat);
    },

    // 处理消息提取头像（增强版）
    processMessagesForAvatarsEnhanced(messages) {
      console.log(`🔄 [数据提取] 开始处理 ${messages.length} 条消息`);
      let foundAvatarData = false;

      messages.forEach((message, index) => {
        const messageText = message.mes || '';

        // 检查是否包含头像增强数据
        if (messageText.includes('[头像增强|') || messageText.includes('[用户头像增强|')) {
          console.log(`🔍 [数据提取] 消息 ${index} 包含头像增强数据:`, messageText.substring(0, 200) + '...');
          foundAvatarData = true;
        }

        this.extractAvatarsFromTextEnhanced(messageText);
        this.extractUserAvatarFromTextEnhanced(messageText);
      });

      if (!foundAvatarData) {
        console.log('⚠️ [数据提取] 未在任何消息中找到头像增强数据');
      }
    },

    // 从文本提取头像信息（增强版）
    extractAvatarsFromTextEnhanced(text) {
      // 提取增强格式的头像
      const enhancedRegex = /\[头像增强\|(\d+)\|([^\]]+)\]/g;
      let match;

      while ((match = enhancedRegex.exec(text)) !== null) {
        const [, qqNumber, configJson] = match;
        try {
          const avatarConfig = JSON.parse(configJson);
          this.avatarData[qqNumber] = avatarConfig.url;
          this.avatarData[`${qqNumber}_config`] = avatarConfig;

          console.log('🔍 [数据读取] 提取到头像增强配置:', {
            qqNumber,
            avatarConfig,
            transform: avatarConfig.transform,
          });
        } catch (error) {
          console.error('解析头像配置失败:', error);
        }
      }

      // 兼容旧格式
      this.extractAvatarsFromText(text);
    },

    // 从文本提取用户头像（增强版）
    extractUserAvatarFromTextEnhanced(text) {
      // 提取增强格式的用户头像
      const enhancedRegex = /\[用户头像增强\|([^\]]+)\]/g;
      let lastMatch = null;
      let match;

      while ((match = enhancedRegex.exec(text)) !== null) {
        lastMatch = match;
      }

      if (lastMatch) {
        try {
          const [, configJson] = lastMatch;
          const avatarConfig = JSON.parse(configJson);
          this.userData.avatar = avatarConfig.url;
          this.userData.avatarConfig = avatarConfig;

          console.log('🔍 [数据读取] 提取到用户头像增强配置:', {
            avatarConfig,
            transform: avatarConfig.transform,
          });
        } catch (error) {
          console.error('解析用户头像配置失败:', error);
        }
      }

      // 兼容旧格式
      this.extractUserAvatarFromText(text);
    },

    // DOM扫描备用方案（增强版）
    extractAvatarDataFromDOMEnhanced() {
      try {
        const messageElements = document.querySelectorAll('.mes_text, .mes_block');
        messageElements.forEach(element => {
          const messageText = element.textContent || '';
          this.extractAvatarsFromTextEnhanced(messageText);
          this.extractUserAvatarFromTextEnhanced(messageText);
        });
      } catch (error) {
        console.error('DOM扫描提取增强头像数据失败:', error);
      }
    },

    // DOM扫描备用方案（增强版用户数据）
    extractUserDataFromDOMEnhanced() {
      try {
        const messageElements = document.querySelectorAll('.mes_text, .mes_block');
        messageElements.forEach(element => {
          const messageText = element.textContent || '';
          this.extractUserInfoFromText(messageText);
          this.extractUserAvatarFromTextEnhanced(messageText);
        });
      } catch (error) {
        console.error('DOM扫描提取增强用户数据失败:', error);
      }
    },

    // 加载头像数据
    loadAvatarData() {
      try {
        this.avatarData = {};
        this.extractAvatarDataFromChat();
      } catch (error) {
        console.error('加载头像数据失败:', error);
        this.avatarData = {};
      }
    },

    // 从聊天记录提取头像数据
    extractAvatarDataFromChat() {
      const context = this.getSillyTavernContext();
      if (!context) {
        return this.extractAvatarDataFromDOM();
      }

      const chatData = context.getContext();
      if (!chatData?.chat) {
        return this.extractAvatarDataFromDOM();
      }

      this.processMessagesForAvatars(chatData.chat);
    },

    // 处理消息提取头像
    processMessagesForAvatars(messages) {
      messages.forEach(message => {
        const messageText = message.mes || '';
        this.extractAvatarsFromText(messageText);
      });
    },

    // 从文本提取头像信息
    extractAvatarsFromText(text) {
      CONFIG.REGEX.AVATAR.lastIndex = 0;
      let match;
      while ((match = CONFIG.REGEX.AVATAR.exec(text)) !== null) {
        const [, qqNumber, avatarUrl] = match;
        this.avatarData[qqNumber] = avatarUrl;
      }
    },

    // 获取SillyTavern上下文
    getSillyTavernContext() {
      return window.SillyTavern || window.sillyTavern;
    },

    // DOM扫描备用方案
    extractAvatarDataFromDOM() {
      try {
        const messageElements = document.querySelectorAll('.mes_text, .mes_block');
        messageElements.forEach(element => {
          const messageText = element.textContent || '';
          this.extractAvatarsFromText(messageText);
        });
      } catch (error) {
        console.error('DOM扫描提取头像数据失败:', error);
      }
    },

    // 获取头像URL
    getAvatarUrl(qqNumber) {
      if (!this.avatarData[qqNumber]) {
        this.extractAvatarDataFromChat();
      }
      return this.avatarData[qqNumber] || '';
    },

    // 加载用户数据
    loadUserData() {
      try {
        this.userData = { name: '用户', avatar: '' };
        this.extractUserDataFromChat();
        this.updateUserDisplay();
      } catch (error) {
        console.error('加载用户数据失败:', error);
        this.userData = { name: '用户', avatar: '' };
      }
    },

    // 从聊天记录提取用户数据
    extractUserDataFromChat() {
      const context = this.getSillyTavernContext();
      if (!context) {
        return this.extractUserDataFromDOMEnhanced();
      }

      const chatData = context.getContext();
      if (!chatData?.chat) {
        return this.extractUserDataFromDOMEnhanced();
      }

      // 获取用户名
      if (chatData.name1) {
        this.userData.name = chatData.name1;
      }

      this.processMessagesForUserDataEnhanced(chatData.chat);
    },

    // 处理消息提取用户数据（增强版）
    processMessagesForUserDataEnhanced(messages) {
      messages.forEach(message => {
        const messageText = message.mes || '';
        this.extractUserInfoFromText(messageText);
        this.extractUserAvatarFromTextEnhanced(messageText);
      });
    },

    // 从文本提取用户信息
    extractUserInfoFromText(text) {
      CONFIG.REGEX.USER_INFO.lastIndex = 0;
      let lastMatch = null;
      let match;

      while ((match = CONFIG.REGEX.USER_INFO.exec(text)) !== null) {
        lastMatch = match;
      }

      if (lastMatch) {
        const [, userName, userAvatar] = lastMatch;
        this.userData.name = userName;
        if (userAvatar) this.userData.avatar = userAvatar;
      }
    },

    // 从文本提取用户头像
    extractUserAvatarFromText(text) {
      CONFIG.REGEX.USER_AVATAR.lastIndex = 0;
      let lastMatch = null;
      let match;

      while ((match = CONFIG.REGEX.USER_AVATAR.exec(text)) !== null) {
        lastMatch = match;
      }

      if (lastMatch) {
        const [, userAvatar] = lastMatch;
        if (userAvatar) this.userData.avatar = userAvatar;
      }
    },

    // DOM扫描备用方案
    extractUserDataFromDOM() {
      try {
        const messageElements = document.querySelectorAll('.mes_text, .mes_block');
        messageElements.forEach(element => {
          const messageText = element.textContent || '';
          this.extractUserInfoFromText(messageText);
          this.extractUserAvatarFromText(messageText);
        });
      } catch (error) {
        console.error('DOM扫描提取用户数据失败:', error);
      }
    },

    // 更新用户信息显示
    updateUserDisplay() {
      try {
        this.updateUserName();
        this.updateUserAvatarEnhanced();
      } catch (error) {
        console.error('更新用户信息显示失败:', error);
      }
    },

    // 更新用户头像显示（增强版）- 添加防抖和缓存
    updateUserAvatarEnhanced() {
      // 清除之前的定时器
      if (this.updateTimers.userAvatar) {
        clearTimeout(this.updateTimers.userAvatar);
      }

      // 防抖处理
      this.updateTimers.userAvatar = setTimeout(() => {
        this.performUserAvatarUpdate();
      }, 100);
    },

    // 执行用户头像更新
    performUserAvatarUpdate() {
      const avatarConfig = this.getUserAvatarConfig();
      const currentState = JSON.stringify({
        avatar: this.userData.avatar,
        config: avatarConfig,
      });

      // 检查是否需要更新（状态是否改变）
      if (this.lastUpdateStates.userAvatar === currentState) {
        console.log('🔄 用户头像状态未改变，跳过更新');
        return;
      }

      console.log('🔄 执行用户头像更新');
      this.lastUpdateStates.userAvatar = currentState;

      const $userAvatarElements = this.getUserAvatarElements();

      if (this.userData.avatar?.trim()) {
        this.setUserAvatarImageEnhanced($userAvatarElements, avatarConfig);
        // 延迟更新消息头像，避免同时进行大量DOM操作
        setTimeout(() => {
          this.updateUserMessageAvatarsWithTransform(avatarConfig);
        }, 50);
      } else {
        this.setUserAvatarDefault($userAvatarElements);
      }
    },

    // 更新用户消息头像（应用变换效果）
    updateUserMessageAvatarsWithTransform(avatarConfig) {
      console.log('🔄 更新聊天详情页用户消息头像（含变换效果）');

      // 只查找用户发送的消息头像
      const $userMessageAvatars = $('.custom-message.custom-sent .sent-avatar');
      console.log(`🔍 找到 ${$userMessageAvatars.length} 个用户消息头像`);

      if ($userMessageAvatars.length === 0) return;

      $userMessageAvatars.each((index, element) => {
        const $element = $(element);
        let css = {
          'background-image': `url(${this.userData.avatar})`,
          'background-color': 'transparent',
          color: 'transparent',
          'font-size': '0',
        };

        // 应用变换效果
        if (avatarConfig && avatarConfig.transform) {
          const transform = avatarConfig.transform;

          // 应用安全限制
          const safeScale = Math.max(0.1, Math.min(5, transform.scale || 1));
          const safeX = Math.max(-200, Math.min(200, transform.translateX || 0));
          const safeY = Math.max(-200, Math.min(200, transform.translateY || 0));
          const safeRotation = (transform.rotate || 0) % 360;

          // 计算背景尺寸和位置
          const backgroundSize = `${safeScale * 100}%`;
          const backgroundPositionX = `${50 - safeX * 0.5}%`;
          const backgroundPositionY = `${50 - safeY * 0.5}%`;

          css['background-size'] = backgroundSize;
          css['background-position'] = `${backgroundPositionX} ${backgroundPositionY}`;
          css['background-repeat'] = 'no-repeat';

          // 应用旋转
          if (safeRotation !== 0) {
            css['transform'] = `rotate(${safeRotation}deg)`;
            css['transform-origin'] = 'center center';
          }

          // 只在第一个元素时输出调试信息
          if (index === 0) {
            console.log('🎨 应用用户消息头像变换:', {
              scale: safeScale,
              translate: { x: safeX, y: safeY },
              rotate: safeRotation,
              backgroundSize,
              backgroundPosition: `${backgroundPositionX} ${backgroundPositionY}`,
              elementCount: $userMessageAvatars.length,
            });
          }
        } else {
          // 默认样式
          css['background-size'] = 'cover';
          css['background-position'] = 'center';
        }

        $element.css(css).text('');
      });
    },

    // 获取用户头像配置
    getUserAvatarConfig() {
      return this.userData.avatarConfig || null;
    },

    // 设置用户头像图片（增强版）
    setUserAvatarImageEnhanced($elements, avatarConfig) {
      $elements.each((index, element) => {
        const $element = $(element);
        let css = {
          'background-image': `url(${this.userData.avatar})`,
          'background-color': 'transparent',
          color: 'transparent',
          'font-size': '0',
        };

        // 应用变换 - 使用background属性而不是transform
        if (avatarConfig && avatarConfig.transform) {
          const transform = avatarConfig.transform;

          // 应用安全限制
          const safeScale = Math.max(0.1, Math.min(5, transform.scale || 1));
          const safeX = Math.max(-200, Math.min(200, transform.translateX || 0));
          const safeY = Math.max(-200, Math.min(200, transform.translateY || 0));
          const safeRotation = (transform.rotate || 0) % 360;

          // 计算背景尺寸和位置
          const backgroundSize = `${safeScale * 100}%`;
          // 修正位移计算：位移应该与缩放成反比，并且需要更大的系数
          const backgroundPositionX = `${50 - safeX * 0.5}%`; // 修正位移方向和幅度
          const backgroundPositionY = `${50 - safeY * 0.5}%`;

          css['background-size'] = backgroundSize;
          css['background-position'] = `${backgroundPositionX} ${backgroundPositionY}`;
          css['background-repeat'] = 'no-repeat';

          // 如果有旋转，使用伪元素或者保持简单的背景方式
          if (safeRotation !== 0) {
            // 对于旋转，我们仍然需要使用transform，但只应用到背景
            css['transform'] = `rotate(${safeRotation}deg)`;
            css['transform-origin'] = 'center center';
          }

          // 只在第一个元素时输出调试信息，避免重复
          if (index === 0) {
            console.log('🎨 应用用户头像变换:', {
              scale: safeScale,
              translate: { x: safeX, y: safeY },
              rotate: safeRotation,
              backgroundSize,
              backgroundPosition: `${backgroundPositionX} ${backgroundPositionY}`,
              elementCount: $elements.length,
            });
          }
        } else {
          // 默认样式
          css['background-size'] = 'cover';
          css['background-position'] = 'center';
        }

        $element.css(css).text('');
      });
    },

    // 更新用户名显示
    updateUserName() {
      const selectors = [
        CONFIG.SELECTORS.USER_NAME,
        `.qq-app-container ${CONFIG.SELECTORS.USER_NAME}`,
        `${CONFIG.SELECTORS.PHONE_INTERFACE} .qq-app-container ${CONFIG.SELECTORS.USER_NAME}`,
      ];

      selectors.forEach(selector => {
        $(selector).text(this.userData.name);
      });
    },

    // 更新用户头像显示
    updateUserAvatar() {
      const $userAvatarElements = this.getUserAvatarElements();

      if (this.userData.avatar?.trim()) {
        this.setUserAvatarImage($userAvatarElements);
      } else {
        this.setUserAvatarDefault($userAvatarElements);
      }
    },

    // 获取所有用户头像元素
    getUserAvatarElements() {
      const selectors = [
        CONFIG.SELECTORS.USER_AVATAR,
        `.qq-app-container ${CONFIG.SELECTORS.USER_AVATAR}`,
        `${CONFIG.SELECTORS.PHONE_INTERFACE} ${CONFIG.SELECTORS.USER_AVATAR}`,
        `${CONFIG.SELECTORS.PHONE_INTERFACE} .qq-app-container ${CONFIG.SELECTORS.USER_AVATAR}`,
      ];

      return $(selectors.join(', '));
    },

    // 设置用户头像图片
    setUserAvatarImage($elements) {
      $elements.each((index, element) => {
        const $element = $(element);
        $element
          .css({
            'background-image': `url(${this.userData.avatar})`,
            'background-size': 'cover',
            'background-position': 'center',
            'background-color': 'transparent',
            color: 'transparent',
            'font-size': '0',
          })
          .text('');
      });
    },

    // 设置用户头像默认样式
    setUserAvatarDefault($elements) {
      $elements.each((index, element) => {
        const $element = $(element);
        $element
          .css({
            'background-image': 'none',
            'background-color': '#f0f0f0',
            color: '#666',
            'font-size': '16px',
            border: '2px solid #ddd',
          })
          .text(this.userData.name.charAt(0));
      });
    },

    // 设置用户信息
    setUserData(name, avatar) {
      this.userData.name = name;
      this.userData.avatar = avatar;
      this.updateUserDisplay();
      this.updateUserInfoInChat(name, avatar);
    },

    // 在聊天记录中更新用户信息
    updateUserInfoInChat(name, avatar) {
      try {
        const lastUserMessage = this.getLastUserMessage();
        if (!lastUserMessage) return;

        const messageTextElement = lastUserMessage.querySelector('.mes_text');
        if (!messageTextElement) return;

        let messageText = messageTextElement.textContent || '';
        messageText = this.updateUserInfoInText(messageText, name, avatar);

        if (avatar) {
          messageText = this.updateUserAvatarInText(messageText, avatar);
        }

        this.modifyChatMessage(lastUserMessage, messageText);
      } catch (error) {
        console.error('更新聊天记录中的用户信息失败:', error);
      }
    },

    // 获取最后一条用户消息
    getLastUserMessage() {
      const userMessages = document.querySelectorAll('.mes[is_user="true"]');
      return userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
    },

    // 更新文本中的用户信息
    updateUserInfoInText(text, name, avatar) {
      const regex = /\[用户信息\|[^|]+\|[^\]]*\]/g;
      const replacement = `[用户信息|${name}|${avatar}]`;

      return regex.test(text) ? text.replace(regex, replacement) : text + ` ${replacement}`;
    },

    // 更新文本中的用户头像
    updateUserAvatarInText(text, avatar) {
      const regex = /\[用户头像\|[^\]]+\]/g;
      const replacement = `[用户头像|${avatar}]`;

      return regex.test(text) ? text.replace(regex, replacement) : text + ` ${replacement}`;
    },

    // 设置头像URL
    setAvatarUrl(qqNumber, avatarUrl) {
      this.avatarData[qqNumber] = avatarUrl;
      this.updateAvatarInChat(qqNumber, avatarUrl);
    },

    // 从已加载的数据更新所有头像显示
    updateAllAvatarDisplaysFromData() {
      console.log('🔄 [数据应用] 从已加载数据更新所有头像显示');
      console.log('🔍 [数据应用] 当前avatarData:', this.avatarData);
      console.log('🔍 [数据应用] 当前userData:', this.userData);

      // 更新所有联系人头像
      Object.keys(this.avatarData).forEach(key => {
        if (key.endsWith('_config')) {
          const qqNumber = key.replace('_config', '');
          const avatarConfig = this.avatarData[key];
          const avatarUrl = this.avatarData[qqNumber];

          if (avatarUrl && avatarConfig) {
            console.log(`🔄 [数据应用] 更新联系人 ${qqNumber} 的头像:`, {
              avatarConfig,
              transform: avatarConfig.transform,
            });
            this.updateAllAvatarDisplaysEnhanced(qqNumber, avatarConfig);
          }
        }
      });

      // 更新用户头像
      if (this.userData.avatarConfig) {
        console.log('🔄 [数据应用] 更新用户头像:', {
          avatarConfig: this.userData.avatarConfig,
          transform: this.userData.avatarConfig.transform,
        });
        this.updateUserAvatarEnhanced();
      } else {
        console.log('⚠️ [数据应用] 用户头像配置不存在');
      }

      // 更新好友管理界面中的头像显示
      if (window.QQDataManager && typeof window.QQDataManager.updateFriendManagerAvatars === 'function') {
        console.log('🔄 [数据应用] 更新好友管理界面头像');
        window.QQDataManager.updateFriendManagerAvatars();
      }
    },

    // 在聊天记录中更新头像信息
    updateAvatarInChat(qqNumber, avatarUrl) {
      try {
        const lastUserMessage = this.getLastUserMessage();
        if (!lastUserMessage) return;

        const messageTextElement = lastUserMessage.querySelector('.mes_text');
        if (!messageTextElement) return;

        let messageText = messageTextElement.textContent || '';
        messageText = this.updateAvatarInText(messageText, qqNumber, avatarUrl);

        this.modifyChatMessage(lastUserMessage, messageText);
      } catch (error) {
        console.error('更新聊天记录中的头像信息失败:', error);
      }
    },

    // 更新文本中的头像信息
    updateAvatarInText(text, qqNumber, avatarUrl) {
      const regex = new RegExp(`\\[头像\\|${qqNumber}\\|[^\\]]+\\]`, 'g');
      const replacement = `[头像|${qqNumber}|${avatarUrl}]`;

      return regex.test(text) ? text.replace(regex, replacement) : text + ` ${replacement}`;
    },

    // 修改聊天消息
    modifyChatMessage(messageElement, newContent) {
      try {
        const messageId = messageElement.getAttribute('mesid');
        if (!messageId) {
          console.error('❌ 消息元素缺少mesid属性');
          return;
        }

        const editButton = messageElement.querySelector('.mes_edit');
        if (!editButton) {
          console.error('❌ 未找到编辑按钮');
          return;
        }

        console.log('📝 开始修改聊天消息:', { messageId, newContent });
        editButton.click();

        setTimeout(() => {
          this.updateMessageContent(messageElement, newContent);
        }, CONFIG.DELAYS.EDIT_MESSAGE);
      } catch (error) {
        console.error('修改消息时出错:', error);
      }
    },

    // 更新消息内容
    updateMessageContent(messageElement, newContent) {
      const editArea = messageElement.querySelector('.edit_textarea');
      if (!editArea) {
        console.error('❌ 未找到编辑文本区域');
        return;
      }

      console.log('📝 更新消息内容:', newContent);
      editArea.value = newContent;
      editArea.dispatchEvent(new Event('input', { bubbles: true }));

      setTimeout(() => {
        const editDoneButton = messageElement.querySelector('.mes_edit_done');
        if (editDoneButton) {
          console.log('✅ 点击完成编辑按钮');
          editDoneButton.click();

          // 延迟验证保存结果
          setTimeout(() => {
            this.verifyMessageSaved(messageElement, newContent);
          }, 1000);
        } else {
          console.error('❌ 未找到完成编辑按钮');
        }
      }, CONFIG.DELAYS.EDIT_MESSAGE);
    },

    // 验证消息是否已保存
    verifyMessageSaved(messageElement, expectedContent) {
      try {
        const messageTextElement = messageElement.querySelector('.mes_text');
        if (messageTextElement) {
          const actualContent = messageTextElement.textContent || '';
          if (actualContent.includes('[头像增强|') || actualContent.includes('[用户头像增强|')) {
            console.log('✅ 头像数据已成功保存到聊天记录');
          } else {
            console.warn('⚠️ 头像数据可能未正确保存到聊天记录');
            console.log('期望内容包含:', expectedContent.substring(0, 100) + '...');
            console.log('实际内容:', actualContent.substring(0, 100) + '...');
          }
        }
      } catch (error) {
        console.error('验证消息保存状态时出错:', error);
      }
    },

    // 显示用户头像设置弹窗
    showUserAvatarDialog: function () {
      const currentAvatar = this.userData.avatar;
      const currentName = this.userData.name;

      const $userAvatarDialog = $(`
                <div id="user_avatar_dialog" style="display: flex; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90vw; height: 90vh;z-index: 1000; flex-direction: column;border-radius: 10px;overflow: hidden;z-index:10002">
                    <div style="background: #2c2c2c; color: white; width: 90%; max-width: 400px; height: 90%; margin: auto; border-radius: 10px; display: flex; flex-direction: column;padding:30px">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h3 style="margin: 0;">设置用户信息</h3>
                            <div id="close_user_avatar_dialog" style="cursor: pointer; font-size: 20px;">×</div>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; color: #ccc;">用户名:</label>
                            <input type="text" id="user_name_input" placeholder="请输入用户名" value="${currentName}" style="width: 100%; padding: 10px; border: 1px solid #555; background: #444; color: white; border-radius: 4px; box-sizing: border-box;">
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; color: #ccc;">头像链接:</label>
                            <input type="text" id="user_avatar_url_input" placeholder="请输入头像图片链接" value="${currentAvatar}" style="width: 100%; padding: 10px; border: 1px solid #555; background: #444; color: white; border-radius: 4px; box-sizing: border-box;">
                        </div>

                        <div style="margin-bottom: 15px;">
                            <div style="color: #ccc; margin-bottom: 8px;">预览:</div>
                            <div id="user_avatar_preview" style="width: 80px; height: 80px; border: 2px solid #555; border-radius: 50%; background: #444; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                ${
                                  currentAvatar
                                    ? `<img src="${currentAvatar}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.parentElement.innerHTML='无效图片';">`
                                    : currentName.charAt(0)
                                }
                            </div>
                        </div>

                        <div style="text-align: center;">
                            <button id="save_user_info_btn" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">保存</button>
                            <button id="cancel_user_info_btn" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">取消</button>
                        </div>
                    </div>
                </div>
            `);

      $('body').append($userAvatarDialog);

      // 绑定预览事件
      $('#user_avatar_url_input').on('input', function () {
        const url = String($(this).val() || '').trim();
        const name = String($('#user_name_input').val() || '').trim();
        const $preview = $('#user_avatar_preview');

        if (url) {
          $preview.html(
            `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.parentElement.innerHTML='无效图片';">`,
          );
        } else {
          $preview.html(name.charAt(0) || '用');
        }
      });

      // 绑定用户名输入事件
      $('#user_name_input').on('input', function () {
        const name = String($(this).val() || '').trim();
        const url = String($('#user_avatar_url_input').val() || '').trim();
        const $preview = $('#user_avatar_preview');

        if (!url) {
          $preview.html(name.charAt(0) || '用');
        }
      });

      // 绑定按钮事件
      $('#close_user_avatar_dialog, #cancel_user_info_btn').on('click', function () {
        $('#user_avatar_dialog').remove();
      });

      $('#save_user_info_btn').on('click', () => {
        const userName = String($('#user_name_input').val() || '').trim();
        const avatarUrl = String($('#user_avatar_url_input').val() || '').trim();

        if (userName) {
          this.setUserData(userName, avatarUrl);
          alert('用户信息设置成功！信息已保存到聊天记录中');
        } else {
          alert('请输入有效的用户名');
        }
        $('#user_avatar_dialog').remove();
      });
    },

    // 显示头像设置弹窗
    showAvatarDialog: function (qqNumber, contactName) {
      const currentAvatar = this.getAvatarUrl(qqNumber);

      const $avatarDialog = $(`
                <div id="avatar_dialog" style="display: flex; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90vw; height: 90vh;z-index: 1000; flex-direction: column;border-radius: 10px;overflow: hidden;z-index:10002">
                    <div style="background: #2c2c2c; color: white; width: 90%; max-width: 400px; height: 90%; margin: auto; border-radius: 10px; display: flex; flex-direction: column;padding:30px">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h3 style="margin: 0;">设置头像</h3>
                            <div id="close_avatar_dialog" style="cursor: pointer; font-size: 20px;">×</div>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <div style="color: #ccc; margin-bottom: 8px;">联系人: ${contactName}</div>
                            <div style="color: #ccc; margin-bottom: 8px;">QQ号: ${qqNumber}</div>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; color: #ccc;">头像链接:</label>
                            <input type="text" id="avatar_url_input" placeholder="请输入头像图片链接" value="${currentAvatar}" style="width: 100%; padding: 10px; border: 1px solid #555; background: #444; color: white; border-radius: 4px; box-sizing: border-box;">
                        </div>

                        <div style="margin-bottom: 15px;">
                            <div style="color: #ccc; margin-bottom: 8px;">预览:</div>
                            <div id="avatar_preview" style="width: 80px; height: 80px; border: 2px solid #555; border-radius: 50%; background: #444; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                ${
                                  currentAvatar
                                    ? `<img src="${currentAvatar}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.parentElement.innerHTML='无效图片';">`
                                    : '暂无头像'
                                }
                            </div>
                        </div>

                        <div style="text-align: center;">
                            <button id="save_avatar_btn" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">保存</button>
                            <button id="cancel_avatar_btn" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">取消</button>
                        </div>
                    </div>
                </div>
            `);

      $('body').append($avatarDialog);

      // 绑定预览事件
      $('#avatar_url_input').on('input', function () {
        const url = String($(this).val() || '').trim();
        const $preview = $('#avatar_preview');

        if (url) {
          $preview.html(
            `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.parentElement.innerHTML='无效图片';">`,
          );
        } else {
          $preview.html('暂无头像');
        }
      });

      // 绑定按钮事件
      $('#close_avatar_dialog, #cancel_avatar_btn').on('click', function () {
        $('#avatar_dialog').remove();
      });

      $('#save_avatar_btn').on('click', () => {
        const avatarUrl = String($('#avatar_url_input').val() || '').trim();
        if (avatarUrl) {
          this.setAvatarUrl(qqNumber, avatarUrl);

          // 立即更新内存中的头像数据
          this.avatarData[qqNumber] = avatarUrl;

          // 更新页面上所有相关的头像显示
          this.updateAllAvatarDisplaysEnhanced(qqNumber, avatarUrl);

          alert('头像设置成功！头像信息已保存到聊天记录中');
        } else {
          alert('请输入有效的头像链接');
        }
        $('#avatar_dialog').remove();
      });
    },

    // 更新时间显示
    updateTime() {
      const now = new Date();
      const timeString =
        now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

      $('.qq-status-time, .chat-status-time').text(timeString);
    },

    // 启动时间更新功能
    startTimeUpdate() {
      this.updateTime();

      const now = new Date();
      const delay = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());

      setTimeout(() => {
        this.updateTime();
        setInterval(() => this.updateTime(), 60000);
      }, delay);
    },

    // 创建界面
    createInterface: function () {
      // 启动时间更新
      this.startTimeUpdate();

      // 延迟检查并移动已存在的chat_history_btn
      const moveButton = () => {
        const $existingBtn = $('#chat_history_btn');
        if ($existingBtn.length > 0) {
          console.log('找到现有的chat_history_btn，准备移动到body');

          // 从原位置移除并添加到body
          $existingBtn.detach().appendTo('body');

          // 调整样式为浮动按钮
          $existingBtn.css({
            position: 'absolute',
            bottom: '138px',
            left: '10px',
            'z-index': '999',
            width: '32px',
            height: '32px',
            'border-radius': '50%',
            'z-index': '1000',
            cursor: 'pointer',
            margin: '0',
            'box-shadow': '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
          });

          console.log('已将chat_history_btn移动到body并调整为浮动按钮');
          return true;
        } else {
          console.warn('未找到现有的chat_history_btn元素');
          return false;
        }
      };

      // 立即尝试移动按钮
      if (!moveButton()) {
        // 如果没找到，延迟重试
        console.log('按钮未找到，将在2秒后重试...');
        setTimeout(() => {
          if (!moveButton()) {
            console.log('按钮仍未找到，将在5秒后再次重试...');
            setTimeout(() => {
              moveButton();
            }, 5000);
          }
        }, 2000);
      }

      const $historyDialog = $(`
                <div id="chat_history_dialog" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90vw; height: 90vh;z-index: 1000; flex-direction: column;border-radius: 10px;overflow: hidden;">
                    <div style="background: #ffffff; color: black; width: 90%; max-width: 600px; height: 90%; margin: auto; border-radius: 10px; display: flex; flex-direction: column;">
                        <!-- 状态栏 -->
                        <div class="qq-status-bar">
                            <div class="qq-status-time">7:13</div>
                            <div class="qq-status-icons">
                                <span class="qq-signal-icon">📶</span>
                                <span class="qq-battery-icon">🔋</span>
                            </div>
                        </div>

                        <div class="dialog-head">
                            <div class="user-info-section">
                                <div class="user-avatar-wrapper">
                                    <div class="user-avatar" id="user_avatar" title="点击设置用户头像">
                                        用户
                                    </div>
                                </div>
                                <div class="user-details">
                                    <h3 id="user_name">用户</h3>
                                    <div><span class="hgd-show"></span></div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <button id="create_group_btn">+</button>
                                <button class="home-btn" id="home_btn_main" title="返回手机首页">🏠︎</button>
                            </div>
                        </div>

                        <div id="history_content" style="flex-grow: 1; overflow-y: auto; padding: 15px;"></div>
                    </div>
                </div>
            `);

      // 创建群组选择弹窗
      const $groupCreateDialog = $(`
                <div id="group_create_dialog" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1000; flex-direction: column;">
                    <div style="background: #2c2c2c; color: white; width: 90%; max-width: 500px; height: 80%; margin: auto; border-radius: 10px; display: flex; flex-direction: column;">
                        <div class="dialog-head" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #555;">
                            <h3 style="margin: 0;">创建QQ群</h3>
                            <div id="close_group_create_btn" style="cursor: pointer; font-size: 20px;">×</div>
                        </div>

                        <div style="padding: 20px; flex-grow: 1; overflow-y: auto;">
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #ccc;">群名称:</label>
                                <input type="text" id="group_name_input" placeholder="请输入群名称" style="width: 100%; padding: 10px; border: 1px solid #555; background: #444; color: white; border-radius: 4px; box-sizing: border-box;">
                            </div>

                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #ccc;">选择成员:</label>
                                <div id="qq_contacts_list" style="max-height: 150px; overflow-y: auto; border: 1px solid #555; background: #444; border-radius: 4px; padding: 10px;">
                                    <!-- QQ联系人列表将在这里动态加载 -->
                                </div>
                            </div>

                            <div style="text-align: center; margin-top: 20px;">
                                <button id="confirm_create_group_btn" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">确认创建</button>
                                <button id="cancel_create_group_btn" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">取消</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);

      // 创建添加群员弹窗
      const $addMemberDialog = $(`
                <div id="add_member_dialog" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1001; flex-direction: column;">
                    <div style="background: #2c2c2c; color: white; width: 90%; max-width: 500px; height: 80%; margin: auto; border-radius: 10px; display: flex; flex-direction: column;">
                        <div class="dialog-head" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #555;">
                            <h3 style="margin: 0;">添加群员</h3>
                            <div id="close_add_member_btn" style="cursor: pointer; font-size: 20px;">×</div>
                        </div>

                        <div style="padding: 20px; flex-grow: 1; overflow-y: auto;">
                            <div style="margin-bottom: 15px;">
                                <div style="color: #ccc; margin-bottom: 8px;">群名称: <span id="add_member_group_name"></span></div>
                                <div style="color: #ccc; margin-bottom: 8px;">群号: <span id="add_member_group_id"></span></div>
                            </div>

                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #ccc;">选择要添加的成员:</label>
                                <div id="add_member_contacts_list" style="max-height: 200px; overflow-y: auto; border: 1px solid #555; background: #444; border-radius: 4px; padding: 10px;">
                                    <!-- QQ联系人列表将在这里动态加载 -->
                                </div>
                            </div>

                            <div style="text-align: center; margin-top: 20px;">
                                <button id="confirm_add_member_btn" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">确认添加</button>
                                <button id="cancel_add_member_btn" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">取消</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);

      $('body').append($historyDialog);
      $('body').append($groupCreateDialog);
      $('body').append($addMemberDialog);
    },

    // 绑定事件
    bindEvents: function () {
      const self = this;

      // QQ消息按钮点击事件
      $('#chat_history_btn').on('click', function () {
        self.show();
      });

      // 小房子按钮点击事件 - 返回手机首页 (主QQ界面)
      // 使用 event delegation for dynamically added elements if needed, but this one is static
      $(document).on('click', '#home_btn_main', function (e) {
        console.log('点击了QQ主页的小房子按钮，返回手机首页');

        // 阻止事件冒泡，避免被phone-interface的点击外部逻辑拦截
        e.stopPropagation();
        e.preventDefault();

        // 隐藏QQ应用
        self.hide();

        // 显示手机界面
        if (window.PhoneInterface && typeof window.PhoneInterface.show === 'function') {
          window.PhoneInterface.show(); // This will show phone home and remove qq-content mode
        } else {
          // 备用方案：直接显示手机界面
          $('#phone_interface').removeClass('show-qq-app-content').addClass('show');
          console.log('使用备用方案显示手机界面');
        }
      });

      // 创建群组按钮事件 - 修改为调用QQDataManager
      $(document).on('click', '#create_group_btn', function (e) {
        console.log('点击了创建群组按钮，显示好友群组管理页面');
        e.stopPropagation();
        e.preventDefault();

        // 详细调试信息
        console.log('QQDataManager 检查:');
        console.log('  window.QQDataManager 存在:', !!window.QQDataManager);
        console.log('  window["QQDataManager"] 存在:', !!window['QQDataManager']);
        console.log(
          '  showFriendManager 方法存在:',
          window.QQDataManager ? typeof window.QQDataManager.showFriendManager : 'N/A',
        );
        console.log('  QQDataManager 对象:', window.QQDataManager);

        // 调用QQDataManager显示好友群组管理页面
        if (window.QQDataManager && typeof window.QQDataManager.showFriendManager === 'function') {
          console.log('调用 QQDataManager.showFriendManager()');
          window.QQDataManager.showFriendManager();
        } else {
          console.error('QQDataManager 不可用或 showFriendManager 方法不存在');

          // 备用方案：显示原有的群组创建弹窗
          console.log('使用备用方案：显示原有群组创建弹窗');
          self.ensureDialogsExist();
          self.showGroupCreateDialog();
        }
      });

      // 关闭群组创建弹窗 - 使用事件委托
      $(document).on('click', '#close_group_create_btn, #cancel_create_group_btn', function () {
        $('#group_create_dialog').hide();
      });

      // 确认创建群组 - 使用事件委托
      $(document).on('click', '#confirm_create_group_btn', function () {
        self.createGroup();
      });

      // 添加群员相关事件
      // 关闭添加群员弹窗 - 使用事件委托
      $(document).on('click', '#close_add_member_btn, #cancel_add_member_btn', function () {
        $('#add_member_dialog').hide();
      });

      // 确认添加群员 - 使用事件委托
      $(document).on('click', '#confirm_add_member_btn', function () {
        self.addGroupMembers();
      });

      this.addClickEventsToQQHao();
      this.addClickEventsToBack();
      this.addClickEventsToQQGroups();
      this.addClickEventsToUserAvatar();
    },

    // 显示QQ应用
    show: function () {
      console.log('🚀 正在加载QQ消息应用...');

      // 检查是否在手机界面模式下
      const isInPhoneMode = $('#phone_interface').hasClass('show-qq-app-content');
      console.log('📱 手机界面模式:', isInPhoneMode);

      // 先加载消息内容到原始对话框
      this.loadMessages()
        .then(() => {
          console.log('✅ 消息加载完成');

          // 确保原始对话框有内容并且可见（用于克隆）
          $('#chat_history_dialog').css('display', 'flex');

          // 检查原始对话框内容
          const $originalDialog = $('#chat_history_dialog');
          const $historyContent = $originalDialog.find('#history_content');
          console.log('📋 原始对话框存在:', $originalDialog.length > 0);
          console.log('📋 历史内容容器存在:', $historyContent.length > 0);
          console.log('📋 历史内容HTML长度:', $historyContent.html()?.length || 0);

          if (isInPhoneMode) {
            // 在手机界面内显示QQ应用
            setTimeout(() => {
              console.log('🔄 开始在手机界面内显示QQ应用');
              this.showInPhoneInterface();
              // 克隆完成后隐藏原始对话框
              $('#chat_history_dialog').hide();
            }, 100); // 增加延迟确保内容完全加载
          }

          // 更新时间显示
          this.updateTime();

          this.updateHgdShow();
          setTimeout(() => {
            const $historyContent = this.getCurrentHistoryContent();
            if ($historyContent.length > 0 && $historyContent[0]) {
              $historyContent.scrollTop($historyContent[0].scrollHeight);
            }
          }, 200); // 增加延迟以确保内容克隆完成
        })
        .catch(error => {
          console.error('❌ 加载消息失败:', error);
        });
    },

    // 显示QQ应用主界面
    showMainInterface: function () {
      console.log('🏠 显示QQ应用主界面');

      // 隐藏所有聊天页面
      $('.chat-page').removeClass('show');

      // 显示主页装饰栏
      this.showMainPageDecorations();

      // 显示主列表中的所有包装器
      $('#history_content > .qq-contact-wrapper').show();
      $('#history_content > .qq-group-wrapper').show();

      // 确保QQ应用可见
      const isInPhoneMode = $('#phone_interface').hasClass('show-qq-app-content');
      if (isInPhoneMode) {
        // 在手机界面内，确保QQ容器可见
        const $qqContainer = $('#phone_interface .qq-app-container');
        if ($qqContainer.length) {
          $qqContainer.find('> div:not(.qq-avatar-editor-page)').show();
        }
      } else {
        // 独立模式，确保对话框可见
        $('#chat_history_dialog').show();
      }

      // 每次显示主界面时重新加载头像数据
      console.log('🔄 主界面显示时重新加载头像数据');
      setTimeout(() => {
        this.loadAvatarDataEnhanced();
      }, 100);

      console.log('✅ QQ应用主界面已显示');
    },

    // 获取当前活动的历史内容容器
    getCurrentHistoryContent: function () {
      // 如果在手机界面模式下，从容器中查找
      if ($('#phone_interface').hasClass('show-qq-app-content')) {
        return $('#phone_interface .qq-app-container #history_content');
      } else {
        // 否则从原始对话框中查找
        return $('#chat_history_dialog #history_content');
      }
    },

    // 在手机界面内显示QQ应用
    showInPhoneInterface: function () {
      console.log('📱 开始在手机界面内显示QQ应用');

      const $qqContainer = $('#phone_interface .qq-app-container');
      console.log('📦 QQ容器存在:', $qqContainer.length > 0);

      if ($qqContainer.length === 0) {
        console.error('❌ QQ应用容器未找到');
        return;
      }

      // 确保原始对话框存在且有内容
      const $originalDialog = $('#chat_history_dialog');
      console.log('🏠 原始对话框存在:', $originalDialog.length > 0);

      if ($originalDialog.length === 0) {
        console.error('❌ 原始QQ对话框不存在');
        return;
      }

      // 查找原始对话框的内容容器（第一个div子元素）
      const $originalContent = $originalDialog.children().first();
      console.log('📄 原始内容存在:', $originalContent.length > 0);
      console.log('📄 原始内容HTML长度:', $originalContent.html()?.length || 0);

      if ($originalContent.length === 0) {
        console.error('❌ 原始QQ对话框内容为空');
        return;
      }

      // 检查原始内容中的历史容器
      const $originalHistoryContent = $originalContent.find('#history_content');
      console.log('📝 原始历史内容存在:', $originalHistoryContent.length > 0);
      console.log('📝 原始历史内容HTML长度:', $originalHistoryContent.html()?.length || 0);

      // 克隆内容而不是移动，避免破坏原始结构
      console.log('🔄 开始克隆内容...');
      const $clonedContent = $originalContent.clone(true);
      $qqContainer.empty().append($clonedContent);

      // 确保克隆的内容具有正确的样式
      $qqContainer.find('> div').css({
        width: '100%',
        height: '100%',
        background: '#ffffff',
        'border-radius': '50px',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        'flex-direction': 'column',
      });

      // 检查克隆后的结果
      const $clonedHistoryContent = $qqContainer.find('#history_content');
      console.log('✅ QQ应用内容已克隆到手机界面容器内');
      console.log('📦 容器内容:', $qqContainer.children().length, '个元素');
      console.log('📝 克隆的历史内容:', $clonedHistoryContent.length, '个');
      console.log('📝 克隆的历史内容HTML长度:', $clonedHistoryContent.html()?.length || 0);

      // 如果克隆的历史内容为空，创建测试内容
      if ($clonedHistoryContent.html()?.length === 0) {
        console.warn('⚠️ 克隆的历史内容为空，创建测试内容');
        console.log('🔍 原始对话框HTML:', $originalDialog.html().substring(0, 500) + '...');

        // 创建测试内容
        const testContent = `
          <div style="padding: 20px; color: #333;">
            <h3>QQ消息测试</h3>
            <div style="margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 8px;">
              <div style="font-weight: bold;">测试联系人</div>
              <div style="color: #666; font-size: 14px;">这是一条测试消息</div>
            </div>
            <div style="margin: 10px 0; padding: 10px; background: #e3f2fd; border-radius: 8px;">
              <div style="font-weight: bold;">另一个联系人</div>
              <div style="color: #666; font-size: 14px;">这是另一条测试消息</div>
            </div>
          </div>
        `;

        if ($clonedHistoryContent.length > 0) {
          $clonedHistoryContent.html(testContent);
          console.log('✅ 已添加测试内容到克隆的历史容器');
        } else {
          // 如果连历史容器都没有，直接在主容器中添加
          $qqContainer.html(testContent);
          console.log('✅ 已添加测试内容到主容器');
        }
      }

      // 确保用户头像正确显示
      setTimeout(() => {
        this.updateUserDisplay();
      }, 300);
    },

    // 隐藏QQ应用
    hide: function () {
      console.log('正在隐藏QQ应用...');

      // 清空手机界面容器（因为我们使用克隆，不需要移回）
      const $qqContainer = $('#phone_interface .qq-app-container');
      $qqContainer.empty();

      // 隐藏原始对话框
      $('#chat_history_dialog').hide();

      // 隐藏聊天页面
      $('.chat-page').removeClass('show');

      // 恢复QQ主页装饰栏显示
      this.showMainPageDecorations();

      console.log('QQ应用已隐藏');
    },

    // 加载消息
    loadMessages: async function () {
      try {
        console.log('📊 开始从聊天记录抓取数据...');

        // 每次加载消息时，重新从聊天记录中读取最新的头像数据和用户数据
        this.loadAvatarDataEnhanced();
        this.loadUserData();

        // 确保原始对话框存在
        let $originalDialog = $('#chat_history_dialog');
        console.log('🏠 原始对话框存在:', $originalDialog.length > 0);

        if ($originalDialog.length === 0) {
          console.error('❌ 原始对话框不存在，无法加载消息');
          return;
        }

        // 确保我们总是在原始对话框中操作，而不是在手机界面容器中
        let $historyContent = $originalDialog.find('#history_content');
        console.log('📝 历史内容容器存在:', $historyContent.length > 0);

        if ($historyContent.length === 0) {
          // 如果原始对话框中没有 history_content，创建一个
          console.log('🔧 创建新的历史内容容器');
          $originalDialog
            .find('> div')
            .append('<div id="history_content" style="flex-grow: 1; overflow-y: auto; padding: 15px;"></div>');
          $historyContent = $originalDialog.find('#history_content');
        }

        console.log('🧹 清空历史内容容器');
        $historyContent.empty();

        console.log('🔍 开始提取数据...');
        const contacts = await window['HQDataExtractor'].extractQQContacts();
        const extractedGroups = await window['HQDataExtractor'].extractQQGroups();
        const messages = await window['HQDataExtractor'].extractQQMessages();

        console.log(`📈 获取到${contacts.length}个联系人，${extractedGroups.length}个群组，${messages.length}条消息`);

        // 创建一个从 senderName 到 qqNumber 的映射，方便查找
        const senderNameToQqNumberMap = {};
        contacts.forEach(contact => {
          if (contact.name && contact.number) {
            senderNameToQqNumberMap[contact.name] = contact.number;
          }
        });
        console.log('[AvatarDebug] Created senderNameToQqNumberMap:', senderNameToQqNumberMap);

        // 创建联系人HTML - 使用新的包装容器结构
        contacts.forEach(contact => {
          const contactMessages = messages.filter(msg => msg.qqNumber === contact.number);
          const lastMessage = contactMessages.length > 0 ? contactMessages[contactMessages.length - 1] : null;
          const lastMessageText = lastMessage ? lastMessage.content : '暂无消息';
          const lastMessageTime = lastMessage ? lastMessage.time : '';

          // 获取头像URL
          const avatarUrl = this.getAvatarUrl(contact.number);
          const avatarStyle = avatarUrl
            ? `background-image: url(${avatarUrl}); background-size: cover; background-position: center;`
            : 'background: #666; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;';

          // 创建外层包装容器 - v0风格联系人项
          const $contactWrapper = $(`
                        <div class="qq-contact-wrapper" data-qq-number="${contact.number}">
                            <div class="contact-summary">
                                <div class="contact-avatar-wrapper">
                                    <div class="custom-avatar custom-avatar-${contact.number}"
                                         style="${avatarStyle}"
                                         data-qq-number="${contact.number}"
                                         data-contact-name="${contact.name}"
                                         title="点击设置头像">
                                         ${avatarUrl ? '' : contact.name.charAt(0)}
                                    </div>
                                </div>
                                <div class="contact-info">
                                    <div class="contact-name">
                                        <span class="contact-name-text">${contact.name}</span>
                                        <span class="contact-time">${lastMessageTime}</span>
                                    </div>
                                    <div class="last-message">${lastMessageText}</div>
                                </div>
                            </div>

                            <!-- 隐藏的聊天页面 - v0风格 -->
                            <div class="chat-page">
                                <!-- 聊天页面状态栏 -->
                                <div class="chat-status-bar">
                                    <div class="chat-status-time qq-status-time">7:13</div>
                                    <div class="chat-status-icons qq-status-icons">
                                        <span class="chat-signal-icon qq-signal-icon">📶</span>
                                        <span class="chat-battery-icon qq-battery-icon">🔋</span>
                                    </div>
                                </div>

                                <div class="chat-header">
                                    <button class="back-to-main-list-btn">←</button>
                                    <div class="chat-title">
                                        <div>${contact.name}</div>
                                        <div class="contact-status-qq">QQ: ${contact.number}</div>
                                    </div>
                                    <button class="home-btn chat-home-btn" title="返回手机首页">🏠︎</button>
                                </div>

                                <div class="chat-messages">
                                    <div class="custom-qqhao custom-qqhao-${contact.number}">
                                        <div class="custom-qq-cont custom-qq-cont-${contact.number}"></div>
                                    </div>
                                </div>

                                <div class="chat-input-area">
                                    <input type="text" class="message-input" placeholder="输入消息...">
                                    <button class="send-btn">➤</button>
                                </div>
                            </div>
                        </div>
                    `);

          $historyContent.append($contactWrapper);

          // 将消息添加到内部的容器中 - v0风格消息气泡
          contactMessages.forEach(msg => {
            let messageHtml;
            const messageTime = msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (msg.type === 'sent') {
              // 发送的消息 - v0风格右侧气泡，显示用户头像
              const userAvatarUrl = this.userData.avatar;
              let userAvatarDisplay = '';
              let avatarStyle = '';

              if (userAvatarUrl) {
                userAvatarDisplay = `<img src="${userAvatarUrl}" alt="avatar">`;
                avatarStyle = `background-image: url(${userAvatarUrl}); background-size: cover; background-position: center; background-color: transparent; color: transparent;`;
              } else {
                userAvatarDisplay = this.userData.name.charAt(0);
                avatarStyle = 'background-color: #007bff; color: white;';
              }

              messageHtml = `
                                <div class="custom-message custom-sent">
                                    <div class="message-bubble">
                                        <div>${msg.content}</div>
                                        <div class="message-time">${messageTime}</div>
                                    </div>
                                    <div class="message-avatar sent-avatar" style="${avatarStyle}">${userAvatarDisplay}</div>
                                </div>
                            `;
            } else {
              // 接收的消息 - v0风格左侧气泡
              const contactAvatarUrl = this.getAvatarUrl(contact.number);
              let avatarDisplay = '';
              if (contactAvatarUrl) {
                avatarDisplay = `<img src="${contactAvatarUrl}" alt="avatar">`;
              } else {
                avatarDisplay = contact.name.charAt(0);
              }

              messageHtml = `
                                <div class="custom-message custom-received">
                                    <div class="message-avatar received-avatar" style="${
                                      contactAvatarUrl ? '' : 'background-color: #ccc;'
                                    }">${avatarDisplay}</div>
                                    <div class="message-bubble">
                                        <div>${msg.content}</div>
                                        <div class="message-time">${messageTime}</div>
                                    </div>
                                </div>
                            `;
            }

            $contactWrapper.find(`.custom-qq-cont-${msg.qqNumber}`).append(messageHtml);
          });
        });

        // 创建群组HTML - 使用新的包装容器结构 - v0风格
        extractedGroups.forEach(group => {
          const lastMessage =
            group.messages && group.messages.length > 0 ? group.messages[group.messages.length - 1] : null;
          const lastMessageText = lastMessage ? lastMessage.content : '暂无消息';
          const groupTime = group.timestamp || new Date().toLocaleString();

          // 创建外层包装容器 - v0风格群组项
          const $groupWrapper = $(`
                        <div class="qq-group-wrapper" data-group-id="${group.id}">
                            <div class="group-summary">
                                <div class="contact-avatar-wrapper">
                                    <div class="custom-avatar"
                                         style="background: linear-gradient(135deg, #4A90E2, #357ABD); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: 600;">
                                         ${group.name.charAt(0)}
                                    </div>
                                </div>
                                <div class="group-info">
                                    <div class="group-name">
                                        <span class="group-name-text">${group.name}</span>
                                        <span class="group-time">${groupTime}</span>
                                    </div>
                                    <div class="last-message">${lastMessageText}</div>
                                </div>
                            </div>

                            <!-- 隐藏的聊天页面 - v0风格 -->
                            <div class="chat-page">
                                <!-- 聊天页面状态栏 -->
                                <div class="chat-status-bar">
                                    <div class="chat-status-time qq-status-time">7:13</div>
                                    <div class="chat-status-icons qq-status-icons">
                                        <span class="chat-signal-icon qq-signal-icon">📶</span>
                                        <span class="chat-battery-icon qq-battery-icon">🔋</span>
                                    </div>
                                </div>

                                <div class="chat-header">
                                    <button class="back-to-main-list-btn">←</button>
                                    <div class="chat-title">
                                        <div>${group.name}</div>
                                        <div class="contact-status-qq">群号: ${group.id}</div>
                                    </div>
                                    <button class="add-member-btn" data-group-id="${group.id}" data-group-name="${
            group.name
          }">+</button>
                                    <button class="home-btn chat-home-btn" title="返回手机首页">🏠︎</button>
                                </div>

                                <div class="chat-messages">
                                    <div class="custom-qq-qun custom-qq-qun-${group.id}">
                                        <div class="custom-qun-cont custom-qun-cont-${group.id}"></div>
                                    </div>
                                </div>

                                <div class="chat-input-area">
                                    <input type="text" class="message-input" placeholder="输入消息...">
                                    <button class="send-btn">➤</button>
                                </div>
                            </div>
                        </div>
                    `);

          $historyContent.append($groupWrapper);

          // 将群消息添加到内部的容器中 - v0风格群消息
          if (group.messages && group.messages.length > 0) {
            group.messages.forEach(msg => {
              const senderName = msg.sender || '未知用户';
              const messageTime = msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              // 判断是否为用户发送的消息
              const isUserMessage = msg.isUser || senderName === this.userData.name || senderName === '我';

              if (isUserMessage) {
                // 用户发送的群聊消息 - 显示在右侧
                const userAvatarUrl = this.userData.avatar;
                let userAvatarDisplay = '';
                let avatarStyle = '';

                if (userAvatarUrl) {
                  userAvatarDisplay = `<img src="${userAvatarUrl}" alt="avatar">`;
                  avatarStyle = `background-image: url(${userAvatarUrl}); background-size: cover; background-position: center; background-color: transparent; color: transparent;`;
                } else {
                  userAvatarDisplay = this.userData.name.charAt(0);
                  avatarStyle = 'background-color: #007bff; color: white;';
                }

                let messageHtml = `
                  <div class="custom-message custom-sent group-message">
                      <div class="message-bubble">
                          <div>${msg.content}</div>
                          <div class="message-time">${messageTime}</div>
                      </div>
                      <div class="message-avatar sent-avatar" style="${avatarStyle}">${userAvatarDisplay}</div>
                  </div>
                `;

                $groupWrapper.find(`.custom-qun-cont-${group.id}`).append(messageHtml);
              } else {
                // 其他成员发送的群聊消息 - 显示在左侧
                let senderQQ = msg.senderQQ || msg.qqNumber;

                // 如果 senderQQ 未定义，尝试从 map 中查找
                if (!senderQQ && msg.sender && senderNameToQqNumberMap[msg.sender]) {
                  senderQQ = senderNameToQqNumberMap[msg.sender];
                  // console.log(`[AvatarDebug] Group msg from senderName: "${msg.sender}", mapped to senderQQ: "${senderQQ}" from contacts list.`); // Kept for critical debug
                } else {
                  // console.log(`[AvatarDebug] Group msg from senderName: "${msg.sender}", original senderQQ: "${senderQQ}", msg.qqNumber: "${msg.qqNumber}", msg.senderQQ field: "${msg.senderQQ}"`); // Kept for critical debug
                }

                const senderAvatarUrl = senderQQ ? this.getAvatarUrl(senderQQ) : '';
                // console.log(`[AvatarDebug] For group sender "${msg.sender}" (resolved QQ: ${senderQQ}), got avatar URL: ${senderAvatarUrl}`); // Kept for critical debug
                let groupAvatarDisplay = '';
                let avatarStyle = '';

                if (senderAvatarUrl) {
                  groupAvatarDisplay = `<img src="${senderAvatarUrl}" alt="avatar">`;
                  avatarStyle = `background-image: url(${senderAvatarUrl}); background-size: cover; background-position: center;`;
                } else {
                  groupAvatarDisplay = senderName.charAt(0);
                  avatarStyle = 'background-color: #ddd; color: #666;';
                }

                let messageHtml = `
                  <div class="custom-message custom-received group-message">
                      <div class="message-avatar group-avatar" style="${avatarStyle}">${groupAvatarDisplay}</div>
                      <div class="message-bubble">
                          <div class="sender-name">${senderName}</div>
                          <div>${msg.content}</div>
                          <div class="message-time">${messageTime}</div>
                      </div>
                  </div>
                `;

                $groupWrapper.find(`.custom-qun-cont-${group.id}`).append(messageHtml);
              }
            });
          }
        });

        if (contacts.length === 0 && extractedGroups.length === 0) {
          console.log('未找到任何QQ号或群号');
          $historyContent.html(
            '<p style="text-align: center;color:#aaa;margin-top:10px">你的列表空荡荡的，尝试询问其他人的qq号来增加好友吧</p>',
          );
        }

        // 绑定新的包装容器点击事件
        this.bindWrapperClickEvents();

        // 消息加载完成后，再次更新用户显示
        setTimeout(() => {
          this.updateUserDisplay();
        }, 100);

        console.log('QQ聊天历史加载完成');
      } catch (error) {
        console.error('提取QQ消息时出错:', error);
      }
    },

    // 更新好感度显示
    updateHgdShow: function () {
      $('.hgd-show').text('');
    },

    // QQ联系人点击事件 - 完全移除样式设置
    addClickEventsToQQHao: function () {
      // 使用 document 来确保事件能在手机界面容器内也能工作
      $(document)
        .off('click', '.custom-qqhao')
        .on('click', '.custom-qqhao', function (e) {
          e.stopPropagation();

          // 只处理内容显示，不设置任何样式
          $('.custom-qq-cont').hide();
          $(this).find('.custom-qq-cont').show();

          setTimeout(function () {
            const $cont = $(e.currentTarget).find('.custom-qq-cont');
            if ($cont.length > 0) {
              $cont.scrollTop($cont[0].scrollHeight);
            }
          }, 100);
        });
    },

    // 返回按钮点击事件 - 完全移除样式设置
    addClickEventsToBack: function () {
      $(document)
        .off('click', '.back')
        .on('click', '.back', function (e) {
          e.stopPropagation();

          // 只处理内容隐藏，不设置任何样式
          $('.custom-qq-cont').hide();

          console.log('点击back按钮，返回列表');
        });
    },

    // QQ群组点击事件 - 完全移除样式设置
    addClickEventsToQQGroups: function () {
      $(document)
        .off('click', '.custom-qq-qun')
        .on('click', '.custom-qq-qun', function (e) {
          e.stopPropagation();

          // 只处理内容显示，不设置任何样式
          $('.custom-qq-cont').hide();
          $(this).find('.custom-qun-cont').show();

          setTimeout(function () {
            const $cont = $(e.currentTarget).find('.custom-qun-cont');
            if ($cont.length > 0) {
              $cont.scrollTop($cont[0].scrollHeight);
            }
          }, 100);
        });
    },

    // 显示群组创建弹窗
    showGroupCreateDialog: async function () {
      try {
        console.log('正在加载QQ联系人列表...');

        // 获取所有QQ联系人
        const contacts = await window['HQDataExtractor'].extractQQContacts();
        const $contactsList = $('#qq_contacts_list');
        $contactsList.empty();

        if (contacts.length === 0) {
          $contactsList.html('<p style="text-align: center; color: #aaa; margin: 20px 0;">暂无QQ联系人</p>');
        } else {
          contacts.forEach(contact => {
            const $contactItem = $(`
                            <div class="contact-item" style="padding: 8px; margin: 5px 0; background: #3c3c3c; border-radius: 4px; cursor: pointer; display: flex; align-items: center;">
                                <input type="checkbox" class="contact-checkbox" data-qq-number="${contact.number}" data-qq-name="${contact.name}" style="margin-right: 10px;">
                                <span style="color: white;">${contact.name}</span>
                                <span style="color: #aaa; margin-left: 10px;">QQ: ${contact.number}</span>
                            </div>
                        `);

            $contactsList.append($contactItem);
          });

          // 添加点击事件来切换复选框
          $('.contact-item').on('click', function (e) {
            if (e.target && e.target.tagName !== 'INPUT') {
              const checkbox = $(this).find('.contact-checkbox');
              checkbox.prop('checked', !checkbox.prop('checked'));
            }
          });
        }

        // 清空输入框
        $('#group_name_input').val('');

        // 显示弹窗
        const $dialog = $('#group_create_dialog');
        console.log('弹窗元素查找结果:', $dialog.length);
        if ($dialog.length > 0) {
          $dialog.css('display', 'flex').show();
          console.log('群组创建弹窗已显示');
        } else {
          console.error('群组创建弹窗元素不存在');
          alert('群组创建功能暂时不可用，请稍后重试');
        }
      } catch (error) {
        console.error('加载QQ联系人列表时出错:', error);
      }
    },

    // 创建群组
    createGroup: function () {
      const groupName = String($('#group_name_input').val() || '').trim();
      const selectedContacts = [];

      // 获取选中的联系人
      $('.contact-checkbox:checked').each(function () {
        selectedContacts.push({
          name: $(this).data('qq-name'),
          number: $(this).data('qq-number'),
        });
      });

      // 验证输入
      if (!groupName) {
        alert('请输入群名称');
        return;
      }

      if (selectedContacts.length === 0) {
        alert('请至少选择一个成员');
        return;
      }

      // 生成群号
      const groupId = this.generateGroupId();

      // 创建成员列表字符串 (包括"我")
      const memberNames = ['我', ...selectedContacts.map(c => c.name)];
      const membersString = memberNames.join('、');

      // 在聊天记录中添加群聊创建信息
      this.updateGroupInfoInChat(groupId, groupName, membersString);

      console.log('群聊信息已写入聊天记录:', {
        groupId: groupId,
        groupName: groupName,
        members: membersString,
      });

      // 关闭弹窗
      $('#group_create_dialog').hide();

      // 重新加载消息列表以显示新创建的群组
      this.loadMessages();

      alert(`群组"${groupName}"创建成功！群号: ${groupId}\n信息已记录到聊天历史中`);
    },

    // 在聊天记录中更新或添加群聊信息
    updateGroupInfoInChat: function (groupId, groupName, membersString) {
      try {
        console.log(`正在更新聊天记录中的群聊信息: ${groupId} -> ${groupName} (${membersString})`);

        // 获取最新的消息元素（最后一条用户消息）
        const userMessages = document.querySelectorAll('.mes[is_user="true"]');
        if (userMessages.length === 0) {
          console.log('未找到用户消息，无法更新群聊信息');
          return;
        }

        // 获取最后一条用户消息
        const lastUserMessage = userMessages[userMessages.length - 1];
        const messageTextElement = lastUserMessage.querySelector('.mes_text');

        if (!messageTextElement) {
          console.log('未找到消息文本元素');
          return;
        }

        let messageText = messageTextElement.textContent || '';

        // 创建群聊信息格式: [创建群聊|群号|群名|成员列表]
        const groupInfo = `[创建群聊|${groupId}|${groupName}|${membersString}]`;

        // 检查是否已经存在该群的信息
        const existingGroupRegex = new RegExp(`\\[创建群聊\\|${groupId}\\|[^\\]]+\\]`, 'g');

        if (existingGroupRegex.test(messageText)) {
          // 如果存在，则替换
          messageText = messageText.replace(existingGroupRegex, groupInfo);
        } else {
          // 如果不存在，则在消息末尾添加
          messageText += ` ${groupInfo}`;
        }

        // 修改消息内容
        this.modifyChatMessage(lastUserMessage, messageText);
      } catch (error) {
        console.error('更新聊天记录中的群聊信息失败:', error);
      }
    },

    // 生成群号
    generateGroupId: function () {
      return Math.floor(100000000 + Math.random() * 900000000).toString();
    },

    // 确保弹窗元素存在
    ensureDialogsExist: function () {
      // 检查群组创建弹窗是否存在
      if ($('#group_create_dialog').length === 0) {
        console.log('群组创建弹窗不存在，重新创建...');
        this.createGroupDialogs();
      }

      // 检查添加群员弹窗是否存在
      if ($('#add_member_dialog').length === 0) {
        console.log('添加群员弹窗不存在，重新创建...');
        this.createGroupDialogs();
      }
    },

    // 创建群组相关弹窗
    createGroupDialogs: function () {
      // 移除可能存在的旧弹窗
      $('#group_create_dialog').remove();
      $('#add_member_dialog').remove();

      // 创建群组选择弹窗
      const $groupCreateDialog = $(`
                <div id="group_create_dialog" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1000; flex-direction: column;">
                    <div style="background: #2c2c2c; color: white; width: 90%; max-width: 500px; height: 80%; margin: auto; border-radius: 10px; display: flex; flex-direction: column;">
                        <div class="dialog-head" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #555;">
                            <h3 style="margin: 0;">创建QQ群</h3>
                            <div id="close_group_create_btn" style="cursor: pointer; font-size: 20px;">×</div>
                        </div>

                        <div style="padding: 20px; flex-grow: 1; overflow-y: auto;">
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #ccc;">群名称:</label>
                                <input type="text" id="group_name_input" placeholder="请输入群名称" style="width: 100%; padding: 10px; border: 1px solid #555; background: #444; color: white; border-radius: 4px; box-sizing: border-box;">
                            </div>

                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #ccc;">选择成员:</label>
                                <div id="qq_contacts_list" style="max-height: 150px; overflow-y: auto; border: 1px solid #555; background: #444; border-radius: 4px; padding: 10px;">
                                    <!-- QQ联系人列表将在这里动态加载 -->
                                </div>
                            </div>

                            <div style="text-align: center; margin-top: 20px;">
                                <button id="confirm_create_group_btn" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">确认创建</button>
                                <button id="cancel_create_group_btn" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">取消</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);

      // 创建添加群员弹窗
      const $addMemberDialog = $(`
                <div id="add_member_dialog" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1001; flex-direction: column;">
                    <div style="background: #2c2c2c; color: white; width: 90%; max-width: 500px; height: 80%; margin: auto; border-radius: 10px; display: flex; flex-direction: column;">
                        <div class="dialog-head" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #555;">
                            <h3 style="margin: 0;">添加群员</h3>
                            <div id="close_add_member_btn" style="cursor: pointer; font-size: 20px;">×</div>
                        </div>

                        <div style="padding: 20px; flex-grow: 1; overflow-y: auto;">
                            <div style="margin-bottom: 15px;">
                                <div style="color: #ccc; margin-bottom: 8px;">群名称: <span id="add_member_group_name"></span></div>
                                <div style="color: #ccc; margin-bottom: 8px;">群号: <span id="add_member_group_id"></span></div>
                            </div>

                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 8px; color: #ccc;">选择要添加的成员:</label>
                                <div id="add_member_contacts_list" style="max-height: 200px; overflow-y: auto; border: 1px solid #555; background: #444; border-radius: 4px; padding: 10px;">
                                    <!-- QQ联系人列表将在这里动态加载 -->
                                </div>
                            </div>

                            <div style="text-align: center; margin-top: 20px;">
                                <button id="confirm_add_member_btn" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">确认添加</button>
                                <button id="cancel_add_member_btn" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">取消</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);

      $('body').append($groupCreateDialog);
      $('body').append($addMemberDialog);

      console.log('群组相关弹窗已重新创建');
    },

    // 测试用户头像设置（调试用）
    testUserAvatar: function () {
      console.log('=== 测试用户头像显示 ===');
      console.log('当前用户数据:', this.userData);

      // 只更新显示，不设置新头像
      console.log('直接更新用户头像显示');
      this.updateUserDisplay();

      console.log('用户头像显示已更新');
    },

    // 检查聊天记录中的用户头像信息（调试用）
    checkUserAvatarInChat: function () {
      console.log('=== 检查聊天记录中的用户头像信息 ===');

      try {
        const SillyTavernContext = this.getSillyTavernContext();
        if (!SillyTavernContext) {
          console.log('无法获取SillyTavern上下文');
          return;
        }

        const context = SillyTavernContext.getContext();
        if (!context || !context.chat) {
          console.log('无法获取聊天记录');
          return;
        }

        const messages = context.chat || [];
        console.log(`检查${messages.length}条聊天记录中的用户头像信息...`);

        let foundUserInfo = [];
        let foundUserAvatar = [];

        messages.forEach((message, index) => {
          const messageText = message.mes || '';

          // 检查用户信息格式
          const userInfoMatches = messageText.match(/\[用户信息\|([^|]+)\|([^\]]*)\]/g);
          if (userInfoMatches) {
            userInfoMatches.forEach(match => {
              foundUserInfo.push(`消息${index}: ${match}`);
            });
          }

          // 检查用户头像格式
          const userAvatarMatches = messageText.match(/\[用户头像\|([^\]]+)\]/g);
          if (userAvatarMatches) {
            userAvatarMatches.forEach(match => {
              foundUserAvatar.push(`消息${index}: ${match}`);
            });
          }
        });

        console.log('找到的用户信息:', foundUserInfo);
        console.log('找到的用户头像:', foundUserAvatar);

        if (foundUserInfo.length === 0 && foundUserAvatar.length === 0) {
          console.log('❌ 聊天记录中没有找到任何用户头像信息');
          console.log('💡 建议：点击用户头像设置一个头像，然后刷新页面测试');
        }
      } catch (error) {
        console.error('检查聊天记录失败:', error);
      }
    },

    // 绑定新的包装容器点击事件
    bindWrapperClickEvents: function () {
      // 头像点击事件
      $('#history_content')
        .off('click', '.custom-avatar')
        .on('click', '.custom-avatar', e => {
          e.stopPropagation();
          const $targetAvatar = $(e.target).closest('.custom-avatar'); // Ensure we get the avatar element
          const qqNumber = $targetAvatar.data('qq-number');
          const contactName = $targetAvatar.data('contact-name');

          // 只为有效的联系人QQ号显示头像修改弹窗
          if (qqNumber && String(qqNumber).trim() !== '' && String(qqNumber).trim() !== 'undefined') {
            console.log('点击联系人头像，QQ号:', qqNumber, '联系人:', contactName);

            // 详细调试信息
            console.log('window.QQAvatarEditor 存在:', !!window.QQAvatarEditor);
            console.log('window["QQAvatarEditor"] 存在:', !!window['QQAvatarEditor']);
            console.log('QQAvatarEditor 对象:', window.QQAvatarEditor);
            if (window.QQAvatarEditor) {
              console.log('showContactEditor 方法存在:', typeof window.QQAvatarEditor.showContactEditor);
            }

            // 调用新的头像编辑器
            if (window.QQAvatarEditor && typeof window.QQAvatarEditor.showContactEditor === 'function') {
              console.log('调用联系人头像编辑器');
              window.QQAvatarEditor.showContactEditor(qqNumber, contactName);
            } else {
              console.error('QQAvatarEditor 不可用');
            }
          } else {
            console.log('点击了群组占位符头像或无效头像数据，不显示修改弹窗。QQ号:', qqNumber, '联系人:', contactName);
            // 对于群组头像，不执行任何操作，也不阻止事件冒泡，允许父级 .qq-group-wrapper 的点击事件处理
          }
        });

      // QQ联系人包装容器点击事件
      $(document)
        .off('click', '.qq-contact-wrapper')
        .on('click', '.qq-contact-wrapper', function (e) {
          e.stopPropagation();
          console.log('点击了联系人包装容器');

          const $wrapper = $(this);
          const $chatPage = $wrapper.find('.chat-page');

          console.log('找到聊天页面元素:', $chatPage.length);

          // 先隐藏所有其他的聊天页面，避免显示错误信息
          $('.chat-page').removeClass('show');

          // 隐藏主列表中的所有包装器
          $('#history_content > .qq-contact-wrapper').hide();
          $('#history_content > .qq-group-wrapper').hide();

          // 显示当前点击的包装器 (它将承载聊天页面)
          $wrapper.show();

          // 设置联系人聊天页面的头部颜色
          $chatPage.find('.chat-header').removeClass('group').addClass('contact');
          $chatPage.find('.send-btn').removeClass('group').addClass('contact');

          $chatPage.addClass('show');
          console.log('已添加show类');

          // 隐藏QQ主页的装饰栏
          if (window.QQApp && typeof window.QQApp.hideMainPageDecorations === 'function') {
            window.QQApp.hideMainPageDecorations();
          }

          // 滚动到消息底部
          setTimeout(() => {
            const $messagesContainer = $chatPage.find('.chat-messages');
            if ($messagesContainer.length > 0) {
              $messagesContainer.scrollTop($messagesContainer[0].scrollHeight);
              console.log('已滚动到消息底部');
            }
          }, 100);
        });

      // QQ群组包装容器点击事件
      $(document)
        .off('click', '.qq-group-wrapper')
        .on('click', '.qq-group-wrapper', function (e) {
          e.stopPropagation();
          console.log('点击了群组包装容器');

          const $wrapper = $(this);
          const $chatPage = $wrapper.find('.chat-page');

          console.log('找到聊天页面元素:', $chatPage.length);

          // 先隐藏所有其他的聊天页面，避免显示错误信息
          $('.chat-page').removeClass('show');

          // 隐藏主列表中的所有包装器
          $('#history_content > .qq-contact-wrapper').hide();
          $('#history_content > .qq-group-wrapper').hide();

          // 显示当前点击的包装器
          $wrapper.show();

          // 设置群组聊天页面的头部颜色
          $chatPage.find('.chat-header').addClass('group');
          $chatPage.find('.send-btn').addClass('group');

          $chatPage.addClass('show');
          console.log('已添加show类');

          // 隐藏QQ主页的装饰栏
          if (window.QQApp && typeof window.QQApp.hideMainPageDecorations === 'function') {
            window.QQApp.hideMainPageDecorations();
          }

          // 滚动到消息底部
          setTimeout(() => {
            const $messagesContainer = $chatPage.find('.chat-messages');
            if ($messagesContainer.length > 0) {
              $messagesContainer.scrollTop($messagesContainer[0].scrollHeight);
              console.log('已滚动到消息底部');
            }
          }, 100);
        });

      // 小房子按钮点击事件（聊天页面内）
      $(document)
        .off('click', '.chat-home-btn')
        .on('click', '.chat-home-btn', function (e) {
          e.stopPropagation();
          e.preventDefault();
          console.log('点击了聊天页面的小房子按钮，返回手机首页');

          // 隐藏聊天页面
          $(this).closest('.chat-page').removeClass('show');

          // 显示QQ主页的装饰栏
          if (window.QQApp && typeof window.QQApp.showMainPageDecorations === 'function') {
            window.QQApp.showMainPageDecorations();
          }

          // 隐藏QQ应用
          if (window.QQApp && typeof window.QQApp.hide === 'function') {
            window.QQApp.hide();
          }

          // 显示手机界面
          if (window.PhoneInterface && typeof window.PhoneInterface.show === 'function') {
            window.PhoneInterface.show(); // This will show phone home and remove qq-content mode
          }
        });

      // 返回QQ聊天主页按钮事件 (聊天页面内)
      $(document)
        .off('click', '.back-to-main-list-btn')
        .on('click', '.back-to-main-list-btn', function (e) {
          e.stopPropagation();
          console.log('点击返回箭头，返回QQ聊天主页');
          $(this).closest('.chat-page').removeClass('show');

          // 显示QQ主页的装饰栏
          if (window.QQApp && typeof window.QQApp.showMainPageDecorations === 'function') {
            window.QQApp.showMainPageDecorations();
          }
          // 显示主列表中的所有包装器
          $('#history_content > .qq-contact-wrapper').show();
          $('#history_content > .qq-group-wrapper').show();
          // 不需要隐藏 #chat_history_dialog，因为我们是返回到它
        });

      // 添加群员按钮点击事件
      $(document)
        .off('click', '.add-member-btn')
        .on('click', '.add-member-btn', function (e) {
          e.stopPropagation();
          const groupId = $(this).data('group-id');
          const groupName = $(this).data('group-name');
          console.log('点击添加群员按钮，群ID:', groupId, '群名:', groupName);
          QQApp.showAddMemberDialog(groupId, groupName);
        });

      // 发送按钮点击事件
      $('#history_content')
        .off('click', '.send-btn')
        .on('click', '.send-btn', function (e) {
          e.stopPropagation();
          const $sendBtn = $(this);
          const $input = $sendBtn.siblings('.message-input');
          const message = String($input.val() || '').trim();

          if (message) {
            console.log('发送消息:', message);

            // 获取目标信息（联系人或群组）
            const targetInfo = QQApp.getTargetInfo($sendBtn);

            if (targetInfo) {
              console.log('目标信息:', targetInfo);

              // 发送消息到SillyTavern
              QQApp.buildAndSendQQMessage(message, targetInfo.target, targetInfo.isGroup);

              // 添加消息到本地聊天记录
              const $chatMessages = $sendBtn
                .closest('.chat-page')
                .find('.chat-messages .custom-qq-cont, .custom-qun-cont');

              const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const messageHtml = `
                        <div class="custom-message custom-sent">
                            <div class="message-bubble">
                                <div>${message}</div>
                                <div class="message-time">${currentTime}</div>
                            </div>
                            <div class="message-avatar sent-avatar">我</div>
                        </div>
                    `;
              $chatMessages.append(messageHtml);

              $input.val('');

              // 滚动到底部
              const $messagesContainer = $sendBtn.closest('.chat-page').find('.chat-messages');
              $messagesContainer.scrollTop($messagesContainer[0].scrollHeight);

              // 显示发送成功提示
              console.log(`消息已发送到${targetInfo.isGroup ? '群聊' : '私聊'}: ${targetInfo.target}`);
            } else {
              console.error('无法确定消息目标');
              alert('发送失败：无法确定消息目标');
            }
          }
        });

      // 输入框回车发送
      $('#history_content')
        .off('keypress', '.message-input')
        .on('keypress', '.message-input', function (e) {
          if (e.which === 13) {
            // Enter键
            e.preventDefault(); // 防止换行
            $(this).siblings('.send-btn').click();
          }
        });

      // 移除JavaScript悬停效果，完全使用CSS处理
      // 这样避免与CSS :hover 伪类冲突导致的闪烁
    },

    // 发送消息到聊天框（参考淘宝应用的实现）
    sendToChat: function (message) {
      try {
        console.log('尝试发送消息到SillyTavern:', message);

        // 方法1: 直接使用DOM元素
        const originalInput = document.getElementById('send_textarea');
        const sendButton = document.getElementById('send_but');

        console.log('输入框元素:', originalInput);
        console.log('发送按钮元素:', sendButton);

        if (!originalInput) {
          console.error('找不到输入框元素 send_textarea');
          // 尝试备用方案
          this.sendToChatBackup(message);
          return;
        }

        if (!sendButton) {
          console.error('找不到发送按钮元素 send_but');
          // 尝试备用方案
          this.sendToChatBackup(message);
          return;
        }

        // 检查输入框是否可用
        if (
          (originalInput instanceof HTMLInputElement || originalInput instanceof HTMLTextAreaElement) &&
          originalInput.disabled
        ) {
          console.warn('输入框被禁用');
          return;
        }

        // 检查发送按钮是否可用
        if ($(sendButton).hasClass('disabled')) {
          console.warn('发送按钮被禁用');
          return;
        }

        // 设置值（处理input和textarea两种类型）
        if (originalInput instanceof HTMLInputElement || originalInput instanceof HTMLTextAreaElement) {
          originalInput.value = message;
          console.log('已设置输入框值:', originalInput.value);

          // 触发输入事件
          originalInput.dispatchEvent(new Event('input', { bubbles: true }));
          originalInput.dispatchEvent(new Event('change', { bubbles: true }));

          console.log('已触发输入事件');

          // 延迟点击发送按钮
          setTimeout(() => {
            console.log('准备点击发送按钮');
            sendButton.click();
            console.log('已点击发送按钮');
          }, 300);
        } else {
          console.error('输入框不是有效的输入元素类型:', originalInput.tagName);
          // 尝试备用方案
          this.sendToChatBackup(message);
        }
      } catch (error) {
        console.error('发送消息时出错:', error);
        // 尝试备用方案
        this.sendToChatBackup(message);
      }
    },

    // 备用发送方法
    sendToChatBackup: function (message) {
      try {
        console.log('尝试备用发送方法:', message);

        // 尝试查找其他可能的输入框
        const textareas = document.querySelectorAll('textarea');
        const inputs = document.querySelectorAll('input[type="text"]');

        console.log('找到的textarea元素:', textareas.length);
        console.log('找到的text input元素:', inputs.length);

        // 尝试使用SillyTavern全局API（如果可用）
        if (typeof window.sillyTavern !== 'undefined') {
          console.log('找到SillyTavern全局对象');
          // 这里可以尝试使用SillyTavern的API
        }

        // 最后的尝试：直接模拟用户输入
        if (textareas.length > 0) {
          const textarea = textareas[0];
          console.log('尝试使用第一个textarea元素');
          textarea.value = message;
          textarea.focus();

          // 模拟键盘事件
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        }
      } catch (error) {
        console.error('备用发送方法也失败了:', error);
      }
    },

    // 构建QQ消息格式并发送到SillyTavern
    buildAndSendQQMessage: function (message, target, isGroup = false, isReceived = false) {
      let formattedMessage;

      // 参考参考.js的格式构建消息
      if (isGroup) {
        // 群聊格式
        formattedMessage = `你生成的消息，使用规定格式。消息内容包含我方消息和对方消息，你必须生成我方消息随后生成对方消息，群里不会自动出现新成员。发送群聊到群${target}：${message}`;
      } else {
        // 私聊格式
        formattedMessage = `你生成的消息，使用规定格式。消息内容包含我方消息和对方消息，你必须生成我方消息随后生成对方消息。向${target}发送消息，${message}`;
      }

      console.log('构建的消息格式:', formattedMessage);
      this.sendToChat(formattedMessage);

      // 删除发送成功提示弹窗
      // this.showSendSuccessToast(message, target, isGroup);
    },

    // 显示发送成功提示
    showSendSuccessToast: function (message, target, isGroup) {
      const messageType = isGroup ? '群聊' : '私聊';
      const $toast = $(`
                <div class="qq-send-toast" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #28a745; color: white; padding: 15px 25px; border-radius: 8px; z-index: 1200; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 300px; text-align: center;">
                    <i class="fas fa-check-circle" style="margin-right: 8px; font-size: 16px;"></i>
                    <div style="font-weight: bold; margin-bottom: 5px;">消息已发送到SillyTavern</div>
                    <div style="font-size: 12px; opacity: 0.9;">
                        ${messageType}: ${target}<br>
                        内容: ${message.length > 20 ? message.substring(0, 20) + '...' : message}
                    </div>
                </div>
            `);

      $('body').append($toast);

      setTimeout(() => {
        $toast.fadeOut(300, function () {
          $(this).remove();
        });
      }, 2500);
    },

    // 从消息输入框获取联系人或群组信息
    getTargetInfo: function ($sendBtn) {
      const $chatPage = $sendBtn.closest('.chat-page');
      const $wrapper = $chatPage.closest('.qq-contact-wrapper, .qq-group-wrapper');

      if ($wrapper.hasClass('qq-contact-wrapper')) {
        // 私聊
        const contactName = $wrapper.find('.contact-name').text();
        const qqNumber = $wrapper.data('qq-number');
        return {
          isGroup: false,
          target: contactName || qqNumber,
          type: 'contact',
        };
      } else if ($wrapper.hasClass('qq-group-wrapper')) {
        // 群聊
        const groupName = $wrapper.find('.group-name').text();
        const groupId = $wrapper.data('group-id');
        return {
          isGroup: true,
          target: groupName || groupId,
          type: 'group',
        };
      }

      return null;
    },

    // 显示添加群员弹窗
    showAddMemberDialog: async function (groupId, groupName) {
      try {
        console.log('正在加载添加群员弹窗...', groupId, groupName);

        // 设置群组信息
        $('#add_member_group_name').text(groupName);
        $('#add_member_group_id').text(groupId);

        // 获取所有QQ联系人
        const allContacts = await window['HQDataExtractor'].extractQQContacts();

        // 获取当前群组成员列表
        const currentMembers = await this.getCurrentGroupMembers(groupId);
        console.log('当前群组成员:', currentMembers);

        // 过滤出不在群组中的联系人
        const availableContacts = allContacts.filter(
          contact => !currentMembers.includes(contact.name) && contact.name !== '我',
        );

        const $contactsList = $('#add_member_contacts_list');
        $contactsList.empty();

        if (availableContacts.length === 0) {
          $contactsList.html('<p style="text-align: center; color: #aaa; margin: 20px 0;">暂无可添加的联系人</p>');
        } else {
          availableContacts.forEach(contact => {
            const $contactItem = $(`
                            <div class="add-member-contact-item" style="padding: 8px; margin: 5px 0; background: #3c3c3c; border-radius: 4px; cursor: pointer; display: flex; align-items: center;">
                                <input type="checkbox" class="add-member-contact-checkbox" data-qq-number="${contact.number}" data-qq-name="${contact.name}" style="margin-right: 10px;">
                                <span style="color: white;">${contact.name}</span>
                                <span style="color: #aaa; margin-left: 10px;">QQ: ${contact.number}</span>
                            </div>
                        `);

            $contactsList.append($contactItem);
          });

          // 添加点击事件来切换复选框
          $('.add-member-contact-item').on('click', function (e) {
            if (e.target && e.target.tagName !== 'INPUT') {
              const checkbox = $(this).find('.add-member-contact-checkbox');
              checkbox.prop('checked', !checkbox.prop('checked'));
            }
          });
        }

        // 显示弹窗
        $('#add_member_dialog').css('display', 'flex');
      } catch (error) {
        console.error('加载添加群员弹窗时出错:', error);
      }
    },

    // 获取当前群组成员列表
    getCurrentGroupMembers: async function (groupId) {
      try {
        // 从聊天记录中查找最新的群聊创建信息
        const messageElements = document.querySelectorAll('.mes_text, .mes_block');
        let latestGroupInfo = null;

        // 创建正则表达式匹配该群的信息：[创建群聊|群号|群名|成员列表]
        const groupRegex = new RegExp(`\\[创建群聊\\|${groupId}\\|([^\\|]+)\\|([^\\]]+)\\]`, 'g');

        // 从最新消息开始查找
        for (let i = messageElements.length - 1; i >= 0; i--) {
          const messageText = messageElements[i].textContent || '';
          groupRegex.lastIndex = 0; // 重置正则表达式索引

          const match = groupRegex.exec(messageText);
          if (match) {
            latestGroupInfo = {
              groupName: match[1],
              members: match[2],
            };
            console.log('找到群聊信息:', latestGroupInfo);
            break;
          }
        }

        if (latestGroupInfo) {
          // 解析成员列表
          const members = latestGroupInfo.members.split('、').map(name => name.trim());
          return members;
        } else {
          console.log('未找到群聊信息，返回空数组');
          return [];
        }
      } catch (error) {
        console.error('获取当前群组成员失败:', error);
        return [];
      }
    },

    // 添加群员
    addGroupMembers: async function () {
      try {
        const groupId = $('#add_member_group_id').text();
        const groupName = $('#add_member_group_name').text();
        const selectedContacts = [];

        // 获取选中的联系人
        $('.add-member-contact-checkbox:checked').each(function () {
          selectedContacts.push({
            name: $(this).data('qq-name'),
            number: $(this).data('qq-number'),
          });
        });

        if (selectedContacts.length === 0) {
          alert('请至少选择一个要添加的成员');
          return;
        }

        // 获取当前群组成员
        const currentMembers = await this.getCurrentGroupMembers(groupId);

        // 添加新成员
        const newMemberNames = selectedContacts.map(c => c.name);
        const updatedMembers = [...currentMembers, ...newMemberNames];
        const updatedMembersString = updatedMembers.join('、');

        console.log('更新后的成员列表:', updatedMembersString);

        // 更新聊天记录中的群聊信息
        await this.updateGroupMembersInChat(groupId, groupName, updatedMembersString);

        // 关闭弹窗
        $('#add_member_dialog').hide();

        // 重新加载消息列表
        this.loadMessages();

        alert(`成功添加${selectedContacts.length}个成员到群组"${groupName}"！\n新成员: ${newMemberNames.join('、')}`);
      } catch (error) {
        console.error('添加群员时出错:', error);
        alert('添加群员失败，请重试');
      }
    },

    // 更新聊天记录中的群聊成员信息
    updateGroupMembersInChat: async function (groupId, groupName, updatedMembersString) {
      try {
        console.log(`正在更新聊天记录中的群聊成员信息: ${groupId} -> ${groupName} (${updatedMembersString})`);

        // 查找包含该群聊信息的最新消息
        const userMessages = document.querySelectorAll('.mes[is_user="true"]');
        let targetMessage = null;
        let targetMessageElement = null;

        // 创建正则表达式匹配该群的信息
        const groupRegex = new RegExp(`\\[创建群聊\\|${groupId}\\|[^\\|]+\\|[^\\]]+\\]`, 'g');

        // 从最新消息开始查找
        for (let i = userMessages.length - 1; i >= 0; i--) {
          const messageElement = userMessages[i];
          const messageTextElement = messageElement.querySelector('.mes_text');

          if (messageTextElement) {
            const messageText = messageTextElement.textContent || '';
            groupRegex.lastIndex = 0; // 重置正则表达式索引

            if (groupRegex.test(messageText)) {
              targetMessage = messageText;
              targetMessageElement = messageElement;
              console.log('找到要修改的消息:', messageText);
              break;
            }
          }
        }

        if (!targetMessageElement) {
          console.log('未找到包含群聊信息的消息');
          return;
        }

        // 构建新的群聊信息
        const newGroupInfo = `[创建群聊|${groupId}|${groupName}|${updatedMembersString}]`;

        // 替换原有的群聊信息
        const updatedMessage = targetMessage.replace(groupRegex, newGroupInfo);

        console.log('新的消息内容:', updatedMessage);

        // 修改消息内容
        this.modifyChatMessage(targetMessageElement, updatedMessage);

        console.log('群聊成员信息已更新到聊天记录');
      } catch (error) {
        console.error('更新聊天记录中的群聊成员信息失败:', error);
      }
    },

    // 隐藏QQ主页装饰栏
    hideMainPageDecorations: function () {
      console.log('隐藏QQ主页装饰栏');

      // 使用CSS类来隐藏，避免破坏flexbox布局
      $('.dialog-head').addClass('qq-decoration-hidden');
      $('.qq-status-bar:not(.chat-status-bar)').addClass('qq-decoration-hidden');
      $('#chat_history_dialog .dialog-head').addClass('qq-decoration-hidden');
      $('#chat_history_dialog .qq-status-bar').addClass('qq-decoration-hidden');
      $('.qq-app-container .dialog-head').addClass('qq-decoration-hidden');
      $('.qq-app-container .qq-status-bar').addClass('qq-decoration-hidden');

      // 添加隐藏类
      $('body').addClass('chat-detail-active');
    },

    // 显示QQ主页装饰栏
    showMainPageDecorations: function () {
      console.log('显示QQ主页装饰栏');

      // 使用CSS类来显示，保持原有的display属性
      $('.dialog-head').removeClass('qq-decoration-hidden');
      $('.qq-status-bar:not(.chat-status-bar)').removeClass('qq-decoration-hidden');
      $('#chat_history_dialog .dialog-head').removeClass('qq-decoration-hidden');
      $('#chat_history_dialog .qq-status-bar').removeClass('qq-decoration-hidden');
      $('.qq-app-container .dialog-head').removeClass('qq-decoration-hidden');
      $('.qq-app-container .qq-status-bar').removeClass('qq-decoration-hidden');

      // 移除隐藏类
      $('body').removeClass('chat-detail-active');
    },

    // 添加用户头像点击事件
    addClickEventsToUserAvatar: function () {
      const self = this;

      // 用户头像点击事件 - 使用事件委托
      $(document).on('click', '#user_avatar', function (e) {
        console.log('点击了用户头像');
        e.stopPropagation();
        e.preventDefault();

        // 详细调试信息
        console.log('window.QQAvatarEditor 存在:', !!window.QQAvatarEditor);
        console.log('window["QQAvatarEditor"] 存在:', !!window['QQAvatarEditor']);
        console.log('QQAvatarEditor 对象:', window.QQAvatarEditor);
        if (window.QQAvatarEditor) {
          console.log('showUserEditor 方法存在:', typeof window.QQAvatarEditor.showUserEditor);
        }

        // 显示用户头像编辑器
        if (window.QQAvatarEditor && typeof window.QQAvatarEditor.showUserEditor === 'function') {
          console.log('调用用户头像编辑器');
          window.QQAvatarEditor.showUserEditor();
        } else {
          console.error('QQAvatarEditor 不可用');
        }
      });

      console.log('用户头像点击事件已绑定');
    },

    // 设置用户信息（增强版）
    setUserDataEnhanced(name, avatarConfig) {
      this.userData.name = name;

      // 处理增强的头像配置
      if (typeof avatarConfig === 'string') {
        // 兼容旧格式
        this.userData.avatar = avatarConfig;
        this.userData.avatarConfig = null;
      } else if (avatarConfig && avatarConfig.url) {
        // 新格式
        this.userData.avatar = avatarConfig.url;
        this.userData.avatarConfig = avatarConfig;
      }

      this.updateUserDisplay();
      this.updateUserInfoInChatEnhanced(name, avatarConfig);
    },

    // 在聊天记录中更新用户信息（增强版）
    updateUserInfoInChatEnhanced(name, avatarConfig) {
      try {
        const lastUserMessage = this.getLastUserMessage();
        if (!lastUserMessage) return;

        const messageTextElement = lastUserMessage.querySelector('.mes_text');
        if (!messageTextElement) return;

        let messageText = messageTextElement.textContent || '';

        if (typeof avatarConfig === 'string') {
          // 兼容旧格式
          messageText = this.updateUserInfoInText(messageText, name, avatarConfig);
          if (avatarConfig) {
            messageText = this.updateUserAvatarInText(messageText, avatarConfig);
          }
        } else if (avatarConfig && avatarConfig.url) {
          // 新格式 - 使用增强格式保存
          const configJson = JSON.stringify(avatarConfig);
          const enhancedFormat = `[用户头像增强|${configJson}]`;

          // 移除旧格式的用户头像信息
          messageText = messageText.replace(/\[用户头像\|[^\]]+\]/g, '');
          messageText = messageText.replace(/\[用户头像增强\|[^\]]+\]/g, '');

          messageText += ` ${enhancedFormat}`;

          // 同时保持用户信息格式
          messageText = this.updateUserInfoInText(messageText, name, avatarConfig.url);
        }

        this.modifyChatMessage(lastUserMessage, messageText);
      } catch (error) {
        console.error('更新聊天记录中的用户信息失败:', error);
      }
    },

    // 设置头像URL（增强版）
    setAvatarUrlEnhanced(qqNumber, avatarConfig) {
      if (typeof avatarConfig === 'string') {
        // 兼容旧格式
        this.avatarData[qqNumber] = avatarConfig;
      } else if (avatarConfig && avatarConfig.url) {
        // 新格式 - 存储完整配置
        this.avatarData[qqNumber] = avatarConfig.url;
        this.avatarData[`${qqNumber}_config`] = avatarConfig;
      }

      this.updateAvatarInChatEnhanced(qqNumber, avatarConfig);
      this.updateAllAvatarDisplaysEnhanced(qqNumber, avatarConfig);
    },

    // 在聊天记录中更新头像信息（增强版）
    updateAvatarInChatEnhanced(qqNumber, avatarConfig) {
      try {
        const lastUserMessage = this.getLastUserMessage();
        if (!lastUserMessage) return;

        const messageTextElement = lastUserMessage.querySelector('.mes_text');
        if (!messageTextElement) return;

        let messageText = messageTextElement.textContent || '';

        if (typeof avatarConfig === 'string') {
          // 兼容旧格式
          messageText = this.updateAvatarInText(messageText, qqNumber, avatarConfig);
        } else if (avatarConfig && avatarConfig.url) {
          // 新格式 - 使用增强格式保存
          const configJson = JSON.stringify(avatarConfig);
          const enhancedFormat = `[头像增强|${qqNumber}|${configJson}]`;

          // 移除旧格式的头像信息
          const oldRegex = new RegExp(`\\[头像\\|${qqNumber}\\|[^\\]]+\\]`, 'g');
          const oldEnhancedRegex = new RegExp(`\\[头像增强\\|${qqNumber}\\|[^\\]]+\\]`, 'g');

          messageText = messageText.replace(oldRegex, '');
          messageText = messageText.replace(oldEnhancedRegex, '');

          messageText += ` ${enhancedFormat}`;
        }

        this.modifyChatMessage(lastUserMessage, messageText);
      } catch (error) {
        console.error('更新聊天记录中的头像信息失败:', error);
      }
    },

    // 更新页面上所有相关的头像显示（增强版）- 添加防抖
    updateAllAvatarDisplaysEnhanced(qqNumber, avatarConfig) {
      // 清除之前的定时器
      if (this.updateTimers.contactAvatars[qqNumber]) {
        clearTimeout(this.updateTimers.contactAvatars[qqNumber]);
      }

      // 防抖处理
      this.updateTimers.contactAvatars[qqNumber] = setTimeout(() => {
        this.performContactAvatarUpdate(qqNumber, avatarConfig);
      }, 100);
    },

    // 执行角色头像更新
    performContactAvatarUpdate(qqNumber, avatarConfig) {
      const avatarUrl = typeof avatarConfig === 'string' ? avatarConfig : avatarConfig.url;
      const transform = avatarConfig && avatarConfig.transform ? avatarConfig.transform : null;

      const currentState = JSON.stringify({ avatarUrl, transform });

      // 检查是否需要更新（状态是否改变）
      if (this.lastUpdateStates.contactAvatars[qqNumber] === currentState) {
        console.log(`🔄 角色 ${qqNumber} 头像状态未改变，跳过更新`);
        return;
      }

      console.log(`🔄 执行角色 ${qqNumber} 头像更新`);
      this.lastUpdateStates.contactAvatars[qqNumber] = currentState;

      this.updateContactAvatarsEnhanced(qqNumber, avatarUrl, transform);
      // 延迟更新消息头像，避免同时进行大量DOM操作
      setTimeout(() => {
        this.updateMessageAvatarsEnhanced(qqNumber, avatarUrl, transform);
      }, 50);
    },

    // 更新联系人头像（增强版）
    updateContactAvatarsEnhanced(qqNumber, avatarUrl, transform) {
      const $elements = $(`.custom-avatar-${qqNumber}`);
      $elements.each(function (index) {
        const $element = $(this);

        if (avatarUrl) {
          let css = {
            'background-image': `url(${avatarUrl})`,
          };

          // 应用变换 - 使用background属性而不是transform
          if (transform) {
            // 应用安全限制
            const safeScale = Math.max(0.1, Math.min(5, transform.scale || 1));
            const safeX = Math.max(-200, Math.min(200, transform.translateX || 0));
            const safeY = Math.max(-200, Math.min(200, transform.translateY || 0));
            const safeRotation = (transform.rotate || 0) % 360;

            // 计算背景尺寸和位置
            const backgroundSize = `${safeScale * 100}%`;
            const backgroundPositionX = `${50 - safeX * 0.5}%`;
            const backgroundPositionY = `${50 - safeY * 0.5}%`;

            css['background-size'] = backgroundSize;
            css['background-position'] = `${backgroundPositionX} ${backgroundPositionY}`;
            css['background-repeat'] = 'no-repeat';

            // 如果有旋转，应用transform
            if (safeRotation !== 0) {
              css['transform'] = `rotate(${safeRotation}deg)`;
              css['transform-origin'] = 'center center';
            }

            // 只在第一个元素时输出调试信息，避免重复
            if (index === 0) {
              console.log('🎨 应用联系人头像变换:', {
                qqNumber,
                scale: safeScale,
                translate: { x: safeX, y: safeY },
                rotate: safeRotation,
                backgroundSize,
                backgroundPosition: `${backgroundPositionX} ${backgroundPositionY}`,
                elementCount: $elements.length,
              });
            }
          } else {
            // 默认样式
            css['background-size'] = 'cover';
            css['background-position'] = 'center';
          }

          $element.css(css).text('');
        }
      });
    },

    // 更新消息头像（增强版）- 优化性能
    updateMessageAvatarsEnhanced(qqNumber, avatarUrl, transform) {
      console.log(`🔄 更新角色 ${qqNumber} 消息头像`);

      // 查找所有可能的角色消息头像选择器
      const contactAvatarSelectors = [
        `.message-avatar.received-avatar`, // 通用的接收消息头像
        `.received-avatar`, // 简化的接收头像
        `.custom-message.custom-received .message-avatar`, // 接收消息中的头像
      ];

      let foundAvatars = 0;

      contactAvatarSelectors.forEach(selector => {
        const $elements = $(selector);

        $elements.each((elementIndex, element) => {
          const $this = $(element);
          const $contactWrapper = $this.closest('.qq-contact-wrapper');
          const $groupWrapper = $this.closest('.qq-group-wrapper');

          // 检查是否是目标联系人的头像
          let isTargetContact = false;

          if ($contactWrapper.length > 0) {
            const wrapperQQNumber = $contactWrapper.data('qq-number');
            if (wrapperQQNumber == qqNumber) {
              isTargetContact = true;
            }
          } else if ($groupWrapper.length > 0) {
            // 对于群聊，检查消息是否来自目标联系人
            const $messageContainer = $this.closest('.custom-message.custom-received');
            if ($messageContainer.length > 0) {
              isTargetContact = true;
            }
          }

          if (isTargetContact && avatarUrl) {
            foundAvatars++;
            let css = {
              'background-image': `url(${avatarUrl})`,
              'background-color': 'transparent',
              color: 'transparent',
              'font-size': '0',
              display: 'block',
            };

            // 应用变换效果
            if (transform) {
              // 应用安全限制
              const safeScale = Math.max(0.1, Math.min(5, transform.scale || 1));
              const safeX = Math.max(-200, Math.min(200, transform.translateX || 0));
              const safeY = Math.max(-200, Math.min(200, transform.translateY || 0));
              const safeRotation = (transform.rotate || 0) % 360;

              // 计算背景尺寸和位置
              const backgroundSize = `${safeScale * 100}%`;
              const backgroundPositionX = `${50 - safeX * 0.5}%`;
              const backgroundPositionY = `${50 - safeY * 0.5}%`;

              css['background-size'] = backgroundSize;
              css['background-position'] = `${backgroundPositionX} ${backgroundPositionY}`;
              css['background-repeat'] = 'no-repeat';

              // 应用旋转
              if (safeRotation !== 0) {
                css['transform'] = `rotate(${safeRotation}deg)`;
                css['transform-origin'] = 'center center';
              }

              // 只在第一个元素时输出调试信息
              if (foundAvatars === 1) {
                console.log(`🎨 应用角色 ${qqNumber} 消息头像变换:`, {
                  scale: safeScale,
                  translate: { x: safeX, y: safeY },
                  rotate: safeRotation,
                });
              }
            } else {
              // 默认样式
              css['background-size'] = 'cover';
              css['background-position'] = 'center';
            }

            $this.css(css).text('');
          }
        });
      });

      if (foundAvatars > 0) {
        console.log(`✅ 更新了 ${foundAvatars} 个角色 ${qqNumber} 消息头像`);
      }
    },
  };

  // 当DOM加载完成时初始化
  $(document).ready(function () {
    console.log('🚀 QQ应用模块初始化完成');

    // 导出到全局
    window.QQApp = QQApp;

    // 自动初始化应用
    if (typeof QQApp.init === 'function') {
      QQApp.init();
    }
  });

  // 导出到全局
  window['QQApp'] = QQApp;
})(window);
