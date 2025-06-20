// 数据提取器
(function (window) {
  'use strict';

  const HQDataExtractor = {
    // 获取SillyTavern上下文
    getSillyTavernContext: function () {
      return window['SillyTavern'] || window['sillyTavern'];
    },

    // 获取聊天数据
    getChatData: async function () {
      try {
        const SillyTavernContext = this.getSillyTavernContext();
        const context = SillyTavernContext ? SillyTavernContext.getContext() : null;
        if (!context) {
          return null;
        }

        const chat = context.chat || [];

        return {
          messages: chat,
          chatId: context.chatId,
          characterId: context.characterId,
          groupId: context.groupId,
        };
      } catch (error) {
        return null;
      }
    },

    // 解析聊天消息
    parseChatMessages: async function () {
      try {
        const chatData = await this.getChatData();
        if (!chatData || !chatData.messages) {
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
            messageIndex: message.id, // 使用message.id而不是forEach的索引
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

    // 提取QQ消息（融合图片处理逻辑）
    extractQQMessages: async function () {
      const messages = await this.parseChatMessages();
      const allQQMessages = [];

      // 遍历每条聊天消息
      messages.forEach((message, messageIndex) => {
        if (!message.content) return;

        const content = message.content;
        const allMatches = [];

        // 使用一个通用正则表达式来匹配所有QQ消息，并记录它们在文本中的位置
        const userMessageRegex = /\[我方消息\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g;
        const otherMessageRegex = /\[对方消息\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g;

        // 🌟 新增：表情包格式匹配正则表达式
        const stickerRegex = /\[表情包\|(.*?)\|(.*?)\]/g;

        // 🌟 新增：对方表情包格式匹配正则表达式（支持5个或6个参数）
        const otherStickerRegex5 = /\[对方消息\|(.*?)\|(.*?)\|表情包\|(.*?)\|(.*?)\]/g;
        const otherStickerRegex6 = /\[对方消息\|(.*?)\|(.*?)\|表情包\|(.*?)\|(.*?)\|(.*?)\]/g;

        // 🌟 新增：红包消息格式匹配正则表达式
        const myRedpackPrivateRegex = /\[我方消息\|(.*?)\|(.*?)\|红包：(.*?)\|(.*?)\]/g;
        const myRedpackGroupRegex = /\[我方群聊消息\|(.*?)\|(.*?)\|我\|红包：(.*?)\|(.*?)\]/g;
        const otherRedpackPrivateRegex = /\[对方消息\|(.*?)\|(.*?)\|红包：(.*?)\|(.*?)\]/g;
        const otherRedpackGroupRegex = /\[群聊消息\|(.*?)\|(.*?)\|红包：(.*?)\|(.*?)\]/g;

        let match;

        // 🌟 修复：首先查找对方表情包消息（6参数格式优先）
        otherStickerRegex6.lastIndex = 0;
        while ((match = otherStickerRegex6.exec(content)) !== null) {
          const [senderName, senderQQ, filename, imagePath, time] = match.slice(1);

          allMatches.push({
            position: match.index, // 在文本中的位置
            type: 'received',
            dataType: '对方表情包消息',
            match: match,
            groups: [senderName, senderQQ, filename, time], // 重新构建groups，只保留需要的字段
            messageIndex: message.id,
            timestamp: message.timestamp,
            filename: filename,
            imageUrl: imagePath, // 使用完整路径作为imageUrl
            senderName: senderName,
            senderQQ: senderQQ,
            time: time,
            // 🌟 新增：明确标记为表情包消息
            isSticker: true,
            subType: 'received',
          });
        }

        // 🌟 修复：然后查找对方表情包消息（5参数格式）
        otherStickerRegex5.lastIndex = 0;
        while ((match = otherStickerRegex5.exec(content)) !== null) {
          const [senderName, senderQQ, filename, timeOrPath] = match.slice(1);

          // 🌟 修复：判断第4个参数是时间还是路径
          let imageUrl, actualTime;

          // 检查是否为时间格式（HH:MM 或 YYYY/MM/DD HH:MM:SS）
          const timePattern = /^\d{1,2}:\d{2}$|^\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}:\d{2}$/;

          if (timePattern.test(timeOrPath)) {
            // 第4个参数是时间，构建图片URL
            actualTime = timeOrPath;
            imageUrl = `/scripts/extensions/third-party/mobile-ui-test/images/${filename}`;
          } else if (timeOrPath && timeOrPath.includes('/') && !timePattern.test(timeOrPath)) {
            // 第4个参数是路径，提取时间（如果有的话）
            if (timeOrPath.includes('|')) {
              // 格式：路径|时间
              const parts = timeOrPath.split('|');
              imageUrl = parts[0];
              actualTime = parts[1] || this.formatCurrentTime();
            } else {
              // 纯路径
              imageUrl = timeOrPath;
              actualTime = this.formatCurrentTime();
            }
          } else {
            // 默认情况：构建标准路径
            actualTime = this.formatCurrentTime();
            imageUrl = `/scripts/extensions/third-party/mobile-ui-test/images/${filename}`;
          }

          allMatches.push({
            position: match.index, // 在文本中的位置
            type: 'received',
            dataType: '对方表情包消息',
            match: match,
            groups: [senderName, senderQQ, filename, actualTime], // 确保时间字段是纯时间
            messageIndex: message.id,
            timestamp: message.timestamp,
            filename: filename,
            imageUrl: imageUrl,
            senderName: senderName,
            senderQQ: senderQQ,
            time: actualTime,
            // 🌟 新增：明确标记为表情包消息
            isSticker: true,
            subType: 'received',
          });
        }

        // 🌟 新增：首先查找红包消息（优先级最高，确保正确的sent/received判定）
        // 我方私聊红包
        myRedpackPrivateRegex.lastIndex = 0;
        while ((match = myRedpackPrivateRegex.exec(content)) !== null) {
          const [friendName, qqNumber, redpackAmount, time] = match.slice(1);

          allMatches.push({
            position: match.index,
            type: 'sent',
            dataType: '我方红包消息',
            match: match,
            groups: match.slice(1),
            messageIndex: message.id,
            timestamp: message.timestamp,
            friendName: friendName,
            qqNumber: qqNumber,
            redpackAmount: redpackAmount,
            isRedpack: true,
          });
        }

        // 我方群聊红包
        myRedpackGroupRegex.lastIndex = 0;
        while ((match = myRedpackGroupRegex.exec(content)) !== null) {
          const [groupName, groupId, redpackAmount, time] = match.slice(1);

          allMatches.push({
            position: match.index,
            type: 'sent',
            dataType: '我方群聊红包消息',
            match: match,
            groups: match.slice(1),
            messageIndex: message.id,
            timestamp: message.timestamp,
            groupName: groupName,
            groupId: groupId,
            redpackAmount: redpackAmount,
            isRedpack: true,
          });
        }

        // 对方私聊红包
        otherRedpackPrivateRegex.lastIndex = 0;
        while ((match = otherRedpackPrivateRegex.exec(content)) !== null) {
          const [senderName, senderQQ, redpackAmount, time] = match.slice(1);

          allMatches.push({
            position: match.index,
            type: 'received',
            dataType: '对方红包消息',
            match: match,
            groups: match.slice(1),
            messageIndex: message.id,
            timestamp: message.timestamp,
            senderName: senderName,
            senderQQ: senderQQ,
            redpackAmount: redpackAmount,
            isRedpack: true,
          });
        }

        // 对方群聊红包
        otherRedpackGroupRegex.lastIndex = 0;
        while ((match = otherRedpackGroupRegex.exec(content)) !== null) {
          const [groupId, senderName, redpackAmount, time] = match.slice(1);

          allMatches.push({
            position: match.index,
            type: 'received',
            dataType: '对方群聊红包消息',
            match: match,
            groups: match.slice(1),
            messageIndex: message.id,
            timestamp: message.timestamp,
            groupId: groupId,
            senderName: senderName,
            redpackAmount: redpackAmount,
            isRedpack: true,
          });
        }

        // 查找所有我方消息（排除红包消息，因为已经在上面处理了）
        userMessageRegex.lastIndex = 0;
        while ((match = userMessageRegex.exec(content)) !== null) {
          const [friendName, qqNumber, messageContent, time] = match.slice(1);

          // 🌟 跳过红包消息，因为已经在上面专门处理了
          if (messageContent.startsWith('红包：')) {
            continue;
          }

          // 🌟 修复：检查是否为语音消息
          const isVoiceMessage = messageContent.startsWith('语音：');

          allMatches.push({
            position: match.index, // 在文本中的位置
            type: 'sent',
            dataType: isVoiceMessage ? '我方语音消息' : '我方消息',
            match: match,
            groups: match.slice(1),
            messageIndex: message.id,
            timestamp: message.timestamp,
            isVoice: isVoiceMessage,
            voiceContent: isVoiceMessage ? messageContent.substring(3) : null, // 移除"语音："前缀
            friendName: friendName, // 🌟 新增：好友名字
            qqNumber: qqNumber, // 🌟 新增：QQ号
          });
        }

        // 查找所有对方消息（排除表情包和红包，因为已经在上面单独处理了）
        otherMessageRegex.lastIndex = 0;
        while ((match = otherMessageRegex.exec(content)) !== null) {
          const [name, qqNumber, messageContent, time] = match.slice(1);

          // 🌟 跳过表情包消息，因为已经在上面专门处理了
          if (messageContent === '表情包') {
            continue;
          }

          // 🌟 跳过红包消息，因为已经在上面专门处理了
          if (messageContent.startsWith('红包：')) {
            continue;
          }

          // 🌟 修复：检查是否为语音消息
          const isVoiceMessage = messageContent.startsWith('语音：');

          // 普通消息或语音消息
          allMatches.push({
            position: match.index, // 在文本中的位置
            type: 'received',
            dataType: isVoiceMessage ? '对方语音消息' : '对方消息',
            match: match,
            groups: match.slice(1),
            messageIndex: message.id,
            timestamp: message.timestamp,
            isVoice: isVoiceMessage,
            voiceContent: isVoiceMessage ? messageContent.substring(3) : null, // 移除"语音："前缀
          });
        }

        // 🌟 修复：查找所有表情包
        stickerRegex.lastIndex = 0;
        while ((match = stickerRegex.exec(content)) !== null) {
          const [filename, imageUrl] = match.slice(1);

          allMatches.push({
            position: match.index, // 在文本中的位置
            type: 'sticker',
            dataType: '表情包消息',
            match: match,
            groups: match.slice(1),
            messageIndex: message.id,
            timestamp: message.timestamp,
            filename: filename,
            imageUrl: imageUrl,
          });
        }

        // 🌟 新增：检查图片数据（在处理完文本消息后）
        if (message.extra && message.extra.image) {
          const imagePath = message.extra.image;

          // 过滤掉头像和系统图片
          const isSystem = this.isSystemImage(imagePath);

          if (!isSystem) {
            // 提取图片目标信息
            const target = this.extractImageTarget(content);

            if (target) {
              // 将图片作为特殊消息添加到匹配列表中
              allMatches.push({
                position: content.length + 1, // 放在文本消息之后
                type: 'sent', // 图片默认为我方发送
                dataType: '图片消息',
                imagePath: imagePath,
                target: target,
                messageIndex: message.id,
                timestamp: message.timestamp,
                originalMessage: message,
              });
            }
          }
        }

        // 按照在文本中的位置排序（严格按照前后顺序）
        allMatches.sort((a, b) => a.position - b.position);

        // 添加到总结果中
        allMatches.forEach(item => {
          if (item.dataType === '我方消息' || item.dataType === '我方语音消息') {
            const [friendName, qqNumber, content, time] = item.groups;
            allQQMessages.push({
              type: 'sent',
              subType: item.isVoice ? 'voice' : 'text',
              friendName: friendName, // 🌟 新增：好友名字
              qqNumber: qqNumber,
              content: content,
              voiceContent: item.voiceContent,
              time: time,
              messageIndex: item.messageIndex,
              position: item.position,
              timestamp: item.timestamp,
              isVoice: item.isVoice || false,
            });
          } else if (item.dataType === '对方消息' || item.dataType === '对方语音消息') {
            const [name, qqNumber, content, time] = item.groups;
            allQQMessages.push({
              type: 'received',
              subType: item.isVoice ? 'voice' : 'text',
              name: name,
              qqNumber: qqNumber,
              content: content,
              voiceContent: item.voiceContent,
              time: time,
              messageIndex: item.messageIndex,
              position: item.position,
              timestamp: item.timestamp,
              isVoice: item.isVoice || false,
            });
          } else if (item.dataType === '图片消息') {
            // 🌟 新增：处理图片消息
            allQQMessages.push({
              type: 'image',
              subType: 'sent', // 图片默认为我方发送
              qqNumber: item.target.target,
              contactName: item.target.contactName,
              fullName: item.target.fullName,
              imagePath: item.imagePath,
              content: `[图片消息]`, // 显示用的文本
              time: this.formatCurrentTime(),
              messageIndex: item.messageIndex,
              position: item.position,
              timestamp: item.timestamp,
              originalMessage: item.originalMessage,
              target: item.target,
            });
          } else if (item.dataType === '表情包消息') {
            // 🌟 修复：处理表情包消息
            const [filename, imageUrl] = item.groups;

            // 从消息内容中提取目标信息（QQ号或群号）
            const target = this.extractImageTarget(content);

            // 🌟 优化：如果没有找到目标，从相邻的[我方消息]中提取
            let finalTarget = target;
            if (!target) {
              // 查找同一消息中的[我方消息]格式
              const messageTargetMatch = content.match(/\[我方消息\|([^|]*?)\|(\d{5,12})\|/);
              if (messageTargetMatch) {
                finalTarget = {
                  isGroup: false,
                  target: messageTargetMatch[2],
                  contactName: messageTargetMatch[1].trim(),
                  qqNumber: messageTargetMatch[2],
                  fullName: `${messageTargetMatch[1].trim()}（${messageTargetMatch[2]}）`,
                };
              } else {
                // 🌟 新增：从历史消息中查找最近的目标信息
                finalTarget = this.findRecentTarget(messages, message.id);
              }
            }

            if (!finalTarget) {
              return;
            }

            // 🌟 修复：提供两种内容格式
            const simpleText = '[表情包]'; // 用于last-message的简洁显示
            const detailedContent = `<img src="${imageUrl}" alt="${filename}" class="qq-sticker-image" style="max-width: 150px; max-height: 150px; border-radius: 8px; margin: 4px; cursor: pointer; background: transparent;" onclick="this.style.transform='scale(1.5)'; setTimeout(() => this.style.transform='scale(1)', 2000);" title="${filename}">`;

            allQQMessages.push({
              type: 'sticker',
              subType: 'sent', // 表情包默认为我方发送
              qqNumber: finalTarget.target,
              contactName: finalTarget.contactName,
              fullName: finalTarget.fullName,
              filename: filename,
              imageUrl: imageUrl,
              content: simpleText, // 🌟 用于last-message的简洁显示
              detailedContent: detailedContent, // 🌟 用于聊天记录的完整显示
              originalContent: `[表情包: ${filename}]`, // 原始文本内容
              time: this.formatCurrentTime(),
              messageIndex: item.messageIndex,
              position: item.position,
              timestamp: item.timestamp,
              target: finalTarget,
            });
          } else if (item.dataType === '对方表情包消息') {
            // 🌟 新增：处理对方发送的表情包消息
            const [senderName, senderQQ, filename, stickerTime] = item.groups;

            // 🌟 修改：提供两种内容格式
            const simpleText = '[图片消息]'; // 用于last-message的简洁显示
            const detailedContent = `<img src="${item.imageUrl}" alt="${filename}" class="qq-sticker-image" style="max-width: 150px; max-height: 150px; border-radius: 8px; margin: 4px; cursor: pointer; background: transparent;" onclick="this.style.transform='scale(1.5)'; setTimeout(() => this.style.transform='scale(1)', 2000);" title="${filename}">`;

            allQQMessages.push({
              type: 'sticker',
              subType: 'received', // 对方发送的表情包
              name: senderName,
              qqNumber: senderQQ,
              contactName: senderName,
              fullName: `${senderName}（${senderQQ}）`,
              filename: filename,
              imageUrl: item.imageUrl,
              content: simpleText, // 🌟 用于last-message的简洁显示
              detailedContent: detailedContent, // 🌟 用于聊天记录的完整显示
              originalContent: `[表情包: ${filename}]`, // 原始文本内容
              time: stickerTime,
              messageIndex: item.messageIndex,
              position: item.position,
              timestamp: item.timestamp,
            });
          } else if (item.dataType === '我方红包消息') {
            // 🌟 新增：处理我方私聊红包消息
            const [friendName, qqNumber, redpackAmount, time] = item.groups;

            allQQMessages.push({
              type: 'redpack',
              subType: 'sent', // 我方发送的红包
              friendName: friendName,
              qqNumber: qqNumber,
              contactName: friendName,
              fullName: `${friendName}（${qqNumber}）`,
              redpackAmount: redpackAmount,
              content: `💰 红包：${redpackAmount}`, // 简洁显示
              detailedContent: `<div class="qq-redpack-message sent"><div class="redpack-icon">🧧</div><div class="redpack-content"><div class="redpack-amount">¥${redpackAmount}</div><div class="redpack-text">我发出的红包</div></div></div>`,
              originalContent: `[红包: ${redpackAmount}]`,
              time: time,
              messageIndex: item.messageIndex,
              position: item.position,
              timestamp: item.timestamp,
              isRedpack: true,
            });
          } else if (item.dataType === '我方群聊红包消息') {
            // 🌟 新增：处理我方群聊红包消息
            const [groupName, groupId, redpackAmount, time] = item.groups;

            allQQMessages.push({
              type: 'redpack',
              subType: 'sent', // 我方发送的群聊红包
              groupName: groupName,
              groupId: groupId,
              redpackAmount: redpackAmount,
              content: `💰 群红包：${redpackAmount}`, // 简洁显示
              detailedContent: `<div class="qq-redpack-message sent group"><div class="redpack-icon">🧧</div><div class="redpack-content"><div class="redpack-amount">¥${redpackAmount}</div><div class="redpack-text">我发出的群红包</div><div class="redpack-group">${groupName}</div></div></div>`,
              originalContent: `[群红包: ${redpackAmount}]`,
              time: time,
              messageIndex: item.messageIndex,
              position: item.position,
              timestamp: item.timestamp,
              isRedpack: true,
            });
          } else if (item.dataType === '对方红包消息') {
            // 🌟 新增：处理对方私聊红包消息
            const [senderName, senderQQ, redpackAmount, time] = item.groups;

            allQQMessages.push({
              type: 'redpack',
              subType: 'received', // 对方发送的红包
              name: senderName,
              qqNumber: senderQQ,
              contactName: senderName,
              fullName: `${senderName}（${senderQQ}）`,
              redpackAmount: redpackAmount,
              content: `💰 红包：${redpackAmount}`, // 简洁显示
              detailedContent: `<div class="qq-redpack-message received"><div class="redpack-icon">🧧</div><div class="redpack-content"><div class="redpack-amount">¥${redpackAmount}</div><div class="redpack-text">${senderName}发来的红包</div></div></div>`,
              originalContent: `[红包: ${redpackAmount}]`,
              time: time,
              messageIndex: item.messageIndex,
              position: item.position,
              timestamp: item.timestamp,
              isRedpack: true,
            });
          } else if (item.dataType === '对方群聊红包消息') {
            // 🌟 新增：处理对方群聊红包消息
            const [groupId, senderName, redpackAmount, time] = item.groups;

            allQQMessages.push({
              type: 'redpack',
              subType: 'received', // 对方发送的群聊红包
              groupId: groupId,
              senderName: senderName,
              redpackAmount: redpackAmount,
              content: `💰 群红包：${redpackAmount}`, // 简洁显示
              detailedContent: `<div class="qq-redpack-message received group"><div class="redpack-icon">🧧</div><div class="redpack-content"><div class="redpack-amount">¥${redpackAmount}</div><div class="redpack-text">${senderName}发来的群红包</div><div class="redpack-group">群${groupId}</div></div></div>`,
              originalContent: `[群红包: ${redpackAmount}]`,
              time: time,
              messageIndex: item.messageIndex,
              position: item.position,
              timestamp: item.timestamp,
              isRedpack: true,
            });
          }
        });
      });

      // 按照消息索引和位置排序，确保顺序正确
      allQQMessages.sort((a, b) => {
        if (a.messageIndex !== b.messageIndex) {
          return a.messageIndex - b.messageIndex;
        }
        return (a.position || 0) - (b.position || 0);
      });

      return allQQMessages;
    },

    // 🌟 新增：检查是否为系统图片
    isSystemImage: function (imagePath) {
      if (!imagePath) {
        return true;
      }

      // 系统图片特征
      const systemPatterns = [
        'data:', // base64编码的图片
        'User Avatars', // 用户头像目录
        '/avatars/', // 头像路径
        'avatar', // 头像相关
        'profile', // 个人资料图片
        'emoji', // 表情符号
        'icon', // 图标
        'system', // 系统图片
        'default', // 默认图片
      ];

      // 🌟 更新：用户真实图片特征（扩展支持更多格式）
      const userImagePatterns = [
        '/user/images/', // 用户上传的图片目录
        '/uploads/', // 上传目录
        '/user/', // 用户目录
        '/images/', // 图片目录
        'file/', // 文件路径
        // 🌟 扩展：支持更多图片格式
        '.jpeg', // JPEG格式
        '.jpg', // JPG格式
        '.png', // PNG格式
        '.gif', // GIF格式
        '.webp', // WebP格式
        '.bmp', // BMP格式（新增）
        '.tiff', // TIFF格式（新增）
        '.tif', // TIF格式（新增）
        '.svg', // SVG格式（新增）
        '.ico', // ICO格式（新增，但需要区分非系统图标）
        // 🌟 新增：通过MIME类型识别
        'image/jpeg', // JPEG MIME类型
        'image/jpg', // JPG MIME类型
        'image/png', // PNG MIME类型
        'image/gif', // GIF MIME类型
        'image/webp', // WebP MIME类型
        'image/bmp', // BMP MIME类型
        'image/tiff', // TIFF MIME类型
        'image/svg', // SVG MIME类型
        // 🌟 新增：通过URL特征识别真实图片
        'attachment', // 附件标识
        'upload', // 上传标识
        'message', // 消息图片
        'photo', // 照片
        'picture', // 图片
        'img', // img标识（但要避免与系统img混淆）
      ];

      const imagePath_lower = imagePath.toLowerCase();

      // 🌟 新增：更精确的检查逻辑
      // 1. 如果包含用户图片特征，则进一步检查
      const matchedUserPatterns = userImagePatterns.filter(pattern => imagePath_lower.includes(pattern.toLowerCase()));

      const hasUserImageFeature = matchedUserPatterns.length > 0;

      if (hasUserImageFeature) {
        // 🌟 新增：排除系统图片的用户图片特征检查
        // 即使包含用户特征，但如果同时包含系统特征，仍需要进一步判断
        const matchedSystemPatterns = systemPatterns.filter(pattern => imagePath_lower.includes(pattern.toLowerCase()));

        const hasSystemFeature = matchedSystemPatterns.length > 0;

        if (hasSystemFeature) {
          // 同时包含用户和系统特征，需要更精确的判断
          // 优先级：如果是真实的上传路径或文件扩展名，则认为是用户图片
          const priorityUserPatterns = ['/uploads/', '/user/images/', 'attachment', 'message'];

          const matchedPriorityPatterns = priorityUserPatterns.filter(pattern =>
            imagePath_lower.includes(pattern.toLowerCase()),
          );

          const hasPriorityUserFeature = matchedPriorityPatterns.length > 0;

          if (hasPriorityUserFeature) {
            return false; // 不是系统图片
          }

          // 🌟 新增：检查文件扩展名是否为真实图片格式
          const imageExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif'];
          const hasImageExtension = imageExtensions.some(ext => imagePath_lower.endsWith(ext));

          if (hasImageExtension && !imagePath_lower.includes('icon') && !imagePath_lower.includes('avatar')) {
            return false; // 不是系统图片
          }

          return true; // 默认为系统图片
        } else {
          return false; // 不是系统图片
        }
      }

      // 2. 检查是否包含系统图片特征
      const matchedSystemPatterns = systemPatterns.filter(pattern => imagePath_lower.includes(pattern.toLowerCase()));

      const isSystemImage = matchedSystemPatterns.length > 0;

      if (isSystemImage) {
        return true;
      }

      // 3. 🌟 新增：对于无明确特征的图片，通过URL结构判断
      // 如果路径很短或只是文件名，可能是系统图片
      if (imagePath.length < 20 && !imagePath.includes('/')) {
        return true;
      }

      // 4. 默认情况：如果无法明确判断，且路径较长，倾向于认为是用户图片
      return false;
    },

    // 🌟 新增：从消息文本中提取图片目标信息
    extractImageTarget: function (messageText) {
      if (!messageText) {
        return null;
      }

      // 匹配模式（按优先级排序）
      const patterns = [
        // 1. 群聊模式：发送群聊到群xxx
        {
          regex: /发送群聊到群(\d+)/i,
          type: 'group',
          name: '群聊模式',
          extract: match => ({
            isGroup: true,
            target: match[1],
            groupId: match[1],
            groupName: `群${match[1]}`,
            fullName: `群${match[1]}`,
          }),
        },
        // 🌟 新增：向群名（群号）发送模式（群聊表情包专用）
        {
          regex: /向([^（]*?)（(\d+)）发送(?:群聊|消息)/i,
          type: 'group_or_contact',
          name: '群聊或联系人发送模式',
          extract: match => {
            const name = match[1].trim();
            const number = match[2];

            // 根据号码长度判断是群号还是QQ号
            // 群号通常是9位数字，QQ号通常是5-12位
            // 但更准确的方法是根据上下文或已知信息判断

            // 检查是否为已知的群组（通过长度和常见模式判断）
            if (number.length === 9 || name.includes('群') || name.includes('好多人') || name.includes('大家')) {
              return {
                isGroup: true,
                target: number,
                groupId: number,
                groupName: name,
                fullName: `${name}（${number}）`,
              };
            } else {
              return {
                isGroup: false,
                target: number,
                contactName: name,
                qqNumber: number,
                fullName: `${name}（${number}）`,
              };
            }
          },
        },
        // 🌟 新增：从[我方消息|联系人名|QQ号|...]中提取目标信息（优先级高）
        {
          regex: /\[我方消息\|([^|]*?)\|(\d{5,12})\|/i,
          type: 'contact',
          name: '我方消息格式提取模式',
          extract: match => ({
            isGroup: false,
            target: match[2],
            contactName: match[1].trim(),
            qqNumber: match[2],
            fullName: `${match[1].trim()}（${match[2]}）`,
          }),
        },
        // 2. 向xxx（QQ号）发送消息模式
        {
          regex: /向([^（]*?)（(\d{5,12})）发送(?:群聊|消息)/i,
          type: 'contact',
          name: '带QQ号的联系人模式',
          extract: match => ({
            isGroup: false,
            target: match[2],
            contactName: match[1].trim(),
            qqNumber: match[2],
            fullName: `${match[1].trim()}（${match[2]}）`,
          }),
        },
        // 3. 向xxx发送消息模式（不带QQ号）
        {
          regex: /向([^发]*?)发送(?:群聊|消息)/i,
          type: 'contact',
          name: '普通联系人模式',
          extract: match => {
            const target = match[1].trim();
            if (/^\d{5,12}$/.test(target)) {
              return {
                isGroup: false,
                target: target,
                contactName: `QQ用户${target}`,
                qqNumber: target,
                fullName: `QQ用户${target}`,
              };
            } else {
              return {
                isGroup: false,
                target: target,
                contactName: target,
                fullName: target,
              };
            }
          },
        },
        // 4. 中文括号内的QQ号
        {
          regex: /（(\d{5,12})）/,
          type: 'contact',
          name: 'QQ号括号模式',
          extract: match => ({
            isGroup: false,
            target: match[1],
            contactName: `QQ用户${match[1]}`,
            qqNumber: match[1],
            fullName: `QQ用户${match[1]}`,
          }),
        },
      ];

      // 尝试每个模式
      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];

        const match = messageText.match(pattern.regex);

        if (match) {
          const result = pattern.extract(match);
          return result;
        }
      }

      return null;
    },

    // 🌟 新增：格式化当前时间
    formatCurrentTime: function () {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    },

    // 🌟 新增：从历史消息中查找最近的目标信息
    findRecentTarget: function (allMessages, currentMessageId) {
      if (!allMessages || !Array.isArray(allMessages)) {
        return null;
      }

      // 从当前消息向前查找，找到最近的包含目标信息的消息
      for (let i = allMessages.length - 1; i >= 0; i--) {
        const message = allMessages[i];
        if (!message || !message.content || message.id >= currentMessageId) {
          continue; // 跳过当前消息及之后的消息
        }

        const content = message.content;

        // 尝试从历史消息中提取目标信息
        const target = this.extractImageTarget(content);
        if (target) {
          return target;
        }

        // 🌟 新增：特别查找[我方消息]格式
        const messageTargetMatch = content.match(/\[我方消息\|([^|]*?)\|(\d{5,12})\|/);
        if (messageTargetMatch) {
          const recentTarget = {
            isGroup: false,
            target: messageTargetMatch[2],
            contactName: messageTargetMatch[1].trim(),
            qqNumber: messageTargetMatch[2],
            fullName: `${messageTargetMatch[1].trim()}（${messageTargetMatch[2]}）`,
          };
          return recentTarget;
        }

        // 🌟 新增：查找群聊消息格式
        const groupTargetMatch = content.match(/\[我方群聊消息\|([^|]*?)\|(\d+)\|/);
        if (groupTargetMatch) {
          const recentTarget = {
            isGroup: true,
            target: groupTargetMatch[2],
            groupId: groupTargetMatch[2],
            groupName: groupTargetMatch[1].trim(),
            fullName: `${groupTargetMatch[1].trim()}（${groupTargetMatch[2]}）`,
          };
          return recentTarget;
        }
      }

      return null;
    },

    // 🌟 新增：验证群号格式是否合理
    isValidGroupId: function (groupId) {
      if (!groupId) {
        return false;
      }

      // 转换为字符串进行验证
      const groupIdStr = String(groupId).trim();

      // 检查是否为空
      if (groupIdStr === '' || groupIdStr === 'undefined' || groupIdStr === 'null') {
        return false;
      }

      // 检查是否只包含数字（QQ群号应该是纯数字）
      if (!/^\d+$/.test(groupIdStr)) {
        return false;
      }

      // 检查长度是否合理（QQ群号通常是4-10位数字）
      if (groupIdStr.length < 4 || groupIdStr.length > 10) {
        return false;
      }

      // 检查是否以0开头（QQ群号不应该以0开头）
      if (groupIdStr.startsWith('0')) {
        return false;
      }

      return true;
    },

    // 🌟 新增：带去重的群号验证和警告
    validateGroupIdWithWarning: function (groupId, context = '') {
      if (this.isValidGroupId(groupId)) {
        return true;
      }

      // 初始化警告记录集合
      if (!this._invalidGroupIdWarnings) {
        this._invalidGroupIdWarnings = new Set();
      }

      // 创建唯一的警告键
      const warningKey = `${groupId}_${context}`;

      // 只在第一次遇到时警告
      if (!this._invalidGroupIdWarnings.has(warningKey)) {
        this._invalidGroupIdWarnings.add(warningKey);
        console.warn(`⚠️ ${context}中的群号格式不合理，跳过: "${groupId}"`);
      }

      return false;
    },

    // 提取QQ群组
    extractQQGroups: async function () {
      try {
        const messages = await this.parseChatMessages();

        // 🌟 修复：确保messages是数组
        if (!messages || !Array.isArray(messages)) {
          return [];
        }

        const groupRegex = /\[创建群聊\|(.*?)\|(.*?)\|(.*?)\]/gs;
        const groups = this.extractDataWithRegex(messages, groupRegex, '群聊');

        const groupMap = new Map();

        // 🌟 修复：确保groups是数组
        if (groups && Array.isArray(groups)) {
          // 首先处理明确的群聊创建记录
          groups.forEach(item => {
            // 🌟 修复：确保item和item.groups存在
            if (!item || !item.groups || !Array.isArray(item.groups)) {
              return;
            }

            const [groupId, groupName, members] = item.groups;

            // 🌟 新增：验证群号格式
            if (!this.validateGroupIdWithWarning(groupId, '创建群聊记录')) {
              return;
            }

            const key = groupId;

            if (!groupMap.has(key) || item.messageIndex > groupMap.get(key).messageIndex) {
              groupMap.set(key, {
                id: groupId,
                name: groupName,
                members: members,
                messageIndex: item.messageIndex,
                timestamp: item.timestamp,
                messages: [], // 🌟 确保messages总是初始化为数组
                isInferred: false, // 标记为明确创建的群组
              });
            }
          });
        }

        // 获取聊天数据用于推断群名
        const chatData = await this.getChatData();
        const allChatMessages = chatData ? chatData.messages : [];

        // 遍历每条聊天消息，按文本位置提取群聊消息
        messages.forEach((message, messageIndex) => {
          if (!message || !message.content) return;

          const content = message.content;
          const allMatches = [];

          // 使用正则表达式匹配群聊消息，并记录它们在文本中的位置
          const groupMessageRegex = /\[群聊消息\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g;
          const myGroupMessageRegex = /\[我方群聊消息\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g;

          let match;

          // 查找所有群聊消息
          groupMessageRegex.lastIndex = 0;
          while ((match = groupMessageRegex.exec(content)) !== null) {
            const [groupId, sender, messageContent, time] = match.slice(1);

            // 🌟 新增：验证群号格式
            if (!this.validateGroupIdWithWarning(groupId, '群聊消息')) {
              continue;
            }

            // 🌟 修复：跳过表情包消息，这些应该由专门的表情包处理逻辑处理
            if (messageContent === '表情包') {
              // 🌟 新增：处理群聊对方表情包消息
              // 检查时间字段是否包含文件信息
              let actualTime = time;
              let filename = '';
              let imageUrl = '';

              // 如果时间字段包含文件信息，解析它
              if (time.includes('|')) {
                const timeParts = time.split('|');
                if (timeParts.length >= 3) {
                  // 格式：filename|imagePath|actualTime
                  filename = timeParts[0];
                  imageUrl = timeParts[1];
                  actualTime = timeParts[2];
                } else if (timeParts.length === 2) {
                  // 格式：filename|actualTime 或 imagePath|actualTime
                  if (timeParts[0].includes('/')) {
                    // 第一个是路径
                    imageUrl = timeParts[0];
                    filename = imageUrl.split('/').pop(); // 从路径中提取文件名
                    actualTime = timeParts[1];
                  } else {
                    // 第一个是文件名
                    filename = timeParts[0];
                    imageUrl = `/scripts/extensions/third-party/mobile-ui-test/images/${filename}`;
                    actualTime = timeParts[1];
                  }
                }
              } else {
                // 没有文件信息，使用默认值
                actualTime = time;
                filename = 'unknown.jpg';
                imageUrl = `/scripts/extensions/third-party/mobile-ui-test/images/${filename}`;
              }

              allMatches.push({
                position: match.index,
                dataType: '群聊对方表情包消息',
                match: match,
                groups: [groupId, sender, filename, actualTime],
                messageIndex: message.id,
                timestamp: message.timestamp,
                groupId: groupId,
                sender: sender,
                filename: filename,
                imageUrl: imageUrl,
                time: actualTime,
                isSticker: true,
              });
              continue;
            }

            // 🌟 新增：检查是否为语音消息
            const isVoiceMessage = messageContent.startsWith('语音：');

            allMatches.push({
              position: match.index, // 在文本中的位置
              dataType: isVoiceMessage ? '群聊语音消息' : '群聊消息',
              match: match,
              groups: match.slice(1),
              messageIndex: message.id,
              timestamp: message.timestamp,
              isVoice: isVoiceMessage,
              voiceContent: isVoiceMessage ? messageContent.substring(3) : null, // 移除"语音："前缀
            });
          }

          // 查找所有我方群聊消息
          myGroupMessageRegex.lastIndex = 0;
          while ((match = myGroupMessageRegex.exec(content)) !== null) {
            const [groupName, groupId, sender, messageContent, time] = match.slice(1);

            // 🌟 新增：验证群号格式
            if (!this.validateGroupIdWithWarning(groupId, '我方群聊消息')) {
              continue;
            }

            // 🌟 新增：检查是否为语音消息
            const isVoiceMessage = messageContent.startsWith('语音：');

            allMatches.push({
              position: match.index, // 在文本中的位置
              dataType: isVoiceMessage ? '我方群聊语音消息' : '我方群聊消息',
              match: match,
              groups: match.slice(1),
              messageIndex: message.id,
              timestamp: message.timestamp,
              isVoice: isVoiceMessage,
              voiceContent: isVoiceMessage ? messageContent.substring(3) : null, // 移除"语音："前缀
              groupName: groupName, // 🌟 新增：群名称
              groupId: groupId, // 🌟 新增：群号
            });
          }

          // 🌟 新增：查找群聊表情包消息
          const stickerRegex = /\[表情包\|(.*?)\|(.*?)\]/g;
          stickerRegex.lastIndex = 0;
          while ((match = stickerRegex.exec(content)) !== null) {
            const [filename, imageUrl] = match.slice(1);

            // 提取目标信息
            const target = this.extractImageTarget(content);

            // 检查是否为群聊表情包
            if (target && target.isGroup) {
              // 🌟 新增：验证群号格式
              if (!this.validateGroupIdWithWarning(target.target, '群聊表情包消息')) {
                return;
              }

              allMatches.push({
                position: match.index, // 在文本中的位置
                dataType: '群聊表情包消息',
                match: match,
                groups: match.slice(1),
                messageIndex: message.id,
                timestamp: message.timestamp,
                filename: filename,
                imageUrl: imageUrl,
                target: target,
                groupId: target.target,
              });
            }
          }

          // 🌟 新增：检查群聊图片消息
          if (message.extra && message.extra.image) {
            const imagePath = message.extra.image;

            // 过滤掉头像和系统图片
            const isSystem = this.isSystemImage(imagePath);

            if (!isSystem) {
              // 提取图片目标信息
              const target = this.extractImageTarget(content);

              // 检查是否为群聊图片
              if (target && target.isGroup) {
                // 🌟 新增：验证群号格式
                if (!this.validateGroupIdWithWarning(target.target, '群聊图片消息')) {
                  return;
                }

                // 将群聊图片作为特殊消息添加到匹配列表中
                allMatches.push({
                  position: content.length + 1, // 放在文本消息之后
                  dataType: '群聊图片消息',
                  imagePath: imagePath,
                  target: target,
                  groupId: target.target,
                  messageIndex: message.id,
                  timestamp: message.timestamp,
                  originalMessage: message,
                });
              }
            }
          }

          // 按照在文本中的位置排序（严格按照前后顺序）
          allMatches.sort((a, b) => a.position - b.position);

          // 处理每个群聊消息
          allMatches.forEach(item => {
            // 🌟 修复：确保item存在
            if (!item) {
              return;
            }

            let groupId, sender, content, time;

            if (item.dataType === '群聊消息' || item.dataType === '群聊语音消息') {
              // 🌟 修复：确保groups数组存在
              if (!item.groups || !Array.isArray(item.groups)) {
                return;
              }
              [groupId, sender, content, time] = item.groups;
            } else if (item.dataType === '我方群聊消息' || item.dataType === '我方群聊语音消息') {
              // 🌟 更新：新格式为[我方群聊消息|群名称|群号|我|消息内容|消息时间]
              if (!item.groups || !Array.isArray(item.groups)) {
                return;
              }
              const [groupName, groupIdFromMessage, senderFromMessage, contentFromMessage, timeFromMessage] =
                item.groups;

              // 使用新格式的数据
              groupId = groupIdFromMessage;
              sender = senderFromMessage;
              content = contentFromMessage;
              time = timeFromMessage;

              // 🌟 新增：如果群组已存在，更新群名称；如果不存在，创建时使用正确的群名称
              if (!groupMap.has(groupId)) {
                // 使用消息中的群名称，而不是推断
                groupMap.set(groupId, {
                  id: groupId,
                  name: groupName, // 使用消息中的真实群名称
                  members: '未知',
                  messageIndex: item.messageIndex,
                  timestamp: item.timestamp,
                  messages: [],
                  isInferred: false, // 不是推断的，是真实的群名称
                });
              } else {
                // 如果群组已存在，更新群名称（如果当前是推断的）
                const existingGroup = groupMap.get(groupId);
                if (existingGroup.isInferred) {
                  existingGroup.name = groupName;
                  existingGroup.isInferred = false;
                }
              }
            } else if (item.dataType === '群聊表情包消息') {
              // 🌟 新增：处理群聊表情包消息
              groupId = item.groupId;
              sender = '我'; // 群聊表情包默认是我方发送
              content = '[表情包]'; // 显示文本
              time = this.formatCurrentTime();
            } else if (item.dataType === '群聊对方表情包消息') {
              // 🌟 新增：处理群聊对方表情包消息
              groupId = item.groupId;
              sender = item.sender; // 对方发送的表情包
              content = '[表情包]'; // 显示文本
              time = item.time;
            } else if (item.dataType === '群聊图片消息') {
              // 🌟 新增：处理群聊图片消息
              groupId = item.groupId;
              sender = '我'; // 群聊图片默认是我方发送
              content = '[图片消息]'; // 显示文本
              time = this.formatCurrentTime();
            }

            // 确保所有变量都已正确赋值
            if (!groupId) {
              return;
            }

            // 🌟 新增：验证群号格式是否合理
            if (!this.validateGroupIdWithWarning(groupId, '推测群聊处理')) {
              return; // 跳过处理格式不正确的群号
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
                    break;
                  }
                  // 也可以查找其他可能的群名模式
                  const groupNameMatch2 = msgContent.match(/群聊.*?(\S+)/);
                  if (groupNameMatch2) {
                    inferredGroupName = groupNameMatch2[1];
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
                        break;
                      }
                    }
                  }
                }
              }

              groupMap.set(groupId, {
                id: groupId,
                name: inferredGroupName,
                members: '未知', // 推断的群组成员信息未知
                messageIndex: item.messageIndex,
                timestamp: item.timestamp,
                messages: [], // 🌟 确保messages总是初始化为数组
                isInferred: true, // 标记为推断的群组
              });
            }

            // 添加消息到群组
            if (groupMap.has(groupId)) {
              const group = groupMap.get(groupId);

              // 🌟 修复：确保群组的messages数组存在
              if (!group.messages || !Array.isArray(group.messages)) {
                group.messages = [];
              }

              const messageData = {
                sender: sender,
                content: content,
                time: time,
                messageIndex: item.messageIndex,
                position: item.position, // 使用文本位置而不是matchIndex
                timestamp: item.timestamp,
                isMyMessage:
                  item.dataType === '我方群聊消息' ||
                  item.dataType === '群聊图片消息' ||
                  item.dataType === '群聊表情包消息' ||
                  item.dataType === '我方群聊语音消息',
                // 🌟 修复：语音、图片和表情包相关属性
                type:
                  item.dataType === '群聊图片消息'
                    ? 'image'
                    : item.dataType === '群聊表情包消息' || item.dataType === '群聊对方表情包消息'
                    ? 'sticker'
                    : item.isVoice
                    ? 'voice'
                    : 'text',
                isVoice: item.isVoice || false,
                voiceContent: item.voiceContent || null,
                imagePath: item.imagePath || null,
                target: item.target || null,
                // 🌟 修复：表情包相关属性
                filename: item.filename || null,
                imageUrl: item.imageUrl || null,
                // 🌟 修复：生成详细显示内容（用于UI渲染）
                detailedContent:
                  item.dataType === '群聊表情包消息' || item.dataType === '群聊对方表情包消息'
                    ? `<img src="${item.imageUrl}" alt="${item.filename}" class="qq-sticker-image" style="max-width: 150px; max-height: 150px; border-radius: 8px; margin: 4px; cursor: pointer; background: transparent;" onclick="this.style.transform='scale(1.5)'; setTimeout(() => this.style.transform='scale(1)', 2000);" title="${item.filename}">`
                    : null,
              };

              group.messages.push(messageData);
            }
          });
        });

        // 对每个群组的消息按发言顺序排序（先按messageIndex，再按position）
        groupMap.forEach(group => {
          // 🌟 修复：确保messages数组存在
          if (!group || !group.messages || !Array.isArray(group.messages)) {
            if (group) {
              group.messages = [];
            }
            return; // 跳过排序，因为没有消息
          }

          group.messages.sort((a, b) => {
            if (a.messageIndex !== b.messageIndex) {
              return a.messageIndex - b.messageIndex;
            }
            return (a.position || 0) - (b.position || 0);
          });
        });

        const result = Array.from(groupMap.values());

        return result;
      } catch (error) {
        return []; // 返回空数组而不是抛出错误
      }
    },

    // 提取商品信息
    extractProducts: async function () {
      const messages = await this.parseChatMessages();

      // 🌟 修复：支持两种淘宝商品格式
      // 格式1: [商品|name|type|describe|price] (4个参数 - 新格式)
      // 格式2: [商品|name|type|price] (3个参数 - 旧格式)
      const productRegex4 = /\[商品\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/gs;
      const productRegex3 = /\[商品\|(.*?)\|(.*?)\|(.*?)\]/gs;

      const products4 = this.extractDataWithRegex(messages, productRegex4, '商品4参数');
      const products3 = this.extractDataWithRegex(messages, productRegex3, '商品3参数');

      // 处理4参数格式商品
      const processedProducts4 = products4.map(item => {
        const [name, type, describe, price] = item.groups;
        return {
          name: name,
          type: type,
          describe: describe,
          price: price,
          format: '4参数',
          messageIndex: item.messageIndex,
          timestamp: item.timestamp,
        };
      });

      // 处理3参数格式商品
      const processedProducts3 = products3.map(item => {
        const [name, type, price] = item.groups;
        return {
          name: name,
          type: type,
          describe: '', // 3参数格式没有描述
          price: price,
          format: '3参数',
          messageIndex: item.messageIndex,
          timestamp: item.timestamp,
        };
      });

      // 合并两种格式的商品并去重（以messageIndex和name为准）
      const allProducts = [...processedProducts4, ...processedProducts3];
      const uniqueProducts = [];
      const seen = new Set();

      allProducts.forEach(product => {
        const key = `${product.messageIndex}_${product.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueProducts.push(product);
        }
      });

      // 按消息索引排序
      uniqueProducts.sort((a, b) => a.messageIndex - b.messageIndex);

      return uniqueProducts;
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
      // 消耗点数格式: [消耗点数\|(\d+)\]/gs;
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

  // 🌟 新增：为兼容性添加别名方法
  HQDataExtractor.extractTaobaoProducts = HQDataExtractor.extractProducts;

  // 导出到全局
  window['HQDataExtractor'] = HQDataExtractor;
})(window);
