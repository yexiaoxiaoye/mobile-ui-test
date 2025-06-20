/**
 * QQ照片功能模块 - 简化版
 * 图片处理功能已移至data-extractor.js
 * 此文件现在主要提供图片预览和工具方法
 */

(function(window) {
    'use strict';
    
    const QQPhoto = {
        // 存储上传的照片
        uploadedPhotos: [],
        
        // 已处理的图片记录（防止重复添加）
        processedImages: new Map(),
        
        // 照片上传相关设置
        settings: {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: [
                'image/jpeg', 
                'image/jpg', 
                'image/png', 
                'image/gif', 
                'image/webp',
                'image/bmp',      // 新增BMP支持
                'image/tiff',     // 新增TIFF支持
                'image/svg+xml',  // SVG格式
                'image/x-icon'    // ICO格式
            ],
            maxPhotos: 5 // 最多一次发送5张照片
        },
        
        // 检查是否为系统图片
        isSystemImage: function(src) {
            if (!src) return true;
            
            // 系统图片特征
            const systemPatterns = [
                'data:',              // base64编码的图片
                'User Avatars',       // 用户头像目录
                '/avatars/',          // 头像路径
                'avatar',             // 头像相关
                'profile',            // 个人资料图片
                'emoji',              // 表情符号
                'icon',               // 图标
                'system',             // 系统图片
                'default'             // 默认图片
            ];
            
            // 用户真实图片特征（这些不是系统图片）
            const userImagePatterns = [
                '/user/images/',      // 用户上传的图片目录
                '/uploads/',          // 上传目录
                '/user/',             // 用户目录
                '/images/',           // 图片目录
                'file/',              // 文件路径
                // 🌟 扩展：支持更多图片格式
                '.jpeg',              // JPEG格式
                '.jpg',               // JPG格式
                '.png',               // PNG格式
                '.gif',               // GIF格式
                '.webp',              // WebP格式
                '.bmp',               // BMP格式
                '.tiff',              // TIFF格式
                '.tif',               // TIF格式
                '.svg',               // SVG格式
                // 🌟 新增：通过MIME类型识别
                'image/jpeg',         // JPEG MIME类型
                'image/jpg',          // JPG MIME类型
                'image/png',          // PNG MIME类型
                'image/gif',          // GIF MIME类型
                'image/webp',         // WebP MIME类型
                'image/bmp',          // BMP MIME类型
                'image/tiff',         // TIFF MIME类型
                'image/svg',          // SVG MIME类型
                // 🌟 新增：通过URL特征识别真实图片
                'attachment',         // 附件标识
                'upload',             // 上传标识
                'message',            // 消息图片
                'photo',              // 照片
                'picture'             // 图片
            ];
            
            // 如果包含用户图片特征，则不是系统图片
            const hasUserImageFeature = userImagePatterns.some(pattern => 
                src.toLowerCase().includes(pattern.toLowerCase())
            );
            
            if (hasUserImageFeature) {
                return false;
            }
            
            // 检查是否包含系统图片特征
            const isSystemImage = systemPatterns.some(pattern => 
                src.toLowerCase().includes(pattern.toLowerCase())
            );
            
            return isSystemImage;
        },

        // 格式化时间
        formatTime: function(timestamp) {
            const date = new Date(timestamp);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        },

        // 清理所有已处理图片记录
        clearProcessedImagesCache: function() {
            this.processedImages.clear();
            console.log('🧹 已清理所有已处理图片缓存');
        },

        // 获取已处理图片统计
        getProcessedImagesStats: function() {
            const stats = {
                total: this.processedImages.size,
                byTarget: new Map()
            };
            
            for (const [key, value] of this.processedImages.entries()) {
                const parts = key.split('_');
                if (parts.length >= 3) {
                    const target = parts[0];
                    if (!stats.byTarget.has(target)) {
                        stats.byTarget.set(target, 0);
                    }
                    stats.byTarget.set(target, stats.byTarget.get(target) + 1);
                }
            }
            
            console.log('📊 已处理图片统计:', stats);
            return stats;
        },
        
        // 显示图片预览
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
                        <div style="font-size: 16px; margin-bottom: 5px;">我方发送给: ${target.fullName || target.target}</div>
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
        }
    };

    // 将QQPhoto对象添加到全局对象
    window['QQPhoto'] = QQPhoto;

    // 为方便使用，创建全局方法别名（简化版）
    window['clearImageCache'] = function() {
        QQPhoto.clearProcessedImagesCache();
        return '✅ 图片缓存已清理';
    };
    
    window['getImageStats'] = function() {
        return QQPhoto.getProcessedImagesStats();
    };
    
    // 调试信息
    console.log('✅ QQPhoto对象已成功创建并导出到window.QQPhoto（简化版）');
    console.log('🚫 图片处理功能已完全移至data-extractor.js');
    console.log('🔧 可用功能：');
    console.log('   - showImagePreview(): 显示图片预览');
    console.log('   - isSystemImage(): 检查是否为系统图片');
    console.log('   - clearImageCache(): 清理图片缓存');
    console.log('   - getImageStats(): 获取处理统计信息');
    
})(window); 