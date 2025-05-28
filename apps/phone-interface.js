// 手机界面
(function (window) {
  'use strict';

  const PhoneInterface = {
    // 初始化手机界面
    init: function () {
      this.createInterface();
      this.bindEvents();
      this.addAnimationStyles();
      this.startTimeUpdate(); // 添加时间更新功能
      console.log('手机界面已初始化');
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

      // 创建手机界面 - 使用新的UI设计
      const $phoneInterface = $(`
                <div id="phone_interface" class="phone-interface">

                    <!-- iPhone 屏幕 -->
                    <div class="phone-screen">
                        <!-- 背景 -->
                        <div class="phone-background">
                        </div>

                        <!-- QQ应用容器 - 当QQ应用激活时显示 -->
                        <div class="qq-app-container"></div>

                        <!-- Dynamic Island -->
                        <div class="dynamic-island"></div>

                        <!-- 状态栏 -->
                        <div class="phone-status-bar">
                            <div class="status-time" id="status_time">8:00</div>
                            <div class="status-icons">
                                <div style="display: flex; gap: 1px;">
                                    <div style="width: 1px; height: 3px; background: white; border-radius: 1px;"></div>
                                    <div style="width: 1px; height: 3px; background: white; border-radius: 1px;"></div>
                                    <div style="width: 1px; height: 3px; background: white; border-radius: 1px;"></div>
                                </div>
                                <div style="width: 4px; height: 3px; border: 1px solid white; border-radius: 1px;">
                                    <div style="width: 100%; height: 100%; background: white; border-radius: 1px;"></div>
                                </div>
                                <div style="width: 6px; height: 4px; border: 1px solid white; border-radius: 1px; position: relative;">
                                    <div style="width: 75%; height: 100%; background: white; border-radius: 1px;"></div>
                                    <div style="position: absolute; right: -1px; top: 50%; transform: translateY(-50%); width: 1px; height: 2px; background: white; border-radius: 0 1px 1px 0;"></div>
                                </div>
                                <span style="font-size: 10px; color: white;">100</span>
                            </div>
                        </div>

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
                            </div>
                        </div>

                        <!-- 底部导航栏 -->
                        <div class="phone-dock">
                        </div>
                    </div>
                </div>
            `);

      // 将手机按钮添加到send_form中的rightSendForm前面
      const $sendForm = $('#send_form');
      const $rightSendForm = $sendForm.find('#rightSendForm');

      if ($sendForm.length > 0 && $rightSendForm.length > 0) {
        $rightSendForm.before($phoneButton);
        console.log('手机按钮已添加到发送表单中');
      } else {
        // 如果找不到目标位置，则添加到body
        $('body').append($phoneButton);
        console.log('未找到发送表单，手机按钮已添加到body');
      }

      $('body').append($phoneInterface);

      // 绑定应用图标事件（需要在界面创建后绑定）
      this.bindAppIconEvents();
    },

    // 绑定事件
    bindEvents: function () {
      // 手机按钮点击事件 - 智能切换逻辑
      $('#chat_history_btn').on('click', e => {
        e.stopPropagation();
        console.log('Phone button clicked.');

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
            '#avatar_dialog',
            '#group_create_dialog',
            '#add_member_dialog',
            '#accept_task_dialog',
            '#use_item_dialog',
            // Add any other specific top-level modal/dialog IDs that are appended to body
          ];

          let isClickInsideAnyMobileUI = false;
          let insideSelector = null;

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
              }

              // 调用应用的show方法
              appObject.show();

              if (appName !== 'QQApp') {
                // For other apps, hide the entire phone_interface
                setTimeout(() => {
                  // Ensure qq-mode is also removed if another app is opened.
                  $('#phone_interface').removeClass('show show-qq-app-content');
                  $('body').removeClass('qq-app-mode');
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
          }
        });
    },

    // 获取当前系统时间并更新界面时间
    updateTime: function () {
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

      // 更新状态栏时间
      $('#status_time').text(timeStr);

      // 更新主屏幕时间
      $('#home_time_main').text(timeStr);
      $('#home_time_date').text(dateStr);
    },

    // 启动时间更新功能
    startTimeUpdate: function () {
      // 立即更新一次时间
      this.updateTime();

      // 计算到下一分钟的毫秒数
      const now = new Date();
      const delay = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());

      // 先设置一个定时器，在下一个整分钟时触发
      setTimeout(() => {
        // 更新时间
        this.updateTime();

        // 然后设置每分钟更新一次的定时器
        setInterval(() => {
          this.updateTime();
        }, 60000);
      }, delay);
    },

    // 显示手机界面
    show: function () {
      $('#phone_interface').addClass('show').removeClass('show-qq-app-content');
      $('body').removeClass('qq-app-mode');
      this.updateTime();
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
      $('#phone_interface').removeClass('show show-qq-app-content');
      $('body').removeClass('qq-app-mode');
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

      // 关闭淘宝应用界面
      $('#taobao_interface').hide();

      // 关闭任务应用界面
      $('#task_interface').hide();
      $('#accept_task_dialog').remove(); // 任务接受弹窗

      // 关闭背包应用界面
      $('#backpack_interface').hide();
      $('#use_item_dialog').remove(); // 背包使用物品弹窗

      // 关闭抽卡应用界面
      $('#chouka_interface').hide();

      // 关闭任何其他可能的弹窗界面
      $('.app-dialog').hide();
      $('.app-interface').hide();

      // 关闭可能的临时弹窗（使用remove方式），但保留QQ应用的原始对话框
      $('[id*="_dialog"]:not(#chat_history_dialog)').remove();
      $('[id*="_popup"]').remove();

      // Reset phone_interface from QQ mode, but don't hide #phone_interface itself here.
      // The decision to hide #phone_interface is usually up to the phone button or click-outside logic.
      $('#phone_interface').removeClass('show-qq-app-content');
      $('body').removeClass('qq-app-mode');
      console.log('所有应用界面已关闭, show-qq-app-content class removed from phone_interface.');
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
        $('#avatar_dialog').length > 0
      ) {
        return true;
      }

      // 检查其他应用界面
      if (
        $('#taobao_interface').is(':visible') ||
        $('#task_interface').is(':visible') ||
        $('#backpack_interface').is(':visible') ||
        $('#chouka_interface').is(':visible')
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
  };

  // 导出到全局
  window.PhoneInterface = PhoneInterface;
})(window);
