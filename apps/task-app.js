// 任务应用
(function(window) {
    'use strict';
    
    const TaskApp = {
        currentTasks: null,
        
        // 用户点数
        userPoints: 0,
        
        // 初始化任务应用
        init: async function() {
            await this.calculateUserPoints();
            this.createInterface();
            this.bindEvents();
            console.log('任务应用已初始化');
        },
        
        // 计算用户点数
        calculateUserPoints: async function() {
            try {
                // 重置点数
                this.userPoints = 0;
                
                // 检查HQDataExtractor是否可用
                if (!window['HQDataExtractor'] || typeof window['HQDataExtractor'].extractPointsData !== 'function') {
                    console.warn('任务应用: HQDataExtractor未加载，使用DOM扫描方式');
                    return this.calculateUserPointsFromDOM();
                }
                
                // 使用HQDataExtractor从SillyTavern上下文获取点数数据
                const pointsData = await window['HQDataExtractor'].extractPointsData();
                
                if (pointsData && pointsData.summary) {
                    this.userPoints = pointsData.summary.netPoints;
                    console.log(`任务应用点数计算: 获得${pointsData.summary.totalEarned} - 消耗${pointsData.summary.totalSpent} = 剩余${this.userPoints}`);
                    
                    // 如果需要，可以显示详细的点数记录
                    if (pointsData.all && pointsData.all.length > 0) {
                        console.log('点数记录详情:', pointsData.all);
                    }
                } else {
                    console.log('任务应用: 未找到点数记录');
                }
                
                // 更新点数显示
                this.updatePointsDisplay();
                
                return this.userPoints;
            } catch (error) {
                console.error('任务应用计算点数时出错:', error);
                console.log('任务应用: 尝试使用DOM扫描方式作为备用方案');
                return this.calculateUserPointsFromDOM();
            }
        },
        
        // DOM扫描方式计算点数（备用方案）
        calculateUserPointsFromDOM: function() {
            try {
                // 重置点数
                this.userPoints = 0;
                
                // 获取所有聊天消息文本
                const $messageElements = $('body').find('.mes_text');
                let earnedPoints = 0;
                let spentPoints = 0;
                
                // 定义正则表达式来匹配获得点数和消耗点数格式
                const earnedPointsRegex = /\[获得点数\|(\d+)\]/g;
                const spentPointsRegex = /\[消耗点数\|(\d+)\]/g;
                
                if ($messageElements.length > 0) {
                    $messageElements.each(function() {
                        try {
                            const messageText = $(this).text();
                            
                            // 提取获得点数
                            let earnedMatch;
                            earnedPointsRegex.lastIndex = 0; // 重置正则表达式索引
                            while ((earnedMatch = earnedPointsRegex.exec(messageText)) !== null) {
                                const points = parseInt(earnedMatch[1]);
                                earnedPoints += points;
                                console.log(`发现获得点数: ${points}`);
                            }
                            
                            // 提取消耗点数
                            let spentMatch;
                            spentPointsRegex.lastIndex = 0; // 重置正则表达式索引
                            while ((spentMatch = spentPointsRegex.exec(messageText)) !== null) {
                                const points = parseInt(spentMatch[1]);
                                spentPoints += points;
                                console.log(`发现消耗点数: ${points}`);
                            }
                            
                        } catch (error) {
                            console.error('解析消息时出错:', error);
                        }
                    });
                }
                
                // 计算净点数
                this.userPoints = earnedPoints - spentPoints;
                console.log(`任务应用点数计算(DOM方式): 获得${earnedPoints} - 消耗${spentPoints} = 剩余${this.userPoints}`);
                
                // 更新点数显示
                this.updatePointsDisplay();
                
                return this.userPoints;
            } catch (error) {
                console.error('DOM方式计算点数也失败:', error);
                this.userPoints = 0;
                this.updatePointsDisplay();
                return 0;
            }
        },
        
        // 更新点数显示
        updatePointsDisplay: function() {
            const pointsText = `当前点数: ${this.userPoints}`;
            $('.task-points-display').text(pointsText);
        },
        
        // 创建界面
        createInterface: function() {
            const $taskInterface = $(`
                <div id="task_interface" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90vw; height: 90vh; z-index: 1000; flex-direction: column; border-radius: 10px; overflow: hidden;">
                    <div style="background: #2c2c2c; color: white; width: 90%; max-width: 600px; height: 90%; margin: auto; border-radius: 10px; display: flex; flex-direction: column;">
                        <div class="dialog-head" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #555;">
                            <div>
                                <h3 style="margin: 0;">任务管理</h3>
                                <div style="color: #4CAF50; font-size: 14px; margin-top: 5px;">
                                    <span class="task-points-display">当前点数: 0</span>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <button id="view_tasks_btn" style="padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">查看任务</button>
                                <button id="refresh_task_points_btn" style="padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">刷新点数</button>
                                <div id="close_task_btn" style="cursor: pointer; font-size: 20px;">×</div>
                            </div>
                        </div>
                        
                        <div style="padding: 20px; flex-grow: 1; overflow-y: auto;">
                            <div class="task-tabs" style="display: flex; margin-bottom: 20px; gap: 5px;">
                                <button class="task-tab active" data-tab="available" style="flex: 1; padding: 10px; border: none; background: #4CAF50; color: white; cursor: pointer; border-radius: 5px;">可接任务</button>
                                <button class="task-tab" data-tab="accepted" style="flex: 1; padding: 10px; border: none; background: #555; color: white; cursor: pointer; border-radius: 5px;">已接任务</button>
                                <button class="task-tab" data-tab="completed" style="flex: 1; padding: 10px; border: none; background: #555; color: white; cursor: pointer; border-radius: 5px;">已完成</button>
                            </div>
                            <div id="task_content_area"></div>
                        </div>
                    </div>
                </div>
            `);
            $('body').append($taskInterface);
        },
        
        // 绑定事件
        bindEvents: function() {
            const self = this;
            
            $('#close_task_btn').on('click', function() {
                $('#task_interface').hide();
            });
            
            // 查看任务按钮
            $('#view_tasks_btn').on('click', function() {
                self.sendViewTasksMessage();
            });
            
            // 刷新点数按钮
            $('#refresh_task_points_btn').on('click', async function() {
                await self.calculateUserPoints();
                // 同时刷新任务状态
                await self.refreshTaskStates();
                alert('点数和任务状态已刷新！');
            });
            
            $('.task-tab').on('click', function() {
                $('.task-tab').removeClass('active').css('background', '#555');
                $(this).addClass('active').css('background', '#4CAF50');
                const tab = $(this).data('tab');
                self.showTaskTab(tab);
            });
        },
        
        // 显示任务应用
        show: async function() {
            console.log('正在加载任务应用...');
            $('#task_interface').show();
            
            try {
                const tasks = await window['HQDataExtractor'].extractTasks();
                // 分析聊天记录中的任务状态
                const taskStates = this.analyzeTaskStatesFromChat();
                // 根据聊天记录重新分类任务
                this.currentTasks = this.filterTasksByStates(tasks, taskStates);
                this.showTaskTab('available');
            } catch (error) {
                console.error('加载任务数据时出错:', error);
            }
        },
        
        // 分析聊天记录中的任务状态
        analyzeTaskStatesFromChat: function() {
            const taskStates = {
                accepted: new Set(), // 已接受的任务ID
                completed: new Set() // 已完成的任务ID
            };
            
            try {
                // 获取SillyTavern上下文
                let chatMessages = [];
                
                // 尝试通过全局变量获取聊天消息
                if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
                    const context = SillyTavern.getContext();
                    if (context && context.chat) {
                        chatMessages = context.chat;
                    }
                }
                
                // 如果上面的方法不行，尝试直接从DOM获取
                if (chatMessages.length === 0) {
                    const $messageElements = $('#chat .mes_text');
                    $messageElements.each(function() {
                        const messageText = $(this).text();
                        if (messageText) {
                            chatMessages.push({ mes: messageText });
                        }
                    });
                }
                
                console.log(`任务应用: 分析了${chatMessages.length}条聊天消息`);
                
                // 分析消息内容，查找任务相关信息
                chatMessages.forEach(message => {
                    const messageText = message.mes || message;
                    
                    // 查找任务接受消息
                    // 格式：我接受了任务#123：任务名称，任务描述：...
                    const acceptedTaskRegex = /我接受了任务#(\w+)：/g;
                    let acceptedMatch;
                    while ((acceptedMatch = acceptedTaskRegex.exec(messageText)) !== null) {
                        const taskId = acceptedMatch[1];
                        taskStates.accepted.add(taskId);
                        console.log(`发现已接受任务: ${taskId}`);
                    }
                    
                    // 查找任务完成消息
                    // 可能的格式：完成了任务#123，任务#123已完成，任务#123完成 等
                    const completedTaskRegex = /(?:完成了任务#|任务#(\w+)(?:已完成|完成))/g;
                    let completedMatch;
                    while ((completedMatch = completedTaskRegex.exec(messageText)) !== null) {
                        const taskId = completedMatch[1] || completedMatch[0].match(/#(\w+)/)?.[1];
                        if (taskId) {
                            taskStates.completed.add(taskId);
                            console.log(`发现已完成任务: ${taskId}`);
                        }
                    }
                    
                    // 查找其他可能的任务完成标记
                    // 格式：[任务完成|123] 或类似格式
                    const completedMarkRegex = /\[任务完成\|(\w+)\]/g;
                    let completedMarkMatch;
                    while ((completedMarkMatch = completedMarkRegex.exec(messageText)) !== null) {
                        const taskId = completedMarkMatch[1];
                        taskStates.completed.add(taskId);
                        console.log(`发现任务完成标记: ${taskId}`);
                    }
                });
                
                console.log('任务状态分析结果:', {
                    accepted: Array.from(taskStates.accepted),
                    completed: Array.from(taskStates.completed)
                });
                
                return taskStates;
                
            } catch (error) {
                console.error('分析任务状态时出错:', error);
                return { accepted: new Set(), completed: new Set() };
            }
        },
        
        // 根据聊天记录中的状态重新分类任务
        filterTasksByStates: function(originalTasks, taskStates) {
            const filteredTasks = {
                available: [],
                accepted: [],
                completed: []
            };
            
            // 处理原始的可接任务
            if (originalTasks.available) {
                originalTasks.available.forEach(task => {
                    const taskId = task.id;
                    
                    if (taskStates.completed.has(taskId)) {
                        // 如果在聊天记录中发现已完成，移动到已完成
                        filteredTasks.completed.push(task);
                    } else if (taskStates.accepted.has(taskId)) {
                        // 如果在聊天记录中发现已接受，移动到已接受
                        filteredTasks.accepted.push(task);
                    } else {
                        // 否则保持在可接任务中
                        filteredTasks.available.push(task);
                    }
                });
            }
            
            // 处理原始的已接任务
            if (originalTasks.accepted) {
                originalTasks.accepted.forEach(task => {
                    const taskId = task.id;
                    
                    if (taskStates.completed.has(taskId)) {
                        // 如果在聊天记录中发现已完成，移动到已完成
                        filteredTasks.completed.push(task);
                    } else {
                        // 否则保持在已接受中
                        filteredTasks.accepted.push(task);
                    }
                });
            }
            
            // 处理原始的已完成任务
            if (originalTasks.completed) {
                originalTasks.completed.forEach(task => {
                    filteredTasks.completed.push(task);
                });
            }
            
            console.log('任务过滤结果:', {
                available: filteredTasks.available.length,
                accepted: filteredTasks.accepted.length,
                completed: filteredTasks.completed.length
            });
            
            return filteredTasks;
        },
        
        // 显示任务标签页
        showTaskTab: function(tabType) {
            const tasks = this.currentTasks;
            if (!tasks) return;
            
            const $contentArea = $('#task_content_area');
            $contentArea.empty();
            
            let taskList = [];
            switch (tabType) {
                case 'available':
                    taskList = tasks.available;
                    break;
                case 'accepted':
                    taskList = tasks.accepted;
                    break;
                case 'completed':
                    taskList = tasks.completed;
                    break;
            }
            
            if (taskList.length > 0) {
                taskList.forEach(task => {
                    const $taskCard = $(`
                        <div class="task-card" style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: white; cursor: ${tabType === 'available' ? 'pointer' : 'default'};" data-task-id="${task.id}" data-task-name="${task.name}" data-task-desc="${task.description || '无描述'}" data-task-reward="${task.reward}">
                            <h5 style="margin: 0 0 10px 0; color: #333;">${task.name}</h5>
                            <p style="margin: 5px 0; color: #666;"><strong>ID:</strong> ${task.id}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>描述:</strong> ${task.description || '无描述'}</p>
                            ${task.people ? `<p style="margin: 5px 0; color: #666;"><strong>参与人数:</strong> ${task.people}</p>` : ''}
                            <p style="margin: 5px 0; color: #4CAF50; font-weight: bold;"><strong>奖励:</strong> ${task.reward}</p>
                            ${tabType === 'available' ? '<p style="margin: 10px 0 0 0; color: #007bff; font-size: 12px; text-align: center;">点击接受任务</p>' : ''}
                        </div>
                    `);
                    
                    // 为可接任务添加点击事件
                    if (tabType === 'available') {
                        $taskCard.on('click', () => {
                            this.showAcceptTaskDialog(task);
                        });
                        
                        // 鼠标悬停效果
                        $taskCard.on('mouseenter', function() {
                            $(this).css('background-color', '#f0f8ff');
                        }).on('mouseleave', function() {
                            $(this).css('background-color', 'white');
                        });
                    }
                    
                    $contentArea.append($taskCard);
                });
            } else {
                $contentArea.html(`<p style="text-align: center; color: #999;">暂无${tabType === 'available' ? '可接' : tabType === 'accepted' ? '已接' : '已完成'}任务</p>`);
            }
        },
        
        // 显示接受任务确认对话框
        showAcceptTaskDialog: function(task) {
            const $dialog = $(`
                <div id="accept_task_dialog" style="position: absolute; z-index:10005;top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5);  display: flex; justify-content: center; align-items: center;">
                    <div style="background: white; border-radius: 10px; padding: 30px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                        <h3 style="margin: 0 0 20px 0; color: #333; text-align: center;">接受任务确认</h3>
                        <div style="margin-bottom: 20px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
                            <h4 style="margin: 0 0 10px 0; color: #007bff;">${task.name}</h4>
                            <p style="margin: 5px 0; color: #666;"><strong>任务ID:</strong> ${task.id}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>任务描述:</strong> ${task.description || '无描述'}</p>
                            ${task.people ? `<p style="margin: 5px 0; color: #666;"><strong>参与人数:</strong> ${task.people}</p>` : ''}
                            <p style="margin: 5px 0; color: #4CAF50; font-weight: bold;"><strong>任务奖励:</strong> ${task.reward}</p>
                        </div>
                        <p style="text-align: center; color: #333; margin-bottom: 30px;">确定要接受这个任务吗？</p>
                        <div style="display: flex; gap: 15px; justify-content: center;">
                            <button id="confirm_accept_task" style="padding: 12px 30px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">确认接受</button>
                            <button id="cancel_accept_task" style="padding: 12px 30px; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">取消</button>
                        </div>
                    </div>
                </div>
            `);
            
            $('body').append($dialog);
            
            // 绑定按钮事件
            $('#confirm_accept_task').on('click', () => {
                this.acceptTask(task);
                $dialog.remove();
            });
            
            $('#cancel_accept_task').on('click', () => {
                $dialog.remove();
            });
            
            // 点击背景关闭对话框
            $dialog.on('click', function(e) {
                if (e.target === this) {
                    $(this).remove();
                }
            });
        },
        
        // 接受任务并发送快捷回复
        acceptTask: function(task) {
            console.log('正在接受任务:', task);
            
            const self = this; // 保存this引用
            
            // 延迟执行，避免干扰正在进行的发送操作
            setTimeout(() => {
                try {
                    // 检查聊天输入框是否空闲 - 使用jQuery方式避免类型错误
                    const $originalInput = $('#send_textarea');
                    const $sendButton = $('#send_but');
                    
                    // 检查元素是否存在并且是textarea元素
                    if ($originalInput.length > 0 && $sendButton.length > 0) {
                        
                        const isDisabled = $originalInput.prop('disabled');
                        const currentValue = $originalInput.val() || '';
                        
                        if (!isDisabled && 
                            !$sendButton.hasClass('disabled') && 
                            currentValue === '') {
                            
                            // 构造消息文本
                            const message = `我接受了任务#${task.id}：${task.name}，任务描述：${task.description || '无描述'}，完成后可获得${task.reward}点数！`;
                            $originalInput.val(message);
                            
                            // 触发输入事件，让系统知道输入框内容已更改
                            $originalInput.trigger('input');
                            
                            // 给系统一点时间处理输入事件
                            setTimeout(() => {
                                // 如果发送按钮可用，点击发送
                                if (!$sendButton.hasClass('disabled')) {
                                    $sendButton.click();
                                    console.log('任务接受消息已发送');
                                    
                                    // 延迟刷新任务状态，等待消息发送完成
                                    setTimeout(async () => {
                                        await self.refreshTaskStates();
                                    }, 1000);
                                }
                            }, 200);
                            
                            // 显示成功提示
                            self.showSuccessMessage(`成功接受任务：${task.name}`);
                            
                        } else {
                            console.warn('聊天输入框不可用或正在忙碌中');
                            alert('当前聊天输入框不可用，请稍后再试');
                        }
                    } else {
                        console.warn('未找到聊天输入框元素');
                        alert('未找到聊天输入框，请确保页面已正确加载');
                    }
                } catch (error) {
                    console.error('发送任务接受消息时出错：', error);
                    alert('发送消息时出错，请手动发送');
                }
            }, 500);
        },
        
        // 显示成功消息
        showSuccessMessage: function(message) {
            const $successMsg = $(`
                <div style="position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 15px 20px; border-radius: 8px; z-index: 3000; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
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
        },
        
        // 刷新任务状态
        refreshTaskStates: async function() {
            try {
                console.log('正在刷新任务状态...');
                
                // 重新获取任务数据
                const tasks = await window['HQDataExtractor'].extractTasks();
                
                // 重新分析聊天记录中的任务状态
                const taskStates = this.analyzeTaskStatesFromChat();
                
                // 根据聊天记录重新分类任务
                this.currentTasks = this.filterTasksByStates(tasks, taskStates);
                
                // 获取当前活跃的标签页
                const $activeTab = $('.task-tab.active');
                const activeTabType = $activeTab.data('tab') || 'available';
                
                // 刷新当前标签页显示
                this.showTaskTab(activeTabType);
                
                console.log('任务状态刷新完成');
                
            } catch (error) {
                console.error('刷新任务状态时出错:', error);
            }
        },
        
        // 发送查看任务消息（快速回复）
        sendViewTasksMessage: function() {
            console.log('正在发送查看任务消息...');
            
            const self = this; // 保存this引用
            
            // 延迟执行，避免干扰正在进行的发送操作
            setTimeout(() => {
                try {
                    // 检查聊天输入框是否空闲 - 使用jQuery方式避免类型错误
                    const $originalInput = $('#send_textarea');
                    const $sendButton = $('#send_but');
                    
                    // 检查元素是否存在并且是textarea元素
                    if ($originalInput.length > 0 && $sendButton.length > 0) {
                        
                        const isDisabled = $originalInput.prop('disabled');
                        const currentValue = $originalInput.val() || '';
                        
                        if (!isDisabled && 
                            !$sendButton.hasClass('disabled') && 
                            currentValue === '') {
                            
                            // 构造查看任务消息
                            const message = '查看任务';
                            $originalInput.val(message);
                            
                            // 触发输入事件，让系统知道输入框内容已更改
                            $originalInput.trigger('input');
                            
                            // 给系统一点时间处理输入事件
                            setTimeout(() => {
                                // 如果发送按钮可用，点击发送
                                if (!$sendButton.hasClass('disabled')) {
                                    $sendButton.click();
                                    console.log('查看任务消息已发送');
                                    
                                    // 延迟刷新任务状态，等待消息发送完成
                                    setTimeout(async () => {
                                        await self.refreshTaskStates();
                                    }, 2000);
                                }
                            }, 200);
                            
                            // 显示成功提示
                            self.showSuccessMessage('查看任务消息已发送');
                            
                        } else {
                            console.warn('聊天输入框不可用或正在忙碌中');
                            alert('当前聊天输入框不可用，请稍后再试');
                        }
                    } else {
                        console.warn('未找到聊天输入框元素');
                        alert('未找到聊天输入框，请确保页面已正确加载');
                    }
                } catch (error) {
                    console.error('发送查看任务消息时出错：', error);
                    alert('发送消息时出错，请手动发送');
                }
            }, 500);
        }
    };
    
    // 导出到全局
    window['TaskApp'] = TaskApp;
    
})(window); 