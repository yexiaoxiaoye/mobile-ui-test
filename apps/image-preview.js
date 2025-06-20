/**
 * 图片预览组件
 * 监听SillyTavern的文件选择，显示悬浮预览窗口
 * 提供取消功能，同时清理SillyTavern的file_form
 */

(function(window) {
    'use strict';
    
    const ImagePreview = {
        // 当前预览的图片信息
        currentPreview: null,
        
        // 监听器状态
        isListening: false,
        
        // 文件输入监听器
        fileInputListener: null,
        
        // 实际的change事件处理器
        changeEventHandler: null,
        
        // 初始化图片预览功能
        init: function() {
            console.log('🖼️ 初始化图片预览组件...');
            
            if (this.isListening) {
                console.log('⚠️ 图片预览监听器已经在运行');
                return;
            }
            
            this.setupFileInputListener();
            this.isListening = true;
            
            console.log('✅ 图片预览组件初始化完成');
        },
        
        // 设置文件输入监听器
        setupFileInputListener: function() {
            // 监听所有文件输入变化 - 简化检查条件
            this.fileInputListener = (event) => {
                const input = event.target;
                
                // 简化检查：只要是文件输入并且有文件就检查
                if (input.type === 'file' && input.files && input.files.length > 0) {
                    const file = input.files[0];
                    
                    // 检查是否是图片文件
                    if (file.type.startsWith('image/')) {
                        console.log('📷 检测到图片文件选择:', file.name);
                        this.showImagePreview(file, input);
                    }
                }
            };
            
            // 创建change事件处理器
            this.changeEventHandler = (event) => {
                const target = event.target;
                if (target && target instanceof HTMLInputElement && target.type === 'file') {
                    this.fileInputListener(event);
                }
            };
            
            // 使用更精确的事件委托，只监听input[type="file"]的change事件
            document.addEventListener('change', this.changeEventHandler, true);
            
            console.log('✅ 文件输入监听器已设置（简化版）');
        },
        
        // 显示图片预览窗口
        showImagePreview: function(file, inputElement) {
            // 如果已有预览窗口，先关闭
            if (this.currentPreview) {
                this.closePreview();
            }
            
            // 创建FileReader读取图片
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageDataUrl = e.target.result;
                this.createPreviewWindow(file, imageDataUrl, inputElement);
            };
            reader.readAsDataURL(file);
        },
        
        // 创建预览窗口
        createPreviewWindow: function(file, imageDataUrl, inputElement) {
            // 创建紧凑的图片预览 - 无遮挡背景
            const previewHTML = `
                <div class="image-preview-overlay" style="
                    position: relative;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    z-index: 10004;
                    max-width:40px
                ">
                    <div class="preview-container" style="
                        background: white;
                        border-radius: 8px;
                        padding: 5px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                        display: flex;
                        align-items: center;
                        position: relative;
                        pointer-events: auto;
                    ">
                        <!-- 图片缩略图容器 -->
                        <div class="preview-image-wrapper" style="
                            position: relative;
                            display: inline-block;
                        ">
                            <!-- 图片缩略图 -->
                            <div class="preview-image-container" style="
                                width: 30px;
                                height: 30px;
                                overflow: hidden;
                                border-radius: 6px;
                                border: 1px solid #ddd;
                                background: #f5f5f5;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">
                                <img src="${imageDataUrl}" alt="图片预览" style="
                                    max-width: 100%;
                                    max-height: 100%;
                                    object-fit: contain;
                                    border-radius: 4px;
                                ">
                            </div>
                            
                            <!-- 右上角的X取消按钮 -->
                            <button class="image-cancel-btn" style="
                                position: absolute;
                                top: -5px;
                                right: -5px;
                                width: 16px;
                                height: 16px;
                                border: none;
                                border-radius: 50%;
                                background: #ff4757;
                                color: white;
                                font-size: 10px;
                                font-weight: bold;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                transition: all 0.2s ease;
                                z-index: 10001;
                            " onmouseover="this.style.background='#ff3742'; this.style.transform='scale(1.1)'" 
                               onmouseout="this.style.background='#ff4757'; this.style.transform='scale(1)'">×</button>
                        </div>
                    </div>
                </div>
            `;
            
            // 创建DOM元素
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = previewHTML;
            const previewElement = tempDiv.firstElementChild;
            
            // 🌟 新增：优先查找当前显示的聊天页面中的chat-input-area
            let chatInputArea = null;
            
            // 1. 首先查找当前显示的聊天页面（.chat-page.show）中的chat-input-area
            const activeChatPage = document.querySelector('.chat-page.show');
            if (activeChatPage) {
                chatInputArea = activeChatPage.querySelector('.chat-input-area');
                if (chatInputArea) {
                    console.log('✅ 找到当前活跃聊天页面中的chat-input-area，将预览插入到第一个位置');
                    // 插入到第一个子元素之前
                    chatInputArea.insertBefore(previewElement, chatInputArea.firstChild);
                } else {
                    console.log('⚠️ 当前活跃聊天页面中未找到chat-input-area');
                }
            } else {
                console.log('⚠️ 未找到当前活跃的聊天页面（.chat-page.show）');
            }
            
            // 2. 如果在活跃聊天页面中没找到，尝试查找全局chat-input-area
            if (!chatInputArea) {
                chatInputArea = document.querySelector('.chat-input-area');
                if (chatInputArea) {
                    console.log('✅ 找到全局chat-input-area，将预览插入到第一个位置');
                    // 插入到第一个子元素之前
                    chatInputArea.insertBefore(previewElement, chatInputArea.firstChild);
                } else {
                    console.warn('⚠️ 全局也未找到chat-input-area，回退到body');
                    // 最后回退方案：添加到body
                    document.body.appendChild(previewElement);
                }
            }
            
            // 保存当前预览信息
            this.currentPreview = {
                element: previewElement,
                file: file,
                inputElement: inputElement
            };
            
            // 绑定事件
            this.bindPreviewEvents(previewElement, inputElement);
            
            console.log('✅ 紧凑图片预览已显示在对应聊天页面的chat-input-area第一个位置（带X按钮）');
        },
        
        // 绑定预览窗口事件
        bindPreviewEvents: function(previewElement, inputElement) {
            const cancelBtn = previewElement.querySelector('.image-cancel-btn');
            
            // X按钮点击事件 - 触发SillyTavern的文件重置按钮并移除预览
            cancelBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('❌ 用户点击X按钮取消图片');
                
                // 立即移除当前预览窗口
                this.closePreview();
                console.log('🗑️ 预览窗口已移除');
                
                // 方法1: 直接点击SillyTavern的file_form_reset按钮
                const resetBtn = document.getElementById('file_form_reset');
                if (resetBtn) {
                    console.log('🔄 触发SillyTavern文件重置按钮');
                    resetBtn.click();
                } else {
                    console.log('⚠️ 未找到file_form_reset按钮，使用备用方法');
                    // 备用方法：手动清理
                    this.cancelImageSelection(inputElement);
                }
                
                // 显示取消成功提示
                this.showCancelToast();
            });
        },
        
        // 取消图片选择
        cancelImageSelection: function(inputElement) {
            if (inputElement) {
                // 清空文件输入
                inputElement.value = '';
                
                // 触发change事件，通知SillyTavern
                const changeEvent = new Event('change', { bubbles: true });
                inputElement.dispatchEvent(changeEvent);
                
                console.log('🗑️ 已清空文件输入并通知SillyTavern');
                
                // 尝试查找并清理SillyTavern的文件显示元素
                this.cleanupSillyTavernFileDisplay();
            }
        },
        
        // 清理SillyTavern的文件显示
        cleanupSillyTavernFileDisplay: function() {
            // 尝试查找各种可能的文件显示元素
            const possibleSelectors = [
                '#file_form .file_attached',
                '.file_attached',
                '#files_list .file_entry',
                '.file_entry',
                '.attached-file',
                '[data-file]',
                '.file-preview'
            ];
            
            let removedCount = 0;
            
            possibleSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    // 检查是否包含图片相关内容
                    if (element.textContent.includes('图片') || 
                        element.textContent.includes('image') ||
                        element.querySelector('img')) {
                        element.remove();
                        removedCount++;
                        console.log(`🗑️ 移除文件显示元素: ${selector}`);
                    }
                });
            });
            
            // 尝试清理可能的文件列表容器
            const fileContainers = document.querySelectorAll('#file_form, #files_list, .files-container');
            fileContainers.forEach(container => {
                // 如果容器变空了，可能需要隐藏
                if (container.children.length === 0 || 
                    !container.querySelector('.file_attached, .file_entry, .attached-file')) {
                    // 确保是HTMLElement类型才能访问style属性
                    if (container instanceof HTMLElement) {
                        container.style.display = 'none';
                        console.log('👻 隐藏空的文件容器');
                    }
                }
            });
            
            if (removedCount > 0) {
                console.log(`✅ 总共清理了${removedCount}个文件显示元素`);
                
                // 显示取消成功提示
                this.showCancelToast();
            }
        },
        
        // 显示取消成功提示
        showCancelToast: function() {
            // 简化的成功提示 - 只在控制台显示
            console.log('✅ 图片已取消，SillyTavern附件已清理');
            
            // 可选：显示一个小的临时提示
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(255, 107, 107, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                z-index: 100001;
                font-size: 12px;
                pointer-events: none;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            toast.textContent = '图片已取消';
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 1500);
        },
        
        // 关闭预览窗口
        closePreview: function() {
            if (this.currentPreview && this.currentPreview.element) {
                this.currentPreview.element.remove();
                console.log('🚪 图片预览窗口已关闭');
            }
            this.currentPreview = null;
        },
        
        // 格式化文件大小
        formatFileSize: function(bytes) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        
        // 停止监听
        stop: function() {
            if (this.changeEventHandler) {
                document.removeEventListener('change', this.changeEventHandler, true);
                this.changeEventHandler = null;
            }
            
            this.closePreview();
            this.fileInputListener = null;
            this.isListening = false;
            
            console.log('🛑 图片预览监听器已停止');
        },
        
        // 重新启动
        restart: function() {
            this.stop();
            this.init();
            console.log('🔄 图片预览监听器已重新启动');
        },
        
        // 创建调试测试功能
        debugTest: function() {
            console.log('🔧 开始图片预览调试测试...');
            
            // 测试1: 检查事件监听器
            console.log('📋 当前状态:');
            console.log('  - isListening:', this.isListening);
            console.log('  - changeEventHandler:', !!this.changeEventHandler);
            console.log('  - fileInputListener:', !!this.fileInputListener);
            
            // 测试2: 模拟图片选择事件
            console.log('🧪 正在模拟图片选择事件...');
            
            // 创建一个测试用的文件对象
            const testFile = new File(['test'], 'test.png', { type: 'image/png' });
            const testDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            
            // 直接调用预览窗口创建方法
            this.createPreviewWindow(testFile, testDataUrl, null);
            
            return '✅ 调试测试完成，检查控制台输出';
        },
        
        // 检查DOM中是否有图片预览元素
        checkPreviewInDOM: function() {
            const overlays = document.querySelectorAll('.image-preview-overlay');
            console.log('🔍 DOM中的图片预览元素数量:', overlays.length);
            
            if (overlays.length > 0) {
                overlays.forEach((overlay, index) => {
                    console.log(`📍 预览元素 ${index + 1}:`, overlay);
                    console.log('  - 可见性:', window.getComputedStyle(overlay).display);
                    console.log('  - z-index:', window.getComputedStyle(overlay).zIndex);
                });
            } else {
                console.log('❌ 没有找到图片预览元素');
            }
            
            return `找到 ${overlays.length} 个预览元素`;
        }
    };
    
    // 导出到全局
    window['ImagePreview'] = ImagePreview;
    
    // 创建全局方法
    window['startImagePreview'] = function() {
        ImagePreview.init();
        return '✅ 图片预览功能已启动';
    };
    
    window['stopImagePreview'] = function() {
        ImagePreview.stop();
        return '🛑 图片预览功能已停止';
    };
    
    window['restartImagePreview'] = function() {
        ImagePreview.restart();
        return '🔄 图片预览功能已重新启动';
    };
    
    // 🔧 新增：调试功能
    window['testImagePreview'] = function() {
        return ImagePreview.debugTest();
    };
    
    window['checkImagePreviewDOM'] = function() {
        return ImagePreview.checkPreviewInDOM();
    };
    
    window['debugImagePreview'] = function() {
        console.log('🔧 图片预览完整调试报告:');
        console.log('================================');
        
        // 1. 检查模块状态
        console.log('📋 模块状态:');
        console.log('  - ImagePreview对象:', !!window['ImagePreview']);
        console.log('  - 监听状态:', window['ImagePreview'] ? window['ImagePreview'].isListening : false);
        console.log('  - 当前预览:', window['ImagePreview'] ? !!window['ImagePreview'].currentPreview : false);
        
        // 2. 检查DOM
        console.log('🌐 DOM检查:');
        if (window['ImagePreview']) {
            window['ImagePreview'].checkPreviewInDOM();
        }
        
        // 3. 检查文件输入元素
        const fileInputs = document.querySelectorAll('input[type="file"]');
        console.log('📁 页面中的文件输入元素:', fileInputs.length);
        fileInputs.forEach((input, index) => {
            console.log(`  ${index + 1}. ID: ${input.id || '(无ID)'}`);
            console.log(`      类名: ${input.className}`);
            if (input instanceof HTMLInputElement) {
                console.log(`      accept: ${input.accept || '(无限制)'}`);
                console.log(`      可见: ${input.offsetParent !== null}`);
                console.log(`      元素:`, input);
            } else {
                console.log(`      元素:`, input);
            }
        });
        
        // 4. 运行测试
        console.log('🧪 运行预览测试...');
        setTimeout(() => {
            if (window['ImagePreview']) {
                window['ImagePreview'].debugTest();
            }
        }, 1000);
        
        return '✅ 调试报告已生成，请查看控制台';
    };
    
    // 🔧 新增：强制创建测试预览
    window['forceCreatePreview'] = function() {
        console.log('🧪 强制创建测试预览...');
        
        // 创建一个1px的透明测试图片
        const testDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const testFile = new File(['test'], 'test.png', { type: 'image/png' });
        
        try {
            if (window['ImagePreview']) {
                window['ImagePreview'].createPreviewWindow(testFile, testDataUrl, null);
                console.log('✅ 测试预览窗口已创建');
                
                // 检查DOM
                setTimeout(() => {
                    const overlay = document.querySelector('.image-preview-overlay');
                    if (overlay) {
                        console.log('✅ 预览overlay在DOM中找到:', overlay);
                        if (overlay instanceof HTMLElement) {
                            console.log('  - 位置:', overlay.style.position);
                            console.log('  - z-index:', overlay.style.zIndex);
                            console.log('  - 显示:', overlay.style.display);
                        }
                    } else {
                        console.log('❌ 预览overlay未在DOM中找到');
                    }
                }, 100);
                
                return '✅ 测试预览已创建，检查控制台查看详情';
            } else {
                return '❌ ImagePreview对象不存在';
            }
        } catch (error) {
            console.error('❌ 创建测试预览失败:', error);
            return '❌ 创建失败: ' + error.message;
        }
    };
    
    window['checkFileInputs'] = function() {
        console.log('🔍 检查页面中的文件输入元素...');
        
        const fileInputs = document.querySelectorAll('input[type="file"]');
        console.log(`📁 找到 ${fileInputs.length} 个文件输入元素:`);
        
        fileInputs.forEach((input, index) => {
            console.log(`  ${index + 1}. ID: ${input.id || '(无ID)'}`);
            console.log(`      类名: ${input.className}`);
            console.log(`      accept: ${input.accept || '(无限制)'}`);
            console.log(`      可见: ${input.offsetParent !== null}`);
            console.log(`      元素:`, input);
        });
        
        return `找到 ${fileInputs.length} 个文件输入元素`;
    };
    
    // 自动启动 - 增强版
    const initImagePreview = () => {
        console.log('🚀 尝试初始化图片预览功能...');
        
        try {
            ImagePreview.init();
            console.log('✅ 图片预览功能初始化成功');
            
            // 测试功能是否正常
            setTimeout(() => {
                if (ImagePreview.isListening) {
                    console.log('✅ 图片预览监听器正在运行');
                } else {
                    console.warn('⚠️ 图片预览监听器未运行，尝试重新启动...');
                    ImagePreview.restart();
                }
            }, 2000);
            
        } catch (error) {
            console.error('❌ 图片预览功能初始化失败:', error);
            // 延迟重试
            setTimeout(() => {
                console.log('🔄 延迟重试图片预览初始化...');
                ImagePreview.init();
            }, 3000);
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initImagePreview, 1000);
        });
    } else {
        setTimeout(initImagePreview, 1000);
    }
    
    // 调试信息
    console.log('✅ ImagePreview对象已创建并导出到window.ImagePreview');
    console.log('🔧 可用功能：');
    console.log('   - startImagePreview(): 启动图片预览功能');
    console.log('   - stopImagePreview(): 停止图片预览功能');
    console.log('   - restartImagePreview(): 重新启动图片预览功能');
    console.log('   - testImagePreview(): 测试预览功能');
    console.log('   - debugImagePreview(): 完整调试报告');
    console.log('');
    console.log('📋 功能说明：');
    console.log('   • 紧凑模式：30x30px的小图片预览');
    console.log('   • 无遮挡背景：不影响其他UI元素点击');
    console.log('   • X取消按钮：右上角小按钮，联动SillyTavern文件重置');
    console.log('   • 自动监听：检测图片文件选择并显示预览');
    console.log('   • 一键清理：点击X按钮自动触发file_form_reset');
    console.log('   • 智能定位：预览窗口居中显示，不阻挡操作');
    
})(window); 