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

        // 如果群组不存在，则自动创建一个推断的群组
        if (!groupMap.has(groupId)) {
          // 尝试从聊天记录中推断群名
          let inferredGroupName = `群聊${groupId}`;

          // 查找是否有相关的群名信息（比如从聊天标题或其他地方）
          if (allChatMessages && allChatMessages.length > 0) {
            // 查找可能包含群名的消息
            for (let msg of allChatMessages) {
              const msgContent = msg.mes || '';
              // 查找可能的群名模式，比如 "和XXX的聊天"
              const groupNameMatch = msgContent.match(/和(.+?)的聊天/);
              if (groupNameMatch) {
                inferredGroupName = groupNameMatch[1];
                // console.log(`从聊天记录推断群名: ${groupId} -> ${inferredGroupName}`); // Reduced verbosity
                break;
              }
              // 也可以查找其他可能的群名模式
              const groupNameMatch2 = msgContent.match(/群聊.*?(\S+)/);
              if (groupNameMatch2) {
                inferredGroupName = groupNameMatch2[1];
                // console.log(`从聊天记录推断群名: ${groupId} -> ${inferredGroupName}`); // Reduced verbosity
                break;
              }
              // 查找包含群ID的消息，可能有群名信息
              if (msgContent.includes(groupId)) {
                const contextMatch = msgContent.match(/(.{0,20})群聊(.{0,20})/);
                if (contextMatch) {
                  const context = contextMatch[0];
                  const nameMatch = context.match(/(\S+)群聊/);
                  if (nameMatch) {
                    inferredGroupName = nameMatch[1];
                    // console.log(`从上下文推断群名: ${groupId} -> ${inferredGroupName}`); // Reduced verbosity
                    break;
                  }
                }
              }
            }
          }

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
          // console.log(`自动推断群组: ${groupId} -> ${groupName}`); // Reduced verbosity
        }

        // 添加消息到群组
        if (groupMap.has(groupId)) {
          const messageData = {
            sender: sender,
            content: content,
            time: time,
            messageIndex: item.messageIndex,
            matchIndex: item.matchIndex, // 添加匹配索引
            timestamp: item.timestamp,
            isMyMessage: isMyMessage,
          };

          console.log(
            `添加群聊消息: [${messageData.isMyMessage ? '我方' : messageData.sender}] ${messageData.content.substring(
              0,
              20,
            )}... (messageIndex: ${messageData.messageIndex}, matchIndex: ${
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
  };

  // 导出到全局
  window['HQDataExtractor'] = HQDataExtractor;
})(window);
