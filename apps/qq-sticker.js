/**
 * QQ表情包功能模块
 * 基于qq-photo.js的实现，提供表情包的预览和发送功能
 */

(function(window) {
    'use strict';
    
    const QQSticker = {
        // 表情包配置
        settings: {
            // 支持多个表情包路径
            basePaths: [
                '/scripts/extensions/third-party/mobile-ui-test/images/',
                '/SillyTavern/data/default-user/extensions/mobile-ui-test/images/'
            ],
            currentPathIndex: 0, // 当前使用的路径索引
            allowedTypes: [
                'image/jpeg', 
                'image/jpg', 
                'image/png', 
                'image/gif', 
                'image/webp'
            ]
        },
        
        // 表情包列表（基于images文件夹中的图片）
        stickerList: [
            { name: '6eyt6n.jpg', label: '表情1' },
            { name: 'ivtswg.jpg', label: '表情2' },
            { name: 'kv2ubl.gif', label: '表情3' },
            { name: 'z2sxmv.jpg', label: '表情4' },
            { name: 'aotnxp.jpg', label: '表情5' },
            { name: 'emzckz.jpg', label: '表情6' },
            { name: 'kin0oj.jpg', label: '表情7' },
            { name: 'y7px4h.jpg', label: '表情8' },
            { name: 'zjlr8e.jpg', label: '表情9' },
            { name: 'xigzwa.jpg', label: '表情10' },
            { name: '8kvr4u.jpg', label: '表情11' },
            { name: 'lgply8.jpg', label: '表情12' },
            { name: 'au4ay5.jpg', label: '表情13' },
            { name: 'qasebg.jpg', label: '表情14' },
            { name: 'l9nqv0.jpg', label: '表情15' },
            { name: 'hoghwb.jpg', label: '表情16' },
            { name: 's10h5m.jpg', label: '表情17' }
        ],
        
        // 当前选中的表情包
        selectedSticker: null,
        
        // 获取当前基础路径
        getCurrentBaseUrl: function() {
            return this.settings.basePaths[this.settings.currentPathIndex];
        },
        
        // 切换表情包路径
        switchPath: function(pathIndex) {
            if (pathIndex >= 0 && pathIndex < this.settings.basePaths.length) {
                this.settings.currentPathIndex = pathIndex;
                console.log('🔄 切换表情包路径到:', this.getCurrentBaseUrl());
                return true;
            }
            return false;
        },
        
        // 检测路径是否可用（通过尝试加载第一个表情包）
        checkPathAvailability: async function(pathIndex) {
            if (pathIndex >= 0 && pathIndex < this.settings.basePaths.length) {
                const testPath = this.settings.basePaths[pathIndex] + this.stickerList[0].name;
                try {
                    const response = await fetch(testPath, { method: 'HEAD' });
                    return response.ok;
                } catch (error) {
                    return false;
                }
            }
            return false;
        },
        
        // 自动检测并设置可用路径
        autoDetectPath: async function() {
            for (let i = 0; i < this.settings.basePaths.length; i++) {
                if (await this.checkPathAvailability(i)) {
                    this.switchPath(i);
                    console.log('✅ 自动检测到可用路径:', this.getCurrentBaseUrl());
                    return true;
                }
            }
            console.warn('⚠️ 未找到可用的表情包路径');
            return false;
        },
        
        // 初始化表情包功能
        init: async function() {
            console.log('🎭 初始化QQ表情包功能...');
            
            // 自动检测可用路径
            await this.autoDetectPath();
            
            console.log('✅ QQ表情包功能初始化完成');
        },
        
        // 显示表情包面板
        showStickerPanel: function() {
            console.log('🎭 显示表情包面板');
            
            // 移除现有面板
            this.hideStickerPanel();
            
            // 创建面板HTML
            const panelHTML = `
                <div class="qq-sticker-panel" id="qq-sticker-panel">
                    <div class="qq-sticker-header">
                        <div class="qq-sticker-title">🎭 选择表情包</div>
                        <div class="qq-sticker-path-info">
                            <span style="font-size: 12px; opacity: 0.8;">路径: ${this.settings.currentPathIndex + 1}/${this.settings.basePaths.length}</span>
                            <button class="qq-sticker-switch-path" id="qq-sticker-switch-path" title="切换表情包路径">🔄</button>
                        </div>
                        <button class="qq-sticker-close" id="qq-sticker-close">×</button>
                    </div>
                    
                    <div class="qq-sticker-grid" id="qq-sticker-grid">
                        ${this.generateStickerGridHTML()}
                    </div>
                    
                    <div class="qq-sticker-actions">
                        <button class="qq-sticker-btn qq-sticker-preview-btn" id="qq-sticker-preview-btn" disabled>
                            🔍 预览
                        </button>
                        <button class="qq-sticker-btn qq-sticker-send-btn" id="qq-sticker-send-btn" disabled>
                            📤 发送
                        </button>
                    </div>
                </div>
            `;
            
            // 添加到页面
            document.body.insertAdjacentHTML('beforeend', panelHTML);
            
            // 显示面板
            setTimeout(() => {
                const panel = document.getElementById('qq-sticker-panel');
                if (panel) {
                    panel.classList.add('show');
                }
            }, 10);
            
            // 绑定事件
            this.bindStickerPanelEvents();
        },
        
        // 生成表情包网格HTML
        generateStickerGridHTML: function() {
            return this.stickerList.map(sticker => {
                const imageUrl = this.getCurrentBaseUrl() + sticker.name;
                return `
                    <div class="qq-sticker-item" data-sticker="${sticker.name}" data-label="${sticker.label}">
                        <img src="${imageUrl}" alt="${sticker.label}" loading="lazy" 
                             onerror="this.parentElement.style.display='none';">
                        <div class="qq-sticker-label">${sticker.label}</div>
                    </div>
                `;
            }).join('');
        },
        
        // 绑定表情包面板事件
        bindStickerPanelEvents: function() {
            const panel = document.getElementById('qq-sticker-panel');
            if (!panel) return;
            
            // 关闭按钮
            const closeBtn = document.getElementById('qq-sticker-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideStickerPanel();
                });
            }
            
            // 路径切换按钮
            const switchPathBtn = document.getElementById('qq-sticker-switch-path');
            if (switchPathBtn) {
                switchPathBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await this.switchToNextPath();
                });
            }
            
            // 表情包项点击
            const stickerItems = panel.querySelectorAll('.qq-sticker-item');
            stickerItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    // 🌟 阻止事件冒泡，防止触发点击外部关闭
                    e.stopPropagation();
                    if (item instanceof HTMLElement) {
                        this.selectSticker(item);
                    }
                });
            });
            
            // 预览按钮
            const previewBtn = document.getElementById('qq-sticker-preview-btn');
            if (previewBtn) {
                previewBtn.addEventListener('click', (e) => {
                    // 🌟 阻止事件冒泡
                    e.stopPropagation();
                    this.previewSelectedSticker();
                });
            }
            
            // 发送按钮
            const sendBtn = document.getElementById('qq-sticker-send-btn');
            if (sendBtn) {
                sendBtn.addEventListener('click', (e) => {
                    // 🌟 阻止事件冒泡
                    e.stopPropagation();
                    this.sendSelectedSticker();
                });
            }
            
            // 🌟 优化点击外部关闭逻辑，使用延迟绑定避免立即触发
            setTimeout(() => {
                const handleOutsideClick = (e) => {
                    const currentPanel = document.getElementById('qq-sticker-panel');
                    if (!currentPanel) {
                        // 如果面板不存在了，移除监听器
                        document.removeEventListener('click', handleOutsideClick);
                        return;
                    }
                    
                    if (e.target instanceof Node && 
                        !currentPanel.contains(e.target) && 
                        !((e.target instanceof Element) && e.target.closest('.function-menu-btn')) &&
                        !((e.target instanceof Element) && e.target.closest('.menu-item[data-function="sticker"]'))) {
                        this.hideStickerPanel();
                        // 移除监听器
                        document.removeEventListener('click', handleOutsideClick);
                    }
                };
                
                document.addEventListener('click', handleOutsideClick);
            }, 100);
        },
        
        // 选择表情包
        selectSticker: function(item) {
            console.log('🎯 选择表情包:', item.dataset.sticker);
            
            // 移除之前的选中状态
            const allItems = document.querySelectorAll('.qq-sticker-item');
            allItems.forEach(i => i.classList.remove('selected'));
            
            // 添加选中状态
            item.classList.add('selected');
            
            // 保存选中的表情包
            this.selectedSticker = {
                name: item.dataset.sticker,
                label: item.dataset.label,
                url: this.getCurrentBaseUrl() + item.dataset.sticker
            };
            
            // 启用按钮
            const previewBtn = document.getElementById('qq-sticker-preview-btn');
            const sendBtn = document.getElementById('qq-sticker-send-btn');
            
            if (previewBtn && 'disabled' in previewBtn) {
                previewBtn.disabled = false;
            }
            if (sendBtn && 'disabled' in sendBtn) {
                sendBtn.disabled = false;
            }
            
            console.log('✅ 表情包已选中:', this.selectedSticker);
        },
        
        // 预览选中的表情包（使用qq-photo的预览方式）
        previewSelectedSticker: function() {
            if (!this.selectedSticker) {
                console.warn('⚠️ 没有选中的表情包');
                return;
            }
            
            console.log('🔍 预览表情包:', this.selectedSticker);
            
            // 使用与qq-photo相同的预览方式
            this.showImagePreview(this.selectedSticker.url, {
                fullName: this.selectedSticker.label,
                target: 'preview'
            });
        },
        
        // 显示图片预览（参考qq-photo.js的实现）
        showImagePreview: function(imagePath, target) {
            const previewHTML = `
                <div class="image-large-preview" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.9);
                    z-index: 100000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                ">
                    <button class="close-preview-btn" style="
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        font-size: 20px;
                        cursor: pointer;
                        line-height: 1;
                    ">×</button>
                    <img src="${imagePath}" alt="预览图片" style="
                        max-width: 90%;
                        max-height: 80%;
                        object-fit: contain;
                        border-radius: 8px;
                    ">
                    <div class="image-large-info" style="
                        color: white;
                        text-align: center;
                        margin-top: 20px;
                        padding: 10px;
                    ">
                        <div style="font-size: 16px; margin-bottom: 5px;">表情包: ${target.fullName || target.target}</div>
                        <div style="font-size: 14px; opacity: 0.8;">点击外部区域或×按钮关闭</div>
                    </div>
                </div>
            `;
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = previewHTML;
            const previewElement = tempDiv.firstElementChild;
            document.body.appendChild(previewElement);
            
            // 关闭按钮事件
            const closeBtn = previewElement.querySelector('.close-preview-btn');
            const closePreview = () => {
                if (previewElement.parentNode) {
                    previewElement.parentNode.removeChild(previewElement);
                }
            };
            
            closeBtn.addEventListener('click', closePreview);
            previewElement.addEventListener('click', (e) => {
                if (e.target === previewElement) {
                    closePreview();
                }
            });
        },
        
        // 关闭预览
        closePreview: function() {
            const preview = document.querySelector('.image-large-preview');
            if (preview) {
                preview.remove();
                console.log('🚪 表情包预览窗口已关闭');
            }
        },
        
        // 发送选中的表情包
        sendSelectedSticker: function() {
            if (!this.selectedSticker) {
                console.warn('⚠️ 没有选中的表情包');
                alert('请先选择一个表情包');
                return;
            }
            
            console.log('📤 发送表情包:', this.selectedSticker);
            
            // 获取当前聊天目标
            const targetInfo = this.getCurrentChatTarget();
            
            if (!targetInfo) {
                console.error('❌ 无法确定发送目标');
                alert('无法确定发送目标，请确保已选择聊天对象');
                return;
            }
            
            // 🌟 保存选中的表情包信息，避免在hideStickerPanel后丢失
            const stickerInfo = {
                name: this.selectedSticker.name,
                label: this.selectedSticker.label,
                url: this.selectedSticker.url
            };
            
            // 🌟 使用新的发送方式，直接插入到输入框而不是发送
            if (window['insertStickerToQQApp']) {
                // 构建文件路径
                const filepath = this.getCurrentBaseUrl() + stickerInfo.name;
                
                console.log('📝 插入表情包到QQ应用输入框:', stickerInfo.name, filepath);
                window['insertStickerToQQApp'](stickerInfo.name, filepath);
                
                // 显示成功提示
                this.showSendSuccessToast(stickerInfo);
                
                // 关闭面板
                this.hideStickerPanel();
            } else {
                console.warn('⚠️ QQ应用的表情包插入功能未可用，使用旧的发送方式');
                
                // 构建发送消息
                const message = `发送表情包：${stickerInfo.label}`;
                
                // 发送到SillyTavern
                this.sendStickerToChat(message, targetInfo, stickerInfo);
                
                // 显示发送成功提示（传入保存的信息）
                this.showSendSuccessToast(stickerInfo);
                
                // 关闭面板
                this.hideStickerPanel();
            }
        },
        
        // 获取当前聊天目标
        getCurrentChatTarget: function() {
            // 检查新版QQ应用界面
            const activeChatPage = document.querySelector('.chat-page.show');
            if (activeChatPage) {
                const contactWrapper = activeChatPage.closest('.qq-contact-wrapper');
                const groupWrapper = activeChatPage.closest('.qq-group-wrapper');
                
                if (contactWrapper && contactWrapper instanceof HTMLElement) {
                    return {
                        isGroup: false,
                        target: contactWrapper.dataset.qqNumber,
                        contactName: contactWrapper.dataset.contactName,
                        type: 'contact'
                    };
                } else if (groupWrapper && groupWrapper instanceof HTMLElement) {
                    return {
                        isGroup: true,
                        target: groupWrapper.dataset.groupId,
                        groupName: groupWrapper.querySelector('.group-name')?.textContent,
                        type: 'group'
                    };
                }
            }
            
            // 检查旧版界面选中状态
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
        },
        
        // 发送表情包到聊天
        sendStickerToChat: function(message, targetInfo, sticker) {
            let formattedMessage;
            
            if (targetInfo.isGroup) {
                // 群聊格式
                formattedMessage = `你生成的消息，使用规定格式。消息内容包含我方消息和对方消息，你必须生成我方消息随后生成对方消息，群里不会自动出现新成员。发送群聊到群${targetInfo.target}：${message}[表情包|${sticker.name}|${sticker.url}]`;
            } else {
                // 私聊格式
                const contactName = targetInfo.contactName || targetInfo.target;
                formattedMessage = `你生成的消息，使用规定格式。消息内容包含我方消息和对方消息，你必须生成我方消息随后生成对方消息。向${contactName}（${targetInfo.target}）发送消息，${message}[表情包|${sticker.name}|${sticker.url}]`;
            }
            
            console.log('📝 构建的消息格式:', formattedMessage);
            
            // 发送到SillyTavern
            this.sendToSillyTavern(formattedMessage);
        },
        
        // 发送消息到SillyTavern（参考qq-app的sendToChat方法）
        sendToSillyTavern: function(message) {
            try {
                console.log('📤 发送消息到SillyTavern:', message);
                
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
                if ((originalInput instanceof HTMLInputElement || originalInput instanceof HTMLTextAreaElement) && originalInput.disabled) {
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
                    originalInput.dispatchEvent(new Event('input', {bubbles: true}));
                    originalInput.dispatchEvent(new Event('change', {bubbles: true}));
                    
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
        sendToChatBackup: function(message) {
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
                    if (textarea instanceof HTMLTextAreaElement) {
                        textarea.value = message;
                        textarea.focus();
                        
                        // 模拟键盘事件
                        textarea.dispatchEvent(new Event('input', {bubbles: true}));
                        textarea.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
                    }
                }
                
            } catch (error) {
                console.error('备用发送方法也失败了:', error);
            }
        },
        
        // 显示发送成功提示
        showSendSuccessToast: function(stickerInfo) {
            // 🌟 如果没有传入参数，使用当前选中的表情包（向后兼容）
            const sticker = stickerInfo || this.selectedSticker;
            
            if (!sticker) {
                console.warn('⚠️ 没有表情包信息，无法显示成功提示');
                return;
            }
            
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #28a745;
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                z-index: 100002;
                font-size: 14px;
                text-align: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            toast.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px;">🎭 表情包已添加！</div>
                <div style="font-size: 12px; opacity: 0.9;">
                    ${sticker.label} 已添加到输入框，点击发送按钮发送
                </div>
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 2500);
        },
        
        // 隐藏表情包面板
        hideStickerPanel: function() {
            const panel = document.getElementById('qq-sticker-panel');
            if (panel) {
                panel.classList.remove('show');
                setTimeout(() => {
                    if (panel.parentNode) {
                        panel.parentNode.removeChild(panel);
                    }
                }, 300);
            }
            
            // 清除选中状态
            this.selectedSticker = null;
            
            // 关闭预览
            this.closePreview();
        },
        
        // 测试表情包功能
        test: function() {
            console.log('🧪 测试QQ表情包功能');
            this.showStickerPanel();
        }
    };
    
    // 导出到全局
    window['QQSticker'] = QQSticker;
    
    // 异步初始化
    QQSticker.init().then(() => {
        console.log('✅ QQSticker模块已加载并导出到window.QQSticker');
    }).catch(error => {
        console.error('❌ QQSticker初始化失败:', error);
        console.log('✅ QQSticker模块已加载并导出到window.QQSticker (初始化失败但模块可用)');
    });
    
})(window); 