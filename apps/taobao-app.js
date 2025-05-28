// 淘宝应用
(function(window) {
    'use strict';
    
    const TaobaoApp = {
        // 购物车数据
        cart: [],
        
        // 商品数据缓存
        allProducts: [],
        productCategories: [],
        
        // 用户点数
        userPoints: 0,
        
        // 发送消息到聊天框
        sendToChat: function(message) {
            try {
                console.log('尝试发送消息:', message);
                
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
                    textarea.value = message;
                    textarea.focus();
                    
                    // 模拟键盘事件
                    textarea.dispatchEvent(new Event('input', {bubbles: true}));
                    textarea.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
                }
                
            } catch (error) {
                console.error('备用发送方法也失败了:', error);
            }
        },
        
        // 初始化淘宝应用
        init: async function() {
            this.loadCart();
            await this.calculateUserPoints();
            this.createInterface();
            this.bindEvents();
            console.log('淘宝应用已初始化');
        },
        
        // 加载购物车数据
        loadCart: function() {
            const savedCart = localStorage.getItem('taobao_cart');
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
            }
        },
        
        // 分析商品数据，提取商品类型
        analyzeProducts: function(products) {
            const categories = new Set();
            products.forEach(product => {
                if (product.type) {
                    categories.add(product.type);
                }
            });
            this.productCategories = Array.from(categories);
            return this.productCategories;
        },
        
        // 根据类型筛选商品
        getProductsByCategory: function(category) {
            if (category === '全部') {
                return this.allProducts;
            }
            return this.allProducts.filter(product => product.type === category);
        },
        
        // 创建分类标签页
        createCategoryTabs: function() {
            const categories = ['全部', ...this.productCategories];
            const tabsHtml = categories.map((category, index) => {
                const isActive = index === 0 ? 'active' : '';
                const activeStyle = index === 0 ? 'background: #ff6b6b; color: white;' : 'background: #f0f0f0; color: #666;';
                
                // 计算每个分类的商品数量
                const count = category === '全部' ? this.allProducts.length : this.allProducts.filter(p => p.type === category).length;
                
                return `<div class="category-tab ${isActive}" data-category="${category}" style="flex: 1; padding: 8px 12px; text-align: center; cursor: pointer; border-radius: 5px; margin: 0 2px; transition: all 0.3s ease; font-size: 14px; ${activeStyle}">
                    ${category}
                    <span class="category-count" style="font-size: 11px; background: rgba(255, 255, 255, 0.3); padding: 1px 4px; border-radius: 8px; margin-left: 5px; font-weight: normal;">${count}</span>
                </div>`;
            }).join('');
            
            return `
                <div class="category-tabs" style="display: flex; margin: 10px 0; padding: 0 5px; overflow-x: auto; white-space: nowrap; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">
                    ${tabsHtml}
                </div>
            `;
        },
        
        // 渲染商品列表
        renderProductList: function(products) {
            const $productsContainer = $('#taobao_products');
            $productsContainer.empty();
            
            if (products.length > 0) {
                // 添加搜索框
                const searchHtml = `
                    <div class="search-container" style="margin: 10px 0; padding: 0 5px;">
                        <div style="position: relative;">
                            <input type="text" id="product_search" placeholder="搜索商品..." style="width: 100%; padding: 10px 40px 10px 15px; border: 2px solid #ff6b6b; border-radius: 25px; outline: none; font-size: 14px; transition: all 0.3s ease;">
                            <i class="fas fa-search" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #ff6b6b; pointer-events: none;"></i>
                        </div>
                    </div>
                `;
                
                $productsContainer.append(searchHtml);
                
                // 添加分类标签页
                const categoryTabsHtml = this.createCategoryTabs();
                $productsContainer.append(categoryTabsHtml);
                
                // 添加商品列表标题
                $productsContainer.append('<h4 style="margin-top: 15px;">商品列表 (' + products.length + '件)</h4>');
                
                // 添加商品卡片
                const productsHtml = products.map((product, index) => {
                    return `
                        <div class="product-card" data-category="${product.type}" data-name="${String(product.name).toLowerCase()}" data-description="${String(product.describe).toLowerCase()}" style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: white;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="flex: 1;">
                                    <h5 style="margin: 0 0 10px 0; color: #333;font-size:16px">${product.name}</h5>
                                    <p style="margin: 5px 0; color: #666;"><strong>类型:</strong> <span class="product-category-tag" style="background: #ff6b6b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${product.type}</span></p>
                                    <p style="margin: 5px 0; color: #666;"><strong>描述:</strong> ${product.describe}</p>
                                    <p style="margin: 5px 0; color: #ff6b6b; font-weight: bold;"><strong>价格:</strong> ¥${product.price}</p>
                                </div>
                                <div>
                                    <button class="add-to-cart-btn" data-product-index="${index}" style="background: #ff6b6b; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; transition: background 0.3s;">
                                        <i class="fas fa-cart-plus" style="margin-right: 5px;"></i>
                                        加入购物车
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
                
                $productsContainer.append(productsHtml);
                
                // 绑定搜索功能
                this.bindSearchEvents();
                
                // 绑定分类标签页事件
                this.bindCategoryTabEvents();
                
                // 绑定加入购物车事件  
                this.bindAddToCartEvents();
            } else {
                $productsContainer.html('<p style="text-align: center; color: #999;">暂无商品信息</p>');
            }
        },
        
        // 绑定搜索事件
        bindSearchEvents: function() {
            const self = this;
            $('#product_search').on('input', function() {
                const searchTerm = String($(this).val() || '').toLowerCase();
                self.searchProducts(searchTerm);
            });
            
            // 搜索框获得焦点时的样式
            $('#product_search').on('focus', function() {
                $(this).css('box-shadow', '0 0 0 3px rgba(255, 107, 107, 0.2)');
            }).on('blur', function() {
                $(this).css('box-shadow', 'none');
            });
        },
        
        // 搜索商品
        searchProducts: function(searchTerm) {
            const $products = $('.product-card');
            let visibleCount = 0;
            
            if (searchTerm === '') {
                // 如果搜索框为空，恢复分类筛选状态
                const activeCategory = $('.category-tab.active').data('category') || '全部';
                this.filterProductsByCategory(activeCategory);
                return;
            }
            
            $products.each(function() {
                const $this = $(this);
                const name = String($this.data('name') || '').toLowerCase();
                const description = String($this.data('description') || '').toLowerCase();
                const category = String($this.data('category') || '').toLowerCase();
                
                if (name.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm)) {
                    $this.fadeIn(200);
                    visibleCount++;
                } else {
                    $this.fadeOut(200);
                }
            });
            
            // 更新标题显示搜索结果数量
            setTimeout(() => {
                $('h4').text(`搜索结果 (${visibleCount}件)`);
                
                // 如果没有搜索结果，显示提示
                if (visibleCount === 0) {
                    if ($('.no-results').length === 0) {
                        $('#taobao_products').append(`
                            <div class="no-results" style="text-align: center; padding: 40px; color: #999;">
                                <i class="fas fa-search" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                                <p>没有找到相关商品</p>
                                <p style="font-size: 14px;">请尝试其他关键词</p>
                            </div>
                        `);
                    }
                } else {
                    $('.no-results').remove();
                }
            }, 300);
        },
        
        // 绑定分类标签页事件
        bindCategoryTabEvents: function() {
            const self = this;
            $('.category-tab').off('click').on('click', function() {
                const selectedCategory = $(this).data('category');
                
                // 更新标签页样式
                $('.category-tab').css({
                    background: '#f0f0f0',
                    color: '#666'
                });
                $(this).css({
                    background: '#ff6b6b',
                    color: 'white'
                });
                
                // 筛选并显示商品
                self.filterProductsByCategory(selectedCategory);
            });
        },
        
        // 根据分类筛选商品
        filterProductsByCategory: function(category) {
            const $products = $('.product-card');
            
            if (category === '全部') {
                // 显示所有商品，添加动画效果
                $products.each(function(index) {
                    const $this = $(this);
                    setTimeout(() => {
                        $this.fadeIn(300).css('transform', 'translateY(0)');
                    }, index * 50); // 逐个显示，形成波浪效果
                });
            } else {
                // 先隐藏所有商品
                $products.fadeOut(200);
                
                // 然后显示指定分类的商品
                setTimeout(() => {
                    const $categoryProducts = $(`.product-card[data-category="${category}"]`);
                    $categoryProducts.each(function(index) {
                        const $this = $(this);
                        setTimeout(() => {
                            $this.fadeIn(300).css('transform', 'translateY(0)');
                        }, index * 80); // 分类商品逐个显示
                    });
                }, 250);
            }
            
            // 更新商品列表标题
            const count = category === '全部' ? this.allProducts.length : this.allProducts.filter(p => p.type === category).length;
            const title = category === '全部' ? '所有商品' : `${category}商品`;
            setTimeout(() => {
                $('h4').text(`${title} (${count}件)`);
            }, 300);
        },
        
        // 绑定加入购物车事件
        bindAddToCartEvents: function() {
            const self = this;
            $('.add-to-cart-btn').off('click').on('click', function() {
                const productIndex = $(this).data('product-index');
                const product = self.allProducts[productIndex];
                self.addToCart(product);
                
                // 按钮反馈效果
                const $btn = $(this);
                const originalHtml = $btn.html();
                $btn.css('background', '#28a745').text('已添加');
                setTimeout(() => {
                    $btn.css('background', '#ff6b6b').html(originalHtml);
                }, 1000);
            });
        },
        
        // 保存购物车数据
        saveCart: function() {
            localStorage.setItem('taobao_cart', JSON.stringify(this.cart));
        },
        
        // 添加商品到购物车
        addToCart: function(product) {
            // 计算添加商品后的总价
            let newTotal = this.getCartTotal();
            const existingItem = this.cart.find(item => item.name === product.name);
            
            if (existingItem) {
                // 如果商品已存在，计算增加一个数量后的价格
                newTotal += parseFloat(product.price);
            } else {
                // 如果是新商品，直接加上价格
                newTotal += parseFloat(product.price);
            }
            
            const pointsNeeded = Math.ceil(newTotal);
            
            // 检查添加后是否会超出点数限制
            if (pointsNeeded > this.userPoints) {
                const currentPointsNeeded = Math.ceil(this.getCartTotal());
                const remainingPoints = this.userPoints - currentPointsNeeded;
                
                if (confirm(`添加此商品后将超出点数限制！\n\n当前购物车需要: ${currentPointsNeeded}点\n剩余可用点数: ${remainingPoints}点\n添加商品价格: ${product.price}点\n添加后总需要: ${pointsNeeded}点\n\n是否仍要添加？（您可以稍后移除其他商品）`)) {
                    // 用户确认添加
                } else {
                    // 用户取消添加
                    return;
                }
            }
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.cart.push({
                    ...product,
                    quantity: 1,
                    addedTime: new Date().toISOString()
                });
            }
            this.saveCart();
            this.updateCartDisplay();
            this.showAddToCartSuccess(product.name);
        },
        
        // 从购物车移除商品
        removeFromCart: function(productName) {
            this.cart = this.cart.filter(item => item.name !== productName);
            this.saveCart();
            this.updateCartDisplay();
        },
        
        // 更新商品数量
        updateQuantity: function(productName, quantity) {
            const item = this.cart.find(item => item.name === productName);
            if (item) {
                if (quantity <= 0) {
                    this.removeFromCart(productName);
                } else {
                    item.quantity = quantity;
                    this.saveCart();
                    this.updateCartDisplay();
                }
            }
        },
        
        // 清空购物车
        clearCart: function() {
            this.cart = [];
            this.saveCart();
            this.updateCartDisplay();
        },
        
        // 获取购物车总数量
        getCartItemCount: function() {
            return this.cart.reduce((total, item) => total + item.quantity, 0);
        },
        
        // 获取购物车总价格
        getCartTotal: function() {
            return this.cart.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
        },
        
        // 计算用户点数
        calculateUserPoints: async function() {
            try {
                // 重置点数
                this.userPoints = 0;
                
                // 检查HQDataExtractor是否可用
                if (!window['HQDataExtractor'] || typeof window['HQDataExtractor'].extractPointsData !== 'function') {
                    console.warn('淘宝应用: HQDataExtractor未加载，使用DOM扫描方式');
                    return this.calculateUserPointsFromDOM();
                }
                
                // 使用HQDataExtractor从SillyTavern上下文获取点数数据
                const pointsData = await window['HQDataExtractor'].extractPointsData();
                
                if (pointsData && pointsData.summary) {
                    this.userPoints = pointsData.summary.netPoints;
                    console.log(`淘宝应用点数计算: 获得${pointsData.summary.totalEarned} - 消耗${pointsData.summary.totalSpent} = 剩余${this.userPoints}`);
                    
                    // 如果需要，可以显示详细的点数记录
                    if (pointsData.all && pointsData.all.length > 0) {
                        console.log('点数记录详情:', pointsData.all);
                    }
                } else {
                    console.log('淘宝应用: 未找到点数记录');
                }
                
                // 更新点数显示
                this.updatePointsDisplay();
                
                return this.userPoints;
            } catch (error) {
                console.error('淘宝应用计算点数时出错:', error);
                console.log('淘宝应用: 尝试使用DOM扫描方式作为备用方案');
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
                console.log(`淘宝应用点数计算(DOM方式): 获得${earnedPoints} - 消耗${spentPoints} = 剩余${this.userPoints}`);
                
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
            $('.taobao-points-display').text(pointsText);
        },
        
        // 创建界面
        createInterface: function() {
            const $taobaoInterface = $(`
                <div id="taobao_interface" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90vw; height: 90vh; z-index: 1000; flex-direction: column; border-radius: 10px; overflow: hidden;">
                    <div style="background: #2c2c2c; color: white; width: 90%; max-width: 600px; height: 90%; margin: auto; border-radius: 10px; display: flex; flex-direction: column;">
                        <div class="dialog-head" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #555;">
                            <div>
                                <h3 style="margin: 0;">淘宝购物</h3>
                                <div style="color: #4CAF50; font-size: 14px; margin-top: 5px;">
                                    <span class="taobao-points-display">当前点数: 0</span>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <button id="refresh_products_btn" style="padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">刷新商品</button>
                                <button id="refresh_points_btn" style="padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">刷新点数</button>
                                <div id="close_taobao_btn" style="cursor: pointer; font-size: 20px;">×</div>
                            </div>
                        </div>
                        
                        <!-- 标签页导航 -->
                        <div style="display: flex; background: #333; border-bottom: 1px solid #555;">
                            <div id="tab_products" class="active" style="flex: 1; padding: 15px; text-align: center; cursor: pointer; background: #ff6b6b; color: white; transition: all 0.3s ease;">
                                商品列表
                            </div>
                            <div id="tab_cart" style="flex: 1; padding: 15px; text-align: center; cursor: pointer; background: #f0f0f0; color: #666; transition: all 0.3s ease; position: relative;">
                                购物车
                                <span id="cart_count" style="background: #ffcc00; color: #333; border-radius: 50%; padding: 2px 6px; font-size: 12px; margin-left: 5px; display: none; position: absolute; top: 8px; right: 15px; min-width: 18px; text-align: center;">0</span>
                            </div>
                        </div>
                        
                        <div id="taobao_content" style="flex-grow: 1; overflow-y: auto;">
                            <!-- 商品页面 -->
                            <div id="tab_content_products" style="padding: 15px;">
                                <div id="taobao_products"></div>
                            </div>
                            
                            <!-- 购物车页面 -->
                            <div id="tab_content_cart" style="padding: 15px; display: none;">
                                <div id="cart_items"></div>
                                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-top: 2px solid #ff6b6b;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                        <span style="font-size: 18px; font-weight: bold; color: #333;">总计:</span>
                                        <span id="cart_total" style="font-size: 20px; font-weight: bold; color: #ff6b6b;">¥0.00</span>
                                    </div>
                                    <div style="display: flex; gap: 10px;">
                                        <button id="clear_cart_btn" style="flex: 1; padding: 12px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">清空购物车</button>
                                        <button id="checkout_btn" style="flex: 2; padding: 12px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">立即结算</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            $('body').append($taobaoInterface);
        },
        
        // 绑定事件
        bindEvents: function() {
            const self = this;
            
            // 关闭淘宝界面
            $('#close_taobao_btn').on('click', function() {
                $('#taobao_interface').hide();
            });
            
            // 刷新商品按钮
            $('#refresh_products_btn').on('click', function() {
                self.sendToChat('{{停止角色扮演}}刷新商品');
                alert('刷新商品请求已发送！');
            });
            
            // 刷新点数按钮
            $('#refresh_points_btn').on('click', async function() {
                await self.calculateUserPoints();
                alert('点数已刷新！');
            });
            
            // 标签页切换
            $('#tab_products').on('click', function() {
                self.showProductsTab();
            });
            
            $('#tab_cart').on('click', function() {
                self.showCartTab();
            });
            
            // 清空购物车
            $(document).on('click', '#clear_cart_btn', function() {
                if (confirm('确定要清空购物车吗？')) {
                    self.clearCart();
                }
            });
            
            // 结算按钮
            $(document).on('click', '#checkout_btn', function() {
                // 检查按钮是否被禁用
                if ($(this).prop('disabled')) {
                    const total = self.getCartTotal();
                    const pointsNeeded = Math.ceil(total);
                    if (self.cart.length > 0 && self.userPoints < pointsNeeded) {
                        alert(`点数不足！\n需要点数: ${pointsNeeded}\n当前点数: ${self.userPoints}\n缺少点数: ${pointsNeeded - self.userPoints}\n\n请先获取更多点数再进行购买。`);
                    }
                    return;
                }
                self.checkout();
            });
        },
        
        // 显示商品标签页
        showProductsTab: function() {
            $('#tab_products').addClass('active').css({background: '#ff6b6b', color: 'white'});
            $('#tab_cart').removeClass('active').css({background: '#f0f0f0', color: '#666'});
            $('#tab_content_products').show();
            $('#tab_content_cart').hide();
        },
        
        // 显示购物车标签页
        showCartTab: function() {
            $('#tab_cart').addClass('active').css({background: '#ff6b6b', color: 'white'});
            $('#tab_products').removeClass('active').css({background: '#f0f0f0', color: '#666'});
            $('#tab_content_cart').show();
            $('#tab_content_products').hide();
            this.renderCart();
        },
        
        // 更新购物车显示
        updateCartDisplay: function() {
            const count = this.getCartItemCount();
            const total = this.getCartTotal();
            const hasEnoughPoints = this.userPoints >= Math.ceil(total);
            
            $('#cart_count').text(count);
            
            if (count > 0) {
                $('#cart_count').show();
            } else {
                $('#cart_count').hide();
            }
            
            // 检查点数是否足够并更新结算按钮状态
            const $checkoutBtn = $('#checkout_btn');
            if (count > 0) {
                if (hasEnoughPoints) {
                    $checkoutBtn.prop('disabled', false)
                        .css({
                            'background': '#28a745',
                            'cursor': 'pointer',
                            'opacity': '1'
                        })
                        .text('立即结算');
                } else {
                    $checkoutBtn.prop('disabled', true)
                        .css({
                            'background': '#dc3545',
                            'cursor': 'not-allowed',
                            'opacity': '0.7'
                        })
                        .text(`点数不足 (需要${Math.ceil(total)}点)`);
                }
            } else {
                $checkoutBtn.prop('disabled', true)
                    .css({
                        'background': '#6c757d',
                        'cursor': 'not-allowed',
                        'opacity': '0.7'
                    })
                    .text('购物车为空');
            }
            
            // 如果当前在购物车标签页，更新购物车内容
            if ($('#tab_cart').hasClass('active')) {
                this.renderCart();
            }
        },
        
        // 渲染购物车
        renderCart: function() {
            const $cartItems = $('#cart_items');
            $cartItems.empty();
            
            if (this.cart.length === 0) {
                $cartItems.html(`
                    <div style="text-align: center; padding: 40px; color: #999;">
                        <i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 20px;"></i>
                        <p>购物车是空的</p>
                        <button id="go_shopping_btn" class="btn" style="background: #ff6b6b; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">去购物</button>
                    </div>
                `);
                
                // 绑定去购物按钮事件
                $('#go_shopping_btn').on('click', () => {
                    this.showProductsTab();
                });
            } else {
                this.cart.forEach(item => {
                    const $cartItem = $(`
                        <div class="cart-item" style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: white;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="flex: 1;">
                                    <h5 style="margin: 0 0 5px 0; color: #333;">${item.name}</h5>
                                    <p style="margin: 5px 0; color: #666; font-size: 14px;">${item.type}</p>
                                    <p style="margin: 5px 0; color: #ff6b6b; font-weight: bold;">单价: ¥${item.price}</p>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="display: flex; align-items: center; gap: 5px;">
                                        <button class="quantity-btn" data-product="${item.name}" data-action="decrease" style="background: #f0f0f0; border: none; width: 25px; height: 25px; border-radius: 3px; cursor: pointer;">-</button>
                                        <span style="min-width: 30px; text-align: center;">${item.quantity}</span>
                                        <button class="quantity-btn" data-product="${item.name}" data-action="increase" style="background: #f0f0f0; border: none; width: 25px; height: 25px; border-radius: 3px; cursor: pointer;">+</button>
                                    </div>
                                    <div style="text-align: right;">
                                        <p style="margin: 0; font-weight: bold; color: #ff6b6b;">¥${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                                        <button class="remove-btn" data-product="${item.name}" style="background: #dc3545; color: white; border: none; padding: 2px 8px; border-radius: 3px; cursor: pointer; font-size: 12px; margin-top: 5px;">移除</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `);
                    $cartItems.append($cartItem);
                });
                
                // 绑定购物车操作事件
                this.bindCartEvents();
            }
            
            // 更新总计并显示点数状态
            const total = this.getCartTotal();
            const pointsNeeded = Math.ceil(total);
            const hasEnoughPoints = this.userPoints >= pointsNeeded;
            
            $('#cart_total').html(`
                <div>¥${total.toFixed(2)}</div>
                <div style="font-size: 14px; margin-top: 5px; color: ${hasEnoughPoints ? '#28a745' : '#dc3545'};">
                    需要点数: ${pointsNeeded} | 当前点数: ${this.userPoints}
                    ${hasEnoughPoints ? '✓ 点数充足' : '✗ 点数不足'}
                </div>
            `);
        },
        
        // 绑定购物车操作事件
        bindCartEvents: function() {
            const self = this;
            
            $('.quantity-btn').off('click').on('click', function() {
                const productName = $(this).data('product');
                const action = $(this).data('action');
                const item = self.cart.find(item => item.name === productName);
                
                if (item) {
                    if (action === 'increase') {
                        self.updateQuantity(productName, item.quantity + 1);
                    } else if (action === 'decrease') {
                        self.updateQuantity(productName, item.quantity - 1);
                    }
                }
            });
            
            $('.remove-btn').off('click').on('click', function() {
                const productName = $(this).data('product');
                if (confirm(`确定要从购物车中移除 ${productName} 吗？`)) {
                    self.removeFromCart(productName);
                }
            });
        },
        
        // 显示添加到购物车成功提示
        showAddToCartSuccess: function(productName) {
            const $toast = $(`
                <div class="add-to-cart-toast" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #28a745; color: white; padding: 15px 25px; border-radius: 8px; z-index: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                    <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
                    ${productName} 已添加到购物车！
                </div>
            `);
            
            $('body').append($toast);
            
            setTimeout(() => {
                $toast.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 2000);
        },
        
        // 结算功能
        checkout: function() {
            if (this.cart.length === 0) {
                alert('购物车是空的，无法结算！');
                return;
            }
            
            const total = this.getCartTotal();
            const itemCount = this.getCartItemCount();
            const pointsNeeded = Math.ceil(total);
            
            // 检查点数是否足够
            if (this.userPoints < pointsNeeded) {
                alert(`点数不足！\n需要点数: ${pointsNeeded}\n当前点数: ${this.userPoints}\n缺少点数: ${pointsNeeded - this.userPoints}\n\n请先获取更多点数再进行购买。`);
                return;
            }
            
            if (confirm(`确定要结算吗？\n商品数量: ${itemCount}件\n总金额: ¥${total.toFixed(2)}\n需要点数: ${pointsNeeded}\n剩余点数: ${this.userPoints - pointsNeeded}`)) {
                // 构建购物车内容文本
                let cartContent = "我购买了以下商品：\n";
                
                // 添加购物车商品信息 - 使用参考.js的格式
                this.cart.forEach(item => {
                    cartContent += `[背包物品|物品名称:${item.name}|物品类型:${item.type}|物品数量:${item.quantity}|物品描述:${item.describe}] 花费总计${(parseFloat(item.price) * item.quantity).toFixed(2)}点数\n`;
                });
                
                // 添加总计和消耗点数
                cartContent += `\n[总计|${total.toFixed(2)}] [消耗点数|${pointsNeeded}]`;
                
                // 将购物车内容发送到聊天框
                this.sendToChat(cartContent);
                
                // 更新用户点数（本地减少，实际点数会在重新计算时更新）
                this.userPoints -= pointsNeeded;
                this.updatePointsDisplay();
                
                // 清空购物车
                this.clearCart();
                
                // 跳转到商品页面
                this.showProductsTab();
                
                alert(`结算完成！\n消耗点数: ${pointsNeeded}\n剩余点数: ${this.userPoints}\n\n购买信息已发送到聊天记录中`);
            }
        },
        
        // 显示淘宝应用
        show: async function() {
            console.log('正在加载淘宝应用...');
            $('#taobao_interface').show();
            this.updateCartDisplay();
            
            try {
                const products = await window['HQDataExtractor'].extractProducts();
                const expenses = await window['HQDataExtractor'].extractTaobaoExpenses();
                
                this.allProducts = products;
                this.analyzeProducts(products);
                
                const $productsContainer = $('#taobao_products');
                $productsContainer.empty();
                
                if (products.length > 0) {
                    this.renderProductList(products);
                } else {
                    $productsContainer.html('<p style="text-align: center; color: #999;">暂无商品信息</p>');
                }
                
                const $expensesContainer = $('#total_expenses');
                if (expenses.length > 0) {
                    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
                    $expensesContainer.html(`
                        <p><strong>总消费:</strong> ¥${totalAmount}</p>
                        <p><strong>消费次数:</strong> ${expenses.length}次</p>
                    `);
                } else {
                    $expensesContainer.html('<p>暂无消费记录</p>');
                }
                
            } catch (error) {
                console.error('加载淘宝数据时出错:', error);
            }
        }
    };
    
    // 导出到全局
    window['TaobaoApp'] = TaobaoApp;
    
})(window);