// 抽卡应用
(function(window) {
    'use strict';
    
    const ChoukaApp = {
        // 初始化抽卡应用
        init: function() {
            this.createInterface();
            this.bindEvents();
            console.log('抽卡应用已初始化');
        },
        
        // 创建界面
        createInterface: function() {
            const $choukaInterface = $(`
                <div id="chouka_interface" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; max-width: 700px; height: 80vh; background: linear-gradient(135deg, #FF9800, #F57C00); border-radius: 20px; z-index: 500; overflow: hidden;">
                    <div class="chouka-header" style="height: 60px; background: rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; color: white;">
                        <h3 style="margin: 0;">抽卡系统</h3>
                        <div class="close-chouka" style="cursor: pointer; font-size: 24px;">×</div>
                    </div>
                    <div class="chouka-content" style="padding: 20px; height: calc(100% - 60px); overflow-y: auto; background: white; text-align: center;">
                        <div class="chouka-stats" style="margin-bottom: 30px; padding: 20px; background: #f5f5f5; border-radius: 10px;">
                            <h4>抽卡统计</h4>
                            <div id="chouka_history"></div>
                        </div>
                        <div class="chouka-action">
                            <button id="chouka_btn" style="padding: 15px 30px; font-size: 18px; background: #FF9800; color: white; border: none; border-radius: 10px; cursor: pointer;">开始抽卡</button>
                            <div id="chouka_result" style="margin-top: 20px; min-height: 100px; display: flex; align-items: center; justify-content: center; background: #f9f9f9; border-radius: 10px;"></div>
                        </div>
                    </div>
                </div>
            `);
            $('body').append($choukaInterface);
        },
        
        // 绑定事件
        bindEvents: function() {
            const self = this;
            
            $('.close-chouka').on('click', function() {
                $('#chouka_interface').hide();
            });
            
            $('#chouka_btn').on('click', function() {
                self.performChouka();
            });
        },
        
        // 显示抽卡应用
        show: async function() {
            console.log('正在加载抽卡应用...');
            $('#chouka_interface').show();
            
            try {
                // 从聊天记录中提取抽卡相关信息
                const messages = await window.HQDataExtractor.parseChatMessages();
                const choukaRegex = /\[抽卡结果\|(.*?)\|(.*?)\|(.*?)\]/gs;
                const choukaResults = window.HQDataExtractor.extractDataWithRegex(messages, choukaRegex, '抽卡结果');
                
                const $historyContainer = $('#chouka_history');
                if (choukaResults.length > 0) {
                    const recentResults = choukaResults.slice(-5); // 显示最近5次抽卡
                    $historyContainer.html(`
                        <p><strong>总抽卡次数:</strong> ${choukaResults.length}</p>
                        <p><strong>最近抽卡记录:</strong></p>
                        ${recentResults.map(result => {
                            const [cardName, rarity, time] = result.groups;
                            return `<div style="margin: 5px 0; padding: 5px; background: white; border-radius: 5px;">
                                ${cardName} (${rarity}) - ${time}
                            </div>`;
                        }).join('')}
                    `);
                } else {
                    $historyContainer.html('<p>暂无抽卡记录</p>');
                }
                
            } catch (error) {
                console.error('加载抽卡数据时出错:', error);
            }
        },
        
        // 执行抽卡
        performChouka: function() {
            const cards = [
                { name: '普通卡片', rarity: 'N', probability: 0.6 },
                { name: '稀有卡片', rarity: 'R', probability: 0.25 },
                { name: '超稀有卡片', rarity: 'SR', probability: 0.12 },
                { name: '传说卡片', rarity: 'SSR', probability: 0.03 }
            ];
            
            const random = Math.random();
            let cumulativeProbability = 0;
            let selectedCard = cards[0];
            
            for (const card of cards) {
                cumulativeProbability += card.probability;
                if (random <= cumulativeProbability) {
                    selectedCard = card;
                    break;
                }
            }
            
            const $resultContainer = $('#chouka_result');
            $resultContainer.html(`
                <div style="text-align: center;">
                    <h3 style="color: ${selectedCard.rarity === 'SSR' ? '#ff6b6b' : selectedCard.rarity === 'SR' ? '#ff9800' : selectedCard.rarity === 'R' ? '#9c27b0' : '#666'};">
                        ${selectedCard.name}
                    </h3>
                    <p style="font-size: 18px; font-weight: bold;">${selectedCard.rarity}</p>
                    <p style="color: #666;">恭喜获得新卡片！</p>
                </div>
            `);
            
            // 模拟保存抽卡结果到聊天记录
            console.log(`抽卡结果: ${selectedCard.name} (${selectedCard.rarity})`);
        }
    };
    
    // 导出到全局
    window.ChoukaApp = ChoukaApp;
    
})(window); 