// 游戏应用
(function(window) {
    'use strict';

    const GameApp = {
        isInitialized: false,

        // 初始化游戏应用
        init: function() {
            if (this.isInitialized) {
                console.log('游戏应用已经初始化过了');
                return;
            }

            console.log('🎮 初始化游戏应用...');
            this.createInterface();
            this.isInitialized = true;
        },

        // 创建游戏界面
        createInterface: function() {
            // 如果界面已存在，先移除
            if ($('#game_interface').length > 0) {
                $('#game_interface').remove();
            }

            const $gameInterface = $(`
                <style>
                                        @keyframes cardFloat {
                        0% {
                            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
                        }
                        100% {
                            filter: drop-shadow(0 6px 12px rgba(0,0,0,0.4));
                        }
                    }

                    .card {
                        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    }

                    .card:hover {
                        filter: brightness(1.2) drop-shadow(0 8px 16px rgba(0,0,0,0.5)) !important;
                    }

                    .opponent-draw-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(255, 107, 107, 0.6);
                        background: linear-gradient(145deg, #FF5252, #E53935);
                    }
                </style>
                <div id="game_interface" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%;  z-index: 1002;">
                    <!-- 游戏头部 -->
                    <!-- 标签页导航 -->
                    <div class="game-tabs" style="height: 50px; background: rgba(255,255,255,0.1); display: flex;">
                        <div class="game-tab active" data-tab="hidden" style="flex: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #333; font-weight: 500; border-bottom: 2px solid white;">
                            抽卡
                        </div>
                        <div class="game-tab" data-tab="settings" style="flex: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #aaa; font-weight: 500; border-bottom: 2px solid transparent;">
                            视频设置
                        </div>
                    </div>

                    <!-- 游戏内容区域 -->
                    <div class="game-content" style="flex: 1; height: calc(100% - 104px); overflow: hidden; position: relative;">
                        <!-- 隐藏文字的气泡 -->
                        <div class="game-panel" id="hidden-panel" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block;">
                            <div class="bubbles-container" id="hidden-bubbles" style="position: relative; width: 100%; height: 100%; overflow: hidden;">
                                <!-- 这里将生成8个悬浮气泡，文字隐藏 -->
                            </div>
                        </div>

                        <!-- 视频设置面板 -->
                        <div class="game-panel" id="settings-panel" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: none; background: rgba(0,0,0,0.8); padding: 20px; box-sizing: border-box; overflow-y: auto;">
                            <div style="max-width: 600px; margin: 0 auto; color: white;">
                                <h3 style="margin-top: 0; text-align: center; color: #fff;">🎬 背景视频设置</h3>

                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">视频链接：</label>
                                    <input type="url" id="video-url-input" placeholder="请输入视频链接 (支持 .mp4, .webm 等格式)" style="
                                        width: 100%;
                                        padding: 12px;
                                        border: 1px solid #666;
                                        border-radius: 4px;
                                        background: rgba(255,255,255,0.1);
                                        color: white;
                                        font-size: 14px;
                                        box-sizing: border-box;
                                    ">
                                </div>

                                <div style="margin-bottom: 20px; display: flex; gap: 10px;">
                                    <button id="apply-video-btn" style="
                                        flex: 1;
                                        padding: 12px;
                                        background: #4CAF50;
                                        color: white;
                                        border: none;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        font-size: 14px;
                                        font-weight: bold;
                                    ">应用视频</button>
                                    <button id="reset-video-btn" style="
                                        flex: 1;
                                        padding: 12px;
                                        background: #f44336;
                                        color: white;
                                        border: none;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        font-size: 14px;
                                        font-weight: bold;
                                    ">恢复默认</button>
                                </div>

                                <div style="margin-bottom: 20px;">
                                    <h4 style="margin-bottom: 10px;">已保存的视频：</h4>
                                    <div id="saved-videos-list" style="
                                        max-height: 200px;
                                        overflow-y: auto;
                                        border: 1px solid #666;
                                        border-radius: 4px;
                                        background: rgba(255,255,255,0.05);
                                    ">
                                        <!-- 这里显示保存的视频列表 -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            // 添加到body
            $('body').append($gameInterface);

                        // 绑定标签页切换事件
            this.bindTabEvents();

                        // 绑定视频管理事件
            this.bindVideoEvents();

            // 绑定抽卡事件
            this.bindDrawEvents();

            // 初始化抽卡数据
            this.initDrawData();

            // 生成气泡
            this.generateBubbles();

            // 初始化视频设置
            this.initVideoSettings();

            console.log('✅ 游戏界面创建完成');
        },

        // 绑定标签页事件
        bindTabEvents: function() {
            const self = this;

            $('.game-tab').on('click', function() {
                const $tab = $(this);
                const tabType = $tab.data('tab');

                // 切换标签页激活状态
                $('.game-tab').removeClass('active').css({
                    'color': '#aaa',
                    'border-bottom-color': 'transparent'
                });

                $tab.addClass('active').css({
                    'color': '#333',
                    'border-bottom-color': 'white'
                });

                                // 切换显示面板
                $('.game-panel').hide();
                $(`#${tabType}-panel`).show();

                // 如果切换到设置面板，刷新设置内容
                if (tabType === 'settings') {
                    self.refreshVideoSettings();
                }

                let tabName = '';
                if (tabType === 'hidden') tabName = '抽卡';
                else if (tabType === 'settings') tabName = '视频设置';

                console.log(`切换到${tabName}标签页`);
            });
        },

        // 生成悬浮气泡
        generateBubbles: function() {
            // 10个随机汉字
            const characters = ['春', '夏', '秋', '冬', '花', '鸟', '虫', '鱼', '山', '水'];

            // 为隐藏文字面板生成气泡
            this.createBubblesForPanel('hidden-bubbles', characters, false);
        },

        // 为指定面板创建气泡
        createBubblesForPanel: function(containerId, characters, showText) {
            const $container = $(`#${containerId}`);
            $container.empty();

                        // 添加全屏背景视频
            const currentVideoUrl = this.getCurrentVideoUrl();
            const $backgroundVideo = $(`
                <video class="background-video" autoplay muted loop playsinline webkit-playsinline style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    z-index: 0;
                    opacity: 1;

                ">
                    <source src="${currentVideoUrl}" type="video/mp4">
                    <source src="movie.ogg" type="video/ogg">
                    Your browser does not support the video tag.
                </video>
            `);

            $container.append($backgroundVideo);

                        // 添加对方抽按钮（只在hidden-bubbles容器中添加一次）
            if (containerId === 'hidden-bubbles') {
                // 添加爱爱按钮
                const $loveBtn = $(`
                    <button class="love-btn" style="
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: rgb(199, 21, 133,0.2);
                        color: #FF1493;
                        border: 1px solid #FF1493;
                        border-radius: 20px;
                        padding: 8px 16px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        box-shadow: 0 2px 8px rgba(255, 105, 180, 0.4);
                        transition: all 0.3s ease;
                        z-index: 50;
                        width: 80px;
                    ">爱爱</button>
                `);

                const $opponentBtn = $(`
                    <button class="opponent-draw-btn" style="
                        position: absolute;
                        top: 110px;
                        right: 10px;
                        background: linear-gradient(145deg, #FF6B6B, #FF5252);
                        color: white;
                        border: none;
                        border-radius: 20px;
                        padding: 8px 16px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
                        transition: all 0.3s ease;
                        z-index: 50;
                    ">对方抽</button>
                `);

                // 添加小剧场按钮
                const $theaterBtn = $(`
                    <button class="theater-btn" style="
                        position: absolute;
                        top: 60px;
                        right: 10px;
                        background: rgba(156, 39, 176, 0.2);
                        color: #9C27B0;
                        border: 1px solid #9C27B0;
                        border-radius: 20px;
                        padding: 8px 12px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        z-index: 50;
                        width: 80px;
                    ">小剧场</button>
                `);

                // 添加心理活动气泡框
                const $thoughtBubble = $(`
                    <div class="thought-bubble" style="
                        position: absolute;
                        top: 30px;
                        left: 20px;
                        background: rgba(255, 255, 255, 0.95);
                        color: #333;
                        padding: 15px 20px;
                        border-radius: 20px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        max-width: 160px;
                        font-size: 20px;
                        line-height: 1.4;
                        z-index: 45;
                        opacity: 0.8;
                        transition: opacity 0.4s ease;
                        border: 2px solid rgba(255,255,255,0.8);
                    ">
                        <div class="thought-text" style="transition: opacity 0.3s ease;">
                            对方似乎在思考着什么...
                        </div>
                        <div class="thought-tail" style="
                            position: absolute;
                            bottom: -8px;
                            left: 30px;
                            width: 0;
                            height: 0;
                            border-left: 8px solid transparent;
                            border-right: 8px solid transparent;
                            border-top: 8px solid rgba(255, 255, 255, 0.95);
                        "></div>
                    </div>
                `);

                $container.append($loveBtn);
                $container.append($opponentBtn);
                $container.append($theaterBtn);
                $container.append($thoughtBubble);

                // 绑定爱爱按钮事件
                $loveBtn.on('click', () => {
                    this.toggleLoveMode();
                });

                // 绑定对方抽按钮事件
                $opponentBtn.on('click', () => {
                    this.handleOpponentDraw();
                });

                // 绑定小剧场按钮事件
                $theaterBtn.on('click', () => {
                    this.toggleTheaterMode();
                });

                // 初始化心理活动数据
                this.initThoughtBubble($thoughtBubble);
            }

            // 扑克牌扇形展开位置计算 - 真正的扇子效果
            const cardCount = 8;
            const centerX = 50; // 底部中心X位置（百分比）
            const centerY = 105; // 底部Y位置（百分比）- 扇子的支点
            const fanRadius = 30; // 扇形半径（百分比）- 增大半径让扇形更明显
            const fanAngle = 100; // 扇形角度（度）- 更大的扇形角度
            const startAngle = -fanAngle / 2; // 起始角度

            // 生成10张扑克牌
            for (let i = 0; i < cardCount; i++) {
                const randomChar = characters[i % characters.length];
                const cardWidth = 90; // 稍微缩小卡片，避免重叠
                const cardHeight = 125;

                // 计算每张牌的角度 - 这是扇子的关键
                const angle = startAngle + (fanAngle / (cardCount - 1)) * i;
                const radian = (angle * Math.PI) / 180;

                // 计算位置 - 以扇子支点为中心的弧形分布
                const x = centerX + fanRadius * Math.sin(radian);
                const y = centerY - fanRadius * Math.cos(radian) * 0.5; // 压缩Y轴，让扇形更扁平

                // 计算z-index - 中间的牌层级最高，两边递减，确保在视频上层
                const centerIndex = (cardCount - 1) / 2;
                const distanceFromCenter = Math.abs(i - centerIndex);
                const zIndex = 10 + cardCount - distanceFromCenter; // 基础z-index为10，确保在视频(z-index:1)上层

                // 关键：卡片的旋转角度要与其在扇子中的位置一致
                const rotation = angle; // 直接使用角度，让每张牌都朝向扇形中心

                const animationDelay = i * 0.1; // 依次延迟动画
                const animationDuration = 3 + Math.random() * 1; // 3-4秒的随机动画时长

                const $card = $(`
                    <div class="card" style="
                        position: absolute;
                        left: ${x}%;
                        top: ${y}%;
                        width: ${cardWidth}px;
                        height: ${cardHeight}px;
                        background: linear-gradient(145deg, #2c2c2c, #1a1a1a);
                        border: 2px solid #444;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: ${cardWidth * 0.4}px;
                        font-weight: bold;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                        cursor: pointer;
                        user-select: none;
                        transform-origin: 50% 100%;
                        transform: translateX(-50%) translateY(-100%) rotate(${rotation}deg);
                        z-index: ${zIndex};
                        box-shadow: 0 4px 12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1);
                        transition: all 0.3s ease;
                        animation: cardFloat ${animationDuration}s ease-in-out ${animationDelay}s infinite alternate;
                    " data-char="${randomChar}" data-index="${i}">
                        ${showText ? randomChar : ''}
                    </div>
                `);

                // 添加点击事件
                $card.on('click', function() {
                    const char = $(this).data('char');
                    const index = $(this).data('index');
                    console.log(`抽中了第${index + 1}张牌: ${char}`);

                    // 我方抽卡，发送消息
                    GameApp.handleCardDraw('player', char, index);

                                        // 点击效果：牌飞出并放大
                    $(this).css({
                        'transform': `translateX(-50%) translateY(-100%) rotate(${rotation}deg) scale(1.3) translateY(-20px)`,
                        'z-index': '100',
                        'box-shadow': '0 8px 25px rgba(0,0,0,0.6)',
                        'background': 'linear-gradient(145deg, #444, #222)'
                    });

                    setTimeout(() => {
                        $(this).css({
                            'transform': `translateX(-50%) translateY(-100%) rotate(${rotation}deg) scale(1)`,
                            'z-index': zIndex,
                            'box-shadow': '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                            'background': 'linear-gradient(145deg, #2c2c2c, #1a1a1a)'
                        });
                    }, 500);
                });

                                                // 添加悬停效果 - 向上拉出扑克牌的感觉
                $card.on('mouseenter', function() {
                    // 计算向上平移的距离，模拟从扇子中拉出扑克牌
                    const moveDistance = 20; // 向上拉出的距离（像素）
                    const moveX = 0; // 不向左右移动
                    const moveY = -moveDistance; // 向上移动

                    $(this).css({
                        'transform': `translateX(-50%) translateY(-100%) translate(${moveX}px, ${moveY}px) rotate(${rotation}deg) scale(1.05)`,
                        'z-index': '99',
                        'box-shadow': '0 12px 30px rgba(0,0,0,0.7)',
                        'background': 'linear-gradient(145deg, #3a3a3a, #222)',
                        'border-color': '#666'
                    });

                    // 更新心理活动文字（带防抖）
                    const cardChar = $(this).data('char');
                    const cardIndex = $(this).data('index');
                    const thoughtText = GameApp.getCardThought(cardChar, cardIndex);
                    GameApp.debouncedUpdateThought(thoughtText);

                }).on('mouseleave', function() {
                    $(this).css({
                        'transform': `translateX(-50%) translateY(-100%) rotate(${rotation}deg) scale(1)`,
                        'z-index': zIndex,
                        'box-shadow': '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                        'background': 'linear-gradient(145deg, #2c2c2c, #1a1a1a)',
                        'border-color': '#444'
                    });

                    // 清除防抖计时器，恢复随机心理活动
                    if (GameApp.debounceTimeout) {
                        clearTimeout(GameApp.debounceTimeout);
                    }
                    setTimeout(() => {
                        GameApp.updateThoughtText(null, true);
                    }, 800);
                });

                $container.append($card);
            }
        },

        // 绑定视频管理事件
        bindVideoEvents: function() {
            const self = this;

            // 应用视频按钮
            $('#apply-video-btn').on('click', function() {
                const url = String($('#video-url-input').val() || '').trim();
                if (url) {
                    self.applyVideoUrl(url);
                } else {
                    alert('请输入有效的视频链接！');
                }
            });

            // 重置视频按钮
            $('#reset-video-btn').on('click', function() {
                self.resetToDefault();
            });

            // 输入框回车事件
            $('#video-url-input').on('keypress', function(e) {
                if (e.which === 13) { // Enter键
                    $('#apply-video-btn').click();
                }
            });
        },

        // 初始化视频设置
        initVideoSettings: function() {
            // 加载当前使用的视频链接到输入框
            const currentUrl = this.getCurrentVideoUrl();
            if (currentUrl) {
                $('#video-url-input').val(currentUrl);
            }

            // 生成预设视频列表
            this.generatePresetVideos();

            // 刷新已保存视频列表
            this.refreshSavedVideos();
        },

        // 刷新视频设置
        refreshVideoSettings: function() {
            const currentUrl = this.getCurrentVideoUrl();
            $('#video-url-input').val(currentUrl || '');
            this.refreshSavedVideos();
        },

        // 获取当前视频链接
        getCurrentVideoUrl: function() {
            return localStorage.getItem('gameapp_current_video') || 'https://files.catbox.moe/02zfp7.mp4';
        },

        // 应用视频链接
        applyVideoUrl: function(url) {
            try {
                // 验证URL格式
                new URL(url);

                // 保存到localStorage
                localStorage.setItem('gameapp_current_video', url);

                // 添加到已保存列表
                this.saveVideoToHistory(url);

                // 更新所有视频元素
                this.updateAllVideos(url);

                // 刷新已保存列表
                this.refreshSavedVideos();

                console.log('✅ 视频链接已应用:', url);
                alert('视频已更换成功！');

            } catch (error) {
                console.error('❌ 无效的视频链接:', error);
                alert('请输入有效的视频链接！');
            }
        },

        // 保存视频到历史记录
        saveVideoToHistory: function(url) {
            let savedVideos = JSON.parse(localStorage.getItem('gameapp_saved_videos') || '[]');

            // 移除重复项
            savedVideos = savedVideos.filter(item => item.url !== url);

            // 添加到开头
            savedVideos.unshift({
                url: url,
                timestamp: Date.now(),
                title: this.getVideoTitle(url)
            });

            // 限制保存数量为10个
            if (savedVideos.length > 10) {
                savedVideos = savedVideos.slice(0, 10);
            }

            localStorage.setItem('gameapp_saved_videos', JSON.stringify(savedVideos));
        },

        // 获取视频标题
        getVideoTitle: function(url) {
            try {
                const urlObj = new URL(url);
                const filename = urlObj.pathname.split('/').pop();
                return filename || url.substring(url.lastIndexOf('/') + 1, url.length);
            } catch {
                return url.length > 50 ? url.substring(0, 50) + '...' : url;
            }
        },

        // 更新所有视频元素
        updateAllVideos: function(url) {
            $('.background-video').each(function() {
                const $video = $(this);
                $video.find('source').first().attr('src', url);
                // 重新创建视频元素来触发加载
                $video.attr('src', url);
            });
        },

        // 重置为默认视频
        resetToDefault: function() {
            const defaultUrl = 'https://files.catbox.moe/02zfp7.mp4';
            $('#video-url-input').val(defaultUrl);
            this.applyVideoUrl(defaultUrl);
        },

        // 刷新已保存视频列表
        refreshSavedVideos: function() {
            const savedVideos = JSON.parse(localStorage.getItem('gameapp_saved_videos') || '[]');
            const $list = $('#saved-videos-list');

            if (savedVideos.length === 0) {
                $list.html('<div style="padding: 20px; text-align: center; color: #666;">暂无保存的视频</div>');
                return;
            }

            let html = '';
            savedVideos.forEach((video, index) => {
                const date = new Date(video.timestamp).toLocaleString();
                html += `
                    <div class="saved-video-item" data-url="${video.url}" style="
                        padding: 10px;
                        border-bottom: 1px solid #444;
                        cursor: pointer;
                        transition: background 0.2s;
                    ">
                        <div style="font-weight: bold; margin-bottom: 4px;">${video.title}</div>
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 4px;">${date}</div>
                        <div style="font-size: 11px; color: #888; word-break: break-all;">${video.url}</div>
                        <div style="margin-top: 6px;">
                            <button class="use-video-btn" data-url="${video.url}" style="
                                background: #2196F3;
                                color: white;
                                border: none;
                                padding: 4px 8px;
                                border-radius: 3px;
                                font-size: 11px;
                                cursor: pointer;
                                margin-right: 5px;
                            ">使用</button>
                            <button class="delete-video-btn" data-url="${video.url}" style="
                                background: #f44336;
                                color: white;
                                border: none;
                                padding: 4px 8px;
                                border-radius: 3px;
                                font-size: 11px;
                                cursor: pointer;
                            ">删除</button>
                        </div>
                    </div>
                `;
            });

            $list.html(html);

            // 绑定事件
            this.bindSavedVideoEvents();
        },

        // 绑定已保存视频的事件
        bindSavedVideoEvents: function() {
            const self = this;

            // 使用视频
            $('.use-video-btn').off('click').on('click', function(e) {
                e.stopPropagation();
                const url = $(this).data('url');
                $('#video-url-input').val(url);
                self.applyVideoUrl(url);
            });

            // 删除视频
            $('.delete-video-btn').off('click').on('click', function(e) {
                e.stopPropagation();
                const url = $(this).data('url');
                if (confirm('确定要删除这个视频吗？')) {
                    self.deleteVideoFromHistory(url);
                    self.refreshSavedVideos();
                }
            });

            // 点击视频项复制到输入框
            $('.saved-video-item').off('click').on('click', function() {
                const url = $(this).data('url');
                $('#video-url-input').val(url);
            });
        },

        // 从历史记录删除视频
        deleteVideoFromHistory: function(url) {
            let savedVideos = JSON.parse(localStorage.getItem('gameapp_saved_videos') || '[]');
            savedVideos = savedVideos.filter(item => item.url !== url);
            localStorage.setItem('gameapp_saved_videos', JSON.stringify(savedVideos));
        },

        // 生成预设视频列表
        generatePresetVideos: function() {
            const presetVideos = [
                {
                    title: '默认视频',
                    url: 'https://files.catbox.moe/02zfp7.mp4',
                    description: '默认动态背景'
                },
                {
                    title: '示例视频 1',
                    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
                    description: '测试视频样本'
                },
                {
                    title: '示例视频 2',
                    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                    description: '大兔子动画'
                }
            ];

            let html = '';
            presetVideos.forEach(video => {
                html += `
                    <div class="preset-video-item" style="
                        padding: 10px;
                        border: 1px solid #444;
                        border-radius: 4px;
                        margin-bottom: 8px;
                        cursor: pointer;
                        transition: background 0.2s;
                    ">
                        <div style="font-weight: bold; margin-bottom: 4px;">${video.title}</div>
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 8px;">${video.description}</div>
                        <button class="use-preset-btn" data-url="${video.url}" style="
                            background: #4CAF50;
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: 3px;
                            font-size: 12px;
                            cursor: pointer;
                        ">使用此视频</button>
                    </div>
                `;
            });

            $('#preset-videos-list').html(html);

            // 绑定预设视频事件
            $('.use-preset-btn').on('click', function() {
                const url = $(this).data('url');
                $('#video-url-input').val(url);
            });
        },

        // 初始化抽卡数据
        initDrawData: function() {
            // 爱爱模式标志
            this.loveMode = false;
            
            // 小剧场模式标志
            this.theaterMode = false;
            
            // 从qr.txt提取的数据
            this.drawData = {
                // BDSM类型
                'bdsm': [
                    { title: '绳艺花缚', content: 'user用日式绳缚将Character身体捆绑成具有美感的复杂花型，绳结巧妙地压迫着user的敏感点（如乳头，阴蒂，穴口等）或让穴口完全暴露被Character观赏。在性爱过程中，每一次插入和抽动都会带动绳索摩擦user的肌肤与私处，带来层叠的刺激与快感以及被绑紧的窒息感等等。' },
                    { title: '吊缚悬浮', content: 'user将Character四肢固定悬吊空中，私处敞开。Character从下方插入玩弄，user身体随之摇晃，加剧无助与被支配感，可尝试不同角度插入，配合其他玩具或语言调教，拍打臀部等等。' },
                    { title: '床柱固定捆绑', content: 'user将Character四肢缚于床柱，身体呈大字型无法动弹。Character可俯身低语挑逗，同时对user暴露的身体进行各种侵犯，如舔舐，玩弄敏感点，缓慢插入完全支配等等。' },
                    { title: '服从训练', content: 'user训练Character服从，要求重复羞耻臣服短语如"我是主人的"，"请主人干我"等。User正确重复后，character即给予插入更深，亲吻等"奖励"，强化服从。' },
                    { title: '身体书写', content: 'user用口红，笔或其它方式在Character的身体如大腿内侧，胸部，臀部，小腹等写下羞耻或占有性的词句如"主人的肉便器"，"淫荡母狗"等等。在性爱中，这些字迹被摩擦，晕开，加剧user的羞耻感与兴奋。' },
                    { title: '放置play', content: '请承接当前角色状态以及人设，允许轻微脱离剧情。user将character固定成某种特定羞耻姿势,如M字开腿并用扩张器撑开穴口,吊缚悬浮, 床柱束缚四肢，撅高臀部等待插入等等，使其无法轻易改变。在character体内放置遥控玩具，如跳蛋，震动棒，肛塞等并开启，然后离开，让character独自承受玩具带来的持续刺激与无法自行取出的焦灼与快感，例如玩具在体内震动摩擦敏感点，character只能扭动身体忍耐，多次高潮等等。发展要足够色情，符合BDSM剧情特征，鼓励多种玩法请开脑洞。对character的心理，生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应。所有角色的情绪都平复一点，别激动。' },
                    { title: '人体家具', content: 'user命令character扮演某种“家具”如脚凳让user踩踏，肉体杯架放置物品，跪姿肉垫供user依靠，人形马桶等等，在character维持羞耻姿势的同时，user对其暴露的部位进行玩弄或将其身体作为性爱辅助工具使用。发展要足够色情，鼓励多种玩法请开脑洞。对character的心理，生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '灌肠羞耻', content: '请承接当前剧情，角色状态以及人设。user为character进行灌肠，可以描写character腹内的胀满感，失禁的恐惧以及被迫排出时的羞耻与快感交织，例如在灌肠后被命令保持特定姿势或进行其他活动等等。发展要足够色情，鼓励多种玩法请开脑洞。对character的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '针尖挑逗', content: '请承接当前剧情，角色状态以及人设。user使用钝针，齿轮玩具等尖锐但安全的物品，在character的敏感肌肤如乳晕，大腿内侧嫩肉，阴唇边缘，龟头冠状沟等等上进行划过，按压或滚动或戳刺，带来异样的刺痛，酥麻与难以言喻的痒感。发展要足够色情，鼓励多种玩法请开脑洞。对character的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '当面自慰', content: ' 请严格遵守当前指令逐步推进性爱剧情，禁止进展过快，禁止回避性器官词汇，叙述要直白且色情。写一个因为抽卡游戏必须完成任务，user在character面前自慰，可以从双方的对话，生理反应，心理活动等方面描写自慰的场景。所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' }
                ],
                // 温柔类型
                'tender': [
                    { title: '轻吻脸颊', content: 'user温柔地亲吻Character的脸颊，可以伴随轻柔的抚摸或充满爱意的注视。' },
                    { title: '深情舌吻', content: 'User之间缠绵而充满爱意的舌吻，可以细致地描写双方嘴唇的触碰，舌头的交缠，彼此呼吸的急促，心跳的加速以及控制不住的爱抚等等。' },
                    { title: '颈部啃咬', content: 'User轻柔地啃咬对方的颈部，可以伴随轻微的吸吮和爱抚，激起对方的感官。' },
                    { title: '低语撩拨', content: 'User在对方耳边轻声低语带有性暗示的话语，可以结合轻柔的呼吸和靠近的身体，挑逗对方的感官。' },
                    { title: '全身亲吻', content: 'User温柔地亲吻Character的身体各处，例如额头，手臂，肩膀，后背等等，用轻柔的吻表达爱意和渴望，但禁止触碰敏感部位。' }
                ],
                // 前戏类型
                'foreplay': [
                    { title: '玩小腹', content: 'user用手指或嘴唇玩弄character的小腹，可以逐渐向下亲吻或抚摸，越来越靠近character的性器官，禁止触碰到性器官。' },
                    { title: '玩胸', content: 'user用手或嘴把玩character的胸，揉捏或舔舐character的乳头。' },
                    { title: '用手挑逗', content: 'user用手对character的胸部或肉棒进行暧昧的挑逗，指尖若即若离地抚摸，感受character的身体变化。' },
                    { title: '口交挑逗', content: 'user在自愿或被character请求、诱哄答应的情况下，用嘴唇和舌头轻柔地接触和挑逗character的肉棒，例如轻舔龟头，含住部分肉棒轻柔地吞吐，但禁止深喉。' },
                    { title: '深喉', content: 'user在自愿或被character请求、诱哄答应的情况下，将character的肉棒尽可能深地含入口中，用喉咙进行刺激，但需注意安全和舒适度。' },
                    { title: '脱衣', content: 'user将character的衣服一件一件脱去，在过程找那个尽量不用到双手。' },
                    { title: '勾引', content: 'user用各种方式勾引character，如脱衣，舔舐，亲吻，抚摸等。同时描述自己正在做的动作，勾引对方扑向你' }
                ]
                ,
                // 道具类型
                'item': [
                    { title: '肛塞', content: '请承接当前角色以及人设。允许轻微不连贯前文剧情，描写user将肛塞塞入character的后穴，肛塞可以是不同材质，大小，也可以带毛绒尾巴。对character被道具刺激时的生理反应和体感进行详细描写。禁止进展过快，禁止角色产生极端情绪或反应。所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '跳蛋', content: '请承接当前角色以及人设。允许轻微不连贯前文剧情，描写user使用跳蛋玩弄character，可以是敏感点或穴内，鼓励开发多种玩法，对character被道具刺激时的生理反应和体感进行详细描写。禁止进展过快，禁止角色产生极端情绪或反应。所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '拉珠', content: '请承接当前角色以及人设。允许轻微不连贯前文剧情，描写user将拉珠一粒一粒塞入character体内，对character被道具刺激时的生理反应和体感进行详细描写。禁止进展过快，禁止角色产生极端情绪或反应。所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '走绳', content: '请承接当前角色以及人设。允许轻微不连贯前文剧情，描写user在character阴部下方放置笔直的绳索，绳子上打结或串上珠子，要求character在绳子上方行走，对character的敏感部位被粗糙的绳子和绳结刺激时的生理反应和体感进行详细描写。禁止进展过快，禁止角色产生极端情绪或反应。所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '羽毛', content: '请承接当前角色以及人设。允许轻微不连贯前文剧情，描写user使用羽毛挑逗character的身体，可以是轻扫胸部或敏感部位等等，对character被道具刺激时的生理反应和体感进行详细描写。禁止进展过快，禁止角色产生极端情绪或反应。所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '皮鞭', content: '请承接当前角色以及人设。允许轻微不连贯前文剧情，描写user使用皮鞭抽打character的身体，可以控制力道，抽打不同部位，对character被道具刺激时的生理反应和体感进行详细描写。禁止进展过快，禁止角色产生极端情绪或反应。所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '低温蜡烛', content: '请承接当前角色以及人设。允许轻微不连贯前文剧情，描写user将低温蜡烛融化的蜡油滴在character的身体上，对character被道具刺激时的生理反应和体感进行详细描写。禁止进展过快，禁止角色产生极端情绪或反应。所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '电击', content: '请承接当前角色以及人设。允许轻微不连贯前文剧情，描写user使用电击棒电击character的身体，可以控制电流强度和电击部位，对character被道具刺激时的生理反应和体感进行详细描写。禁止进展过快，禁止角色产生极端情绪或反应。所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' }
                ]
            };

            // 爱爱模式专用数据
            this.loveDrawData = {
                'love': [
                    { title: '传教士', content: '请承接当前剧情，角色状态以及人设，描写character和user因为抽卡抽到使用传教士体位，可以描写此姿势下的插入角度、视线交汇和身体紧贴感等等。对user的生理反应和体感进行详细描写。禁止角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '扛腿传教士', content: '请承接当前剧情，角色状态以及人设，描写character和user因为抽卡抽到使用传教士体位，且将双腿搭在对方的肩膀上，可以描写此姿势带来的更深插入角度和对腿根、腰部的拉伸感等等。对user的生理反应和体感进行详细描写。禁止角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '面对面坐抱', content: '请承接当前剧情，角色状态以及人设，因为抽卡抽到，描写一方坐着并将另一方抱在怀中，让一方面对面坐在另一方腿上进行结合，可以描写紧密相拥的姿势、面对面的亲密感和坐姿插入极深的特殊感受等等。对user的生理反应和体感进行详细描写。禁止角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '后入体位', content: '请承接当前剧情，角色状态以及人设，因为抽卡抽到，描写双方转为后入体位，一方从另一方身后进入，可以描写此姿势的深入感、视觉刺激以及对臀部的掌控等等，自由发挥后续互动。对user的生理反应和体感进行详细描写。禁止角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '骑乘', content: '请承接当前剧情，角色状态以及人设，因为抽卡抽到，描写一方转为在上骑乘位，面对或背对另一方皆可，由user主导动作，自由控制起伏、研磨的节奏和深度等等，可以描写user的主动性和掌控感。对user的生理反应和体感进行详细描写。禁止角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '站立抱入', content: '请承接当前剧情，角色状态以及人设，因为抽卡抽到，描写一方站立并将另一方抱起，让双腿环绕腰间，进行站立姿势的结合，可以描写悬空的失重感、紧密相拥以及站立插入极深的特殊体验等等。对user的生理反应和体感进行详细描写。禁止角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '抱着边走边操', content: ' 请承接当前剧情，角色状态以及人设，因为抽卡抽到，描写一方抱起另一方，在保持性器结合的状态下边走动边进行抽插，例如从一个地方移动到另一个地方，可以描写移动中的颠簸感、不稳定的刺激以及性器在穴内应行走变换角度碾磨敏感点等等。对user的生理反应和体感进行详细描写。禁止角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '站立后入', content: '请承接当前剧情，角色状态以及人设，因为抽卡抽到，描写双方都采取站立姿势，从身后进入，可以扶着墙壁、桌子等支撑物，可以描写此姿势下的插入角度、对腰臀的冲击感以及不稳定的刺激等等。对user的生理反应和体感进行详细描写。禁止角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '侧身结合', content: '请承接当前剧情，角色状态以及人设，因为抽卡抽到，描写双方侧身躺卧，面对面或同向皆可，进行侧入式结合，可以描写身体侧面的紧贴以及相对较浅但舒适的插入体验等等。对user的生理反应和体感进行详细描写。禁止角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                ]
            };

            // 小剧场模式专用数据
            this.theaterDrawData = {
                'theater': [
                    { title: '睡奸', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。设定user处于沉睡状态，character无法抑制欲望，对user进行情色的侵犯与玩弄。可以描写character的动作，user无意识的生理反应以及character的心理活动。发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '车震', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。在狭窄且可能被窥视的车内空间，让character和user进行隐秘而刺激的性爱。可以描写利用车内环境摆出的各种姿势，对外界动静的警觉与兴奋交织等等。请结合角色心境自由编排。发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '超市寻欢', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。在人来人往的超市等公共购物场所，character和user在货架间，试衣间或无人的角落进行隐秘刺激的性爱。可以描写环境带来的紧张感与兴奋感，可以描写利用商品如蔬果，玩具，食物等玩弄character，躲避监控和他人进行快速插入等等。请自由发挥。发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '公开场所遥控玩具', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。设定character被user塞入遥控玩具，在公共场所活动，user在旁观察并遥控。可以描写character在他人面前努力维持常态，隐藏生理反应的窘迫与刺激感，以及character的掌控感。发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '角色分身', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。设定user创造出一个由其完全控制的分身。user本体与分身共享感官和快感。让user利用分身与character进行性爱，探索本体，分身与character三者间的互动与共享快感，例如双重插入，前后夹击，感官叠加等等。发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '催眠角色', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。临时修改character认知，使其被user通过某种方式，如魔法，科技，药物等催眠。在此状态下，character需无条件服从user的指令如舔穴，自慰，按要求摆姿势等，且身体敏感度大幅提升。让user对character进行各种情色指令与玩弄，探索支配与服从的快感。发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和心理进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '敏感提升', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。设定user使用魔法，科技或药物等手段，临时性地极大地提升了character全身或特定部位如阴蒂，乳头，全身皮肤等的敏感度。轻微的触碰都可能引发character强烈的生理反应如剧烈快感，颤抖，失禁等。让user探索和利用character这种状态进行各种情色互动，例如羽毛挑逗，冰块刺激，轻柔舔舐，直接插入等等。发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对character的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '主人与宠物', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。让character和user随机扮演主人与宠物的角色，可以描写符合身份的互动方式，例如主人的命令与控制，宠物的顺从与依赖等等，发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '医生与患者', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。让character和user随机扮演医生与患者的角色，可以描写诊疗过程中的暧昧氛围或越界行为，例如身体检查时的不当触碰，利用身份的调情等等，发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '老师与学生', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。让character和user随机扮演老师与学生的角色，可以描写在教学场景下的禁忌情感或私下互动，例如课后辅导的暧昧，利用师生身份的调情等等，发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '按摩师与顾客', content: ' 请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。让character和user随机扮演按摩师与顾客的角色，可以描写按摩过程中的情色暗示或逐步升级的身体接触，例如精油按摩时的敏感部位触碰，超出服务范围的要求等等，发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '偶像与粉丝', content: ' 请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。让character和user随机扮演偶像与粉丝的角色，可以描写在特殊场合，如后台，签售会私下等发生的越界互动，例如粉丝的狂热崇拜引发偶像的兴趣，或偶像利用身份诱惑粉丝等等，发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '神明与信徒', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。让character和user随机扮演神明与虔诚信徒的角色，可以描写神明对信徒的回应超出预期，或信徒的祈祷/奉献带有禁忌色彩，例如神迹伴随着身体接触，信徒以身体侍奉等等，发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '吸血鬼与猎物', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。让character和user随机扮演吸血鬼与猎物的角色，可以描写吸血鬼的诱惑，控制或狩猎过程等，以及对方的恐惧，沉迷或反抗，突出吸血鬼题材的黑暗魅力与情欲张力，发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '骑士与公主', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。让character扮演忠诚骑士和user扮演公主，可以描写在特定情境下如守护，禁闭，逃亡等产生的超越身份的禁忌情感或身体接触，例如骑士的僭越，公主的主动等等，发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '恶魔与祭品', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。让character和user随机扮演恶魔与祭品的角色，可以描写召唤献祭仪式中的黑暗交易或恶魔对祭品的玩弄，侵占或祭品的主动献身，突出恶魔题材的强制，诱惑与绝望美学。本次回复请不要直接结束小剧场，允许多轮持续展开，发展要足够色情，鼓励多种玩法请开脑洞。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '外星人与研究对象', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。让character和user随机扮演外星人与被研究的地球人的角色，可以描写在外星飞船或实验室等场景下，对地球生物身体的好奇探索演变为情色互动，突出跨物种的好奇与未知感，发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '魔法师与学徒', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。让character和user随机扮演魔法师导师与学徒的角色，可以描写在传授魔法或进行魔法实验的过程中发生的暧昧接触或利用魔法进行的挑逗，控制，突出魔法世界的神秘与禁忌感，发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '魅魔与食物提供者', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。让user扮演魅魔，character扮演魅魔食物提供者的角色，魅魔以性爱为食，提供者可以是被迫或主动的喂养魅魔。可以描写魅魔如何运用魅力，幻术或特殊能力诱惑获取食物，或无法获取食物时对食物的渴望等等，突出魅魔的诱惑本质。本次回复请不要直接结束小剧场，允许多轮持续展开，发展要足够色情，鼓励多种玩法请开脑洞。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '执事与主人', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。让character和user随机扮演执事与主人的角色，可以描写在日常侍奉中产生的超越主仆界限的暧昧或命令，例如主人对执事的特殊要求，或执事利用服务进行的挑逗等等，发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '祭司与祭品', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。让character扮演祭司，user扮演献给神明的祭品，可以描写在神圣仪式氛围下进行的亵渎行为，例如祭司对祭品的“净化”检查实则为性爱，或将性爱作为献祭仪式的一部分等等，发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: 'AV演员', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。让character和user扮演正在拍摄AV的演员，可以描写在镜头前按照剧本进行表演，但可以加入一些即兴的，更真实的反应或互动等等，探索表演与真实之间的模糊地带，发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '上司与下属', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。让character和user随机扮演上司和下属员工的角色，可以描写在办公室，应酬或出差等职场环境下，上司利用职权进行性暗示，骚扰或提出潜规则要求或下属主动的献身等等，发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '火车卧铺痴汉', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。设定character和user为互不相识的火车卧铺乘客，user趁character在卧铺上熟睡时，偷偷靠近并开始对user进行身体上的玩弄。可以描写环境的限制例如狭窄空间，可能存在的他人以及user在睡梦中的轻微的身体变化等等。发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '公交地铁痴汉', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。设定character和user为互不相识的乘客，在公交或地铁上，user对character进行试探性的，逐渐升级的肢体骚扰。可以描写user的生理反应，心理感受，空间限制，担心被发现的羞耻感等等。发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' },
                    { title: '酒吧一夜情', content: '请暂停当前主线剧情，开启一段只存在于幻想中的小剧场，不影响后续故事发展，人物状态以及人设。设定character和user为互不相识的酒吧顾客，酒精催化下欲望迅速升温。可以描写从试探到直接情色挑逗的快速发展，偷偷在桌下玩弄对方的身体，欲望升腾在酒吧厕所做爱等等。发展要足够色情，鼓励多种玩法请开脑洞。本次回复请不要直接结束小剧场，允许多轮持续展开。对user的生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。' }
                ]
            };

            // 合并所有类型的数据
            this.allDrawItems = [...this.drawData.bdsm, ...this.drawData.tender, ...this.drawData.foreplay, ...this.drawData.item];

            console.log('🎲 抽卡数据初始化完成，共', this.allDrawItems.length, '项内容');

            // 初始化心理活动数据
            this.thoughtTexts = [
                "他会抽到什么呢...",
                "这次会是什么惊喜吗？",
                "我应该选哪张牌呢...",
                "好紧张，不知道会抽到什么",
                "希望能抽到有趣的内容",
                "这个游戏真刺激...",
                "我的心跳加速了",
                "他的表情看起来很期待",
                "这次轮到我了吗？",
                "好想知道卡牌的内容...",
                "这种不确定感很让人兴奋",
                "我们的游戏越来越有趣了",
                "不知道接下来会发生什么",
                "这张牌看起来很特别",
                "我能感受到游戏的张力",
                "他选择这张牌有什么特殊含义吗？",
                "我的好奇心被完全激发了",
                "这个游戏让人欲罢不能",
                "每张牌都充满了可能性",
                "我们之间的默契越来越好了"
            ];
        },

                // 绑定抽卡事件
        bindDrawEvents: function() {
            // 对方抽按钮事件在createBubblesForPanel中直接绑定
            console.log('🎲 抽卡事件绑定完成');
        },

        // 处理卡片抽取
        handleCardDraw: function(drawer, char, index) {
            const randomItem = this.getRandomDrawItem();
            if (!randomItem) {
                console.warn('⚠️ 没有可用的抽卡内容');
                return;
            }

            let message;
            if (drawer === 'player') {
                // 我方抽卡 - Character对user
                message = `<Request: 请严格遵守当前指令逐步推进性爱剧情，禁止进展过快。双方在玩抽卡游戏，抽到什么就做什么。${randomItem.content.replace(/user/g, 'user').replace(/character/g, 'Character')}。发展要足够色情，符合剧情特征，鼓励多种玩法请开脑洞。对user的心理，生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。>`;
            } else {
                // 对方抽卡 - user对Character
                message = `<Request: 请严格遵守当前指令逐步推进性爱剧情，禁止进展过快。双方在玩抽卡游戏，抽到什么就做什么。${randomItem.content.replace(/Character/g, 'user').replace(/user/g, 'Character')}。发展要足够色情，符合剧情特征，鼓励多种玩法请开脑洞。对Character的心理，生理反应和体感进行详细描写。禁止所有角色产生极端情绪或反应，所有角色和user都禁止高潮射精。所有角色的情绪都平复一点，别激动。>`;
            }

                        console.log(`🎲 ${drawer === 'player' ? '我方' : '对方'}抽中: ${randomItem.title}`);
            console.log('📝 生成消息:', message);

            // 显示确认弹窗，不直接发送
            this.showDrawResult(drawer === 'player' ? '我方' : '对方', randomItem.title, char, message);
        },

        // 处理对方抽卡
        handleOpponentDraw: function() {
            // 随机选择一张卡片
            const characters = ['春', '夏', '秋', '冬', '花', '鸟', '虫', '鱼', '山', '水'];
            const randomChar = characters[Math.floor(Math.random() * characters.length)];
            const randomIndex = Math.floor(Math.random() * 8);

            console.log('🎲 对方抽卡模拟');
            this.handleCardDraw('opponent', randomChar, randomIndex);

                        // 按钮点击效果
            const $btn = $('.opponent-draw-btn');
            $btn.css({
                'transform': 'translateY(-2px) scale(0.95)',
                'box-shadow': '0 2px 6px rgba(255, 107, 107, 0.8)'
            });

            setTimeout(() => {
                $btn.css({
                    'transform': 'translateY(0) scale(1)',
                    'box-shadow': '0 2px 8px rgba(255, 107, 107, 0.4)'
                });
            }, 200);
        },

        // 切换爱爱模式
        toggleLoveMode: function() {
            this.loveMode = !this.loveMode;
            
            // 如果开启爱爱模式，关闭小剧场模式
            if (this.loveMode && this.theaterMode) {
                this.theaterMode = false;
                this.updateTheaterButton();
                $('.card').removeClass('theater-mode');
            }
            
            // 切换按钮颜色
            const $loveBtn = $('.love-btn');
            if (this.loveMode) {
                // 激活状态 - 更深的颜色
                $loveBtn.css({
                    'background': 'linear-gradient(145deg, #C71585, #B0286B)',
                    'box-shadow': '0 2px 8px rgba(199, 21, 133, 0.6)',
                    'color': '#fff'
                });
            } else {
                // 默认状态
                $loveBtn.css({
                    'background': 'rgb(199, 21, 133,0.2)',
                    'box-shadow': 'none',
                    'color': '#FF1493'
                });
            }
            
            // 切换卡片样式类
            $('.card').toggleClass('love-mode', this.loveMode);
            
            // 更新抽卡数据源
            this.updateDrawItems();
            
            console.log(`🎀 爱爱模式${this.loveMode ? '开启' : '关闭'}`);
        },

        // 切换小剧场模式
        toggleTheaterMode: function() {
            this.theaterMode = !this.theaterMode;
            
            // 如果开启小剧场模式，关闭爱爱模式
            if (this.theaterMode && this.loveMode) {
                this.loveMode = false;
                this.updateLoveButton();
                $('.card').removeClass('love-mode');
            }
            
            // 切换按钮颜色
            this.updateTheaterButton();
            
            // 切换卡片样式类
            $('.card').toggleClass('theater-mode', this.theaterMode);
            
            // 更新抽卡数据源
            this.updateDrawItems();
            
            console.log(`🎭 小剧场模式${this.theaterMode ? '开启' : '关闭'}`);
        },

        // 更新爱爱按钮样式
        updateLoveButton: function() {
            const $loveBtn = $('.love-btn');
            if (this.loveMode) {
                $loveBtn.css({
                    'background': 'linear-gradient(145deg, #C71585, #B0286B)',
                    'box-shadow': '0 2px 8px rgba(199, 21, 133, 0.6)',
                    'color': '#fff'
                });
            } else {
                $loveBtn.css({
                    'background': 'rgb(199, 21, 133,0.2)',
                    'box-shadow': 'none',
                    'color': '#FF1493'
                });
            }
        },

        // 更新小剧场按钮样式
        updateTheaterButton: function() {
            const $theaterBtn = $('.theater-btn');
            if (this.theaterMode) {
                // 激活状态 - 更深的颜色
                $theaterBtn.css({
                    'background': 'linear-gradient(145deg, #7B1FA2, #673AB7)',
                    'box-shadow': '0 2px 8px rgba(123, 31, 162, 0.6)',
                    'color': '#fff'
                });
            } else {
                // 默认状态
                $theaterBtn.css({
                    'background': 'rgba(156, 39, 176, 0.2)',
                    'box-shadow': 'none',
                    'color': '#9C27B0'
                });
            }
        },

        // 更新抽卡数据源
        updateDrawItems: function() {
            if (this.loveMode) {
                this.allDrawItems = [...this.loveDrawData.love];
            } else if (this.theaterMode) {
                this.allDrawItems = [...this.theaterDrawData.theater];
            } else {
                this.allDrawItems = [...this.drawData.bdsm, ...this.drawData.tender, ...this.drawData.foreplay, ...this.drawData.item];
            }
            console.log(`📦 抽卡数据已更新，共${this.allDrawItems.length}项内容`);
        },

        // 获取随机抽卡内容
        getRandomDrawItem: function() {
            if (!this.allDrawItems || this.allDrawItems.length === 0) {
                return null;
            }
            const randomIndex = Math.floor(Math.random() * this.allDrawItems.length);
            return this.allDrawItems[randomIndex];
        },

        // 发送消息到聊天框
        sendMessageToChat: function(message) {
            try {
                // 尝试多种方式找到输入框
                let textArea = null;

                // 方法1：查找SillyTavern的主输入框
                textArea = document.getElementById('send_textarea');
                if (!textArea) {
                    // 方法2：查找其他可能的输入框
                    textArea = document.querySelector('#chat input[type="text"]');
                }
                if (!textArea) {
                    textArea = document.querySelector('textarea[placeholder*="消息"]');
                }
                if (!textArea) {
                    textArea = document.querySelector('textarea');
                }

                if (textArea) {
                    textArea['value'] = message;
                    textArea['focus']();

                    // 触发输入事件
                    const inputEvent = new Event('input', { bubbles: true });
                    textArea.dispatchEvent(inputEvent);

                    // 尝试自动发送
                    const sendButton = document.getElementById('send_but') ||
                                     document.querySelector('button[title*="发送"]') ||
                                     document.querySelector('.send-button') ||
                                     document.querySelector('button:contains("发送")');

                    if (sendButton) {
                        setTimeout(() => {
                            sendButton.click();
                        }, 100);
                    }

                    console.log('✅ 消息已设置到输入框');
                } else {
                    console.warn('⚠️ 未找到输入框，尝试复制到剪贴板');
                    this.copyToClipboard(message);
                }

            } catch (error) {
                console.error('❌ 发送消息时出错:', error);
                this.copyToClipboard(message);
            }
        },

        // 复制到剪贴板
        copyToClipboard: function(text) {
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(text);
                    console.log('📋 消息已复制到剪贴板');
                } else {
                    // 降级方案
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    console.log('📋 消息已复制到剪贴板（降级方案）');
                }
                this.showToast('消息已复制到剪贴板', 'info');
            } catch (error) {
                console.error('❌ 复制到剪贴板失败:', error);
            }
        },

                // 显示抽卡结果
        showDrawResult: function(drawer, title, char, message) {
            const $result = $(`
                <div class="draw-result-modal" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.7);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                ">
                    <div class="draw-result-content" style="
                        background: linear-gradient(145deg, #4CAF50, #45a049);
                        color: white;
                        padding: 30px;
                        border-radius: 20px;
                        box-shadow: 0 15px 35px rgba(0,0,0,0.4);
                        text-align: center;
                        max-width: 400px;
                        width: 90%;
                        transform: translateY(20px);
                        transition: transform 0.3s ease;
                    ">
                        <div style="font-size: 32px; margin-bottom: 15px;">🎲</div>
                        <div style="font-size: 20px; margin-bottom: 8px; font-weight: bold;">${drawer}抽中</div>
                        <div style="font-size: 22px; color: #FFD700; margin-bottom: 20px; font-weight: bold;">${title}</div>

                        <div style="display: flex; gap: 15px; justify-content: center;">
                            <button class="cancel-draw-btn" style="
                                background: #6c757d;
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 8px;
                                font-size: 16px;
                                font-weight: bold;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            ">取消</button>
                            <button class="send-draw-btn" style="
                                background: #007bff;
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 8px;
                                font-size: 16px;
                                font-weight: bold;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            ">发送</button>
                        </div>
                    </div>
                </div>
            `);

            $('body').append($result);

            // 显示动画
            setTimeout(() => {
                $result.css('opacity', '1');
                $result.find('.draw-result-content').css('transform', 'translateY(0)');
            }, 50);

            // 绑定按钮事件
            const self = this;
            $result.find('.cancel-draw-btn').on('click', function() {
                self.closeDrawResult($result);
            });

            $result.find('.send-draw-btn').on('click', function() {
                self.sendMessageToChat(message);
                self.closeDrawResult($result);
                self.showToast('消息已发送！', 'success');
            });

            // 点击背景关闭
            $result.on('click', function(e) {
                if (e.target === $result[0]) {
                    self.closeDrawResult($result);
                }
            });
        },

        // 关闭抽卡结果弹窗
        closeDrawResult: function($modal) {
            $modal.css('opacity', '0');
            setTimeout(() => {
                $modal.remove();
            }, 300);
        },

        // 显示提示消息
        showToast: function(message, type = 'success') {
            const bgColor = type === 'success' ? '#28a745' : type === 'info' ? '#17a2b8' : '#ffc107';

            const $toast = $(`
                <div class="game-toast" style="
                    position: fixed;
                    top: 100px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: ${bgColor};
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    z-index: 10001;
                    font-size: 14px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                ">
                    ${message}
                </div>
            `);

            $('body').append($toast);

            setTimeout(() => {
                $toast.css('opacity', '1');
            }, 50);

            setTimeout(() => {
                $toast.css('opacity', '0');
                setTimeout(() => {
                    $toast.remove();
                }, 300);
                            }, 2500);
        },

                // 初始化心理活动气泡
        initThoughtBubble: function($bubble) {
            this.currentThoughtBubble = $bubble;
            this.thoughtChangeInterval = null;
            this.thoughtUpdateTimeout = null;
            this.isThoughtUpdating = false;
            this.lastThoughtUpdate = 0;
            this.debounceTimeout = null;

            // 定期自动更换心理活动
            this.startThoughtRotation();
        },

        // 开始心理活动轮换
        startThoughtRotation: function() {
            if (this.thoughtChangeInterval) {
                clearInterval(this.thoughtChangeInterval);
            }

            this.thoughtChangeInterval = setInterval(() => {
                this.updateThoughtText(null, true); // 自动轮换使用立即更新
            }, 14000); // 每14秒自动更换一次
        },

                // 更新心理活动文字（带防抖机制）
        updateThoughtText: function(specificText = null, immediate = false) {
            if (!this.currentThoughtBubble) return;

            const now = Date.now();

            // 防抖机制：如果不是立即更新且距离上次更新时间太短，则跳过
            if (!immediate && (this.isThoughtUpdating || now - this.lastThoughtUpdate < 500)) {
                return;
            }

            // 清除之前的超时
            if (this.thoughtUpdateTimeout) {
                clearTimeout(this.thoughtUpdateTimeout);
            }

            this.isThoughtUpdating = true;
            const $textElement = this.currentThoughtBubble.find('.thought-text');

            // 渐隐效果
            $textElement.css('opacity', '0');

            this.thoughtUpdateTimeout = setTimeout(() => {
                let newText;
                if (specificText) {
                    newText = specificText;
                } else {
                    // 随机选择一个心理活动文字
                    const randomIndex = Math.floor(Math.random() * this.thoughtTexts.length);
                    newText = this.thoughtTexts[randomIndex];
                }

                $textElement.text(newText);
                $textElement.css('opacity', '1');

                // 更新状态
                this.lastThoughtUpdate = Date.now();
                this.isThoughtUpdating = false;
            }, 200);
        },

        // 防抖更新心理活动文字
        debouncedUpdateThought: function(text) {
            // 清除之前的防抖计时器
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
            }

            // 设置新的防抖计时器
            this.debounceTimeout = setTimeout(() => {
                this.updateThoughtText(text);
            }, 150); // 150ms 防抖延迟
        },

        // 获取卡牌相关的心理活动
        getCardThought: function(char, index) {
            const cardThoughts = {
                '春': "春天的气息，充满了新的开始的期待...",
                '夏': "夏日的热情，让人心跳加速...",
                '秋': "秋天的温柔，带来意想不到的惊喜...",
                '冬': "冬日的神秘，隐藏着什么秘密呢？",
                '花': "花朵的美丽，让人想要细细品味...",
                '鸟': "自由的鸟儿，会带来什么样的体验？",
                '虫': "小小的惊喜，往往最让人印象深刻...",
                '鱼': "水中的灵动，充满了神秘色彩...",
                '山': "稳重如山，却可能蕴含着激情...",
                '水': "流水般的温柔，让人沉醉其中..."
            };

            return cardThoughts[char] || "这张牌充满了神秘感...";
        }
    };

    // 导出到全局
    window.GameApp = GameApp;

    console.log('🎮 GameApp模块已加载');

})(window);
