/**
 * QQ红包功能模块
 * 在mobile-ui-test扩展中实现QQ红包功能
 */

window.QQRedpack = (function() {
    'use strict';
    
    const QQRedpack = {
        // 模块初始化状态
        isInitialized: false,
        isEnabled: true,
        
        // 红包消息正则表达式
        redpackMessageRegex: /红包：([^|]+)/g,
        
        // 🌟 我方红包消息格式正则表达式（用户发送）
        // 私聊红包：[我方消息|好友名字|qq号|红包：金额|时间]
        redpackPrivateFormatRegex: /\[我方消息\|([^|]+)\|(\d+)\|红包：([^|]+)\|([^\]]+)\]/g,
        
        // 群聊红包：[我方群聊消息|群名称|群号|我|红包：金额|时间]
        redpackGroupFormatRegex: /\[我方群聊消息\|([^|]+)\|(\d+)\|我\|红包：([^|]+)\|([^\]]+)\]/g,
        
        // 🌟 对方红包消息格式正则表达式（角色发送）
        // 对方私聊红包：[对方消息|好友名字|qq号|红包：金额|时间]
        redpackReceivedPrivateFormatRegex: /\[对方消息\|([^|]+)\|(\d+)\|红包：([^|]+)\|([^\]]+)\]/g,
        
        // 对方群聊红包：[对方群聊消息|群名称|群号|好友名字|红包：金额|时间]
        redpackReceivedGroupFormatRegex: /\[对方群聊消息\|([^|]+)\|(\d+)\|([^|]+)\|红包：([^|]+)\|([^\]]+)\]/g,
        
        // 初始化红包功能
        init: function() {
            if (this.isInitialized) {
                console.log('QQ红包功能已经初始化过了');
                return;
            }
            
            console.log('🧧 正在初始化QQ红包功能...');
            
            try {
                // 初始化红包消息监听器
                this.initRedpackMessageListener();
                
                // 初始化样式
                this.injectRedpackStyles();
                
                this.isInitialized = true;
                console.log('✅ QQ红包功能初始化完成');
            } catch (error) {
                console.error('❌ QQ红包功能初始化失败:', error);
            }
        },
        
        // 显示红包面板
        showRedpackPanel: function() {
            console.log('🧧 显示QQ红包面板');
            
            // 检查是否已存在红包面板
            const existingPanel = document.getElementById('qq-redpack-panel');
            if (existingPanel) {
                existingPanel.remove();
            }
            
            // 创建红包面板HTML
            const redpackPanelHTML = `
                <div id="qq-redpack-panel" class="qq-redpack-panel">
                    <div class="redpack-panel-content">
                        <div class="redpack-panel-header">
                            <h3>发红包</h3>
                            <button class="redpack-close-btn" onclick="QQRedpack.hideRedpackPanel()">×</button>
                        </div>
                        
                        <div class="redpack-panel-body">
                            <div class="redpack-amount-section">
                                <label for="redpack-amount-input">红包金额：</label>
                                <div class="amount-input-wrapper">
                                    <span class="currency-symbol">¥</span>
                                    <input type="number" id="redpack-amount-input" 
                                           placeholder="0.01" 
                                           min="0.01" 
                                           max="200" 
                                           step="0.01">
                                </div>
                                <div class="amount-presets">
                                    <button class="amount-preset" data-amount="1">¥1</button>
                                    <button class="amount-preset" data-amount="5">¥5</button>
                                    <button class="amount-preset" data-amount="10">¥10</button>
                                    <button class="amount-preset" data-amount="20">¥20</button>
                                    <button class="amount-preset" data-amount="66">¥66</button>
                                    <button class="amount-preset" data-amount="100">¥100</button>
                                </div>
                            </div>
                            
                            <div class="redpack-message-section">
                                <label for="redpack-message-input">红包祝福语：</label>
                                <input type="text" id="redpack-message-input" 
                                       placeholder="恭喜发财，大吉大利" 
                                       maxlength="30">
                                <div class="message-presets">
                                    <button class="message-preset" data-message="恭喜发财，大吉大利">恭喜发财</button>
                                    <button class="message-preset" data-message="红包拿来">红包拿来</button>
                                    <button class="message-preset" data-message="新年快乐">新年快乐</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="redpack-panel-footer">
                            <button class="redpack-cancel-btn" onclick="QQRedpack.hideRedpackPanel()">取消</button>
                            <button class="redpack-send-btn" onclick="QQRedpack.sendRedpack()">塞钱进红包</button>
                        </div>
                    </div>
                </div>
            `;
            
            // 添加到页面
            document.body.insertAdjacentHTML('beforeend', redpackPanelHTML);
            
            // 绑定事件
            this.bindRedpackPanelEvents();
            
            // 聚焦到金额输入框
            setTimeout(() => {
                const amountInput = document.getElementById('redpack-amount-input');
                if (amountInput) {
                    amountInput.focus();
                }
            }, 100);
        },
        
        // 隐藏红包面板
        hideRedpackPanel: function() {
            const panel = document.getElementById('qq-redpack-panel');
            if (panel) {
                panel.remove();
            }
        },
        
        // 绑定红包面板事件
        bindRedpackPanelEvents: function() {
            const amountInput = document.getElementById('redpack-amount-input');
            const messageInput = document.getElementById('redpack-message-input');
            
            // 金额预设按钮事件
            document.querySelectorAll('.amount-preset').forEach(btn => {
                btn.addEventListener('click', () => {
                    const amount = btn.dataset.amount;
                    if (amountInput) {
                        amountInput.value = amount;
                    }
                });
            });
            
            // 祝福语预设按钮事件
            document.querySelectorAll('.message-preset').forEach(btn => {
                btn.addEventListener('click', () => {
                    const message = btn.dataset.message;
                    if (messageInput) {
                        messageInput.value = message;
                    }
                });
            });
            
            // 金额输入框限制
            if (amountInput) {
                amountInput.addEventListener('input', () => {
                    let value = parseFloat(amountInput.value);
                    if (value < 0.01) {
                        amountInput.value = '0.01';
                    } else if (value > 200) {
                        amountInput.value = '200';
                    }
                });
                
                // 回车发送
                amountInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.sendRedpack();
                    }
                });
            }
            
            // 祝福语输入框事件
            if (messageInput) {
                messageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.sendRedpack();
                    }
                });
            }
            
            // 点击外部关闭
            const panel = document.getElementById('qq-redpack-panel');
            if (panel) {
                panel.addEventListener('click', (e) => {
                    if (e.target === panel) {
                        this.hideRedpackPanel();
                    }
                });
            }
        },
        
        // 发送红包
        sendRedpack: function() {
            const amountInput = document.getElementById('redpack-amount-input');
            const messageInput = document.getElementById('redpack-message-input');
            
            if (!amountInput) {
                console.error('找不到红包金额输入框');
                return;
            }
            
            const amount = parseFloat(amountInput.value);
            const message = messageInput ? messageInput.value.trim() : '';
            
            if (!amount || amount < 0.01) {
                alert('请输入有效的红包金额（最低0.01元）');
                return;
            }
            
            if (amount > 200) {
                alert('红包金额不能超过200元');
                return;
            }
            
            console.log('🧧 准备插入红包到输入框:', amount, message);
            
            // 获取当前聊天目标
            const targetInfo = this.getCurrentChatTarget();
            if (!targetInfo) {
                alert('请先选择聊天对象');
                return;
            }
            
            // 将红包插入到输入框
            this.insertRedpackToInput(amount, message, targetInfo);
            
            // 显示插入成功提示
            this.showRedpackInsertToast(amount, message, targetInfo);
            
            // 关闭红包面板
            this.hideRedpackPanel();
        },
        
        // 获取当前聊天目标
        getCurrentChatTarget: function() {
            try {
                // 优先从新版聊天页面获取
                const activeChatPage = document.querySelector('.chat-page.show');
                if (activeChatPage) {
                    const contactWrapper = activeChatPage.closest('.qq-contact-wrapper');
                    const groupWrapper = activeChatPage.closest('.qq-group-wrapper');
                    
                    if (contactWrapper) {
                        return {
                            isGroup: false,
                            target: contactWrapper.dataset.qqNumber,
                            type: 'contact',
                            contactName: contactWrapper.dataset.contactName
                        };
                    } else if (groupWrapper) {
                        return {
                            isGroup: true,
                            target: groupWrapper.dataset.groupId,
                            type: 'group',
                            groupName: groupWrapper.dataset.groupName
                        };
                    }
                }
                
                console.warn('未找到活动的聊天页面');
                return null;
            } catch (error) {
                console.error('获取聊天目标失败:', error);
                return null;
            }
        },
        
        // 将红包插入到输入框
        insertRedpackToInput: function(amount, message, targetInfo) {
            try {
                console.log('🧧 插入红包到输入框:', amount, message, targetInfo);
                
                // 查找当前活跃的聊天页面
                const activeChatPage = document.querySelector('.chat-page.show');
                if (!activeChatPage) {
                    console.warn('⚠️ 未找到活跃的聊天页面');
                    alert('请先选择一个聊天对象');
                    return;
                }
                
                // 查找该聊天页面中的输入框
                const messageInputElement = activeChatPage.querySelector('.message-input');
                if (!messageInputElement) {
                    console.warn('⚠️ 未找到消息输入框');
                    return;
                }
                
                // 构建红包格式
                const redpackContent = `红包：${amount}`;
                
                // 获取当前输入框的值
                const currentValue = messageInputElement.value || '';
                
                // 如果输入框不为空且最后一个字符不是换行符，则先添加换行
                let newValue;
                if (currentValue && !currentValue.endsWith('\n')) {
                    newValue = currentValue + '\n' + redpackContent;
                } else {
                    newValue = currentValue + redpackContent;
                }
                
                // 设置新值
                messageInputElement.value = newValue;
                
                // 触发input事件以调整输入框高度
                messageInputElement.dispatchEvent(new Event('input', {bubbles: true}));
                
                // 聚焦输入框并设置光标到末尾
                if (messageInputElement.focus) {
                    messageInputElement.focus();
                }
                if (messageInputElement.setSelectionRange) {
                    messageInputElement.setSelectionRange(newValue.length, newValue.length);
                }
                
                console.log('✅ 红包已插入到输入框:', redpackContent);
                
            } catch (error) {
                console.error('❌ 插入红包失败:', error);
                alert('插入红包失败，请重试');
            }
        },
        
        // 显示红包插入成功提示
        showRedpackInsertToast: function(amount, message, targetInfo) {
            // 移除已存在的提示
            const existingToast = document.getElementById('qq-redpack-insert-toast');
            if (existingToast) {
                existingToast.remove();
            }
            
            // 创建提示元素
            const toast = document.createElement('div');
            toast.id = 'qq-redpack-insert-toast';
            toast.className = 'qq-toast qq-toast-success';
            
            const targetText = targetInfo.isGroup ? `群聊：${targetInfo.groupName || targetInfo.target}` : `私聊：${targetInfo.contactName || targetInfo.target}`;
            const messageText = message ? `祝福语：${message}` : '';
            
            toast.innerHTML = `
                <div class="toast-icon">🧧</div>
                <div class="toast-content">
                    <div class="toast-title" style="font-weight: bold; margin-bottom: 4px;">红包已添加到输入框</div>
                    <div class="toast-details" style="font-size: 12px; opacity: 0.8;">
                        <div>金额：¥${amount}</div>
                        ${messageText ? `<div>${messageText}</div>` : ''}
                        <div>${targetText}</div>
                        <div style="margin-top: 4px;">点击发送按钮发送红包</div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(toast);
            
            // 3秒后自动移除
            setTimeout(() => {
                if (toast && toast.parentNode) {
                    toast.remove();
                }
            }, 3000);
        },
        
        // 初始化红包消息监听器
        initRedpackMessageListener: function() {
            console.log('🔍 初始化红包消息监听器（仅限QQ插件容器）');
            
            // 监听DOM变化，处理新出现的红包消息
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // 检查是否是QQ插件容器内的新内容
                                const isInQQContainer = node.closest && (
                                    node.closest('#chat_history_dialog') ||
                                    node.closest('.qq-contact-wrapper') ||
                                    node.closest('.qq-group-wrapper') ||
                                    node.closest('.custom-qq-cont') ||
                                    node.closest('.custom-qq-qun')
                                );
                                
                                if (isInQQContainer) {
                                    // 🔧 保护父容器显示状态
                                    const parentWrapper = node.closest('.qq-contact-wrapper, .qq-group-wrapper');
                                    if (parentWrapper && parentWrapper.style.display === 'none') {
                                        console.log('🛡️ 检测到父容器被隐藏，红包处理时将保护其状态');
                                    }
                                    
                                    // 🌟 如果是摘要相关的容器，处理红包消息替换
                                    const isSummaryContainer = node.closest && (
                                        node.closest('.mes_text') ||
                                        node.closest('.last_mes') ||
                                        node.textContent?.includes('总结') ||
                                        node.textContent?.includes('摘要')
                                    );
                                    
                                    if (isSummaryContainer) {
                                        console.log('🔄 处理摘要区域的红包消息');
                                        // 在摘要区域，将红包消息替换为简单文本
                                        this.handleSummaryRedpackMessages(node);
                                    } else {
                                        // 在聊天区域，正常处理红包消息
                                        this.processRedpackMessages(node);
                                    }
                                }
                            }
                        });
                    }
                });
            });
            
            // 开始监听整个文档的变化
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // 处理现有的红包消息 - 只在QQ插件容器内
            this.processExistingRedpackMessages();
            
            // 🌟 学习qq-voice模式：处理摘要区域的红包消息
            this.replaceSummaryRedpackMessages();
            
            // 🔧 延迟清理重复的红包（给DOM处理时间）
            setTimeout(() => {
                this.cleanupDuplicateRedpacks();
            }, 2000);
        },
        
        // 🌟 处理摘要区域的红包消息，替换为"红包"文本
        handleSummaryRedpackMessages: function(container) {
            console.log('🔄 开始替换摘要区域的红包消息');
            
            // 查找所有摘要区域内的红包消息
            const summaryRedpackMessages = container.querySelectorAll ? 
                container.querySelectorAll('*') : 
                [container];
            
            console.log(`🔍 找到${summaryRedpackMessages.length}个摘要区域内的红包消息`);
            
            summaryRedpackMessages.forEach(element => {
                // 替换为"红包"文本
                if (element.textContent && element.textContent.includes('红包：')) {
                    // 将"红包：金额"替换为"红包"
                    const newText = element.textContent.replace(/红包：[^，。！？]*/, '红包');
                    element.textContent = newText;
                    console.log('✅ 已替换摘要文本中的红包内容');
                }
            });
        },
        
        // 🌟 新增：替换摘要区域的红包消息为"红包"文本（学习qq-voice模式）
        replaceSummaryRedpackMessages: function() {
            console.log('🔄 开始替换摘要区域的红包消息');
            
            // 查找所有摘要区域内的红包消息
            const summaryRedpackMessages = document.querySelectorAll(`
                .group-summary .redpack-message,
                .contact-summary .redpack-message,
                .last-message .redpack-message
            `);
            
            console.log(`🔍 找到${summaryRedpackMessages.length}个摘要区域内的红包消息`);
            
            summaryRedpackMessages.forEach(redpackElement => {
                // 替换为"红包"文本
                const textSpan = document.createElement('span');
                textSpan.textContent = '红包';
                textSpan.style.cssText = 'color: #666; font-size: 14px;';
                
                // 替换原始红包元素
                if (redpackElement.parentNode) {
                    redpackElement.parentNode.replaceChild(textSpan, redpackElement);
                    console.log('✅ 已替换一个红包消息为文本');
                }
            });
            
            // 🌟 也处理包含"红包："文本但还没被转换的摘要内容
            const summaryElements = document.querySelectorAll(`
                .group-summary .last-message,
                .contact-summary .last-message
            `);
            
            summaryElements.forEach(element => {
                if (element.textContent && element.textContent.includes('红包：')) {
                    // 将"红包：金额"替换为"红包"
                    const newText = element.textContent.replace(/红包：[^，。！？]*/, '红包');
                    element.textContent = newText;
                    console.log('✅ 已替换摘要文本中的红包内容');
                }
            });
        },
        
        // 处理现有的红包消息 - 只在QQ插件容器内
        processExistingRedpackMessages: function() {
            console.log('🔍 处理现有红包消息（仅限QQ插件容器）');
            
            // 查找QQ插件容器内的所有文本内容
            const containers = [
                ...document.querySelectorAll('#chat_history_dialog *'),
                ...document.querySelectorAll('.qq-contact-wrapper *'),
                ...document.querySelectorAll('.qq-group-wrapper *'),
                ...document.querySelectorAll('.custom-qq-cont *'),
                ...document.querySelectorAll('.custom-qq-qun *')
            ];
            
            containers.forEach(element => {
                if (element.textContent) {
                    this.processRedpackMessages(element);
                }
            });
        },
        
        // 处理红包消息
        processRedpackMessages: function(element) {
            try {
                // 检查是否在摘要区域
                const isSummaryArea = element.closest && (
                    element.closest('.mes_text') ||
                    element.closest('.last_mes') ||
                    element.textContent?.includes('总结') ||
                    element.textContent?.includes('摘要')
                );
                
                if (isSummaryArea) {
                    console.log('🚫 跳过摘要区域的红包消息处理');
                    return;
                }
                
                const text = element.textContent || element.innerText || '';
                
                // 检查是否包含红包消息
                if (text.includes('红包：')) {
                    console.log('🧧 发现红包消息:', text);
                    
                    // 🔧 强化重复处理检查
                    // 检查当前元素是否已经被处理过
                    if (element.hasAttribute('data-redpack-processed')) {
                        console.log('🚫 红包消息已处理过，跳过');
                        return;
                    }
                    
                    // 检查父容器是否已有红包消息
                    const parentContainer = element.closest('.custom-qq-cont, .custom-qq-qun');
                    if (parentContainer && parentContainer.querySelector('.redpack-message')) {
                        // 检查是否是同一个红包消息
                        const existingRedpacks = parentContainer.querySelectorAll('.redpack-message');
                        const currentAmount = text.match(/红包：([^|<\n]+)/);
                        if (currentAmount) {
                            const amount = currentAmount[1].trim();
                            for (let redpack of existingRedpacks) {
                                if (redpack.textContent.includes(amount)) {
                                    console.log('🚫 相同金额的红包已存在，跳过重复处理');
                                    element.setAttribute('data-redpack-processed', 'true');
                                    return;
                                }
                            }
                        }
                    }
                    
                    // 标记为已处理
                    element.setAttribute('data-redpack-processed', 'true');
                    
                    // 将文本转换为红包消息显示
                    this.convertTextToRedpackDisplay(element);
                }
            } catch (error) {
                console.error('处理红包消息时出错:', error);
            }
        },
        
        // 将文本转换为红包消息显示 - 🌟 学习qq-voice模式，区分用户和角色发送
        convertTextToRedpackDisplay: function(element) {
            const text = element.textContent || '';
            
            // 🚫 排除摘要区域的 last-message，只显示纯文本
            if (element.closest && (
                element.closest('.group-summary') ||
                element.closest('.contact-summary') ||
                element.closest('.last-message')
            )) {
                console.log('🚫 跳过摘要区域的红包消息处理');
                return;
            }
            
            // 🔧 检查是否已经转换过
            if (element.hasAttribute('data-redpack-converted')) {
                console.log('🚫 红包消息已转换过，跳过');
                return;
            }
            
            // 使用正则表达式找到红包消息并替换
            const redpackRegex = /红包：([^|<\n]+)/g;
            let match;
            
            while ((match = redpackRegex.exec(text)) !== null) {
                const amount = match[1].trim();
                
                // 🌟 学习qq-voice模式：检查当前消息是否为发送的消息（通过父元素类名判断）
                const parentElement = element.closest('.custom-message, .mes, .message');
                const isSentMessage = parentElement && (
                    parentElement.classList.contains('custom-sent') ||
                    parentElement.classList.contains('is_user') ||
                    element.closest('[is_user="true"]')
                );
                
                console.log(`🧧 处理红包消息: ¥${amount}, 用户发送: ${isSentMessage}`);
                
                // 🔧 再次检查容器中是否已有相同金额的红包
                const targetContainer = this.findCorrectRedpackContainer(element);
                if (targetContainer) {
                    const existingRedpacks = targetContainer.querySelectorAll('.redpack-message');
                    for (let redpack of existingRedpacks) {
                        if (redpack.textContent.includes(`¥${amount}`)) {
                            console.log(`🚫 容器中已存在¥${amount}的红包，跳过重复创建`);
                            element.setAttribute('data-redpack-converted', 'true');
                            return;
                        }
                    }
                }
                
                // 生成唯一ID用于标识这个红包消息
                const redpackId = 'redpack_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                
                // 🌟 创建红包消息HTML，传递消息类型
                const redpackHtml = this.generateRedpackHTML(redpackId, amount, isSentMessage);
                
                if (targetContainer) {
                    // 🔧 安全插入红包，不影响父容器状态
                    this.safeInsertRedpack(targetContainer, redpackHtml, element, amount);
                } else {
                    // 回退到原来的方式
                    const redpackElement = document.createElement('div');
                    redpackElement.innerHTML = redpackHtml;
                    element.parentNode.insertBefore(redpackElement.firstElementChild, element);
                    element.style.display = 'none';
                    
                    console.log(`🧧 红包消息HTML已生成（默认位置）: ¥${amount}`);
                }
                
                // 标记为已转换
                element.setAttribute('data-redpack-converted', 'true');
                
                break; // 只处理第一个红包消息
            }
        },
        
        // 🌟 新增：生成红包HTML，支持用户/角色区分（学习qq-voice模式）
        generateRedpackHTML: function(redpackId, amount, isSentMessage) {
            // 根据消息类型设置不同的样式类
            const messageTypeClass = isSentMessage ? 'custom-sent' : 'custom-received';
            const senderText = isSentMessage ? '我发出的' : '收到的';
            
            return `
                <div class="redpack-message custom-message ${messageTypeClass}" data-redpack-id="${redpackId}">
                    <div class="redpack-envelope ${isSentMessage ? 'sent-redpack' : 'received-redpack'}" onclick="QQRedpack.openRedpack('${redpackId}', '${amount}')">
                        <div class="redpack-top">
                            <div class="redpack-icon">🧧</div>
                            <div class="redpack-text">${senderText}红包</div>
                        </div>
                        <div class="redpack-amount">¥${amount}</div>
                        <div class="redpack-hint">${isSentMessage ? '等待领取' : '点击领取'}</div>
                    </div>
                </div>
            `;
        },
        
        // 🌟 新增：查找正确的红包容器
        findCorrectRedpackContainer: function(element) {
            // 检查元素是否在联系人聊天容器中
            const contactWrapper = element.closest('.qq-contact-wrapper');
            if (contactWrapper) {
                const qqNumber = contactWrapper.dataset.qqNumber;
                if (qqNumber) {
                    // 🔧 确保联系人容器保持可见状态
                    if (contactWrapper.style.display === 'none') {
                        console.log(`📱 联系人${qqNumber}容器被隐藏，保持原状态但确保红包可见`);
                    }
                    
                    // 查找该联系人的消息容器
                    const messageContainer = contactWrapper.querySelector(`.custom-qq-cont-${qqNumber}`);
                    if (messageContainer) {
                        console.log(`🎯 找到联系人${qqNumber}的消息容器`);
                        return messageContainer;
                    }
                }
            }
            
            // 检查元素是否在群聊容器中
            const groupWrapper = element.closest('.qq-group-wrapper');
            if (groupWrapper) {
                const groupId = groupWrapper.dataset.groupId;
                if (groupId) {
                    // 🔧 确保群组容器保持可见状态
                    if (groupWrapper.style.display === 'none') {
                        console.log(`📱 群组${groupId}容器被隐藏，保持原状态但确保红包可见`);
                    }
                    
                    // 查找该群组的消息容器
                    const messageContainer = groupWrapper.querySelector(`.custom-qq-qun-${groupId}`);
                    if (messageContainer) {
                        console.log(`🎯 找到群组${groupId}的消息容器`);
                        return messageContainer;
                    }
                }
            }
            
            // 检查是否已经在消息容器内
            const existingContainer = element.closest('.custom-qq-cont, .custom-qq-qun');
            if (existingContainer) {
                console.log('🎯 元素已在消息容器内');
                return existingContainer;
            }
            
            console.warn('⚠️ 未找到合适的红包容器');
            return null;
        },
        
        // 🔧 安全插入红包方法，防止影响父容器显示状态
        safeInsertRedpack: function(targetContainer, redpackHtml, originalElement, amount) {
            try {
                // 记录父容器的原始状态
                const parentWrapper = targetContainer.closest('.qq-contact-wrapper, .qq-group-wrapper');
                let originalDisplay = null;
                
                if (parentWrapper) {
                    originalDisplay = parentWrapper.style.display;
                    console.log(`📱 记录父容器原始显示状态: ${originalDisplay || 'default'}`);
                }
                
                // 创建红包元素
                const redpackElement = document.createElement('div');
                redpackElement.innerHTML = redpackHtml;
                const redpackNode = redpackElement.firstElementChild;
                
                // 插入红包到目标容器
                targetContainer.appendChild(redpackNode);
                
                // 隐藏原始消息元素
                originalElement.style.display = 'none';
                
                // 🔧 恢复父容器的显示状态（如果被意外改变）
                if (parentWrapper && originalDisplay !== null) {
                    setTimeout(() => {
                        const currentDisplay = parentWrapper.style.display;
                        if (currentDisplay !== originalDisplay) {
                            console.log(`🔧 恢复父容器显示状态: ${originalDisplay || 'default'} (当前: ${currentDisplay})`);
                            if (originalDisplay) {
                                parentWrapper.style.display = originalDisplay;
                            } else {
                                parentWrapper.style.removeProperty('display');
                            }
                        }
                    }, 100); // 延迟检查，确保其他逻辑执行完毕
                }
                
                console.log(`🧧 红包消息已安全插入到正确容器: ¥${amount}`);
                
            } catch (error) {
                console.error('安全插入红包时出错:', error);
                // 回退到简单插入方式
                const redpackElement = document.createElement('div');
                redpackElement.innerHTML = redpackHtml;
                targetContainer.appendChild(redpackElement.firstElementChild);
                originalElement.style.display = 'none';
            }
        },
        
        // 打开红包
        openRedpack: function(redpackId, amount) {
            console.log('🧧 打开红包:', redpackId, amount);
            
            // 显示红包打开动画和提示
            this.showRedpackOpenAnimation(redpackId, amount);
            
            // 将红包标记为已打开
            const redpackElement = document.querySelector(`[data-redpack-id="${redpackId}"]`);
            if (redpackElement) {
                redpackElement.classList.add('opened');
                const envelope = redpackElement.querySelector('.redpack-envelope');
                if (envelope) {
                    envelope.innerHTML = `
                        <div class="redpack-opened">
                            <div class="redpack-icon">🧧</div>
                            <div class="redpack-text">已领取</div>
                            <div class="redpack-amount">¥${amount}</div>
                        </div>
                    `;
                }
            }
        },
        
        // 显示红包打开动画
        showRedpackOpenAnimation: function(redpackId, amount) {
            // 创建红包打开提示
            const openToast = document.createElement('div');
            openToast.className = 'redpack-open-toast';
            openToast.innerHTML = `
                <div class="redpack-open-content">
                    <div class="redpack-open-icon">🧧</div>
                    <div class="redpack-open-text">恭喜发财！</div>
                    <div class="redpack-open-amount">¥${amount}</div>
                    <div class="redpack-open-hint">红包已领取</div>
                </div>
            `;
            
            document.body.appendChild(openToast);
            
            // 3秒后移除
            setTimeout(() => {
                if (openToast && openToast.parentNode) {
                    openToast.remove();
                }
            }, 3000);
        },
        
        // 注入红包相关样式
        injectRedpackStyles: function() {
            // 检查是否已经注入过样式
            if (document.getElementById('qq-redpack-styles')) {
                return;
            }
            
            const styles = `
                <style id="qq-redpack-styles">
                /* QQ红包面板样式 */
                .qq-redpack-panel {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 100000;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .redpack-panel-content {
                    background: #fff;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 400px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    overflow: hidden;
                }
                
                .redpack-panel-header {
                    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                    color: white;
                    padding: 20px;
                    text-align: center;
                    position: relative;
                }
                
                .redpack-panel-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .redpack-close-btn {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                }
                
                .redpack-close-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .redpack-panel-body {
                    padding: 25px;
                }
                
                .redpack-amount-section,
                .redpack-message-section {
                    margin-bottom: 25px;
                }
                
                .redpack-amount-section label,
                .redpack-message-section label {
                    display: block;
                    margin-bottom: 10px;
                    font-weight: 600;
                    color: #333;
                    font-size: 14px;
                }
                
                .amount-input-wrapper {
                    position: relative;
                    margin-bottom: 15px;
                }
                
                .currency-symbol {
                    position: absolute;
                    left: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #ff6b6b;
                    font-weight: bold;
                    font-size: 18px;
                }
                
                #redpack-amount-input {
                    width: 100%;
                    padding: 15px 15px 15px 35px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 18px;
                    font-weight: 600;
                    box-sizing: border-box;
                    transition: border-color 0.2s;
                }
                
                #redpack-amount-input:focus {
                    outline: none;
                    border-color: #ff6b6b;
                }
                
                #redpack-message-input {
                    width: 100%;
                    padding: 12px 15px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 14px;
                    box-sizing: border-box;
                    transition: border-color 0.2s;
                    margin-bottom: 15px;
                }
                
                #redpack-message-input:focus {
                    outline: none;
                    border-color: #ff6b6b;
                }
                
                .amount-presets,
                .message-presets {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .amount-preset,
                .message-preset {
                    padding: 8px 15px;
                    border: 1px solid #e1e5e9;
                    background: #f8f9fa;
                    border-radius: 20px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .amount-preset:hover,
                .message-preset:hover {
                    background: #ff6b6b;
                    color: white;
                    border-color: #ff6b6b;
                }
                
                .redpack-panel-footer {
                    display: flex;
                    padding: 20px 25px;
                    gap: 15px;
                    background: #f8f9fa;
                }
                
                .redpack-cancel-btn,
                .redpack-send-btn {
                    flex: 1;
                    padding: 15px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .redpack-cancel-btn {
                    background: #e9ecef;
                    color: #6c757d;
                }
                
                .redpack-cancel-btn:hover {
                    background: #dee2e6;
                }
                
                .redpack-send-btn {
                    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                    color: white;
                }
                
                .redpack-send-btn:hover {
                    background: linear-gradient(135deg, #ee5a52, #dc4c64);
                }
                
                /* 聊天中的红包消息样式 - 只在QQ插件容器内生效 */
                #chat_history_dialog .redpack-message,
                .qq-contact-wrapper .redpack-message,
                .qq-group-wrapper .redpack-message,
                .custom-qq-cont .redpack-message,
                .custom-qq-qun .redpack-message {
                    margin: 10px 0;
                    display: flex;
                    justify-content: flex-start;
                }
                
                #chat_history_dialog .redpack-envelope,
                .qq-contact-wrapper .redpack-envelope,
                .qq-group-wrapper .redpack-envelope,
                .custom-qq-cont .redpack-envelope,
                .custom-qq-qun .redpack-envelope {
                    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                    border-radius: 12px;
                    padding: 15px;
                    color: white;
                    cursor: pointer;
                    transition: transform 0.2s;
                    min-width: 150px;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
                }
                
                #chat_history_dialog .redpack-envelope:hover,
                .qq-contact-wrapper .redpack-envelope:hover,
                .qq-group-wrapper .redpack-envelope:hover,
                .custom-qq-cont .redpack-envelope:hover,
                .custom-qq-qun .redpack-envelope:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
                }
                
                #chat_history_dialog .redpack-top,
                .qq-contact-wrapper .redpack-top,
                .qq-group-wrapper .redpack-top,
                .custom-qq-cont .redpack-top,
                .custom-qq-qun .redpack-top {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    margin-bottom: 8px;
                }
                
                #chat_history_dialog .redpack-icon,
                .qq-contact-wrapper .redpack-icon,
                .qq-group-wrapper .redpack-icon,
                .custom-qq-cont .redpack-icon,
                .custom-qq-qun .redpack-icon {
                    font-size: 20px;
                }
                
                #chat_history_dialog .redpack-text,
                .qq-contact-wrapper .redpack-text,
                .qq-group-wrapper .redpack-text,
                .custom-qq-cont .redpack-text,
                .custom-qq-qun .redpack-text {
                    font-weight: 600;
                    font-size: 14px;
                }
                
                #chat_history_dialog .redpack-amount,
                .qq-contact-wrapper .redpack-amount,
                .qq-group-wrapper .redpack-amount,
                .custom-qq-cont .redpack-amount,
                .custom-qq-qun .redpack-amount {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                #chat_history_dialog .redpack-hint,
                .qq-contact-wrapper .redpack-hint,
                .qq-group-wrapper .redpack-hint,
                .custom-qq-cont .redpack-hint,
                .custom-qq-qun .redpack-hint {
                    font-size: 12px;
                    opacity: 0.9;
                }
                
                #chat_history_dialog .redpack-opened,
                .qq-contact-wrapper .redpack-opened,
                .qq-group-wrapper .redpack-opened,
                .custom-qq-cont .redpack-opened,
                .custom-qq-qun .redpack-opened {
                    opacity: 0.7;
                }
                
                /* 🌟 学习qq-voice模式：区分用户发送和角色发送的红包样式 */
                #chat_history_dialog .sent-redpack,
                .qq-contact-wrapper .sent-redpack,
                .qq-group-wrapper .sent-redpack,
                .custom-qq-cont .sent-redpack,
                .custom-qq-qun .sent-redpack {
                    background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
                    border: 2px solid #ff5252;
                }
                
                #chat_history_dialog .received-redpack,
                .qq-contact-wrapper .received-redpack,
                .qq-group-wrapper .received-redpack,
                .custom-qq-cont .received-redpack,
                .custom-qq-qun .received-redpack {
                    background: linear-gradient(135deg, #ffa726 0%, #ffb74d 100%);
                    border: 2px solid #ff9800;
                }
                
                #chat_history_dialog .custom-sent .redpack-message,
                .qq-contact-wrapper .custom-sent .redpack-message,
                .qq-group-wrapper .custom-sent .redpack-message,
                .custom-qq-cont .custom-sent .redpack-message,
                .custom-qq-qun .custom-sent .redpack-message {
                    align-self: flex-end;
                    margin-left: auto;
                }
                
                #chat_history_dialog .custom-received .redpack-message,
                .qq-contact-wrapper .custom-received .redpack-message,
                .qq-group-wrapper .custom-received .redpack-message,
                .custom-qq-cont .custom-received .redpack-message,
                .custom-qq-qun .custom-received .redpack-message {
                    align-self: flex-start;
                    margin-right: auto;
                }
                
                /* 红包打开提示样式 */
                .redpack-open-toast {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    z-index: 100001;
                    animation: redpackOpen 0.5s ease-out;
                }
                
                @keyframes redpackOpen {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.5);
                    }
                    100% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
                
                .redpack-open-icon {
                    font-size: 48px;
                    margin-bottom: 15px;
                }
                
                .redpack-open-text {
                    font-size: 18px;
                    font-weight: 600;
                    color: #ff6b6b;
                    margin-bottom: 10px;
                }
                
                .redpack-open-amount {
                    font-size: 24px;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 10px;
                }
                
                .redpack-open-hint {
                    font-size: 14px;
                    color: #666;
                }
                
                /* 通用提示样式 */
                .qq-toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    z-index: 100000;
                    max-width: 300px;
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    animation: slideInRight 0.3s ease-out;
                }
                
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                .qq-toast-success {
                    border-left: 4px solid #28a745;
                }
                
                .toast-icon {
                    font-size: 20px;
                    flex-shrink: 0;
                }
                
                .toast-content {
                    flex: 1;
                }
                
                .toast-title {
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 5px;
                }
                
                .toast-details {
                    color: #666;
                    font-size: 12px;
                    line-height: 1.4;
                }
                </style>
            `;
            
            document.head.insertAdjacentHTML('beforeend', styles);
            console.log('✅ QQ红包样式已注入');
        },
        
        // 🔧 新增：清理重复的红包消息
        cleanupDuplicateRedpacks: function() {
            console.log('🧹 开始清理重复的红包消息');
            
            // 查找所有QQ插件容器
            const containers = document.querySelectorAll('.custom-qq-cont, .custom-qq-qun');
            
            containers.forEach(container => {
                const redpacks = container.querySelectorAll('.redpack-message');
                const seenAmounts = new Map(); // 记录已见过的金额和类型
                
                redpacks.forEach(redpack => {
                    const amountElement = redpack.querySelector('.redpack-amount');
                    const typeElement = redpack.querySelector('.redpack-text');
                    
                    if (amountElement && typeElement) {
                        const amount = amountElement.textContent.trim();
                        const type = typeElement.textContent.trim();
                        const key = `${amount}-${type}`; // 组合键：金额-类型
                        
                        if (seenAmounts.has(key)) {
                            // 发现重复，移除这个红包
                            console.log(`🗑️ 移除重复红包: ${key}`);
                            redpack.remove();
                        } else {
                            // 记录这个红包
                            seenAmounts.set(key, true);
                            console.log(`✅ 保留红包: ${key}`);
                        }
                    }
                });
            });
            
            console.log('🧹 重复红包清理完成');
        },
        
        // 测试红包功能
        testRedpack: function() {
            console.log('🧪 测试QQ红包功能');
            this.showRedpackPanel();
        }
    };
    
    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            QQRedpack.init();
        });
    } else {
        QQRedpack.init();
    }
    
    return QQRedpack;
})(); 