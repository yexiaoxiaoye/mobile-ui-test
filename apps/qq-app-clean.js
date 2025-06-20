// QQ App
(function(window) {
    'use strict';
    
    const QQApp = {
        // Avatar data storage
        avatarData: {},
        
        // Avatar regex pattern
        avatarRegex: /\[头像\|(\d+)\|([^\]]+)\]/g,
        
        // Initialize QQ app interface
        init: function() {
            // Check dependencies
            if (!window['HQDataExtractor']) {
                console.warn('HQDataExtractor not found, some features may not be available');
            }
            
            this.createDialog();
            this.bindEvents();
            
            // Inject function menu styles
            this.injectFunctionMenuStyles();
            
            // Initialize image handling
            this.initImageHandling();
            
            // Expose sticker and emoji insertion methods globally for other modules
            window['insertStickerToQQApp'] = (filename, filepath) => {
                this.insertStickerToActiveInput(filename, filepath);
            };
            
            window['insertEmojiToQQApp'] = (emoji) => {
                this.insertEmojiToActiveInput(emoji);
            };
        },
        
        // Load avatar data
        loadAvatarData: function() {
            try {
                // Clear current avatar data
                this.avatarData = {};
                
                // Extract avatar data only from chat history
                this.loadAvatarDataFromChat();
                
            } catch (error) {
                console.error('Failed to load avatar data:', error);
                this.avatarData = {};
            }
        },
        
        // Extract avatar data from chat history
        loadAvatarDataFromChat: function() {
            try {
                // Use SillyTavern context API to get chat data
                const SillyTavernContext = this.getSillyTavernContext();
                if (!SillyTavernContext) {
                    console.warn('Cannot get SillyTavern context, fallback to DOM scanning');
                    return this.loadAvatarDataFromDOM();
                }
                
                const context = SillyTavernContext.getContext();
                if (!context || !context.chat) {
                    console.warn('Cannot get chat history, fallback to DOM scanning');
                    return this.loadAvatarDataFromDOM();
                }
                
                const messages = context.chat || [];
                
                messages.forEach((message, index) => {
                    const messageText = message.mes || '';
                    let match;
                    
                    // Reset regex index
                    this.avatarRegex.lastIndex = 0;
                    
                    while ((match = this.avatarRegex.exec(messageText)) !== null) {
                        const qqNumber = match[1];
                        const avatarUrl = match[2];
                        this.avatarData[qqNumber] = avatarUrl;
                    }
                });
                
            } catch (error) {
                console.error('Failed to extract avatar data from SillyTavern context', error);
                this.loadAvatarDataFromDOM();
            }
        },
        
        // Get SillyTavern context (fallback method)
        getSillyTavernContext: function() {
            return window['SillyTavern'] || window['sillyTavern'];
        },
        
        // DOM scanning method (fallback)
        loadAvatarDataFromDOM: function() {
            try {
                const messageElements = document.querySelectorAll('.mes_text, .mes_block');
                
                messageElements.forEach(element => {
                    const messageText = element.textContent || '';
                    let match;
                    
                    // Reset regex index
                    this.avatarRegex.lastIndex = 0;
                    
                    while ((match = this.avatarRegex.exec(messageText)) !== null) {
                        const qqNumber = match[1];
                        const avatarUrl = match[2];
                        this.avatarData[qqNumber] = avatarUrl;
                    }
                });
                
            } catch (error) {
                console.error('DOM scanning method also failed to extract avatar data', error);
            }
        },
        
        // Get avatar URL - reload from chat history if not in memory
        getAvatarUrl: function(qqNumber) {
            if (!this.avatarData[qqNumber]) {
                this.loadAvatarDataFromChat();
            }
            return this.avatarData[qqNumber] || '';
        },
        
        // Set avatar URL - only update chat history, don't save to localStorage
        setAvatarUrl: function(qqNumber, avatarUrl) {
            this.avatarData[qqNumber] = avatarUrl;
            this.updateAvatarInChat(qqNumber, avatarUrl);
        },
        
        // ... rest of the methods would be cleaned similarly
        // This is just a template showing the approach
        
        // Expose refresh function globally
        refreshMessages: async function() {
            try {
                this.loadAvatarData();
                
                if (window['HQDataExtractor']) {
                    const freshChatData = await window['HQDataExtractor'].getChatData();
                    
                    if (freshChatData && freshChatData.messages && freshChatData.messages.length > 0) {
                        const qqMessages = await window['HQDataExtractor'].extractQQMessages();
                        const qqContacts = await window['HQDataExtractor'].extractQQContacts();
                        const qqGroups = await window['HQDataExtractor'].extractQQGroups();
                        
                        this.cachedMessages = qqMessages;
                        this.cachedContacts = qqContacts;
                        this.cachedGroups = qqGroups;
                        
                        this.clearOldMessagesFromDOM();
                        this.autoRenderMessagesToDOM();
                    } else {
                        console.warn('No valid chat data obtained');
                    }
                } else {
                    console.warn('HQDataExtractor not available, skipping data extraction');
                }
            } catch (error) {
                console.error('QQApp message refresh failed:', error);
            }
        }
    };
    
    // Export to global
    window['QQApp'] = QQApp;
    
    // Export force refresh function globally for auto refresh manager
    window['forceRefreshQQFromSillyTavern'] = async function() {
        return await QQApp.forceRefreshFromSillyTavern();
    };
    
})(window); 