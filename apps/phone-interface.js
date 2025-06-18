// 手机界面
(function (window) {
  'use strict';

  const PhoneInterface = {
    // 手机外壳ID
    shellId: 'phone_interface_shell',

    // 初始化手机界面（完整初始化，包括界面创建和显示）
    init: function () {
      // 确保phone-shell系统已加载
      if (typeof window.PhoneShell === 'undefined') {
        console.error('❌ PhoneShell系统未找到，请先加载phone-shell.js');
        return;
      }

      // 初始化手机外壳系统
      window.PhoneShell.init();

      this.createInterface();
      this.bindEvents();
      this.addAnimationStyles();

      // 恢复保存的主题
      setTimeout(() => {
        this.restoreSavedTheme();
      }, 100);

      console.log('✅ 手机界面已初始化，使用统一的phone-shell系统');
    },

    // 仅初始化手机按钮（不创建和显示手机界面）
    initButtonOnly: function () {
      // 确保phone-shell系统已加载
      if (typeof window.PhoneShell === 'undefined') {
        console.error('❌ PhoneShell系统未找到，请先加载phone-shell.js');
        return;
      }

      // 初始化手机外壳系统
      window.PhoneShell.init();

      // 只创建手机按钮，不创建界面
      this.createPhoneButtonOnly();
      this.bindEvents();
      this.addAnimationStyles();

      console.log('✅ 手机按钮已初始化，界面默认隐藏');
    },

    // 添加动画样式
    addAnimationStyles: function () {
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        .animate-pulse {
          animation: pulse 2s infinite;
        }

        .animate-bounce {
          animation: bounce 3s infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        /* When QQ app is active, #phone_interface acts as a frame */
        /* Hide the phone's own internal screen elements */
        #phone_interface.show-qq-app-content .phone-background,
        #phone_interface.show-qq-app-content .dynamic-island,
        #phone_interface.show-qq-app-content .phone-status-bar,
        #phone_interface.show-qq-app-content .phone-home-screen,
        #phone_interface.show-qq-app-content .phone-dock {
          display: none !important;
        }

        /* Hide wallpaper and set phone-screen to plain white background when QQ app is active */
        #phone_interface.show-qq-app-content .phone-screen {
          background: white !important; /* Remove wallpaper and set plain white background */
          position: relative !important;
        }

        /* QQ app container - 默认隐藏 */
        .qq-app-container {
          display: none !important;
        }

        /* QQ app container inside phone screen - 只在QQ应用激活时显示 */
        #phone_interface.show-qq-app-content .phone-screen .qq-app-container {
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 50px !important;
          overflow: hidden !important;
          background: #ffffff !important;
          z-index: 10 !important;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2) !important;
        }

        /* Hide the original QQ dialog when in phone mode */
        body.qq-app-mode #chat_history_dialog {
          display: none !important;
        }

        /* 美化应用容器 - 默认隐藏 */
        .wallpaper-app-container {
          display: none !important;
        }

        /* 美化应用容器 inside phone screen - 只在美化应用激活时显示 */
        #phone_interface.show-wallpaper-app-content .phone-screen .wallpaper-app-container {
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 50px !important;
          overflow: hidden !important;
          background: #ffffff !important;
          z-index: 10 !important;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2) !important;
        }

        /* Hide other phone elements when wallpaper app is active */
        #phone_interface.show-wallpaper-app-content .phone-home-screen,
        #phone_interface.show-wallpaper-app-content .phone-dock {
          display: none !important;
        }

        /* Hide the original wallpaper interface when in phone mode */
        body.wallpaper-app-mode #wallpaper_interface {
          display: none !important;
        }
      `;
      document.head.appendChild(styleElement);
    },

    // 创建界面
    createInterface: function () {
      // 创建手机按钮
      const $phoneButton = $(`
                <div id="chat_history_btn" class="mobile-btn">
                    <span style="color: white; font-size: 20px;">📱</span>
                </div>
            `);

      // 创建手机主屏幕内容
      const homeScreenContent = `
                        <!-- 手机屏幕容器 -->
                        <div class="phone-screen">
                            <!-- 背景 -->
                            <div class="phone-background">
                            </div>

                            <!-- QQ应用容器 - 当QQ应用激活时显示 -->
                            <div class="qq-app-container"></div>

                            <!-- 美化应用容器 - 当美化应用激活时显示 -->
                            <div class="wallpaper-app-container"></div>

                            <!-- 主屏幕 -->
                            <div class="phone-home-screen">

                            <!-- 时间显示 -->
                            <div class="home-time">
                                <div class="home-time-main" id="home_time_main">21:09</div>
                                <div class="home-time-date" id="home_time_date">星期三，12月18日</div>
                            </div>

                            <!-- 欢迎消息 -->
                            <div class="welcome-message animate-float">
                                <div class="welcome-header">
                                    <div class="welcome-title">
                                        <span style="color: white; font-size: 18px;">❥</span>
                                        <span style="color: white; font-weight: 500; font-size: 14px;">Message</span>
                                    </div>
                                    <div class="close-welcome" style="width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; cursor: pointer;">
                                        <span style="color: white; font-size: 12px;">×</span>
                                    </div>
                                </div>

                                <div class="welcome-content">
                                    <div class="welcome-content-item">💌 纯爱统治世界(つ ω つ)</div>
                                    <div class="welcome-content-item">☀️ 今天也是元气满满的一天呢◊</div>
                                    <div class="welcome-content-item">💙 (=^-ω-^=)好运来咯！请接好</div>
                                </div>

                                <div class="welcome-buttons">
                                    <button class="welcome-btn">OK</button>
                                    <button class="welcome-btn">GOOD</button>
                                    <button class="welcome-btn">PERFECT</button>
                                </div>
                            </div>

                            <!-- 简约装饰元素 -->
                            <div class="sparkle-decoration" style="font-size: 22px;top: 32px; right: 16px;">
                                <span>♡</span>
                            </div>
                            <div class="star-decoration" style="font-size: 26px;top: 48px; left: 20px;">
                                <span>☀</span>
                            </div>
                            <div class="heart-decoration" style="font-size: 22px;top: 95px; right: 32px;">
                                <span>★</span>
                            </div>

                            <!-- 应用网格 - 第一行 -->
                            <div class="app-grid">
                                <!-- QQ应用 -->
                                <div class="app-icon" data-app="qq">
                                    <div class="app-icon-img">
                                        <div class="app-icon-inner">
                                            <span class="simple-icon">💭</span>
                                        </div>
                                    </div>
                                    <div class="app-name">消息</div>
                                </div>

                                <!-- 淘宝应用 -->
                                <div class="app-icon" data-app="taobao">
                                    <div class="app-icon-img">
                                        <div class="app-icon-inner">
                                            <span class="simple-icon">🛒</span>
                                        </div>
                                    </div>
                                    <div class="app-name">淘宝</div>
                                </div>

                                <!-- 任务应用 -->
                                <div class="app-icon" data-app="renwu">
                                    <div class="app-icon-img">
                                        <div class="app-icon-inner">
                                            <span class="simple-icon">✓</span>
                                        </div>
                                    </div>
                                    <div class="app-name">任务</div>
                                </div>
                            </div>

                            <!-- 应用网格 - 第二行 -->
                            <div class="app-grid-row2">
                                <!-- 背包应用 -->
                                <div class="app-icon" data-app="backpack">
                                    <div class="app-icon-img">
                                        <div class="app-icon-inner">
                                            <span class="simple-icon">🎒</span>
                                        </div>
                                    </div>
                                    <div class="app-name">背包</div>
                                </div>

                                <!-- 抽卡应用 -->
                                <div class="app-icon" data-app="chouka">
                                    <div class="app-icon-img">
                                        <div class="app-icon-inner">
                                            <span class="simple-icon">🎴</span>
                                        </div>
                                    </div>
                                    <div class="app-name">抽卡</div>
                                </div>

                                <!-- 美化应用 -->
                                <div class="app-icon" data-app="wallpaper">
                                    <div class="app-icon-img">
                                        <div class="app-icon-inner">
                                            <span class="simple-icon">🎨</span>
                                        </div>
                                    </div>
                                    <div class="app-name">美化</div>
                                </div>
                            </div>
                            </div>

                            <!-- 底部导航栏 -->
                            <div class="phone-dock">
                            </div>
                        </div>
            `;

      // 使用phone-shell系统创建手机界面
      const phoneHTML = window.PhoneShell.createShellHTML(homeScreenContent, this.shellId);

      // 移除可能存在的旧手机按键
      $('#chat_history_btn').remove();

      // 将手机按钮添加到send_form中的rightSendForm前面
      const $sendForm = $('#send_form');
      const $rightSendForm = $sendForm.find('#rightSendForm');

      if ($sendForm.length > 0 && $rightSendForm.length > 0) {
        $rightSendForm.before($phoneButton);
        console.log('✅ 手机按钮已添加到发送表单中');
        console.log('📱 手机按钮元素:', $phoneButton[0]);
        console.log('📍 手机按钮位置:', $phoneButton.offset());
      } else {
        // 如果找不到目标位置，则添加到body
        $('body').append($phoneButton);
        console.log('⚠️ 未找到发送表单，手机按钮已添加到body');
      }

      // 验证手机按键是否成功添加
      setTimeout(() => {
        const $addedButton = $('#chat_history_btn');
        if ($addedButton.length > 0) {
          console.log('✅ 手机按键验证成功，元素已存在');
          console.log('📊 按键状态:', {
            visible: $addedButton.is(':visible'),
            display: $addedButton.css('display'),
            zIndex: $addedButton.css('z-index'),
            position: $addedButton.css('position'),
          });
        } else {
          console.error('❌ 手机按键验证失败，元素不存在');
        }
      }, 100);

      // 确保没有重复的手机界面元素
      $('#phone_interface').remove();
      $(`#${this.shellId}`).remove();

      // 添加phone-shell创建的手机界面到页面
      $('body').append(phoneHTML);

      // 将phone-shell创建的元素ID改为phone_interface以保持兼容性
      $(`#${this.shellId}`).attr('id', 'phone_interface');

      // 启动phone-shell的时间更新
      window.PhoneShell.show('phone_interface');
      window.PhoneShell.startTimeUpdate('phone_interface');

      // 绑定应用图标事件（需要在界面创建后绑定）
      this.bindAppIconEvents();

      console.log('✅ 手机界面已创建，使用统一的phone-shell系统');
    },

    // 仅创建手机按钮（不创建手机界面）
    createPhoneButtonOnly: function () {
      // 创建手机按钮
      const $phoneButton = $(`
                <div id="chat_history_btn" class="mobile-btn">
                    <span style="color: white; font-size: 20px;">📱</span>
                </div>
            `);

      // 移除可能存在的旧手机按键
      $('#chat_history_btn').remove();

      // 将手机按钮添加到send_form中的rightSendForm前面
      const $sendForm = $('#send_form');
      const $rightSendForm = $sendForm.find('#rightSendForm');

      if ($sendForm.length > 0 && $rightSendForm.length > 0) {
        $rightSendForm.before($phoneButton);
        console.log('✅ 手机按钮已添加到发送表单中');
        console.log('📱 手机按钮元素:', $phoneButton[0]);
        console.log('📍 手机按钮位置:', $phoneButton.offset());
      } else {
        // 如果找不到目标位置，则添加到body
        $('body').append($phoneButton);
        console.log('⚠️ 未找到发送表单，手机按钮已添加到body');
      }

      // 验证手机按键是否成功添加
      setTimeout(() => {
        const $addedButton = $('#chat_history_btn');
        if ($addedButton.length > 0) {
          console.log('✅ 手机按键验证成功，元素已存在');
          console.log('📊 按键状态:', {
            visible: $addedButton.is(':visible'),
            display: $addedButton.css('display'),
            zIndex: $addedButton.css('z-index'),
            position: $addedButton.css('position'),
          });
        } else {
          console.error('❌ 手机按键验证失败，元素不存在');
        }
      }, 100);

      console.log('✅ 手机按钮创建完成（界面未创建）');
    },

    // 创建手机界面并显示（用于第一次点击）
    createInterfaceAndShow: function () {
      console.log('🔄 第一次点击，创建手机界面...');

      // 创建手机主屏幕内容
      const homeScreenContent = `
                        <!-- 手机屏幕容器 -->
                        <div class="phone-screen">
                            <!-- 背景 -->
                            <div class="phone-background">
                            </div>

                            <!-- QQ应用容器 - 当QQ应用激活时显示 -->
                            <div class="qq-app-container"></div>

                            <!-- 美化应用容器 - 当美化应用激活时显示 -->
                            <div class="wallpaper-app-container"></div>

                            <!-- 主屏幕 -->
                            <div class="phone-home-screen">

                            <!-- 时间显示 -->
                            <div class="home-time">
                                <div class="home-time-main" id="home_time_main">21:09</div>
                                <div class="home-time-date" id="home_time_date">星期三，12月18日</div>
                            </div>

                            <!-- 欢迎消息 -->
                            <div class="welcome-message animate-float">
                                <div class="welcome-header">
                                    <div class="welcome-title">
                                        <span style="color: white; font-size: 18px;">❥</span>
                                        <span style="color: white; font-weight: 500; font-size: 14px;">Message</span>
                                    </div>
                                    <div class="close-welcome" style="width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; cursor: pointer;">
                                        <span style="color: white; font-size: 12px;">×</span>
                                    </div>
                                </div>

                                <div class="welcome-content">
                                    <div class="welcome-content-item">💌 纯爱统治世界(つ ω つ)</div>
                                    <div class="welcome-content-item">☀️ 今天也是元气满满的一天呢◊</div>
                                    <div class="welcome-content-item">💙 (=^-ω-^=)好运来咯！请接好</div>
                                </div>

                                <div class="welcome-buttons">
                                    <button class="welcome-btn">OK</button>
                                    <button class="welcome-btn">GOOD</button>
                                    <button class="welcome-btn">PERFECT</button>
                                </div>
                            </div>

                            <!-- 简约装饰元素 -->
                            <div class="sparkle-decoration" style="font-size: 22px;top: 32px; right: 16px;">
                                <span>♡</span>
                            </div>
                            <div class="star-decoration" style="font-size: 26px;top: 48px; left: 20px;">
                                <span>☀</span>
                            </div>
                            <div class="heart-decoration" style="font-size: 22px;top: 95px; right: 32px;">
                                <span>★</span>
                            </div>

                            <!-- 应用网格 - 第一行 -->
                            <div class="app-grid">
                                <!-- QQ应用 -->
                                <div class="app-icon" data-app="qq">
                                    <div class="app-icon-img">
                                        <div class="app-icon-inner">
                                            <span class="simple-icon">💭</span>
                                        </div>
                                    </div>
                                    <div class="app-name">消息</div>
                                </div>

                                <!-- 淘宝应用 -->
                                <div class="app-icon" data-app="taobao">
                                    <div class="app-icon-img">
                                        <div class="app-icon-inner">
                                            <span class="simple-icon">🛒</span>
                                        </div>
                                    </div>
                                    <div class="app-name">淘宝</div>
                                </div>

                                <!-- 任务应用 -->
                                <div class="app-icon" data-app="renwu">
                                    <div class="app-icon-img">
                                        <div class="app-icon-inner">
                                            <span class="simple-icon">✓</span>
                                        </div>
                                    </div>
                                    <div class="app-name">任务</div>
                                </div>
                            </div>

                            <!-- 应用网格 - 第二行 -->
                            <div class="app-grid-row2">
                                <!-- 背包应用 -->
                                <div class="app-icon" data-app="backpack">
                                    <div class="app-icon-img">
                                        <div class="app-icon-inner">
                                            <span class="simple-icon">🎒</span>
                                        </div>
                                    </div>
                                    <div class="app-name">背包</div>
                                </div>

                                <!-- 抽卡应用 -->
                                <div class="app-icon" data-app="chouka">
                                    <div class="app-icon-img">
                                        <div class="app-icon-inner">
                                            <span class="simple-icon">🎴</span>
                                        </div>
                                    </div>
                                    <div class="app-name">抽卡</div>
                                </div>

                                <!-- 美化应用 -->
                                <div class="app-icon" data-app="wallpaper">
                                    <div class="app-icon-img">
                                        <div class="app-icon-inner">
                                            <span class="simple-icon">🎨</span>
                                        </div>
                                    </div>
                                    <div class="app-name">美化</div>
                                </div>
                            </div>
                            </div>

                            <!-- 底部导航栏 -->
                            <div class="phone-dock">
                            </div>
                        </div>
            `;

      // 使用phone-shell系统创建手机界面
      const phoneHTML = window.PhoneShell.createShellHTML(homeScreenContent, this.shellId);

      // 确保没有重复的手机界面元素
      $('#phone_interface').remove();
      $(`#${this.shellId}`).remove();

      // 添加phone-shell创建的手机界面到页面
      $('body').append(phoneHTML);

      // 将phone-shell创建的元素ID改为phone_interface以保持兼容性
      $(`#${this.shellId}`).attr('id', 'phone_interface');

      // 启动phone-shell的时间更新
      window.PhoneShell.show('phone_interface');
      window.PhoneShell.startTimeUpdate('phone_interface');

      // 绑定应用图标事件（需要在界面创建后绑定）
      this.bindAppIconEvents();

      // 恢复保存的主题
      setTimeout(() => {
        this.restoreSavedTheme();
      }, 100);

      // 立即显示手机界面
      this.show();

      console.log('✅ 手机界面已创建并显示');
    },

    // 绑定事件
    bindEvents: function () {
      // 手机按钮点击事件 - 智能切换逻辑（支持延迟创建界面）
      $(document).on('click', '#chat_history_btn', e => {
        e.stopPropagation();
        console.log('Phone button clicked.');

        // 检查手机界面是否已创建
        const phoneInterfaceExists = $('#phone_interface').length > 0;

        if (!phoneInterfaceExists) {
          // 第一次点击：创建并显示手机界面
          console.log('Phone button: First click, creating interface...');
          this.createInterfaceAndShow();
          return;
        }

        // 后续点击：智能切换逻辑
        const hasOpenApps = this.checkOpenApps();
        const phoneInterfaceVisible = $('#phone_interface').hasClass('show');
        console.log('Phone button: hasOpenApps:', hasOpenApps, 'phoneInterfaceVisible:', phoneInterfaceVisible);

        if (hasOpenApps || phoneInterfaceVisible) {
          this.closeAllApps();
          $('#phone_interface').removeClass('show');
          console.log('Phone button: Closed all interfaces.');
        } else {
          this.show();
          console.log('Phone button: Opened phone interface.');
        }
      });

      // 点击手机屏幕外区域关闭手机
      $(document).on('click', e => {
        const $target = $(e.target);
        // console.log('Document click detected. Target:', $target[0]); // Can be very verbose

        const isPhoneInterfaceVisible = $('#phone_interface').hasClass('show');
        const areAnyAppsOpen = this.checkOpenApps(); // Call checkOpenApps here
        // console.log('Click Outside Check: isPhoneInterfaceVisible:', isPhoneInterfaceVisible, 'areAnyAppsOpen:', areAnyAppsOpen);

        if (isPhoneInterfaceVisible || areAnyAppsOpen) {
          // Only proceed if some mobile UI is active
          const topLevelMobileUISelectors = [
            '#phone_interface',
            '#chat_history_btn',
            '#chat_history_dialog',
            '#taobao_interface',
            '#task_interface',
            '#backpack_interface',
            '#chouka_interface',
            '#wallpaper_interface',
            '#avatar_dialog',
            '#user_avatar_dialog',
            '#group_create_dialog',
            '#add_member_dialog',
            '#accept_task_dialog',
            '#use_item_dialog',
            // Add any other specific top-level modal/dialog IDs that are appended to body
          ];

          // 添加SillyTavern原有界面元素的排除列表
          const sillyTavernUISelectors = [
            '#WorldInfo', // 世界书界面
            '#WIDrawerIcon', // 世界书图标
            '#wi_menu', // 世界书菜单
            '#character_popup', // 角色编辑弹窗
            '#character_cross_talk', // 角色对话设置
            '#character_world_info', // 角色世界信息
            '#character_advanced', // 角色高级设置
            '#selectCharacterTemplatePopup', // 角色模板选择
            '#duplicate_character_popup', // 复制角色弹窗
            '#character_search_popup', // 角色搜索弹窗
            '#preset_settings', // 预设设置
            '#preset_popup', // 预设弹窗
            '#PromptManagerModule', // 提示管理器
            '#promptManagerDrawerIcon', // 提示管理器图标
            '#promptManagerDrawer', // 提示管理器抽屉
            '#select_chat_popup', // 选择聊天弹窗
            '#dialogue_popup', // 对话弹窗
            '#shadow_popup', // 阴影弹窗
            '#ghost_popup', // 幽灵弹窗
            '#textgen_settings', // 文本生成设置
            '#openai_settings', // OpenAI设置
            '#novel_settings', // Novel设置
            '#kobold_settings', // Kobold设置
            '#claude_settings', // Claude设置
            '#poe_settings', // Poe设置
            '#context_menu', // 右键菜单
            '#form_create', // 创建表单
            '#form_favorite_tags', // 收藏标签表单
            '#form_import_tags', // 导入标签表单
            '#cfgConfig', // CFG配置
            '#sampler_view', // 采样器视图
            '#loader', // 加载器
            '.drawer', // 抽屉组件
            '.popup', // 通用弹窗
            '.modal', // 模态框
            '.menu', // 菜单
            '.dropdown', // 下拉菜单
            '.tooltip', // 工具提示
            '.select2-container', // select2 容器
            '.ui-dialog', // jQuery UI 对话框
            '.ui-menu', // jQuery UI 菜单
            '.context-menu', // 右键菜单
            '[class*="popup"]', // 任何包含popup的类
            '[class*="modal"]', // 任何包含modal的类
            '[class*="dialog"]', // 任何包含dialog的类
            '[class*="drawer"]', // 任何包含drawer的类
            '[id*="popup"]', // 任何包含popup的ID
            '[id*="modal"]', // 任何包含modal的ID
            '[id*="dialog"]', // 任何包含dialog的ID
            '[id*="drawer"]', // 任何包含drawer的ID
            '[id*="settings"]', // 任何包含settings的ID
            '[id*="menu"]', // 任何包含menu的ID
            '.interactable', // SillyTavern的可交互元素
            '.clickable', // 可点击元素
          ];

          let isClickInsideAnyMobileUI = false;
          let insideSelector = null;

          // 首先检查是否点击了标记为移动UI元素的元素
          if ($target.closest('[data-mobile-ui-element="true"]').length) {
            // console.log('Click was on a marked mobile UI element, not closing mobile apps.');
            return; // 直接返回，不执行关闭逻辑
          }

          // 然后检查是否点击了SillyTavern的原有界面元素
          for (const selector of sillyTavernUISelectors) {
            if ($target.closest(selector).length) {
              // 如果点击的是SillyTavern原有界面，则不执行关闭操作
              // console.log('Click was inside SillyTavern UI element:', selector, 'Not closing mobile apps.');
              return; // 直接返回，不执行关闭逻辑
            }
          }

          // 然后检查手机插件的界面元素
          for (const selector of topLevelMobileUISelectors) {
            if ($target.closest(selector).length) {
              isClickInsideAnyMobileUI = true;
              insideSelector = selector;
              break;
            }
          }

          // Special check for .chat-page as it can be complex
          if (!isClickInsideAnyMobileUI && $target.closest('.chat-page:visible').length) {
            isClickInsideAnyMobileUI = true;
            insideSelector = '.chat-page:visible';
          }

          // console.log('Click Outside Check: isClickInsideAnyMobileUI:', isClickInsideAnyMobileUI, 'Inside selector:', insideSelector, 'Target:', $target[0]);

          if (!isClickInsideAnyMobileUI) {
            console.log('Click Outside: Detected click outside all known mobile UI. Closing all. Target:', $target[0]);
            this.closeAllApps();
            $('#phone_interface').removeClass('show');
          } else {
            // console.log('Click Outside: Click was inside a mobile UI element:', insideSelector);
          }
        }
      });

      // 欢迎消息关闭按钮
      $(document)
        .off('click', '.close-welcome, .welcome-btn')
        .on('click', '.close-welcome, .welcome-btn', function (e) {
          e.stopPropagation();
          $('.welcome-message').fadeOut(300);
        });
    },

    // 绑定应用图标事件
    bindAppIconEvents: function () {
      // 应用图标点击事件
      $(document)
        .off('click', '.app-icon')
        .on('click', '.app-icon', e => {
          e.stopPropagation();
          const appType = $(e.currentTarget).data('app');
          console.log(`App icon clicked: ${appType}`);

          const openApp = (appName, appObject) => {
            if (appObject && typeof appObject.show === 'function') {
              if (appName === 'QQApp') {
                // 在调用QQ应用的show方法之前先设置手机界面模式
                $('#phone_interface').addClass('show show-qq-app-content');
                $('body').addClass('qq-app-mode');
                console.log(`Set QQ content mode BEFORE calling show(), #phone_interface is now in QQ content mode.`);
              } else if (appName === 'TaobaoApp') {
                // 淘宝应用像QQ一样在手机界面内显示
                $('#phone_interface').addClass('show show-taobao-app-content');
                $('body').addClass('taobao-app-mode');
                console.log(
                  `Set Taobao content mode BEFORE calling show(), #phone_interface is now in Taobao content mode.`,
                );
              } else if (appName === 'WallpaperApp') {
                // 美化应用也保持手机界面显示，但不需要特殊的QQ模式
                $('#phone_interface').addClass('show');
                console.log(`Opened ${appName}, keeping phone_interface visible.`);

                // 确保美化应用始终打开手机壁纸编辑器
                appObject.openPhoneEditor();
                return; // 直接返回，不调用通用的show方法
              }

              // 调用应用的show方法
              appObject.show();

              if (appName !== 'QQApp' && appName !== 'TaobaoApp' && appName !== 'WallpaperApp') {
                // For other apps (except QQ, Taobao and Wallpaper), hide the entire phone_interface
                setTimeout(() => {
                  // Ensure qq-mode and taobao-mode are also removed if another app is opened.
                  $('#phone_interface').removeClass('show show-qq-app-content show-taobao-app-content');
                  $('body').removeClass('qq-app-mode taobao-app-mode');
                  console.log(`Opened ${appName}, hid phone_interface.`);
                }, 0);
              }
            } else {
              console.error(`${appName} not loaded or has no show method.`);
              if (appName !== 'TaobaoApp') {
                // Taobao already has an alert
                alert(`${appName} 应用未正确加载，请检查控制台。`);
              }
            }
          };

          switch (appType) {
            case 'qq':
              openApp('QQApp', window.QQApp);
              break;
            case 'taobao':
              openApp('TaobaoApp', window.TaobaoApp);
              break;
            case 'renwu':
              openApp('TaskApp', window.TaskApp);
              break;
            case 'backpack':
              openApp('BackpackApp', window.BackpackApp);
              break;
            case 'chouka':
              openApp('ChoukaApp', window.ChoukaApp);
              break;
            case 'wallpaper':
              openApp('WallpaperApp', window.WallpaperApp);
              break;
          }
        });
    },

    // 获取当前系统时间并更新界面时间
    updateTime: function () {
      // 使用phone-shell系统的时间更新，同时更新主屏幕时间
      if (window.PhoneShell) {
        // phone-shell会自动更新状态栏时间，我们只需要更新主屏幕时间
        const now = new Date();

        // 格式化时间为 HH:MM 格式
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;

        // 获取星期几
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const weekday = weekdays[now.getDay()];

        // 获取月份和日期
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateStr = `${weekday}，${month}月${day}日`;

        // 更新主屏幕时间
        $('#home_time_main').text(timeStr);
        $('#home_time_date').text(dateStr);
      }
    },

    // 启动时间更新功能
    startTimeUpdate: function () {
      // 使用phone-shell系统的时间更新
      if (window.PhoneShell) {
        // 使用phone_interface ID，因为我们已经在createInterface中重命名了
        window.PhoneShell.startTimeUpdate('phone_interface');

        // 同时启动主屏幕时间的更新
        this.updateTime();

        // 设置主屏幕时间的定时更新
        const now = new Date();
        const delay = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());

        setTimeout(() => {
          this.updateTime();
          setInterval(() => {
            this.updateTime();
          }, 60000);
        }, delay);
      }
    },

    // 显示手机界面
    show: function () {
      console.log('🔄 开始显示手机界面...');

      // 检查手机界面是否存在
      let $phoneInterface = $('#phone_interface');
      if ($phoneInterface.length === 0) {
        console.log('⚠️ 手机界面元素不存在，使用createInterfaceAndShow创建...');
        this.createInterfaceAndShow();
        return;
      }

      // 清理应用状态，但不影响手机界面本身的显示
      this.closeAllApps();

      // 使用phone-shell系统显示手机界面
      if (window.PhoneShell) {
        // 使用phone_interface ID，因为我们已经在createInterface中重命名了
        window.PhoneShell.show('phone_interface');

        $phoneInterface = $('#phone_interface'); // 重新获取元素引用
        if ($phoneInterface.length > 0) {
          $phoneInterface.addClass('show').removeClass('show-qq-app-content show-taobao-app-content');
          $('body').removeClass('qq-app-mode taobao-app-mode');

          // 强制隐藏所有应用容器，确保手机主页内容优先显示
          $('#phone_interface .qq-app-container').hide();
          $('#phone_interface .taobao-app-container').hide();
          $('#phone_interface .wallpaper-app-container').hide();

          // 强制显示手机主屏幕的核心元素
          $('#phone_interface .phone-background').show();
          $('#phone_interface .phone-home-screen').show();
          $('#phone_interface .phone-dock').show();
        }

        this.updateTime();
        this.updateResponsiveScale(); // 更新响应式缩放

        // 初始化并应用保存的手机壁纸
        if (window.WallpaperApp) {
          if (typeof window.WallpaperApp.init === 'function') {
            window.WallpaperApp.init()
              .then(() => {
                console.log('📱 壁纸应用初始化完成，已应用保存的壁纸');
              })
              .catch(error => {
                console.warn('⚠️ 壁纸应用初始化失败:', error);
                // 即使初始化失败，也尝试应用当前壁纸
                if (typeof window.WallpaperApp.applyCurrentWallpaper === 'function') {
                  window.WallpaperApp.applyCurrentWallpaper();
                }
              });
          } else if (typeof window.WallpaperApp.applyCurrentWallpaper === 'function') {
            window.WallpaperApp.applyCurrentWallpaper();
            console.log('📱 已立即应用保存的手机壁纸');
          }
        }
      } else {
        console.error('❌ PhoneShell系统未找到');
        return;
      }

      // 验证显示状态（简化日志）
      setTimeout(() => {
        const $currentInterface = $('#phone_interface');
        const isVisible = $currentInterface.is(':visible');

        if ($currentInterface.length === 0) {
          console.error('❌ 验证时发现手机界面元素已消失');
        } else if (!isVisible) {
          console.log('⚠️ 手机界面不可见，尝试修复...');
          $currentInterface.show().css('display', 'block !important');
        } else {
          console.log('✅ 手机界面显示成功');
        }
      }, 100);

      // 移除不必要的背景处理逻辑

      console.log('✅ PhoneInterface.show() executed, ensured QQ container hidden and home screen elements visible.');
    },

    // 切换手机界面显示状态
    toggle: function () {
      if ($('#phone_interface').hasClass('show')) {
        this.hide();
      } else {
        this.show();
      }
    },

    // 隐藏手机界面
    hide: function () {
      console.log('🔄 开始隐藏手机界面...');

      // 完全隐藏手机界面（包括移除show类）
      this.forceHidePhoneInterface();

      console.log('✅ PhoneInterface.hide() executed, all states cleaned.');
    },

    // 关闭所有应用界面
    closeAllApps: function () {
      console.log('正在关闭所有应用界面...');

      // 关闭QQ应用界面和相关弹窗
      if (window.QQApp && typeof window.QQApp.hide === 'function') {
        window.QQApp.hide();
      } else {
        $('#chat_history_dialog').hide();
        $('.chat-page').removeClass('show');
        $('#phone_interface .qq-app-container').empty();
      }
      $('#group_create_dialog').hide();
      $('#add_member_dialog').hide();
      $('#avatar_dialog').remove(); // avatar dialog 使用 remove 而不是 hide
      $('#user_avatar_dialog').remove(); // user avatar dialog 使用 remove 而不是 hide

      // 关闭淘宝应用界面
      if (window.TaobaoApp && typeof window.TaobaoApp.hide === 'function') {
        window.TaobaoApp.hide();
      } else {
        $('#phone_interface .taobao-app-container').hide();
      }

      // 关闭任务应用界面
      $('#task_interface').hide();
      $('#accept_task_dialog').remove(); // 任务接受弹窗

      // 关闭背包应用界面
      $('#backpack_interface').hide();
      $('#use_item_dialog').remove(); // 背包使用物品弹窗

      // 关闭抽卡应用界面
      $('#chouka_interface').hide();

      // 关闭美化应用界面
      $('#wallpaper_interface').hide();

      // 关闭任何其他可能的弹窗界面
      $('.app-dialog').hide();
      $('.app-interface').hide();

      // 关闭可能的临时弹窗（使用remove方式），但保留QQ应用的原始对话框和SillyTavern原生组件
      // 使用白名单方式，只删除手机插件创建的特定弹窗，避免误删SillyTavern原生组件
      this.removeMobilePluginDialogs();

      // Reset phone_interface from all app modes
      $('#phone_interface').removeClass('show-qq-app-content show-taobao-app-content');
      $('body').removeClass('qq-app-mode taobao-app-mode');
      console.log('所有应用界面已关闭, 所有应用模式已移除.');
    },

    // 检查是否有任何应用界面正在显示
    checkOpenApps: function () {
      // 检查QQ应用界面
      if ($('#chat_history_dialog').is(':visible') || $('.chat-page.show').length > 0) {
        return true;
      }

      // 检查QQ相关弹窗
      if (
        $('#group_create_dialog').is(':visible') ||
        $('#add_member_dialog').is(':visible') ||
        $('#avatar_dialog').length > 0 ||
        $('#user_avatar_dialog').length > 0
      ) {
        return true;
      }

      // 检查其他应用界面
      if (
        $('#taobao_interface').is(':visible') ||
        $('#task_interface').is(':visible') ||
        $('#backpack_interface').is(':visible') ||
        $('#chouka_interface').is(':visible') ||
        $('#wallpaper_interface').is(':visible')
      ) {
        return true;
      }

      // 检查任务和背包的弹窗
      if ($('#accept_task_dialog').length > 0 || $('#use_item_dialog').length > 0) {
        return true;
      }

      // 检查其他可能的应用界面
      if ($('.app-interface:visible').length > 0 || $('.app-dialog:visible').length > 0) {
        return true;
      }

      return false;
    },

    // 强制清理所有状态 - 修改版本（不影响手机界面显示）
    forceCleanState: function () {
      console.log('🧹 强制清理所有手机插件状态...');

      // 清理应用相关的CSS类，但保留手机界面的显示状态
      $('#phone_interface').removeClass('show-qq-app-content');
      $('body').removeClass('qq-app-mode chat-detail-active');

      // 清理所有聊天页面状态
      $('.chat-page').removeClass('show');

      // 强制隐藏所有应用界面
      $('#chat_history_dialog').hide();
      $('#taobao_interface').hide();
      $('#task_interface').hide();
      $('#backpack_interface').hide();
      $('#chouka_interface').hide();
      $('#wallpaper_interface').hide();

      // 清理QQ应用容器和美化应用容器
      $('#phone_interface .qq-app-container').empty().hide();
      $('#phone_interface .wallpaper-app-container').empty().hide();

      // 使用安全的弹窗清理
      this.removeMobilePluginDialogs();

      // 清理任何可能的内联样式覆盖
      $('#chat_history_dialog').css('z-index', '');
      $('.qq-app-container').css('z-index', '');
      $('#chat_history_btn').css('z-index', '');
      $('#taobao_interface').css('z-index', '');
      $('#task_interface').css('z-index', '');
      $('#backpack_interface').css('z-index', '');
      $('#chouka_interface').css('z-index', '');
      $('#wallpaper_interface').css('z-index', '');
      $('.chat-page').css('z-index', '');

      console.log('✅ 状态清理完成');
    },

    // 完全隐藏手机界面（包括移除show类）
    forceHidePhoneInterface: function () {
      console.log('🔒 完全隐藏手机界面...');

      // 先清理所有状态
      this.forceCleanState();

      // 然后隐藏手机界面本身
      $('#phone_interface').removeClass('show show-qq-app-content');

      console.log('✅ 手机界面已完全隐藏');
    },

    // 安全地移除手机插件创建的弹窗，保护SillyTavern原生组件
    removeMobilePluginDialogs: function () {
      console.log('🧹 开始清理手机插件弹窗...');

      // 手机插件创建的弹窗ID列表（白名单方式）
      const mobilePluginDialogs = [
        // QQ应用相关弹窗（除了chat_history_dialog）
        '#group_create_dialog',
        '#add_member_dialog',
        '#avatar_dialog',
        '#user_avatar_dialog',

        // 任务应用弹窗
        '#accept_task_dialog',

        // 背包应用弹窗
        '#use_item_dialog',

        // 其他手机插件可能创建的弹窗
        '.mobile-plugin-dialog',
        '.mobile-app-dialog',

        // 通用的临时弹窗（但排除SillyTavern原生的和核心手机界面）
        '[id^="mobile_"]',
        '[id^="qq_"]:not(#qq_app_container)',
        '[id^="taobao_"]',
        '[id^="task_"]',
        '[id^="backpack_"]',
        '[id^="chouka_"]',
        '[id^="wallpaper_"]',
      ];

      // SillyTavern原生组件保护列表（确保不被删除）
      const sillyTavernProtectedComponents = [
        '#world_popup',
        '#WorldInfo',
        '#WIDrawerIcon',
        '#wi_menu',
        '[id*="completion_prompt_manager"]',
        '[id*="character_popup"]',
        '[id*="preset_popup"]',
        '[id*="dialogue_popup"]',
        '[id*="shadow_popup"]',
        '[id*="ghost_popup"]',
        '#textgen_settings',
        '#openai_settings',
        '#novel_settings',
        '#kobold_settings',
        '#claude_settings',
        '#poe_settings',
        '#context_menu',
        '#form_create',
        '#form_favorite_tags',
        '#form_import_tags',
        '#cfgConfig',
        '#sampler_view',
        '#loader',
        '.drawer-content',
        '.ui-dialog',
        '.select2-container',
      ];

      // 只删除手机插件创建的弹窗，保护核心界面元素
      let removedCount = 0;
      mobilePluginDialogs.forEach(selector => {
        let $elements = $(selector);

        // 特别保护核心手机界面元素
        if (selector.includes('[id^="phone_"]')) {
          $elements = $elements.not('#phone_interface, #phone_shell, #phone_container');
        }

        if ($elements.length > 0) {
          console.log(`  - 删除 ${selector}: ${$elements.length} 个元素`);
          $elements.remove();
          removedCount += $elements.length;
        }
      });

      // 验证保护的组件是否仍然存在
      console.log('🛡️ 验证SillyTavern原生组件保护状态:');
      sillyTavernProtectedComponents.forEach(selector => {
        const $elements = $(selector);
        if ($elements.length > 0) {
          console.log(`  ✅ ${selector}: ${$elements.length} 个元素已保护`);
        }
      });

      console.log(`✅ 手机插件弹窗清理完成，共删除 ${removedCount} 个元素`);
    },

    // 单独创建手机界面元素（用于重新创建）
    createPhoneInterfaceElement: function () {
      console.log('🏗️ 创建手机界面元素...');

      // 先移除可能存在的旧元素
      $('#phone_interface').remove();

      // 创建手机界面元素
      const $phoneInterface = $(`
        <div id="phone_interface" class="phone-interface">
          <div class="phone-screen">
            <div class="phone-background"></div>
            <div class="qq-app-container"></div>
            <div class="wallpaper-app-container"></div>
            <div class="dynamic-island"></div>
            <div class="phone-status-bar">
              <div class="status-time" id="status_time">8:00</div>
              <div class="status-icons">
                <span class="signal-icon"></span>
                <span class="battery-icon"></span>
              </div>
            </div>
            <div class="phone-home-screen">
              <div class="home-time">
                <div class="home-time-main" id="home_time_main">21:09</div>
                <div class="home-time-date" id="home_time_date">星期三，12月18日</div>
              </div>
              <div class="welcome-message animate-float">
                <div class="welcome-header">
                  <div class="welcome-title">
                    <span style="color: white; font-size: 18px;">❥</span>
                    <span style="color: white; font-weight: 500; font-size: 14px;">Message</span>
                  </div>
                  <div class="close-welcome" style="width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; cursor: pointer;">
                    <span style="color: white; font-size: 12px;">×</span>
                  </div>
                </div>
                <div class="welcome-content">
                  <div class="welcome-content-item">💌 纯爱统治世界(つ ω つ)</div>
                  <div class="welcome-content-item">☀️ 今天也是元气满满的一天呢◊</div>
                  <div class="welcome-content-item">💙 (=^-ω-^=)好运来咯！请接好</div>
                </div>
                <div class="welcome-buttons">
                  <button class="welcome-btn">OK</button>
                  <button class="welcome-btn">GOOD</button>
                  <button class="welcome-btn">PERFECT</button>
                </div>
              </div>
              <div class="app-grid">
                <div class="app-icon" data-app="qq">
                  <div class="app-icon-img">
                    <div class="app-icon-inner">
                      <span class="simple-icon">💭</span>
                    </div>
                  </div>
                  <div class="app-name">消息</div>
                </div>
                <div class="app-icon" data-app="taobao">
                  <div class="app-icon-img">
                    <div class="app-icon-inner">
                      <span class="simple-icon">🛒</span>
                    </div>
                  </div>
                  <div class="app-name">淘宝</div>
                </div>
                <div class="app-icon" data-app="renwu">
                  <div class="app-icon-img">
                    <div class="app-icon-inner">
                      <span class="simple-icon">✓</span>
                    </div>
                  </div>
                  <div class="app-name">任务</div>
                </div>
              </div>
              <div class="app-grid-row2">
                <div class="app-icon" data-app="backpack">
                  <div class="app-icon-img">
                    <div class="app-icon-inner">
                      <span class="simple-icon">🎒</span>
                    </div>
                  </div>
                  <div class="app-name">背包</div>
                </div>
                <div class="app-icon" data-app="chouka">
                  <div class="app-icon-img">
                    <div class="app-icon-inner">
                      <span class="simple-icon">🎴</span>
                    </div>
                  </div>
                  <div class="app-name">抽卡</div>
                </div>
                <div class="app-icon" data-app="wallpaper">
                  <div class="app-icon-img">
                    <div class="app-icon-inner">
                      <span class="simple-icon">🎨</span>
                    </div>
                  </div>
                  <div class="app-name">美化</div>
                </div>
              </div>
            </div>
            <div class="phone-dock"></div>
          </div>
        </div>
      `);

      // 添加到body
      $('body').append($phoneInterface);

      // 重新绑定应用图标事件
      this.bindAppIconEvents();

      // 重新应用保存的手机壁纸
      if (window.WallpaperApp && typeof window.WallpaperApp.applyCurrentWallpaper === 'function') {
        setTimeout(() => {
          window.WallpaperApp.applyCurrentWallpaper();
          console.log('📱 手机界面重新创建后已恢复保存的壁纸');
        }, 100);
      }

      // 重新应用保存的主题
      this.restoreSavedTheme();

      console.log('✅ 手机界面元素创建完成');
    },

    // 恢复保存的主题
    restoreSavedTheme: function () {
      try {
        const savedTheme = localStorage.getItem('phoneTheme');
        const $phoneInterface = $('#phone_interface');

        if ($phoneInterface.length > 0) {
          // 移除所有主题类
          const themeClasses = [
            'phone-theme-classic',
            'phone-theme-dark',
            'phone-theme-pink',
            'phone-theme-blue',
            'phone-theme-green',
          ];
          themeClasses.forEach(cls => $phoneInterface.removeClass(cls));

          // 暂时不应用任何主题，让壁纸显示
          console.log('🎨 已清除所有主题类，让壁纸正常显示');

          // 如果有保存的主题但不是蓝色主题，才恢复
          if (savedTheme && savedTheme !== 'blue') {
            console.log(`🎨 恢复保存的主题: ${savedTheme}`);
            $phoneInterface.addClass(`phone-theme-${savedTheme}`);

            // 更新美化应用的当前主题记录
            if (window.WallpaperApp) {
              window.WallpaperApp.currentSavedTheme = savedTheme;
            }
            console.log(`✅ 主题恢复成功: ${savedTheme}`);
          } else {
            console.log('📂 使用默认主题（无主题类）');
          }
        }
      } catch (error) {
        console.warn('⚠️ 恢复主题时出错:', error);
      }
    },

    // 清除保存的主题（用于修复蓝色背景问题）
    clearSavedTheme: function () {
      try {
        localStorage.removeItem('phoneTheme');
        localStorage.removeItem('phoneShellTheme');
        console.log('🧹 已清除保存的主题设置');

        const $phoneInterface = $('#phone_interface');
        if ($phoneInterface.length > 0) {
          // 移除所有主题类
          const themeClasses = [
            'phone-theme-classic',
            'phone-theme-dark',
            'phone-theme-pink',
            'phone-theme-blue',
            'phone-theme-green',
          ];
          themeClasses.forEach(cls => $phoneInterface.removeClass(cls));
          console.log('✅ 已移除所有主题类');
        }
      } catch (error) {
        console.warn('⚠️ 清除主题时出错:', error);
      }
    },

    // 移除了不必要的强制背景处理方法

    // 初始化响应式缩放
    initResponsiveScaling: function () {
      console.log('🔧 初始化响应式缩放系统...');

      // 初始缩放计算
      this.updateResponsiveScale();

      // 监听窗口大小变化
      $(window).on('resize.phoneInterface', () => {
        this.updateResponsiveScale();
      });

      // 监听设备方向变化
      $(window).on('orientationchange.phoneInterface', () => {
        setTimeout(() => {
          this.updateResponsiveScale();
        }, 100);
      });

      console.log('✅ 响应式缩放系统初始化完成');
    },

    // 更新响应式缩放
    updateResponsiveScale: function () {
      const $phoneInterface = $('#phone_interface');
      if ($phoneInterface.length === 0) return;

      const windowWidth = $(window).width();
      const windowHeight = $(window).height();

      // 基础手机尺寸
      const baseWidth = 375;
      const baseHeight = 812;
      const baseBorder = 8; // 边框宽度

      // 计算可用空间（留出边距）
      const availableWidth = windowWidth * 0.9; // 留出10%边距
      const availableHeight = windowHeight * 0.9; // 留出10%边距

      // 计算缩放比例
      const scaleByWidth = availableWidth / (baseWidth + baseBorder * 2);
      const scaleByHeight = availableHeight / (baseHeight + baseBorder * 2);

      // 选择较小的缩放比例以确保完全适配
      let scale = Math.min(scaleByWidth, scaleByHeight);

      // 设置缩放范围限制 - 添加最大尺寸限制
      scale = Math.max(0.3, Math.min(1.0, scale)); // 最小30%，最大100%（不再放大）

      // 应用缩放
      $phoneInterface.css('--phone-scale', scale);

      console.log(`📱 响应式缩放更新: 窗口${windowWidth}x${windowHeight}, 缩放比例${scale.toFixed(2)}`);
    },

    // 销毁响应式缩放监听器
    destroyResponsiveScaling: function () {
      $(window).off('resize.phoneInterface orientationchange.phoneInterface');
      console.log('🗑️ 响应式缩放监听器已销毁');
    },
  };

  // 导出到全局
  window.PhoneInterface = PhoneInterface;
})(window);
