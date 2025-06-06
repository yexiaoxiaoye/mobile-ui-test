// QQ数据删除管理系统 - v2.1 (深度修复版本)
(function (window) {
  'use strict';

  console.log('🚀 QQDataManager v2.1 正在加载...(深度修复版本)');

  const QQDataManager = {
    // 获取SillyTavern上下文
    getSillyTavernContext: function () {
      return window['SillyTavern'] || window['sillyTavern'] || globalThis['SillyTavern'] || globalThis['sillyTavern'];
    },

    // 获取聊天数据
    getChatData: async function () {
      try {
        const SillyTavernContext = this.getSillyTavernContext();
        const context = SillyTavernContext ? SillyTavernContext.getContext() : null;
        if (!context) {
          console.error('无法获取SillyTavern上下文');
          return null;
        }

        const chat = context.chat || [];
        console.log(`获取到${chat.length}条聊天记录用于数据管理`);

        return {
          messages: chat,
          chatId: context.chatId,
          characterId: context.characterId,
          groupId: context.groupId,
        };
      } catch (error) {
        console.error('获取聊天数据时出错:', error);
        return null;
      }
    },

    // 核心删除方法：完全删除联系人及所有相关数据
    deleteContact: async function (contactName, qqNumber) {
      try {
        console.log(`🗑️ 开始完全删除联系人: ${contactName} (${qqNumber})`);

        const chatData = await this.getChatData();
        if (!chatData || !chatData.messages) {
          throw new Error('无法获取聊天数据');
        }

        let deletionCount = {
          contactInfo: 0,
          userMessages: 0,
          receivedMessages: 0,
          avatars: 0,
          groupMessages: 0,
        };

        // 遍历所有消息进行删除操作
        for (let i = 0; i < chatData.messages.length; i++) {
          const message = chatData.messages[i];
          let messageText = message.mes || '';
          let modified = false;

          // 1. 删除联系人基本信息: [qq号|姓名|号码|好感度]
          const contactRegex = new RegExp(
            `\\[qq号\\|${this.escapeRegex(contactName)}\\|${this.escapeRegex(qqNumber)}\\|[^\\]]*\\]`,
            'g',
          );
          if (contactRegex.test(messageText)) {
            messageText = messageText.replace(contactRegex, '');
            deletionCount.contactInfo++;
            modified = true;
          }

          // 2. 删除用户发送的消息: [我方消息|QQ号|内容|时间]
          const userMessageRegex = new RegExp(
            `\\[我方消息\\|${this.escapeRegex(qqNumber)}\\|[^\\]]*\\|[^\\]]*\\]`,
            'g',
          );
          if (userMessageRegex.test(messageText)) {
            messageText = messageText.replace(userMessageRegex, '');
            deletionCount.userMessages++;
            modified = true;
          }

          // 3. 删除接收的消息: [对方消息|姓名|QQ号|内容|时间]
          const receivedMessageRegex = new RegExp(
            `\\[对方消息\\|${this.escapeRegex(contactName)}\\|${this.escapeRegex(qqNumber)}\\|[^\\]]*\\|[^\\]]*\\]`,
            'g',
          );
          if (receivedMessageRegex.test(messageText)) {
            messageText = messageText.replace(receivedMessageRegex, '');
            deletionCount.receivedMessages++;
            modified = true;
          }

          // 4. 删除头像信息: [头像|QQ号|头像URL]
          const avatarRegex = new RegExp(`\\[头像\\|${this.escapeRegex(qqNumber)}\\|[^\\]]*\\]`, 'g');
          if (avatarRegex.test(messageText)) {
            messageText = messageText.replace(avatarRegex, '');
            deletionCount.avatars++;
            modified = true;
          }

          // 5. 删除该联系人在群聊中的消息: [群聊消息|群名|群号|发送者|内容|时间]
          const groupMessageRegex = new RegExp(
            `\\[群聊消息\\|[^\\|]*\\|[^\\|]*\\|${this.escapeRegex(contactName)}\\|[^\\]]*\\|[^\\]]*\\]`,
            'g',
          );
          if (groupMessageRegex.test(messageText)) {
            messageText = messageText.replace(groupMessageRegex, '');
            deletionCount.groupMessages++;
            modified = true;
          }

          // 如果消息被修改，则更新到聊天记录中
          if (modified) {
            // 清理多余的空格和换行
            const originalText = message.mes;
            messageText = this.cleanupMessage(messageText);
            console.log('🔧 准备更新消息内容，调用 this.updateMessageContent');
            console.log('📝 原始消息长度:', originalText ? originalText.length : 0);
            console.log('📝 修改后消息长度:', messageText ? messageText.length : 0);
            console.log('📝 删除了:', originalText !== messageText ? '✅ 有删除内容' : '❌ 无变化');

            await this.updateMessageContent(message, messageText);
          }
        }

        // 强制保存聊天记录 - 删除完成后的额外保存
        await this.forceSaveChat();

        console.log(`✅ 删除完成! 联系人: ${contactName} (${qqNumber})`);
        console.log('删除统计:', deletionCount);

        // 验证删除结果
        console.log('🔍 验证删除结果...');
        const validation = await this.validateDeletion('contact', qqNumber);
        console.log('验证结果:', validation);

        if (!validation.valid && validation.remainingData && validation.remainingData.length > 0) {
          console.warn('⚠️ 仍有残留数据:', validation.remainingData);
          return {
            success: false,
            error: `删除不完全，仍有${validation.count}条残留数据`,
            remainingData: validation.remainingData,
          };
        }

        return {
          success: true,
          summary: deletionCount,
          message: `联系人 ${contactName} 及其所有相关数据已完全删除`,
          verified: validation.valid,
        };
      } catch (error) {
        console.error('删除联系人失败:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    },

    // 核心删除方法：完全删除群聊及所有相关数据
    deleteGroup: async function (groupName, groupId) {
      try {
        console.log(`🗑️ 开始完全删除群聊: ${groupName} (${groupId})`);

        const chatData = await this.getChatData();
        if (!chatData || !chatData.messages) {
          throw new Error('无法获取聊天数据');
        }

        let deletionCount = {
          groupInfo: 0,
          groupMessages: 0,
          myGroupMessages: 0,
          relatedData: 0,
        };

        // 遍历所有消息进行删除操作
        for (let i = 0; i < chatData.messages.length; i++) {
          const message = chatData.messages[i];
          let messageText = message.mes || '';
          let modified = false;

          // 1. 删除群聊创建信息: [创建群聊|群号|群名|成员列表]
          const groupInfoRegex = new RegExp(`\\[创建群聊\\|${this.escapeRegex(groupId)}\\|[^\\]]*\\|[^\\]]*\\]`, 'g');
          if (groupInfoRegex.test(messageText)) {
            messageText = messageText.replace(groupInfoRegex, '');
            deletionCount.groupInfo++;
            modified = true;
          }

          // 2. 删除群聊消息: [群聊消息|群名|群号|发送者|内容|时间]
          const groupMessageRegex = new RegExp(
            `\\[群聊消息\\|[^\\|]*\\|${this.escapeRegex(groupId)}\\|[^\\]]*\\|[^\\]]*\\|[^\\]]*\\]`,
            'g',
          );
          if (groupMessageRegex.test(messageText)) {
            messageText = messageText.replace(groupMessageRegex, '');
            deletionCount.groupMessages++;
            modified = true;
          }

          // 3. 删除我方群聊消息: [我方群聊消息|群名|群号|内容|时间]
          const myGroupMessageRegex = new RegExp(
            `\\[我方群聊消息\\|[^\\|]*\\|${this.escapeRegex(groupId)}\\|[^\\]]*\\|[^\\]]*\\]`,
            'g',
          );
          if (myGroupMessageRegex.test(messageText)) {
            messageText = messageText.replace(myGroupMessageRegex, '');
            deletionCount.myGroupMessages++;
            modified = true;
          }

          // 4. 删除其他可能相关的群聊数据
          const otherGroupDataRegex = new RegExp(
            `\\[[^\\]]*\\|[^\\|]*${this.escapeRegex(groupId)}[^\\|]*\\|[^\\]]*\\]`,
            'g',
          );
          if (otherGroupDataRegex.test(messageText)) {
            messageText = messageText.replace(otherGroupDataRegex, '');
            deletionCount.relatedData++;
            modified = true;
          }

          // 如果消息被修改，则更新到聊天记录中
          if (modified) {
            // 清理多余的空格和换行
            messageText = this.cleanupMessage(messageText);
            await this.updateMessageContent(message, messageText);
          }
        }

        // 强制保存聊天记录 - 删除完成后的额外保存
        await this.forceSaveChat();

        console.log(`✅ 删除完成! 群聊: ${groupName} (${groupId})`);
        console.log('删除统计:', deletionCount);

        // 验证删除结果
        console.log('🔍 验证群聊删除结果...');
        const validation = await this.validateDeletion('group', groupId);
        console.log('验证结果:', validation);

        if (!validation.valid && validation.remainingData && validation.remainingData.length > 0) {
          console.warn('⚠️ 仍有残留群聊数据:', validation.remainingData);
          return {
            success: false,
            error: `群聊删除不完全，仍有${validation.count}条残留数据`,
            remainingData: validation.remainingData,
          };
        }

        return {
          success: true,
          summary: deletionCount,
          message: `群聊 ${groupName} 及其所有相关数据已完全删除`,
          verified: validation.valid,
        };
      } catch (error) {
        console.error('删除群聊失败:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    },

    // 批量删除联系人
    batchDeleteContacts: async function (contactList) {
      console.log(`🗑️ 开始批量删除 ${contactList.length} 个联系人...`);

      const results = [];
      let totalSuccess = 0;
      let totalFailed = 0;

      for (const contact of contactList) {
        try {
          const result = await this.deleteContact(contact.name, contact.number);
          results.push({
            contact: contact,
            result: result,
          });

          if (result.success) {
            totalSuccess++;
          } else {
            totalFailed++;
          }
        } catch (error) {
          results.push({
            contact: contact,
            result: { success: false, error: error.message },
          });
          totalFailed++;
        }
      }

      return {
        success: totalFailed === 0,
        totalProcessed: contactList.length,
        totalSuccess: totalSuccess,
        totalFailed: totalFailed,
        details: results,
      };
    },

    // 批量删除群聊
    batchDeleteGroups: async function (groupList) {
      console.log(`🗑️ 开始批量删除 ${groupList.length} 个群聊...`);

      const results = [];
      let totalSuccess = 0;
      let totalFailed = 0;

      for (const group of groupList) {
        try {
          const result = await this.deleteGroup(group.name, group.id);
          results.push({
            group: group,
            result: result,
          });

          if (result.success) {
            totalSuccess++;
          } else {
            totalFailed++;
          }
        } catch (error) {
          results.push({
            group: group,
            result: { success: false, error: error.message },
          });
          totalFailed++;
        }
      }

      return {
        success: totalFailed === 0,
        totalProcessed: groupList.length,
        totalSuccess: totalSuccess,
        totalFailed: totalFailed,
        details: results,
      };
    },

    // 完全清空所有QQ数据
    clearAllQQData: async function () {
      try {
        console.log('🗑️ 开始清空所有QQ相关数据...');

        const chatData = await this.getChatData();
        if (!chatData || !chatData.messages) {
          throw new Error('无法获取聊天数据');
        }

        let deletionCount = {
          contacts: 0,
          messages: 0,
          groups: 0,
          groupMessages: 0,
          avatars: 0,
          userInfo: 0,
        };

        // 定义所有需要删除的QQ相关数据格式
        const qqDataPatterns = [
          { regex: /\[qq号\|[^\]]*\]/g, type: 'contacts' },
          { regex: /\[我方消息\|[^\]]*\]/g, type: 'messages' },
          { regex: /\[对方消息\|[^\]]*\]/g, type: 'messages' },
          { regex: /\[创建群聊\|[^\]]*\]/g, type: 'groups' },
          { regex: /\[群聊消息\|[^\]]*\]/g, type: 'groupMessages' },
          { regex: /\[我方群聊消息\|[^\]]*\]/g, type: 'groupMessages' },
          { regex: /\[头像\|[^\]]*\]/g, type: 'avatars' },
          { regex: /\[用户信息\|[^\]]*\]/g, type: 'userInfo' },
          { regex: /\[用户头像\|[^\]]*\]/g, type: 'userInfo' },
        ];

        // 遍历所有消息进行清理
        for (let i = 0; i < chatData.messages.length; i++) {
          const message = chatData.messages[i];
          let messageText = message.mes || '';
          let modified = false;

          // 应用所有删除模式
          for (const pattern of qqDataPatterns) {
            if (pattern.regex.test(messageText)) {
              const matches = messageText.match(pattern.regex);
              if (matches) {
                deletionCount[pattern.type] += matches.length;
                messageText = messageText.replace(pattern.regex, '');
                modified = true;
              }
            }
            // 重置正则表达式的lastIndex
            pattern.regex.lastIndex = 0;
          }

          // 如果消息被修改，则更新到聊天记录中
          if (modified) {
            messageText = this.cleanupMessage(messageText);
            await this.updateMessageContent(message, messageText);
          }
        }

        console.log('✅ 所有QQ数据清空完成!');
        console.log('删除统计:', deletionCount);

        return {
          success: true,
          summary: deletionCount,
          message: '所有QQ相关数据已完全清空',
        };
      } catch (error) {
        console.error('清空所有QQ数据失败:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    },

    // 更新消息内容到SillyTavern
    updateMessageContent: async function (message, newContent) {
      console.log(
        '🔧 调用 updateMessageContent，消息类型:',
        typeof message,
        '是否有mes属性:',
        message && message.mes !== undefined,
      );

      try {
        // 检查是否是DOM元素还是消息对象
        if (message && typeof message === 'object' && message.mes !== undefined) {
          // 这是一个SillyTavern消息对象
          console.log('✅ 处理SillyTavern消息对象');
          console.log('📝 原消息内容长度:', (message.mes || '').length);
          console.log('📝 新消息内容长度:', (newContent || '').length);

          // 直接更新消息对象的内容，不依赖ID
          const oldContent = message.mes;
          message.mes = newContent;

          console.log('✅ 消息内容已直接更新');
          console.log('📝 内容变化:', oldContent === newContent ? '无变化' : '已修改');

          // 强制保存聊天记录 - 修复版本
          try {
            const SillyTavernContext = this.getSillyTavernContext();
            if (SillyTavernContext) {
              const context = SillyTavernContext.getContext();

              // 方法1: 尝试使用 saveChat 方法
              if (typeof context.saveChat === 'function') {
                await context.saveChat();
                console.log('💾 已调用 context.saveChat()');
                return true;
              }

              // 方法2: 尝试使用 SillyTavern.saveChat
              if (typeof SillyTavernContext.saveChat === 'function') {
                await SillyTavernContext.saveChat();
                console.log('💾 已调用 SillyTavern.saveChat()');
                return true;
              }

              // 方法3: 尝试使用 window.saveChat (全局函数)
              if (typeof window.saveChat === 'function') {
                await window.saveChat();
                console.log('💾 已调用 window.saveChat()');
                return true;
              }

              // 方法4: 尝试使用 parent 窗口的保存函数
              if (window.parent && typeof window.parent.saveChat === 'function') {
                await window.parent.saveChat();
                console.log('💾 已调用 parent.saveChat()');
                return true;
              }

              // 方法5: 尝试触发保存事件
              if (typeof window.dispatchEvent === 'function') {
                const saveEvent = new CustomEvent('chat_save_required', {
                  detail: { chatId: context.chatId },
                });
                window.dispatchEvent(saveEvent);
                console.log('💾 已触发 chat_save_required 事件');
              }

              // 方法6: 尝试使用酒馆助手的保存方法
              if (window.TavernHelper && typeof window.TavernHelper.saveChat === 'function') {
                await window.TavernHelper.saveChat();
                console.log('💾 已调用 TavernHelper.saveChat()');
                return true;
              }

              // 方法7: 尝试使用 fetch 直接保存到 SillyTavern 后端
              try {
                const chatData = {
                  chat: context.chat,
                  chatId: context.chatId,
                  characterId: context.characterId,
                };

                const response = await fetch('/api/chats/save', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': context.getRequestHeaders?.()?.['X-CSRF-TOKEN'] || '',
                  },
                  body: JSON.stringify(chatData),
                });

                if (response.ok) {
                  console.log('💾 通过 API 保存成功');
                  return true;
                }
              } catch (apiError) {
                console.log('💾 API 保存方法失败:', apiError.message);
              }

              // 最后手段：强制刷新聊天记录
              if (typeof context.reloadCurrentChat === 'function') {
                setTimeout(async () => {
                  console.log('🔄 延迟执行聊天重载以确保保存');
                  await context.reloadCurrentChat();
                }, 1000);
              }

              console.log('⚠️ 已尝试所有保存方法，消息已更新到内存');
            }
          } catch (saveError) {
            console.warn('⚠️ 保存时出现非关键错误:', saveError.message);
          }

          return true;
        } else if (message && message.querySelector) {
          // 这是一个DOM元素，使用原有的DOM操作方法
          console.log('⚠️ 处理DOM元素（不推荐用于删除操作）');
          const editArea = message.querySelector('.edit_textarea');
          if (!editArea) return false;

          editArea.value = newContent;
          editArea.dispatchEvent(new Event('input', { bubbles: true }));

          setTimeout(() => {
            const editDoneButton = message.querySelector('.mes_edit_done');
            if (editDoneButton) {
              editDoneButton.click();
            }
          }, 100);

          return true;
        } else {
          console.warn('❌ 无效的消息对象类型:', typeof message, message);
          return false;
        }
      } catch (error) {
        console.error('❌ 更新消息内容失败:', error);
        return false;
      }
    },

    // 清理消息文本
    cleanupMessage: function (messageText) {
      return messageText
        .replace(/\s+/g, ' ') // 合并多个空格
        .replace(/^\s+|\s+$/g, '') // 删除首尾空格
        .replace(/\n\s*\n/g, '\n') // 删除多余的空行
        .trim();
    },

    // 转义正则表达式特殊字符
    escapeRegex: function (input) {
      // 确保输入是字符串，如果不是则转换为字符串
      const str = String(input || '');
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    // 验证删除结果
    validateDeletion: async function (targetType, targetId) {
      try {
        const chatData = await this.getChatData();
        if (!chatData || !chatData.messages) {
          return { valid: false, error: '无法获取聊天数据' };
        }

        let remainingData = [];

        for (const message of chatData.messages) {
          const messageText = message.mes || '';

          // 根据类型检查是否还有残留数据
          if (targetType === 'contact') {
            const contactPatterns = [
              new RegExp(`\\[qq号\\|[^\\|]*\\|${this.escapeRegex(targetId)}\\|[^\\]]*\\]`, 'g'),
              new RegExp(`\\[我方消息\\|${this.escapeRegex(targetId)}\\|[^\\]]*\\]`, 'g'),
              new RegExp(`\\[对方消息\\|[^\\|]*\\|${this.escapeRegex(targetId)}\\|[^\\]]*\\]`, 'g'),
              new RegExp(`\\[头像\\|${this.escapeRegex(targetId)}\\|[^\\]]*\\]`, 'g'),
            ];

            for (const pattern of contactPatterns) {
              const matches = messageText.match(pattern);
              if (matches) {
                remainingData.push(...matches);
              }
            }
          } else if (targetType === 'group') {
            const groupPatterns = [
              new RegExp(`\\[创建群聊\\|${this.escapeRegex(targetId)}\\|[^\\]]*\\]`, 'g'),
              new RegExp(`\\[群聊消息\\|[^\\|]*\\|${this.escapeRegex(targetId)}\\|[^\\]]*\\]`, 'g'),
              new RegExp(`\\[我方群聊消息\\|[^\\|]*\\|${this.escapeRegex(targetId)}\\|[^\\]]*\\]`, 'g'),
            ];

            for (const pattern of groupPatterns) {
              const matches = messageText.match(pattern);
              if (matches) {
                remainingData.push(...matches);
              }
            }
          }
        }

        return {
          valid: remainingData.length === 0,
          remainingData: remainingData,
          count: remainingData.length,
        };
      } catch (error) {
        console.error('验证删除结果失败:', error);
        return { valid: false, error: error.message };
      }
    },

    // 强制保存聊天记录
    forceSaveChat: async function () {
      console.log('💾 开始强制保存聊天记录...');

      try {
        const SillyTavernContext = this.getSillyTavernContext();
        if (!SillyTavernContext) {
          console.warn('无法获取SillyTavern上下文');
          return false;
        }

        const context = SillyTavernContext.getContext();
        let saveSuccess = false;

        // 方法1: 使用TavernHelper的setChatMessages（最可靠的方法）
        try {
          if (window.TavernHelper && typeof window.TavernHelper.setChatMessages === 'function') {
            console.log('💾 尝试使用 TavernHelper.setChatMessages 保存');

            // 获取当前聊天消息
            const chatMessages = context.chat || [];
            console.log(`💾 准备保存 ${chatMessages.length} 条消息`);

            // 转换消息格式为TavernHelper期望的格式
            const formattedMessages = chatMessages.map(msg => ({
              role: msg.is_user ? 'user' : 'assistant',
              message: msg.mes || '',
              name: msg.name || '',
              is_system: msg.is_system || false,
              // 保留原始属性
              ...msg,
            }));

            // 使用setChatMessages保存，这会触发真正的保存
            await window.TavernHelper.setChatMessages(
              formattedMessages,
              { refresh: 'none' }, // 不刷新界面，避免闪烁
            );

            console.log('💾 成功使用 TavernHelper.setChatMessages 保存');
            saveSuccess = true;
          }
        } catch (error) {
          console.log('💾 TavernHelper.setChatMessages 保存失败:', error.message);
        }

        // 方法2: 尝试父窗口的TavernHelper
        if (!saveSuccess) {
          try {
            if (
              window.parent &&
              window.parent.TavernHelper &&
              typeof window.parent.TavernHelper.setChatMessages === 'function'
            ) {
              console.log('💾 尝试使用 parent.TavernHelper.setChatMessages 保存');

              const chatMessages = context.chat || [];
              const formattedMessages = chatMessages.map(msg => ({
                role: msg.is_user ? 'user' : 'assistant',
                message: msg.mes || '',
                name: msg.name || '',
                is_system: msg.is_system || false,
                ...msg,
              }));

              await window.parent.TavernHelper.setChatMessages(formattedMessages, { refresh: 'none' });

              console.log('💾 成功使用 parent.TavernHelper.setChatMessages 保存');
              saveSuccess = true;
            }
          } catch (error) {
            console.log('💾 parent.TavernHelper.setChatMessages 保存失败:', error.message);
          }
        }

        // 方法3: 尝试所有可能的保存方法
        if (!saveSuccess) {
          const saveMethods = [
            { name: 'context.saveChat', fn: () => context.saveChat?.() },
            { name: 'SillyTavern.saveChat', fn: () => SillyTavernContext.saveChat?.() },
            { name: 'window.saveChat', fn: () => window.saveChat?.() },
            { name: 'parent.saveChat', fn: () => window.parent?.saveChat?.() },
          ];

          for (const method of saveMethods) {
            try {
              if (method.fn && typeof method.fn() === 'function') {
                await method.fn()();
                console.log(`💾 成功使用 ${method.name} 保存`);
                saveSuccess = true;
                break;
              }
            } catch (error) {
              console.log(`💾 ${method.name} 保存失败:`, error.message);
            }
          }
        }

        // 方法4: 如果所有方法都失败，尝试最后的手段
        if (!saveSuccess) {
          // 触发页面刷新前的保存事件
          try {
            window.addEventListener('beforeunload', () => {
              if (context && typeof context.saveChat === 'function') {
                context.saveChat();
              }
            });
            console.log('💾 已添加页面刷新前保存监听器');
          } catch (error) {
            console.log('💾 添加保存监听器失败:', error.message);
          }

          // 模拟用户手动保存操作
          try {
            // 查找保存按钮并点击
            const saveButton = document.querySelector(
              '[title="Save chat"], .menu_button[title*="save"], #save_chat_btn',
            );
            if (saveButton) {
              saveButton.click();
              console.log('💾 已模拟点击保存按钮');
              saveSuccess = true;
            }
          } catch (error) {
            console.log('💾 模拟保存按钮点击失败:', error.message);
          }
        }

        // 方法5: 最后的尝试 - 直接保存到localStorage（备用）
        if (!saveSuccess) {
          try {
            const chatData = {
              chat: context.chat,
              chatId: context.chatId,
              lastSaved: Date.now(),
            };
            localStorage.setItem(`sillytavern_chat_backup_${context.chatId}`, JSON.stringify(chatData));
            console.log('💾 已保存聊天记录到本地存储作为备份');
          } catch (error) {
            console.log('💾 本地存储备份失败:', error.message);
          }
        }

        return saveSuccess;
      } catch (error) {
        console.error('💾 强制保存聊天记录失败:', error);
        return false;
      }
    },

    // ===================== UI 界面管理功能 =====================

    // 页面状态管理
    currentPage: 'main_list',
    activeTab: 'create',

    // 页面状态常量
    PageStates: {
      MAIN_LIST: 'main_list',
      FRIEND_MANAGER: 'friend_manager',
      CHAT_DETAIL: 'chat_detail',
    },

    // 显示好友群组管理页面
    showFriendManager: function () {
      console.log('🎯 显示好友群组管理页面');

      // 检查是否在手机界面模式下
      const isInPhoneMode = $('#phone_interface').hasClass('show-qq-app-content');

      if (isInPhoneMode) {
        this.showFriendManagerInPhone();
      } else {
        this.showFriendManagerStandalone();
      }

      this.currentPage = this.PageStates.FRIEND_MANAGER;

      // 触发好友管理页面显示事件，用于统一按钮样式刷新
      setTimeout(() => {
        $(document).trigger('friend-manager-shown');
      }, 100);
    },

    // 在手机界面内显示好友群组管理
    showFriendManagerInPhone: function () {
      const $container = $('#phone_interface .qq-app-container');
      if ($container.length === 0) {
        console.error('手机界面容器不存在');
        return;
      }

      // 创建好友管理界面HTML
      const friendManagerHtml = this.createFriendManagerHTML();
      $container.html(friendManagerHtml);

      // 绑定事件
      this.bindFriendManagerEvents();

      // 加载数据
      this.loadFriendManagerData();
    },

    // 独立显示好友群组管理（备用方案）
    showFriendManagerStandalone: function () {
      // 隐藏主列表
      $('#history_content > .qq-contact-wrapper').hide();
      $('#history_content > .qq-group-wrapper').hide();

      // 在主容器中显示好友管理界面
      const $historyContent = $('#history_content');
      const friendManagerHtml = this.createFriendManagerHTML();
      $historyContent.append(`<div class="qq-friend-group-manager-page show">${friendManagerHtml}</div>`);

      // 绑定事件
      this.bindFriendManagerEvents();

      // 加载数据
      this.loadFriendManagerData();
    },

    // 创建好友管理界面HTML
    createFriendManagerHTML: function () {
      return `
        <div class="friend-manager">
          <!-- 动态岛 -->
          <div class="dynamic-island"></div>



          <!-- 页面头部 -->
          <div class="page-header">
            <div class="header-row">
              <div class="header-left">
                <button class="back-button" id="friend_manager_back_btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </button>
                <div class="page-title">好友与群组管理</div>
              </div>
              <div class="header-actions">
                <button class="more-button">⋯</button>
                <button class="home-button friend-manager-home-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/>
                    <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 选项卡导航 -->
            <div class="tab-navigation">
              <button class="tab-button active" data-tab="create">创建群聊</button>
              <button class="tab-button" data-tab="manage">管理好友和群聊</button>
            </div>
          </div>

          <!-- 内容区域 -->
          <div class="content-area">
            <!-- 背景图片 -->
            <div class="content-background"></div>

            <!-- 内容容器 -->
            <div class="content-container">
              <!-- 创建群聊选项卡内容 -->
              <div class="tab-content active" id="create_tab_content">
                <!-- 群名称输入 -->
                <div class="card">
                  <label class="form-label">群名称：</label>
                  <input type="text" class="form-input" id="group_name_input" placeholder="请输入群名称">
                </div>

                <!-- 成员选择 -->
                <div class="card">
                  <h4 class="section-title">选择成员：</h4>
                  <div class="member-list" id="create_member_list">
                    <!-- 成员列表将在这里动态加载 -->
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="action-buttons">
                  <button class="btn btn-primary" id="confirm_create_group_btn">确认创建</button>
                  <button class="btn btn-outline" id="cancel_create_group_btn">取消</button>
                </div>
              </div>

              <!-- 管理好友和群聊选项卡内容 -->
              <div class="tab-content" id="manage_tab_content">
                <!-- 添加好友区域 -->
                <div class="card">
                  <h4 class="section-title">添加好友</h4>
                  <div style="margin-bottom: 12px;">
                    <input type="text" class="form-input" id="new_friend_name" placeholder="好友名称">
                  </div>
                  <div style="margin-bottom: 12px;">
                    <input type="text" class="form-input" id="new_friend_qq" placeholder="好友QQ号">
                  </div>
                  <button class="btn btn-primary" id="add_friend_btn">添加好友</button>
                </div>

                <!-- 管理好友区域 -->
                <div class="card">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h4 class="section-title" style="margin-bottom: 0;">管理好友 <span class="section-count" id="friends_count">(0)</span></h4>
                    <div>
                      <button class="btn btn-small btn-outline" id="select_all_friends_btn">全选</button>
                      <button class="btn btn-small btn-danger" id="batch_delete_friends_btn">批量删除</button>
                    </div>
                  </div>
                  <div class="member-list" id="manage_friends_list">
                    <!-- 好友列表将在这里动态加载 -->
                  </div>
                </div>

                <!-- 管理群聊区域 -->
                <div class="card">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h4 class="section-title" style="margin-bottom: 0;">管理群聊 <span class="section-count" id="groups_count">(0)</span></h4>
                    <div>
                      <button class="btn btn-small btn-outline" id="select_all_groups_btn">全选</button>
                      <button class="btn btn-small btn-danger" id="batch_delete_groups_btn">批量删除</button>
                    </div>
                  </div>
                  <div class="member-list" id="manage_groups_list">
                    <!-- 群聊列表将在这里动态加载 -->
                  </div>
                </div>

                <!-- 危险操作区域 -->
                <div class="card" style="border: 1px solid #fca5a5;">
                  <h4 class="section-title" style="color: #dc2626;">危险操作</h4>
                  <button class="btn btn-danger" id="clear_all_data_btn">清空所有QQ数据</button>
                  <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">此操作将删除所有联系人、群聊和聊天记录，不可恢复！</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部指示器 -->
          <div class="home-indicator"></div>
        </div>
      `;
    },

    // 绑定好友管理界面事件
    bindFriendManagerEvents: function () {
      const self = this;

      // 返回按钮
      $(document)
        .off('click', '#friend_manager_back_btn')
        .on('click', '#friend_manager_back_btn', function (e) {
          e.stopPropagation();
          self.hideFriendManager();
        });

      // 主页按钮
      $(document)
        .off('click', '.friend-manager-home-btn')
        .on('click', '.friend-manager-home-btn', function (e) {
          e.stopPropagation();
          e.preventDefault();

          // 隐藏好友管理页面
          self.hideFriendManager();

          // 隐藏QQ应用
          if (window.QQApp && typeof window.QQApp.hide === 'function') {
            window.QQApp.hide();
          }

          // 显示手机界面
          if (window.PhoneInterface && typeof window.PhoneInterface.show === 'function') {
            window.PhoneInterface.show();
          }
        });

      // 选项卡切换
      $(document)
        .off('click', '.friend-manager .tab-button')
        .on('click', '.friend-manager .tab-button', function () {
          const tab = $(this).data('tab');
          self.switchTab(tab);
        });

      // 添加好友
      $(document)
        .off('click', '#add_friend_btn')
        .on('click', '#add_friend_btn', function () {
          self.addFriend();
        });

      // 创建群聊
      $(document)
        .off('click', '#confirm_create_group_btn')
        .on('click', '#confirm_create_group_btn', function () {
          self.createGroup();
        });

      // 取消创建群聊
      $(document)
        .off('click', '#cancel_create_group_btn')
        .on('click', '#cancel_create_group_btn', function () {
          self.resetCreateForm();
        });

      // 全选好友
      $(document)
        .off('click', '#select_all_friends_btn')
        .on('click', '#select_all_friends_btn', function () {
          self.toggleSelectAllFriends();
        });

      // 批量删除好友
      $(document)
        .off('click', '#batch_delete_friends_btn')
        .on('click', '#batch_delete_friends_btn', function () {
          self.batchDeleteSelectedFriends();
        });

      // 全选群聊
      $(document)
        .off('click', '#select_all_groups_btn')
        .on('click', '#select_all_groups_btn', function () {
          self.toggleSelectAllGroups();
        });

      // 批量删除群聊
      $(document)
        .off('click', '#batch_delete_groups_btn')
        .on('click', '#batch_delete_groups_btn', function () {
          self.batchDeleteSelectedGroups();
        });

      // 清空所有数据
      $(document)
        .off('click', '#clear_all_data_btn')
        .on('click', '#clear_all_data_btn', function () {
          self.clearAllData();
        });

      // 委托事件：删除单个好友
      $(document)
        .off('click', '.delete-friend-btn')
        .on('click', '.delete-friend-btn', function (e) {
          e.stopPropagation();
          const qqNumber = $(this).data('qq-number');
          const friendName = $(this).data('friend-name');
          self.deleteFriend(friendName, qqNumber);
        });

      // 委托事件：删除单个群聊
      $(document)
        .off('click', '.delete-group-btn')
        .on('click', '.delete-group-btn', function (e) {
          e.stopPropagation();
          const groupId = $(this).data('group-id');
          const groupName = $(this).data('group-name');
          self.deleteGroupById(groupName, groupId);
        });
    },

    // 切换选项卡
    switchTab: function (tab) {
      this.activeTab = tab;

      // 更新选项卡按钮状态
      $('.friend-manager .tab-button').removeClass('active');
      $(`.friend-manager .tab-button[data-tab="${tab}"]`).addClass('active');

      // 更新内容显示
      $('.friend-manager .tab-content').removeClass('active');
      if (tab === 'create') {
        $('#create_tab_content').addClass('active');
      } else {
        $('#manage_tab_content').addClass('active');
      }
    },

    // 加载好友管理数据
    loadFriendManagerData: async function () {
      try {
        // 检查数据提取器是否可用
        if (!window.HQDataExtractor) {
          console.error('HQDataExtractor 不可用，无法加载数据');
          // 显示空状态
          this.loadCreateMemberList([]);
          this.loadManageFriendsList([]);
          this.loadManageGroupsList([]);
          $('#friends_count').text('(0)');
          $('#groups_count').text('(0)');
          return;
        }

        console.log('🔄 开始加载好友管理数据...');

        // 获取联系人数据
        const contacts = await window.HQDataExtractor.extractQQContacts();
        const groups = await window.HQDataExtractor.extractQQGroups();

        console.log(`📊 加载完成: ${contacts.length} 个联系人, ${groups.length} 个群聊`);

        // 加载创建群聊的成员列表
        this.loadCreateMemberList(contacts);

        // 加载管理页面的好友列表
        this.loadManageFriendsList(contacts);

        // 加载管理页面的群聊列表
        this.loadManageGroupsList(groups);

        // 更新统计数字
        $('#friends_count').text(`(${contacts.length})`);
        $('#groups_count').text(`(${groups.length})`);

        console.log('✅ 好友管理数据加载完成');
      } catch (error) {
        console.error('加载好友管理数据失败:', error);

        // 显示空状态作为备用
        this.loadCreateMemberList([]);
        this.loadManageFriendsList([]);
        this.loadManageGroupsList([]);
        $('#friends_count').text('(0)');
        $('#groups_count').text('(0)');
      }
    },

    // 加载创建群聊的成员列表
    loadCreateMemberList: function (contacts) {
      const $list = $('#create_member_list');
      $list.empty();

      if (contacts.length === 0) {
        $list.html('<div class="empty-state"><h3>暂无联系人</h3><p>请先添加好友</p></div>');
        return;
      }

      contacts.forEach(contact => {
        const avatarUrl = window.QQApp ? window.QQApp.getAvatarUrl(contact.number) : '';
        const avatarDisplay = avatarUrl ? `<img src="${avatarUrl}" alt="avatar">` : contact.name.charAt(0);

        const memberHtml = `
          <div class="member-item">
            <input type="checkbox" class="checkbox member-checkbox" data-qq-number="${contact.number}" data-qq-name="${contact.name}">
            <div class="member-avatar">${avatarDisplay}</div>
            <div class="member-info">
              <div class="member-name">${contact.name}</div>
              <div class="member-details">QQ: ${contact.number}</div>
            </div>
          </div>
        `;
        $list.append(memberHtml);
      });
    },

    // 加载管理页面的好友列表
    loadManageFriendsList: function (contacts) {
      const $list = $('#manage_friends_list');
      $list.empty();

      if (contacts.length === 0) {
        $list.html('<div class="empty-state"><h3>暂无好友</h3><p>点击上方"添加好友"按钮添加好友</p></div>');
        return;
      }

      contacts.forEach(contact => {
        const avatarUrl = window.QQApp ? window.QQApp.getAvatarUrl(contact.number) : '';
        const avatarDisplay = avatarUrl ? `<img src="${avatarUrl}" alt="avatar">` : contact.name.charAt(0);

        const memberHtml = `
          <div class="member-item">
            <input type="checkbox" class="checkbox member-checkbox friend-checkbox" data-qq-number="${contact.number}" data-friend-name="${contact.name}">
            <div class="member-avatar">${avatarDisplay}</div>
            <div class="member-info">
              <div class="member-name">${contact.name}</div>
              <div class="member-details">QQ: ${contact.number}</div>
            </div>
            <div class="member-actions">
              <button class="btn btn-small btn-danger delete-friend-btn" data-qq-number="${contact.number}" data-friend-name="${contact.name}">删除</button>
            </div>
          </div>
        `;
        $list.append(memberHtml);
      });
    },

    // 加载管理页面的群聊列表
    loadManageGroupsList: function (groups) {
      const $list = $('#manage_groups_list');
      $list.empty();

      if (groups.length === 0) {
        $list.html('<div class="empty-state"><h3>暂无群聊</h3><p>点击"创建群聊"选项卡创建群聊</p></div>');
        return;
      }

      groups.forEach(group => {
        const memberHtml = `
          <div class="member-item">
            <input type="checkbox" class="checkbox member-checkbox group-checkbox" data-group-id="${
              group.id
            }" data-group-name="${group.name}">
            <div class="member-avatar" style="background: linear-gradient(135deg, #4A90E2, #357ABD);">
              ${group.name.charAt(0)}
            </div>
            <div class="member-info">
              <div class="member-name">${group.name}</div>
              <div class="member-details">群号: ${group.id}</div>
            </div>
            <div class="member-actions">
              <button class="btn btn-small btn-danger delete-group-btn" data-group-id="${group.id}" data-group-name="${
          group.name
        }">删除</button>
            </div>
          </div>
        `;
        $list.append(memberHtml);
      });
    },

    // 添加好友
    addFriend: async function () {
      const friendName = $('#new_friend_name').val().trim();
      const friendQQ = $('#new_friend_qq').val().trim();

      if (!friendName || !friendQQ) {
        alert('请输入完整的好友信息');
        return;
      }

      try {
        // 生成好感度（随机值）
        const favorability = Math.floor(Math.random() * 100);

        // 构建联系人信息格式
        const contactInfo = `[qq号|${friendName}|${friendQQ}|${favorability}]`;

        // 获取最后一条用户消息
        const lastUserMessage = this.getLastUserMessage();
        if (lastUserMessage) {
          const messageTextElement = lastUserMessage.querySelector('.mes_text');
          if (messageTextElement) {
            const currentText = messageTextElement.textContent || '';
            const newText = currentText + ` ${contactInfo}`;

            // 修改消息
            await this.modifyChatMessage(lastUserMessage, newText);
          }
        }

        // 清空输入框
        $('#new_friend_name').val('');
        $('#new_friend_qq').val('');

        // 重新加载数据
        this.loadFriendManagerData();

        alert(`好友 ${friendName} 添加成功！`);
      } catch (error) {
        console.error('添加好友失败:', error);
        alert('添加好友失败: ' + error.message);
      }
    },

    // 创建群聊
    createGroup: async function () {
      const groupName = $('#group_name_input').val().trim();
      const selectedMembers = [];

      // 获取选中的成员
      $('#create_member_list .member-checkbox:checked').each(function () {
        selectedMembers.push({
          name: $(this).data('qq-name'),
          number: $(this).data('qq-number'),
        });
      });

      if (!groupName) {
        alert('请输入群名称');
        return;
      }

      if (selectedMembers.length === 0) {
        alert('请至少选择一个成员');
        return;
      }

      try {
        // 生成群号
        const groupId = this.generateGroupId();

        // 创建成员列表字符串
        const memberNames = ['我', ...selectedMembers.map(m => m.name)];
        const membersString = memberNames.join('、');

        // 构建群聊信息格式
        const groupInfo = `[创建群聊|${groupId}|${groupName}|${membersString}]`;

        // 获取最后一条用户消息
        const lastUserMessage = this.getLastUserMessage();
        if (lastUserMessage) {
          const messageTextElement = lastUserMessage.querySelector('.mes_text');
          if (messageTextElement) {
            const currentText = messageTextElement.textContent || '';
            const newText = currentText + ` ${groupInfo}`;

            // 修改消息
            await this.modifyChatMessage(lastUserMessage, newText);
          }
        }

        // 重置表单
        this.resetCreateForm();

        // 重新加载数据
        this.loadFriendManagerData();

        alert(`群聊"${groupName}"创建成功！群号: ${groupId}`);
      } catch (error) {
        console.error('创建群聊失败:', error);
        alert('创建群聊失败: ' + error.message);
      }
    },

    // 重置创建表单
    resetCreateForm: function () {
      $('#group_name_input').val('');
      $('#create_member_list .member-checkbox').prop('checked', false);
    },

    // 删除好友
    deleteFriend: async function (friendName, qqNumber) {
      if (!confirm(`确定要删除好友 ${friendName} (${qqNumber}) 及其所有聊天记录吗？`)) {
        return;
      }

      try {
        const result = await this.deleteContact(friendName, qqNumber);

        if (result.success) {
          alert(
            `好友删除成功！\n删除统计:\n- 联系人信息: ${result.summary.contactInfo}\n- 头像: ${result.summary.avatars}\n- 我方消息: ${result.summary.userMessages}\n- 对方消息: ${result.summary.receivedMessages}\n- 群聊消息: ${result.summary.groupMessages}`,
          );

          // 重新加载数据
          this.loadFriendManagerData();
        } else {
          alert('删除好友失败: ' + result.error);
        }
      } catch (error) {
        console.error('删除好友失败:', error);
        alert('删除好友失败: ' + error.message);
      }
    },

    // 删除群聊
    deleteGroupById: async function (groupName, groupId) {
      if (!confirm(`确定要删除群聊 ${groupName} (${groupId}) 及其所有聊天记录吗？`)) {
        return;
      }

      try {
        const result = await this.deleteGroup(groupName, groupId);

        if (result.success) {
          alert(
            `群聊删除成功！\n删除统计:\n- 群聊信息: ${result.summary.groupInfo}\n- 群聊消息: ${result.summary.groupMessages}\n- 我方群聊消息: ${result.summary.myGroupMessages}\n- 相关数据: ${result.summary.relatedData}`,
          );

          // 重新加载数据
          this.loadFriendManagerData();
        } else {
          alert('删除群聊失败: ' + result.error);
        }
      } catch (error) {
        console.error('删除群聊失败:', error);
        alert('删除群聊失败: ' + error.message);
      }
    },

    // 切换全选好友
    toggleSelectAllFriends: function () {
      const $checkboxes = $('#manage_friends_list .friend-checkbox');
      const $button = $('#select_all_friends_btn');

      const allChecked = $checkboxes.length > 0 && $checkboxes.filter(':checked').length === $checkboxes.length;

      if (allChecked) {
        $checkboxes.prop('checked', false);
        $button.text('全选');
      } else {
        $checkboxes.prop('checked', true);
        $button.text('取消全选');
      }
    },

    // 批量删除选中的好友
    batchDeleteSelectedFriends: async function () {
      const selectedFriends = [];

      $('#manage_friends_list .friend-checkbox:checked').each(function () {
        selectedFriends.push({
          name: $(this).data('friend-name'),
          number: $(this).data('qq-number'),
        });
      });

      if (selectedFriends.length === 0) {
        alert('请先选择要删除的好友');
        return;
      }

      if (!confirm(`确定要删除选中的 ${selectedFriends.length} 个好友及其所有聊天记录吗？`)) {
        return;
      }

      try {
        const result = await this.batchDeleteContacts(selectedFriends);

        if (result.success) {
          alert(`批量删除完成！\n成功: ${result.totalSuccess}\n失败: ${result.totalFailed}`);
        } else {
          alert(`批量删除部分失败！\n成功: ${result.totalSuccess}\n失败: ${result.totalFailed}`);
        }

        // 重新加载数据
        this.loadFriendManagerData();
      } catch (error) {
        console.error('批量删除好友失败:', error);
        alert('批量删除好友失败: ' + error.message);
      }
    },

    // 切换全选群聊
    toggleSelectAllGroups: function () {
      const $checkboxes = $('#manage_groups_list .group-checkbox');
      const $button = $('#select_all_groups_btn');

      const allChecked = $checkboxes.length > 0 && $checkboxes.filter(':checked').length === $checkboxes.length;

      if (allChecked) {
        $checkboxes.prop('checked', false);
        $button.text('全选');
      } else {
        $checkboxes.prop('checked', true);
        $button.text('取消全选');
      }
    },

    // 批量删除选中的群聊
    batchDeleteSelectedGroups: async function () {
      const selectedGroups = [];

      $('#manage_groups_list .group-checkbox:checked').each(function () {
        selectedGroups.push({
          name: $(this).data('group-name'),
          id: $(this).data('group-id'),
        });
      });

      if (selectedGroups.length === 0) {
        alert('请先选择要删除的群聊');
        return;
      }

      if (!confirm(`确定要删除选中的 ${selectedGroups.length} 个群聊及其所有聊天记录吗？`)) {
        return;
      }

      try {
        const result = await this.batchDeleteGroups(selectedGroups);

        if (result.success) {
          alert(`批量删除完成！\n成功: ${result.totalSuccess}\n失败: ${result.totalFailed}`);
        } else {
          alert(`批量删除部分失败！\n成功: ${result.totalSuccess}\n失败: ${result.totalFailed}`);
        }

        // 重新加载数据
        this.loadFriendManagerData();
      } catch (error) {
        console.error('批量删除群聊失败:', error);
        alert('批量删除群聊失败: ' + error.message);
      }
    },

    // 清空所有数据
    clearAllData: async function () {
      if (
        !confirm(
          '⚠️ 警告！\n\n这将删除所有QQ相关数据，包括：\n- 所有联系人信息\n- 所有聊天记录\n- 所有群聊数据\n- 所有头像信息\n\n此操作不可恢复！确定要继续吗？',
        )
      ) {
        return;
      }

      try {
        const result = await this.clearAllQQData();

        if (result.success) {
          alert(
            `所有QQ数据已清空！\n删除统计:\n- 联系人: ${result.summary.contacts}\n- 头像: ${result.summary.avatars}\n- 消息: ${result.summary.messages}\n- 群聊: ${result.summary.groups}\n- 群聊消息: ${result.summary.groupMessages}\n- 用户信息: ${result.summary.userInfo}`,
          );

          // 重新加载数据
          this.loadFriendManagerData();
        } else {
          alert('清空数据失败: ' + result.error);
        }
      } catch (error) {
        console.error('清空所有数据失败:', error);
        alert('清空所有数据失败: ' + error.message);
      }
    },

    // 隐藏好友管理页面
    hideFriendManager: function () {
      console.log('🎯 隐藏好友群组管理页面');

      // 检查是否在手机界面模式下
      const isInPhoneMode = $('#phone_interface').hasClass('show-qq-app-content');

      if (isInPhoneMode) {
        // 清空手机界面容器，将显示权交还给QQ应用
        const $container = $('#phone_interface .qq-app-container');
        $container.empty();

        // 重新显示QQ主界面
        if (window.QQApp && typeof window.QQApp.showInPhoneInterface === 'function') {
          window.QQApp.showInPhoneInterface();
        }
      } else {
        // 移除好友管理页面
        $('.qq-friend-group-manager-page').remove();

        // 显示主列表
        $('#history_content > .qq-contact-wrapper').show();
        $('#history_content > .qq-group-wrapper').show();
      }

      this.currentPage = this.PageStates.MAIN_LIST;
    },

    // 辅助方法：生成群号
    generateGroupId: function () {
      return Math.floor(100000000 + Math.random() * 900000000).toString();
    },

    // 辅助方法：获取最后一条用户消息
    getLastUserMessage: function () {
      const userMessages = document.querySelectorAll('.mes[is_user="true"]');
      return userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
    },

    // 辅助方法：修改聊天消息（复用QQ应用的方法）
    modifyChatMessage: async function (messageElement, newContent) {
      try {
        const messageId = messageElement.getAttribute('mesid');
        if (!messageId) return;

        const editButton = messageElement.querySelector('.mes_edit');
        if (!editButton) return;

        editButton.click();

        setTimeout(() => {
          this.updateMessageContent(messageElement, newContent);
        }, 100);
      } catch (error) {
        console.error('修改消息时出错:', error);
      }
    },

    // 更新好友管理界面中的头像显示 - 添加防抖
    updateFriendManagerAvatars: function () {
      // 清除之前的定时器
      if (window.QQApp && window.QQApp.updateTimers && window.QQApp.updateTimers.friendManager) {
        clearTimeout(window.QQApp.updateTimers.friendManager);
      }

      // 防抖处理
      const updateTimer = setTimeout(() => {
        this.performFriendManagerAvatarUpdate();
      }, 150);

      if (window.QQApp && window.QQApp.updateTimers) {
        window.QQApp.updateTimers.friendManager = updateTimer;
      }
    },

    // 执行好友管理界面头像更新
    performFriendManagerAvatarUpdate: function () {
      // 首先检查好友管理界面是否存在
      const $friendManagerPage = $('.qq-friend-group-manager-page');

      if ($friendManagerPage.length === 0) {
        console.log('🔄 好友管理页面不存在，跳过头像更新');
        return;
      }

      console.log('🔄 更新好友管理界面中的头像显示');

      // 检查所有可能的好友管理界面选择器
      const friendManagerSelectors = [
        '#create_member_list .member-item',
        '#manage_friends_list .member-item',
        '.member-list .member-item',
        '.friend-list .friend-item',
        '.contact-list .contact-item',
      ];

      let totalUpdated = 0;

      friendManagerSelectors.forEach((selector, index) => {
        const $elements = $(selector);
        console.log(`🔍 选择器 ${index + 1} "${selector}" 找到 ${$elements.length} 个元素`);

        $elements.each(function (i) {
          const $item = $(this);

          // 尝试多种方式获取QQ号
          let qqNumber = null;
          const possibleSelectors = ['.member-checkbox', '.friend-checkbox', '.contact-checkbox', '[data-qq-number]'];

          possibleSelectors.forEach(checkboxSelector => {
            if (!qqNumber) {
              const $checkbox = $item.find(checkboxSelector);
              if ($checkbox.length > 0) {
                qqNumber = $checkbox.data('qq-number') || $checkbox.attr('data-qq-number');
              }
            }
          });

          if (qqNumber && window.QQApp) {
            const avatarUrl = window.QQApp.getAvatarUrl(qqNumber);
            const avatarConfig = window.QQApp.avatarData[`${qqNumber}_config`];

            // 尝试多种头像选择器
            const avatarSelectors = ['.member-avatar', '.friend-avatar', '.contact-avatar', '.avatar'];

            let $avatar = null;
            avatarSelectors.forEach(avatarSelector => {
              if (!$avatar || $avatar.length === 0) {
                $avatar = $item.find(avatarSelector);
              }
            });

            if ($avatar && $avatar.length > 0 && avatarUrl) {
              // 应用头像和变换效果
              let css = {
                'background-image': `url(${avatarUrl})`,
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
              } else {
                // 默认样式
                css['background-size'] = 'cover';
                css['background-position'] = 'center';
              }

              $avatar.css(css).text('');
              totalUpdated++;
            }
          }
        });
      });

      console.log(`✅ 好友管理界面头像更新完成，总共更新了 ${totalUpdated} 个头像`);
    },
  };

  // 导出到全局
  window['QQDataManager'] = QQDataManager;

  // 添加加载完成的调试信息
  console.log('🔧 QQDataManager 已加载并导出到全局');
  console.log('🔧 QQDataManager.showFriendManager 方法存在:', typeof QQDataManager.showFriendManager);
})(window);
