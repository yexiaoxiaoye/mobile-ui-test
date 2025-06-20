/**
 * QQ语音功能模块
 * 在mobile-ui-test扩展中实现QQ语音功能（文字形式）
 */

window.QQVoice = (function() {
    'use strict';
    
    const QQVoice = {
        // 模块初始化状态
        isInitialized: false,
        isEnabled: true,
        
        // 语音消息正则表达式
        voiceMessageRegex: /语音：([^|]+)/g,
        
        // 语音消息格式正则表达式
        // 私聊语音：[我方消息|好友名字|qq号|语音：内容|时间]
        voicePrivateFormatRegex: /\[我方消息\|([^|]+)\|(\d+)\|语音：([^|]+)\|([^\]]+)\]/g,
        
        // 群聊语音：[我方群聊消息|群名称|群号|我|语音：内容|时间]
        voiceGroupFormatRegex: /\[我方群聊消息\|([^|]+)\|(\d+)\|我\|语音：([^|]+)\|([^\]]+)\]/g,
        
        // 初始化语音功能
        init: function() {
            if (this.isInitialized) {
                console.log('QQ语音功能已经初始化过了');
                return;
            }
            
            console.log('🎤 正在初始化QQ语音功能...');
            
            try {
                // 初始化语音消息监听器
                this.initVoiceMessageListener();
                
                // 初始化样式
                this.injectVoiceStyles();
                
                this.isInitialized = true;
                console.log('✅ QQ语音功能初始化完成');
            } catch (error) {
                console.error('❌ QQ语音功能初始化失败:', error);
            }
        },
        
        // 显示语音面板
        showVoicePanel: function() {
            console.log('🎤 显示QQ语音录制面板');
            
            // 检查是否已存在语音面板
            const existingPanel = document.getElementById('qq-voice-panel');
            if (existingPanel) {
                existingPanel.remove();
            }
            
            // 创建语音面板HTML
            const voicePanelHTML = `
                <div id="qq-voice-panel" class="qq-voice-panel">
                    <div class="voice-panel-content">
                        <div class="voice-panel-header">
                            <h3>语音消息</h3>
                            <button class="voice-close-btn" onclick="QQVoice.hideVoicePanel()">×</button>
                        </div>
                        
                        <div class="voice-panel-body">
                            <div class="voice-input-section">
                                <label for="voice-text-input">输入语音内容（文字）：</label>
                                <textarea id="voice-text-input" 
                                         placeholder="请输入要发送的语音内容，例如：你们在干嘛" 
                                         rows="3" 
                                         maxlength="200"></textarea>
                                <div class="voice-char-count">
                                    <span id="voice-char-counter">0</span>/200 字符
                                </div>
                            </div>
                        </div>
                        
                        <div class="voice-panel-footer">
                            <button class="voice-cancel-btn" onclick="QQVoice.hideVoicePanel()">取消</button>
                            <button class="voice-send-btn" onclick="QQVoice.sendVoiceMessage()">发送语音</button>
                        </div>
                    </div>
                </div>
            `;
            
            // 添加到页面
            document.body.insertAdjacentHTML('beforeend', voicePanelHTML);
            
            // 绑定事件
            this.bindVoicePanelEvents();
            
            // 聚焦到输入框
            setTimeout(() => {
                const textInput = document.getElementById('voice-text-input');
                if (textInput) {
                    textInput.focus();
                }
            }, 100);
        },
        
        // 隐藏语音面板
        hideVoicePanel: function() {
            const panel = document.getElementById('qq-voice-panel');
            if (panel) {
                panel.remove();
            }
        },
        
        // 绑定语音面板事件
        bindVoicePanelEvents: function() {
            const textInput = document.getElementById('voice-text-input');
            const charCounter = document.getElementById('voice-char-counter');
            
            if (textInput && charCounter) {
                // 输入事件 - 更新字符计数
                textInput.addEventListener('input', () => {
                    const text = textInput.value;
                    const length = text.length;
                    
                    // 更新字符计数
                    charCounter.textContent = length;
                });
                
                // 回车发送
                textInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendVoiceMessage();
                    }
                });
            }
            
            // 点击外部关闭
            const panel = document.getElementById('qq-voice-panel');
            if (panel) {
                panel.addEventListener('click', (e) => {
                    if (e.target === panel) {
                        this.hideVoicePanel();
                    }
                });
            }
        },
        
        // 发送语音消息
        sendVoiceMessage: function() {
            const textInput = document.getElementById('voice-text-input');
            if (!textInput) {
                console.error('找不到语音输入框');
                return;
            }
            
            const voiceText = textInput.value.trim();
            if (!voiceText) {
                alert('请输入语音内容');
                return;
            }
            
            console.log('🎤 准备插入语音消息到输入框:', voiceText);
            
            // 获取当前聊天目标
            const targetInfo = this.getCurrentChatTarget();
            if (!targetInfo) {
                alert('请先选择聊天对象');
                return;
            }
            
            // 🌟 新功能：将语音消息插入到输入框而不是直接发送
            this.insertVoiceToInput(voiceText, targetInfo);
            
            // 显示插入成功提示
            this.showVoiceInsertToast(voiceText, targetInfo);
            
            // 关闭语音面板
            this.hideVoicePanel();
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
                            type: 'group'
                        };
                    }
                }
                
                // 回退到旧版选择器
                const selectedQQ = document.querySelector('.custom-qqhao.sel');
                const selectedGroup = document.querySelector('.custom-qq-qun.sel');
                
                if (selectedQQ) {
                    const classes = selectedQQ.className.split(' ');
                    for (let cls of classes) {
                        if (cls.startsWith('custom-qqhao-')) {
                            const qqNumber = cls.replace('custom-qqhao-', '');
                            return {
                                isGroup: false,
                                target: qqNumber,
                                type: 'contact'
                            };
                        }
                    }
                } else if (selectedGroup) {
                    const classes = selectedGroup.className.split(' ');
                    for (let cls of classes) {
                        if (cls.startsWith('custom-qq-qun-')) {
                            const groupId = cls.replace('custom-qq-qun-', '');
                            return {
                                isGroup: true,
                                target: groupId,
                                type: 'group'
                            };
                        }
                    }
                }
                
                return null;
            } catch (error) {
                console.error('获取聊天目标失败:', error);
                return null;
            }
        },
        
        // 🌟 新增：将语音消息插入到输入框
        insertVoiceToInput: function(voiceText, targetInfo) {
            // 查找当前显示的聊天页面中的输入框
            const activeInput = document.querySelector('.chat-page.show .message-input');
            
            if (activeInput && (activeInput instanceof HTMLInputElement || activeInput instanceof HTMLTextAreaElement)) {
                // 🌟 只插入语音内容，让 buildAndSendQQMessage 处理完整格式
                const voiceContent = `语音：${voiceText}`;
                
                const currentValue = activeInput.value || '';
                // 如果输入框已有内容，添加换行分隔
                const separator = currentValue ? '\n' : '';
                const newValue = currentValue + separator + voiceContent;
                activeInput.value = newValue;
                
                // 聚焦到输入框
                activeInput.focus();
                
                console.log('语音内容已插入到输入框:', voiceContent);
                
            } else {
                console.warn('未找到活动的输入框');
                alert(`无法插入语音消息，请先打开一个聊天窗口`);
            }
        },

        // 🌟 新增：显示语音插入成功提示
        showVoiceInsertToast: function(voiceText, targetInfo) {
            const messageType = targetInfo.isGroup ? '群聊' : '私聊';
            const targetName = targetInfo.contactName || targetInfo.target;
            
            const toast = document.createElement('div');
            toast.className = 'qq-voice-insert-toast';
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(40, 167, 69, 0.95);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 100001;
                font-size: 14px;
                pointer-events: none;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                backdrop-filter: blur(10px);
                animation: slideInDown 0.3s ease-out;
            `;
            toast.innerHTML = `
                <div class="toast-content">
                    <div class="toast-title" style="font-weight: bold; margin-bottom: 4px;">🎤 语音消息已添加到输入框</div>
                    <div class="toast-details" style="font-size: 12px; opacity: 0.9;">
                        ${messageType}: ${targetName}<br>
                        内容: ${voiceText.length > 15 ? voiceText.substring(0, 15) + '...' : voiceText}
                    </div>
                </div>
            `;
            
            document.body.appendChild(toast);
            
            // 自动消失
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.style.opacity = '0';
                    setTimeout(() => {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 300);
                }
            }, 2500);
        },

        // 显示语音发送成功提示
        showVoiceSuccessToast: function(voiceText, targetInfo) {
            const messageType = targetInfo.isGroup ? '群聊' : '私聊';
            const targetName = targetInfo.contactName || targetInfo.target;
            
            const toast = document.createElement('div');
            toast.className = 'qq-voice-success-toast';
            toast.innerHTML = `
                <div class="toast-content">
                    <div class="toast-title">语音消息已发送</div>
                    <div class="toast-details">
                        ${messageType}: ${targetName}<br>
                        内容: ${voiceText.length > 15 ? voiceText.substring(0, 15) + '...' : voiceText}
                    </div>
                </div>
            `;
            
            document.body.appendChild(toast);
            
            // 自动消失
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.style.opacity = '0';
                    setTimeout(() => {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 300);
                }
            }, 2500);
        },
        
        // 初始化语音消息监听器
        initVoiceMessageListener: function() {
            console.log('🔍 初始化语音消息监听器（仅限QQ插件容器）');
            
            // 监听DOM变化，但只处理QQ插件内的消息
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 转换为HTMLElement以访问classList
                            if (node instanceof HTMLElement || node instanceof Element) {
                                const isQQContainer = node.classList && (
                                    node.classList.contains('custom-qq-cont') ||
                                    node.classList.contains('custom-qun-cont') ||
                                    node.classList.contains('qq-contact-wrapper') ||
                                    node.classList.contains('qq-group-wrapper') ||
                                    node.classList.contains('custom-message') ||
                                    node.classList.contains('custom-qun-cont-item')
                                );
                                
                                if (isQQContainer) {
                                    this.processVoiceMessages(node);
                                }
                                
                                // 检查子元素，但只在QQ插件容器内
                                const messageElements = node.querySelectorAll && node.querySelectorAll(
                                    '.custom-qq-cont .custom-message, .custom-qun-cont .custom-qun-cont-item, .qq-contact-wrapper .custom-message, .qq-group-wrapper .custom-message'
                                );
                                if (messageElements) {
                                    messageElements.forEach(el => this.processVoiceMessages(el));
                                }
                                
                                // 🌟 如果是摘要相关的容器，处理语音消息替换
                                const isSummaryContainer = node.classList && (
                                    node.classList.contains('group-summary') ||
                                    node.classList.contains('contact-summary') ||
                                    node.classList.contains('last-message')
                                );
                                
                                if (isSummaryContainer) {
                                    // 延迟处理，确保DOM完全更新
                                    setTimeout(() => {
                                        this.replaceSummaryVoiceMessages();
                                    }, 100);
                                }
                            }
                        }
                    });
                });
            });
            
            // 开始观察，但只观察QQ插件的对话框
            const qqDialog = document.getElementById('chat_history_dialog');
            if (qqDialog) {
                observer.observe(qqDialog, {
                    childList: true,
                    subtree: true
                });
                console.log('✅ 开始监听QQ插件对话框内的变化');
            } else {
                // 如果QQ对话框还没加载，监听整个body但用更严格的过滤
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
                console.log('✅ 开始监听document.body变化（仅处理QQ插件容器）');
            }
            
            // 处理现有消息 - 只处理QQ插件内的消息
            setTimeout(() => {
                this.processExistingVoiceMessages();
            }, 1000);
        },
        
        // 处理现有的语音消息 - 只在QQ插件容器内
        processExistingVoiceMessages: function() {
            console.log('🔍 处理现有语音消息（仅限QQ插件容器）');
            
            // 只查找QQ插件内的消息元素，排除摘要区域
            const messageElements = document.querySelectorAll(`
                #chat_history_dialog .custom-message:not(.group-summary .custom-message):not(.contact-summary .custom-message),
                #chat_history_dialog .custom-qun-cont-item,
                .qq-contact-wrapper .chat-page .custom-message,
                .qq-group-wrapper .chat-page .custom-message,
                .custom-qq-cont .custom-message,
                .custom-qun-cont .custom-qun-cont-item
            `);
            
            console.log(`🔍 找到${messageElements.length}个QQ插件内的消息元素（已排除摘要区域）`);
            
            messageElements.forEach(element => {
                this.processVoiceMessages(element);
            });
            
            // 🌟 处理摘要区域的语音消息，替换为"语音消息"文本
            this.replaceSummaryVoiceMessages();
        },
        
        // 🌟 新增：替换摘要区域的语音消息为"语音消息"文本
        replaceSummaryVoiceMessages: function() {
            console.log('🔄 开始替换摘要区域的语音消息');
            
            // 查找所有摘要区域内的语音消息
            const summaryVoiceMessages = document.querySelectorAll(`
                .group-summary .qq-voice-message,
                .contact-summary .qq-voice-message,
                .last-message .qq-voice-message
            `);
            
            console.log(`🔍 找到${summaryVoiceMessages.length}个摘要区域内的语音消息`);
            
            summaryVoiceMessages.forEach(voiceElement => {
                // 替换为"语音消息"文本
                const textSpan = document.createElement('span');
                textSpan.textContent = '语音消息';
                textSpan.style.cssText = 'color: #666; font-size: 14px;';
                
                // 替换原始语音元素
                if (voiceElement.parentNode) {
                    voiceElement.parentNode.replaceChild(textSpan, voiceElement);
                    console.log('✅ 已替换一个语音消息为文本');
                }
            });
            
            // 🌟 也处理包含"语音："文本但还没被转换的摘要内容
            const summaryElements = document.querySelectorAll(`
                .group-summary .last-message,
                .contact-summary .last-message
            `);
            
            summaryElements.forEach(element => {
                if (element.textContent && element.textContent.includes('语音：')) {
                    // 将"语音：内容"替换为"语音消息"
                    const newText = element.textContent.replace(/语音：[^，。！？]*/, '语音消息');
                    element.textContent = newText;
                    console.log('✅ 已替换摘要文本中的语音内容');
                }
            });
        },
        
        // 处理语音消息
        processVoiceMessages: function(element) {
            if (!element || !element.textContent) return;
            
            // 🚫 排除摘要区域的 last-message，只显示纯文本
            if (element.closest && (
                element.closest('.group-summary') ||
                element.closest('.contact-summary') ||
                element.closest('.last-message')
            )) {
                console.log('🚫 跳过摘要区域的语音消息处理');
                return;
            }
            
            const text = element.textContent;
            
            // 检查是否包含语音消息
            if (text.includes('语音：')) {
                console.log('🎤 发现语音消息:', text);
                this.convertTextToVoiceMessage(element);
            }
        },
        
        // 将文本转换为语音消息显示
        convertTextToVoiceMessage: function(element) {
            let html = element.innerHTML;
            
            // 使用正则表达式找到语音消息并替换
            const voiceRegex = /语音：([^|<\n]+)/g;
            
            html = html.replace(voiceRegex, (match, voiceContent) => {
                // 模拟语音时长（1秒约等于3个汉字）
                const duration = Math.max(1, Math.ceil(voiceContent.length / 3));
                
                // 🌟 更新：生成符合custom-message结构的语音消息
                // 检查当前消息是否为发送的消息（通过父元素类名判断）
                const parentElement = element.closest('.custom-message, .mes, .message');
                const isSentMessage = parentElement && (
                    parentElement.classList.contains('custom-sent') ||
                    parentElement.classList.contains('is_user') ||
                    element.closest('[is_user="true"]')
                );
                
                // 生成唯一ID用于标识这个语音消息
                const voiceId = 'voice_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                
                // 🌟 新增：创建带有圆形"转"字的语音消息
                return `
                    <div class="qq-voice-message qq-custom-message ${isSentMessage ? 'custom-sent' : 'custom-received'}" 
                         data-voice-content="${voiceContent}" 
                         data-voice-id="${voiceId}">
                        <div class="voice-content">
                        <div class="voice-text" id="voice-text-${voiceId}" data-original-content="${voiceContent}" onclick="QQVoice.toggleVoiceText('${voiceId}', event)">转</div>
                            <div class="voice-duration">${duration}"</div>
                            <div class="voice-waveform">
                                <span></span><span></span><span></span><span></span><span></span>
                            </div>
                            
                        </div>
                        <div class="voice-content-text" id="voice-content-text-${voiceId}" style="display: none;"></div>
                    </div>
                `;
            });
            
            element.innerHTML = html;
        },
        
        // 🌟 更新：切换语音文本显示状态，支持流式传输
        toggleVoiceText: function(voiceId, event) {
            console.log('🔄 切换语音文本显示:', voiceId);
            
            // 阻止事件冒泡，防止触发父元素的点击事件
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            const voiceTextElement = document.getElementById(`voice-text-${voiceId}`);
            const voiceContentTextElement = document.getElementById(`voice-content-text-${voiceId}`);
            
            if (!voiceTextElement || !voiceContentTextElement) {
                console.warn('未找到语音文本元素:', voiceId);
                return;
            }
            
            const originalContent = voiceTextElement.getAttribute('data-original-content');
            const isExpanded = voiceContentTextElement.style.display !== 'none';
            
            if (isExpanded) {
                // 如果已展开，则收起
                voiceContentTextElement.style.display = 'none';
                voiceContentTextElement.textContent = '';
                console.log('🔄 语音内容已收起');
            } else {
                // 如果是收起状态，则展开并开始流式显示
                voiceContentTextElement.style.display = 'block';
                this.streamText(voiceContentTextElement, originalContent);
                console.log('🔄 开始流式显示语音内容:', originalContent);
            }
        },
        
        // 🌟 新增：流式文本显示方法
        streamText: function(element, text, speed = 100) {
            element.textContent = '';
            let index = 0;
            
            const typeChar = () => {
                if (index < text.length) {
                    element.textContent += text.charAt(index);
                    index++;
                    setTimeout(typeChar, speed);
                } else {
                    console.log('🎯 流式显示完成');
                }
            };
            
            typeChar();
        },
        
        // 播放语音消息（模拟）
        playVoiceMessage: function(voiceContent) {
            console.log('🔊 播放语音消息:', voiceContent);
            
            // 显示播放提示
            const toast = document.createElement('div');
            toast.className = 'qq-voice-play-toast';
            toast.innerHTML = `
                <div class="play-text">正在播放语音: ${voiceContent}</div>
            `;
            
            document.body.appendChild(toast);
            
            // 模拟播放时长
            const duration = Math.max(1, Math.ceil(voiceContent.length / 3)) * 1000;
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.style.opacity = '0';
                    setTimeout(() => {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 300);
                }
            }, duration);
        },
        
        // 注入语音相关样式
        injectVoiceStyles: function() {
            // 检查是否已经注入过样式
            if (document.getElementById('qq-voice-styles')) {
                return;
            }
            
            const style = document.createElement('style');
            style.id = 'qq-voice-styles';
            style.textContent = `
                /* QQ语音面板样式 */
                .qq-voice-panel {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 100000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .voice-panel-content {
                    background: white;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 450px;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }
                
                .voice-panel-header {
                    background: #007bff;
                    color: white;
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .voice-panel-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                }
                
                .voice-close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                }
                
                .voice-close-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .voice-panel-body {
                    padding: 20px;
                }
                
                .voice-input-section {
                    margin-bottom: 20px;
                }
                
                .voice-input-section label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #333;
                }
                
                #voice-text-input {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 14px;
                    resize: vertical;
                    min-height: 80px;
                    box-sizing: border-box;
                    transition: border-color 0.2s;
                }
                
                #voice-text-input:focus {
                    outline: none;
                    border-color: #007bff;
                }
                
                .voice-char-count {
                    text-align: right;
                    font-size: 12px;
                    color: #666;
                    margin-top: 5px;
                }
                
                .voice-panel-footer {
                    padding: 15px 20px;
                    background: #f8f9fa;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                
                .voice-cancel-btn,
                .voice-send-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .voice-cancel-btn {
                    background: #6c757d;
                    color: white;
                }
                
                .voice-cancel-btn:hover {
                    background: #5a6268;
                }
                
                .voice-send-btn {
                    background: #007bff;
                    color: white;
                }
                
                .voice-send-btn:hover {
                    background: #0056b3;
                }
                
                /* 聊天中的语音消息样式 - 只在QQ插件容器内生效 */
                #chat_history_dialog .qq-voice-message,
                .qq-contact-wrapper .qq-voice-message,
                .qq-group-wrapper .qq-voice-message,
                .custom-qq-cont .qq-voice-message,
                .custom-qun-cont .qq-voice-message {
                    display: flex;
                    align-items: center;
                    color: #333;
                    padding: 10px 15px;
                    border-radius: 18px;
                    max-width: 280px;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin: 5px 0;
                    border:none;box-shadow: none;
                }
                .custom-received .voice-waveform span{background:rgba(0,0,0,0.2)}
                #chat_history_dialog .qq-voice-message:hover,
                .qq-contact-wrapper .qq-voice-message:hover,
                .qq-group-wrapper .qq-voice-message:hover,
                .custom-qq-cont .qq-voice-message:hover,
                .custom-qun-cont .qq-voice-message:hover {
                    background: #0056b3;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
                }
                
                #chat_history_dialog .qq-voice-message .voice-content,
                .qq-contact-wrapper .qq-voice-message .voice-content,
                .qq-group-wrapper .qq-voice-message .voice-content,
                .custom-qq-cont .qq-voice-message .voice-content,
                .custom-qun-cont .qq-voice-message .voice-content {
                    flex: 1;
                    min-width: 0;
                }
                
                #chat_history_dialog .qq-voice-message .voice-text,
                .qq-contact-wrapper .qq-voice-message .voice-text,
                .qq-group-wrapper .qq-voice-message .voice-text,
                .custom-qq-cont .qq-voice-message .voice-text,
                .custom-qun-cont .qq-voice-message .voice-text {
                    font-size: 13px;
                    margin-bottom: 2px;
                    word-break: break-word;
                    text-align: center;
                }
                
                #chat_history_dialog .qq-voice-message .voice-duration,
                .qq-contact-wrapper .qq-voice-message .voice-duration,
                .qq-group-wrapper .qq-voice-message .voice-duration,
                .custom-qq-cont .qq-voice-message .voice-duration,
                .custom-qun-cont .qq-voice-message .voice-duration {
                    font-size: 11px;
                    opacity: 0.8;
                }
                
                #chat_history_dialog .qq-voice-message .voice-waveform,
                .qq-contact-wrapper .qq-voice-message .voice-waveform,
                .qq-group-wrapper .qq-voice-message .voice-waveform,
                .custom-qq-cont .qq-voice-message .voice-waveform,
                .custom-qun-cont .qq-voice-message .voice-waveform {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    flex-shrink: 0;
                }
                
                #chat_history_dialog .qq-voice-message .voice-waveform span,
                .qq-contact-wrapper .qq-voice-message .voice-waveform span,
                .qq-group-wrapper .qq-voice-message .voice-waveform span,
                .custom-qq-cont .qq-voice-message .voice-waveform span,
                .custom-qun-cont .qq-voice-message .voice-waveform span {
                    width: 2px;
                    height: 12px;
                    background: rgba(255, 255, 255, 0.6);
                    border-radius: 1px;
                    animation: voice-wave 1.5s ease-in-out infinite;
                }
                
                #chat_history_dialog .qq-voice-message .voice-waveform span:nth-child(2),
                .qq-contact-wrapper .qq-voice-message .voice-waveform span:nth-child(2),
                .qq-group-wrapper .qq-voice-message .voice-waveform span:nth-child(2),
                .custom-qq-cont .qq-voice-message .voice-waveform span:nth-child(2),
                .custom-qun-cont .qq-voice-message .voice-waveform span:nth-child(2) {
                    animation-delay: 0.1s;
                }
                
                #chat_history_dialog .qq-voice-message .voice-waveform span:nth-child(3),
                .qq-contact-wrapper .qq-voice-message .voice-waveform span:nth-child(3),
                .qq-group-wrapper .qq-voice-message .voice-waveform span:nth-child(3),
                .custom-qq-cont .qq-voice-message .voice-waveform span:nth-child(3),
                .custom-qun-cont .qq-voice-message .voice-waveform span:nth-child(3) {
                    animation-delay: 0.2s;
                }
                
                #chat_history_dialog .qq-voice-message .voice-waveform span:nth-child(4),
                .qq-contact-wrapper .qq-voice-message .voice-waveform span:nth-child(4),
                .qq-group-wrapper .qq-voice-message .voice-waveform span:nth-child(4),
                .custom-qq-cont .qq-voice-message .voice-waveform span:nth-child(4),
                .custom-qun-cont .qq-voice-message .voice-waveform span:nth-child(4) {
                    animation-delay: 0.3s;
                }
                
                #chat_history_dialog .qq-voice-message .voice-waveform span:nth-child(5),
                .qq-contact-wrapper .qq-voice-message .voice-waveform span:nth-child(5),
                .qq-group-wrapper .qq-voice-message .voice-waveform span:nth-child(5),
                .custom-qq-cont .qq-voice-message .voice-waveform span:nth-child(5),
                .custom-qun-cont .qq-voice-message .voice-waveform span:nth-child(5) {
                    animation-delay: 0.4s;
                }
                
                @keyframes voice-wave {
                    0%, 40%, 100% {
                        transform: scaleY(0.4);
                        opacity: 0.6;
                    }
                    20% {
                        transform: scaleY(1);
                        opacity: 1;
                    }
                }
                
                /* 成功提示样式 */
                .qq-voice-success-toast {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #28a745;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    z-index: 100001;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    transition: opacity 0.3s ease;
                }
                
                .qq-voice-success-toast .toast-content {
                    flex: 1;
                }
                
                .qq-voice-success-toast .toast-title {
                    font-weight: bold;
                    margin-bottom: 3px;
                    font-size: 14px;
                }
                
                .qq-voice-success-toast .toast-details {
                    font-size: 12px;
                    opacity: 0.9;
                    line-height: 1.3;
                }
                
                /* 播放提示样式 */
                .qq-voice-play-toast {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #17a2b8;
                    color: white;
                    padding: 12px 18px;
                    border-radius: 6px;
                    z-index: 100001;
                    font-size: 14px;
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
                    transition: opacity 0.3s ease;
                }
                
                .qq-voice-play-toast .play-text {
                    font-size: 14px;
                }
                
                /* 响应式设计 */
                @media (max-width: 480px) {
                    .voice-panel-content {
                        width: 95%;
                        margin: 10px;
                    }
                    
                    .voice-panel-body {
                        padding: 15px;
                    }
                    
                    .qq-voice-message {
                        max-width: 240px;
                        padding: 8px 12px;
                    }
                    
                    .voice-message-preview {
                        max-width: 200px;
                        padding: 10px 12px;
                    }
                }
            `;
            
            document.head.appendChild(style);
            console.log('✅ QQ语音样式已注入');
        },
        
        // 测试语音功能
        test: function() {
            console.log('🧪 测试QQ语音功能');
            this.showVoicePanel();
        }
    };
    
    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            QQVoice.init();
        });
    } else {
        setTimeout(() => {
            QQVoice.init();
        }, 100);
    }
    
    // 导出到全局
    return QQVoice;
    
})();

// 将playVoiceMessage暴露到全局，供onclick调用
window.playVoiceMessage = (voiceContent) => {
    if (window.QQVoice) {
        window.QQVoice.playVoiceMessage(voiceContent);
    }
}; 