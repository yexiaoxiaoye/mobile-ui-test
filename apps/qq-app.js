// QQ消息应用
(function (window) {
  'use strict';

  const QQApp = {
    // 头像数据存储
    avatarData: {},

    // 头像正则表达式
    avatarRegex: /\[头像\|(\d+)\|([^\]]+)\]/g,

    // 初始化QQ应用界面
    init: function () {
      try {
        console.log('开始初始化QQ消息应用...');

        // 检查依赖
        if (typeof $ === 'undefined') {
          console.error('jQuery未加载，QQ应用初始化失败');
          return;
        }

        if (!window['HQDataExtractor']) {
          console.warn('HQDataExtractor未找到，某些功能可能不可用');
        }

        console.log('正在创建界面...');
        this.createInterface();

        console.log('正在绑定事件...');
        this.bindEvents();

        console.log('正在加载头像数据...');
        this.loadAvatarData();

        console.log('✅ QQ消息应用初始化完成');
      } catch (error) {
        console.error('❌ QQ消息应用初始化失败:', error);
      }
    },

    // 加载头像数据
    loadAvatarData: function () {
      try {
        // 清空当前头像数据
        this.avatarData = {};

        // 只从聊天记录中提取头像数据
        this.loadAvatarDataFromChat();

        console.log('已从聊天记录加载头像数据:', this.avatarData);
      } catch (error) {
        console.error('加载头像数据失败:', error);
        this.avatarData = {};
      }
    },

    // 从聊天记录中提取头像数据
    loadAvatarDataFromChat: function () {
      try {
        // 使用SillyTavern上下文API获取聊天数据
        const SillyTavernContext = this.getSillyTavernContext();
        if (!SillyTavernContext) {
          console.warn('无法获取SillyTavern上下文，回退到DOM扫描方式');
          return this.loadAvatarDataFromDOM();
        }

        const context = SillyTavernContext.getContext();
        if (!context || !context.chat) {
          console.warn('无法获取聊天记录，回退到DOM扫描方式');
          return this.loadAvatarDataFromDOM();
        }

        const messages = context.chat || [];
        console.log(`从SillyTavern上下文获取到${messages.length}条聊天记录`);

        messages.forEach((message, index) => {
          const messageText = message.mes || '';
          let match;

          // 重置正则表达式的索引
          this.avatarRegex.lastIndex = 0;

          while ((match = this.avatarRegex.exec(messageText)) !== null) {
            const qqNumber = match[1];
            const avatarUrl = match[2];
            this.avatarData[qqNumber] = avatarUrl;
            console.log(`从聊天记录提取头像: ${qqNumber} -> ${avatarUrl}`);
          }
        });

        console.log('头像数据提取完成（使用SillyTavern上下文）');
      } catch (error) {
        console.error('从SillyTavern上下文提取头像数据失败:', error);
        console.log('回退到DOM扫描方式');
        this.loadAvatarDataFromDOM();
      }
    },

    // 获取SillyTavern上下文（备用方法）
    getSillyTavernContext: function () {
      return window['SillyTavern'] || window['sillyTavern'];
    },

    // DOM扫描方式（备用方案）
    loadAvatarDataFromDOM: function () {
      try {
        const messageElements = document.querySelectorAll('.mes_text, .mes_block');

        messageElements.forEach(element => {
          const messageText = element.textContent || '';
          let match;

          // 重置正则表达式的索引
          this.avatarRegex.lastIndex = 0;

          while ((match = this.avatarRegex.exec(messageText)) !== null) {
            const qqNumber = match[1];
            const avatarUrl = match[2];
            this.avatarData[qqNumber] = avatarUrl;
            console.log(`从DOM扫描提取头像: ${qqNumber} -> ${avatarUrl}`);
          }
        });

        console.log('头像数据提取完成（使用DOM扫描）');
      } catch (error) {
        console.error('DOM扫描方式提取头像数据也失败:', error);
      }
    },

    // 获取头像URL - 如果内存中没有则重新从聊天记录中读取
    getAvatarUrl: function (qqNumber) {
      // 如果内存中没有该QQ号的头像数据，重新从聊天记录中加载
      if (!this.avatarData[qqNumber]) {
        this.loadAvatarDataFromChat();
      }
      return this.avatarData[qqNumber] || '';
    },

    // 设置头像URL - 只更新到聊天记录，不保存到localStorage
    setAvatarUrl: function (qqNumber, avatarUrl) {
      // 更新内存中的数据
      this.avatarData[qqNumber] = avatarUrl;

      // 只更新聊天记录中的头像信息，不保存到localStorage
      this.updateAvatarInChat(qqNumber, avatarUrl);
    },

    // 更新页面上所有相关的头像显示
    updateAllAvatarDisplays: function (qqNumber, avatarUrl) {
      console.log(`正在更新页面上QQ号${qqNumber}的所有头像显示`);

      // 更新联系人列表中的头像
      $(`.custom-avatar-${qqNumber}`).each(function () {
        $(this).css({
          'background-image': `url(${avatarUrl})`,
          'background-size': 'cover',
          'background-position': 'center',
        });
        $(this).text(''); // 移除"头像"文字
      });

      // 更新聊天消息中的头像
      $(`.message-avatar`).each(function () {
        // 检查是否属于当前QQ号的消息头像
        const $parentContainer = $(this).closest('.custom-qq-cont');
        const $contactWrapper = $parentContainer.closest('.qq-contact-wrapper');
        if ($contactWrapper.data('qq-number') == qqNumber) {
          $(this).css({
            'background-image': `url(${avatarUrl})`,
            'background-size': 'cover',
            'background-position': 'center',
            display: 'block',
          });
          $(this).text(''); // 移除"头像"文字
        }
      });

      console.log(`QQ号${qqNumber}的头像显示已全部更新`);
    },

    // 在聊天记录中更新或添加头像信息
    updateAvatarInChat: function (qqNumber, avatarUrl) {
      try {
        console.log(`正在更新聊天记录中的头像信息: ${qqNumber} -> ${avatarUrl}`);

        // 获取最新的消息元素（最后一条用户消息）
        const userMessages = document.querySelectorAll('.mes[is_user="true"]');
        if (userMessages.length === 0) {
          console.log('未找到用户消息，无法更新头像信息');
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

        // 检查是否已经存在该QQ号的头像信息
        const existingAvatarRegex = new RegExp(`\\[头像\\|${qqNumber}\\|[^\\]]+\\]`, 'g');

        if (existingAvatarRegex.test(messageText)) {
          // 如果存在，则替换
          messageText = messageText.replace(existingAvatarRegex, `[头像|${qqNumber}|${avatarUrl}]`);
        } else {
          // 如果不存在，则在消息末尾添加
          messageText += ` [头像|${qqNumber}|${avatarUrl}]`;
        }

        // 修改消息内容
        this.modifyChatMessage(lastUserMessage, messageText);
      } catch (error) {
        console.error('更新聊天记录中的头像信息失败:', error);
      }
    },

    // 修改聊天消息（参考参考2.js的实现）
    modifyChatMessage: function (messageElement, newContent) {
      try {
        const messageId = messageElement.getAttribute('mesid');
        if (!messageId) {
          console.log('找不到消息ID');
          return;
        }

        console.log('开始修改消息:', messageId);

        // 1. 找到编辑按钮并点击
        const editButton = messageElement.querySelector('.mes_edit');
        if (!editButton) {
          console.log('找不到编辑按钮');
          return;
        }

        editButton.click();

        // 2. 等待编辑框出现并修改内容
        setTimeout(() => {
          const editArea = messageElement.querySelector('.edit_textarea');
          if (!editArea) {
            console.log('找不到编辑文本区域');
            return;
          }

          // 设置新内容
          editArea.value = newContent;
          // 触发input事件
          editArea.dispatchEvent(new Event('input', { bubbles: true }));

          // 3. 点击确认按钮
          setTimeout(() => {
            const editDoneButton = messageElement.querySelector('.mes_edit_done');
            if (!editDoneButton) {
              console.log('找不到确认按钮');
              return;
            }

            editDoneButton.click();
            console.log('头像信息已更新到聊天记录');
          }, 100);
        }, 100);
      } catch (error) {
        console.error('修改消息时出错:', error);
      }
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
          this.updateAllAvatarDisplays(qqNumber, avatarUrl);

          alert('头像设置成功！头像信息已保存到聊天记录中');
        } else {
          alert('请输入有效的头像链接');
        }
        $('#avatar_dialog').remove();
      });
    },

    // 更新时间显示
    updateTime: function () {
      const now = new Date();
      const timeString =
        now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

      // 更新所有状态栏时间显示
      $('.qq-status-time').text(timeString);
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
                    <div style="background: #2c2c2c; color: white; width: 90%; max-width: 600px; height: 90%; margin: auto; border-radius: 10px; display: flex; flex-direction: column;">
                        <!-- 状态栏 -->
                        <div class="qq-status-bar">
                            <div class="qq-status-time">7:13</div>
                            <div class="qq-status-icons">
                                <div class="qq-signal-icon"></div>
                                <div class="qq-battery-icon"></div>
                            </div>
                        </div>

                        <div class="dialog-head" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #555;">
                            <div>
                                <h3 style="margin: 0;" id="charname">QQ</h3>
                                <div style="color:#777"><span class="hgd-show"></span></div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <button id="create_group_btn" style="padding: 8px 12px; font-size: 24px; background: none; border: none; color: black; cursor: pointer;">+</button>
                                <button class="home-btn" id="home_btn_main" title="返回手机首页">🏠︎</button>
                            </div>
                        </div>

                        <div id="history_content" style="flex-grow: 1; overflow-y: auto; padding: 15px;"></div>
                    </div>
                </div>
            `);

      // 创建群组选择弹窗
      const $groupCreateDialog = $(`
                <div id="group_create_dialog" style="z-index:10002;display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1100; flex-direction: column;">
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
                <div id="add_member_dialog" style="z-index:10005;display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1150; flex-direction: column;">
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
      $(document).on('click', '#home_btn_main', function () {
        self.hide();
        if (window.PhoneInterface && typeof window.PhoneInterface.show === 'function') {
          window.PhoneInterface.show(); // This will show phone home and remove qq-content mode
        }
      });

      // 创建群组按钮事件
      $('#create_group_btn').on('click', function () {
        self.showGroupCreateDialog();
      });

      // 关闭群组创建弹窗
      $('#close_group_create_btn, #cancel_create_group_btn').on('click', function () {
        $('#group_create_dialog').hide();
      });

      // 确认创建群组
      $('#confirm_create_group_btn').on('click', function () {
        self.createGroup();
      });

      // 添加群员相关事件
      // 关闭添加群员弹窗
      $('#close_add_member_btn, #cancel_add_member_btn').on('click', function () {
        $('#add_member_dialog').hide();
      });

      // 确认添加群员
      $('#confirm_add_member_btn').on('click', function () {
        self.addGroupMembers();
      });

      this.addClickEventsToQQHao();
      this.addClickEventsToBack();
      this.addClickEventsToQQGroups();
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

      console.log('QQ应用已隐藏');
    },

    // 加载消息
    loadMessages: async function () {
      try {
        console.log('📊 开始从聊天记录抓取数据...');

        // 每次加载消息时，重新从聊天记录中读取最新的头像数据
        this.loadAvatarData();

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
              // 发送的消息 - v0风格右侧气泡
              messageHtml = `
                                <div class="custom-message custom-sent">
                                    <div class="message-bubble">
                                        <div>${msg.content}</div>
                                        <div class="message-time">${messageTime}</div>
                                    </div>
                                    <div class="message-avatar sent-avatar">我</div>
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
                                <div class="chat-header">
                                    <button class="back-to-main-list-btn">←</button>
                                    <div class="chat-title">
                                        <div>${group.name}</div>
                                        <div class="contact-status-qq">群号: ${group.id}</div>
                                    </div>
                                    <button class="add-member-btn" data-group-id="${group.id}" data-group-name="${
            group.name
          }">添加群员</button>
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
              // 假设群聊消息总是来自他人，显示在左侧
              // 如果需要区分群内自己发送的消息，需要更复杂的逻辑和数据结构
              const senderAvatarUrl = this.getAvatarUrl(msg.senderQQ); // 假设msg对象有senderQQ
              let groupAvatarDisplay = '';
              if (senderAvatarUrl) {
                groupAvatarDisplay = `<img src="${senderAvatarUrl}" alt="avatar">`;
              } else {
                groupAvatarDisplay = senderName.charAt(0);
              }

              let messageHtml = `
                                <div class="custom-message custom-received group-message">
                                    <div class="message-avatar group-avatar" style="${
                                      senderAvatarUrl ? '' : 'background-color: #ddd;'
                                    }">${groupAvatarDisplay}</div>
                                    <div class="message-bubble">
                                        <div class="sender-name">${senderName}</div>
                                        <div>${msg.content}</div>
                                        <div class="message-time">${messageTime}</div>
                                    </div>
                                </div>
                            `;

              $groupWrapper.find(`.custom-qun-cont-${group.id}`).append(messageHtml);
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
        $('#group_create_dialog').css('display', 'flex');
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

    // 绑定新的包装容器点击事件
    bindWrapperClickEvents: function () {
      // 头像点击事件
      $('#history_content')
        .off('click', '.custom-avatar')
        .on('click', '.custom-avatar', e => {
          e.stopPropagation();
          const qqNumber = $(e.target).data('qq-number');
          const contactName = $(e.target).data('contact-name');

          console.log('点击头像，QQ号:', qqNumber, '联系人:', contactName);
          this.showAvatarDialog(qqNumber, contactName);
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

          // 设置联系人聊天页面的头部颜色
          $chatPage.find('.chat-header').removeClass('group').addClass('contact');
          $chatPage.find('.send-btn').removeClass('group').addClass('contact');

          $chatPage.addClass('show');
          console.log('已添加show类');

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

          // 设置群组聊天页面的头部颜色
          $chatPage.find('.chat-header').addClass('group');
          $chatPage.find('.send-btn').addClass('group');

          $chatPage.addClass('show');
          console.log('已添加show类');

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
          console.log('点击了聊天页面的小房子按钮，返回手机首页');

          // 隐藏聊天页面
          $(this).closest('.chat-page').removeClass('show');

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

      // 显示发送成功提示
      this.showSendSuccessToast(message, target, isGroup);
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
  };

  // 导出到全局
  window['QQApp'] = QQApp;
})(window);
