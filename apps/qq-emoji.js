/**
 * QQ表情包功能模块
 * 在mobile-ui-test扩展中实现QQ表情包功能
 */

window.QQEmojiManager = (function() {
    'use strict';

    class QQEmojiManager {
        constructor() {
            this.emojiMap = new Map();
            this.emojiBaseUrl = '/scripts/extensions/third-party/mobile-ui-test/images/'; // 表情包图片基础路径
            this.isEnabled = true;
            this.isInitialized = false;
        }

        /**
         * 初始化QQ表情包功能
         */
        async init() {
            if (this.isInitialized) {
                console.log('QQ表情包功能已经初始化过了');
                return;
            }

            console.log('QQ表情包功能初始化中...');
            
            try {
                // 初始化表情包映射
                this.initEmojiMap();
                
                // 初始化事件监听器
                this.initEventListeners();
                
                // 加载用户设置
                this.loadSettings();
                
                // 等待DOM准备好后创建表情包按钮
                this.waitForDOM(() => {
                    this.createEmojiButton();
                });
                
                this.isInitialized = true;
                console.log('QQ表情包功能初始化完成');
            } catch (error) {
                console.error('QQ表情包功能初始化失败:', error);
            }
        }

        /**
         * 等待DOM元素准备好
         */
        waitForDOM(callback) {
            const checkDOM = () => {
                if (document.getElementById('send_textarea') || document.querySelector('#send_form')) {
                    callback();
                } else {
                    setTimeout(checkDOM, 500);
                }
            };
            checkDOM();
        }

        /**
         * 初始化表情包映射
         */
        initEmojiMap() {
            this.emojiMap = new Map([
                // 基础表情
                ['[微笑]', '0.gif'],
                ['[撇嘴]', '1.gif'],
                ['[色]', '2.gif'],
                ['[发呆]', '3.gif'],
                ['[得意]', '4.gif'],
                ['[流泪]', '5.gif'],
                ['[害羞]', '6.gif'],
                ['[闭嘴]', '7.gif'],
                ['[睡]', '8.gif'],
                ['[大哭]', '9.gif'],
                ['[尴尬]', '10.gif'],
                ['[发怒]', '11.gif'],
                ['[调皮]', '12.gif'],
                ['[呲牙]', '13.gif'],
                ['[惊讶]', '14.gif'],
                ['[难过]', '15.gif'],
                ['[酷]', '16.gif'],
                ['[冷汗]', '17.gif'],
                ['[抓狂]', '18.gif'],
                ['[吐]', '19.gif'],
                ['[偷笑]', '20.gif'],
                ['[可爱]', '21.gif'],
                ['[白眼]', '22.gif'],
                ['[傲慢]', '23.gif'],
                ['[饥饿]', '24.gif'],
                ['[困]', '25.gif'],
                ['[惊恐]', '26.gif'],
                ['[流汗]', '27.gif'],
                ['[憨笑]', '28.gif'],
                ['[大兵]', '29.gif'],
                ['[奋斗]', '30.gif'],
                ['[咒骂]', '31.gif'],
                ['[疑问]', '32.gif'],
                ['[嘘]', '33.gif'],
                ['[晕]', '34.gif'],
                ['[折磨]', '35.gif'],
                ['[衰]', '36.gif'],
                ['[骷髅]', '37.gif'],
                ['[敲打]', '38.gif'],
                ['[再见]', '39.gif'],
                ['[擦汗]', '40.gif'],
                ['[抠鼻]', '41.gif'],
                ['[鼓掌]', '42.gif'],
                ['[糗大了]', '43.gif'],
                ['[坏笑]', '44.gif'],
                ['[左哼哼]', '45.gif'],
                ['[右哼哼]', '46.gif'],
                ['[哈欠]', '47.gif'],
                ['[鄙视]', '48.gif'],
                ['[委屈]', '49.gif'],
                ['[快哭了]', '50.gif'],
                ['[阴险]', '51.gif'],
                ['[亲亲]', '52.gif'],
                ['[吓]', '53.gif'],
                ['[可怜]', '54.gif'],
                ['[菜刀]', '55.gif'],
                ['[西瓜]', '56.gif'],
                ['[啤酒]', '57.gif'],
                ['[篮球]', '58.gif'],
                ['[乒乓]', '59.gif'],
                ['[咖啡]', '60.gif'],
                ['[饭]', '61.gif'],
                ['[猪头]', '62.gif'],
                ['[玫瑰]', '63.gif'],
                ['[凋谢]', '64.gif'],
                ['[示爱]', '65.gif'],
                ['[爱心]', '66.gif'],
                ['[心碎]', '67.gif'],
                ['[蛋糕]', '68.gif'],
                ['[闪电]', '69.gif'],
                ['[炸弹]', '70.gif'],
                ['[刀]', '71.gif'],
                ['[足球]', '72.gif'],
                ['[瓢虫]', '73.gif'],
                ['[便便]', '74.gif'],
                ['[月亮]', '75.gif'],
                ['[太阳]', '76.gif'],
                ['[礼物]', '77.gif'],
                ['[拥抱]', '78.gif'],
                ['[强]', '79.gif'],
                ['[弱]', '80.gif'],
                ['[握手]', '81.gif'],
                ['[胜利]', '82.gif'],
                ['[抱拳]', '83.gif'],
                ['[勾引]', '84.gif'],
                ['[拳头]', '85.gif'],
                ['[差劲]', '86.gif'],
                ['[爱你]', '87.gif'],
                ['[NO]', '88.gif'],
                ['[OK]', '89.gif'],
                ['[爱情]', '90.gif'],
                ['[飞吻]', '91.gif'],
                ['[跳跳]', '92.gif'],
                ['[发抖]', '93.gif'],
                ['[怄火]', '94.gif'],
                ['[转圈]', '95.gif'],
                ['[磨牙]', '96.gif'],
                ['[嘿哈]', '97.gif'],
                ['[捂脸]', '98.gif'],
                ['[奸笑]', '99.gif'],
                ['[机智]', '100.gif'],
                ['[皱眉]', '101.gif'],
                ['[耶]', '102.gif'],
                ['[红包]', '103.gif'],
                ['[鸡]', '104.gif']
            ]);
        }

        /**
         * 初始化事件监听器
         */
        initEventListeners() {
            // 使用jQuery的事件委托，确保在DOM变化后仍然有效
            $(document).off('input.qqEmoji').on('input.qqEmoji', '#send_textarea', () => {
                this.previewEmojis();
            });

            // 监听消息发送前的处理
            $(document).off('beforeSendMessage.qqEmoji').on('beforeSendMessage.qqEmoji', (event, messageData) => {
                if (this.isEnabled && messageData && messageData.text) {
                    messageData.text = this.convertTextToEmoji(messageData.text);
                }
            });

            // 监听聊天消息渲染
            $(document).off('DOMNodeInserted.qqEmoji').on('DOMNodeInserted.qqEmoji', '.mes', (event) => {
                if (this.isEnabled) {
                    this.convertEmojiInElement(event.target);
                }
            });

            // 监听新消息添加
            const observer = new MutationObserver((mutations) => {
                if (!this.isEnabled) return;
                
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
                            if (node.classList && node.classList.contains('mes')) {
                                this.convertEmojiInElement(node);
                            } else {
                                // 查找子元素中的消息
                                if (typeof node.querySelectorAll === 'function') {
                                    const mesElements = node.querySelectorAll('.mes');
                                    if (mesElements) {
                                        mesElements.forEach(mes => {
                                            if (mes instanceof HTMLElement) {
                                                this.convertEmojiInElement(mes);
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        /**
         * 将文字表情转换为图片链接
         * @param {string} text - 包含表情文字的文本
         * @returns {string} - 转换后的文本
         */
        convertTextToEmoji(text) {
            if (!text || !this.isEnabled) return text;

            let convertedText = text;
            
            // 遍历表情映射，替换文字为图片标签
            for (const [emojiText, emojiFile] of this.emojiMap) {
                const regex = new RegExp(this.escapeRegExp(emojiText), 'g');
                const imgTag = `<img src="${this.emojiBaseUrl}${emojiFile}" alt="${emojiText}" class="qq-emoji" title="${emojiText}" />`;
                convertedText = convertedText.replace(regex, imgTag);
            }

            return convertedText;
        }

        /**
         * 在指定元素中转换表情
         * @param {HTMLElement} element - 要处理的元素
         */
        convertEmojiInElement(element) {
            if (!this.isEnabled || !element) return;

            const $element = $(element);
            if ($element.length === 0) return;

            // 避免重复处理
            if ($element.hasClass('emoji-processed')) return;
            $element.addClass('emoji-processed');

            // 查找消息文本元素
            const $textElements = $element.find('.mes_text, .message-text, .chat-message');
            if ($textElements.length === 0) {
                // 如果没找到特定的文本元素，处理整个元素
                const html = $element.html();
                if (html) {
                    const convertedHtml = this.convertTextToEmoji(html);
                    if (html !== convertedHtml) {
                        $element.html(convertedHtml);
                    }
                }
            } else {
                // 处理找到的文本元素
                $textElements.each((index, textElement) => {
                    const $textElement = $(textElement);
                    const html = $textElement.html();
                    if (html) {
                        const convertedHtml = this.convertTextToEmoji(html);
                        if (html !== convertedHtml) {
                            $textElement.html(convertedHtml);
                        }
                    }
                });
            }
        }

        /**
         * 预览表情（在输入框中显示）
         */
        previewEmojis() {
            if (!this.isEnabled) return;

            const $textarea = $('#send_textarea');
            if ($textarea.length === 0) return;

            const text = String($textarea.val() || '');
            
            // 创建预览容器
            let $preview = $('#emoji-preview');
            if ($preview.length === 0) {
                $preview = $('<div id="emoji-preview" class="emoji-preview"></div>');
                $textarea.after($preview);
            }

            // 检查是否包含表情文字
            let hasEmoji = false;
            for (const emojiText of this.emojiMap.keys()) {
                if (text.includes(emojiText)) {
                    hasEmoji = true;
                    break;
                }
            }

            if (hasEmoji) {
                const previewHtml = this.convertTextToEmoji(text);
                $preview.html(previewHtml).show();
            } else {
                $preview.hide();
            }
        }

        /**
         * 转义正则表达式特殊字符
         * @param {string} string - 要转义的字符串
         * @returns {string} - 转义后的字符串
         */
        escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        /**
         * 获取表情包选择器HTML
         * @returns {string} - 表情包选择器的HTML
         */
        getEmojiPickerHtml() {
            let html = '<div class="qq-emoji-picker">';
            html += '<div class="emoji-picker-header">';
            html += '<span>QQ表情包</span>';
            html += '<button class="emoji-picker-close" title="关闭">×</button>';
            html += '</div>';
            html += '<div class="emoji-picker-content">';
            
            for (const [emojiText, emojiFile] of this.emojiMap) {
                html += `<div class="emoji-item" data-emoji="${emojiText}" title="${emojiText}">`;
                html += `<img src="${this.emojiBaseUrl}${emojiFile}" alt="${emojiText}" />`;
                html += `<span class="emoji-text">${emojiText}</span>`;
                html += '</div>';
            }
            
            html += '</div></div>';
            return html;
        }

        /**
         * 显示表情包选择器
         */
        showEmojiPicker() {
            // 移除现有的选择器
            $('.qq-emoji-picker').remove();
            
            // 创建新的选择器
            const $picker = $(this.getEmojiPickerHtml());
            $('body').append($picker);
            
            // 绑定点击事件
            $picker.on('click', '.emoji-item', (e) => {
                const emojiText = $(e.currentTarget).data('emoji');
                this.insertEmojiToInput(emojiText);
                this.hideEmojiPicker();
            });

            // 绑定关闭按钮事件
            $picker.on('click', '.emoji-picker-close', () => {
                this.hideEmojiPicker();
            });
            
            // 点击外部关闭
            $(document).off('click.emojiPicker').on('click.emojiPicker', (e) => {
                if (!$(e.target).closest('.qq-emoji-picker, .emoji-picker-btn').length) {
                    this.hideEmojiPicker();
                }
            });
            
            $picker.show();
        }

        /**
         * 隐藏表情包选择器
         */
        hideEmojiPicker() {
            $('.qq-emoji-picker').remove();
            $(document).off('click.emojiPicker');
        }

        /**
         * 将表情插入到输入框
         * @param {string} emojiText - 表情文字
         */
        insertEmojiToInput(emojiText) {
            const $textarea = $('#send_textarea');
            if ($textarea.length === 0) return;

            const textareaElement = $textarea[0];
            const currentText = String($textarea.val() || '');
            
            // 获取光标位置
            let cursorPos = currentText.length;
            if (textareaElement && textareaElement.tagName === 'TEXTAREA') {
                try {
                    const selectionStart = textareaElement.selectionStart;
                    if (typeof selectionStart === 'number') {
                        cursorPos = selectionStart;
                    }
                } catch (e) {
                    // 忽略错误，使用默认位置
                }
            }
            
            const newText = currentText.slice(0, cursorPos) + emojiText + currentText.slice(cursorPos);
            $textarea.val(newText);
            
            // 设置光标位置
            const newCursorPos = cursorPos + emojiText.length;
            if (textareaElement && textareaElement.tagName === 'TEXTAREA') {
                try {
                    if (typeof textareaElement.setSelectionRange === 'function') {
                        textareaElement.setSelectionRange(newCursorPos, newCursorPos);
                    }
                } catch (e) {
                    // 忽略错误
                }
            }
            $textarea.focus();
            
            // 触发预览更新
            this.previewEmojis();
        }

        /**
         * 切换功能开关
         */
        toggle() {
            this.isEnabled = !this.isEnabled;
            this.saveSettings();
            
            if (!this.isEnabled) {
                $('#emoji-preview').hide();
            }
            
            console.log(`QQ表情包功能已${this.isEnabled ? '开启' : '关闭'}`);
        }

        /**
         * 保存设置
         */
        saveSettings() {
            try {
                localStorage.setItem('mobile_ui_test_qq_emoji_enabled', String(this.isEnabled));
            } catch (e) {
                console.warn('保存设置失败:', e);
            }
        }

        /**
         * 加载设置
         */
        loadSettings() {
            try {
                const saved = localStorage.getItem('mobile_ui_test_qq_emoji_enabled');
                if (saved !== null) {
                    this.isEnabled = saved === 'true';
                }
            } catch (e) {
                console.warn('加载设置失败:', e);
            }
        }

        /**
         * 销毁实例
         */
        destroy() {
            // 移除事件监听器
            $(document).off('.qqEmoji');
            
            // 移除UI元素
            $('.qq-emoji-picker').remove();
            $('#emoji-preview').remove();
            $('.emoji-picker-btn').remove();
            
            // 重置状态
            this.isInitialized = false;
            
            console.log('QQ表情包功能已销毁');
        }

        /**
         * 生成统一emoji按钮HTML
         */
        generateUnifiedEmojiButtons(emojis, baseUrl) {
            return emojis.map(emojiData => {
                // 将Unicode转换为Twemoji文件名格式
                const codepoint = this.unicodeToCodepoint(emojiData.unicode);
                const imgSrc = `${baseUrl}${codepoint}.png`;
                
                return `<button class="emoji-btn-test" data-emoji="${emojiData.unicode}" style="
                    padding: 8px; 
                    border: 1px solid #ddd; 
                    background: #f9f9f9; 
                    cursor: pointer; 
                    border-radius: 6px; 
                    transition: all 0.2s ease;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                " title="${emojiData.name}">
                    <img src="${imgSrc}" 
                         alt="${emojiData.unicode}" 
                         style="width: 24px; height: 24px; pointer-events: none;"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='${emojiData.unicode}';"
                    />
                </button>`;
            }).join('');
        }

        /**
         * 将Unicode emoji转换为Twemoji文件名的codepoint格式
         */
        unicodeToCodepoint(unicode) {
            // 移除变体选择器和零宽连接符
            const cleaned = unicode.replace(/[\uFE00-\uFE0F\u200D]/g, '');
            
            // 转换为codepoint数组
            const codepoints = [];
            for (let i = 0; i < cleaned.length; i++) {
                const char = cleaned.charAt(i);
                const code = char.codePointAt(0);
                
                if (code) {
                    codepoints.push(code.toString(16).toLowerCase());
                    
                    // 处理代理对
                    if (code > 0xFFFF) {
                        i++; // 跳过下一个字符，因为它是代理对的一部分
                    }
                }
            }
            
            return codepoints.join('-');
        }
        
        /**
         * 创建表情包按钮
         */
        createEmojiButton() {
            // 这个方法被waitForDOM调用，但暂时为空
            console.log('createEmojiButton方法被调用');
        }

        // 填充表情分类内容
        fillEmojiCategories() {
            // 使用统一的emoji图片映射，确保所有设备显示一致
            const emojiCategories = {
                smile: [
                    // 使用对象格式：{unicode: '😀', name: 'grinning', file: 'grinning.png'}
                    {unicode: '😀', name: 'grinning', file: 'grinning.png'},
                    {unicode: '😃', name: 'grinning-face-with-big-eyes', file: 'grinning-face-with-big-eyes.png'},
                    {unicode: '😄', name: 'grinning-face-with-smiling-eyes', file: 'grinning-face-with-smiling-eyes.png'},
                    {unicode: '😁', name: 'beaming-face-with-smiling-eyes', file: 'beaming-face-with-smiling-eyes.png'},
                    {unicode: '😆', name: 'grinning-squinting-face', file: 'grinning-squinting-face.png'},
                    {unicode: '😅', name: 'grinning-face-with-sweat', file: 'grinning-face-with-sweat.png'},
                    {unicode: '😂', name: 'face-with-tears-of-joy', file: 'face-with-tears-of-joy.png'},
                    {unicode: '🤣', name: 'rolling-on-the-floor-laughing', file: 'rolling-on-the-floor-laughing.png'},
                    {unicode: '😊', name: 'smiling-face-with-smiling-eyes', file: 'smiling-face-with-smiling-eyes.png'},
                    {unicode: '😇', name: 'smiling-face-with-halo', file: 'smiling-face-with-halo.png'},
                    {unicode: '🙂', name: 'slightly-smiling-face', file: 'slightly-smiling-face.png'},
                    {unicode: '🙃', name: 'upside-down-face', file: 'upside-down-face.png'},
                    {unicode: '😉', name: 'winking-face', file: 'winking-face.png'},
                    {unicode: '😌', name: 'relieved-face', file: 'relieved-face.png'},
                    {unicode: '😍', name: 'smiling-face-with-heart-eyes', file: 'smiling-face-with-heart-eyes.png'},
                    {unicode: '🥰', name: 'smiling-face-with-hearts', file: 'smiling-face-with-hearts.png'},
                    {unicode: '😘', name: 'face-blowing-a-kiss', file: 'face-blowing-a-kiss.png'},
                    {unicode: '😗', name: 'kissing-face', file: 'kissing-face.png'},
                    {unicode: '😙', name: 'kissing-face-with-smiling-eyes', file: 'kissing-face-with-smiling-eyes.png'},
                    {unicode: '😚', name: 'kissing-face-with-closed-eyes', file: 'kissing-face-with-closed-eyes.png'},
                    {unicode: '😋', name: 'face-savoring-food', file: 'face-savoring-food.png'},
                    {unicode: '😛', name: 'face-with-tongue', file: 'face-with-tongue.png'},
                    {unicode: '😝', name: 'squinting-face-with-tongue', file: 'squinting-face-with-tongue.png'},
                    {unicode: '😜', name: 'winking-face-with-tongue', file: 'winking-face-with-tongue.png'},
                    {unicode: '🤪', name: 'zany-face', file: 'zany-face.png'},
                    {unicode: '🤨', name: 'face-with-raised-eyebrow', file: 'face-with-raised-eyebrow.png'},
                    {unicode: '🧐', name: 'face-with-monocle', file: 'face-with-monocle.png'},
                    {unicode: '🤓', name: 'nerd-face', file: 'nerd-face.png'},
                    {unicode: '😎', name: 'smiling-face-with-sunglasses', file: 'smiling-face-with-sunglasses.png'},
                    {unicode: '🤩', name: 'star-struck', file: 'star-struck.png'},
                    {unicode: '🥳', name: 'partying-face', file: 'partying-face.png'},
                    {unicode: '😏', name: 'smirking-face', file: 'smirking-face.png'},
                    {unicode: '😒', name: 'unamused-face', file: 'unamused-face.png'},
                    {unicode: '😞', name: 'disappointed-face', file: 'disappointed-face.png'},
                    {unicode: '😔', name: 'pensive-face', file: 'pensive-face.png'},
                    {unicode: '😟', name: 'worried-face', file: 'worried-face.png'},
                    {unicode: '😕', name: 'confused-face', file: 'confused-face.png'},
                    {unicode: '🙁', name: 'slightly-frowning-face', file: 'slightly-frowning-face.png'},
                    {unicode: '☹️', name: 'frowning-face', file: 'frowning-face.png'},
                    {unicode: '😣', name: 'persevering-face', file: 'persevering-face.png'},
                    {unicode: '😖', name: 'confounded-face', file: 'confounded-face.png'},
                    {unicode: '😫', name: 'tired-face', file: 'tired-face.png'},
                    {unicode: '😩', name: 'weary-face', file: 'weary-face.png'},
                    {unicode: '🥺', name: 'pleading-face', file: 'pleading-face.png'},
                    {unicode: '😢', name: 'crying-face', file: 'crying-face.png'},
                    {unicode: '😭', name: 'loudly-crying-face', file: 'loudly-crying-face.png'},
                    {unicode: '😤', name: 'face-with-steam-from-nose', file: 'face-with-steam-from-nose.png'},
                    {unicode: '😠', name: 'angry-face', file: 'angry-face.png'},
                    {unicode: '😡', name: 'pouting-face', file: 'pouting-face.png'},
                    {unicode: '🤬', name: 'face-with-symbols-on-mouth', file: 'face-with-symbols-on-mouth.png'},
                    {unicode: '🤯', name: 'exploding-head', file: 'exploding-head.png'},
                    {unicode: '😳', name: 'flushed-face', file: 'flushed-face.png'},
                    {unicode: '🥵', name: 'hot-face', file: 'hot-face.png'},
                    {unicode: '🥶', name: 'cold-face', file: 'cold-face.png'},
                    {unicode: '😱', name: 'face-screaming-in-fear', file: 'face-screaming-in-fear.png'},
                    {unicode: '😨', name: 'fearful-face', file: 'fearful-face.png'}
                ],
                people: [
                    {unicode: '👶', name: 'baby', file: 'baby.png'},
                    {unicode: '🧒', name: 'child', file: 'child.png'},
                    {unicode: '👦', name: 'boy', file: 'boy.png'},
                    {unicode: '👧', name: 'girl', file: 'girl.png'},
                    {unicode: '🧑', name: 'person', file: 'person.png'},
                    {unicode: '👱', name: 'person-blond-hair', file: 'person-blond-hair.png'},
                    {unicode: '👨', name: 'man', file: 'man.png'},
                    {unicode: '🧔', name: 'man-beard', file: 'man-beard.png'},
                    {unicode: '👩', name: 'woman', file: 'woman.png'},
                    {unicode: '🧓', name: 'older-person', file: 'older-person.png'},
                    {unicode: '👴', name: 'old-man', file: 'old-man.png'},
                    {unicode: '👵', name: 'old-woman', file: 'old-woman.png'},
                    {unicode: '🙍', name: 'person-frowning', file: 'person-frowning.png'},
                    {unicode: '🙎', name: 'person-pouting', file: 'person-pouting.png'},
                    {unicode: '🙅', name: 'person-gesturing-no', file: 'person-gesturing-no.png'},
                    {unicode: '🙆', name: 'person-gesturing-ok', file: 'person-gesturing-ok.png'},
                    {unicode: '💁', name: 'person-tipping-hand', file: 'person-tipping-hand.png'},
                    {unicode: '🙋', name: 'person-raising-hand', file: 'person-raising-hand.png'},
                    {unicode: '🧏', name: 'deaf-person', file: 'deaf-person.png'},
                    {unicode: '🙇', name: 'person-bowing', file: 'person-bowing.png'},
                    {unicode: '🤦', name: 'person-facepalming', file: 'person-facepalming.png'},
                    {unicode: '🤷', name: 'person-shrugging', file: 'person-shrugging.png'},
                    {unicode: '👮', name: 'police-officer', file: 'police-officer.png'},
                    {unicode: '🕵️', name: 'detective', file: 'detective.png'},
                    {unicode: '💂', name: 'guard', file: 'guard.png'},
                    {unicode: '🥷', name: 'ninja', file: 'ninja.png'},
                    {unicode: '👷', name: 'construction-worker', file: 'construction-worker.png'},
                    {unicode: '🤴', name: 'prince', file: 'prince.png'},
                    {unicode: '👸', name: 'princess', file: 'princess.png'},
                    {unicode: '👳', name: 'person-wearing-turban', file: 'person-wearing-turban.png'},
                    {unicode: '👲', name: 'person-with-skullcap', file: 'person-with-skullcap.png'},
                    {unicode: '🧕', name: 'woman-with-headscarf', file: 'woman-with-headscarf.png'},
                    {unicode: '🤵', name: 'person-in-tuxedo', file: 'person-in-tuxedo.png'},
                    {unicode: '👰', name: 'person-with-veil', file: 'person-with-veil.png'},
                    {unicode: '🤰', name: 'pregnant-woman', file: 'pregnant-woman.png'},
                    {unicode: '🤱', name: 'breast-feeding', file: 'breast-feeding.png'},
                    {unicode: '👼', name: 'baby-angel', file: 'baby-angel.png'},
                    {unicode: '🎅', name: 'santa-claus', file: 'santa-claus.png'},
                    {unicode: '🤶', name: 'mrs-claus', file: 'mrs-claus.png'},
                    {unicode: '🦸', name: 'superhero', file: 'superhero.png'},
                    {unicode: '🦹', name: 'supervillain', file: 'supervillain.png'},
                    {unicode: '🧙', name: 'mage', file: 'mage.png'},
                    {unicode: '🧚', name: 'fairy', file: 'fairy.png'},
                    {unicode: '🧛', name: 'vampire', file: 'vampire.png'},
                    {unicode: '🧜', name: 'merperson', file: 'merperson.png'},
                    {unicode: '🧝', name: 'elf', file: 'elf.png'},
                    {unicode: '🧞', name: 'genie', file: 'genie.png'},
                    {unicode: '🧟', name: 'zombie', file: 'zombie.png'}
                ],
                nature: [
                    {unicode: '🐶', name: 'dog-face', file: 'dog-face.png'},
                    {unicode: '🐱', name: 'cat-face', file: 'cat-face.png'},
                    {unicode: '🐭', name: 'mouse-face', file: 'mouse-face.png'},
                    {unicode: '🐹', name: 'hamster', file: 'hamster.png'},
                    {unicode: '🐰', name: 'rabbit-face', file: 'rabbit-face.png'},
                    {unicode: '🦊', name: 'fox', file: 'fox.png'},
                    {unicode: '🐻', name: 'bear', file: 'bear.png'},
                    {unicode: '🐼', name: 'panda', file: 'panda.png'},
                    {unicode: '🐨', name: 'koala', file: 'koala.png'},
                    {unicode: '🐯', name: 'tiger-face', file: 'tiger-face.png'},
                    {unicode: '🦁', name: 'lion', file: 'lion.png'},
                    {unicode: '🐮', name: 'cow-face', file: 'cow-face.png'},
                    {unicode: '🐷', name: 'pig-face', file: 'pig-face.png'},
                    {unicode: '🐽', name: 'pig-nose', file: 'pig-nose.png'},
                    {unicode: '🐸', name: 'frog', file: 'frog.png'},
                    {unicode: '🐵', name: 'monkey-face', file: 'monkey-face.png'},
                    {unicode: '🙈', name: 'see-no-evil-monkey', file: 'see-no-evil-monkey.png'},
                    {unicode: '🙉', name: 'hear-no-evil-monkey', file: 'hear-no-evil-monkey.png'},
                    {unicode: '🙊', name: 'speak-no-evil-monkey', file: 'speak-no-evil-monkey.png'},
                    {unicode: '🐒', name: 'monkey', file: 'monkey.png'},
                    {unicode: '🐔', name: 'chicken', file: 'chicken.png'},
                    {unicode: '🐧', name: 'penguin', file: 'penguin.png'},
                    {unicode: '🐦', name: 'bird', file: 'bird.png'},
                    {unicode: '🐤', name: 'baby-chick', file: 'baby-chick.png'},
                    {unicode: '🐣', name: 'hatching-chick', file: 'hatching-chick.png'},
                    {unicode: '🐥', name: 'front-facing-baby-chick', file: 'front-facing-baby-chick.png'},
                    {unicode: '🦆', name: 'duck', file: 'duck.png'},
                    {unicode: '🦅', name: 'eagle', file: 'eagle.png'},
                    {unicode: '🦉', name: 'owl', file: 'owl.png'},
                    {unicode: '🦇', name: 'bat', file: 'bat.png'},
                    {unicode: '🐺', name: 'wolf', file: 'wolf.png'},
                    {unicode: '🐗', name: 'boar', file: 'boar.png'},
                    {unicode: '🌲', name: 'evergreen-tree', file: 'evergreen-tree.png'},
                    {unicode: '🌳', name: 'deciduous-tree', file: 'deciduous-tree.png'},
                    {unicode: '🌴', name: 'palm-tree', file: 'palm-tree.png'},
                    {unicode: '🌵', name: 'cactus', file: 'cactus.png'},
                    {unicode: '🌶️', name: 'hot-pepper', file: 'hot-pepper.png'},
                    {unicode: '🍄', name: 'mushroom', file: 'mushroom.png'},
                    {unicode: '🌾', name: 'sheaf-of-rice', file: 'sheaf-of-rice.png'},
                    {unicode: '💐', name: 'bouquet', file: 'bouquet.png'},
                    {unicode: '🌷', name: 'tulip', file: 'tulip.png'},
                    {unicode: '🌹', name: 'rose', file: 'rose.png'},
                    {unicode: '🥀', name: 'wilted-flower', file: 'wilted-flower.png'},
                    {unicode: '🌺', name: 'hibiscus', file: 'hibiscus.png'},
                    {unicode: '🌸', name: 'cherry-blossom', file: 'cherry-blossom.png'},
                    {unicode: '🌼', name: 'daisy', file: 'daisy.png'},
                    {unicode: '🌻', name: 'sunflower', file: 'sunflower.png'},
                    {unicode: '☀️', name: 'sun', file: 'sun.png'}
                ],
                food: [
                    {unicode: '🍎', name: 'red-apple', file: 'red-apple.png'},
                    {unicode: '🍐', name: 'pear', file: 'pear.png'},
                    {unicode: '🍊', name: 'tangerine', file: 'tangerine.png'},
                    {unicode: '🍋', name: 'lemon', file: 'lemon.png'},
                    {unicode: '🍌', name: 'banana', file: 'banana.png'},
                    {unicode: '🍉', name: 'watermelon', file: 'watermelon.png'},
                    {unicode: '🍇', name: 'grapes', file: 'grapes.png'},
                    {unicode: '🍓', name: 'strawberry', file: 'strawberry.png'},
                    {unicode: '🫐', name: 'blueberries', file: 'blueberries.png'},
                    {unicode: '🍈', name: 'melon', file: 'melon.png'},
                    {unicode: '🍒', name: 'cherries', file: 'cherries.png'},
                    {unicode: '🍑', name: 'peach', file: 'peach.png'},
                    {unicode: '🥭', name: 'mango', file: 'mango.png'},
                    {unicode: '🍍', name: 'pineapple', file: 'pineapple.png'},
                    {unicode: '🥥', name: 'coconut', file: 'coconut.png'},
                    {unicode: '🥝', name: 'kiwi-fruit', file: 'kiwi-fruit.png'},
                    {unicode: '🍅', name: 'tomato', file: 'tomato.png'},
                    {unicode: '🍆', name: 'eggplant', file: 'eggplant.png'},
                    {unicode: '🥑', name: 'avocado', file: 'avocado.png'},
                    {unicode: '🥦', name: 'broccoli', file: 'broccoli.png'},
                    {unicode: '🥬', name: 'leafy-greens', file: 'leafy-greens.png'},
                    {unicode: '🥒', name: 'cucumber', file: 'cucumber.png'},
                    {unicode: '🌶️', name: 'hot-pepper', file: 'hot-pepper.png'},
                    {unicode: '🫑', name: 'bell-pepper', file: 'bell-pepper.png'},
                    {unicode: '🌽', name: 'ear-of-corn', file: 'ear-of-corn.png'},
                    {unicode: '🥕', name: 'carrot', file: 'carrot.png'},
                    {unicode: '🫒', name: 'olive', file: 'olive.png'},
                    {unicode: '🧄', name: 'garlic', file: 'garlic.png'},
                    {unicode: '🧅', name: 'onion', file: 'onion.png'},
                    {unicode: '🥔', name: 'potato', file: 'potato.png'},
                    {unicode: '🍠', name: 'roasted-sweet-potato', file: 'roasted-sweet-potato.png'},
                    {unicode: '🥖', name: 'baguette-bread', file: 'baguette-bread.png'},
                    {unicode: '🍞', name: 'bread', file: 'bread.png'},
                    {unicode: '🥯', name: 'bagel', file: 'bagel.png'},
                    {unicode: '🥨', name: 'pretzel', file: 'pretzel.png'},
                    {unicode: '🧀', name: 'cheese-wedge', file: 'cheese-wedge.png'},
                    {unicode: '🥚', name: 'egg', file: 'egg.png'},
                    {unicode: '🍳', name: 'cooking', file: 'cooking.png'},
                    {unicode: '🧈', name: 'butter', file: 'butter.png'},
                    {unicode: '🥞', name: 'pancakes', file: 'pancakes.png'},
                    {unicode: '🧇', name: 'waffle', file: 'waffle.png'},
                    {unicode: '🥓', name: 'bacon', file: 'bacon.png'},
                    {unicode: '🥩', name: 'cut-of-meat', file: 'cut-of-meat.png'},
                    {unicode: '🍗', name: 'poultry-leg', file: 'poultry-leg.png'},
                    {unicode: '🍖', name: 'meat-on-bone', file: 'meat-on-bone.png'},
                    {unicode: '🦴', name: 'bone', file: 'bone.png'},
                    {unicode: '🌭', name: 'hot-dog', file: 'hot-dog.png'},
                    {unicode: '🍔', name: 'hamburger', file: 'hamburger.png'}
                ],
                activity: [
                    {unicode: '⚽', name: 'soccer-ball', file: 'soccer-ball.png'},
                    {unicode: '🏀', name: 'basketball', file: 'basketball.png'},
                    {unicode: '🏈', name: 'american-football', file: 'american-football.png'},
                    {unicode: '⚾', name: 'baseball', file: 'baseball.png'},
                    {unicode: '🥎', name: 'softball', file: 'softball.png'},
                    {unicode: '🎾', name: 'tennis', file: 'tennis.png'},
                    {unicode: '🏐', name: 'volleyball', file: 'volleyball.png'},
                    {unicode: '🏉', name: 'rugby-football', file: 'rugby-football.png'},
                    {unicode: '🥏', name: 'flying-disc', file: 'flying-disc.png'},
                    {unicode: '🎱', name: 'pool-8-ball', file: 'pool-8-ball.png'},
                    {unicode: '🪀', name: 'yo-yo', file: 'yo-yo.png'},
                    {unicode: '🏓', name: 'ping-pong', file: 'ping-pong.png'},
                    {unicode: '🏸', name: 'badminton', file: 'badminton.png'},
                    {unicode: '🏒', name: 'ice-hockey', file: 'ice-hockey.png'},
                    {unicode: '🏑', name: 'field-hockey', file: 'field-hockey.png'},
                    {unicode: '🥍', name: 'lacrosse', file: 'lacrosse.png'},
                    {unicode: '🏏', name: 'cricket-game', file: 'cricket-game.png'},
                    {unicode: '🪃', name: 'boomerang', file: 'boomerang.png'},
                    {unicode: '🥅', name: 'goal-net', file: 'goal-net.png'},
                    {unicode: '⛳', name: 'flag-in-hole', file: 'flag-in-hole.png'},
                    {unicode: '🪁', name: 'kite', file: 'kite.png'},
                    {unicode: '🏹', name: 'bow-and-arrow', file: 'bow-and-arrow.png'},
                    {unicode: '🎣', name: 'fishing-pole', file: 'fishing-pole.png'},
                    {unicode: '🤿', name: 'diving-mask', file: 'diving-mask.png'},
                    {unicode: '🥊', name: 'boxing-glove', file: 'boxing-glove.png'},
                    {unicode: '🥋', name: 'martial-arts-uniform', file: 'martial-arts-uniform.png'},
                    {unicode: '🎽', name: 'running-shirt', file: 'running-shirt.png'},
                    {unicode: '🛹', name: 'skateboard', file: 'skateboard.png'},
                    {unicode: '🛷', name: 'sled', file: 'sled.png'},
                    {unicode: '⛸️', name: 'ice-skate', file: 'ice-skate.png'},
                    {unicode: '🥌', name: 'curling-stone', file: 'curling-stone.png'},
                    {unicode: '🎿', name: 'skis', file: 'skis.png'},
                    {unicode: '⛷️', name: 'skier', file: 'skier.png'},
                    {unicode: '🏂', name: 'snowboarder', file: 'snowboarder.png'},
                    {unicode: '🪂', name: 'parachute', file: 'parachute.png'},
                    {unicode: '🏋️', name: 'person-lifting-weights', file: 'person-lifting-weights.png'},
                    {unicode: '🤼', name: 'people-wrestling', file: 'people-wrestling.png'},
                    {unicode: '🤸', name: 'person-cartwheeling', file: 'person-cartwheeling.png'},
                    {unicode: '⛹️', name: 'person-bouncing-ball', file: 'person-bouncing-ball.png'},
                    {unicode: '🤺', name: 'person-fencing', file: 'person-fencing.png'},
                    {unicode: '🏌️', name: 'person-golfing', file: 'person-golfing.png'},
                    {unicode: '🏇', name: 'horse-racing', file: 'horse-racing.png'},
                    {unicode: '🧘', name: 'person-in-lotus-position', file: 'person-in-lotus-position.png'},
                    {unicode: '🏄', name: 'person-surfing', file: 'person-surfing.png'},
                    {unicode: '🏊', name: 'person-swimming', file: 'person-swimming.png'},
                    {unicode: '🤽', name: 'person-playing-water-polo', file: 'person-playing-water-polo.png'},
                    {unicode: '🚣', name: 'person-rowing-boat', file: 'person-rowing-boat.png'},
                    {unicode: '🧗', name: 'person-climbing', file: 'person-climbing.png'}
                ],
                objects: [
                    {unicode: '⌚', name: 'watch', file: 'watch.png'},
                    {unicode: '📱', name: 'mobile-phone', file: 'mobile-phone.png'},
                    {unicode: '📲', name: 'mobile-phone-with-arrow', file: 'mobile-phone-with-arrow.png'},
                    {unicode: '💻', name: 'laptop', file: 'laptop.png'},
                    {unicode: '⌨️', name: 'keyboard', file: 'keyboard.png'},
                    {unicode: '🖥️', name: 'desktop-computer', file: 'desktop-computer.png'},
                    {unicode: '🖨️', name: 'printer', file: 'printer.png'},
                    {unicode: '🖱️', name: 'computer-mouse', file: 'computer-mouse.png'},
                    {unicode: '🖲️', name: 'trackball', file: 'trackball.png'},
                    {unicode: '🕹️', name: 'joystick', file: 'joystick.png'},
                    {unicode: '🗜️', name: 'clamp', file: 'clamp.png'},
                    {unicode: '💽', name: 'computer-disk', file: 'computer-disk.png'},
                    {unicode: '💾', name: 'floppy-disk', file: 'floppy-disk.png'},
                    {unicode: '💿', name: 'optical-disk', file: 'optical-disk.png'},
                    {unicode: '📀', name: 'dvd', file: 'dvd.png'},
                    {unicode: '📼', name: 'videocassette', file: 'videocassette.png'},
                    {unicode: '📷', name: 'camera', file: 'camera.png'},
                    {unicode: '📸', name: 'camera-with-flash', file: 'camera-with-flash.png'},
                    {unicode: '📹', name: 'video-camera', file: 'video-camera.png'},
                    {unicode: '🎥', name: 'movie-camera', file: 'movie-camera.png'},
                    {unicode: '📽️', name: 'film-projector', file: 'film-projector.png'},
                    {unicode: '🎞️', name: 'film-strip', file: 'film-strip.png'},
                    {unicode: '📞', name: 'telephone-receiver', file: 'telephone-receiver.png'},
                    {unicode: '☎️', name: 'telephone', file: 'telephone.png'},
                    {unicode: '📟', name: 'pager', file: 'pager.png'},
                    {unicode: '📠', name: 'fax-machine', file: 'fax-machine.png'},
                    {unicode: '📺', name: 'television', file: 'television.png'},
                    {unicode: '📻', name: 'radio', file: 'radio.png'},
                    {unicode: '🎙️', name: 'studio-microphone', file: 'studio-microphone.png'},
                    {unicode: '🎚️', name: 'level-slider', file: 'level-slider.png'},
                    {unicode: '🎛️', name: 'control-knobs', file: 'control-knobs.png'},
                    {unicode: '🧭', name: 'compass', file: 'compass.png'},
                    {unicode: '⏰', name: 'alarm-clock', file: 'alarm-clock.png'},
                    {unicode: '⏲️', name: 'timer-clock', file: 'timer-clock.png'},
                    {unicode: '⏱️', name: 'stopwatch', file: 'stopwatch.png'},
                    {unicode: '🕰️', name: 'mantelpiece-clock', file: 'mantelpiece-clock.png'},
                    {unicode: '⌛', name: 'hourglass-done', file: 'hourglass-done.png'},
                    {unicode: '⏳', name: 'hourglass-not-done', file: 'hourglass-not-done.png'},
                    {unicode: '📡', name: 'satellite-antenna', file: 'satellite-antenna.png'},
                    {unicode: '🔋', name: 'battery', file: 'battery.png'},
                    {unicode: '🪫', name: 'low-battery', file: 'low-battery.png'},
                    {unicode: '🔌', name: 'electric-plug', file: 'electric-plug.png'},
                    {unicode: '💡', name: 'light-bulb', file: 'light-bulb.png'},
                    {unicode: '🔦', name: 'flashlight', file: 'flashlight.png'},
                    {unicode: '🕯️', name: 'candle', file: 'candle.png'},
                    {unicode: '🪔', name: 'diya-lamp', file: 'diya-lamp.png'},
                    {unicode: '🧯', name: 'fire-extinguisher', file: 'fire-extinguisher.png'}
                ],
                symbols: [
                    {unicode: '❤️', name: 'red-heart', file: 'red-heart.png'},
                    {unicode: '🧡', name: 'orange-heart', file: 'orange-heart.png'},
                    {unicode: '💛', name: 'yellow-heart', file: 'yellow-heart.png'},
                    {unicode: '💚', name: 'green-heart', file: 'green-heart.png'},
                    {unicode: '💙', name: 'blue-heart', file: 'blue-heart.png'},
                    {unicode: '💜', name: 'purple-heart', file: 'purple-heart.png'},
                    {unicode: '🖤', name: 'black-heart', file: 'black-heart.png'},
                    {unicode: '🤍', name: 'white-heart', file: 'white-heart.png'},
                    {unicode: '🤎', name: 'brown-heart', file: 'brown-heart.png'},
                    {unicode: '💔', name: 'broken-heart', file: 'broken-heart.png'},
                    {unicode: '❣️', name: 'heart-exclamation', file: 'heart-exclamation.png'},
                    {unicode: '💕', name: 'two-hearts', file: 'two-hearts.png'},
                    {unicode: '💞', name: 'revolving-hearts', file: 'revolving-hearts.png'},
                    {unicode: '💓', name: 'beating-heart', file: 'beating-heart.png'},
                    {unicode: '💗', name: 'growing-heart', file: 'growing-heart.png'},
                    {unicode: '💖', name: 'sparkling-heart', file: 'sparkling-heart.png'},
                    {unicode: '💘', name: 'heart-with-arrow', file: 'heart-with-arrow.png'},
                    {unicode: '💝', name: 'heart-with-ribbon', file: 'heart-with-ribbon.png'},
                    {unicode: '💟', name: 'heart-decoration', file: 'heart-decoration.png'},
                    {unicode: '☮️', name: 'peace-symbol', file: 'peace-symbol.png'},
                    {unicode: '✝️', name: 'latin-cross', file: 'latin-cross.png'},
                    {unicode: '☪️', name: 'star-and-crescent', file: 'star-and-crescent.png'},
                    {unicode: '🕉️', name: 'om', file: 'om.png'},
                    {unicode: '☸️', name: 'wheel-of-dharma', file: 'wheel-of-dharma.png'},
                    {unicode: '✡️', name: 'star-of-david', file: 'star-of-david.png'},
                    {unicode: '🔯', name: 'dotted-six-pointed-star', file: 'dotted-six-pointed-star.png'},
                    {unicode: '🕎', name: 'menorah', file: 'menorah.png'},
                    {unicode: '☯️', name: 'yin-yang', file: 'yin-yang.png'},
                    {unicode: '☦️', name: 'orthodox-cross', file: 'orthodox-cross.png'},
                    {unicode: '🛐', name: 'place-of-worship', file: 'place-of-worship.png'},
                    {unicode: '⛎', name: 'ophiuchus', file: 'ophiuchus.png'},
                    {unicode: '♈', name: 'aries', file: 'aries.png'},
                    {unicode: '♉', name: 'taurus', file: 'taurus.png'},
                    {unicode: '♊', name: 'gemini', file: 'gemini.png'},
                    {unicode: '♋', name: 'cancer', file: 'cancer.png'},
                    {unicode: '♌', name: 'leo', file: 'leo.png'},
                    {unicode: '♍', name: 'virgo', file: 'virgo.png'},
                    {unicode: '♎', name: 'libra', file: 'libra.png'},
                    {unicode: '♏', name: 'scorpio', file: 'scorpio.png'},
                    {unicode: '♐', name: 'sagittarius', file: 'sagittarius.png'},
                    {unicode: '♑', name: 'capricorn', file: 'capricorn.png'},
                    {unicode: '♒', name: 'aquarius', file: 'aquarius.png'},
                    {unicode: '♓', name: 'pisces', file: 'pisces.png'},
                    {unicode: '🆔', name: 'id-button', file: 'id-button.png'},
                    {unicode: '⚛️', name: 'atom-symbol', file: 'atom-symbol.png'},
                    {unicode: '🉑', name: 'japanese-acceptable-button', file: 'japanese-acceptable-button.png'},
                    {unicode: '☢️', name: 'radioactive', file: 'radioactive.png'},
                    {unicode: '☣️', name: 'biohazard', file: 'biohazard.png'}
                ]
            };
            
            // 统一的emoji图片基础路径 - 使用Twemoji CDN确保跨设备一致性
            const emojiImageBaseUrl = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/';
            
            // 填充每个分类的内容
            Object.keys(emojiCategories).forEach(category => {
                const categoryElement = document.querySelector(`.emoji-category[data-category="${category}"]`);
                if (categoryElement) {
                    const emojis = emojiCategories[category];
                    const buttonsHTML = this.generateUnifiedEmojiButtons(emojis, emojiImageBaseUrl);
                    categoryElement.innerHTML = buttonsHTML;
                    console.log(`✅ 已填充 ${category} 分类，共 ${emojis.length} 个统一emoji`);
                }
            });
            
            console.log('✅ 所有emoji分类内容填充完成（使用统一图片资源）');
        }
    }

    // 创建全局实例
    const instance = new QQEmojiManager();
    
    // 返回公共接口
    return {
        init: () => instance.init(),
        toggle: () => instance.toggle(),
        destroy: () => instance.destroy(),
        getInstance: () => instance
    };
})();

// 调试信息
console.log('✅ QQEmojiManager对象已成功创建并导出到window.QQEmojiManager');

// 自动初始化（如果jQuery已加载）
if (typeof $ !== 'undefined') {
    $(document).ready(() => {
        if (window.QQEmojiManager) {
            window.QQEmojiManager.init();
        }
    });
} else {
    // 等待jQuery加载
    const checkJQuery = () => {
        if (typeof $ !== 'undefined') {
            $(document).ready(() => {
                if (window.QQEmojiManager) {
                    window.QQEmojiManager.init();
                }
            });
        } else {
            setTimeout(checkJQuery, 100);
        }
    };
    checkJQuery();
}

console.log('QQ表情包模块已加载');

// QQ表情面板功能
(function(window) {
    'use strict';
    
    const QQEmoji = {
        // 标记是否正在显示面板，防止重复创建
        isShowingPanel: false,
        
        // 显示表情面板
        showEmojiPanel: function() {
            console.log('🎭 ======= 开始显示表情面板 =======');
            
            // 如果已经在显示面板，直接返回
            if (this.isShowingPanel) {
                console.log('⚠️ 表情面板正在显示中，跳过重复创建');
                return;
            }
            
            try {
                // 设置显示标记
                this.isShowingPanel = true;
                
                // 第一步：检查基础环境
                console.log('1️⃣ 检查基础环境...');
                if (typeof $ === 'undefined') {
                    console.error('❌ jQuery未定义');
                    alert('jQuery未加载，无法显示表情面板');
                    this.isShowingPanel = false;
                    return;
                }
                console.log('✅ jQuery已加载');
                
                // 第二步：强制移除所有现有面板
                console.log('2️⃣ 强制移除所有现有面板...');
                this.forceRemoveAllPanels();
                console.log('✅ 现有面板已强制清理');
                
                // 第三步：创建表情面板HTML
                console.log('3️⃣ 创建表情面板HTML...');
                const panelHTML = `
                    <div class="qq-emoji-panel" id="qq-emoji-panel-unique-${Date.now()}" style="
                        position: absolute !important;
                        bottom: 20px !important;
                        left: 50% !important;
                        transform: translateX(-50%) !important;
                        width: 90% !important;
                        max-width: 450px !important;
                        background: white !important;
                        border-radius: 12px !important;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
                        z-index: 99999 !important;
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                    ">
                        <!-- 表情面板头部 -->
                        <div style="padding: 15px; text-align: center; background: #f8f9fa; border-radius: 12px 12px 0 0; border-bottom: 1px solid #e9ecef;">
                            <h3 style="margin: 0; color: #333; font-size: 16px;">🎭 QQ表情面板</h3>
                            <button class="close-emoji-panel" style="position: absolute; top: 10px; right: 15px; padding: 5px 8px; background: #dc3545; color: white; border: none; cursor: pointer; border-radius: 50%; width: 30px; height: 30px; font-size: 16px; line-height: 1;">×</button>
                        </div>
                        
                        <!-- 分类标签页 -->
                        <div class="emoji-tabs" style="display: flex; background: #f8f9fa; border-bottom: 1px solid #e9ecef; overflow-x: auto;">
                            <button class="emoji-tab active" data-category="smile" style="flex: 1; padding: 8px 12px; border: none; background: transparent; cursor: pointer; font-size: 18px; border-bottom: 2px solid #007bff;">😊</button>
                            <button class="emoji-tab" data-category="people" style="flex: 1; padding: 8px 12px; border: none; background: transparent; cursor: pointer; font-size: 18px; border-bottom: 2px solid transparent;">👥</button>
                            <button class="emoji-tab" data-category="nature" style="flex: 1; padding: 8px 12px; border: none; background: transparent; cursor: pointer; font-size: 18px; border-bottom: 2px solid transparent;">🌿</button>
                            <button class="emoji-tab" data-category="food" style="flex: 1; padding: 8px 12px; border: none; background: transparent; cursor: pointer; font-size: 18px; border-bottom: 2px solid transparent;">🍔</button>
                            <button class="emoji-tab" data-category="activity" style="flex: 1; padding: 8px 12px; border: none; background: transparent; cursor: pointer; font-size: 18px; border-bottom: 2px solid transparent;">⚽</button>
                            <button class="emoji-tab" data-category="objects" style="flex: 1; padding: 8px 12px; border: none; background: transparent; cursor: pointer; font-size: 18px; border-bottom: 2px solid transparent;">💎</button>
                            <button class="emoji-tab" data-category="symbols" style="flex: 1; padding: 8px 12px; border: none; background: transparent; cursor: pointer; font-size: 18px; border-bottom: 2px solid transparent;">❤️</button>
                            <button class="emoji-tab" data-category="stickers" style="flex: 1; padding: 8px 12px; border: none; background: transparent; cursor: pointer; font-size: 18px; border-bottom: 2px solid transparent; position: relative;">
                                🎭
                                <div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: #ffc107; border-radius: 50%; font-size: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">!</div>
                            </button>
                        </div>
                        
                        <!-- 表情内容区域 -->
                        <div class="emoji-content" style="padding: 15px; max-height: 360px; overflow-y: auto;">
                            
                            <!-- 笑脸表情 -->
                            <div class="emoji-category" data-category="smile" style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
                                <!-- 笑脸表情将通过JavaScript动态添加 -->
                            </div>
                            
                            <!-- 人物表情 -->
                            <div class="emoji-category" data-category="people" style="display: none; flex-wrap: wrap; gap: 8px; justify-content: center;">
                                <!-- 人物表情将通过JavaScript动态添加 -->
                            </div>
                            
                            <!-- 自然动物 -->
                            <div class="emoji-category" data-category="nature" style="display: none; flex-wrap: wrap; gap: 8px; justify-content: center;">
                                <!-- 自然动物表情将通过JavaScript动态添加 -->
                            </div>
                            
                            <!-- 食物饮料 -->
                            <div class="emoji-category" data-category="food" style="display: none; flex-wrap: wrap; gap: 8px; justify-content: center;">
                                <!-- 食物饮料表情将通过JavaScript动态添加 -->
                            </div>
                            
                            <!-- 运动活动 -->
                            <div class="emoji-category" data-category="activity" style="display: none; flex-wrap: wrap; gap: 8px; justify-content: center;">
                                <!-- 运动活动表情将通过JavaScript动态添加 -->
                            </div>
                            
                            <!-- 物品符号 -->
                            <div class="emoji-category" data-category="objects" style="display: none; flex-wrap: wrap; gap: 8px; justify-content: center;">
                                <!-- 物品符号表情将通过JavaScript动态添加 -->
                            </div>
                            
                            <!-- 符号爱心 -->
                            <div class="emoji-category" data-category="symbols" style="display: none; flex-wrap: wrap; gap: 8px; justify-content: center;">
                                <!-- 符号爱心表情将通过JavaScript动态添加 -->
                            </div>
                            
                            <!-- QQ表情包 -->
                            <div class="emoji-category" data-category="stickers" style="display: none; flex-direction: column; gap: 12px; align-items: center;">
                                <!-- 提示信息 -->
                                <div id="sticker-notice" style="
                                    width: 100%;
                                    background: linear-gradient(135deg, #e7f5ff 0%, #b3e0ff 100%);
                                    border: 1px solid #0066cc;
                                    border-radius: 8px;
                                    padding: 8px 12px;
                                    margin-bottom: 8px;
                                    font-size: 12px;
                                    color: #0d4f8c;
                                    text-align: center;
                                    line-height: 1.3;
                                ">
                                    <div style="font-weight: bold; margin-bottom: 4px;">🎨 表情包画廊</div>
                                    <div>下面显示的是自定义表情包，点击可以添加到聊天中</div>
                                    <div style="margin-top: 4px; font-size: 11px;">共 17 个表情包 · 80x80 高清缩略图</div>
                                </div>
                                
                                <!-- 表情包按钮容器 -->
                                <div class="sticker-buttons-container" style="
                                    display: flex; 
                                    flex-wrap: wrap; 
                                    gap: 4px; 
                                    justify-content: flex-start; 
                                    width: 100%;
                                    max-height: 320px;
                                    overflow-y: auto;
                                    padding: 8px;
                                ">
                                    <!-- QQ表情包将通过JavaScript动态添加 -->
                                </div>
                            </div>
                            
                        </div>
                    </div>
                `;
                
                console.log('✅ 表情面板HTML已构建');
                
                // 第四步：添加到页面
                console.log('4️⃣ 添加到页面...');
                
                // 创建面板元素
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = panelHTML;
                const panel = tempDiv.firstElementChild;
                document.body.appendChild(panel);
                console.log('✅ 表情面板已添加到页面');
                
                // 第五步：验证面板是否存在并唯一
                console.log('5️⃣ 验证面板是否存在并唯一...');
                setTimeout(() => {
                    const allPanels = document.querySelectorAll('.qq-emoji-panel');
                    console.log('验证结果:', {
                        panelCount: allPanels.length,
                        shouldBeOne: allPanels.length === 1
                    });
                    
                    if (allPanels.length === 1) {
                        console.log('🎉 表情面板创建成功且唯一！');
                        
                        // 6️⃣ 填充表情内容
                        console.log('6️⃣ 开始填充表情内容...');
                        this.fillEmojiCategories();
                        
                        // 7️⃣ 绑定事件
                        console.log('7️⃣ 绑定事件...');
                        this.bindPanelEvents();
                        
                        console.log('✅ 表情面板初始化完成');
                        
                    } else {
                        console.error('💥 检测到多个表情面板，强制清理并重试...');
                        this.forceRemoveAllPanels();
                        this.isShowingPanel = false;
                    }
                }, 100);
                
            } catch (error) {
                console.error('💥 显示表情面板时发生错误:', error);
                console.error('错误堆栈:', error.stack);
                this.isShowingPanel = false;
                alert(`表情面板显示失败: ${error.message}`);
            }
            
            console.log('🎭 ======= 表情面板显示流程结束 =======');
        },
        
        // 强制移除所有面板
        forceRemoveAllPanels: function() {
            console.log('🧹 开始强制清理所有表情面板...');
            
            // 方法1：按类名移除
            const panelsByClass = document.querySelectorAll('.qq-emoji-panel');
            console.log(`找到 ${panelsByClass.length} 个按类名的面板`);
            panelsByClass.forEach((panel, index) => {
                console.log(`移除面板 ${index + 1}`);
                if (panel.parentNode) {
                    panel.parentNode.removeChild(panel);
                }
            });
            
            // 方法2：按ID模式移除
            const allDivs = document.querySelectorAll('div[id*="qq-emoji-panel"]');
            console.log(`找到 ${allDivs.length} 个按ID模式的面板`);
            allDivs.forEach((div, index) => {
                console.log(`移除ID面板 ${index + 1}: ${div.id}`);
                if (div.parentNode) {
                    div.parentNode.removeChild(div);
                }
            });
            
            // 方法3：jQuery方式（如果可用）
            if (typeof $ !== 'undefined') {
                try {
                    const jqPanels = $('.qq-emoji-panel');
                    console.log(`jQuery找到 ${jqPanels.length} 个面板`);
                    jqPanels.remove();
                } catch (e) {
                    console.log('jQuery清理失败，但原生清理已完成');
                }
            }
            
            // 重置显示标记
            this.isShowingPanel = false;
            
            console.log('✅ 强制清理完成');
        },
        
        // 绑定面板事件
        bindPanelEvents: function() {
            console.log('🔗 开始绑定面板事件...');
            
            // 关闭按钮事件
            const closeBtn = document.querySelector('.qq-emoji-panel .close-emoji-panel');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('点击关闭按钮');
                    this.closePanelSafely();
                });
                console.log('✅ 关闭按钮事件绑定成功');
            }
            
            // 标签页切换事件
            const tabs = document.querySelectorAll('.qq-emoji-panel .emoji-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const category = tab.getAttribute('data-category');
                    console.log('切换到分类:', category);
                    this.switchCategory(category);
                });
            });
            console.log(`✅ ${tabs.length} 个标签页事件绑定成功`);
            
            // 表情按钮事件（使用事件委托）
            const panel = document.querySelector('.qq-emoji-panel');
            if (panel) {
                panel.addEventListener('click', (e) => {
                    if (e.target.classList.contains('emoji-btn-test')) {
                        e.preventDefault();
                        e.stopPropagation();
                        const emoji = e.target.getAttribute('data-emoji');
                        console.log('点击表情:', emoji);
                        this.handleEmojiClick(e.target, emoji);
                    }
                });
                console.log('✅ 表情按钮事件委托绑定成功');
            }
            
            // 外部点击关闭事件
            setTimeout(() => {
                const handleOutsideClick = (e) => {
                    if (!e.target.closest('.qq-emoji-panel') && !e.target.closest('.function-menu-btn')) {
                        console.log('点击面板外区域，关闭表情面板');
                        this.closePanelSafely();
                        document.removeEventListener('click', handleOutsideClick);
                    }
                };
                document.addEventListener('click', handleOutsideClick);
                console.log('✅ 外部点击关闭事件绑定成功');
            }, 200);
        },
        
        // 安全关闭面板
        closePanelSafely: function() {
            console.log('🔒 安全关闭表情面板...');
            
            this.forceRemoveAllPanels();
            
            // 移除外部点击事件监听器
            const newHandler = () => {};
            document.removeEventListener('click', newHandler);
            
            console.log('✅ 表情面板已安全关闭');
        },
        
        // 切换分类
        switchCategory: function(category) {
            // 更新标签状态
            const tabs = document.querySelectorAll('.qq-emoji-panel .emoji-tab');
            tabs.forEach(tab => {
                const tabCategory = tab.getAttribute('data-category');
                if (tabCategory === category) {
                    tab.style.borderBottomColor = '#007bff';
                    tab.classList.add('active');
                } else {
                    tab.style.borderBottomColor = 'transparent';
                    tab.classList.remove('active');
                }
            });
            
            // 切换内容显示
            const categories = document.querySelectorAll('.qq-emoji-panel .emoji-category');
            categories.forEach(cat => {
                const catCategory = cat.getAttribute('data-category');
                if (catCategory === category) {
                    cat.style.display = 'flex';
                } else {
                    cat.style.display = 'none';
                }
            });
        },
        
        // 处理表情点击
        handleEmojiClick: function(button, emoji) {
            // 添加点击效果
            button.style.background = '#e3f2fd';
            button.style.borderColor = '#2196f3';
            setTimeout(() => {
                button.style.background = '#f9f9f9';
                button.style.borderColor = '#ddd';
            }, 200);
            
            // 检查是否是表情包
            const isSticker = button.getAttribute('data-sticker') === 'true';
            
            if (isSticker) {
                // 表情包处理：生成完整的格式
                this.insertStickerToInput(emoji);
            } else {
                // 普通表情处理
                this.insertEmojiToInput(emoji);
            }
        },
        
        // 将表情插入到当前激活的输入框
        insertEmojiToInput: function(emoji) {
            // 查找当前显示的聊天页面中的输入框
            const activeInput = document.querySelector('.chat-page.show .message-input');
            
            if (activeInput && (activeInput instanceof HTMLInputElement || activeInput instanceof HTMLTextAreaElement)) {
                const currentValue = activeInput.value || '';
                const newValue = currentValue + emoji;
                activeInput.value = newValue;
                
                // 聚焦到输入框
                activeInput.focus();
                
                console.log('表情已插入到输入框:', emoji);
                
                // 显示成功提示
                this.showEmojiInsertToast(emoji);
                
                // 自动关闭表情面板
                setTimeout(() => {
                    document.querySelectorAll('.qq-emoji-panel').forEach(panel => {
                        if (panel instanceof HTMLElement) {
                            panel.style.display = 'none';
                            setTimeout(() => panel.remove(), 100);
                        }
                    });
                }, 500);
                
            } else {
                console.warn('未找到活动的输入框');
                alert(`选择了表情: ${emoji}\n\n请先打开一个聊天窗口再使用表情`);
            }
        },
        
        // 将表情包插入到当前激活的输入框
        insertStickerToInput: function(stickerText) {
            // 查找当前显示的聊天页面中的输入框
            const activeInput = document.querySelector('.chat-page.show .message-input');
            
            if (activeInput && (activeInput instanceof HTMLInputElement || activeInput instanceof HTMLTextAreaElement)) {
                // 获取表情包数据
                const allStickers = this.getStickerData();
                
                // 查找对应的文件名
                const stickerData = allStickers.find(s => s.text === stickerText);
                let fileName = '';
                if (stickerData) {
                    fileName = stickerData.file;
                } else {
                    console.warn('未找到对应的表情包文件:', stickerText);
                    fileName = 'unknown.jpg';
                }
                
                // 生成完整的表情包格式
                const basePath = '/scripts/extensions/third-party/mobile-ui-test/images';
                const fullPath = `${basePath}/${fileName}`;
                const stickerFormat = `[表情包|${fileName}|${fullPath}]`;
                
                const currentValue = activeInput.value || '';
                const newValue = currentValue + stickerFormat;
                activeInput.value = newValue;
                
                // 聚焦到输入框
                activeInput.focus();
                
                console.log('表情包已插入到输入框:', stickerFormat);
                
                // 显示成功提示
                this.showStickerInsertToast(stickerText);
                
                // 自动关闭表情面板
                setTimeout(() => {
                    document.querySelectorAll('.qq-emoji-panel').forEach(panel => {
                        if (panel instanceof HTMLElement) {
                            panel.style.display = 'none';
                            setTimeout(() => panel.remove(), 100);
                        }
                    });
                }, 500);
                
            } else {
                console.warn('未找到活动的输入框');
                alert(`选择了表情包: ${stickerText}\n\n请先打开一个聊天窗口再使用表情包`);
            }
        },
        
        // 显示表情插入成功提示
        showEmojiInsertToast: function(emoji) {
            const toast = document.createElement('div');
            toast.className = 'emoji-insert-toast';
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 8px 15px;
                border-radius: 20px;
                z-index: 100001;
                font-size: 14px;
                pointer-events: none;
            `;
            toast.innerHTML = `<span style="font-size: 18px; margin-right: 5px;">${emoji}</span>表情已添加`;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 1500);
        },
        
        // 显示表情包插入成功提示
        showStickerInsertToast: function(stickerText) {
            const toast = document.createElement('div');
            toast.className = 'sticker-insert-toast';
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 8px 15px;
                border-radius: 20px;
                z-index: 100001;
                font-size: 14px;
                pointer-events: none;
            `;
            toast.innerHTML = `<span style="font-size: 18px; margin-right: 5px;">🎭</span>表情包 ${stickerText} 已添加`;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 1500);
        },
        
        // 简单测试表情面板
        testEmojiSimple: function() {
            console.log('🧪 开始简单测试表情面板');
            this.showEmojiPanel();
        },
        
        // 生成表情按钮HTML
        generateEmojiButtons: function(emojis) {
            return emojis.map(emoji => {
                return `<button class="emoji-btn-test" data-emoji="${emoji}" style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9; cursor: pointer; font-size: 20px; border-radius: 6px; transition: all 0.2s ease;">${emoji}</button>`;
            }).join('');
        },
        
        // 获取表情包数据
        getStickerData: function() {
            return [
                {text: '[表情1]', file: '6eyt6n.jpg', name: '表情1'},
                {text: '[表情2]', file: 'ivtswg.jpg', name: '表情2'},
                {text: '[表情3]', file: 'kv2ubl.gif', name: '表情3'},
                {text: '[表情4]', file: 'z2sxmv.jpg', name: '表情4'},
                {text: '[表情5]', file: 'aotnxp.jpg', name: '表情5'},
                {text: '[表情6]', file: 'emzckz.jpg', name: '表情6'},
                {text: '[表情7]', file: 'kin0oj.jpg', name: '表情7'},
                {text: '[表情8]', file: 'y7px4h.jpg', name: '表情8'},
                {text: '[表情9]', file: 'zjlr8e.jpg', name: '表情9'},
                {text: '[表情10]', file: 'xigzwa.jpg', name: '表情10'},
                {text: '[表情11]', file: '8kvr4u.jpg', name: '表情11'},
                {text: '[表情12]', file: 'lgply8.jpg', name: '表情12'},
                {text: '[表情13]', file: 'au4ay5.jpg', name: '表情13'},
                {text: '[表情14]', file: 'qasebg.jpg', name: '表情14'},
                {text: '[表情15]', file: 'l9nqv0.jpg', name: '表情15'},
                {text: '[表情16]', file: 'hoghwb.jpg', name: '表情16'},
                {text: '[表情17]', file: 's10h5m.jpg', name: '表情17'}
            ];
        },

        // 填充表情分类内容
        fillEmojiCategories: function() {
            // 使用统一的emoji图片映射，确保所有设备显示一致
            const emojiCategories = {
                smile: [
                    // 使用对象格式：{unicode: '😀', name: 'grinning', file: 'grinning.png'}
                    {unicode: '😀', name: 'grinning', file: 'grinning.png'},
                    {unicode: '😃', name: 'grinning-face-with-big-eyes', file: 'grinning-face-with-big-eyes.png'},
                    {unicode: '😄', name: 'grinning-face-with-smiling-eyes', file: 'grinning-face-with-smiling-eyes.png'},
                    {unicode: '😁', name: 'beaming-face-with-smiling-eyes', file: 'beaming-face-with-smiling-eyes.png'},
                    {unicode: '😆', name: 'grinning-squinting-face', file: 'grinning-squinting-face.png'},
                    {unicode: '😅', name: 'grinning-face-with-sweat', file: 'grinning-face-with-sweat.png'},
                    {unicode: '😂', name: 'face-with-tears-of-joy', file: 'face-with-tears-of-joy.png'},
                    {unicode: '🤣', name: 'rolling-on-the-floor-laughing', file: 'rolling-on-the-floor-laughing.png'},
                    {unicode: '😊', name: 'smiling-face-with-smiling-eyes', file: 'smiling-face-with-smiling-eyes.png'},
                    {unicode: '😇', name: 'smiling-face-with-halo', file: 'smiling-face-with-halo.png'},
                    {unicode: '🙂', name: 'slightly-smiling-face', file: 'slightly-smiling-face.png'},
                    {unicode: '🙃', name: 'upside-down-face', file: 'upside-down-face.png'},
                    {unicode: '😉', name: 'winking-face', file: 'winking-face.png'},
                    {unicode: '😌', name: 'relieved-face', file: 'relieved-face.png'},
                    {unicode: '😍', name: 'smiling-face-with-heart-eyes', file: 'smiling-face-with-heart-eyes.png'},
                    {unicode: '🥰', name: 'smiling-face-with-hearts', file: 'smiling-face-with-hearts.png'},
                    {unicode: '😘', name: 'face-blowing-a-kiss', file: 'face-blowing-a-kiss.png'},
                    {unicode: '😗', name: 'kissing-face', file: 'kissing-face.png'},
                    {unicode: '😙', name: 'kissing-face-with-smiling-eyes', file: 'kissing-face-with-smiling-eyes.png'},
                    {unicode: '😚', name: 'kissing-face-with-closed-eyes', file: 'kissing-face-with-closed-eyes.png'},
                    {unicode: '😋', name: 'face-savoring-food', file: 'face-savoring-food.png'},
                    {unicode: '😛', name: 'face-with-tongue', file: 'face-with-tongue.png'},
                    {unicode: '😝', name: 'squinting-face-with-tongue', file: 'squinting-face-with-tongue.png'},
                    {unicode: '😜', name: 'winking-face-with-tongue', file: 'winking-face-with-tongue.png'},
                    {unicode: '🤪', name: 'zany-face', file: 'zany-face.png'},
                    {unicode: '🤨', name: 'face-with-raised-eyebrow', file: 'face-with-raised-eyebrow.png'},
                    {unicode: '🧐', name: 'face-with-monocle', file: 'face-with-monocle.png'},
                    {unicode: '🤓', name: 'nerd-face', file: 'nerd-face.png'},
                    {unicode: '😎', name: 'smiling-face-with-sunglasses', file: 'smiling-face-with-sunglasses.png'},
                    {unicode: '🤩', name: 'star-struck', file: 'star-struck.png'},
                    {unicode: '🥳', name: 'partying-face', file: 'partying-face.png'},
                    {unicode: '😏', name: 'smirking-face', file: 'smirking-face.png'},
                    {unicode: '😒', name: 'unamused-face', file: 'unamused-face.png'},
                    {unicode: '😞', name: 'disappointed-face', file: 'disappointed-face.png'},
                    {unicode: '😔', name: 'pensive-face', file: 'pensive-face.png'},
                    {unicode: '😟', name: 'worried-face', file: 'worried-face.png'},
                    {unicode: '😕', name: 'confused-face', file: 'confused-face.png'},
                    {unicode: '🙁', name: 'slightly-frowning-face', file: 'slightly-frowning-face.png'},
                    {unicode: '☹️', name: 'frowning-face', file: 'frowning-face.png'},
                    {unicode: '😣', name: 'persevering-face', file: 'persevering-face.png'},
                    {unicode: '😖', name: 'confounded-face', file: 'confounded-face.png'},
                    {unicode: '😫', name: 'tired-face', file: 'tired-face.png'},
                    {unicode: '😩', name: 'weary-face', file: 'weary-face.png'},
                    {unicode: '🥺', name: 'pleading-face', file: 'pleading-face.png'},
                    {unicode: '😢', name: 'crying-face', file: 'crying-face.png'},
                    {unicode: '😭', name: 'loudly-crying-face', file: 'loudly-crying-face.png'},
                    {unicode: '😤', name: 'face-with-steam-from-nose', file: 'face-with-steam-from-nose.png'},
                    {unicode: '😠', name: 'angry-face', file: 'angry-face.png'},
                    {unicode: '😡', name: 'pouting-face', file: 'pouting-face.png'},
                    {unicode: '🤬', name: 'face-with-symbols-on-mouth', file: 'face-with-symbols-on-mouth.png'},
                    {unicode: '🤯', name: 'exploding-head', file: 'exploding-head.png'},
                    {unicode: '😳', name: 'flushed-face', file: 'flushed-face.png'},
                    {unicode: '🥵', name: 'hot-face', file: 'hot-face.png'},
                    {unicode: '🥶', name: 'cold-face', file: 'cold-face.png'},
                    {unicode: '😱', name: 'face-screaming-in-fear', file: 'face-screaming-in-fear.png'},
                    {unicode: '😨', name: 'fearful-face', file: 'fearful-face.png'}
                ],
                people: [
                    {unicode: '👶', name: 'baby', file: 'baby.png'},
                    {unicode: '🧒', name: 'child', file: 'child.png'},
                    {unicode: '👦', name: 'boy', file: 'boy.png'},
                    {unicode: '👧', name: 'girl', file: 'girl.png'},
                    {unicode: '🧑', name: 'person', file: 'person.png'},
                    {unicode: '👱', name: 'person-blond-hair', file: 'person-blond-hair.png'},
                    {unicode: '👨', name: 'man', file: 'man.png'},
                    {unicode: '🧔', name: 'man-beard', file: 'man-beard.png'},
                    {unicode: '👩', name: 'woman', file: 'woman.png'},
                    {unicode: '🧓', name: 'older-person', file: 'older-person.png'},
                    {unicode: '👴', name: 'old-man', file: 'old-man.png'},
                    {unicode: '👵', name: 'old-woman', file: 'old-woman.png'},
                    {unicode: '🙍', name: 'person-frowning', file: 'person-frowning.png'},
                    {unicode: '🙎', name: 'person-pouting', file: 'person-pouting.png'},
                    {unicode: '🙅', name: 'person-gesturing-no', file: 'person-gesturing-no.png'},
                    {unicode: '🙆', name: 'person-gesturing-ok', file: 'person-gesturing-ok.png'},
                    {unicode: '💁', name: 'person-tipping-hand', file: 'person-tipping-hand.png'},
                    {unicode: '🙋', name: 'person-raising-hand', file: 'person-raising-hand.png'},
                    {unicode: '🧏', name: 'deaf-person', file: 'deaf-person.png'},
                    {unicode: '🙇', name: 'person-bowing', file: 'person-bowing.png'},
                    {unicode: '🤦', name: 'person-facepalming', file: 'person-facepalming.png'},
                    {unicode: '🤷', name: 'person-shrugging', file: 'person-shrugging.png'},
                    {unicode: '👮', name: 'police-officer', file: 'police-officer.png'},
                    {unicode: '🕵️', name: 'detective', file: 'detective.png'},
                    {unicode: '💂', name: 'guard', file: 'guard.png'},
                    {unicode: '🥷', name: 'ninja', file: 'ninja.png'},
                    {unicode: '👷', name: 'construction-worker', file: 'construction-worker.png'},
                    {unicode: '🤴', name: 'prince', file: 'prince.png'},
                    {unicode: '👸', name: 'princess', file: 'princess.png'},
                    {unicode: '👳', name: 'person-wearing-turban', file: 'person-wearing-turban.png'},
                    {unicode: '👲', name: 'person-with-skullcap', file: 'person-with-skullcap.png'},
                    {unicode: '🧕', name: 'woman-with-headscarf', file: 'woman-with-headscarf.png'},
                    {unicode: '🤵', name: 'person-in-tuxedo', file: 'person-in-tuxedo.png'},
                    {unicode: '👰', name: 'person-with-veil', file: 'person-with-veil.png'},
                    {unicode: '🤰', name: 'pregnant-woman', file: 'pregnant-woman.png'},
                    {unicode: '🤱', name: 'breast-feeding', file: 'breast-feeding.png'},
                    {unicode: '👼', name: 'baby-angel', file: 'baby-angel.png'},
                    {unicode: '🎅', name: 'santa-claus', file: 'santa-claus.png'},
                    {unicode: '🤶', name: 'mrs-claus', file: 'mrs-claus.png'},
                    {unicode: '🦸', name: 'superhero', file: 'superhero.png'},
                    {unicode: '🦹', name: 'supervillain', file: 'supervillain.png'},
                    {unicode: '🧙', name: 'mage', file: 'mage.png'},
                    {unicode: '🧚', name: 'fairy', file: 'fairy.png'},
                    {unicode: '🧛', name: 'vampire', file: 'vampire.png'},
                    {unicode: '🧜', name: 'merperson', file: 'merperson.png'},
                    {unicode: '🧝', name: 'elf', file: 'elf.png'},
                    {unicode: '🧞', name: 'genie', file: 'genie.png'},
                    {unicode: '🧟', name: 'zombie', file: 'zombie.png'}
                ],
                nature: [
                    {unicode: '🐶', name: 'dog-face', file: 'dog-face.png'},
                    {unicode: '🐱', name: 'cat-face', file: 'cat-face.png'},
                    {unicode: '🐭', name: 'mouse-face', file: 'mouse-face.png'},
                    {unicode: '🐹', name: 'hamster', file: 'hamster.png'},
                    {unicode: '🐰', name: 'rabbit-face', file: 'rabbit-face.png'},
                    {unicode: '🦊', name: 'fox', file: 'fox.png'},
                    {unicode: '🐻', name: 'bear', file: 'bear.png'},
                    {unicode: '🐼', name: 'panda', file: 'panda.png'},
                    {unicode: '🐨', name: 'koala', file: 'koala.png'},
                    {unicode: '🐯', name: 'tiger-face', file: 'tiger-face.png'},
                    {unicode: '🦁', name: 'lion', file: 'lion.png'},
                    {unicode: '🐮', name: 'cow-face', file: 'cow-face.png'},
                    {unicode: '🐷', name: 'pig-face', file: 'pig-face.png'},
                    {unicode: '🐽', name: 'pig-nose', file: 'pig-nose.png'},
                    {unicode: '🐸', name: 'frog', file: 'frog.png'},
                    {unicode: '🐵', name: 'monkey-face', file: 'monkey-face.png'},
                    {unicode: '🙈', name: 'see-no-evil-monkey', file: 'see-no-evil-monkey.png'},
                    {unicode: '🙉', name: 'hear-no-evil-monkey', file: 'hear-no-evil-monkey.png'},
                    {unicode: '🙊', name: 'speak-no-evil-monkey', file: 'speak-no-evil-monkey.png'},
                    {unicode: '🐒', name: 'monkey', file: 'monkey.png'},
                    {unicode: '🐔', name: 'chicken', file: 'chicken.png'},
                    {unicode: '🐧', name: 'penguin', file: 'penguin.png'},
                    {unicode: '🐦', name: 'bird', file: 'bird.png'},
                    {unicode: '🐤', name: 'baby-chick', file: 'baby-chick.png'},
                    {unicode: '🐣', name: 'hatching-chick', file: 'hatching-chick.png'},
                    {unicode: '🐥', name: 'front-facing-baby-chick', file: 'front-facing-baby-chick.png'},
                    {unicode: '🦆', name: 'duck', file: 'duck.png'},
                    {unicode: '🦅', name: 'eagle', file: 'eagle.png'},
                    {unicode: '🦉', name: 'owl', file: 'owl.png'},
                    {unicode: '🦇', name: 'bat', file: 'bat.png'},
                    {unicode: '🐺', name: 'wolf', file: 'wolf.png'},
                    {unicode: '🐗', name: 'boar', file: 'boar.png'},
                    {unicode: '🌲', name: 'evergreen-tree', file: 'evergreen-tree.png'},
                    {unicode: '🌳', name: 'deciduous-tree', file: 'deciduous-tree.png'},
                    {unicode: '🌴', name: 'palm-tree', file: 'palm-tree.png'},
                    {unicode: '🌵', name: 'cactus', file: 'cactus.png'},
                    {unicode: '🌶️', name: 'hot-pepper', file: 'hot-pepper.png'},
                    {unicode: '🍄', name: 'mushroom', file: 'mushroom.png'},
                    {unicode: '🌾', name: 'sheaf-of-rice', file: 'sheaf-of-rice.png'},
                    {unicode: '💐', name: 'bouquet', file: 'bouquet.png'},
                    {unicode: '🌷', name: 'tulip', file: 'tulip.png'},
                    {unicode: '🌹', name: 'rose', file: 'rose.png'},
                    {unicode: '🥀', name: 'wilted-flower', file: 'wilted-flower.png'},
                    {unicode: '🌺', name: 'hibiscus', file: 'hibiscus.png'},
                    {unicode: '🌸', name: 'cherry-blossom', file: 'cherry-blossom.png'},
                    {unicode: '🌼', name: 'daisy', file: 'daisy.png'},
                    {unicode: '🌻', name: 'sunflower', file: 'sunflower.png'},
                    {unicode: '☀️', name: 'sun', file: 'sun.png'}
                ],
                food: [
                    {unicode: '🍎', name: 'red-apple', file: 'red-apple.png'},
                    {unicode: '🍐', name: 'pear', file: 'pear.png'},
                    {unicode: '🍊', name: 'tangerine', file: 'tangerine.png'},
                    {unicode: '🍋', name: 'lemon', file: 'lemon.png'},
                    {unicode: '🍌', name: 'banana', file: 'banana.png'},
                    {unicode: '🍉', name: 'watermelon', file: 'watermelon.png'},
                    {unicode: '🍇', name: 'grapes', file: 'grapes.png'},
                    {unicode: '🍓', name: 'strawberry', file: 'strawberry.png'},
                    {unicode: '🫐', name: 'blueberries', file: 'blueberries.png'},
                    {unicode: '🍈', name: 'melon', file: 'melon.png'},
                    {unicode: '🍒', name: 'cherries', file: 'cherries.png'},
                    {unicode: '🍑', name: 'peach', file: 'peach.png'},
                    {unicode: '🥭', name: 'mango', file: 'mango.png'},
                    {unicode: '🍍', name: 'pineapple', file: 'pineapple.png'},
                    {unicode: '🥥', name: 'coconut', file: 'coconut.png'},
                    {unicode: '🥝', name: 'kiwi-fruit', file: 'kiwi-fruit.png'},
                    {unicode: '🍅', name: 'tomato', file: 'tomato.png'},
                    {unicode: '🍆', name: 'eggplant', file: 'eggplant.png'},
                    {unicode: '🥑', name: 'avocado', file: 'avocado.png'},
                    {unicode: '🥦', name: 'broccoli', file: 'broccoli.png'},
                    {unicode: '🥬', name: 'leafy-greens', file: 'leafy-greens.png'},
                    {unicode: '🥒', name: 'cucumber', file: 'cucumber.png'},
                    {unicode: '🌶️', name: 'hot-pepper', file: 'hot-pepper.png'},
                    {unicode: '🫑', name: 'bell-pepper', file: 'bell-pepper.png'},
                    {unicode: '🌽', name: 'ear-of-corn', file: 'ear-of-corn.png'},
                    {unicode: '🥕', name: 'carrot', file: 'carrot.png'},
                    {unicode: '🫒', name: 'olive', file: 'olive.png'},
                    {unicode: '🧄', name: 'garlic', file: 'garlic.png'},
                    {unicode: '🧅', name: 'onion', file: 'onion.png'},
                    {unicode: '🥔', name: 'potato', file: 'potato.png'},
                    {unicode: '🍠', name: 'roasted-sweet-potato', file: 'roasted-sweet-potato.png'},
                    {unicode: '🥖', name: 'baguette-bread', file: 'baguette-bread.png'},
                    {unicode: '🍞', name: 'bread', file: 'bread.png'},
                    {unicode: '🥯', name: 'bagel', file: 'bagel.png'},
                    {unicode: '🥨', name: 'pretzel', file: 'pretzel.png'},
                    {unicode: '🧀', name: 'cheese-wedge', file: 'cheese-wedge.png'},
                    {unicode: '🥚', name: 'egg', file: 'egg.png'},
                    {unicode: '🍳', name: 'cooking', file: 'cooking.png'},
                    {unicode: '🧈', name: 'butter', file: 'butter.png'},
                    {unicode: '🥞', name: 'pancakes', file: 'pancakes.png'},
                    {unicode: '🧇', name: 'waffle', file: 'waffle.png'},
                    {unicode: '🥓', name: 'bacon', file: 'bacon.png'},
                    {unicode: '🥩', name: 'cut-of-meat', file: 'cut-of-meat.png'},
                    {unicode: '🍗', name: 'poultry-leg', file: 'poultry-leg.png'},
                    {unicode: '🍖', name: 'meat-on-bone', file: 'meat-on-bone.png'},
                    {unicode: '🦴', name: 'bone', file: 'bone.png'},
                    {unicode: '🌭', name: 'hot-dog', file: 'hot-dog.png'},
                    {unicode: '🍔', name: 'hamburger', file: 'hamburger.png'}
                ],
                activity: [
                    {unicode: '⚽', name: 'soccer-ball', file: 'soccer-ball.png'},
                    {unicode: '🏀', name: 'basketball', file: 'basketball.png'},
                    {unicode: '🏈', name: 'american-football', file: 'american-football.png'},
                    {unicode: '⚾', name: 'baseball', file: 'baseball.png'},
                    {unicode: '🥎', name: 'softball', file: 'softball.png'},
                    {unicode: '🎾', name: 'tennis', file: 'tennis.png'},
                    {unicode: '🏐', name: 'volleyball', file: 'volleyball.png'},
                    {unicode: '🏉', name: 'rugby-football', file: 'rugby-football.png'},
                    {unicode: '🥏', name: 'flying-disc', file: 'flying-disc.png'},
                    {unicode: '🎱', name: 'pool-8-ball', file: 'pool-8-ball.png'},
                    {unicode: '🪀', name: 'yo-yo', file: 'yo-yo.png'},
                    {unicode: '🏓', name: 'ping-pong', file: 'ping-pong.png'},
                    {unicode: '🏸', name: 'badminton', file: 'badminton.png'},
                    {unicode: '🏒', name: 'ice-hockey', file: 'ice-hockey.png'},
                    {unicode: '🏑', name: 'field-hockey', file: 'field-hockey.png'},
                    {unicode: '🥍', name: 'lacrosse', file: 'lacrosse.png'},
                    {unicode: '🏏', name: 'cricket-game', file: 'cricket-game.png'},
                    {unicode: '🪃', name: 'boomerang', file: 'boomerang.png'},
                    {unicode: '🥅', name: 'goal-net', file: 'goal-net.png'},
                    {unicode: '⛳', name: 'flag-in-hole', file: 'flag-in-hole.png'},
                    {unicode: '🪁', name: 'kite', file: 'kite.png'},
                    {unicode: '🏹', name: 'bow-and-arrow', file: 'bow-and-arrow.png'},
                    {unicode: '🎣', name: 'fishing-pole', file: 'fishing-pole.png'},
                    {unicode: '🤿', name: 'diving-mask', file: 'diving-mask.png'},
                    {unicode: '🥊', name: 'boxing-glove', file: 'boxing-glove.png'},
                    {unicode: '🥋', name: 'martial-arts-uniform', file: 'martial-arts-uniform.png'},
                    {unicode: '🎽', name: 'running-shirt', file: 'running-shirt.png'},
                    {unicode: '🛹', name: 'skateboard', file: 'skateboard.png'},
                    {unicode: '🛷', name: 'sled', file: 'sled.png'},
                    {unicode: '⛸️', name: 'ice-skate', file: 'ice-skate.png'},
                    {unicode: '🥌', name: 'curling-stone', file: 'curling-stone.png'},
                    {unicode: '🎿', name: 'skis', file: 'skis.png'},
                    {unicode: '⛷️', name: 'skier', file: 'skier.png'},
                    {unicode: '🏂', name: 'snowboarder', file: 'snowboarder.png'},
                    {unicode: '🪂', name: 'parachute', file: 'parachute.png'},
                    {unicode: '🏋️', name: 'person-lifting-weights', file: 'person-lifting-weights.png'},
                    {unicode: '🤼', name: 'people-wrestling', file: 'people-wrestling.png'},
                    {unicode: '🤸', name: 'person-cartwheeling', file: 'person-cartwheeling.png'},
                    {unicode: '⛹️', name: 'person-bouncing-ball', file: 'person-bouncing-ball.png'},
                    {unicode: '🤺', name: 'person-fencing', file: 'person-fencing.png'},
                    {unicode: '🏌️', name: 'person-golfing', file: 'person-golfing.png'},
                    {unicode: '🏇', name: 'horse-racing', file: 'horse-racing.png'},
                    {unicode: '🧘', name: 'person-in-lotus-position', file: 'person-in-lotus-position.png'},
                    {unicode: '🏄', name: 'person-surfing', file: 'person-surfing.png'},
                    {unicode: '🏊', name: 'person-swimming', file: 'person-swimming.png'},
                    {unicode: '🤽', name: 'person-playing-water-polo', file: 'person-playing-water-polo.png'},
                    {unicode: '🚣', name: 'person-rowing-boat', file: 'person-rowing-boat.png'},
                    {unicode: '🧗', name: 'person-climbing', file: 'person-climbing.png'}
                ],
                objects: [
                    {unicode: '⌚', name: 'watch', file: 'watch.png'},
                    {unicode: '📱', name: 'mobile-phone', file: 'mobile-phone.png'},
                    {unicode: '📲', name: 'mobile-phone-with-arrow', file: 'mobile-phone-with-arrow.png'},
                    {unicode: '💻', name: 'laptop', file: 'laptop.png'},
                    {unicode: '⌨️', name: 'keyboard', file: 'keyboard.png'},
                    {unicode: '🖥️', name: 'desktop-computer', file: 'desktop-computer.png'},
                    {unicode: '🖨️', name: 'printer', file: 'printer.png'},
                    {unicode: '🖱️', name: 'computer-mouse', file: 'computer-mouse.png'},
                    {unicode: '🖲️', name: 'trackball', file: 'trackball.png'},
                    {unicode: '🕹️', name: 'joystick', file: 'joystick.png'},
                    {unicode: '🗜️', name: 'clamp', file: 'clamp.png'},
                    {unicode: '💽', name: 'computer-disk', file: 'computer-disk.png'},
                    {unicode: '💾', name: 'floppy-disk', file: 'floppy-disk.png'},
                    {unicode: '💿', name: 'optical-disk', file: 'optical-disk.png'},
                    {unicode: '📀', name: 'dvd', file: 'dvd.png'},
                    {unicode: '📼', name: 'videocassette', file: 'videocassette.png'},
                    {unicode: '📷', name: 'camera', file: 'camera.png'},
                    {unicode: '📸', name: 'camera-with-flash', file: 'camera-with-flash.png'},
                    {unicode: '📹', name: 'video-camera', file: 'video-camera.png'},
                    {unicode: '🎥', name: 'movie-camera', file: 'movie-camera.png'},
                    {unicode: '📽️', name: 'film-projector', file: 'film-projector.png'},
                    {unicode: '🎞️', name: 'film-strip', file: 'film-strip.png'},
                    {unicode: '📞', name: 'telephone-receiver', file: 'telephone-receiver.png'},
                    {unicode: '☎️', name: 'telephone', file: 'telephone.png'},
                    {unicode: '📟', name: 'pager', file: 'pager.png'},
                    {unicode: '📠', name: 'fax-machine', file: 'fax-machine.png'},
                    {unicode: '📺', name: 'television', file: 'television.png'},
                    {unicode: '📻', name: 'radio', file: 'radio.png'},
                    {unicode: '🎙️', name: 'studio-microphone', file: 'studio-microphone.png'},
                    {unicode: '🎚️', name: 'level-slider', file: 'level-slider.png'},
                    {unicode: '🎛️', name: 'control-knobs', file: 'control-knobs.png'},
                    {unicode: '🧭', name: 'compass', file: 'compass.png'},
                    {unicode: '⏰', name: 'alarm-clock', file: 'alarm-clock.png'},
                    {unicode: '⏲️', name: 'timer-clock', file: 'timer-clock.png'},
                    {unicode: '⏱️', name: 'stopwatch', file: 'stopwatch.png'},
                    {unicode: '🕰️', name: 'mantelpiece-clock', file: 'mantelpiece-clock.png'},
                    {unicode: '⌛', name: 'hourglass-done', file: 'hourglass-done.png'},
                    {unicode: '⏳', name: 'hourglass-not-done', file: 'hourglass-not-done.png'},
                    {unicode: '📡', name: 'satellite-antenna', file: 'satellite-antenna.png'},
                    {unicode: '🔋', name: 'battery', file: 'battery.png'},
                    {unicode: '🪫', name: 'low-battery', file: 'low-battery.png'},
                    {unicode: '🔌', name: 'electric-plug', file: 'electric-plug.png'},
                    {unicode: '💡', name: 'light-bulb', file: 'light-bulb.png'},
                    {unicode: '🔦', name: 'flashlight', file: 'flashlight.png'},
                    {unicode: '🕯️', name: 'candle', file: 'candle.png'},
                    {unicode: '🪔', name: 'diya-lamp', file: 'diya-lamp.png'},
                    {unicode: '🧯', name: 'fire-extinguisher', file: 'fire-extinguisher.png'}
                ],
                symbols: [
                    {unicode: '❤️', name: 'red-heart', file: 'red-heart.png'},
                    {unicode: '🧡', name: 'orange-heart', file: 'orange-heart.png'},
                    {unicode: '💛', name: 'yellow-heart', file: 'yellow-heart.png'},
                    {unicode: '💚', name: 'green-heart', file: 'green-heart.png'},
                    {unicode: '💙', name: 'blue-heart', file: 'blue-heart.png'},
                    {unicode: '💜', name: 'purple-heart', file: 'purple-heart.png'},
                    {unicode: '🖤', name: 'black-heart', file: 'black-heart.png'},
                    {unicode: '🤍', name: 'white-heart', file: 'white-heart.png'},
                    {unicode: '🤎', name: 'brown-heart', file: 'brown-heart.png'},
                    {unicode: '💔', name: 'broken-heart', file: 'broken-heart.png'},
                    {unicode: '❣️', name: 'heart-exclamation', file: 'heart-exclamation.png'},
                    {unicode: '💕', name: 'two-hearts', file: 'two-hearts.png'},
                    {unicode: '💞', name: 'revolving-hearts', file: 'revolving-hearts.png'},
                    {unicode: '💓', name: 'beating-heart', file: 'beating-heart.png'},
                    {unicode: '💗', name: 'growing-heart', file: 'growing-heart.png'},
                    {unicode: '💖', name: 'sparkling-heart', file: 'sparkling-heart.png'},
                    {unicode: '💘', name: 'heart-with-arrow', file: 'heart-with-arrow.png'},
                    {unicode: '💝', name: 'heart-with-ribbon', file: 'heart-with-ribbon.png'},
                    {unicode: '💟', name: 'heart-decoration', file: 'heart-decoration.png'},
                    {unicode: '☮️', name: 'peace-symbol', file: 'peace-symbol.png'},
                    {unicode: '✝️', name: 'latin-cross', file: 'latin-cross.png'},
                    {unicode: '☪️', name: 'star-and-crescent', file: 'star-and-crescent.png'},
                    {unicode: '🕉️', name: 'om', file: 'om.png'},
                    {unicode: '☸️', name: 'wheel-of-dharma', file: 'wheel-of-dharma.png'},
                    {unicode: '✡️', name: 'star-of-david', file: 'star-of-david.png'},
                    {unicode: '🔯', name: 'dotted-six-pointed-star', file: 'dotted-six-pointed-star.png'},
                    {unicode: '🕎', name: 'menorah', file: 'menorah.png'},
                    {unicode: '☯️', name: 'yin-yang', file: 'yin-yang.png'},
                    {unicode: '☦️', name: 'orthodox-cross', file: 'orthodox-cross.png'},
                    {unicode: '🛐', name: 'place-of-worship', file: 'place-of-worship.png'},
                    {unicode: '⛎', name: 'ophiuchus', file: 'ophiuchus.png'},
                    {unicode: '♈', name: 'aries', file: 'aries.png'},
                    {unicode: '♉', name: 'taurus', file: 'taurus.png'},
                    {unicode: '♊', name: 'gemini', file: 'gemini.png'},
                    {unicode: '♋', name: 'cancer', file: 'cancer.png'},
                    {unicode: '♌', name: 'leo', file: 'leo.png'},
                    {unicode: '♍', name: 'virgo', file: 'virgo.png'},
                    {unicode: '♎', name: 'libra', file: 'libra.png'},
                    {unicode: '♏', name: 'scorpio', file: 'scorpio.png'},
                    {unicode: '♐', name: 'sagittarius', file: 'sagittarius.png'},
                    {unicode: '♑', name: 'capricorn', file: 'capricorn.png'},
                    {unicode: '♒', name: 'aquarius', file: 'aquarius.png'},
                    {unicode: '♓', name: 'pisces', file: 'pisces.png'},
                    {unicode: '🆔', name: 'id-button', file: 'id-button.png'},
                    {unicode: '⚛️', name: 'atom-symbol', file: 'atom-symbol.png'},
                    {unicode: '🉑', name: 'japanese-acceptable-button', file: 'japanese-acceptable-button.png'},
                    {unicode: '☢️', name: 'radioactive', file: 'radioactive.png'},
                    {unicode: '☣️', name: 'biohazard', file: 'biohazard.png'}
                ],
                stickers: this.getStickerData()
            };
            
            // 统一的emoji图片基础路径 - 使用Twemoji CDN确保跨设备一致性
            const emojiImageBaseUrl = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/';
            
            // 填充每个分类的内容
            Object.keys(emojiCategories).forEach(category => {
                if (category === 'stickers') {
                    // 特殊处理表情包，将按钮添加到专用容器中
                    const stickerContainer = document.querySelector('.sticker-buttons-container');
                    if (stickerContainer) {
                        const emojis = emojiCategories[category];
                        const buttonsHTML = this.generateStickerButtons(emojis);
                        stickerContainer.innerHTML = buttonsHTML;
                        console.log(`✅ 已填充 ${category} 分类，共 ${emojis.length} 个QQ表情包`);
                    }
                } else {
                    // 普通emoji处理
                    const categoryElement = document.querySelector(`.emoji-category[data-category="${category}"]`);
                    if (categoryElement) {
                        const emojis = emojiCategories[category];
                        const buttonsHTML = this.generateUnifiedEmojiButtons(emojis, emojiImageBaseUrl);
                        categoryElement.innerHTML = buttonsHTML;
                        console.log(`✅ 已填充 ${category} 分类，共 ${emojis.length} 个统一emoji`);
                    }
                }
            });
            
            console.log('✅ 所有emoji分类内容填充完成（使用统一图片资源）');
        },
        
        // 生成统一emoji按钮HTML
        generateUnifiedEmojiButtons: function(emojis, baseUrl) {
            return emojis.map(emojiData => {
                // 将Unicode转换为Twemoji文件名格式
                const codepoint = this.unicodeToCodepoint(emojiData.unicode);
                const imgSrc = `${baseUrl}${codepoint}.png`;
                
                return `<button class="emoji-btn-test" data-emoji="${emojiData.unicode}" style="
                    padding: 8px; 
                    border: 1px solid #ddd; 
                    background: #f9f9f9; 
                    cursor: pointer; 
                    border-radius: 6px; 
                    transition: all 0.2s ease;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                " title="${emojiData.name}">
                    <img src="${imgSrc}" 
                         alt="${emojiData.unicode}" 
                         style="width: 24px; height: 24px; pointer-events: none;"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='${emojiData.unicode}';"
                    />
                </button>`;
            }).join('');
        },
        
        // 生成表情包按钮HTML
        generateStickerButtons: function(stickers) {
            const stickerBaseUrl = '/scripts/extensions/third-party/mobile-ui-test/images/';
            
            return stickers.map(stickerData => {
                const imgSrc = `${stickerBaseUrl}${stickerData.file}`;
                
                return `<button class="emoji-btn-test sticker-btn" data-emoji="${stickerData.text}" data-sticker="true" style="
                    padding: 6px; 
                    border: 2px solid #ddd; 
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
                    cursor: pointer; 
                    border-radius: 12px; 
                    transition: all 0.2s ease;
                    width: 80px;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    margin: 4px;
                " title="${stickerData.name}" onmouseover="this.style.transform='scale(1.05)'; this.style.borderColor='#007bff'; this.style.boxShadow='0 4px 12px rgba(0,123,255,0.3)';" onmouseout="this.style.transform='scale(1)'; this.style.borderColor='#ddd'; this.style.boxShadow='none';">
                    <img src="${imgSrc}" 
                         alt="${stickerData.text}" 
                         style="width: 64px; height: 64px; pointer-events: none; object-fit: contain; display: block;"
                         onload="this.nextSibling.style.display='none';"
                         onerror="this.style.display='none'; this.nextSibling.style.display='flex';"
                    />
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        display: none;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        font-weight: bold;
                        color: #495057;
                        text-align: center;
                        line-height: 1.2;
                        background: linear-gradient(45deg, #ffeaa7, #fab1a0);
                        border-radius: 8px;
                        pointer-events: none;
                    ">
                        <div style="font-size: 24px; margin-bottom: 4px;">🎭</div>
                        <div style="font-size: 12px; font-weight: normal;">${stickerData.name}</div>
                    </div>
                </button>`;
            }).join('');
        },
        
        // 将Unicode emoji转换为Twemoji文件名的codepoint格式
        unicodeToCodepoint: function(unicode) {
            // 移除变体选择器和零宽连接符
            const cleaned = unicode.replace(/[\uFE00-\uFE0F\u200D]/g, '');
            
            // 转换为codepoint数组
            const codepoints = [];
            for (let i = 0; i < cleaned.length; i++) {
                const char = cleaned.charAt(i);
                const code = char.codePointAt(0);
                
                if (code) {
                    codepoints.push(code.toString(16).toLowerCase());
                    
                    // 处理代理对
                    if (code > 0xFFFF) {
                        i++; // 跳过下一个字符，因为它是代理对的一部分
                    }
                }
            }
            
            return codepoints.join('-');
        }
    };
    
    // 导出到全局
    window['QQEmoji'] = QQEmoji;
    
    // 调试信息
    console.log('✅ QQEmoji对象已成功创建并导出到window.QQEmoji');
    console.log('🔍 可用方法:', Object.keys(QQEmoji));
    
})(window); 