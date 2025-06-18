// 任务应用
(function (window) {
  'use strict';

  const TaskApp = {
    currentTasks: null,
    selectedTab: '可接任务',
    selectedTask: null,
    showConfirmModal: false,

    // 用户点数
    userPoints: 1250,

    // 初始化任务应用
    init: async function () {
      console.log('🎯 初始化任务应用（手机界面内集成）');
      await this.calculateUserPoints();
      this.createInterface();
      this.bindEvents();
      console.log('✅ 任务应用已初始化');
    },

    // 计算用户点数
    calculateUserPoints: async function () {
      try {
        // 重置点数
        this.userPoints = 0;

        // 检查HQDataExtractor是否可用
        if (!window['HQDataExtractor'] || typeof window['HQDataExtractor'].extractPointsData !== 'function') {
          console.warn('任务应用: HQDataExtractor未加载，使用DOM扫描方式');
          return this.calculateUserPointsFromDOM();
        }

        // 使用HQDataExtractor从SillyTavern上下文获取点数数据
        const pointsData = await window['HQDataExtractor'].extractPointsData();

        if (pointsData && pointsData.summary) {
          this.userPoints = pointsData.summary.netPoints;
          console.log(
            `任务应用点数计算: 获得${pointsData.summary.totalEarned} - 消耗${pointsData.summary.totalSpent} = 剩余${this.userPoints}`,
          );

          // 如果需要，可以显示详细的点数记录
          if (pointsData.all && pointsData.all.length > 0) {
            console.log('点数记录详情:', pointsData.all);
          }
        } else {
          console.log('任务应用: 未找到点数记录');
        }

        // 更新点数显示
        this.updatePointsDisplay();

        return this.userPoints;
      } catch (error) {
        console.error('任务应用计算点数时出错:', error);
        console.log('任务应用: 尝试使用DOM扫描方式作为备用方案');
        return this.calculateUserPointsFromDOM();
      }
    },

    // DOM扫描方式计算点数（备用方案）
    calculateUserPointsFromDOM: function () {
      try {
        // 重置点数
        this.userPoints = 0;

        // 获取所有聊天消息文本
        const $messageElements = $('body').find('.mes_text');
        let earnedPoints = 0;
        let spentPoints = 0;

        // 定义正则表达式来匹配获得点数和消耗点数格式
        const earnedPointsRegex = /\[获得点数\|(\d+)\]/g;
        const spentPointsRegex = /\[消耗点数\|(\d+)\]/g;

        if ($messageElements.length > 0) {
          $messageElements.each(function () {
            try {
              const messageText = $(this).text();

              // 提取获得点数
              let earnedMatch;
              earnedPointsRegex.lastIndex = 0; // 重置正则表达式索引
              while ((earnedMatch = earnedPointsRegex.exec(messageText)) !== null) {
                const points = parseInt(earnedMatch[1]);
                earnedPoints += points;
                console.log(`发现获得点数: ${points}`);
              }

              // 提取消耗点数
              let spentMatch;
              spentPointsRegex.lastIndex = 0; // 重置正则表达式索引
              while ((spentMatch = spentPointsRegex.exec(messageText)) !== null) {
                const points = parseInt(spentMatch[1]);
                spentPoints += points;
                console.log(`发现消耗点数: ${points}`);
              }
            } catch (error) {
              console.error('解析消息时出错:', error);
            }
          });
        }

        // 计算净点数
        this.userPoints = earnedPoints - spentPoints;
        console.log(`任务应用点数计算(DOM方式): 获得${earnedPoints} - 消耗${spentPoints} = 剩余${this.userPoints}`);

        // 更新点数显示
        this.updatePointsDisplay();

        return this.userPoints;
      } catch (error) {
        console.error('DOM方式计算点数也失败:', error);
        this.userPoints = 0;
        this.updatePointsDisplay();
        return 0;
      }
    },

    // 更新点数显示
    updatePointsDisplay: function () {
      const pointsText = `当前点数: ${this.userPoints}`;
      $('.task-points-display').text(pointsText);
    },

    // 创建界面（在主手机界面内）
    createInterface: function () {
      console.log('🛠️ 创建任务应用界面（在主手机界面内）');

      // 检查主手机界面
      const $phoneInterface = $('#phone_interface');
      if ($phoneInterface.length === 0) {
        console.error('❌ 主手机界面不存在，无法创建任务应用');
        return;
      }

      // 查找或创建任务应用容器
      let $taskContainer = $phoneInterface.find('.task-app-container');
      if ($taskContainer.length === 0) {
        $taskContainer = $(`
                <div class="task-app-container" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 30;">
                    <!-- 任务应用内容将在这里动态创建 -->
                </div>
            `);
        $phoneInterface.append($taskContainer);
      }

      this.bindEvents();
    },

    // 绑定事件
    bindEvents: function () {
      const self = this;

      // 点击手机外部关闭应用（使用主手机界面）
      $(document).on('click.taskApp', function (e) {
        const $phoneInterface = $('#phone_interface');
        if ($phoneInterface.length && $phoneInterface.hasClass('show-task-app-content')) {
          // 检查点击是否在手机界面外部
          if (!$(e.target).closest('#phone_interface').length) {
            self.hide();
            // 返回手机主页
            if (window.PhoneInterface && typeof window.PhoneInterface.show === 'function') {
              window.PhoneInterface.show();
            }
          }
          // 检查点击是否在任务应用内部 - 如果是，阻止事件冒泡
          else if ($(e.target).closest('.task-app-container').length) {
            // 在任务应用内部点击，不做任何处理，让事件正常处理
            return;
          }
        }
      });
    },

    // 创建应用HTML内容
    createAppHTML: function () {
      return `
            <div class="task-app">
                <!-- 状态栏兼容区域 -->
                <div class="task-app-status-spacer"></div>

                <!-- 应用头部 -->
                <div class="task-app-header">
                    <div class="task-app-header-content">
                        <div class="task-app-title-section">
                            <div class="task-app-title-indicator"></div>
                            <h1 class="task-app-title">任务管理</h1>
                        </div>
                        <div class="task-app-header-buttons">
                            <button class="task-app-btn task-app-refresh-btn" onclick="TaskApp.sendViewTasksMessage()" title="刷新任务">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                                    <path d="M21 3v5h-5"/>
                                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                                    <path d="M3 21v-5h5"/>
                                </svg>
                            </button>
                            <button class="task-app-btn task-app-points-btn" title="点击刷新点数">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                                </svg>
                                <span class="task-points-display">${this.userPoints}</span>
                            </button>
                            <button class="task-app-btn task-app-home-btn" onclick="TaskApp.goHome()" title="返回首页">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                    <polyline points="9,22 9,12 15,12 15,22"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 任务标签页 -->
                <div class="task-app-tabs">
                    <div class="task-app-tabs-container">
                        <button class="task-app-tab active" data-tab="available">
                            <span class="task-app-tab-emoji">📋</span>
                            可接任务
                        </button>
                        <button class="task-app-tab" data-tab="accepted">
                            <span class="task-app-tab-emoji">⏳</span>
                            已接任务
                        </button>
                        <button class="task-app-tab" data-tab="completed">
                            <span class="task-app-tab-emoji">✅</span>
                            已完成
                        </button>
                    </div>
                </div>

                <!-- 任务列表区域 -->
                <div class="task-app-content">
                    <div id="task_content_area" class="task-app-list">
                        <!-- 任务列表将在这里动态生成 -->
                    </div>
                </div>
            </div>
        `;
    },

    // 在手机界面内显示应用
    showInPhoneInterface: function () {
      console.log('📱 在手机界面内显示任务应用');

      const $phoneInterface = $('#phone_interface');
      const $taskContainer = $phoneInterface.find('.task-app-container');

      // 创建应用内容并添加到容器中
      const appContent = this.createAppHTML();
      $taskContainer.html(appContent);

      // 显示应用容器，隐藏主屏幕内容
      $phoneInterface.find('.phone-background, .phone-home-screen, .phone-dock').hide();
      $phoneInterface.find('.qq-app-container, .taobao-app-container').hide(); // 隐藏其他应用
      $taskContainer.show();

      // 绑定应用内的事件
      this.bindAppEvents();

      // 渲染任务内容
      this.renderTaskContent();
    },

    // 显示任务应用
    show: async function () {
      console.log('🎯 显示任务应用');

      const $phoneInterface = $('#phone_interface');
      if ($phoneInterface.length === 0) {
        console.error('❌ 主手机界面不存在');
        return;
      }

      // 确保界面已创建
      if ($phoneInterface.find('.task-app-container').length === 0) {
        this.createInterface();
      }

      // 在手机界面内显示应用
      this.showInPhoneInterface();

      try {
        const tasks = await window['HQDataExtractor'].extractTasks();
        // 分析聊天记录中的任务状态
        const taskStates = this.analyzeTaskStatesFromChat();
        // 根据聊天记录重新分类任务
        this.currentTasks = this.filterTasksByStates(tasks, taskStates);
        this.showTaskTab('available');
      } catch (error) {
        console.error('加载任务数据时出错:', error);
      }
    },

    // 隐藏任务应用
    hide: function () {
      console.log('🏠 隐藏任务应用');

      const $phoneInterface = $('#phone_interface');
      const $taskContainer = $phoneInterface.find('.task-app-container');

      if ($taskContainer.length > 0) {
        $taskContainer.hide();
      }

      // 显示主屏幕内容
      $phoneInterface.find('.phone-background, .phone-home-screen, .phone-dock').show();

      // 解绑任务应用的点击事件
      $(document).off('click.taskApp');
    },

    // 返回手机主页
    goHome: function () {
      console.log('🏠 返回手机主页');

      // 1. 立即隐藏应用容器，不使用动画
      const $phoneInterface = $('#phone_interface');
      const $taskContainer = $phoneInterface.find('.task-app-container');

      if ($taskContainer.length > 0) {
        $taskContainer.hide();
      }

      // 2. 移除应用模式
      $phoneInterface.removeClass('show-task-app-content');
      $('body').removeClass('task-app-mode');

      // 3. 显示主屏幕内容
      $phoneInterface.find('.phone-background, .phone-home-screen, .phone-dock').show();

      // 4. 解绑任务应用的点击事件
      $(document).off('click.taskApp');

      // 5. 确保手机界面处于正确状态，但禁用动画
      if (window.PhoneInterface && typeof window.PhoneInterface.show === 'function') {
        // 临时禁用动画
        const originalTransition = $phoneInterface.css('transition');
        $phoneInterface.css('transition', 'none');

        // 调用显示方法
        window.PhoneInterface.show();

        // 在下一帧恢复动画
        setTimeout(() => {
          $phoneInterface.css('transition', originalTransition);
        }, 0);
      }
    },

    // 绑定应用内事件
    bindAppEvents: function () {
      const self = this;

      // 绑定标签页点击事件
      $('.task-app-tab').on('click', function () {
        $('.task-app-tab').removeClass('active');
        $(this).addClass('active');
        const tab = $(this).data('tab');
        self.selectedTab = tab === 'available' ? '可接任务' : tab === 'accepted' ? '已接任务' : '已完成';
        self.showTaskTab(tab);
      });

      // 绑定刷新点数按钮
      $('.task-app-points-btn').on('click', async function () {
        await self.calculateUserPoints();
        await self.refreshTaskStates();
        self.showSuccessMessage('点数和任务状态已刷新！');
      });
    },

    // 渲染任务内容
    renderTaskContent: function () {
      // 更新点数显示
      this.updatePointsDisplay();

      // 显示默认标签页
      if (this.currentTasks) {
        this.showTaskTab('available');
      }
    },

    // 更新点数显示
    updatePointsDisplay: function () {
      $('.task-points-display').text(`${this.userPoints}点`);
    },

    // 显示成功消息
    showSuccessMessage: function (message) {
      // 创建一个简单的提示框
      const $toast = $(`
            <div class="task-app-toast" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 500;
                z-index: 10010;
                box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
                animation: toastSlideIn 0.3s ease;
            ">
                <span style="margin-right: 8px;">✓</span>
                ${message}
            </div>
        `);

      // 添加动画样式
      $('head').append(`
            <style>
                @keyframes toastSlideIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
            </style>
        `);

      $('body').append($toast);

      // 3秒后自动移除
      setTimeout(() => {
        $toast.fadeOut(300, function () {
          $(this).remove();
        });
      }, 3000);
    },

    // 分析聊天记录中的任务状态
    analyzeTaskStatesFromChat: function () {
      const taskStates = {
        accepted: new Set(), // 已接受的任务ID
        completed: new Set(), // 已完成的任务ID
      };

      try {
        // 获取SillyTavern上下文
        let chatMessages = [];

        // 尝试通过全局变量获取聊天消息
        if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
          const context = SillyTavern.getContext();
          if (context && context.chat) {
            chatMessages = context.chat;
          }
        }

        // 如果上面的方法不行，尝试直接从DOM获取
        if (chatMessages.length === 0) {
          const $messageElements = $('#chat .mes_text');
          $messageElements.each(function () {
            const messageText = $(this).text();
            if (messageText) {
              chatMessages.push({ mes: messageText });
            }
          });
        }

        console.log(`任务应用: 分析了${chatMessages.length}条聊天消息`);

        // 分析消息内容，查找任务相关信息
        chatMessages.forEach(message => {
          const messageText = message.mes || message;

          // 查找任务接受消息
          // 格式：我接受了任务#123：任务名称，任务描述：...
          const acceptedTaskRegex = /我接受了任务#(\w+)：/g;
          let acceptedMatch;
          while ((acceptedMatch = acceptedTaskRegex.exec(messageText)) !== null) {
            const taskId = acceptedMatch[1];
            taskStates.accepted.add(taskId);
            console.log(`发现已接受任务: ${taskId}`);
          }

          // 查找任务完成消息
          // 可能的格式：完成了任务#123，任务#123已完成，任务#123完成 等
          const completedTaskRegex = /(?:完成了任务#|任务#(\w+)(?:已完成|完成))/g;
          let completedMatch;
          while ((completedMatch = completedTaskRegex.exec(messageText)) !== null) {
            const taskId = completedMatch[1] || completedMatch[0].match(/#(\w+)/)?.[1];
            if (taskId) {
              taskStates.completed.add(taskId);
              console.log(`发现已完成任务: ${taskId}`);
            }
          }

          // 查找其他可能的任务完成标记
          // 格式：[任务完成|123] 或类似格式
          const completedMarkRegex = /\[任务完成\|(\w+)\]/g;
          let completedMarkMatch;
          while ((completedMarkMatch = completedMarkRegex.exec(messageText)) !== null) {
            const taskId = completedMarkMatch[1];
            taskStates.completed.add(taskId);
            console.log(`发现任务完成标记: ${taskId}`);
          }
        });

        console.log('任务状态分析结果:', {
          accepted: Array.from(taskStates.accepted),
          completed: Array.from(taskStates.completed),
        });

        return taskStates;
      } catch (error) {
        console.error('分析任务状态时出错:', error);
        return { accepted: new Set(), completed: new Set() };
      }
    },

    // 根据聊天记录中的状态重新分类任务
    filterTasksByStates: function (originalTasks, taskStates) {
      const filteredTasks = {
        available: [],
        accepted: [],
        completed: [],
      };

      // 处理原始的可接任务
      if (originalTasks.available) {
        originalTasks.available.forEach(task => {
          const taskId = task.id;

          if (taskStates.completed.has(taskId)) {
            // 如果在聊天记录中发现已完成，移动到已完成
            filteredTasks.completed.push(task);
          } else if (taskStates.accepted.has(taskId)) {
            // 如果在聊天记录中发现已接受，移动到已接受
            filteredTasks.accepted.push(task);
          } else {
            // 否则保持在可接任务中
            filteredTasks.available.push(task);
          }
        });
      }

      // 处理原始的已接任务
      if (originalTasks.accepted) {
        originalTasks.accepted.forEach(task => {
          const taskId = task.id;

          if (taskStates.completed.has(taskId)) {
            // 如果在聊天记录中发现已完成，移动到已完成
            filteredTasks.completed.push(task);
          } else {
            // 否则保持在已接受中
            filteredTasks.accepted.push(task);
          }
        });
      }

      // 处理原始的已完成任务
      if (originalTasks.completed) {
        originalTasks.completed.forEach(task => {
          filteredTasks.completed.push(task);
        });
      }

      console.log('任务过滤结果:', {
        available: filteredTasks.available.length,
        accepted: filteredTasks.accepted.length,
        completed: filteredTasks.completed.length,
      });

      return filteredTasks;
    },

    // 显示任务标签页（v0风格）
    showTaskTab: function (tabType) {
      const tasks = this.currentTasks;
      if (!tasks) return;

      const $contentArea = $('#task_content_area');
      $contentArea.empty();

      let taskList = [];
      switch (tabType) {
        case 'available':
          taskList = tasks.available;
          break;
        case 'accepted':
          taskList = tasks.accepted;
          break;
        case 'completed':
          taskList = tasks.completed;
          break;
      }

      if (taskList.length > 0) {
        const tasksHtml = taskList
          .map(task => {
            const difficultyClass = this.getDifficultyClass(task.difficulty || '简单');
            const statusClass = this.getStatusClass(tabType);

            return `
            <div class="task-app-task-card ${tabType === 'available' ? 'clickable' : ''}"
                 data-task-id="${task.id}"
                 data-task-name="${task.name}"
                 data-task-desc="${task.description || '无描述'}"
                 data-task-reward="${task.reward}">

              <!-- 任务头部 -->
              <div class="task-app-task-header">
                <div class="task-app-task-info">
                  <div class="task-app-task-title-row">
                    <h3 class="task-app-task-title">${task.name}</h3>
                    <span class="task-app-difficulty-badge ${difficultyClass}">
                      ${task.difficulty || '简单'}
                    </span>
                  </div>
                  <div class="task-app-task-id">任务ID: ${task.id}</div>
                </div>
                <div class="task-app-task-reward ${statusClass}">
                  +${task.reward}点
                </div>
              </div>

              <!-- 任务描述 -->
              <p class="task-app-task-description">${task.description || '无描述'}</p>

              <!-- 任务底部 -->
              <div class="task-app-task-footer">
                <div class="task-app-task-publisher">
                  发布人: <span class="task-app-publisher-name">${task.publisher || '系统'}</span>
                </div>
                ${tabType === 'available' ? '<div class="task-app-accept-hint">点击接受任务</div>' : ''}
              </div>
            </div>
          `;
          })
          .join('');

        $contentArea.html(tasksHtml);

        // 为可接任务添加点击事件
        if (tabType === 'available') {
          $('.task-app-task-card.clickable').on('click', e => {
            const $card = $(e.currentTarget);
            const taskData = {
              id: $card.data('task-id'),
              name: $card.data('task-name'),
              description: $card.data('task-desc'),
              reward: $card.data('task-reward'),
            };
            this.showAcceptTaskDialog(taskData);
          });
        }
      } else {
        const emptyMessage =
          tabType === 'available'
            ? '暂时没有可接的任务'
            : tabType === 'accepted'
            ? '您还没有接受任何任务'
            : '您还没有完成任何任务';

        $contentArea.html(`
          <div class="task-app-empty-state">
            <div class="task-app-empty-icon">📝</div>
            <div class="task-app-empty-title">暂无任务</div>
            <div class="task-app-empty-desc">${emptyMessage}</div>
          </div>
        `);
      }
    },

    // 获取难度样式类
    getDifficultyClass: function (difficulty) {
      switch (difficulty) {
        case '简单':
          return 'difficulty-easy';
        case '中等':
          return 'difficulty-medium';
        case '困难':
          return 'difficulty-hard';
        default:
          return 'difficulty-easy';
      }
    },

    // 获取状态样式类
    getStatusClass: function (status) {
      switch (status) {
        case 'accepted':
          return 'status-accepted';
        case 'completed':
          return 'status-completed';
        default:
          return 'status-available';
      }
    },

    // 显示接受任务确认对话框（v0风格）
    showAcceptTaskDialog: function (task) {
      const difficultyClass = this.getDifficultyClass(task.difficulty || '简单');

      const $dialog = $(`
        <div id="accept_task_dialog" class="task-app-modal-overlay">
          <div class="task-app-modal">
            <!-- 模态框头部 -->
            <div class="task-app-modal-header">
              <h2 class="task-app-modal-title">确认接受任务</h2>
              <button class="task-app-modal-close" onclick="$('#accept_task_dialog').remove()">
                ✕
              </button>
            </div>

            <!-- 任务信息 -->
            <div class="task-app-modal-content">
              <div class="task-app-modal-task-info">
                <div class="task-app-modal-task-header">
                  <h3 class="task-app-modal-task-title">${task.name}</h3>
                  <span class="task-app-difficulty-badge ${difficultyClass}">
                    ${task.difficulty || '简单'}
                  </span>
                </div>
                <div class="task-app-modal-task-id">任务ID: ${task.id}</div>
              </div>

              <p class="task-app-modal-task-description">${task.description || '无描述'}</p>

              <div class="task-app-modal-task-details">
                <div class="task-app-modal-task-publisher">
                  发布人: <span class="task-app-modal-publisher-name">${task.publisher || '系统'}</span>
                </div>
                <div class="task-app-modal-task-reward">+${task.reward}点</div>
              </div>
            </div>

            <!-- 模态框按钮 -->
            <div class="task-app-modal-actions">
              <button class="task-app-modal-btn task-app-modal-btn-cancel" onclick="$('#accept_task_dialog').remove()">
                取消
              </button>
              <button class="task-app-modal-btn task-app-modal-btn-confirm" id="confirm_accept_task">
                <span class="task-app-modal-btn-icon">✓</span>
                确认接受
              </button>
            </div>
          </div>
        </div>
      `);

      $('body').append($dialog);

      // 绑定确认按钮事件
      $('#confirm_accept_task').on('click', () => {
        this.acceptTask(task);
        $dialog.remove();
      });

      // 点击背景关闭对话框
      $dialog.on('click', function (e) {
        if (e.target === this) {
          $(this).remove();
        }
      });
    },

    // 接受任务并发送快捷回复
    acceptTask: function (task) {
      console.log('正在接受任务:', task);

      const self = this; // 保存this引用

      // 延迟执行，避免干扰正在进行的发送操作
      setTimeout(() => {
        try {
          // 检查聊天输入框是否空闲 - 使用jQuery方式避免类型错误
          const $originalInput = $('#send_textarea');
          const $sendButton = $('#send_but');

          // 检查元素是否存在并且是textarea元素
          if ($originalInput.length > 0 && $sendButton.length > 0) {
            const isDisabled = $originalInput.prop('disabled');
            const currentValue = $originalInput.val() || '';

            if (!isDisabled && !$sendButton.hasClass('disabled') && currentValue === '') {
              // 构造消息文本
              const message = `我接受了任务#${task.id}：${task.name}，任务描述：${
                task.description || '无描述'
              }，完成后可获得${task.reward}点数！`;
              $originalInput.val(message);

              // 触发输入事件，让系统知道输入框内容已更改
              $originalInput.trigger('input');

              // 给系统一点时间处理输入事件
              setTimeout(() => {
                // 如果发送按钮可用，点击发送
                if (!$sendButton.hasClass('disabled')) {
                  $sendButton.click();
                  console.log('任务接受消息已发送');

                  // 延迟刷新任务状态，等待消息发送完成
                  setTimeout(async () => {
                    await self.refreshTaskStates();
                  }, 1000);
                }
              }, 200);

              // 显示成功提示
              self.showSuccessMessage(`成功接受任务：${task.name}`);
            } else {
              console.warn('聊天输入框不可用或正在忙碌中');
              alert('当前聊天输入框不可用，请稍后再试');
            }
          } else {
            console.warn('未找到聊天输入框元素');
            alert('未找到聊天输入框，请确保页面已正确加载');
          }
        } catch (error) {
          console.error('发送任务接受消息时出错：', error);
          alert('发送消息时出错，请手动发送');
        }
      }, 500);
    },

    // 显示成功消息
    showSuccessMessage: function (message) {
      const $successMsg = $(`
                <div style="position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 15px 20px; border-radius: 8px; z-index: 3000; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                    <i style="margin-right: 8px;">✓</i>${message}
                </div>
            `);

      $('body').append($successMsg);

      // 3秒后自动消失
      setTimeout(() => {
        $successMsg.fadeOut(300, function () {
          $(this).remove();
        });
      }, 3000);
    },

    // 刷新任务状态
    refreshTaskStates: async function () {
      try {
        console.log('正在刷新任务状态...');

        // 重新获取任务数据
        const tasks = await window['HQDataExtractor'].extractTasks();

        // 重新分析聊天记录中的任务状态
        const taskStates = this.analyzeTaskStatesFromChat();

        // 根据聊天记录重新分类任务
        this.currentTasks = this.filterTasksByStates(tasks, taskStates);

        // 获取当前活跃的标签页
        const $activeTab = $('.task-app-tab.active');
        const activeTabType = $activeTab.data('tab') || 'available';

        // 刷新当前标签页显示
        this.showTaskTab(activeTabType);

        console.log('任务状态刷新完成');
      } catch (error) {
        console.error('刷新任务状态时出错:', error);
      }
    },

    // 发送查看任务消息（快速回复）
    sendViewTasksMessage: function () {
      console.log('正在发送查看任务消息...');

      const self = this; // 保存this引用

      // 延迟执行，避免干扰正在进行的发送操作
      setTimeout(() => {
        try {
          // 检查聊天输入框是否空闲 - 使用jQuery方式避免类型错误
          const $originalInput = $('#send_textarea');
          const $sendButton = $('#send_but');

          // 检查元素是否存在并且是textarea元素
          if ($originalInput.length > 0 && $sendButton.length > 0) {
            const isDisabled = $originalInput.prop('disabled');
            const currentValue = $originalInput.val() || '';

            if (!isDisabled && !$sendButton.hasClass('disabled') && currentValue === '') {
              // 构造查看任务消息
              const message = '查看任务';
              $originalInput.val(message);

              // 触发输入事件，让系统知道输入框内容已更改
              $originalInput.trigger('input');

              // 给系统一点时间处理输入事件
              setTimeout(() => {
                // 如果发送按钮可用，点击发送
                if (!$sendButton.hasClass('disabled')) {
                  $sendButton.click();
                  console.log('查看任务消息已发送');

                  // 延迟刷新任务状态，等待消息发送完成
                  setTimeout(async () => {
                    await self.refreshTaskStates();
                  }, 2000);
                }
              }, 200);

              // 显示成功提示
              self.showSuccessMessage('查看任务消息已发送');
            } else {
              console.warn('聊天输入框不可用或正在忙碌中');
              alert('当前聊天输入框不可用，请稍后再试');
            }
          } else {
            console.warn('未找到聊天输入框元素');
            alert('未找到聊天输入框，请确保页面已正确加载');
          }
        } catch (error) {
          console.error('发送查看任务消息时出错：', error);
          alert('发送消息时出错，请手动发送');
        }
      }, 500);
    },
  };

  // 导出到全局
  window['TaskApp'] = TaskApp;
})(window);
