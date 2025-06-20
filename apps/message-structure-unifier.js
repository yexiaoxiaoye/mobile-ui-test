/**
 * 消息结构统一工具
 * 将 custom-qun-cont-item 结构转换为 custom-message custom-received 结构
 */
(function(window) {
    'use strict';
    
    const MessageStructureUnifier = {
        
        // 统一消息结构
        unifyMessageStructures: function() {
            console.log('🔄 开始统一消息结构...');
            
            // 1. 转换所有 custom-qun-cont-item 元素
            const qunContItems = document.querySelectorAll('.custom-qun-cont-item');
            console.log(`找到 ${qunContItems.length} 个 custom-qun-cont-item 需要转换`);
            
            let convertedCount = 0;
            
            qunContItems.forEach((item, index) => {
                try {
                    this.convertQunContItemToMessage(item, index);
                    convertedCount++;
                } catch (error) {
                    console.error(`转换第 ${index + 1} 个 custom-qun-cont-item 时出错:`, error);
                }
            });
            
            // 2. 检查并修复现有的 custom-message 结构
            const existingMessages = document.querySelectorAll('.custom-message');
            console.log(`找到 ${existingMessages.length} 个现有的 custom-message 需要检查`);
            
            let fixedCount = 0;
            
            existingMessages.forEach((message, index) => {
                try {
                    if (this.fixExistingMessage(message, index)) {
                        fixedCount++;
                    }
                } catch (error) {
                    console.error(`修复第 ${index + 1} 个现有消息时出错:`, error);
                }
            });
            
            console.log(`✅ 消息结构统一完成，转换 ${convertedCount} 个新消息，修复 ${fixedCount} 个现有消息`);
        },
        
        // 转换单个 custom-qun-cont-item 为标准消息结构
        convertQunContItemToMessage: function(qunContItem, index) {
            // 提取现有数据
            const senderNameEl = qunContItem.querySelector('.sender-name');
            const messageContentEl = qunContItem.querySelector('.message-content');
            const messageTimeEl = qunContItem.querySelector('.message-time');
            
            if (!messageContentEl || !messageTimeEl) {
                console.warn('消息结构不完整，跳过转换');
                return;
            }
            
            const messageContent = messageContentEl.textContent.trim();
            const messageTime = messageTimeEl.textContent.trim();
            
            // 生成群ID（如果可以从父元素获取更好）
            const groupId = this.extractGroupId(qunContItem) || '453059894'; // 默认群ID
            
            // 生成唯一ID
            const messageId = `group-msg-${groupId}-${index}-${Date.now()}`;
            
            // 判断是否为我方消息
            let isMyMessage = false;
            let senderName = '';
            
            if (senderNameEl) {
                senderName = senderNameEl.textContent.trim();
                // 检测是否为我方消息的关键词
                isMyMessage = this.isMyMessage(senderName, messageContent, qunContItem);
            } else {
                // 没有发送者名称，默认为我方消息
                isMyMessage = true;
            }
            
            let newMessageHTML;
            
            if (isMyMessage) {
                // 我方消息：custom-sent 结构，无发送者名称
                newMessageHTML = `
                    <div class="custom-message custom-sent custom-qun-${groupId}" id="${messageId}">
                        <div>
                            <div>${messageContent}</div>
                            <div class="message-time">${messageTime}</div>
                        </div>
                    </div>
                `;
            } else {
                // 对方消息：custom-received 结构，包含发送者名称
                const displaySenderName = senderName.endsWith(':') ? senderName : senderName + ':';
                newMessageHTML = `
                    <div class="custom-message custom-received custom-qun-${groupId}" id="${messageId}">
                        <div>
                            <div class="sender-name" style="font-size: 12px; color: #666; margin-bottom: 4px;">${displaySenderName}</div>
                            <div>${messageContent}</div>
                            <div class="message-time">${messageTime}</div>
                        </div>
                    </div>
                `;
            }
            
            // 创建新元素
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newMessageHTML;
            const newMessageEl = tempDiv.firstElementChild;
            
            // 替换旧元素
            if (qunContItem.parentNode && newMessageEl) {
                qunContItem.parentNode.replaceChild(newMessageEl, qunContItem);
                const messageType = isMyMessage ? '我方消息' : '对方消息';
                console.log(`✅ 已转换${messageType}: ${isMyMessage ? messageContent.substring(0, 20) : senderName} -> ${messageId}`);
            }
        },
        
        // 从父元素或上下文中提取群ID
        extractGroupId: function(element) {
            // 尝试从父元素的类名中提取群ID
            let parent = element.parentElement;
            while (parent) {
                const className = parent.className || '';
                const match = className.match(/custom-qun-(\d+)|group-(\d+)|qun-(\d+)/);
                if (match) {
                    return match[1] || match[2] || match[3];
                }
                parent = parent.parentElement;
            }
            
            // 尝试从data属性中提取
            let current = element;
            while (current) {
                if (current.dataset) {
                    if (current.dataset.groupId) return current.dataset.groupId;
                    if (current.dataset.qunId) return current.dataset.qunId;
                }
                current = current.parentElement;
            }
            
            return null;
        },
        
        // 判断是否为我方消息
        isMyMessage: function(senderName, messageContent, element) {
            // 1. 检查发送者名称是否为"我"相关的关键词
            const myKeywords = ['我', 'QAQ', 'QAQ君', '你', 'User', 'user'];
            if (myKeywords.some(keyword => senderName.includes(keyword))) {
                return true;
            }
            
            // 2. 检查元素的类名是否包含"sent"或"my"相关标识
            let current = element;
            while (current) {
                const className = current.className || '';
                if (className.includes('custom-sent') || className.includes('my-message') || className.includes('user-message')) {
                    return true;
                }
                current = current.parentElement;
            }
            
            // 3. 检查是否在我方消息的容器中
            const parentContainer = element.closest('.custom-message.custom-sent, .my-message-container, .user-message-container');
            if (parentContainer) {
                return true;
            }
            
            // 4. 通过消息内容特征判断（如果内容很短且像是回复）
            if (messageContent.length <= 10 && (messageContent.includes('好') || messageContent.includes('哦') || messageContent.includes('嗯'))) {
                return true;
            }
            
            // 5. 默认为对方消息
            return false;
        },
        
        // 修复现有的 custom-message 结构
        fixExistingMessage: function(messageEl, index) {
            // 检查消息是否已经是标准结构
            if (!messageEl.id || !messageEl.id.startsWith('group-msg-')) {
                // 生成新的ID
                const groupId = this.extractGroupIdFromClasses(messageEl) || '453059894';
                const newId = `group-msg-${groupId}-${index}-${Date.now()}`;
                messageEl.id = newId;
            }
            
            // 确保群组类名存在
            const groupId = this.extractGroupIdFromClasses(messageEl);
            if (groupId && !messageEl.classList.contains(`custom-qun-${groupId}`)) {
                messageEl.classList.add(`custom-qun-${groupId}`);
            }
            
            // 检查内部结构是否正确
            const innerDiv = messageEl.querySelector('div');
            if (!innerDiv) {
                console.warn('消息缺少内部div结构，跳过修复');
                return false;
            }
            
            // 检查是否为sent消息但包含sender-name（这是错误的）
            if (messageEl.classList.contains('custom-sent')) {
                const senderNameEl = innerDiv.querySelector('.sender-name');
                if (senderNameEl) {
                    // 移除不应该存在的sender-name
                    senderNameEl.remove();
                    console.log(`✅ 修复我方消息：移除了不应该存在的发送者名称`);
                    return true;
                }
            }
            
            // 检查是否为received消息但缺少sender-name
            if (messageEl.classList.contains('custom-received')) {
                const senderNameEl = innerDiv.querySelector('.sender-name');
                if (!senderNameEl) {
                    // 这个消息缺少发送者名称，尝试从上下文推断或添加默认名称
                    const messageContentEl = innerDiv.children[0];
                    if (messageContentEl && !messageContentEl.classList.contains('message-time')) {
                        // 在消息内容前添加发送者名称
                        const defaultSenderName = '未知用户:';
                        const senderDiv = document.createElement('div');
                        senderDiv.className = 'sender-name';
                        senderDiv.style.cssText = 'font-size: 12px; color: #666; margin-bottom: 4px;';
                        senderDiv.textContent = defaultSenderName;
                        innerDiv.insertBefore(senderDiv, messageContentEl);
                        console.log(`✅ 修复对方消息：添加了缺失的发送者名称`);
                        return true;
                    }
                }
            }
            
            return false;
        },
        
        // 从类名中提取群组ID
        extractGroupIdFromClasses: function(element) {
            const className = element.className || '';
            const match = className.match(/custom-qun-(\d+)/);
            return match ? match[1] : null;
        },
        
        // 添加冒号到发送者名称（如果没有的话）
        addColonToSenderNames: function() {
            console.log('🔄 为发送者名称添加冒号...');
            
            const senderNames = document.querySelectorAll('.custom-message.custom-received .sender-name');
            let updatedCount = 0;
            
            senderNames.forEach(senderNameEl => {
                const text = senderNameEl.textContent.trim();
                if (!text.endsWith(':')) {
                    senderNameEl.textContent = text + ':';
                    updatedCount++;
                }
            });
            
            console.log(`✅ 已为 ${updatedCount} 个发送者名称添加冒号`);
        },
        
        // 运行完整的统一过程
        runFullUnification: function() {
            console.log('🚀 开始完整的消息结构统一过程...');
            
            // 1. 先统一结构
            this.unifyMessageStructures();
            
            // 2. 确保发送者名称有冒号
            this.addColonToSenderNames();
            
            console.log('🎉 消息结构统一过程完成！');
        },
        
        // 测试功能 - 创建测试消息展示两种结构
        createTestMessage: function() {
            const currentTime = new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).replace(/\//g, '/').replace(',', '');
            
            const testHTML = `
                <!-- 对方消息示例 -->
                <div class="custom-message custom-received custom-qun-453059894" id="group-msg-453059894-test-${Date.now()}">
                    <div>
                        <div class="sender-name" style="font-size: 12px; color: #666; margin-bottom: 4px;">小樱:</div>
                        <div>这是一条对方发送的测试消息</div>
                        <div class="message-time">${currentTime}</div>
                    </div>
                </div>
                
                <!-- 我方消息示例 -->
                <div class="custom-message custom-sent custom-qun-453059894" id="group-msg-453059894-test-${Date.now() + 1}">
                    <div>
                        <div>好的，我知道了</div>
                        <div class="message-time">${currentTime}</div>
                    </div>
                </div>
                
                <!-- 旧结构测试（用于转换） -->
                <div class="custom-qun-cont-item">
                    <div class="sender-name">测试用户</div>
                    <div class="message-content">这是一条旧结构的消息，将被转换</div>
                    <div class="message-time">${currentTime}</div>
                </div>
            `;
            
            const container = document.querySelector('#history_content') || document.body;
            container.insertAdjacentHTML('beforeend', testHTML);
            
            console.log('📝 已创建测试消息（包含对方消息、我方消息和旧结构消息）');
        },
        
        // 演示完整转换过程
        demonstrateConversion: function() {
            console.log('🎬 开始演示消息结构转换过程...');
            
            // 1. 创建测试消息
            this.createTestMessage();
            
            // 2. 等待一秒后转换
            setTimeout(() => {
                console.log('📝 正在转换旧结构消息...');
                this.runFullUnification();
            }, 1000);
        }
    };
    
    // 导出到全局
    window['MessageStructureUnifier'] = MessageStructureUnifier;
    
    // 在控制台中提供快捷命令
    window['unifyMessages'] = () => MessageStructureUnifier.runFullUnification();
    window['createTestMessage'] = () => MessageStructureUnifier.createTestMessage();
    window['demonstrateConversion'] = () => MessageStructureUnifier.demonstrateConversion();
    
    console.log('✅ MessageStructureUnifier 已加载');
    console.log('💡 使用方法：');
    console.log('   - unifyMessages()：统一所有消息结构为标准格式');
    console.log('   - createTestMessage()：创建测试消息（展示两种标准结构）');
    console.log('   - demonstrateConversion()：演示完整的转换过程');
    console.log('📋 标准格式说明：');
    console.log('   - 对方消息：custom-message custom-received（包含发送者名称）');
    console.log('   - 我方消息：custom-message custom-sent（不包含发送者名称）');
    
})(window); 