// QQ好友状态栏应用
(function(window) {
    'use strict';
    
    const QQFriendsStatusbar = {
        // 好友数据存储
        friendsData: [],
        contactsData: [],
        avatarData: {},
        
        // 初始化QQ好友状态栏应用
        init: function() {
            try {
                console.log('开始初始化QQ好友状态栏应用...');
                
                // 检查依赖
                if (typeof $ === 'undefined') {
                    console.error('jQuery未加载，QQ好友状态栏应用初始化失败');
                    return;
                }
                
                console.log('正在添加状态栏应用到手机界面...');
                this.addToPhoneInterface();
                
                console.log('正在创建好友状态界面...');
                this.createStatusInterface();
                
                console.log('正在绑定事件...');
                this.bindEvents();
                
                console.log('✅ QQ好友状态栏应用初始化完成');
            } catch (error) {
                console.error('❌ QQ好友状态栏应用初始化失败:', error);
            }
        },
        
        // 添加到手机界面
        addToPhoneInterface: function() {
            // 等待手机界面加载完成
            const checkPhoneInterface = () => {
                const $appGrid = $('.app-grid');
                if ($appGrid.length > 0) {
                    // 检查是否已经添加过状态栏应用
                    if ($('.app-icon[data-app="qq-status"]').length === 0) {
                        const $statusApp = $(`
                            <div class="app-icon" data-app="qq-status">
                                <div class="app-icon-img">👥</div>
                                <div class="app-name">状态</div>
                            </div>
                        `);
                        $appGrid.append($statusApp);
                        console.log('QQ好友状态栏应用已添加到手机界面');
                    }
                } else {
                    // 如果手机界面还没加载，等待一段时间后重试
                    setTimeout(checkPhoneInterface, 500);
                }
            };
            
            checkPhoneInterface();
        },
        
        // 创建状态界面
        createStatusInterface: function() {
            // 移除已存在的界面
            $('#qq_status_interface').remove();
            
            const $interface = $(`
                <div id="qq_status_interface" class="qq-status-interface">
                    
                    <!-- 状态栏头部 -->
                    <div class="status-header">
                        <h3>QQ好友状态</h3>
                        <div class="status-controls">
                            <button class="refresh-status-btn">刷新</button>
                            <button class="close-status-btn">×</button>
                        </div>
                    </div>
                    
                    <!-- 好友列表 -->
                    <div class="status-content">
                        <div class="status-tabs">
                            <button class="tab-btn active" data-tab="friends">好友列表</button>
                        </div>
                        
                        <div class="tab-content">
                            <!-- 好友列表标签页 -->
                            <div id="friends_tab" class="tab-pane active">
                                <div id="friends_list" class="friends-list">
                                    <div class="loading-message">正在加载好友数据...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            
            $('body').append($interface);
        },
        
        // 绑定事件
        bindEvents: function() {
            const self = this;
            
            // 状态栏应用点击事件由手机界面统一处理
            // $(document).on('click', '.app-icon[data-app="qq-status"]', function() {
            //     self.show();
            // });
            
            // 关闭按钮
            $(document).on('click', '.close-status-btn', function() {
                self.hide();
            });
            
            // 刷新按钮
            $(document).on('click', '.refresh-status-btn', function() {
                self.loadFriendsData();
            });
            
            // 好友项点击
            $(document).on('click', '.friend-status-item', function() {
                const friendData = $(this).data('friend');
                if (friendData) {
                    self.showFriendDetails(friendData);
                }
            });
        },
        
        // 显示状态界面
        show: function() {
            $('#qq_status_interface').addClass('show');
            // 不再隐藏手机界面，因为现在在手机容器内显示
            // $('#phone_interface').hide();
            // 加载数据
            this.loadFriendsData();
        },
        
        // 隐藏状态界面
        hide: function() {
            $('#qq_status_interface').removeClass('show');
            // 不再显示手机界面，由手机界面的返回按钮处理
            // $('#phone_interface').show();
        },
        
        // 加载好友数据
        loadFriendsData: async function() {
            try {
                console.log('开始从QQ应用加载好友数据...');
                
                // 检查数据提取器是否可用
                if (!window['HQDataExtractor']) {
                    console.warn('数据提取器不可用，使用模拟数据');
                    this.loadMockData();
                    return;
                }
                
                // 从QQ应用获取联系人数据
                const contacts = await window['HQDataExtractor'].extractQQContacts();
                console.log('获取到联系人数据:', contacts);
                
                // 从QQ应用获取头像数据
                this.loadAvatarDataFromQQ();
                
                // 转换联系人数据为好友数据格式
                this.contactsData = contacts;
                this.friendsData = this.convertContactsToFriends(contacts);
                
                // 更新界面
                this.updateFriendsList();
                
                console.log(`好友数据加载完成: ${this.friendsData.length}个好友`);
            } catch (error) {
                console.error('加载好友数据时出错:', error);
                this.loadMockData();
            }
        },
        
        // 从QQ应用加载头像数据
        loadAvatarDataFromQQ: function() {
            try {
                // 从QQ应用获取头像数据
                if (window['QQApp'] && window['QQApp'].avatarData) {
                    this.avatarData = { ...window['QQApp'].avatarData };
                    console.log('获取到QQ应用头像数据:', this.avatarData);
                }
                
                // 如果QQ应用有加载头像数据的方法，调用它
                if (window['QQApp'] && typeof window['QQApp'].loadAvatarData === 'function') {
                    window['QQApp'].loadAvatarData();
                    // 重新获取更新后的头像数据
                    this.avatarData = { ...window['QQApp'].avatarData };
                }
            } catch (error) {
                console.error('从QQ应用加载头像数据失败:', error);
                this.avatarData = {};
            }
        },
        
        // 转换联系人数据为好友数据格式
        convertContactsToFriends: function(contacts) {
            return contacts.map((contact, index) => {
                const avatar = this.avatarData[contact.number] || this.generateDefaultAvatar(contact.number);
                const favorability = parseInt(contact.favorability) || 0;
                
                return {
                    id: contact.number,
                    name: contact.name,
                    qq: contact.number,
                    avatar: avatar,
                    favorability: favorability,
                    status: this.getStatusFromFavorability(favorability),
                    isOnline: favorability > 50, // 好感度大于50认为在线
                    lastSeen: this.generateRecentTime(),
                    signature: `好感度: ${favorability}`,
                    
                    // 基本信息
                    gender: this.generateGender(),
                    title: this.generateTitle(favorability),
                    fetish: this.generateFetish(),
                    opinion: this.generateOpinion(favorability),
                    likedItems: this.generateLikedItems(),
                    dislikedItems: this.generateDislikedItems(),
                    
                    // 特殊数据
                    libido: this.generateLibido(favorability),
                    specialStatus: this.generateSpecialStatus(favorability),
                    mouthUsage: this.generateUsageCount('mouth'),
                    chestUsage: this.generateUsageCount('chest'),
                    privateUsage: this.generateUsageCount('private'),
                    backUsage: this.generateUsageCount('back'),
                    
                    source: 'qq_contacts'
                };
            });
        },
        
        // 根据好感度确定状态
        getStatusFromFavorability: function(favorability) {
            if (favorability >= 80) return '亲密';
            if (favorability >= 60) return '友好';
            if (favorability >= 40) return '普通';
            if (favorability >= 20) return '冷淡';
            return '陌生';
        },
        
        // 生成默认头像
        generateDefaultAvatar: function(id) {
            return `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
        },
        
        // 生成最近时间
        generateRecentTime: function() {
            const now = new Date();
            const randomHours = Math.floor(Math.random() * 12);
            return new Date(now.getTime() - randomHours * 60 * 60 * 1000);
        },
        
        // 加载模拟数据（备用方案）
        loadMockData: function() {
            console.log('使用模拟数据');
            const mockContacts = [
                { name: '小明', number: '1001', favorability: '85' },
                { name: '小红', number: '1002', favorability: '72' },
                { name: '小刚', number: '1003', favorability: '45' },
                { name: '小丽', number: '1004', favorability: '63' },
                { name: '小华', number: '1005', favorability: '28' }
            ];
            
            this.contactsData = mockContacts;
            this.friendsData = this.convertContactsToFriends(mockContacts);
            this.updateFriendsList();
        },
        
        // 更新好友列表
        updateFriendsList: function() {
            const $friendsList = $('#friends_list');
            $friendsList.empty();
            
            if (this.friendsData.length === 0) {
                $friendsList.html('<div class="no-friends-message">暂无好友数据<br><small>请先使用QQ应用添加联系人</small></div>');
                return;
            }
            
            // 按好感度排序
            const sortedFriends = [...this.friendsData].sort((a, b) => b.favorability - a.favorability);
            
            sortedFriends.forEach(friend => {
                // 获取真实头像或使用默认头像
                let avatarSrc = this.avatarData[friend.qq] || friend.avatar;
                
                // 如果头像是相对路径或者不完整的URL，使用默认头像
                if (!avatarSrc || (!avatarSrc.startsWith('http') && !avatarSrc.startsWith('data:'))) {
                    avatarSrc = this.generateDefaultAvatar(friend.qq);
                }
                
                const $friendItem = $(`
                    <div class="friend-status-item">
                        <div class="friend-avatar-wrapper">
                            <img src="${avatarSrc}" alt="${friend.name}" class="friend-avatar" onerror="this.src='${this.generateDefaultAvatar(friend.qq)}';" />
                            <span class="friend-status-dot ${friend.isOnline ? 'online' : 'offline'}"></span>
                        </div>
                        <div class="friend-info">
                            <div class="friend-name">${friend.name}</div>
                            <div class="friend-qq">QQ: ${friend.qq}</div>
                            <div class="friend-meta-info">
                                <span class="gender-tag">${friend.gender}</span>
                                <span class="fetish-tag">${friend.fetish}</span>
                            </div>
                            <div class="friend-signature">${friend.signature}</div>
                        </div>
                        <div class="friend-meta">
                            <div class="friend-status" data-status="${this.getStatusClass(friend.favorability)}">${friend.status}</div>
                            <div class="friend-title">${friend.title}</div>
                            <div class="friend-favorability">${friend.favorability}%</div>
                        </div>
                    </div>
                `);
                
                // 绑定好友数据
                $friendItem.data('friend', friend);
                
                $friendsList.append($friendItem);
            });
        },
        
        // 获取状态类名
        getStatusClass: function(favorability) {
            if (favorability >= 80) return 'intimate';
            if (favorability >= 60) return 'friendly';
            if (favorability >= 40) return 'normal';
            if (favorability >= 20) return 'cold';
            return 'stranger';
        },
        
        // 显示好友详情
        showFriendDetails: function(friend) {
            // 获取真实头像
            let avatarSrc = this.avatarData[friend.qq] || friend.avatar;
            if (!avatarSrc || (!avatarSrc.startsWith('http') && !avatarSrc.startsWith('data:'))) {
                avatarSrc = this.generateDefaultAvatar(friend.qq);
            }
            
            const privatePartText = friend.gender === '女' ? '小穴使用次数' : friend.gender === '男' ? '肉棒使用次数' : '私处使用次数';
            
            const $dialog = $(`
                <div id="friend_status_dialog" class="friend-detail-dialog">
                    <div class="dialog-container">
                        
                        <!-- 对话框头部 -->
                        <div class="dialog-header">
                            <h3>好友详情</h3>
                            <button class="close-dialog-btn">×</button>
                        </div>
                        
                        <!-- 好友基本信息头部 -->
                        <div class="friend-header">
                            <img src="${avatarSrc}" alt="${friend.name}" class="friend-large-avatar" onerror="this.src='${this.generateDefaultAvatar(friend.qq)}';" />
                            <div class="friend-header-info">
                                <h4>${friend.name}</h4>
                                <p class="friend-qq-info">QQ: ${friend.qq}</p>
                                <p class="friend-status-info" data-status="${this.getStatusClass(friend.favorability)}">状态: ${friend.status} • 好感度: ${friend.favorability}%</p>
                                <div class="friend-tags">
                                    <span class="gender-tag">${friend.gender}</span>
                                    <span class="fetish-tag">${friend.fetish}</span>
                                    <span class="title-tag">${friend.title}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 标签页导航 -->
                        <div class="friend-detail-tabs">
                            <button class="detail-tab-btn active" data-tab="basic">基本信息</button>
                            <button class="detail-tab-btn" data-tab="special">特殊数据</button>
                        </div>
                        
                        <!-- 标签页内容 -->
                        <div class="dialog-content">
                            
                            <!-- 基本信息标签页 -->
                            <div id="detail_basic_tab" class="detail-tab-pane active">
                                <div class="basic-info-grid">
                                    <div class="info-item">
                                        <div class="info-label">性别</div>
                                        <div class="info-value">${friend.gender}</div>
                                    </div>
                                    
                                    <div class="info-item">
                                        <div class="info-label">称号</div>
                                        <div class="info-value title-value">${friend.title}</div>
                                    </div>
                                    
                                    <div class="info-item">
                                        <div class="info-label">性癖</div>
                                        <div class="info-value fetish-value">${friend.fetish}</div>
                                    </div>
                                    
                                    <div class="info-item">
                                        <div class="info-label">对我的看法</div>
                                        <div class="info-value opinion-value" data-status="${this.getStatusClass(friend.favorability)}">${friend.opinion}</div>
                                    </div>
                                </div>
                                
                                <div class="items-section">
                                    <div class="liked-items">
                                        <div class="info-label">喜欢的物品</div>
                                        <div class="items-container">
                                            ${friend.likedItems.map(item => `<span class="liked-item">${item}</span>`).join('')}
                                        </div>
                                    </div>
                                    
                                    <div class="disliked-items">
                                        <div class="info-label">讨厌的物品</div>
                                        <div class="items-container">
                                            ${friend.dislikedItems.map(item => `<span class="disliked-item">${item}</span>`).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 特殊数据标签页 -->
                            <div id="detail_special_tab" class="detail-tab-pane">
                                <div class="special-data-grid">
                                    <div class="data-item">
                                        <div class="data-label">性欲值</div>
                                        <div class="data-value libido-value">
                                            ${friend.libido}
                                            <span class="data-unit">/ 100</span>
                                        </div>
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${friend.libido}%;"></div>
                                        </div>
                                    </div>
                                    
                                    <div class="data-item">
                                        <div class="data-label">特殊状态</div>
                                        <div class="data-value special-status-value">${friend.specialStatus}</div>
                                    </div>
                                </div>
                                
                                <div class="usage-stats">
                                    <h4 class="usage-title">使用统计</h4>
                                    
                                    <div class="usage-grid">
                                        <div class="usage-item">
                                            <div class="usage-label">嘴巴使用次数</div>
                                            <div class="usage-value mouth-usage">${friend.mouthUsage}</div>
                                        </div>
                                        
                                        <div class="usage-item">
                                            <div class="usage-label">胸部使用次数</div>
                                            <div class="usage-value chest-usage">${friend.chestUsage}</div>
                                        </div>
                                        
                                        <div class="usage-item">
                                            <div class="usage-label">${privatePartText}</div>
                                            <div class="usage-value private-usage">${friend.privateUsage}</div>
                                        </div>
                                        
                                        <div class="usage-item">
                                            <div class="usage-label">后穴使用次数</div>
                                            <div class="usage-value back-usage">${friend.backUsage}</div>
                                        </div>
                                    </div>
                                    
                                    <div class="total-usage">
                                        <div class="usage-label">总使用次数</div>
                                        <div class="total-usage-value">${friend.mouthUsage + friend.chestUsage + friend.privateUsage + friend.backUsage}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 底部操作按钮 -->
                        <div class="dialog-actions">
                            <button class="action-btn chat-btn">发送消息</button>
                        </div>
                    </div>
                </div>
            `);
            
            $('body').append($dialog);
            
            // 绑定标签页切换事件
            $dialog.find('.detail-tab-btn').on('click', function() {
                const tabName = $(this).data('tab');
                
                // 更新标签按钮状态
                $dialog.find('.detail-tab-btn').removeClass('active');
                $(this).addClass('active');
                
                // 切换内容
                $dialog.find('.detail-tab-pane').removeClass('active');
                $dialog.find(`#detail_${tabName}_tab`).addClass('active');
            });
            
            // 绑定其他事件
            $dialog.find('.close-dialog-btn').on('click', function() {
                $dialog.remove();
            });
            
            $dialog.find('.chat-btn').on('click', function() {
                alert(`开始与${friend.name}聊天`);
                $dialog.remove();
            });
            
            $dialog.on('click', function(e) {
                if (e.target === this) {
                    $(this).remove();
                }
            });
        },
        
        // 格式化时间
        formatTime: function(date) {
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            
            if (hours < 1) {
                return '刚刚';
            } else if (hours < 24) {
                return `${hours}小时前`;
            } else {
                const days = Math.floor(hours / 24);
                return `${days}天前`;
            }
        },
        
        // 生成性别
        generateGender: function() {
            const genders = ['女', '男', '其他'];
            return genders[Math.floor(Math.random() * genders.length)];
        },
        
        // 生成称号（基于好感度）
        generateTitle: function(favorability) {
            if (favorability >= 80) return ['恋人', '挚友', '知己', '心上人'][Math.floor(Math.random() * 4)];
            if (favorability >= 60) return ['好友', '密友', '伙伴', '朋友'][Math.floor(Math.random() * 4)];
            if (favorability >= 40) return ['熟人', '同事', '同学', '邻居'][Math.floor(Math.random() * 4)];
            if (favorability >= 20) return ['路人', '陌生人', '过客', '认识的人'][Math.floor(Math.random() * 4)];
            return '陌生人';
        },
        
        // 生成性癖
        generateFetish: function() {
            const fetishes = ['温柔系', '活泼系', '安静系', '神秘系', '可爱系', '成熟系', '知性系', '运动系'];
            return fetishes[Math.floor(Math.random() * fetishes.length)];
        },
        
        // 生成对我的看法（基于好感度）
        generateOpinion: function(favorability) {
            if (favorability >= 80) return ['非常喜欢', '很爱', '深深迷恋', '无法自拔'][Math.floor(Math.random() * 4)];
            if (favorability >= 60) return ['很喜欢', '有好感', '觉得不错', '挺欣赏'][Math.floor(Math.random() * 4)];
            if (favorability >= 40) return ['一般般', '还可以', '普通朋友', '平常心'][Math.floor(Math.random() * 4)];
            if (favorability >= 20) return ['不太熟', '没什么感觉', '很陌生', '不了解'][Math.floor(Math.random() * 4)];
            return '完全不认识';
        },
        
        // 生成喜欢的物品
        generateLikedItems: function() {
            const items = ['花朵', '巧克力', '音乐', '电影', '书籍', '咖啡', '甜点', '香水', '宠物', '旅行'];
            const count = Math.floor(Math.random() * 3) + 1; // 1-3个
            const selectedItems = [];
            const shuffled = [...items].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        },
        
        // 生成讨厌的物品
        generateDislikedItems: function() {
            const items = ['虫子', '辣椒', '噪音', '雨天', '拥挤', '早起', '熬夜', '运动', '学习', '工作'];
            const count = Math.floor(Math.random() * 3) + 1; // 1-3个
            const selectedItems = [];
            const shuffled = [...items].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        },
        
        // 生成性欲值（基于好感度）
        generateLibido: function(favorability) {
            const base = Math.floor(favorability * 0.8); // 基础值
            const variation = Math.floor(Math.random() * 21) - 10; // -10到+10的变化
            return Math.max(0, Math.min(100, base + variation));
        },
        
        // 生成特殊状态（基于好感度）
        generateSpecialStatus: function(favorability) {
            if (favorability >= 80) {
                const statuses = ['兴奋', '期待', '害羞', '主动', '迷恋'];
                return statuses[Math.floor(Math.random() * statuses.length)];
            } else if (favorability >= 60) {
                const statuses = ['好奇', '犹豫', '温柔', '友好', '开心'];
                return statuses[Math.floor(Math.random() * statuses.length)];
            } else if (favorability >= 40) {
                const statuses = ['平静', '正常', '淡然', '普通', '无感'];
                return statuses[Math.floor(Math.random() * statuses.length)];
            } else {
                const statuses = ['冷淡', '疏远', '陌生', '警惕', '无视'];
                return statuses[Math.floor(Math.random() * statuses.length)];
            }
        },
        
        // 生成使用次数
        generateUsageCount: function(type) {
            return Math.floor(Math.random() * 100); // 0-99次
        }
    };
    
    // 暴露到全局
    window['QQFriendsStatusbar'] = QQFriendsStatusbar;
    
})(window); 