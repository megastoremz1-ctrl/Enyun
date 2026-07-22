/* ============================================
   TikEgg Overlay - WebSocket Integration
   Connects to Streamer.bot or local server
   ============================================ */

class TikEggWebSocket {
    constructor(options = {}) {
        // Configuration
        this.config = {
            // Primary: Connect to local relay server
            serverUrl: options.serverUrl || 'ws://localhost:7777',
            // Alternative: Connect directly to Streamer.bot WebSocket
            streamerBotUrl: options.streamerBotUrl || 'ws://localhost:8080',
            // Which connection to use: 'server' or 'streamerbot'
            mode: options.mode || 'server',
            // Auto-reconnect
            reconnect: options.reconnect !== false,
            reconnectInterval: options.reconnectInterval || 3000,
            maxReconnectAttempts: options.maxReconnectAttempts || 50,
        };

        this.ws = null;
        this.reconnectAttempts = 0;
        this.isConnected = false;
        this.reconnectTimer = null;

        // Start connection
        this.connect();
    }

    // ==========================================
    // Connection Management
    // ==========================================

    connect() {
        const url = this.config.mode === 'streamerbot' 
            ? this.config.streamerBotUrl 
            : this.config.serverUrl;

        console.log(`🔌 Connecting to ${url}...`);

        try {
            this.ws = new WebSocket(url);
            this.setupEventHandlers();
        } catch (error) {
            console.error('❌ WebSocket connection error:', error);
            this.scheduleReconnect();
        }
    }

    setupEventHandlers() {
        this.ws.onopen = () => {
            console.log('✅ WebSocket connected!');
            this.isConnected = true;
            this.reconnectAttempts = 0;

            // If connecting to Streamer.bot, subscribe to events
            if (this.config.mode === 'streamerbot') {
                this.subscribeToStreamerBot();
            }
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
            console.log(`🔌 WebSocket disconnected (code: ${event.code})`);
            this.isConnected = false;
            this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
        };
    }

    // ==========================================
    // Message Handling
    // ==========================================

    handleMessage(rawData) {
        try {
            const data = JSON.parse(rawData);
            console.log('📨 Received:', data);

            // Handle different message formats

            // Format 1: Direct gift data from server relay
            // { "user": "Samad Jr", "gift": "Rose", "value": 1 }
            if (data.user && data.gift) {
                this.processGiftData(data);
                return;
            }

            // Format 2: Streamer.bot event wrapper
            // { "event": { "source": "...", "type": "..." }, "data": { ... } }
            if (data.event && data.data) {
                this.handleStreamerBotEvent(data);
                return;
            }

            // Format 3: Custom action from Streamer.bot
            // { "action": "gift", "payload": { "user": "...", "gift": "...", "value": ... } }
            if (data.action === 'gift' && data.payload) {
                this.processGiftData(data.payload);
                return;
            }

            // Format 4: TikTok gift event (TikTokLive connector format)
            // { "type": "gift", "nickname": "...", "giftName": "...", "diamondCount": ... }
            if (data.type === 'gift' && data.nickname) {
                this.processGiftData({
                    user: data.nickname,
                    gift: data.giftName || data.gift || 'Gift',
                    value: data.diamondCount || data.value || 1
                });
                return;
            }

            // Format 5: Wrapped in "message" field
            if (data.message) {
                const inner = typeof data.message === 'string' 
                    ? JSON.parse(data.message) 
                    : data.message;
                if (inner.user && inner.gift) {
                    this.processGiftData(inner);
                    return;
                }
            }

            console.log('⚠️ Unknown message format:', data);

        } catch (error) {
            console.error('❌ Error parsing message:', error, rawData);
        }
    }

    processGiftData(data) {
        // Normalize data
        const giftData = {
            user: data.user || data.username || data.nickname || 'Anonymous',
            gift: data.gift || data.giftName || data.name || 'Gift',
            value: parseInt(data.value || data.amount || data.diamondCount || 1)
        };

        console.log(`🎁 Gift: ${giftData.gift} from ${giftData.user} (+${giftData.value})`);

        // Send to game
        if (window.TikEggGame) {
            window.TikEggGame.processGift(giftData);
        }
    }

    // ==========================================
    // Streamer.bot Integration
    // ==========================================

    subscribeToStreamerBot() {
        // Subscribe to Streamer.bot events
        const subscribeMessage = {
            request: 'Subscribe',
            id: 'tikegg-overlay',
            events: {
                general: ['Custom'],
                tiktok: ['Gift', 'Like', 'Follow']
            }
        };

        this.send(JSON.stringify(subscribeMessage));
        console.log('📡 Subscribed to Streamer.bot events');
    }

    handleStreamerBotEvent(data) {
        const { event, data: eventData } = data;

        // Handle TikTok gift events from Streamer.bot
        if (event.type === 'Gift' || event.source === 'TikTok') {
            this.processGiftData({
                user: eventData.user || eventData.displayName || 'Unknown',
                gift: eventData.gift || eventData.giftName || 'Gift',
                value: eventData.value || eventData.amount || 1
            });
        }

        // Handle custom events (from Streamer.bot actions)
        if (event.type === 'Custom') {
            if (eventData.user && eventData.gift) {
                this.processGiftData(eventData);
            }
        }
    }

    // ==========================================
    // Reconnection
    // ==========================================

    scheduleReconnect() {
        if (!this.config.reconnect) return;
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            console.log('❌ Max reconnect attempts reached. Please refresh the page.');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.config.reconnectInterval;

        console.log(`🔄 Reconnecting in ${delay/1000}s... (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, delay);
    }

    // ==========================================
    // Utility
    // ==========================================

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        }
    }

    disconnect() {
        this.config.reconnect = false;
        clearTimeout(this.reconnectTimer);
        if (this.ws) {
            this.ws.close();
        }
    }

    getStatus() {
        return {
            connected: this.isConnected,
            attempts: this.reconnectAttempts,
            mode: this.config.mode
        };
    }
}

// ==========================================
// Initialize WebSocket Connection
// ==========================================

// You can configure the connection here:
const wsConnection = new TikEggWebSocket({
    // Use 'server' to connect to local relay (server.js)
    // Use 'streamerbot' to connect directly to Streamer.bot
    mode: 'server',
    
    // Local relay server URL
    serverUrl: 'ws://localhost:7777',
    
    // Streamer.bot WebSocket URL (if using direct connection)
    streamerBotUrl: 'ws://localhost:8080',
    
    // Auto-reconnect settings
    reconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 50
});

// Expose for debugging
window.TikEggWS = wsConnection;
