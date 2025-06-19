// 数据提取器
(function (window) {
  'use strict';

  const HQDataExtractor = {
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
        console.log(`从上下文获取到${chat.length}条聊天记录`);

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

    // 解析聊天消息
    parseChatMessages: async function () {
      try {
        const chatData = await this.getChatData();
        if (!chatData || !chatData.messages) {
          console.error('获取聊天记录失败或格式不正确');
          return [];
        }

        return chatData.messages.map((message, index) => {
          return {
            id: index,
            sender: message.is_user ? 'user' : 'char',
            name: message.name || 'Unknown',
            content: message.mes || '',
            timestamp: message.send_date,
            extra: message.extra,
            original: message,
          };
        });
      } catch (error) {
        console.error('解析聊天记录时出错:', error);
        return [];
      }
    },

    // 使用正则表达式提取数据
    extractDataWithRegex: function (messages, regex, dataType = 'unknown') {
      const results = [];

      messages.forEach((message, messageIndex) => {
        if (!message.content) return;

        let match;
        const content = message.content;
        regex.lastIndex = 0;
        let matchIndex = 0; // 添加匹配索引

        while ((match = regex.exec(content)) !== null) {
          results.push({
            messageId: message.id,
            messageIndex: messageIndex, // 使用forEach的索引，这是消息在聊天记录中的实际位置
            matchIndex: matchIndex, // 在同一条消息中的匹配顺序
            timestamp: message.timestamp,
            sender: message.sender,
            senderName: message.name,
            match: match,
            groups: match.slice(1),
            dataType: dataType,
            fullContent: content,
          });

          matchIndex++; // 递增匹配索引
          if (!regex.global) break;
        }
      });

      // console.log(`从${messages.length}条消息中提取到${results.length}个${dataType}数据`); // Reduced verbosity
      return results;
    },

    // 提取QQ联系人
    extractQQContacts: async function () {
      const messages = await this.parseChatMessages();
      const contactRegex = /\[qq号\|(.*?)\|(.*?)\|(.*?)\]/gs;
      const contacts = this.extractDataWithRegex(messages, contactRegex, 'qq联系人');

      const contactMap = new Map();

      contacts.forEach(item => {
        const [name, number, favorability] = item.groups;
        const key = number;

        if (!contactMap.has(key) || item.messageIndex > contactMap.get(key).messageIndex) {
          contactMap.set(key, {
            name: name,
            number: number,
            favorability: favorability,
            messageIndex: item.messageIndex,
            timestamp: item.timestamp,
          });
        }
      });

      return Array.from(contactMap.values());
    },

    // 提取QQ消息
    extractQQMessages: async function () {
      const messages = await this.parseChatMessages();
      const userMessageRegex = /\[我方消息\|(.*?)\|(.*?)\|(.*?)\]/gs;
      const otherMessageRegex = /\[对方消息\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/gs;

      const userMessages = this.extractDataWithRegex(messages, userMessageRegex, '我方消息');
      const otherMessages = this.extractDataWithRegex(messages, otherMessageRegex, '对方消息');

      const allMessages = [...userMessages, ...otherMessages].sort((a, b) => a.messageIndex - b.messageIndex);

      return allMessages.map(item => {
        if (item.dataType === '我方消息') {
          const [qqNumber, content, time] = item.groups;
          return {
            type: 'sent',
            qqNumber: qqNumber,
            content: content,
            time: time,
            messageIndex: item.messageIndex,
            timestamp: item.timestamp,
          };
        } else {
          const [name, qqNumber, content, time] = item.groups;
          return {
            type: 'received',
            name: name,
            qqNumber: qqNumber,
            content: content,
            time: time,
            messageIndex: item.messageIndex,
            timestamp: item.timestamp,
          };
        }
      });
    },

    // 提取QQ群组
    extractQQGroups: async function () {
      const messages = await this.parseChatMessages();

      const groupRegex = /\[创建群聊\|(.*?)\|(.*?)\|(.*?)\]/gs;
      const groups = this.extractDataWithRegex(messages, groupRegex, '群聊');

      // 使用单一正则表达式提取所有群聊消息，保持原始顺序
      const allGroupMessageRegex = /\[(群聊消息|我方群聊消息)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/gs;
      const allGroupMessages = this.extractDataWithRegex(messages, allGroupMessageRegex, '群聊消息');

      const groupMap = new Map();

      // 首先处理明确的群聊创建记录
      groups.forEach(item => {
        const [groupId, groupName, members] = item.groups;
        const key = groupId;

        if (!groupMap.has(key) || item.messageIndex > groupMap.get(key).messageIndex) {
          groupMap.set(key, {
            id: groupId,
            name: groupName,
            members: members,
            messageIndex: item.messageIndex,
            timestamp: item.timestamp,
            messages: [],
            isInferred: false, // 标记为明确创建的群组
          });
        }
      });

      // 获取聊天数据用于推断群名
      const chatData = await this.getChatData();
      const allChatMessages = chatData ? chatData.messages : [];

      allGroupMessages.forEach(item => {
        // 新的正则表达式捕获组结构: [消息类型, 群号, 发送者, 内容, 时间]
        const [messageType, groupId, sender, content, time] = item.groups;
        const isMyMessage = messageType === '我方群聊消息';

        // 确保所有变量都已正确赋值
        if (!groupId) {
          console.warn('群聊消息解析失败，跳过:', item);
          return;
        }

        // 验证群号格式是否合理（应该是数字）
        if (!/^\d+$/.test(groupId)) {
          console.warn(`群号格式不正确，跳过: ${groupId}`);
          return;
        }

        // 如果群组不存在，则自动创建一个推断的群组
        if (!groupMap.has(groupId)) {
          // 改进的群名推断逻辑，防止错误拉取历史数据
          let inferredGroupName = `群聊${groupId}`;
          let shouldCreateGroup = true;

          // 只在当前消息所在的聊天记录中查找群名信息，避免跨消息污染
          if (allChatMessages && allChatMessages.length > 0) {
            // 查找包含当前群聊消息的具体消息
            const currentMessage = allChatMessages[item.messageIndex];
            if (currentMessage) {
              const msgContent = currentMessage.mes || '';

              // 检查消息内容是否包含可疑的长串数据（可能是错误拼接的内容）
              if (msgContent.length > 5000) {
                console.warn(`消息内容过长，可能包含错误数据，跳过群聊推断: ${groupId}`);
                shouldCreateGroup = false;
              } else {
                // 更精确的群名提取：只查找明确的群聊创建格式
                const explicitGroupMatch = msgContent.match(
                  new RegExp(`\\[创建群聊\\|${groupId}\\|([^\\|]+)\\|[^\\]]+\\]`),
                );
                if (explicitGroupMatch) {
                  const extractedName = explicitGroupMatch[1];
                  // 验证提取的群名是否合理
                  if (extractedName.length <= 50 && !extractedName.includes('[') && !extractedName.includes('|')) {
                    inferredGroupName = extractedName;
                    console.log(`从明确创建记录推断群名: ${groupId} -> ${inferredGroupName}`);
                  } else {
                    console.warn(`提取的群名不合理，使用默认: ${extractedName} -> ${inferredGroupName}`);
                  }
                } else {
                  // 如果没有明确的创建记录，查找是否有群聊标题信息
                  const titleMatch = msgContent.match(/和(.{1,30}?)群聊/);
                  if (titleMatch && titleMatch[1].length < 30 && !titleMatch[1].includes('[')) {
                    // 限制群名长度，防止提取过长内容
                    inferredGroupName = titleMatch[1];
                    console.log(`从标题推断群名: ${groupId} -> ${inferredGroupName}`);
                  } else {
                    // 最后尝试：查找简单的群名模式，但要严格限制长度
                    const simpleMatch = msgContent.match(/群聊[：:]?\s*([^\s\[\]]{1,20})/);
                    if (simpleMatch && simpleMatch[1].length <= 20 && !simpleMatch[1].includes('|')) {
                      inferredGroupName = simpleMatch[1];
                      console.log(`从简单模式推断群名: ${groupId} -> ${inferredGroupName}`);
                    } else {
                      // 如果都没找到，使用默认名称
                      console.log(`无法推断群名，使用默认: ${groupId} -> ${inferredGroupName}`);
                    }
                  }
                }
              }
            }
          }

          // 验证推断的群名是否合理（长度检查，防止提取到错误的长内容）
          if (inferredGroupName.length > 50 || inferredGroupName.includes('|') || inferredGroupName.includes('[')) {
            console.warn(`推断的群名不合理，使用默认名称: ${groupId}`);
            inferredGroupName = `群聊${groupId}`;
          }

          // 只有在应该创建群组时才创建
          if (shouldCreateGroup) {
            // 如果没有找到群名，使用默认的推断名称
            const groupName = inferredGroupName || `群聊 ${groupId}`;
            groupMap.set(groupId, {
              id: groupId,
              name: groupName,
              members: '未知', // 推断的群组成员未知
              messageIndex: item.messageIndex, // 使用消息的索引作为参考
              timestamp: item.timestamp,
              messages: [],
              isInferred: true, // 标记为推断的群组
            });
            console.log(`自动推断群组: ${groupId} -> ${groupName}`);
          } else {
            console.warn(`跳过创建可疑群组: ${groupId}`);
            return; // 跳过这条消息的处理
          }
        }

        // 添加消息到群组
        if (groupMap.has(groupId)) {
          // 尝试从同一条聊天记录中提取发送者的QQ号
          let senderQQNumber = null;
          if (!isMyMessage && allChatMessages && allChatMessages[item.messageIndex]) {
            const currentChatMessage = allChatMessages[item.messageIndex];
            const chatMessageText = currentChatMessage.mes || '';

            // 静默查找QQ号，减少日志输出
            // 方法1: 查找该发送者对应的头像增强数据
            const senderAvatarMatch = chatMessageText.match(
              new RegExp(`\\[头像增强\\|(\\d+)\\|[^]]*?"contactName":"${sender}"`),
            );
            if (senderAvatarMatch) {
              senderQQNumber = senderAvatarMatch[1];
            } else {
              // 方法2: 使用预定义的映射表（从QQ应用获取）
              if (window.QQApp && window.QQApp.senderNameToQqNumberMap) {
                const mappedQQ = window.QQApp.senderNameToQqNumberMap[sender];
                if (mappedQQ) {
                  senderQQNumber = mappedQQ;
                }
              }
            }
          }

          const messageData = {
            sender: sender,
            content: content,
            time: time,
            messageIndex: item.messageIndex,
            matchIndex: item.matchIndex, // 添加匹配索引
            timestamp: item.timestamp,
            isMyMessage: isMyMessage,
            qqNumber: senderQQNumber, // 添加QQ号信息
          };

          console.log(
            `添加群聊消息: [${messageData.isMyMessage ? '我方' : messageData.sender}${
              messageData.qqNumber ? ` (${messageData.qqNumber})` : ''
            }] ${messageData.content.substring(0, 20)}... (messageIndex: ${messageData.messageIndex}, matchIndex: ${
              messageData.matchIndex
            }, 消息类型: ${messageType})`,
          );

          groupMap.get(groupId).messages.push(messageData);
        }
      });

      // 对每个群组的消息按发言顺序排序（先按messageIndex，再按matchIndex）
      groupMap.forEach(group => {
        console.log(
          `排序前群组 ${group.id} 的消息:`,
          group.messages.map(
            m =>
              `[${m.isMyMessage ? '我方' : m.sender}] ${m.content.substring(0, 15)}... (idx: ${
                m.messageIndex
              }, match: ${m.matchIndex})`,
          ),
        );
        group.messages.sort((a, b) => {
          if (a.messageIndex !== b.messageIndex) {
            return a.messageIndex - b.messageIndex;
          }
          return a.matchIndex - b.matchIndex;
        });
        console.log(
          `排序后群组 ${group.id} 的消息:`,
          group.messages.map(
            m =>
              `[${m.isMyMessage ? '我方' : m.sender}] ${m.content.substring(0, 15)}... (idx: ${
                m.messageIndex
              }, match: ${m.matchIndex})`,
          ),
        );
      });

      const result = Array.from(groupMap.values());
      console.log(`提取到${result.length}个群组，其中${result.filter(g => g.isInferred).length}个是推断的群组`);

      return result;
    },

    // 提取商品信息
    extractProducts: async function () {
      const messages = await this.parseChatMessages();
      const productRegex = /\[商品\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/gs;
      const products = this.extractDataWithRegex(messages, productRegex, '商品');

      return products.map(item => {
        const [name, type, describe, price] = item.groups;
        return {
          name: name,
          type: type,
          describe: describe,
          price: price,
          messageIndex: item.messageIndex,
          timestamp: item.timestamp,
        };
      });
    },

    // 提取任务信息
    extractTasks: async function () {
      const messages = await this.parseChatMessages();

      const availableTaskRegex = /\[查看任务\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/gs;
      const acceptedTaskRegex = /\[接受任务\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/gs;
      const completedTaskRegex = /\[完成任务\|(.*?)\|(.*?)\|(.*?)\]/gs;

      const availableTasks = this.extractDataWithRegex(messages, availableTaskRegex, '可接任务');
      const acceptedTasks = this.extractDataWithRegex(messages, acceptedTaskRegex, '已接任务');
      const completedTasks = this.extractDataWithRegex(messages, completedTaskRegex, '已完成任务');

      return {
        available: availableTasks.map(item => {
          const [id, name, description, people, reward] = item.groups;
          return {
            id: id,
            name: name,
            description: description,
            people: people,
            reward: reward,
            messageIndex: item.messageIndex,
            timestamp: item.timestamp,
          };
        }),
        accepted: acceptedTasks.map(item => {
          const [id, name, description, people, reward] = item.groups;
          return {
            id: id,
            name: name,
            description: description,
            people: people,
            reward: reward,
            messageIndex: item.messageIndex,
            timestamp: item.timestamp,
          };
        }),
        completed: completedTasks.map(item => {
          const [id, name, reward] = item.groups;
          return {
            id: id,
            name: name,
            reward: reward,
            messageIndex: item.messageIndex,
            timestamp: item.timestamp,
          };
        }),
      };
    },

    // 提取背包物品
    extractBackpackItems: async function () {
      const messages = await this.parseChatMessages();
      const itemRegex = /\[背包物品\|物品名称:(.*?)\|物品类型:(.*?)\|物品数量:(.*?)\|物品描述:(.*?)\]/gs;
      const items = this.extractDataWithRegex(messages, itemRegex, '背包物品');

      return items.map(item => {
        const [name, type, count, description] = item.groups;
        return {
          name: name,
          type: type,
          count: count,
          description: description,
          messageIndex: item.messageIndex,
          timestamp: item.timestamp,
        };
      });
    },

    // 提取物品使用记录
    extractItemUsageData: async function () {
      const messages = await this.parseChatMessages();

      // 物品使用格式: [物品使用|物品名称:xxx|使用数量:x]
      const itemUsageRegex = /\[物品使用\|物品名称:(.*?)\|使用数量:(\d+)\]/gs;
      const usageRecords = this.extractDataWithRegex(messages, itemUsageRegex, '物品使用');

      // 处理使用记录数据
      const usageData = usageRecords.map(record => {
        const [itemName, quantity] = record.groups;
        return {
          itemName: itemName.trim(),
          quantity: parseInt(quantity) || 1,
          messageIndex: record.messageIndex,
          timestamp: record.timestamp,
          sender: record.sender,
          senderName: record.senderName,
        };
      });

      // 按物品名称汇总使用数量
      const usageSummary = {};
      usageData.forEach(usage => {
        if (!usageSummary[usage.itemName]) {
          usageSummary[usage.itemName] = {
            itemName: usage.itemName,
            totalUsed: 0,
            usageHistory: [],
          };
        }
        usageSummary[usage.itemName].totalUsed += usage.quantity;
        usageSummary[usage.itemName].usageHistory.push(usage);
      });

      console.log(
        `📊 物品使用数据提取完成: 找到${usageData.length}条使用记录，涉及${Object.keys(usageSummary).length}种物品`,
      );

      return {
        all: usageData,
        summary: usageSummary,
      };
    },

    // 提取淘宝消费记录
    extractTaobaoExpenses: async function () {
      const messages = await this.parseChatMessages();
      const expenseRegex = /\[总计\|(.*?)\]/gs;
      const expenses = this.extractDataWithRegex(messages, expenseRegex, '淘宝消费');

      return expenses.map(item => {
        const [amount] = item.groups;
        return {
          amount: parseInt(amount) || 0,
          messageIndex: item.messageIndex,
          timestamp: item.timestamp,
        };
      });
    },

    // 提取点数记录
    extractPointsData: async function () {
      const messages = await this.parseChatMessages();

      // 获得点数格式: [获得点数|30]
      const earnedPointsRegex = /\[获得点数\|(\d+)\]/gs;
      // 消耗点数格式: [消耗点数|30]
      const spentPointsRegex = /\[消耗点数\|(\d+)\]/gs;

      const earnedPoints = this.extractDataWithRegex(messages, earnedPointsRegex, '获得点数');
      const spentPoints = this.extractDataWithRegex(messages, spentPointsRegex, '消耗点数');

      // 处理获得点数数据
      const earnedData = earnedPoints.map(item => {
        const [amount] = item.groups;
        return {
          type: 'earned',
          amount: parseInt(amount) || 0,
          messageIndex: item.messageIndex,
          timestamp: item.timestamp,
          sender: item.sender,
          senderName: item.senderName,
        };
      });

      // 处理消耗点数数据
      const spentData = spentPoints.map(item => {
        const [amount] = item.groups;
        return {
          type: 'spent',
          amount: parseInt(amount) || 0,
          messageIndex: item.messageIndex,
          timestamp: item.timestamp,
          sender: item.sender,
          senderName: item.senderName,
        };
      });

      // 合并并按消息索引排序
      const allPointsData = [...earnedData, ...spentData].sort((a, b) => a.messageIndex - b.messageIndex);

      // 计算总点数
      let totalEarned = 0;
      let totalSpent = 0;

      earnedData.forEach(item => (totalEarned += item.amount));
      spentData.forEach(item => (totalSpent += item.amount));

      const netPoints = totalEarned - totalSpent;

      console.log(`从SillyTavern上下文提取点数: 获得${totalEarned} - 消耗${totalSpent} = 剩余${netPoints}`);

      return {
        earned: earnedData,
        spent: spentData,
        all: allPointsData,
        summary: {
          totalEarned: totalEarned,
          totalSpent: totalSpent,
          netPoints: netPoints,
        },
      };
    },

    // ===================== 实时更新监听系统 =====================

    // 实时更新管理器
    realtimeUpdater: {
      // 状态管理
      isInitialized: false,
      isMonitoring: false,
      isPaused: false,
      lastMessageCount: 0,
      lastChatId: null,

      // 回调函数存储
      updateCallbacks: new Set(),

      // 防抖定时器
      debounceTimer: null,
      debounceDelay: 300, // 300ms防抖延迟

      // 检查间隔定时器
      checkInterval: null,
      checkIntervalDelay: 1000, // 1秒检查一次

      // 监听事件类型
      eventListeners: new Map(),

      // 初始化实时更新监听
      initialize: function () {
        if (this.isInitialized && this.isMonitoring) {
          console.log('📱 实时更新监听器已经初始化并运行中');
          return;
        }

        console.log('🚀 初始化手机插件实时更新监听器...');

        try {
          // 重置状态
          this.isInitialized = false;
          this.isMonitoring = false;
          this.isPaused = false;

          // 获取初始状态
          this.updateInitialState();

          // 启动多种监听策略
          this.startDOMObserver();
          this.startEventListeners();
          this.startIntervalCheck();

          this.isInitialized = true;
          this.isMonitoring = true;

          console.log('✅ 实时更新监听器初始化完成');
          console.log(
            `📊 当前状态: 已初始化=${this.isInitialized}, 正在监听=${this.isMonitoring}, 回调数量=${this.updateCallbacks.size}`,
          );

          // 延迟验证监听器状态
          setTimeout(() => {
            if (!this.isMonitoring) {
              console.log('🔧 检测到监听器状态异常，重新启动...');
              this.isMonitoring = true;
            }
          }, 1000);

          // 触发初始化完成事件
          this.triggerUpdate('initialization', { source: 'init' });
        } catch (error) {
          console.error('❌ 初始化实时更新监听器失败:', error);
          this.isInitialized = false;
          this.isMonitoring = false;
        }
      },

      // 更新初始状态
      updateInitialState: async function () {
        try {
          const chatData = await HQDataExtractor.getChatData();
          if (chatData) {
            this.lastMessageCount = chatData.messages ? chatData.messages.length : 0;
            this.lastChatId = chatData.chatId;
            console.log(`📊 初始状态: ${this.lastMessageCount} 条消息, 聊天ID: ${this.lastChatId}`);
          }
        } catch (error) {
          console.warn('⚠️ 获取初始状态失败:', error);
        }
      },

      // 启动DOM观察器 - 监听聊天区域变化
      startDOMObserver: function () {
        try {
          const chatContainer =
            document.querySelector('#chat') ||
            document.querySelector('.chat') ||
            document.querySelector('#sheld') ||
            document.body;

          if (!chatContainer) {
            console.warn('⚠️ 未找到聊天容器，使用document.body');
          }

          const observer = new MutationObserver(mutations => {
            let hasRelevantChanges = false;

            mutations.forEach(mutation => {
              // 检查是否有新增的消息节点
              if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    // 检查是否是消息相关的节点
                    if (
                      node.classList &&
                      (node.classList.contains('mes') ||
                        node.classList.contains('message') ||
                        node.querySelector('.mes') ||
                        node.querySelector('.message'))
                    ) {
                      hasRelevantChanges = true;
                      break;
                    }
                  }
                }
              }

              // 检查文本内容变化（AI回复更新）
              if (
                mutation.type === 'characterData' ||
                (mutation.type === 'childList' && mutation.target.closest('.mes'))
              ) {
                hasRelevantChanges = true;
              }

              // 特别检查生成状态变化
              if (mutation.type === 'attributes') {
                const target = mutation.target;
                if (target.id === 'send_but' || target.classList.contains('mes_edit_buttons')) {
                  hasRelevantChanges = true;
                }
              }
            });

            if (hasRelevantChanges) {
              console.log('🔍 DOM观察器检测到聊天变化');
              this.scheduleUpdate('dom_change');
            }
          });

          observer.observe(chatContainer, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'disabled'],
          });

          this.eventListeners.set('domObserver', observer);
          console.log('✅ DOM观察器已启动');
        } catch (error) {
          console.error('❌ 启动DOM观察器失败:', error);
        }
      },

      // 启动事件监听器 - 监听SillyTavern事件
      startEventListeners: function () {
        try {
          const events = [
            'message_sent',
            'message_received',
            'generation_ended',
            'generation_stopped',
            'generation_started',
            'chat_changed',
            'character_message_rendered',
            'message_edited',
            'message_deleted',
            'message_rendered',
            'character_first_message',
          ];

          events.forEach(eventName => {
            const handler = event => {
              console.log(`🎯 捕获事件: ${eventName}`, event);
              this.scheduleUpdate(`event_${eventName}`);
            };

            // 尝试多个可能的事件目标
            const targets = [
              document,
              window,
              window.parent,
              document.getElementById('send_form'),
              document.getElementById('chat'),
            ].filter(Boolean);

            targets.forEach(target => {
              try {
                target.addEventListener(eventName, handler);
                console.log(`✅ 已添加事件监听: ${eventName} 到`, target);
              } catch (e) {
                // 静默失败，某些目标可能不支持事件监听
              }
            });

            this.eventListeners.set(`event_${eventName}`, handler);
          });

          // 特别监听自定义事件
          const customHandler = event => {
            console.log('🎯 捕获自定义更新事件', event);
            this.scheduleUpdate('custom_event');
          };

          document.addEventListener('chat_update_required', customHandler);
          document.addEventListener('mobile_plugin_refresh', customHandler);
          this.eventListeners.set('customEvents', customHandler);

          // 监听SillyTavern特有的生成完成事件
          const generationHandler = event => {
            console.log('🎯 捕获生成事件', event.type, event);
            this.scheduleUpdate(`generation_${event.type}`);
          };

          // 监听多种可能的生成完成事件
          const generationEvents = [
            'generation_ended',
            'generation_stopped',
            'message_rendered',
            'character_message_rendered',
          ];

          generationEvents.forEach(eventType => {
            document.addEventListener(eventType, generationHandler);
            window.addEventListener(eventType, generationHandler);

            // 也尝试监听eventSource
            if (window.eventSource) {
              window.eventSource.addEventListener(eventType, generationHandler);
            }
          });

          this.eventListeners.set('generationEvents', generationHandler);
        } catch (error) {
          console.error('❌ 启动事件监听器失败:', error);
        }
      },

      // 启动定时检查 - 兜底机制
      startIntervalCheck: function () {
        if (this.checkInterval) {
          clearInterval(this.checkInterval);
        }

        this.checkInterval = setInterval(async () => {
          try {
            // 智能监听器管理：检查手机插件可见性
            const isVisible = this.isMobilePluginVisible();

            if (!isVisible) {
              // 如果手机插件不可见，暂停监听器（但不完全停止）
              if (this.isMonitoring && !this.isPaused) {
                console.log('📱 手机插件不可见，暂停监听器以节省资源');
                this.pauseMonitoring();
              }
              return;
            } else {
              // 如果手机插件可见且监听器被暂停，恢复监听
              if (this.isPaused) {
                console.log('📱 手机插件重新可见，恢复监听器');
                this.resumeMonitoring();
              }
            }

            const chatData = await HQDataExtractor.getChatData();
            if (!chatData) return;

            const currentMessageCount = chatData.messages ? chatData.messages.length : 0;
            const currentChatId = chatData.chatId;

            // 检查聊天是否切换
            if (currentChatId !== this.lastChatId) {
              console.log(`🔄 检测到聊天切换: ${this.lastChatId} -> ${currentChatId}`);
              this.lastChatId = currentChatId;
              this.lastMessageCount = currentMessageCount;
              this.scheduleUpdate('chat_switch');
              return;
            }

            // 检查消息数量变化
            if (currentMessageCount !== this.lastMessageCount) {
              console.log(`📊 检测到消息数量变化: ${this.lastMessageCount} -> ${currentMessageCount}`);
              this.lastMessageCount = currentMessageCount;
              this.scheduleUpdate('message_count_change');
            }
          } catch (error) {
            // 静默处理错误，避免控制台垃圾信息
          }
        }, this.checkIntervalDelay);

        console.log(`✅ 定时检查已启动 (${this.checkIntervalDelay}ms间隔)`);
      },

      // 检查手机插件是否可见
      isMobilePluginVisible: function () {
        try {
          // 检查页面是否可见
          const pageVisible = !document.hidden && document.visibilityState === 'visible';
          if (!pageVisible) {
            return false;
          }

          // 检查QQ应用是否存在
          if (!window.QQApp) {
            return false;
          }

          // 检查QQ应用容器是否可见
          const containers = [
            '.qq-app-container',
            '#phone_interface',
            '.mobile-plugin',
            '.phone-container',
            '.qq-interface',
          ];

          let containerVisible = false;
          for (const selector of containers) {
            const element = document.querySelector(selector);
            if (element) {
              const style = window.getComputedStyle(element);
              const isVisible =
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                style.opacity !== '0' &&
                element.offsetWidth > 0 &&
                element.offsetHeight > 0;
              if (isVisible) {
                containerVisible = true;
                break;
              }
            }
          }

          // 如果没有找到容器，检查QQ应用是否在DOM中有任何可见元素
          if (!containerVisible) {
            const qqElements = document.querySelectorAll(
              '[class*="qq-"], [id*="qq-"], [class*="phone"], [id*="phone"]',
            );
            for (const element of qqElements) {
              const style = window.getComputedStyle(element);
              if (style.display !== 'none' && element.offsetWidth > 0 && element.offsetHeight > 0) {
                containerVisible = true;
                break;
              }
            }
          }

          return containerVisible;
        } catch (error) {
          console.warn('⚠️ 检查手机插件可见性失败:', error);
          // 如果检查失败，默认认为不可见（节能策略）
          return false;
        }
      },

      // 暂停监听器（保持初始化状态，但停止处理事件）
      pauseMonitoring: function () {
        if (!this.isPaused) {
          this.isPaused = true;
          console.log('⏸️ 监听器已暂停');
        }
      },

      // 恢复监听器
      resumeMonitoring: function () {
        if (this.isPaused) {
          this.isPaused = false;
          console.log('▶️ 监听器已恢复');
        }
      },

      // 调度更新 - 防抖处理
      scheduleUpdate: function (source) {
        if (!this.isMonitoring) {
          console.log(`⏭️ 监听器未运行，跳过调度更新 - 来源: ${source}`);
          return;
        }

        // 检查是否被暂停
        if (this.isPaused) {
          console.log(`⏸️ 监听器已暂停，跳过更新 - 来源: ${source}`);
          return;
        }

        // 性能优化：只在手机插件可见时处理更新
        if (!this.isMobilePluginVisible()) {
          console.log(`⏭️ 手机插件不可见，跳过更新 - 来源: ${source}`);
          return;
        }

        // 清除之前的防抖定时器
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }

        // 动态调整防抖延迟 - 群聊时使用更长延迟
        const isGroupChatContext = this.isInGroupChatContext();
        const dynamicDelay = isGroupChatContext ? this.debounceDelay * 2 : this.debounceDelay;

        // 设置新的防抖定时器
        this.debounceTimer = setTimeout(() => {
          this.triggerUpdate(source);
        }, dynamicDelay);
      },

      // 检测是否在群聊环境
      isInGroupChatContext: function () {
        try {
          // 方法1: 检查DOM结构
          const hasGroupElements =
            document.querySelector('.qq-group-wrapper') ||
            document.querySelector('[data-group-id]') ||
            document.querySelector('.custom-qq-qun');

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
              messageText.includes('群成员');
          }

          // 方法3: 检查当前QQ应用状态（如果可用）
          const isQQGroupActive =
            (window.QQApp && document.querySelector('.qq-group-wrapper.active')) ||
            document.querySelector('.custom-qq-qun.active');

          return hasGroupElements || hasGroupKeywords || isQQGroupActive;
        } catch (error) {
          console.warn('⚠️ 检测群聊环境失败:', error);
          return false;
        }
      },

      // 触发更新回调
      triggerUpdate: async function (source, additionalData = {}) {
        if (!this.isMonitoring) {
          console.log(`⏭️ 监听器未运行，跳过更新 - 来源: ${source}`);
          return;
        }

        console.log(`🔄 触发手机插件更新 - 来源: ${source}, 回调数量: ${this.updateCallbacks.size}`);

        try {
          // 获取最新数据
          const updateData = {
            source: source,
            timestamp: Date.now(),
            chatData: await HQDataExtractor.getChatData(),
            ...additionalData,
          };

          // 调用所有注册的回调函数
          let callbackCount = 0;
          this.updateCallbacks.forEach(callback => {
            try {
              if (typeof callback === 'function') {
                callback(updateData);
                callbackCount++;
              }
            } catch (error) {
              console.error('❌ 更新回调执行失败:', error);
            }
          });

          console.log(`✅ 已执行 ${callbackCount} 个回调函数`);

          // 触发全局事件，让其他组件知道有更新
          try {
            const event = new CustomEvent('mobile_plugin_data_updated', {
              detail: updateData,
            });
            document.dispatchEvent(event);

            // 同时触发父窗口事件（如果在iframe中）
            if (window.parent !== window) {
              window.parent.document.dispatchEvent(event);
            }
          } catch (error) {
            console.warn('⚠️ 触发全局事件失败:', error);
          }
        } catch (error) {
          console.error('❌ 触发更新失败:', error);
        }
      },

      // 注册更新回调
      onUpdate: function (callback) {
        if (typeof callback === 'function') {
          this.updateCallbacks.add(callback);
          console.log(`✅ 已注册更新回调，当前共 ${this.updateCallbacks.size} 个回调`);
          return true;
        }
        return false;
      },

      // 取消注册更新回调
      offUpdate: function (callback) {
        const removed = this.updateCallbacks.delete(callback);
        if (removed) {
          console.log(`✅ 已移除更新回调，当前共 ${this.updateCallbacks.size} 个回调`);
        }
        return removed;
      },

      // 停止监听
      stop: function () {
        console.log('🛑 停止实时更新监听器...');

        this.isMonitoring = false;
        this.isPaused = false;

        // 清除定时器
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
          this.debounceTimer = null;
        }

        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }

        // 清除事件监听器
        this.eventListeners.forEach((listener, key) => {
          try {
            if (key === 'domObserver' && listener.disconnect) {
              listener.disconnect();
            } else if (typeof listener === 'function') {
              document.removeEventListener(key.replace('event_', ''), listener);
              window.removeEventListener(key.replace('event_', ''), listener);

              // 清除生成事件监听器
              if (key === 'generationEvents') {
                const generationEvents = [
                  'generation_ended',
                  'generation_stopped',
                  'message_rendered',
                  'character_message_rendered',
                ];
                generationEvents.forEach(eventType => {
                  document.removeEventListener(eventType, listener);
                  window.removeEventListener(eventType, listener);
                });
              }
            }
          } catch (error) {
            console.warn(`⚠️ 清除事件监听器失败: ${key}`, error);
          }
        });

        this.eventListeners.clear();
        this.updateCallbacks.clear();

        console.log('✅ 实时更新监听器已停止');
      },

      // 重启监听器
      restart: function () {
        this.stop();
        setTimeout(() => {
          this.initialize();
        }, 100);
      },

      // 手动触发更新
      forceUpdate: function () {
        console.log('💪 手动触发更新');
        this.triggerUpdate('manual_force');
      },

      // 检查并修复监听器状态
      checkAndFixStatus: function () {
        console.log('🔍 检查实时更新器状态...');
        console.log(
          `当前状态: 已初始化=${this.isInitialized}, 正在监听=${this.isMonitoring}, 回调数量=${this.updateCallbacks.size}`,
        );

        if (this.isInitialized && !this.isMonitoring) {
          console.log('🔧 检测到监听器状态异常，修复中...');
          this.isMonitoring = true;

          // 重新启动监听器组件
          try {
            if (this.eventListeners.size === 0) {
              console.log('🔧 重新启动事件监听器...');
              this.startEventListeners();
            }

            if (!this.eventListeners.has('domObserver')) {
              console.log('🔧 重新启动DOM观察器...');
              this.startDOMObserver();
            }

            if (!this.checkInterval) {
              console.log('🔧 重新启动定时检查器...');
              this.startIntervalCheck();
            }

            console.log('✅ 监听器状态已修复');
          } catch (error) {
            console.error('❌ 修复监听器状态失败:', error);
          }
        }

        return {
          isInitialized: this.isInitialized,
          isMonitoring: this.isMonitoring,
          isPaused: this.isPaused,
          callbackCount: this.updateCallbacks.size,
          hasEventListeners: this.eventListeners.size > 0,
          hasInterval: !!this.checkInterval,
          isMobilePluginVisible: this.isMobilePluginVisible(),
        };
      },
    },

    // ===================== 便捷方法 =====================

    // 启动实时更新（便捷方法）
    startRealtimeUpdates: function (callback) {
      console.log('🚀 启动手机插件实时更新功能');

      // 如果提供了回调函数，注册它
      if (callback && typeof callback === 'function') {
        this.realtimeUpdater.onUpdate(callback);
      }

      // 初始化监听器
      this.realtimeUpdater.initialize();

      return this.realtimeUpdater;
    },

    // 停止实时更新（便捷方法）
    stopRealtimeUpdates: function () {
      console.log('🛑 停止手机插件实时更新功能');
      this.realtimeUpdater.stop();
    },

    // 检查是否正在监听
    isRealtimeActive: function () {
      return this.realtimeUpdater.isMonitoring;
    },
  };

  // 导出到全局
  window['HQDataExtractor'] = HQDataExtractor;

  // ===================== 使用示例和自动初始化 =====================

  // 自动初始化实时更新功能（可选）
  function autoInitialize() {
    // 等待页面加载完成后再初始化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(autoInitialize, 1000);
      });
      return;
    }

    // 检查是否已经有手机插件在运行
    const mobilePluginExists =
      window.QQApp ||
      window.PhoneInterface ||
      document.querySelector('.qq-app-container') ||
      document.querySelector('#phone_interface');

    if (mobilePluginExists) {
      console.log('🚀 检测到手机插件，自动启动实时更新功能...');

      // 启动实时更新，并设置通用回调
      HQDataExtractor.startRealtimeUpdates(updateData => {
        console.log('📱 手机插件数据更新:', updateData.source);

        // 通知所有可能的手机插件组件
        const componentsToNotify = ['QQApp', 'PhoneInterface', 'WeChatApp', 'ContactManager', 'QQDataManager'];

        componentsToNotify.forEach(componentName => {
          const component = window[componentName];
          if (component) {
            // 尝试调用组件的更新方法
            if (typeof component.handleDataUpdate === 'function') {
              component.handleDataUpdate(updateData);
            } else if (typeof component.refresh === 'function') {
              component.refresh(updateData);
            } else if (typeof component.updateData === 'function') {
              component.updateData(updateData);
            } else if (typeof component.reload === 'function') {
              component.reload();
            }
          }
        });

        // 更新好友管理器的头像显示
        if (window.QQDataManager && typeof window.QQDataManager.updateFriendManagerAvatars === 'function') {
          window.QQDataManager.updateFriendManagerAvatars();
        }
      });
    }
  }

  // 延迟自动初始化，确保其他组件先加载
  setTimeout(autoInitialize, 2000);

  // 也在页面加载完成时尝试初始化
  if (document.readyState === 'complete') {
    setTimeout(autoInitialize, 500);
  } else {
    window.addEventListener('load', () => {
      setTimeout(autoInitialize, 500);
    });
  }

  // ===================== 全局便捷方法 =====================

  // 添加全局便捷方法到window对象
  window.HQRealtimeUpdater = {
    start: callback => HQDataExtractor.startRealtimeUpdates(callback),
    stop: () => HQDataExtractor.stopRealtimeUpdates(),
    isActive: () => HQDataExtractor.isRealtimeActive(),
    forceUpdate: () => HQDataExtractor.realtimeUpdater.forceUpdate(),

    // 使用示例
    example: function () {
      console.log('💡 实时更新使用示例:');
      console.log('');
      console.log('// 方法1: 启动实时更新并注册回调');
      console.log('HQDataExtractor.startRealtimeUpdates((updateData) => {');
      console.log('  console.log("数据更新来源:", updateData.source);');
      console.log('  console.log("更新时间:", updateData.timestamp);');
      console.log('  console.log("聊天数据:", updateData.chatData);');
      console.log('  ');
      console.log('  // 在这里更新你的手机插件界面');
      console.log('  updateYourMobilePlugin(updateData);');
      console.log('});');
      console.log('');
      console.log('// 方法2: 手动注册回调');
      console.log('HQDataExtractor.realtimeUpdater.onUpdate((updateData) => {');
      console.log('  // 处理更新');
      console.log('});');
      console.log('');
      console.log('// 方法3: 监听全局事件');
      console.log('document.addEventListener("mobile_plugin_data_updated", (event) => {');
      console.log('  const updateData = event.detail;');
      console.log('  // 处理更新');
      console.log('});');
      console.log('');
      console.log('// 手动触发更新');
      console.log('HQDataExtractor.realtimeUpdater.forceUpdate();');
      console.log('');
      console.log('// 停止实时更新');
      console.log('HQDataExtractor.stopRealtimeUpdates();');
    },
  };

  console.log('✅ HQDataExtractor 实时更新功能已加载');
  console.log('💡 使用 HQRealtimeUpdater.example() 查看使用示例');
})(window);
