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
    lastUpdateTime: {
      userAvatar: 0,
      contactAvatars: {},
    },

    // 添加消息头像更新缓存，避免重复更新
    lastMessageAvatarUpdate: null,

    // 调试模式开关，减少不必要的日志输出
    debugMode: false,

    // 自动恢复状态标志
    isRecovering: false,

    // 新增：头像数据缓存和版本控制
    avatarDataCache: {
      data: {},
      version: 0,
      lastLoadTime: 0,
      isValid: false,
    },

    // 新增：性能优化配置
    performanceConfig: {
      cacheValidityTime: 300000, // 5分钟缓存有效期
      forceReloadThreshold: 10, // 超过10个联系人时启用更激进的缓存策略
      batchUpdateDelay: 50, // 批量更新间隔
      maxBatchSize: 3, // 每批最大处理数量
    },

    // 初始化应用
    init() {
      try {
        if (!this.checkDependencies()) return;

        // 初始化缓存系统
        this.initAvatarCache();

        this.createInterface();
        this.bindEvents();
        this.loadData();

        // 🔧 确保映射表在初始化时创建，避免后续重复创建
        console.log('🔄 [初始化] 创建联系人名称映射...');
        this.createContactNameMappingSync();

        // 设置页面可见性监听，用于跨设备同步
        this.setupVisibilityListener();

        // 🔥 新增：启用实时更新系统
        this.setupRealtimeUpdates();

        setTimeout(() => this.updateUserDisplay(), CONFIG.DELAYS.UPDATE_USER_DISPLAY);
      } catch (error) {
        console.error('QQ应用初始化失败:', error);
      }
    },

    // 设置实时更新系统
    setupRealtimeUpdates() {
      try {
        console.log('🔄 设置QQ应用实时更新系统...');

        // 检查数据提取器是否可用
        if (!window.HQDataExtractor) {
          console.warn('⚠️ HQDataExtractor不可用，延迟重试...');
          // 延迟重试
          setTimeout(() => {
            this.setupRealtimeUpdates();
          }, 1000);
          return;
        }

        // 定义更新回调函数
        const updateCallback = updateData => {
          console.log('🔄 [QQ实时更新] 检测到新消息，来源:', updateData.source);

          // 防抖处理，避免频繁更新
          if (this.realtimeUpdateTimer) {
            clearTimeout(this.realtimeUpdateTimer);
          }

          // 检测是否在群聊环境，动态调整防抖延迟
          const isInGroupChat = this.isCurrentlyInGroupChat();
          const debounceDelay = isInGroupChat ? 1500 : 800; // 群聊1.5秒，私聊800ms

          this.realtimeUpdateTimer = setTimeout(() => {
            this.handleRealtimeUpdate();
          }, debounceDelay);
        };

        // 保存回调函数引用，用于后续管理
        this.realtimeUpdateCallback = updateCallback;

        // 确保实时更新器已初始化并启动
        const setupUpdater = () => {
          try {
            const updater = window.HQDataExtractor.realtimeUpdater;

            // 如果未初始化，先初始化
            if (!updater.isInitialized) {
              console.log('🚀 初始化实时更新器...');
              updater.initialize();
            }

            // 如果未监听，强制启动监听
            if (!updater.isMonitoring) {
              console.log('🔧 强制启动实时更新监听器...');
              updater.isMonitoring = true;

              // 重新启动各种监听器
              if (typeof updater.startDOMObserver === 'function') {
                updater.startDOMObserver();
              }
              if (typeof updater.startEventListeners === 'function') {
                updater.startEventListeners();
              }
              if (typeof updater.startIntervalCheck === 'function') {
                updater.startIntervalCheck();
              }
            }

            // 注册实时更新回调
            if (typeof updater.onUpdate === 'function') {
              updater.onUpdate(updateCallback);
              console.log('✅ QQ应用实时更新回调已注册');
              console.log(
                `📊 当前监听状态: 已初始化=${updater.isInitialized}, 正在监听=${updater.isMonitoring}, 回调数量=${updater.updateCallbacks.size}`,
              );
              this.realtimeUpdateEnabled = true;
            } else {
              console.warn('⚠️ 实时更新接口不可用');
            }
          } catch (error) {
            console.error('❌ 设置实时更新器失败:', error);
          }
        };

        // 立即尝试设置，如果失败则延迟重试
        setupUpdater();

        // 延迟验证和重试机制
        setTimeout(() => {
          const updater = window.HQDataExtractor.realtimeUpdater;
          if (!updater.isMonitoring || updater.updateCallbacks.size === 0) {
            console.log('🔄 实时更新器状态异常，重新设置...');
            setupUpdater();
          }
        }, 2000);

        // 定期状态检查和自动修复
        this.statusCheckInterval = setInterval(() => {
          if (window.HQDataExtractor && window.HQDataExtractor.realtimeUpdater) {
            const updater = window.HQDataExtractor.realtimeUpdater;

            // 检查状态并自动修复
            if (updater.checkAndFixStatus) {
              const status = updater.checkAndFixStatus();

              // 如果回调丢失，重新注册
              if (status.isMonitoring && status.callbackCount === 0 && this.realtimeUpdateCallback) {
                console.log('🔧 检测到回调丢失，重新注册...');
                updater.onUpdate(this.realtimeUpdateCallback);
              }
            }
          }
        }, 30000); // 每30秒检查一次

        // 也监听全局事件作为备用
        document.addEventListener('mobile_plugin_data_updated', event => {
          console.log('🔄 [QQ全局事件] 收到数据更新事件');
          updateCallback(event.detail);
        });
      } catch (error) {
        console.error('⚠️ 设置实时更新系统失败:', error);
      }
    },

    // 处理实时更新
    handleRealtimeUpdate() {
      try {
        console.log('🔄 [QQ实时更新] 开始处理QQ应用数据更新...');

        // 检查当前是否在QQ应用界面
        const isQQAppVisible = this.isQQAppCurrentlyVisible();

        if (!isQQAppVisible) {
          console.log('📱 QQ应用当前不可见，跳过更新');
          return;
        }

        // 防止重复更新 - 添加更新锁
        if (this.isUpdating) {
          console.log('🔒 [QQ实时更新] 正在更新中，跳过重复更新');
          return;
        }

        this.isUpdating = true;

        // 检查当前是否在聊天详情页
        const isInChatDetail = this.isCurrentlyInChatDetail();

        if (isInChatDetail) {
          console.log('💬 [QQ实时更新] 当前在聊天详情页，执行智能更新...');
          this.updateChatDetailOnly();

          // 解锁
          setTimeout(() => {
            this.isUpdating = false;
          }, 100);
        } else {
          console.log('🏠 [QQ实时更新] 当前在主页，执行完整更新...');

          // 重新加载消息数据 - 但不重新加载头像数据（避免循环）
          this.loadMessagesWithoutAvatarReload()
            .then(() => {
              console.log('✅ [QQ实时更新] QQ消息数据更新完成');

              // 🎯 智能滚动：保持当前滚动位置，不自动滚动到底部
              console.log('📜 [QQ实时更新] 主页更新完成，保持当前滚动位置');
            })
            .catch(error => {
              console.error('⚠️ [QQ实时更新] 更新QQ消息数据失败:', error);
            })
            .finally(() => {
              // 解锁
              this.isUpdating = false;
            });
        }
      } catch (error) {
        console.error('⚠️ [QQ实时更新] 处理更新失败:', error);
        // 确保在出错时也能解锁
        this.isUpdating = false;
      }
    },

    // 检查当前是否在聊天详情页
    isCurrentlyInChatDetail() {
      try {
        // 检查是否有显示的聊天页面
        const $activeChatPage = $('.chat-page.show');
        return $activeChatPage.length > 0;
      } catch (error) {
        console.warn('⚠️ 检查聊天详情页状态失败:', error);
        return false;
      }
    },

    // 检查当前是否在群聊环境
    isCurrentlyInGroupChat() {
      try {
        // 方法1: 检查DOM结构
        const hasGroupElements =
          document.querySelector('.qq-group-wrapper') ||
          document.querySelector('[data-group-id]') ||
          document.querySelector('.custom-qq-qun') ||
          document.querySelector('.qq-group-wrapper.active');

        // 方法2: 检查最近的消息内容
        const recentMessages = document.querySelectorAll('.mes_text');
        let hasGroupKeywords = false;
        if (recentMessages.length > 0) {
          const lastMessage = recentMessages[recentMessages.length - 1];
          const messageText = lastMessage?.textContent || '';
          hasGroupKeywords =
            messageText.includes('群聊') ||
            messageText.includes('发送群聊') ||
            messageText.includes('群里') ||
            messageText.includes('群成员') ||
            messageText.includes('群组');
        }

        // 方法3: 检查当前活动的聊天页面
        const $activeChatPage = $('.chat-page.show');
        const isGroupChatActive = $activeChatPage.closest('.qq-group-wrapper').length > 0;

        const result = hasGroupElements || hasGroupKeywords || isGroupChatActive;

        if (result) {
          console.log('🔍 [群聊检测] 当前在群聊环境');
        }

        return result;
      } catch (error) {
        console.warn('⚠️ 检测群聊环境失败:', error);
        return false;
      }
    },

    // 只更新聊天详情页内容（不重建整个界面）
    updateChatDetailOnly() {
      try {
        console.log('💬 [智能更新] 开始更新聊天详情页内容...');

        // 获取当前显示的聊天页面
        const $activeChatPage = $('.chat-page.show');
        if ($activeChatPage.length === 0) {
          console.log('⚠️ [智能更新] 未找到活动的聊天页面');
          return;
        }

        // 获取聊天消息容器
        const $chatMessages = $activeChatPage.find('.chat-messages');
        if ($chatMessages.length === 0) {
          console.log('⚠️ [智能更新] 未找到聊天消息容器');
          return;
        }

        // 获取当前聊天的ID（从包装容器或其他标识中获取）
        const chatId = this.getCurrentChatId($activeChatPage);
        if (!chatId) {
          console.log('⚠️ [智能更新] 无法确定当前聊天ID');
          return;
        }

        console.log(`💬 [智能更新] 当前聊天ID: ${chatId}`);

        // 重新提取该聊天的消息数据
        this.updateSpecificChatMessages(chatId, $chatMessages);
      } catch (error) {
        console.error('⚠️ [智能更新] 更新聊天详情页失败:', error);
      }
    },

    // 获取当前聊天ID
    getCurrentChatId($activeChatPage) {
      try {
        // 尝试从包装容器获取聊天ID
        const $wrapper = $activeChatPage.closest('.qq-contact-wrapper, .qq-group-wrapper');

        if ($wrapper.length > 0) {
          if ($wrapper.hasClass('qq-contact-wrapper')) {
            // 联系人聊天 - 从data-qq-number属性获取
            const qqNumber = $wrapper.attr('data-qq-number');
            if (qqNumber) {
              console.log(`💬 [识别] 联系人聊天: ${qqNumber}`);
              return `contact_${qqNumber}`;
            }

            // 备用方案：从custom-qqhao类名获取
            const $qqHao = $wrapper.find('.custom-qqhao');
            const classMatch = $qqHao.attr('class')?.match(/custom-qqhao-(\d+)/);
            if (classMatch) {
              console.log(`💬 [识别备用] 联系人聊天: ${classMatch[1]}`);
              return `contact_${classMatch[1]}`;
            }
          } else if ($wrapper.hasClass('qq-group-wrapper')) {
            // 群组聊天 - 从data-group-id属性获取
            const groupId = $wrapper.attr('data-group-id');
            if (groupId) {
              console.log(`💬 [识别] 群组聊天: ${groupId}`);
              return `group_${groupId}`;
            }

            // 备用方案：从custom-qq-group类名获取
            const $groupElement = $wrapper.find('.custom-qq-group');
            const classMatch = $groupElement.attr('class')?.match(/custom-qq-group-(\d+)/);
            if (classMatch) {
              console.log(`💬 [识别备用] 群组聊天: ${classMatch[1]}`);
              return `group_${classMatch[1]}`;
            }
          }
        }

        console.log('⚠️ [识别] 无法获取聊天ID，包装容器:', $wrapper.length);
        return null;
      } catch (error) {
        console.error('⚠️ 获取聊天ID失败:', error);
        return null;
      }
    },

    // 更新特定聊天的消息
    async updateSpecificChatMessages(chatId, $chatMessages) {
      try {
        console.log(`💬 [智能更新] 更新聊天 ${chatId} 的消息...`);

        // 🔍 记录更新前的消息状态
        const beforeUpdate = this.captureCurrentMessageState($chatMessages);
        console.log(`📊 [消息状态] 更新前: ${beforeUpdate.messageCount} 条消息`);

        let filteredMessages = [];

        if (chatId.startsWith('contact_')) {
          // 联系人聊天
          const qqNumber = chatId.replace('contact_', '');
          console.log(`💬 [智能更新] 提取联系人 ${qqNumber} 的消息...`);

          // 重新提取所有QQ消息
          const allMessages = await window.HQDataExtractor.extractQQMessages();
          filteredMessages = allMessages.filter(msg => msg.qqNumber === qqNumber);

          console.log(`💬 [智能更新] 联系人消息筛选结果: ${filteredMessages.length} 条`);
        } else if (chatId.startsWith('group_')) {
          // 群组聊天
          const groupId = chatId.replace('group_', '');
          console.log(`💬 [智能更新] 提取群组 ${groupId} 的消息...`);

          // 重新提取群组数据
          const allGroups = await window.HQDataExtractor.extractQQGroups();
          const targetGroup = allGroups.find(group => group.id === groupId);

          if (targetGroup) {
            filteredMessages = targetGroup.messages || [];
            console.log(`💬 [智能更新] 群组消息筛选结果: ${filteredMessages.length} 条`);
          } else {
            console.log(`⚠️ [智能更新] 未找到群组 ${groupId}`);
          }
        }

        console.log(`💬 [智能更新] 最终找到 ${filteredMessages.length} 条消息`);

        // 🎯 智能重建消息HTML（支持新消息识别和动态显示）
        await this.rebuildChatMessagesWithAnimation($chatMessages, filteredMessages, chatId, beforeUpdate);

        console.log('✅ [智能更新] 聊天消息更新完成');
      } catch (error) {
        console.error('⚠️ [智能更新] 更新特定聊天消息失败:', error);
      }
    },

    // 🔍 捕获当前消息状态（用于新消息识别）
    captureCurrentMessageState($chatMessages) {
      try {
        const $messages = $chatMessages.find('.custom-message');
        const messageCount = $messages.length;

        // 获取最后一条消息的内容作为标识
        let lastMessageContent = '';
        if ($messages.length > 0) {
          const $lastMessage = $messages.last();
          lastMessageContent = $lastMessage.find('.message-text').text().trim();
        }

        return {
          messageCount: messageCount,
          lastMessageContent: lastMessageContent,
          timestamp: Date.now(),
        };
      } catch (error) {
        console.error('⚠️ 捕获消息状态失败:', error);
        return { messageCount: 0, lastMessageContent: '', timestamp: Date.now() };
      }
    },

    // 🎯 智能重建聊天消息HTML（支持新消息识别和动态显示）
    async rebuildChatMessagesWithAnimation($chatMessages, messages, chatId, beforeUpdate) {
      try {
        if (messages.length === 0) {
          $chatMessages.html('<div class="no-messages">暂无聊天记录</div>');
          return;
        }

        // 🔍 识别新消息
        const newMessages = this.identifyNewMessages(messages, beforeUpdate);
        console.log(`🆕 [新消息识别] 发现 ${newMessages.length} 条新消息`);

        // 清空现有消息
        $chatMessages.empty();

        // 构建所有消息HTML
        messages.forEach((message, index) => {
          const messageHtml = this.createMessageHTML(message, chatId);
          const $messageElement = $(messageHtml);

          // 🎭 如果是新消息，先隐藏
          const isNewMessage = newMessages.some(
            newMsg =>
              newMsg.content === message.content && newMsg.time === message.time && newMsg.type === message.type,
          );

          if (isNewMessage) {
            $messageElement.addClass('new-message-hidden');
            $messageElement.attr('data-new-message', 'true');
          }

          $chatMessages.append($messageElement);
        });

        console.log(`💬 [智能重建] 重新构建了 ${messages.length} 条消息`);

        // 🎯 智能滚动定位
        await this.smartScrollToNewMessages($chatMessages, newMessages.length);

        // 🎭 动态显示新消息
        if (newMessages.length > 0) {
          await this.animateNewMessages($chatMessages);
        }
      } catch (error) {
        console.error('⚠️ 智能重建聊天消息失败:', error);
      }
    },

    // 重新构建聊天消息HTML（原版，保持兼容性）
    rebuildChatMessages($chatMessages, messages, chatId) {
      try {
        // 清空现有消息
        $chatMessages.empty();

        if (messages.length === 0) {
          $chatMessages.html('<div class="no-messages">暂无聊天记录</div>');
          return;
        }

        // 构建消息HTML
        messages.forEach(message => {
          const messageHtml = this.createMessageHTML(message, chatId);
          $chatMessages.append(messageHtml);
        });

        console.log(`💬 [智能更新] 重新构建了 ${messages.length} 条消息`);
      } catch (error) {
        console.error('⚠️ 重新构建聊天消息失败:', error);
      }
    },

    // 🔍 识别新消息
    identifyNewMessages(allMessages, beforeUpdate) {
      try {
        if (!beforeUpdate || beforeUpdate.messageCount === 0) {
          // 如果之前没有消息，所有消息都是新的
          return allMessages;
        }

        // 如果消息数量没有增加，说明没有新消息
        if (allMessages.length <= beforeUpdate.messageCount) {
          console.log(`📊 [新消息识别] 消息数量未增加: ${allMessages.length} <= ${beforeUpdate.messageCount}`);
          return [];
        }

        // 获取新增的消息（从原有数量之后的消息）
        const newMessages = allMessages.slice(beforeUpdate.messageCount);

        console.log(`🆕 [新消息识别] 识别到 ${newMessages.length} 条新消息`);
        newMessages.forEach((msg, index) => {
          console.log(`  📝 新消息 ${index + 1}: ${msg.content?.substring(0, 30)}...`);
        });

        return newMessages;
      } catch (error) {
        console.error('⚠️ 识别新消息失败:', error);
        return [];
      }
    },

    // 🎯 智能滚动到新消息位置
    async smartScrollToNewMessages($chatMessages, newMessageCount) {
      try {
        if (newMessageCount === 0) {
          console.log('📜 [智能滚动] 没有新消息，保持当前滚动位置');
          return;
        }

        // 等待DOM更新完成
        await new Promise(resolve => setTimeout(resolve, 50));

        const $container = $chatMessages;
        const $allMessages = $container.find('.custom-message');

        if ($allMessages.length === 0) {
          console.log('📜 [智能滚动] 没有找到消息元素');
          return;
        }

        // 计算第一条新消息的位置
        const firstNewMessageIndex = $allMessages.length - newMessageCount;
        const $firstNewMessage = $allMessages.eq(firstNewMessageIndex);

        if ($firstNewMessage.length > 0) {
          // 滚动到第一条新消息的位置
          const containerHeight = $container.height();
          const messageTop = $firstNewMessage.position().top;
          const currentScrollTop = $container.scrollTop();

          // 计算目标滚动位置（让第一条新消息显示在容器顶部附近）
          const targetScrollTop = currentScrollTop + messageTop - 20; // 20px的边距

          // 使用平滑滚动
          $container.css('scroll-behavior', 'smooth');
          $container[0].scrollTop = targetScrollTop;

          // 恢复默认滚动行为
          setTimeout(() => {
            $container.css('scroll-behavior', 'auto');
          }, 300);

          console.log(`📜 [智能滚动] 滚动到第一条新消息位置 (索引: ${firstNewMessageIndex})`);
        } else {
          console.log('📜 [智能滚动] 未找到第一条新消息元素');
        }
      } catch (error) {
        console.error('⚠️ 智能滚动失败:', error);
      }
    },

    // 🎭 动态显示新消息动画
    async animateNewMessages($chatMessages) {
      try {
        const $newMessages = $chatMessages.find('[data-new-message="true"]');

        if ($newMessages.length === 0) {
          console.log('🎭 [动画显示] 没有找到新消息');
          return;
        }

        console.log(`🎭 [动画显示] 开始显示 ${$newMessages.length} 条新消息`);

        // 逐条显示新消息
        for (let i = 0; i < $newMessages.length; i++) {
          const $message = $newMessages.eq(i);

          // 等待一定时间间隔（模拟真实收到消息的效果）
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 800)); // 每条消息间隔800ms
          }

          // 显示消息动画
          $message.removeClass('new-message-hidden');
          $message.addClass('new-message-appearing');

          // 播放淡入动画（使用CSS transition）
          $message.css({
            opacity: 0,
            transform: 'translateY(20px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          });

          // 使用setTimeout触发动画
          setTimeout(() => {
            $message.css({
              opacity: 1,
              transform: 'translateY(0)',
            });
          }, 50);

          console.log(`✨ [动画显示] 显示第 ${i + 1} 条新消息`);
        }

        // 动画完成后清理标记
        setTimeout(() => {
          $newMessages.removeClass('new-message-appearing').removeAttr('data-new-message');
          console.log('🎭 [动画显示] 所有新消息显示完成');
        }, 500);
      } catch (error) {
        console.error('⚠️ 新消息动画显示失败:', error);
      }
    },

    // 创建单条消息的HTML
    createMessageHTML(message, chatId) {
      // 判断是否为我的消息
      const isMyMessage = message.type === 'sent' || message.isMyMessage === true;

      // 获取发送者名称
      let senderName = '';
      if (isMyMessage) {
        senderName = '我';
      } else {
        senderName = message.name || message.sender || '对方';
      }

      const messageClass = isMyMessage ? 'sent' : 'received';

      // 获取头像 - 应用变换配置
      let avatarHtml = '';
      if (!isMyMessage) {
        // 对于群组消息，尝试通过发送者名称找QQ号
        let qqNumber = message.qqNumber;
        let avatarUrl = null;
        let avatarConfig = null;

        if (qqNumber) {
          // 如果有明确的QQ号，直接使用
          avatarUrl = this.getAvatarUrl(qqNumber);
          avatarConfig = this.avatarData[`${qqNumber}_config`];
        } else if (chatId.startsWith('group_')) {
          // 在群组中，优先使用映射表查找QQ号
          // 方法1: 使用预建的映射表
          if (this.senderNameToQqNumberMap && this.senderNameToQqNumberMap[message.sender]) {
            qqNumber = this.senderNameToQqNumberMap[message.sender];
            avatarUrl = this.getAvatarUrl(qqNumber);
            avatarConfig = this.avatarData[`${qqNumber}_config`];
          } else {
            // 方法2: 通过联系人名称查找
            qqNumber = this.findQQNumberByName(message.sender);
            if (qqNumber) {
              avatarUrl = this.getAvatarUrl(qqNumber);
              avatarConfig = this.avatarData[`${qqNumber}_config`];
            }
          }
        }

        if (avatarUrl) {
          const avatarStyle = this.buildAvatarStyle(avatarUrl, avatarConfig);
          // 为每个消息头像添加唯一的数据属性，便于精确更新
          avatarHtml = `<div class="message-avatar received-avatar" data-qq-number="${qqNumber}" data-sender="${message.sender}" style="${avatarStyle}"></div>`;
        } else {
          avatarHtml = `<div class="message-avatar-placeholder">${senderName.charAt(0)}</div>`;
        }
      } else {
        // 我的消息显示用户头像
        const userAvatarUrl = this.userData.avatar;
        if (userAvatarUrl) {
          // 获取用户头像配置并应用变换
          const userConfig = this.getUserAvatarConfig();
          const avatarStyle = this.buildAvatarStyle(userAvatarUrl, userConfig);
          avatarHtml = `<div class="message-avatar sent-avatar" style="${avatarStyle}"></div>`;
        } else {
          avatarHtml = `<div class="message-avatar-placeholder">${this.userData.name.charAt(0)}</div>`;
        }
      }

      // 构建消息时间
      const messageTime =
        message.time ||
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

      return `
        <div class="custom-message custom-${messageClass}">
          ${!isMyMessage ? `<div class="message-avatar-container">${avatarHtml}</div>` : ''}
          <div class="message-bubble">
            ${chatId.startsWith('group_') && !isMyMessage ? `<div class="sender-name">${senderName}</div>` : ''}
            <div class="message-text">${message.content}</div>
            <div class="message-time">${messageTime}</div>
          </div>
          ${isMyMessage ? `<div class="message-avatar-container">${avatarHtml}</div>` : ''}
        </div>
      `;
    },

    // 构建头像样式字符串
    buildAvatarStyle(avatarUrl, avatarConfig) {
      let style = `background-image: url(${avatarUrl}); background-color: transparent;`;

      // 应用变换配置
      if (avatarConfig && avatarConfig.transform) {
        const transform = avatarConfig.transform;
        const safeScale = Math.max(0.1, Math.min(5, transform.scale || 1));
        const safeX = Math.max(-200, Math.min(200, transform.translateX || 0));
        const safeY = Math.max(-200, Math.min(200, transform.translateY || 0));
        const safeRotation = (transform.rotate || 0) % 360;

        const backgroundSize = `${safeScale * 100}%`;
        const backgroundPositionX = `${50 - safeX * 0.5}%`;
        const backgroundPositionY = `${50 - safeY * 0.5}%`;

        style += ` background-size: ${backgroundSize}; background-position: ${backgroundPositionX} ${backgroundPositionY}; background-repeat: no-repeat;`;

        if (safeRotation !== 0) {
          style += ` transform: rotate(${safeRotation}deg) translateZ(0); transform-origin: center center;`;
        } else {
          style += ` transform: translateZ(0);`;
        }
      } else {
        style +=
          ' background-size: cover; background-position: center; background-repeat: no-repeat; transform: translateZ(0);';
      }

      // 添加图像质量优化
      style +=
        ' image-rendering: -webkit-optimize-contrast; -webkit-backface-visibility: hidden; backface-visibility: hidden; -webkit-transform-style: preserve-3d; transform-style: preserve-3d;';

      return style;
    },

    // 通过联系人名称查找QQ号
    findQQNumberByName(contactName) {
      if (!contactName) {
        return null;
      }

      // 首先检查缓存的映射表
      if (this.contactNameMap && this.contactNameMap[contactName]) {
        return this.contactNameMap[contactName];
      }

      // 🔧 修复：只在映射表未创建且不在创建中时，才尝试创建
      if (
        !this.mappingCreated &&
        !this.isMappingCreating &&
        (!this.contactNameMap || Object.keys(this.contactNameMap).length === 0)
      ) {
        console.log(`🔍 [查找] ${contactName} 未找到，映射表为空，尝试创建映射表...`);
        this.createContactNameMappingSync();

        // 创建后再次检查
        if (this.contactNameMap && this.contactNameMap[contactName]) {
          return this.contactNameMap[contactName];
        }
      }

      // 如果映射表中仍然没有，尝试从头像数据中查找
      const qqNumber = this.findQQNumberFromAvatarData(contactName);
      if (qqNumber) {
        // 将找到的映射添加到缓存中
        if (!this.contactNameMap) {
          this.contactNameMap = {};
        }
        this.contactNameMap[contactName] = qqNumber;
        console.log(`🔍 [缓存] 将 ${contactName} -> ${qqNumber} 添加到映射表`);
        return qqNumber;
      }

      return null;
    },

    // 从头像数据中直接查找QQ号（兜底机制）
    findQQNumberFromAvatarData(contactName) {
      try {
        // 🔧 优化：首先检查已加载的头像数据，避免重复扫描聊天记录
        if (this.avatarData && Object.keys(this.avatarData).length > 0) {
          for (const key of Object.keys(this.avatarData)) {
            if (key.endsWith('_config')) {
              const config = this.avatarData[key];
              if (config && config.contactName === contactName) {
                const qqNumber = key.replace('_config', '');
                console.log(`🔍 [快速查找] 从头像数据找到 ${contactName} -> ${qqNumber}`);
                return qqNumber;
              }
            }
          }
        }

        // 如果头像数据中没有找到，再扫描聊天记录（但限制扫描范围）
        const context = this.getSillyTavernContext();
        if (!context) return null;

        const chatData = context.getContext();
        if (!chatData || !chatData.chat) return null;

        // 只搜索最近的20条聊天记录，减少性能影响
        const searchRange = Math.min(20, chatData.chat.length);
        for (let i = chatData.chat.length - 1; i >= chatData.chat.length - searchRange; i--) {
          const message = chatData.chat[i];
          const messageText = message.mes || '';

          // 查找头像增强数据: [头像增强|QQ号|配置信息]
          const avatarMatches = messageText.matchAll(/\[头像增强\|(\d+)\|([^]]*?)\]/g);
          for (const match of avatarMatches) {
            const [, qqNumber, configData] = match;
            try {
              // 解析配置数据，查找联系人名称
              if (configData.includes(`"contactName":"${contactName}"`)) {
                console.log(`🔍 [聊天扫描] 找到 ${contactName} -> ${qqNumber}`);
                return qqNumber;
              }
            } catch (error) {
              // 忽略解析错误，继续查找
            }
          }
        }

        return null;
      } catch (error) {
        console.error(`❌ 从头像数据查找QQ号失败:`, error);
        return null;
      }
    },

    // 创建联系人名称到QQ号的映射（异步版本）
    async createContactNameMapping() {
      if (this.contactNameMap && Object.keys(this.contactNameMap).length > 0) {
        return; // 已经创建过了
      }

      console.log('🔄 [异步] 创建联系人名称映射...');
      this.contactNameMap = {};

      try {
        // 方法1: 从已提取的联系人数据中获取
        if (window.HQDataExtractor) {
          const contacts = await window.HQDataExtractor.extractQQContacts();
          contacts.forEach(contact => {
            if (contact.name && contact.number) {
              this.contactNameMap[contact.name] = contact.number;
            }
          });
        }

        // 方法2: 从头像增强数据中提取（如果方法1没有足够数据）
        if (Object.keys(this.contactNameMap).length === 0) {
          this.extractContactMappingFromChatData();
        }

        console.log(
          `✅ [异步] 创建联系人名称映射完成，共${Object.keys(this.contactNameMap).length}个映射:`,
          this.contactNameMap,
        );
      } catch (error) {
        console.error('❌ [异步] 创建联系人名称映射失败:', error);
        this.contactNameMap = {};
      }
    },

    // 创建联系人名称到QQ号的映射（同步版本）
    createContactNameMappingSync() {
      // 添加创建锁，避免重复创建
      if (this.isMappingCreating) {
        console.log('🔒 [同步] 映射创建中，跳过重复请求');
        return;
      }

      if (this.contactNameMap && Object.keys(this.contactNameMap).length > 0) {
        console.log(`✅ [同步] 映射表已存在，共${Object.keys(this.contactNameMap).length}个映射`);
        return; // 已经创建过了
      }

      this.isMappingCreating = true;
      console.log('🔄 [同步] 创建联系人名称映射...');
      this.contactNameMap = {};

      try {
        // 直接从聊天数据中提取映射信息
        this.extractContactMappingFromChatData();

        console.log(
          `✅ [同步] 创建联系人名称映射完成，共${Object.keys(this.contactNameMap).length}个映射:`,
          this.contactNameMap,
        );

        // 立即暴露映射表给全局使用
        this.senderNameToQqNumberMap = { ...this.contactNameMap };
        if (window.QQApp) {
          window.QQApp.senderNameToQqNumberMap = this.senderNameToQqNumberMap;
        }

        // 🔧 设置映射表创建完成标记，避免后续重复创建
        this.mappingCreated = true;
      } catch (error) {
        console.error('❌ [同步] 创建联系人名称映射失败:', error);
        this.contactNameMap = {};
      } finally {
        this.isMappingCreating = false;
      }
    },

    // 从聊天数据中提取联系人映射
    extractContactMappingFromChatData() {
      const context = this.getSillyTavernContext();
      if (!context) {
        console.log('❌ [映射提取] SillyTavern上下文不可用');
        return;
      }

      const chatData = context.getContext();
      if (!chatData || !chatData.chat) {
        console.log('❌ [映射提取] 聊天数据不可用');
        return;
      }

      // 遍历最近的聊天记录
      const recentMessages = chatData.chat.slice(-100); // 只查看最近100条消息，提升性能
      let foundMappings = 0;

      recentMessages.forEach((message, index) => {
        const messageText = message.mes || '';

        // 检查是否包含头像增强数据
        if (messageText.includes('[头像增强|')) {
          // 方法1: 提取头像增强数据中的联系人信息
          const avatarMatches = messageText.matchAll(/\[头像增强\|(\d+)\|([^]]*?)\]/g);
          for (const match of avatarMatches) {
            const [fullMatch, qqNumber, configData] = match;

            try {
              // 从配置数据中提取联系人名称
              const contactNameMatch = configData.match(/"contactName":"([^"]+)"/);
              if (contactNameMatch && qqNumber) {
                const contactName = contactNameMatch[1];
                this.contactNameMap[contactName] = qqNumber;
                foundMappings++;
              }
            } catch (error) {
              // 静默处理解析错误
            }
          }
        }

        // 检查是否包含群聊消息
        if (messageText.includes('[群聊消息|')) {
          // 方法3: 从群聊消息中提取发送者与头像的关联
          const groupMsgMatches = messageText.matchAll(/\[群聊消息\|\d+\|([^|]+)\|/g);
          for (const match of groupMsgMatches) {
            const [, sender] = match;

            // 在同一条消息中查找该发送者的头像数据
            const senderAvatarMatch = messageText.match(
              new RegExp(`\\[头像增强\\|(\\d+)\\|[^]]*?"contactName":"${sender}"`),
            );
            if (senderAvatarMatch) {
              const qqNumber = senderAvatarMatch[1];
              this.contactNameMap[sender] = qqNumber;
              foundMappings++;
            }
          }
        }

        // 方法2: 从用户信息标签中提取
        if (messageText.includes('[用户信息|')) {
          const userInfoMatches = messageText.matchAll(/\[用户信息\|([^|]+)\|[^]]*?\]/g);
          for (const match of userInfoMatches) {
            const [, userName] = match;

            // 查找同一条消息中是否有对应的头像增强数据
            const userAvatarMatch = messageText.match(
              new RegExp(`\\[头像增强\\|(\\d+)\\|[^]]*?"contactName":"${userName}"`),
            );
            if (userAvatarMatch) {
              const qqNumber = userAvatarMatch[1];
              this.contactNameMap[userName] = qqNumber;
              foundMappings++;
            }
          }
        }
      });

      console.log(`📊 [映射提取] 从${recentMessages.length}条消息中提取到${foundMappings}个映射关系`);
    },

    // 检查QQ应用是否当前可见
    isQQAppCurrentlyVisible() {
      try {
        // 检查是否在手机界面模式
        const isInPhoneMode = $('#phone_interface').hasClass('show-qq-app-content');

        if (isInPhoneMode) {
          // 手机界面模式：检查手机界面是否显示且QQ应用容器有内容
          const phoneVisible = $('#phone_interface').is(':visible');
          const qqContainerHasContent = $('#phone_interface .qq-app-container').children().length > 0;
          return phoneVisible && qqContainerHasContent;
        } else {
          // 独立模式：检查QQ对话框是否可见
          return $('#chat_history_dialog').is(':visible');
        }
      } catch (error) {
        console.warn('⚠️ 检查QQ应用可见性失败:', error);
        return false;
      }
    },

    // 获取当前历史内容容器
    getCurrentHistoryContent() {
      const isInPhoneMode = $('#phone_interface').hasClass('show-qq-app-content');

      if (isInPhoneMode) {
        return $('#phone_interface .qq-app-container #history_content');
      } else {
        return $('#chat_history_dialog #history_content');
      }
    },

    // 清理实时更新系统
    cleanupRealtimeUpdates() {
      try {
        console.log('🧹 清理QQ应用实时更新系统...');

        if (this.realtimeUpdateTimer) {
          clearTimeout(this.realtimeUpdateTimer);
          this.realtimeUpdateTimer = null;
        }

        // 清除状态检查定时器
        if (this.statusCheckInterval) {
          clearInterval(this.statusCheckInterval);
          this.statusCheckInterval = null;
        }

        // 移除回调
        if (window.HQDataExtractor && this.realtimeUpdateCallback) {
          window.HQDataExtractor.realtimeUpdater.offUpdate(this.realtimeUpdateCallback);
          this.realtimeUpdateCallback = null;
        }

        if (window.HQDataExtractor && window.HQDataExtractor.realtimeUpdater && this.realtimeUpdateEnabled) {
          window.HQDataExtractor.realtimeUpdater.stop();
          this.realtimeUpdateEnabled = false;
        }

        console.log('✅ QQ应用实时更新系统清理完成');
      } catch (error) {
        console.error('⚠️ 清理实时更新系统失败:', error);
      }
    },

    // 设置页面可见性监听
    setupVisibilityListener() {
      // 当页面重新获得焦点时，检查头像数据
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          // 页面变为可见，延迟检查头像数据
          setTimeout(() => {
            this.checkAndRecoverAvatars();
          }, 1000);
        }
      });

      // 窗口获得焦点时也检查
      window.addEventListener('focus', () => {
        setTimeout(() => {
          this.checkAndRecoverAvatars();
        }, 1000);
      });
    },

    // 检查并恢复头像数据
    checkAndRecoverAvatars() {
      const contactCount = Object.keys(this.avatarData).filter(k => !k.endsWith('_config')).length;

      // 如果头像数据为空或很少，尝试恢复
      if (contactCount === 0) {
        console.log('🔄 [自动检查] 检测到头像数据为空，尝试自动恢复');
        this.autoRecoverAvatarData();
      }
    },

    // 初始化头像缓存系统
    initAvatarCache() {
      try {
        // 尝试从localStorage恢复缓存
        const savedCache = localStorage.getItem('qq_avatar_cache');
        if (savedCache) {
          const parsedCache = JSON.parse(savedCache);
          const now = Date.now();
          const cacheAge = now - parsedCache.lastLoadTime;

          // 如果缓存未过期，恢复缓存数据
          if (cacheAge < this.performanceConfig.cacheValidityTime) {
            this.avatarDataCache = parsedCache;
            this.avatarData = { ...parsedCache.data };
            console.log(`📋 [缓存恢复] 从localStorage恢复头像缓存，年龄: ${Math.round(cacheAge / 1000)}秒`);
            return;
          } else {
            console.log(`🗑️ [缓存过期] localStorage中的缓存已过期，年龄: ${Math.round(cacheAge / 1000)}秒`);
          }
        }

        console.log('🔄 [缓存初始化] 未找到有效缓存，将重新加载数据');
      } catch (error) {
        console.error('初始化头像缓存失败:', error);
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
      // 优先从聊天记录加载，确保跨设备一致性
      this.loadAvatarDataFromChat();
      this.loadUserData();
    },

    // 仅加载消息数据，不重新加载头像数据（用于实时更新避免循环）
    async loadMessagesWithoutAvatarReload() {
      try {
        console.log('🔄 [轻量更新] 开始重新加载消息数据...');

        // 不重新创建映射，使用现有的映射数据
        // this.createContactNameMappingSync(); // 移除这行，避免重复调用

        // 重新创建界面
        this.createInterface();

        console.log('✅ [轻量更新] 消息数据重新加载完成');
      } catch (error) {
        console.error('❌ [轻量更新] 加载消息数据失败:', error);
        throw error;
      }
    },

    // 从聊天记录加载头像数据（跨设备兼容）
    loadAvatarDataFromChat() {
      console.log('🔄 [数据加载] 从聊天记录加载头像数据（跨设备模式）');
      this.avatarData = {};
      this.extractAvatarDataFromChatEnhanced();

      const contactCount = Object.keys(this.avatarData).filter(k => !k.endsWith('_config')).length;
      console.log(`🔄 [数据加载] 从聊天记录加载完成，联系人数量: ${contactCount}`);

      // 如果成功加载了数据，更新缓存
      if (contactCount > 0) {
        this.avatarDataCache = {
          data: { ...this.avatarData },
          version: this.avatarDataCache.version + 1,
          lastLoadTime: Date.now(),
          isValid: true,
        };
        this.saveAvatarCacheToStorage();
      }

      // 延迟更新显示，确保DOM已准备好
      setTimeout(() => {
        this.updateAllAvatarDisplaysFromData();
      }, 300);
    },

    // 加载头像数据（增强版）- 添加智能缓存
    loadAvatarDataEnhanced(forceReload = false) {
      try {
        const now = Date.now();
        const cacheAge = now - this.avatarDataCache.lastLoadTime;
        const isExpired = cacheAge > this.performanceConfig.cacheValidityTime;

        // 检查是否可以使用缓存
        if (!forceReload && this.avatarDataCache.isValid && !isExpired) {
          console.log(`📋 [缓存命中] 使用缓存的头像数据，缓存年龄: ${Math.round(cacheAge / 1000)}秒`);
          this.avatarData = { ...this.avatarDataCache.data };

          // 使用缓存数据更新显示
          setTimeout(() => {
            this.updateAllAvatarDisplaysFromData();
          }, 100);
          return;
        }

        console.log('🔄 [数据加载] 开始加载增强头像数据');
        this.avatarData = {};
        this.extractAvatarDataFromChatEnhanced();

        // 更新缓存
        this.avatarDataCache = {
          data: { ...this.avatarData },
          version: this.avatarDataCache.version + 1,
          lastLoadTime: now,
          isValid: true,
        };

        // 保存缓存到localStorage
        this.saveAvatarCacheToStorage();

        console.log(
          `🔄 [数据加载] 数据提取完成，联系人数量: ${
            Object.keys(this.avatarData).filter(k => !k.endsWith('_config')).length
          }`,
        );

        // 加载完成后，更新所有头像显示
        setTimeout(() => {
          this.updateAllAvatarDisplaysFromData();
        }, 500);
      } catch (error) {
        console.error('加载增强头像数据失败:', error);
        this.avatarData = {};
        this.avatarDataCache.isValid = false;
      }
    },

    // 使缓存失效（当头像被修改时调用）
    invalidateAvatarCache() {
      console.log('🗑️ [缓存管理] 头像缓存已失效');
      this.avatarDataCache.isValid = false;
      // 清除localStorage中的缓存
      this.clearAvatarCacheFromStorage();
    },

    // 保存缓存到localStorage
    saveAvatarCacheToStorage() {
      try {
        localStorage.setItem('qq_avatar_cache', JSON.stringify(this.avatarDataCache));
        console.log('💾 [缓存保存] 头像缓存已保存到localStorage');
      } catch (error) {
        console.error('保存头像缓存失败:', error);
      }
    },

    // 清除localStorage中的缓存
    clearAvatarCacheFromStorage() {
      try {
        localStorage.removeItem('qq_avatar_cache');
        console.log('🗑️ [缓存清理] localStorage中的头像缓存已清除');
      } catch (error) {
        console.error('清除头像缓存失败:', error);
      }
    },

    // 手动刷新头像数据（供用户调用）
    refreshAvatarData() {
      console.log('🔄 [手动刷新] 强制重新加载所有头像数据');
      this.invalidateAvatarCache();
      this.loadAvatarDataEnhanced(true); // 强制重新加载
    },

    // 获取缓存状态信息（调试用）
    getCacheStatus() {
      const now = Date.now();
      const cacheAge = now - this.avatarDataCache.lastLoadTime;
      const isExpired = cacheAge > this.performanceConfig.cacheValidityTime;

      return {
        isValid: this.avatarDataCache.isValid,
        version: this.avatarDataCache.version,
        ageSeconds: Math.round(cacheAge / 1000),
        isExpired,
        contactCount: Object.keys(this.avatarDataCache.data).filter(k => !k.endsWith('_config')).length,
      };
    },

    // 调试头像数据状态
    debugAvatarData() {
      console.log('=== 头像数据调试信息 ===');
      console.log('当前 avatarData:', this.avatarData);
      console.log('缓存状态:', this.getCacheStatus());

      // 检查有变换配置的联系人
      const contactsWithTransform = [];
      Object.keys(this.avatarData).forEach(key => {
        if (key.endsWith('_config')) {
          const qqNumber = key.replace('_config', '');
          const config = this.avatarData[key];
          if (config && config.transform) {
            contactsWithTransform.push({
              qqNumber,
              transform: config.transform,
              url: this.avatarData[qqNumber],
            });
          }
        }
      });

      console.log('有变换配置的联系人:', contactsWithTransform);

      // 检查localStorage缓存
      let localStorageCache = null;
      try {
        const savedCache = localStorage.getItem('qq_avatar_cache');
        if (savedCache) {
          localStorageCache = JSON.parse(savedCache);
          console.log('localStorage缓存:', localStorageCache);
        } else {
          console.log('localStorage缓存: 无');
        }
      } catch (error) {
        console.log('localStorage缓存读取失败:', error);
      }

      // 检查DOM中的头像元素
      const avatarElements = $('.custom-avatar').length;
      const transformedElements = $('.custom-avatar[style*="transform"]').length;
      console.log(`DOM中的头像元素数量: ${avatarElements}`);
      console.log(`应用变换效果的头像元素数量: ${transformedElements}`);

      return {
        avatarData: this.avatarData,
        cacheStatus: this.getCacheStatus(),
        localStorageCache,
        contactsWithTransform,
        avatarElements,
        transformedElements,
      };
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

      // 输出提取结果摘要
      const contactCount = Object.keys(this.avatarData).filter(k => !k.endsWith('_config')).length;
      console.log(`🔍 [数据提取] 提取完成，共找到 ${contactCount} 个联系人的头像数据`);
      if (contactCount > 0) {
        console.log(
          '🔍 [数据提取] 联系人QQ号列表:',
          Object.keys(this.avatarData).filter(k => !k.endsWith('_config')),
        );
      }
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
      // 提取增强格式的头像 - 创建新的正则表达式实例
      const enhancedRegex = /\[头像增强\|(\d+)\|([^\]]+)\]/g;
      let match;
      let foundEnhanced = false;

      while ((match = enhancedRegex.exec(text)) !== null) {
        const [, qqNumber, configJson] = match;
        try {
          const avatarConfig = JSON.parse(configJson);
          this.avatarData[qqNumber] = avatarConfig.url;
          this.avatarData[`${qqNumber}_config`] = avatarConfig;
          foundEnhanced = true;

          console.log('🔍 [数据读取] 提取到头像增强配置:', {
            qqNumber,
            url: avatarConfig.url.substring(0, 50) + '...',
            hasTransform: !!avatarConfig.transform,
          });
        } catch (error) {
          console.error(`解析QQ号 ${qqNumber} 的头像配置失败:`, error);
        }
      }

      // 兼容旧格式 - 只有在没有找到增强格式时才处理旧格式
      if (!foundEnhanced) {
        this.extractAvatarsFromText(text);
      }
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
      // 创建新的正则表达式实例，避免全局状态问题
      const avatarRegex = /\[头像\|(\d+)\|([^\]]+)\]/g;
      let match;
      while ((match = avatarRegex.exec(text)) !== null) {
        const [, qqNumber, avatarUrl] = match;
        this.avatarData[qqNumber] = avatarUrl;
        // 静默提取头像数据
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

    // 获取头像URL - 移除过多调试日志
    getAvatarUrl(qqNumber) {
      // 如果头像数据不存在，自动尝试恢复
      if (!this.avatarData[qqNumber]) {
        this.autoRecoverAvatarData();
      }

      return this.avatarData[qqNumber] || '';
    },

    // 自动恢复头像数据 - 添加频率限制
    autoRecoverAvatarData() {
      // 检查是否已经在恢复过程中，避免重复执行
      if (this.isRecovering) {
        return;
      }

      // 添加频率限制，避免过度执行
      const now = Date.now();
      const lastRecoveryTime = this.lastAutoRecoveryTime || 0;
      const recoveryInterval = 3000; // 3秒内最多恢复一次

      if (now - lastRecoveryTime < recoveryInterval) {
        return;
      }

      this.isRecovering = true;
      this.lastAutoRecoveryTime = now;
      console.log('🔄 [自动恢复] 检测到头像数据缺失，开始自动恢复');

      // 强制重新提取数据，不依赖缓存
      this.avatarData = {};
      this.extractAvatarDataFromChatEnhanced();

      // 恢复完成
      this.isRecovering = false;

      const contactCount = Object.keys(this.avatarData).filter(k => !k.endsWith('_config')).length;
      if (contactCount > 0) {
        console.log(`✅ [自动恢复] 成功恢复 ${contactCount} 个联系人的头像数据`);
      } else {
        console.log('⚠️ [自动恢复] 未找到头像数据，可能聊天记录中没有头像信息');
      }
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
    updateUserAvatarEnhanced(forceUpdate = false) {
      // 清除之前的定时器
      if (this.updateTimers.userAvatar) {
        clearTimeout(this.updateTimers.userAvatar);
      }

      // 防抖处理
      this.updateTimers.userAvatar = setTimeout(() => {
        this.performUserAvatarUpdate(forceUpdate);
      }, 100);
    },

    // 执行用户头像更新
    performUserAvatarUpdate(forceUpdate = false) {
      const avatarConfig = this.getUserAvatarConfig();
      const currentState = JSON.stringify({
        avatar: this.userData.avatar,
        config: avatarConfig,
      });

      // 减少状态缓存的严格性，允许更多的更新
      if (
        !forceUpdate &&
        this.lastUpdateStates.userAvatar === currentState &&
        Date.now() - (this.lastUpdateTime?.userAvatar || 0) < 1000
      ) {
        console.log('🔄 用户头像状态未改变且更新间隔过短，跳过更新');
        return;
      }

      console.log('🔄 执行用户头像更新');
      this.lastUpdateStates.userAvatar = currentState;
      this.lastUpdateTime.userAvatar = Date.now();

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

          // 图像质量优化 - 提升清晰度
          'image-rendering': '-webkit-optimize-contrast',
          '-webkit-backface-visibility': 'hidden',
          'backface-visibility': 'hidden',
          '-webkit-transform-style': 'preserve-3d',
          'transform-style': 'preserve-3d',
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
            css['transform'] = `rotate(${safeRotation}deg) translateZ(0)`;
            css['transform-origin'] = 'center center';
          } else {
            css['transform'] = 'translateZ(0)';
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

    // 从已加载的数据更新所有头像显示（优化版）
    updateAllAvatarDisplaysFromData() {
      console.log('🔄 [数据应用] 从已加载数据更新所有头像显示');

      // 减少调试信息输出，避免控制台刷屏
      if (this.debugMode) {
        console.log('🔍 [数据应用] 当前avatarData:', this.avatarData);
        console.log('🔍 [数据应用] 当前userData:', this.userData);
      }

      // 收集需要更新的联系人，进行批量处理
      const contactsToUpdate = [];
      Object.keys(this.avatarData).forEach(key => {
        if (key.endsWith('_config')) {
          const qqNumber = key.replace('_config', '');
          const avatarConfig = this.avatarData[key];
          const avatarUrl = this.avatarData[qqNumber];

          if (avatarUrl && avatarConfig) {
            contactsToUpdate.push({ qqNumber, avatarConfig });
          }
        }
      });

      // 批量更新联系人头像，减少日志输出
      if (contactsToUpdate.length > 0) {
        console.log(`🔄 [数据应用] 批量更新 ${contactsToUpdate.length} 个联系人头像`);
        this.batchUpdateContactAvatars(contactsToUpdate);
      }

      // 更新用户头像
      if (this.userData.avatarConfig) {
        console.log('🔄 [数据应用] 更新用户头像');
        this.updateUserAvatarEnhanced();
      }

      // 更新好友管理界面中的头像显示
      if (window.QQDataManager && typeof window.QQDataManager.updateFriendManagerAvatars === 'function') {
        console.log('🔄 [数据应用] 更新好友管理界面头像');
        window.QQDataManager.updateFriendManagerAvatars();
      }
    },

    // 批量更新联系人头像
    batchUpdateContactAvatars(contactsToUpdate) {
      // 使用 setTimeout 分批处理，避免一次性处理太多导致页面卡顿
      const batchSize = 3; // 每批处理3个联系人
      let currentIndex = 0;

      const processBatch = () => {
        const batch = contactsToUpdate.slice(currentIndex, currentIndex + batchSize);

        batch.forEach(({ qqNumber, avatarConfig }) => {
          if (this.debugMode) {
            console.log(`🔄 [批量处理] 更新联系人 ${qqNumber} 的头像`);
          }
          this.updateAllAvatarDisplaysEnhanced(qqNumber, avatarConfig);
        });

        currentIndex += batchSize;

        // 如果还有更多联系人需要处理，继续下一批
        if (currentIndex < contactsToUpdate.length) {
          setTimeout(processBatch, 50); // 50ms间隔，避免阻塞UI
        } else {
          console.log('✅ [批量处理] 所有联系人头像更新完成');
        }
      };

      processBatch();
    },

    // 强制刷新所有头像显示（清除缓存）
    forceRefreshAllAvatars() {
      console.log('🔄 强制刷新所有头像显示');

      // 清除所有缓存状态
      this.lastUpdateStates = {
        userAvatar: null,
        contactAvatars: {},
      };
      this.lastUpdateTime = {
        userAvatar: 0,
        contactAvatars: {},
      };

      // 重新加载数据
      this.loadAvatarDataEnhanced();

      // 强制更新显示
      setTimeout(() => {
        this.updateAllAvatarDisplaysFromData();
      }, 200);
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

      // 注释：不再移动手机按钮，让 phone-interface.js 负责创建和管理
      // 手机按钮现在由统一的 phone-shell 系统管理
      console.log('✅ QQ应用界面创建完成，手机按钮由 phone-interface.js 管理');

      const $historyDialog = $(`
                <div id="chat_history_dialog" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90vw; height: 90vh;z-index: 1000; flex-direction: column;border-radius: 10px;overflow: hidden;">
                    <div style="background: #ffffff; color: black; width: 90%; max-width: 600px; height: 90%; margin: auto; border-radius: 10px; display: flex; flex-direction: column;">


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
                                <button class="qq-home-palette-btn" id="new_qq_home_palette_btn" title="设置QQ主页背景">🎨</button>
                                <button class="home-btn" id="home_btn_main" title="返回手机首页">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/>
                                    <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2"/>
                                  </svg>
                                </button>
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

      // QQ消息按钮点击事件 - 使用事件委托，等待 phone-interface.js 创建按钮
      $(document).on('click', '#chat_history_btn', function () {
        console.log('📱 手机按钮被点击，但QQ应用不再直接处理此事件');
        // 注释：手机按钮现在由 phone-interface.js 统一管理
        // self.show();
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

      // 新的QQ主页背景设置按钮点击事件
      $(document).on('click', '#new_qq_home_palette_btn', function (e) {
        e.stopPropagation();
        console.log('🎨 点击了新的QQ主页调色板按钮');

        // 检查美化应用是否可用
        if (window.WallpaperApp && typeof window.WallpaperApp.openQQHomeEditor === 'function') {
          console.log('✅ 调用美化应用的QQ主页编辑器');
          window.WallpaperApp.openQQHomeEditor();
        } else {
          console.error('❌ WallpaperApp未找到或openQQHomeEditor方法不存在');
          console.log(
            '🔍 可用的WallpaperApp方法:',
            window.WallpaperApp ? Object.keys(window.WallpaperApp) : 'WallpaperApp不存在',
          );
        }
      });

      // 聊天背景设置按钮点击事件
      $(document).on('click', '.chat-wallpaper-btn', function (e) {
        e.stopPropagation();
        const chatId = $(this).data('chat-id');
        console.log('点击了聊天背景设置按钮，聊天ID:', chatId);
        if (window.WallpaperApp && typeof window.WallpaperApp.openQQChatEditor === 'function') {
          window.WallpaperApp.openQQChatEditor(chatId);
        } else {
          console.error('WallpaperApp未找到或openQQChatEditor方法不存在');
        }
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
              // 直接设置滚动位置，无动画效果
              $historyContent[0].scrollTop = $historyContent[0].scrollHeight;
            }
          }, 100); // 减少延迟
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

      // 智能加载头像数据 - 优先使用缓存
      console.log('🔄 主界面显示时智能加载头像数据');
      setTimeout(() => {
        this.loadAvatarDataEnhanced(false); // 不强制重新加载
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

      // 智能加载头像数据 - 优先使用缓存
      console.log('🔄 智能加载头像数据以确保配置同步');
      this.loadAvatarDataEnhanced(false); // 不强制重新加载，优先使用缓存

      // 确保用户头像和角色头像都正确显示
      setTimeout(() => {
        console.log('🔄 更新手机界面中的所有头像显示');
        this.updateUserDisplay();
        // 更新所有角色头像显示
        this.updateAllAvatarDisplaysFromData();
      }, 200); // 减少延迟时间
    },

    // 隐藏QQ应用
    hide: function () {
      console.log('正在隐藏QQ应用...');

      // 清理实时更新系统
      this.cleanupRealtimeUpdates();

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

    // 加载消息（完整版，包含头像数据加载）
    loadMessages: async function () {
      try {
        console.log('📊 开始从聊天记录抓取数据...');

        // 每次加载消息时，智能加载头像数据（优先使用缓存以保持变换效果）
        this.loadAvatarDataEnhanced(false); // 不强制重新加载，保持已有的头像变换配置
        this.loadUserData();

        return this.loadMessagesCore();
      } catch (error) {
        console.error('加载消息失败:', error);
      }
    },

    // 加载消息（轻量版，不重新加载头像数据）
    loadMessagesWithoutAvatarReload: async function () {
      try {
        console.log('📊 [轻量更新] 开始更新聊天消息...');

        // 不重新加载头像数据，使用现有缓存
        return this.loadMessagesCore();
      } catch (error) {
        console.error('轻量更新消息失败:', error);
      }
    },

    // 消息加载核心逻辑
    loadMessagesCore: async function () {
      try {
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

        // 将映射表暴露给全局，供数据提取器使用
        this.senderNameToQqNumberMap = senderNameToQqNumberMap;
        window.QQApp = window.QQApp || {};
        window.QQApp.senderNameToQqNumberMap = senderNameToQqNumberMap;

        console.log('[AvatarDebug] Created senderNameToQqNumberMap:', senderNameToQqNumberMap);
        console.log('🔗 [映射暴露] 映射表已暴露给数据提取器使用');

        // 创建联系人HTML - 使用新的包装容器结构
        contacts.forEach(contact => {
          const contactMessages = messages.filter(msg => msg.qqNumber === contact.number);
          const lastMessage = contactMessages.length > 0 ? contactMessages[contactMessages.length - 1] : null;
          const lastMessageText = lastMessage ? lastMessage.content : '暂无消息';
          const lastMessageTime = lastMessage ? lastMessage.time : '';

          // 获取头像URL和配置
          const avatarUrl = this.getAvatarUrl(contact.number);
          const avatarConfig = this.avatarData[`${contact.number}_config`];

          // 构建头像样式，包含变换效果
          let avatarStyle = '';
          if (avatarUrl) {
            avatarStyle = `background-image: url(${avatarUrl});`;

            // 应用变换配置
            if (avatarConfig && avatarConfig.transform) {
              const transform = avatarConfig.transform;
              const safeScale = Math.max(0.1, Math.min(5, transform.scale || 1));
              const safeX = Math.max(-200, Math.min(200, transform.translateX || 0));
              const safeY = Math.max(-200, Math.min(200, transform.translateY || 0));
              const safeRotation = (transform.rotate || 0) % 360;

              const backgroundSize = `${safeScale * 100}%`;
              const backgroundPositionX = `${50 - safeX * 0.5}%`;
              const backgroundPositionY = `${50 - safeY * 0.5}%`;

              avatarStyle += ` background-size: ${backgroundSize}; background-position: ${backgroundPositionX} ${backgroundPositionY}; background-repeat: no-repeat;`;

              if (safeRotation !== 0) {
                avatarStyle += ` transform: rotate(${safeRotation}deg); transform-origin: center center;`;
              }
            } else {
              avatarStyle += ' background-size: cover; background-position: center;';
            }
          } else {
            avatarStyle =
              'background: #666; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;';
          }

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


                                <div class="chat-header">
                                    <button class="back-to-main-list-btn">
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2"/>
                                      </svg>
                                    </button>
                                    <div class="chat-title">
                                        <div>${contact.name}</div>
                                        <div class="contact-status-qq">QQ: ${contact.number}</div>
                                    </div>
                                    <button class="chat-wallpaper-btn" data-chat-id="${
                                      contact.number
                                    }" title="设置聊天背景">🎨</button>
                                    <button class="home-btn chat-home-btn" title="返回手机首页">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/>
                                        <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2"/>
                                      </svg>
                                    </button>
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
              const contactAvatarConfig = this.avatarData[`${contact.number}_config`];

              let avatarDisplay = '';
              let messageAvatarStyle = '';

              if (contactAvatarUrl) {
                avatarDisplay = `<img src="${contactAvatarUrl}" alt="avatar">`;
                messageAvatarStyle = `background-image: url(${contactAvatarUrl});`;

                // 应用变换配置到消息头像
                if (contactAvatarConfig && contactAvatarConfig.transform) {
                  const transform = contactAvatarConfig.transform;
                  const safeScale = Math.max(0.1, Math.min(5, transform.scale || 1));
                  const safeX = Math.max(-200, Math.min(200, transform.translateX || 0));
                  const safeY = Math.max(-200, Math.min(200, transform.translateY || 0));
                  const safeRotation = (transform.rotate || 0) % 360;

                  const backgroundSize = `${safeScale * 100}%`;
                  const backgroundPositionX = `${50 - safeX * 0.5}%`;
                  const backgroundPositionY = `${50 - safeY * 0.5}%`;

                  messageAvatarStyle += ` background-size: ${backgroundSize}; background-position: ${backgroundPositionX} ${backgroundPositionY}; background-repeat: no-repeat; background-color: transparent; color: transparent; font-size: 0;`;

                  if (safeRotation !== 0) {
                    messageAvatarStyle += ` transform: rotate(${safeRotation}deg); transform-origin: center center;`;
                  }
                } else {
                  messageAvatarStyle +=
                    ' background-size: cover; background-position: center; background-color: transparent; color: transparent; font-size: 0;';
                }
              } else {
                avatarDisplay = contact.name.charAt(0);
                messageAvatarStyle = 'background-color: #ccc;';
              }

              messageHtml = `
                                <div class="custom-message custom-received">
                                    <div class="message-avatar received-avatar" style="${messageAvatarStyle}">${
                contactAvatarUrl ? '' : avatarDisplay
              }</div>
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


                                <div class="chat-header">
                                    <button class="back-to-main-list-btn">
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2"/>
                                      </svg>
                                    </button>
                                    <div class="chat-title">
                                        <div>${group.name}</div>
                                        <div class="contact-status-qq">群号: ${group.id}</div>
                                    </div>
                                    <button class="add-member-btn" data-group-id="${group.id}" data-group-name="${
            group.name
          }">+</button>
                                    <button class="chat-wallpaper-btn" data-chat-id="${
                                      group.id
                                    }" title="设置聊天背景">🎨</button>
                                    <button class="home-btn chat-home-btn" title="返回手机首页">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/>
                                        <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2"/>
                                      </svg>
                                    </button>
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
              const isUserMessage =
                msg.isUser || msg.isMyMessage || senderName === this.userData.name || senderName === '我';

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
                const senderAvatarConfig = senderQQ ? this.avatarData[`${senderQQ}_config`] : null;
                // console.log(`[AvatarDebug] For group sender "${msg.sender}" (resolved QQ: ${senderQQ}), got avatar URL: ${senderAvatarUrl}`); // Kept for critical debug
                let groupAvatarDisplay = '';
                let avatarStyle = '';

                if (senderAvatarUrl) {
                  groupAvatarDisplay = `<img src="${senderAvatarUrl}" alt="avatar">`;
                  avatarStyle = `background-image: url(${senderAvatarUrl});`;

                  // 应用变换配置到群聊消息头像
                  if (senderAvatarConfig && senderAvatarConfig.transform) {
                    const transform = senderAvatarConfig.transform;
                    const safeScale = Math.max(0.1, Math.min(5, transform.scale || 1));
                    const safeX = Math.max(-200, Math.min(200, transform.translateX || 0));
                    const safeY = Math.max(-200, Math.min(200, transform.translateY || 0));
                    const safeRotation = (transform.rotate || 0) % 360;

                    const backgroundSize = `${safeScale * 100}%`;
                    const backgroundPositionX = `${50 - safeX * 0.5}%`;
                    const backgroundPositionY = `${50 - safeY * 0.5}%`;

                    avatarStyle += ` background-size: ${backgroundSize}; background-position: ${backgroundPositionX} ${backgroundPositionY}; background-repeat: no-repeat; background-color: transparent; color: transparent; font-size: 0;`;

                    if (safeRotation !== 0) {
                      avatarStyle += ` transform: rotate(${safeRotation}deg); transform-origin: center center;`;
                    }
                  } else {
                    avatarStyle +=
                      ' background-size: cover; background-position: center; background-color: transparent; color: transparent; font-size: 0;';
                  }
                } else {
                  groupAvatarDisplay = senderName.charAt(0);
                  avatarStyle = 'background-color: #ddd; color: #666;';
                }

                let messageHtml = `
                  <div class="custom-message custom-received group-message">
                      <div class="message-avatar group-avatar" style="${avatarStyle}">${
                  senderAvatarUrl ? '' : groupAvatarDisplay
                }</div>
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

        // 消息加载完成后，确保头像变换效果正确应用
        setTimeout(() => {
          this.updateUserDisplay();

          // 调试：检查头像数据状态
          console.log('🔍 [调试] 检查消息加载后的头像数据状态');
          this.debugAvatarData();

          // 重新应用所有头像变换效果，确保刷新后头像保持修改状态
          console.log('🔄 重新应用所有头像变换效果');
          this.updateAllAvatarDisplaysFromData();

          // 额外延迟后再次检查，确保变换效果已应用
          setTimeout(() => {
            console.log('🔍 [验证] 检查变换效果应用后的状态');
            const transformedElements = $('.custom-avatar[style*="transform"]').length;
            console.log(`✅ 应用变换效果的头像元素数量: ${transformedElements}`);
          }, 300);
        }, 300); // 增加延迟时间，确保DOM完全更新

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
              // 直接设置滚动位置，无动画效果
              $cont[0].scrollTop = $cont[0].scrollHeight;
            }
          }, 50);
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
              // 直接设置滚动位置，无动画效果
              $cont[0].scrollTop = $cont[0].scrollHeight;
            }
          }, 50);
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

          // 🎯 首次打开聊天页面时直接定位到底部（无动画）
          setTimeout(() => {
            const $messagesContainer = $chatPage.find('.chat-messages');
            if ($messagesContainer.length > 0) {
              // 直接设置滚动位置，无动画效果
              $messagesContainer[0].scrollTop = $messagesContainer[0].scrollHeight;
              console.log('📜 [首次打开] 已定位到消息底部');
            }
          }, 50); // 减少延迟
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

          // 🎯 首次打开群聊页面时直接定位到底部（无动画）
          setTimeout(() => {
            const $messagesContainer = $chatPage.find('.chat-messages');
            if ($messagesContainer.length > 0) {
              // 直接设置滚动位置，无动画效果
              $messagesContainer[0].scrollTop = $messagesContainer[0].scrollHeight;
              console.log('📜 [首次打开] 已定位到群聊底部');
            }
          }, 50); // 减少延迟
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

              // 🎯 发送消息后直接定位到新消息位置
              const $messagesContainer = $sendBtn.closest('.chat-page').find('.chat-messages');
              setTimeout(() => {
                $messagesContainer[0].scrollTop = $messagesContainer[0].scrollHeight;
                console.log('📜 [发送消息] 已定位到新消息位置');
              }, 50);

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
      $('#chat_history_dialog .dialog-head').addClass('qq-decoration-hidden');
      $('.qq-app-container .dialog-head').addClass('qq-decoration-hidden');

      // 添加隐藏类
      $('body').addClass('chat-detail-active');
    },

    // 显示QQ主页装饰栏
    showMainPageDecorations: function () {
      console.log('显示QQ主页装饰栏');

      // 使用CSS类来显示，保持原有的display属性
      $('.dialog-head').removeClass('qq-decoration-hidden');
      $('#chat_history_dialog .dialog-head').removeClass('qq-decoration-hidden');
      $('.qq-app-container .dialog-head').removeClass('qq-decoration-hidden');

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

      // 更新缓存中的用户数据而不是使其失效
      if (this.avatarDataCache.isValid) {
        // 用户数据不存储在avatarData中，但我们需要触发缓存更新以保持一致性
        this.avatarDataCache.lastLoadTime = Date.now();
        this.saveAvatarCacheToStorage();
        console.log('💾 [缓存更新] 用户头像配置已更新');
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

      // 更新缓存数据而不是使其失效
      if (this.avatarDataCache.isValid) {
        this.avatarDataCache.data[qqNumber] = this.avatarData[qqNumber];
        if (this.avatarData[`${qqNumber}_config`]) {
          this.avatarDataCache.data[`${qqNumber}_config`] = this.avatarData[`${qqNumber}_config`];
        }
        this.saveAvatarCacheToStorage();
        console.log(`💾 [缓存更新] 角色 ${qqNumber} 的头像配置已更新到缓存`);
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
        if (this.debugMode) {
          console.log(`🔄 角色 ${qqNumber} 头像状态未改变，跳过更新`);
        }
        return;
      }

      if (this.debugMode) {
        console.log(`🔄 执行角色 ${qqNumber} 头像更新`);
      }
      this.lastUpdateStates.contactAvatars[qqNumber] = currentState;

      this.updateContactAvatarsEnhanced(qqNumber, avatarUrl, transform);
      // 延迟更新消息头像，避免同时进行大量DOM操作
      setTimeout(() => {
        this.updateMessageAvatarsEnhanced(qqNumber, avatarUrl, transform);
      }, 50);
    },

    // 切换调试模式
    toggleDebugMode() {
      this.debugMode = !this.debugMode;
      console.log(`🔧 调试模式已${this.debugMode ? '开启' : '关闭'}`);
      return this.debugMode;
    },

    // 更新联系人头像（增强版）
    updateContactAvatarsEnhanced(qqNumber, avatarUrl, transform) {
      const $elements = $(`.custom-avatar-${qqNumber}`);
      $elements.each(function (index) {
        const $element = $(this);

        if (avatarUrl) {
          let css = {
            'background-image': `url(${avatarUrl})`,

            // 图像质量优化 - 提升清晰度
            'image-rendering': '-webkit-optimize-contrast',
            '-webkit-backface-visibility': 'hidden',
            'backface-visibility': 'hidden',
            '-webkit-transform-style': 'preserve-3d',
            'transform-style': 'preserve-3d',
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
              css['transform'] = `rotate(${safeRotation}deg) translateZ(0)`;
              css['transform-origin'] = 'center center';
            } else {
              css['transform'] = 'translateZ(0)';
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

    // 更新消息头像（增强版）- 优化性能，添加批量处理
    updateMessageAvatarsEnhanced(qqNumber, avatarUrl, transform) {
      // 检查是否需要更新（避免重复更新）
      const updateKey = `${qqNumber}_${avatarUrl}_${JSON.stringify(transform)}`;
      if (this.lastMessageAvatarUpdate === updateKey) {
        return;
      }
      this.lastMessageAvatarUpdate = updateKey;

      // 使用精确的选择器，只更新特定QQ号的头像
      const targetSelector = `.message-avatar.received-avatar[data-qq-number="${qqNumber}"]`;
      const $targetElements = $(targetSelector);

      if ($targetElements.length > 0) {
        this.batchUpdateMessageAvatars($targetElements, qqNumber, avatarUrl, transform);
        console.log(`✅ 更新了 ${$targetElements.length} 个角色 ${qqNumber} 的消息头像`);
      }
    },

    // 批量更新消息头像元素
    batchUpdateMessageAvatars(elements, qqNumber, avatarUrl, transform) {
      // 准备CSS样式
      let css = {
        'background-image': `url(${avatarUrl})`,
        'background-color': 'transparent',
        color: 'transparent',
        'font-size': '0',
        display: 'block',

        // 图像质量优化 - 提升清晰度
        'image-rendering': '-webkit-optimize-contrast',
        '-webkit-backface-visibility': 'hidden',
        'backface-visibility': 'hidden',
        '-webkit-transform-style': 'preserve-3d',
        'transform-style': 'preserve-3d',
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
          css['transform'] = `rotate(${safeRotation}deg) translateZ(0)`;
          css['transform-origin'] = 'center center';
        } else {
          css['transform'] = 'translateZ(0)';
        }

        // 变换效果已应用
      } else {
        // 默认样式
        css['background-size'] = 'cover';
        css['background-position'] = 'center';
      }

      // 使用 requestAnimationFrame 进行批量DOM更新，提高性能
      requestAnimationFrame(() => {
        elements.forEach($element => {
          $element.css(css).text('');
        });
      });
    },
  };

  // 当DOM加载完成时初始化
  $(document).ready(function () {
    console.log('🚀 QQ应用模块初始化完成');

    // 导出到全局
    window.QQApp = QQApp;

    // 延迟初始化，确保聊天记录完全加载
    setTimeout(() => {
      console.log('🔄 [延迟初始化] 开始初始化QQ应用');
      if (typeof QQApp.init === 'function') {
        QQApp.init();
      }

      // 应用图像质量优化
      setTimeout(() => {
        if (typeof window.applyAvatarQualityOptimization === 'function') {
          window.applyAvatarQualityOptimization();
        }

        // 确保实时更新系统已启动
        setTimeout(() => {
          if (window.QQApp && !window.QQApp.realtimeUpdateEnabled) {
            console.log('🔄 [延迟启动] 启动实时更新系统...');
            window.QQApp.setupRealtimeUpdates();
          }
        }, 200);

        // 触发QQ应用加载完成事件，用于统一按钮样式刷新
        console.log('🎉 QQ应用初始化完成，触发事件');
        $(document).trigger('qq-app-loaded');

        // 最终检查实时更新系统
        setTimeout(() => {
          if (window.HQDataExtractor && window.QQApp) {
            const isRealtimeActive = window.HQDataExtractor.realtimeUpdater.isMonitoring;
            const isQQRealtimeEnabled = window.QQApp.realtimeUpdateEnabled;

            console.log('🔍 [最终检查] 实时更新状态:', {
              HQDataExtractor监听中: isRealtimeActive,
              QQ应用实时更新已启用: isQQRealtimeEnabled,
            });

            if (!isRealtimeActive || !isQQRealtimeEnabled) {
              console.log('⚠️ [最终检查] 实时更新未正常启动，强制启动...');
              if (typeof window.forceStartRealtimeUpdates === 'function') {
                window.forceStartRealtimeUpdates();
              }
            } else {
              console.log('✅ [最终检查] 实时更新系统运行正常');
            }
          }
        }, 1000);
      }, 500);
    }, 1000); // 延迟1秒，确保聊天记录加载完成
  });

  // 导出到全局
  window['QQApp'] = QQApp;

  // 添加全局调试函数
  window.debugQQAvatars = function () {
    if (window.QQApp) {
      return window.QQApp.debugAvatarData();
    } else {
      console.error('QQ应用未加载');
      return null;
    }
  };

  // 添加群聊头像调试函数
  window.debugGroupAvatars = function () {
    if (!window.QQApp) {
      console.error('QQ应用未加载');
      return;
    }

    console.log('=== 群聊头像调试信息 ===');
    console.log('映射表 contactNameMap:', window.QQApp.contactNameMap);
    console.log('映射表 senderNameToQqNumberMap:', window.QQApp.senderNameToQqNumberMap);
    console.log(
      '头像数据 avatarData:',
      Object.keys(window.QQApp.avatarData).filter(k => !k.endsWith('_config')),
    );

    // 检查当前页面的消息头像
    const messageAvatars = $('.message-avatar.received-avatar');
    console.log(`找到 ${messageAvatars.length} 个接收消息头像`);

    messageAvatars.each(function (index) {
      const $this = $(this);
      const qqNumber = $this.data('qq-number');
      const sender = $this.data('sender');
      const backgroundImage = $this.css('background-image');

      console.log(`头像 ${index + 1}: 发送者=${sender}, QQ号=${qqNumber}, 背景图=${backgroundImage ? '有' : '无'}`);
    });
  };

  // 添加实时更新调试函数
  window.debugRealtimeUpdates = function () {
    console.log('=== 实时更新系统调试信息 ===');

    if (!window.HQDataExtractor) {
      console.error('❌ HQDataExtractor 未加载');
      return;
    }

    const updater = window.HQDataExtractor.realtimeUpdater;

    // 使用新的状态检查方法
    if (updater.checkAndFixStatus) {
      const status = updater.checkAndFixStatus();
      console.log('详细状态信息:', status);
    } else {
      console.log('实时更新器状态:');
      console.log('- 已初始化:', updater.isInitialized);
      console.log('- 正在监听:', updater.isMonitoring);
      console.log('- 回调数量:', updater.updateCallbacks.size);
      console.log('- 最后消息数量:', updater.lastMessageCount);
      console.log('- 最后聊天ID:', updater.lastChatId);
    }

    if (window.QQApp) {
      console.log('QQ应用实时更新状态:');
      console.log('- 实时更新已启用:', window.QQApp.realtimeUpdateEnabled);
      console.log('- 正在更新中:', window.QQApp.isUpdating);
      console.log('- 状态检查定时器:', !!window.QQApp.statusCheckInterval);
    }

    // 检查性能状态
    console.log('性能状态:');
    console.log('- 手机插件可见:', updater.isMobilePluginVisible ? updater.isMobilePluginVisible() : '未知');
    console.log('- 页面可见:', !document.hidden);
    console.log('- 定时器运行:', !!updater.checkInterval);

    // 手动触发一次更新测试
    console.log('🧪 手动触发更新测试...');
    if (updater.forceUpdate) {
      updater.forceUpdate();
    }
  };

  window.refreshQQAvatars = function () {
    if (window.QQApp) {
      console.log('🔄 手动刷新QQ头像数据');
      window.QQApp.refreshAvatarData();
    } else {
      console.error('QQ应用未加载');
    }
  };

  // 强制启动实时更新
  window.forceStartRealtimeUpdates = function () {
    console.log('🚀 强制启动实时更新系统...');

    if (!window.HQDataExtractor) {
      console.error('❌ HQDataExtractor 未加载');
      return;
    }

    // 停止现有的监听器
    if (window.HQDataExtractor.realtimeUpdater.isMonitoring) {
      window.HQDataExtractor.realtimeUpdater.stop();
    }

    // 重新初始化
    window.HQDataExtractor.realtimeUpdater.initialize();

    // 如果QQ应用存在，重新设置其实时更新
    if (window.QQApp && typeof window.QQApp.setupRealtimeUpdates === 'function') {
      window.QQApp.setupRealtimeUpdates();
    }

    console.log('✅ 实时更新系统已强制重启');
  };

  // 测试实时更新系统
  window.testRealtimeUpdates = function () {
    console.log('🧪 测试实时更新系统...');

    if (!window.HQDataExtractor) {
      console.error('❌ HQDataExtractor 未加载');
      return;
    }

    const updater = window.HQDataExtractor.realtimeUpdater;

    // 检查基本状态
    console.log('基本状态检查:');
    console.log('- 已初始化:', updater.isInitialized);
    console.log('- 正在监听:', updater.isMonitoring);
    console.log('- 已暂停:', updater.isPaused);
    console.log('- 回调数量:', updater.updateCallbacks.size);

    // 测试回调注册
    let testCallbackCalled = false;
    const testCallback = data => {
      testCallbackCalled = true;
      console.log('✅ 测试回调被调用:', data.source);
    };

    updater.onUpdate(testCallback);
    console.log('已注册测试回调，当前回调数量:', updater.updateCallbacks.size);

    // 手动触发更新测试
    setTimeout(() => {
      console.log('手动触发更新测试...');
      updater.forceUpdate();

      setTimeout(() => {
        if (testCallbackCalled) {
          console.log('✅ 实时更新系统工作正常');
        } else {
          console.log('❌ 实时更新系统可能有问题');
        }

        // 清理测试回调
        updater.offUpdate(testCallback);
        console.log('测试完成，已清理测试回调');
      }, 1000);
    }, 500);
  };

  // 手动暂停实时更新
  window.pauseRealtimeUpdates = function () {
    if (window.HQDataExtractor && window.HQDataExtractor.realtimeUpdater) {
      window.HQDataExtractor.realtimeUpdater.pauseMonitoring();
      console.log('⏸️ 实时更新已手动暂停');
    }
  };

  // 手动恢复实时更新
  window.resumeRealtimeUpdates = function () {
    if (window.HQDataExtractor && window.HQDataExtractor.realtimeUpdater) {
      window.HQDataExtractor.realtimeUpdater.resumeMonitoring();
      console.log('▶️ 实时更新已手动恢复');
    }
  };

  // 全局图像质量优化函数
  window.applyAvatarQualityOptimization = function () {
    console.log('🎨 [全局] 应用头像图像质量优化');

    // 选择所有可能的头像元素
    const avatarSelectors = [
      '.custom-avatar',
      '.sent-avatar',
      '.received-avatar',
      '.user-avatar',
      '.contact-avatar',
      '.friend-avatar',
      '.group-avatar',
      '.member-avatar',
      '.unified-avatar',
      '.message-avatar',
      '.avatar-preview-image',
      '.avatar-preview-frame',
      '[class*="avatar"]',
      '[class*="Avatar"]',
    ];

    let optimizedCount = 0;
    avatarSelectors.forEach(selector => {
      $(selector).each(function () {
        const $element = $(this);

        // 应用图像质量优化CSS
        $element.css({
          'image-rendering': '-webkit-optimize-contrast',
          '-webkit-backface-visibility': 'hidden',
          'backface-visibility': 'hidden',
          '-webkit-transform-style': 'preserve-3d',
          'transform-style': 'preserve-3d',
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
          'background-attachment': 'scroll',
          'background-origin': 'padding-box',
          'background-clip': 'padding-box',
          'will-change': 'transform',
          contain: 'layout style paint',
        });

        // 确保变换包含translateZ(0)以启用硬件加速
        const currentTransform = $element.css('transform');
        if (currentTransform && currentTransform !== 'none') {
          if (!currentTransform.includes('translateZ')) {
            $element.css('transform', currentTransform + ' translateZ(0)');
          }
        } else {
          $element.css('transform', 'translateZ(0)');
        }

        optimizedCount++;
      });
    });

    console.log(`✅ [全局] 图像质量优化完成，优化了 ${optimizedCount} 个头像元素`);
    return optimizedCount;
  };

  // 暴露到全局
  window.QQApp = QQApp;
})(window);
