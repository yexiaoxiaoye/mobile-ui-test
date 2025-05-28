// 任务数据提取器
(function(window) {
    'use strict';
    
    const TaskDataExtractor = {
        // 任务正则表达式
        taskRegexes: {
            // 查看任务格式: [查看任务|ID|名称|描述|发布者|奖励]
            available: /\[查看任务\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g,
            // 接受任务格式: [接受任务|ID|名称|描述|发布者|奖励]  
            accepted: /\[接受任务\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g,
            // 完成任务格式: [完成任务|ID|名称|奖励点数]
            completed: /\[完成任务\|([^|]+)\|([^|]+)\|([^\]]+)\]/g,
            // 获得点数格式: [获得点数|数量]
            earnedPoints: /\[获得点数\|(\d+)\]/g,
            // 消耗点数格式: [消耗点数|数量] 
            spentPoints: /\[消耗点数\|(\d+)\]/g,
            // 淘宝总计格式: [总计|数量]
            totalExpense: /\[总计\|(\d+)\]/g
        },
        
        // 从聊天记录中提取所有任务数据
        extractTasksData: async function() {
            try {
                console.log('TaskDataExtractor: 开始提取任务数据...');
                
                const tasks = {
                    available: [],
                    accepted: [], 
                    completed: [],
                    summary: {
                        totalAvailable: 0,
                        totalAccepted: 0,
                        totalCompleted: 0
                    }
                };
                
                // 获取所有消息元素
                const messageElements = document.querySelectorAll('.mes_text, .mes_block');
                const taskMap = new Map(); // 用于跟踪任务状态
                
                console.log(`TaskDataExtractor: 找到 ${messageElements.length} 个消息元素`);
                
                // 遍历所有消息
                messageElements.forEach((element, index) => {
                    const messageText = element.textContent || '';
                    
                    // 提取可接任务
                    this.extractTasksByType(messageText, 'available', taskMap);
                    // 提取已接任务
                    this.extractTasksByType(messageText, 'accepted', taskMap);
                    // 提取已完成任务
                    this.extractTasksByType(messageText, 'completed', taskMap);
                });
                
                // 处理任务优先级：完成 > 已接 > 可接
                taskMap.forEach(task => {
                    switch (task.finalStatus) {
                        case 'available':
                            tasks.available.push(task);
                            break;
                        case 'accepted':
                            tasks.accepted.push(task);
                            break;
                        case 'completed':
                            tasks.completed.push(task);
                            break;
                    }
                });
                
                // 按时间排序（最新的在前）
                Object.keys(tasks).forEach(key => {
                    if (Array.isArray(tasks[key])) {
                        tasks[key].sort((a, b) => b.timestamp - a.timestamp);
                    }
                });
                
                // 更新汇总信息
                tasks.summary.totalAvailable = tasks.available.length;
                tasks.summary.totalAccepted = tasks.accepted.length;
                tasks.summary.totalCompleted = tasks.completed.length;
                
                console.log('TaskDataExtractor: 任务数据提取完成', {
                    available: tasks.summary.totalAvailable,
                    accepted: tasks.summary.totalAccepted,
                    completed: tasks.summary.totalCompleted
                });
                
                return tasks;
                
            } catch (error) {
                console.error('TaskDataExtractor: 提取任务数据失败', error);
                return {
                    available: [],
                    accepted: [],
                    completed: [],
                    summary: { totalAvailable: 0, totalAccepted: 0, totalCompleted: 0 }
                };
            }
        },
        
        // 根据类型提取任务
        extractTasksByType: function(messageText, type, taskMap) {
            const regex = this.taskRegexes[type];
            let match;
            
            // 重置正则表达式索引
            regex.lastIndex = 0;
            
            while ((match = regex.exec(messageText)) !== null) {
                let task;
                
                if (type === 'completed') {
                    // 完成任务格式: [完成任务|ID|名称|奖励点数]
                    task = {
                        id: match[1],
                        name: match[2],
                        reward: match[3],
                        type: type,
                        timestamp: Date.now()
                    };
                } else {
                    // 可接/已接任务格式
                    task = {
                        id: match[1],
                        name: match[2],
                        description: match[3],
                        publisher: match[4],
                        reward: match[5],
                        type: type,
                        timestamp: Date.now()
                    };
                }
                
                // 处理任务状态优先级
                const existingTask = taskMap.get(task.id);
                if (!existingTask) {
                    task.finalStatus = task.type;
                    taskMap.set(task.id, task);
                } else {
                    // 更新为更高优先级的状态
                    const currentPriority = this.getTaskPriority(existingTask.finalStatus);
                    const newPriority = this.getTaskPriority(task.type);
                    
                    if (newPriority > currentPriority) {
                        // 保留原有信息，但更新状态
                        existingTask.finalStatus = task.type;
                        existingTask.timestamp = task.timestamp;
                        
                        // 如果是完成任务，更新奖励信息
                        if (task.type === 'completed') {
                            existingTask.completedReward = task.reward;
                        }
                    }
                }
            }
        },
        
        // 获取任务状态优先级（数字越大优先级越高）
        getTaskPriority: function(type) {
            const priorities = {
                'available': 1,
                'accepted': 2,
                'completed': 3
            };
            return priorities[type] || 0;
        },
        
        // 提取点数数据
        extractPointsData: async function() {
            try {
                console.log('TaskDataExtractor: 开始提取点数数据...');
                
                const pointsData = {
                    earned: [],
                    spent: [],
                    summary: {
                        totalEarned: 0,
                        totalSpent: 0,
                        netPoints: 0
                    }
                };
                
                // 获取所有消息元素
                const messageElements = document.querySelectorAll('.mes_text, .mes_block');
                
                messageElements.forEach(element => {
                    const messageText = element.textContent || '';
                    
                    // 提取获得点数
                    this.extractEarnedPoints(messageText, pointsData.earned);
                    // 提取消耗点数（包括淘宝消费）
                    this.extractSpentPoints(messageText, pointsData.spent);
                });
                
                // 计算汇总
                pointsData.summary.totalEarned = pointsData.earned.reduce((sum, item) => sum + item.amount, 0);
                pointsData.summary.totalSpent = pointsData.spent.reduce((sum, item) => sum + item.amount, 0);
                pointsData.summary.netPoints = pointsData.summary.totalEarned - pointsData.summary.totalSpent;
                
                console.log('TaskDataExtractor: 点数数据提取完成', pointsData.summary);
                
                return pointsData;
                
            } catch (error) {
                console.error('TaskDataExtractor: 提取点数数据失败', error);
                return {
                    earned: [],
                    spent: [],
                    summary: { totalEarned: 0, totalSpent: 0, netPoints: 0 }
                };
            }
        },
        
        // 提取获得点数
        extractEarnedPoints: function(messageText, earnedArray) {
            let match;
            
            // 获得点数格式
            this.taskRegexes.earnedPoints.lastIndex = 0;
            while ((match = this.taskRegexes.earnedPoints.exec(messageText)) !== null) {
                earnedArray.push({
                    amount: parseInt(match[1]),
                    source: '任务奖励',
                    timestamp: Date.now()
                });
            }
        },
        
        // 提取消耗点数
        extractSpentPoints: function(messageText, spentArray) {
            let match;
            
            // 消耗点数格式
            this.taskRegexes.spentPoints.lastIndex = 0;
            while ((match = this.taskRegexes.spentPoints.exec(messageText)) !== null) {
                spentArray.push({
                    amount: parseInt(match[1]),
                    source: '系统消费',
                    timestamp: Date.now()
                });
            }
            
            // 淘宝总计格式
            this.taskRegexes.totalExpense.lastIndex = 0;
            while ((match = this.taskRegexes.totalExpense.exec(messageText)) !== null) {
                spentArray.push({
                    amount: parseInt(match[1]),
                    source: '淘宝购物',
                    timestamp: Date.now()
                });
            }
        },
        
        // 获取特定任务的详细信息
        getTaskDetail: async function(taskId) {
            try {
                const allTasks = await this.extractTasksData();
                
                // 在所有任务类型中查找
                for (const type in allTasks) {
                    if (Array.isArray(allTasks[type])) {
                        const task = allTasks[type].find(t => t.id === taskId);
                        if (task) {
                            return { ...task, currentStatus: type };
                        }
                    }
                }
                
                return null;
            } catch (error) {
                console.error('TaskDataExtractor: 获取任务详情失败', error);
                return null;
            }
        },
        
        // 检查任务状态变化
        getTaskStatusHistory: async function(taskId) {
            try {
                const statusHistory = [];
                const messageElements = document.querySelectorAll('.mes_text, .mes_block');
                
                messageElements.forEach(element => {
                    const messageText = element.textContent || '';
                    
                    // 检查所有任务状态
                    Object.keys(this.taskRegexes).forEach(type => {
                        if (!['earnedPoints', 'spentPoints', 'totalExpense'].includes(type)) {
                            const regex = this.taskRegexes[type];
                            regex.lastIndex = 0;
                            
                            let match;
                            while ((match = regex.exec(messageText)) !== null) {
                                if (match[1] === taskId) {
                                    statusHistory.push({
                                        status: type,
                                        timestamp: Date.now(),
                                        data: match
                                    });
                                }
                            }
                        }
                    });
                });
                
                // 按时间排序
                statusHistory.sort((a, b) => a.timestamp - b.timestamp);
                
                return statusHistory;
            } catch (error) {
                console.error('TaskDataExtractor: 获取任务历史失败', error);
                return [];
            }
        }
    };
    
    // 导出到全局
    window['TaskDataExtractor'] = TaskDataExtractor;
    
    console.log('TaskDataExtractor: 任务数据提取器已初始化');
    
})(window); 