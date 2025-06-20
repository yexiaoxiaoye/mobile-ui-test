// SillyTavern上下文智能监听器
// 使用事件驱动架构实现实时数据监听和处理
(function(window) {
    'use strict';
    
    const ContextWatcher = {
        // 监听器状态
        isActive: false,
        lastChatHash: null,
        lastMessageCount: 0,
        
        // 事件监听器
        chatObserver: null,
        messageObserver: null,
        
        // 缓存机制
        messageCache: new Map(),
        extractedDataCache: new Map(),
        
        // 回调函数注册表
        callbacks: {
            onNewMessage: [],
            onMessageUpdate: [],
            onChatChange: [],
            onDataExtracted: []
        },
        
        // 配置选项
        config: {
            enableRealTimeMonitoring: true,
            enableSmartCaching: true,
            enableAutoExtraction: true,
            debounceDelay: 300, // 防抖延迟（毫秒）
            maxCacheSize: 1000,
            watchPatterns: [
                'qq联系人',
                'qq消息',
                'qq表情包',
                '任务信息',
                '淘宝商品',
                '背包物品'
            ]
        },
        
        // 🌟 支持的应用列表（继承自旧的auto-refresh-manager）
        supportedApps: {
            'TaskApp': {
                name: '任务应用',
                method: 'loadTasks',
                icon: '🎯',
                enabled: true
            },
            'TaobaoApp': {
                name: '淘宝应用',
                method: 'loadProducts', 
                icon: '🛒',
                enabled: true
            },
            'QQApp': {
                name: 'QQ应用',
                method: 'refreshMessages',
                icon: '💬',
                enabled: true
            },
            'BackpackApp': {
                name: '背包应用',
                method: 'show',
                icon: '🎒',
                enabled: false
            },
            'ChoukaApp': {
                name: '抽卡应用',
                method: 'show',
                icon: '🎴',
                enabled: false
            }
        },
        
        // 初始化
        init: function() {
            console.log('🔥 启动智能上下文监听器...');
            
            if (!this.checkSillyTavernAPI()) {
                console.warn('⚠️ SillyTavern API未准备就绪，稍后重试...');
                setTimeout(() => this.init(), 2000);
                return;
            }
            
            this.setupEventListeners();
            this.setupMutationObserver();
            this.setupPerformanceMonitor();
            this.startMonitoring();
            
            console.log('✅ 智能上下文监听器初始化完成');
        },
        
        // 检查SillyTavern API可用性
        checkSillyTavernAPI: function() {
            return window.SillyTavern || 
                   window.sillyTavern || 
                   (window.eventSource && window.chat);
        },
        
        // 设置事件监听器
        setupEventListeners: function() {
            // 监听SillyTavern的内置事件
            if (window.eventSource) {
                window.eventSource.on('messageSent', (data) => {
                    this.handleNewMessage(data, 'sent');
                });
                
                window.eventSource.on('messageReceived', (data) => {
                    this.handleNewMessage(data, 'received');
                });
                
                window.eventSource.on('chatChanged', (data) => {
                    this.handleChatChange(data);
                });
                
                window.eventSource.on('characterChanged', (data) => {
                    this.handleCharacterChange(data);
                });
            }
            
            // 监听DOM变化事件
            document.addEventListener('chatUpdated', this.handleChatUpdate.bind(this));
            document.addEventListener('messageAdded', this.handleMessageAdded.bind(this));
            
            console.log('📡 事件监听器设置完成');
        },
        
        // 设置DOM突变观察器
        setupMutationObserver: function() {
            const chatContainer = document.querySelector('#chat') || 
                                document.querySelector('.chat-container') ||
                                document.querySelector('[data-chat-container]');
            
            if (!chatContainer) {
                console.warn('⚠️ 聊天容器未找到，使用document.body作为监听目标');
                this.observeTarget = document.body;
            } else {
                this.observeTarget = chatContainer;
            }
            
            this.chatObserver = new MutationObserver((mutations) => {
                this.handleMutations(mutations);
            });
            
            this.chatObserver.observe(this.observeTarget, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true,
                attributeFilter: ['data-message-id', 'data-character-id']
            });
            
            console.log('👁️ DOM突变观察器设置完成');
        },
        
        // 设置性能监控
        setupPerformanceMonitor: function() {
            // 监控内存使用
            setInterval(() => {
                if (this.messageCache.size > this.config.maxCacheSize) {
                    this.cleanupCache();
                }
            }, 30000); // 每30秒检查一次
            
            // 监控CPU使用率（简单版本）
            this.lastProcessTime = performance.now();
            
            console.log('📊 性能监控器设置完成');
        },
        
        // 开始监控
        startMonitoring: function() {
            if (this.isActive) {
                console.log('⚠️ 监控器已启动，跳过重复启动');
                return;
            }
            
            this.isActive = true;
            this.lastChatHash = this.getChatHash();
            this.lastMessageCount = this.getMessageCount();
            
            // 启动智能轮询作为备份机制
            this.startIntelligentPolling();
            
            console.log('🚀 智能监控已启动');
        },
        
        // 停止监控
        stopMonitoring: function() {
            if (!this.isActive) {
                return;
            }
            
            this.isActive = false;
            
            if (this.chatObserver) {
                this.chatObserver.disconnect();
            }
            
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
            }
            
            console.log('🛑 智能监控已停止');
        },
        
        // 智能轮询（低频率备份机制）
        startIntelligentPolling: function() {
            // 比传统方法更智能的轮询：仅在必要时执行
            this.pollingInterval = setInterval(() => {
                if (!this.isActive) return;
                
                const currentHash = this.getChatHash();
                const currentMessageCount = this.getMessageCount();
                
                // 只有在检测到变化时才处理
                if (currentHash !== this.lastChatHash || 
                    currentMessageCount !== this.lastMessageCount) {
                    
                    console.log('📨 智能轮询检测到变化，触发处理...');
                    this.handleContextChange();
                    
                    this.lastChatHash = currentHash;
                    this.lastMessageCount = currentMessageCount;
                }
            }, 10000); // 10秒轮询一次（比原来的5秒更节能）
        },
        
        // 处理DOM突变
        handleMutations: function(mutations) {
            let hasSignificantChange = false;
            
            mutations.forEach(mutation => {
                // 检查是否为聊天消息相关的变化
                if (this.isMessageRelatedMutation(mutation)) {
                    hasSignificantChange = true;
                }
            });
            
            if (hasSignificantChange) {
                // 使用防抖机制避免频繁触发
                this.debounceContextChange();
            }
        },
        
        // 检查是否为消息相关的突变
        isMessageRelatedMutation: function(mutation) {
            const target = mutation.target;
            
            // 检查元素类名或ID是否与消息相关
            const messageSelectors = [
                '.mes', '.message', '.chat-message',
                '[data-message-id]', '[data-character-id]',
                '#chat', '.chat-container'
            ];
            
            return messageSelectors.some(selector => {
                return target.matches && target.matches(selector) ||
                       target.querySelector && target.querySelector(selector) ||
                       target.closest && target.closest(selector);
            });
        },
        
        // 防抖处理上下文变化
        debounceContextChange: function() {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            
            this.debounceTimer = setTimeout(() => {
                this.handleContextChange();
            }, this.config.debounceDelay);
        },
        
        // 处理上下文变化
        handleContextChange: function() {
            if (!this.isActive) return;
            
            console.log('🔄 处理上下文变化...');
            
            // 提取并处理数据
            this.extractAndProcessData();
            
            // 触发注册的回调
            this.triggerCallbacks('onDataExtracted');
        },
        
        // 提取并处理数据
        extractAndProcessData: async function() {
            try {
                const startTime = performance.now();
                
                // 使用现有的数据提取器
                if (window.HQDataExtractor) {
                    const chatData = await window.HQDataExtractor.getChatData();
                    if (!chatData) return;
                    
                    // 并行提取各种数据类型
                    const extractPromises = this.config.watchPatterns.map(async (pattern) => {
                        return await this.extractDataByPattern(pattern, chatData);
                    });
                    
                    const results = await Promise.all(extractPromises);
                    
                    // 更新缓存并通知应用
                    results.forEach((result, index) => {
                        const pattern = this.config.watchPatterns[index];
                        if (result) {
                            // 处理不同的数据结构
                            let dataToProcess;
                            if (Array.isArray(result)) {
                                dataToProcess = result;
                            } else if (result.available && result.accepted && result.completed) {
                                // 任务数据有特殊结构
                                dataToProcess = [...result.available, ...result.accepted, ...result.completed];
                            } else {
                                dataToProcess = [result];
                            }
                            
                            if (dataToProcess.length > 0) {
                                this.updateCache(pattern, dataToProcess);
                                this.notifyApps(pattern, dataToProcess);
                            }
                        }
                    });
                    
                    const endTime = performance.now();
                    console.log(`⚡ 数据提取完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);
                } else {
                    console.warn('⚠️ HQDataExtractor未找到');
                }
            } catch (error) {
                console.error('❌ 数据提取失败:', error);
            }
        },
        
        // 根据模式提取数据
        extractDataByPattern: async function(pattern, chatData) {
            if (!window.HQDataExtractor) return [];
            
            try {
                switch (pattern) {
                    case 'qq联系人':
                        return await window.HQDataExtractor.extractQQContacts();
                    case 'qq消息':
                        return await window.HQDataExtractor.extractQQMessages();
                    case 'qq表情包':
                        // QQ表情包信息已包含在extractQQMessages中，这里返回过滤后的表情包消息
                        const allMessages = await window.HQDataExtractor.extractQQMessages();
                        return allMessages.filter(msg => msg.isSticker || msg.dataType.includes('表情包'));
                    case '任务信息':
                        return await window.HQDataExtractor.extractTasks();
                    case '淘宝商品':
                        return await window.HQDataExtractor.extractTaobaoProducts();
                    case '背包物品':
                        return await window.HQDataExtractor.extractBackpackItems();
                    default:
                        console.warn(`⚠️ 未知的数据模式: ${pattern}`);
                        return [];
                }
            } catch (error) {
                console.error(`❌ 提取数据失败 (${pattern}):`, error);
                return [];
            }
        },
        
        // 更新缓存
        updateCache: function(pattern, data) {
            const cacheKey = `${pattern}_${Date.now()}`;
            this.extractedDataCache.set(cacheKey, {
                pattern: pattern,
                data: data,
                timestamp: Date.now()
            });
        },
        
        // 通知相关应用
        notifyApps: function(pattern, data) {
            console.log(`📢 通知应用: ${pattern}, 数据量: ${data.length}`);
            
            // 根据数据类型通知对应的应用
            switch (pattern) {
                case 'qq联系人':
                case 'qq消息':
                case 'qq表情包':
                    if (window.QQApp && window.QQApp.handleDataUpdate) {
                        window.QQApp.handleDataUpdate(pattern, data);
                    }
                    break;
                case '任务信息':
                    if (window.TaskApp && window.TaskApp.handleDataUpdate) {
                        window.TaskApp.handleDataUpdate(pattern, data);
                    }
                    break;
                case '淘宝商品':
                    if (window.TaobaoApp && window.TaobaoApp.handleDataUpdate) {
                        window.TaobaoApp.handleDataUpdate(pattern, data);
                    }
                    break;
                case '背包物品':
                    if (window.BackpackApp && window.BackpackApp.handleDataUpdate) {
                        window.BackpackApp.handleDataUpdate(pattern, data);
                    }
                    break;
            }
            
            // 🌟 新增：作为备用机制，也调用传统的刷新方法
            this.fallbackRefresh(pattern);
        },
        
        // 🌟 新增：备用刷新机制（继承自旧的auto-refresh-manager功能）
        fallbackRefresh: function(pattern) {
            // 根据数据类型确定需要刷新的应用
            const appsToRefresh = [];
            
            switch (pattern) {
                case 'qq联系人':
                case 'qq消息':
                case 'qq表情包':
                    appsToRefresh.push('QQApp');
                    break;
                case '任务信息':
                    appsToRefresh.push('TaskApp');
                    break;
                case '淘宝商品':
                    appsToRefresh.push('TaobaoApp');
                    break;
            }
            
            // 调用传统的刷新方法作为备用
            appsToRefresh.forEach(appName => {
                const appConfig = this.supportedApps[appName];
                if (appConfig && appConfig.enabled) {
                    try {
                        const app = window[appName];
                        if (app && typeof app[appConfig.method] === 'function') {
                            console.log(`🔄 ${appConfig.icon} 备用刷新${appConfig.name}...`);
                            app[appConfig.method]();
                        }
                    } catch (error) {
                        console.warn(`⚠️ ${appConfig.icon} ${appConfig.name}备用刷新失败:`, error);
                    }
                }
            });
        },
        
        // 注册回调函数
        registerCallback: function(event, callback) {
            if (this.callbacks[event]) {
                this.callbacks[event].push(callback);
                console.log(`📋 已注册回调: ${event}`);
            }
        },
        
        // 触发回调函数
        triggerCallbacks: function(event, data = null) {
            if (this.callbacks[event]) {
                this.callbacks[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`❌ 回调执行失败 (${event}):`, error);
                    }
                });
            }
        },
        
        // 获取聊天哈希值
        getChatHash: function() {
            try {
                const chatData = window.chat || [];
                return btoa(JSON.stringify(chatData.map(m => m.mes || '').join('')));
            } catch (error) {
                return '';
            }
        },
        
        // 获取消息数量
        getMessageCount: function() {
            try {
                return (window.chat || []).length;
            } catch (error) {
                return 0;
            }
        },
        
        // 清理缓存
        cleanupCache: function() {
            const now = Date.now();
            const maxAge = 300000; // 5分钟
            
            for (const [key, value] of this.extractedDataCache.entries()) {
                if (now - value.timestamp > maxAge) {
                    this.extractedDataCache.delete(key);
                }
            }
            
            console.log('🧹 缓存清理完成');
        },
        
        // 处理新消息
        handleNewMessage: function(data, type) {
            console.log(`📨 新消息: ${type}`, data);
            this.debounceContextChange();
        },
        
        // 处理聊天变化
        handleChatChange: function(data) {
            console.log('💬 聊天变化:', data);
            this.debounceContextChange();
        },
        
        // 处理角色变化
        handleCharacterChange: function(data) {
            console.log('👤 角色变化:', data);
            this.debounceContextChange();
        },
        
        // 处理聊天更新
        handleChatUpdate: function(event) {
            console.log('🔄 聊天更新事件:', event.detail);
            this.debounceContextChange();
        },
        
        // 处理新增消息
        handleMessageAdded: function(event) {
            console.log('➕ 新增消息事件:', event.detail);
            this.debounceContextChange();
        },
        
        // 获取实时统计
        getStats: function() {
            return {
                isActive: this.isActive,
                messageCount: this.getMessageCount(),
                cacheSize: this.extractedDataCache.size,
                lastUpdate: this.lastChatHash ? new Date().toLocaleString() : '从未更新'
            };
        },
        
        // 调试信息
        debug: function() {
            console.log('🔍 智能上下文监听器调试信息:');
            console.log('状态:', this.getStats());
            console.log('配置:', this.config);
            console.log('回调注册:', Object.keys(this.callbacks).map(key => 
                `${key}: ${this.callbacks[key].length} 个回调`
            ));
        }
    };
    
    // 导出到全局
    window.ContextWatcher = ContextWatcher;
    
    // 自动初始化（延迟以确保其他组件先加载）
    setTimeout(() => {
        if (window.HQDataExtractor) {
            ContextWatcher.init();
        } else {
            console.warn('⚠️ HQDataExtractor未加载，等待中...');
            const checkInterval = setInterval(() => {
                if (window.HQDataExtractor) {
                    clearInterval(checkInterval);
                    ContextWatcher.init();
                }
            }, 1000);
        }
    }, 3000);
    
    console.log('📦 智能上下文监听器模块已加载');
    
})(window);