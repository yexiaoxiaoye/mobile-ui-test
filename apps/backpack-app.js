// 背包应用
(function(window) {
    'use strict';
    
    const BackpackApp = {
        // 初始化背包应用
        init: function() {
            this.createInterface();
            this.bindEvents();
            console.log('背包应用已初始化');
        },
        
        // 创建界面
        createInterface: function() {
            const $backpackInterface = $(`
                <div id="backpack_interface" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; max-width: 700px; height: 80vh; background: linear-gradient(135deg, #9C27B0, #7B1FA2); border-radius: 20px; z-index: 500; overflow: hidden;">
                    <div class="backpack-header" style="height: 60px; background: rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; color: white;">
                        <h3 style="margin: 0;">背包物品</h3>
                        <div class="close-backpack" style="cursor: pointer; font-size: 24px;">×</div>
                    </div>
                    <div class="backpack-content" style="padding: 20px; height: calc(100% - 60px); overflow-y: auto; background: white;">
                        <div id="backpack_items" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;"></div>
                    </div>
                </div>
            `);
            $('body').append($backpackInterface);
        },
        
        // 绑定事件
        bindEvents: function() {
            $('.close-backpack').on('click', function() {
                $('#backpack_interface').hide();
            });
        },
        
        // 显示背包应用
        show: async function() {
            console.log('正在加载背包应用...');
            $('#backpack_interface').show();
            
            try {
                const items = await window['HQDataExtractor'].extractBackpackItems();
                const $itemsContainer = $('#backpack_items');
                $itemsContainer.empty();
                
                if (items.length > 0) {
                    items.forEach(item => {
                        const $itemCard = $(`
                            <div class="item-card" style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: white; text-align: center; cursor: pointer;" data-item-name="${item.name}" data-item-type="${item.type}" data-item-count="${item.count}" data-item-desc="${item.description}">
                                <h5 style="margin: 0 0 10px 0; color: #333;">${item.name}</h5>
                                <p style="margin: 5px 0; color: #666;"><strong>类型:</strong> ${item.type}</p>
                                <p style="margin: 5px 0; color: #666;"><strong>数量:</strong> ${item.count}</p>
                                <p style="margin: 5px 0; color: #666; font-size: 12px;">${item.description}</p>
                                <p style="margin: 10px 0 0 0; color: #007bff; font-size: 12px;">点击使用物品</p>
                            </div>
                        `);
                        
                        // 为物品卡片添加点击事件
                        $itemCard.on('click', () => {
                            this.showUseItemDialog(item);
                        });
                        
                        // 鼠标悬停效果
                        $itemCard.on('mouseenter', function() {
                            $(this).css('background-color', '#f0f8ff');
                        }).on('mouseleave', function() {
                            $(this).css('background-color', 'white');
                        });
                        
                        $itemsContainer.append($itemCard);
                    });
                } else {
                    $itemsContainer.html('<p style="text-align: center; color: #999; grid-column: 1 / -1;">背包空空如也</p>');
                }
                
            } catch (error) {
                console.error('加载背包数据时出错:', error);
            }
        },
        
        // 显示使用物品对话框
        showUseItemDialog: function(item) {
            const $dialog = $(`
                <div id="use_item_dialog" style="position: absolute; z-index: 10005; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;">
                    <div style="background: white; border-radius: 10px; padding: 30px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                        <h3 style="margin: 0 0 20px 0; color: #333; text-align: center;">使用物品</h3>
                        <div style="margin-bottom: 20px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
                            <h4 style="margin: 0 0 10px 0; color: #007bff;">${item.name}</h4>
                            <p style="margin: 5px 0; color: #666;"><strong>类型:</strong> ${item.type}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>数量:</strong> ${item.count}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>描述:</strong> ${item.description}</p>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; color: #333; font-weight: bold;">使用目标:</label>
                            <input type="text" id="use_target_input" placeholder="请输入使用目标（如：角色名称、自己等）" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
                            <p style="margin: 8px 0 0 0; color: #999; font-size: 12px;">例如：对小明使用、对自己使用、对敌人使用等</p>
                        </div>
                        <div style="display: flex; gap: 15px; justify-content: center;">
                            <button id="confirm_use_item" style="padding: 12px 30px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">确认使用</button>
                            <button id="cancel_use_item" style="padding: 12px 30px; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">取消</button>
                        </div>
                    </div>
                </div>
            `);
            
            $('body').append($dialog);
            
            // 自动聚焦到输入框
            setTimeout(() => {
                $('#use_target_input').focus();
            }, 100);
            
            // 绑定按钮事件
            $('#confirm_use_item').on('click', () => {
                const target = String($('#use_target_input').val() || '').trim();
                if (target) {
                    this.useItem(item, target);
                    $dialog.remove();
                } else {
                    alert('请输入使用目标！');
                }
            });
            
            $('#cancel_use_item').on('click', () => {
                $dialog.remove();
            });
            
            // 点击背景关闭对话框
            $dialog.on('click', function(e) {
                if (e.target === this) {
                    $(this).remove();
                }
            });
            
            // 支持回车键确认
            $('#use_target_input').on('keypress', function(e) {
                if (e.which === 13) { // 回车键
                    $('#confirm_use_item').click();
                }
            });
        },
        
        // 使用物品并发送快捷回复
        useItem: function(item, target) {
            console.log('正在使用物品:', item, '目标:', target);
            
            const self = this; // 保存this引用
            
            // 延迟执行，避免干扰正在进行的发送操作
            setTimeout(() => {
                try {
                    // 检查聊天输入框是否空闲 - 使用jQuery方式避免类型错误
                    const $originalInput = $('#send_textarea');
                    const $sendButton = $('#send_but');
                    
                    // 检查元素是否存在
                    if ($originalInput.length > 0 && $sendButton.length > 0) {
                        
                        const isDisabled = $originalInput.prop('disabled');
                        const currentValue = $originalInput.val() || '';
                        
                        if (!isDisabled && 
                            !$sendButton.hasClass('disabled') && 
                            currentValue === '') {
                            
                            // 构造消息文本
                            const message = `对${target}使用了${item.name}`;
                            $originalInput.val(message);
                            
                            // 触发输入事件，让系统知道输入框内容已更改
                            $originalInput.trigger('input');
                            
                            // 给系统一点时间处理输入事件
                            setTimeout(() => {
                                // 如果发送按钮可用，点击发送
                                if (!$sendButton.hasClass('disabled')) {
                                    $sendButton.click();
                                    console.log('物品使用消息已发送');
                                }
                            }, 200);
                            
                            // 显示成功提示
                            self.showSuccessMessage(`成功使用物品：${item.name}`);
                            
                        } else {
                            console.warn('聊天输入框不可用或正在忙碌中');
                            alert('当前聊天输入框不可用，请稍后再试');
                        }
                    } else {
                        console.warn('未找到聊天输入框元素');
                        alert('未找到聊天输入框，请确保页面已正确加载');
                    }
                } catch (error) {
                    console.error('发送物品使用消息时出错：', error);
                    alert('发送消息时出错，请手动发送');
                }
            }, 500);
        },
        
        // 显示成功消息
        showSuccessMessage: function(message) {
            const $successMsg = $(`
                <div style="position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10010; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                    <i style="margin-right: 8px;">✓</i>${message}
                </div>
            `);
            
            $('body').append($successMsg);
            
            // 3秒后自动消失
            setTimeout(() => {
                $successMsg.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 3000);
        }
    };
    
    // 导出到全局
    window['BackpackApp'] = BackpackApp;
    
})(window); 