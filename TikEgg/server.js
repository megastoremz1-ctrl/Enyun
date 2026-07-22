/* ============================================
   TikEgg Overlay - WebSocket Relay Server
   
   This server acts as a bridge between
   Streamer.bot and the OBS Browser Source overlay.
   
   Streamer.bot sends gifts → server.js → overlay
   ============================================ */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// ==========================================
// Configuration
// ==========================================

const CONFIG = {
    // HTTP server port (serves the overlay files)
    httpPort: process.env.HTTP_PORT || 3000,
    // WebSocket port (receives data from Streamer.bot)
    wsPort: process.env.WS_PORT || 7777,
    // Allowed origins (for CORS)
    allowedOrigins: ['*']
};

// ==========================================
// HTTP Server (serves overlay files)
// ==========================================

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname)));

// JSON body parser for REST API
app.use(express.json());

// CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        overlay: 'TikEgg',
        version: '1.0.0',
        connections: overlayClients.size,
        uptime: process.uptime()
    });
});

// REST API endpoint to send gifts (alternative to WebSocket)
app.post('/api/gift', (req, res) => {
    const { user, gift, value } = req.body;

    if (!user || !gift) {
        return res.status(400).json({ error: 'Missing required fields: user, gift' });
    }

    const giftData = { user, gift, value: value || 1 };
    broadcastToOverlay(giftData);

    res.json({ success: true, message: 'Gift sent to overlay', data: giftData });
});

// Test page endpoint
app.get('/test', (req, res) => {
    res.send(getTestPage());
});

// Start HTTP server
const httpServer = http.createServer(app);
httpServer.listen(CONFIG.httpPort, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║         🥚 TikEgg Overlay Server        ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  Overlay:  http://localhost:${CONFIG.httpPort}        ║`);
    console.log(`║  Test:     http://localhost:${CONFIG.httpPort}/test    ║`);
    console.log(`║  WS Port:  ${CONFIG.wsPort}                          ║`);
    console.log('╠══════════════════════════════════════════╣');
    console.log('║  OBS Browser Source URL:                 ║');
    console.log(`║  http://localhost:${CONFIG.httpPort}/index.html       ║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
});

// ==========================================
// WebSocket Server (receives from Streamer.bot)
// ==========================================

const wss = new WebSocket.Server({ port: CONFIG.wsPort });
const overlayClients = new Set();

wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`🔌 New connection from: ${clientIp}`);
    overlayClients.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to TikEgg Server',
        version: '1.0.0'
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log(`📨 Received:`, data);

            // Broadcast to all overlay clients
            broadcastToOverlay(data);

        } catch (error) {
            console.error('❌ Invalid JSON:', message.toString());
        }
    });

    ws.on('close', () => {
        console.log(`🔌 Client disconnected: ${clientIp}`);
        overlayClients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error(`❌ WebSocket error:`, error.message);
        overlayClients.delete(ws);
    });
});

console.log(`📡 WebSocket server listening on port ${CONFIG.wsPort}`);

// ==========================================
// Broadcast to Overlay Clients
// ==========================================

function broadcastToOverlay(data) {
    const message = JSON.stringify(data);
    let sent = 0;

    overlayClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
            sent++;
        }
    });

    if (sent > 0) {
        console.log(`📤 Broadcast to ${sent} client(s):`, data);
    } else {
        console.log('⚠️  No overlay clients connected');
    }
}

// ==========================================
// Test Page (for manual testing)
// ==========================================

function getTestPage() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>TikEgg - Test Panel</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', sans-serif;
            background: #1a1a2e;
            color: #fff;
            padding: 30px;
            min-height: 100vh;
        }
        h1 { text-align: center; margin-bottom: 30px; color: #ffd93d; }
        .panel {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(255,255,255,0.05);
            border-radius: 16px;
            padding: 30px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 6px;
            color: #aaa;
            font-size: 14px;
        }
        input, select {
            width: 100%;
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.05);
            color: #fff;
            font-size: 16px;
            outline: none;
        }
        input:focus, select:focus {
            border-color: #c44dff;
        }
        button {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 8px;
            background: linear-gradient(135deg, #ff6b9d, #c44dff);
            color: #fff;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(196, 77, 255, 0.4);
        }
        button:active { transform: translateY(0); }
        .quick-buttons {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 20px;
        }
        .quick-btn {
            padding: 10px;
            font-size: 14px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            transition: background 0.2s;
        }
        .quick-btn:hover { background: rgba(196, 77, 255, 0.3); }
        .status {
            text-align: center;
            margin-top: 20px;
            padding: 10px;
            border-radius: 8px;
            font-size: 14px;
        }
        .status.connected { background: rgba(107, 207, 127, 0.2); color: #6bcf7f; }
        .status.disconnected { background: rgba(255, 69, 0, 0.2); color: #ff4500; }
        .log {
            margin-top: 20px;
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
            padding: 15px;
            max-height: 200px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
            color: #aaa;
        }
        .log-entry { margin-bottom: 4px; }
    </style>
</head>
<body>
    <h1>🥚 TikEgg Test Panel</h1>
    <div class="panel">
        <div class="form-group">
            <label>Username</label>
            <input type="text" id="user" value="Samad Jr" placeholder="Nome do usuario">
        </div>
        <div class="form-group">
            <label>Gift</label>
            <select id="gift">
                <option value="Rose">🌹 Rose (+1)</option>
                <option value="Heart">❤️ Heart (+1)</option>
                <option value="TikTok">🎵 TikTok (+1)</option>
                <option value="Ice Cream Cone">🍦 Ice Cream Cone (+2)</option>
                <option value="Finger Heart">🫰 Finger Heart (+5)</option>
                <option value="GG">🎮 GG (+5)</option>
                <option value="Doughnut">🍩 Doughnut (+10)</option>
                <option value="Love You">💕 Love You (+15)</option>
                <option value="Sunglasses">😎 Sunglasses (+25)</option>
                <option value="Hand Hearts">🙌 Hand Hearts (+50)</option>
                <option value="Galaxy">🌌 Galaxy (+500)</option>
            </select>
        </div>
        <div class="form-group">
            <label>Value (override)</label>
            <input type="number" id="value" value="" placeholder="Deixe vazio para usar o valor padrao">
        </div>
        <button onclick="sendGift()">🎁 Send Gift</button>
        
        <div class="quick-buttons">
            <button class="quick-btn" onclick="quickSend('Rose', 1)">🌹 +1</button>
            <button class="quick-btn" onclick="quickSend('Finger Heart', 5)">🫰 +5</button>
            <button class="quick-btn" onclick="quickSend('Doughnut', 10)">🍩 +10</button>
            <button class="quick-btn" onclick="quickSend('Love You', 15)">💕 +15</button>
            <button class="quick-btn" onclick="quickSend('Sunglasses', 25)">😎 +25</button>
            <button class="quick-btn" onclick="quickSend('Hand Hearts', 50)">🙌 +50</button>
        </div>

        <div id="status" class="status disconnected">Connecting...</div>
        <div id="log" class="log"></div>
    </div>

    <script>
        let ws;
        const statusEl = document.getElementById('status');
        const logEl = document.getElementById('log');

        function connect() {
            ws = new WebSocket('ws://localhost:${CONFIG.wsPort}');
            ws.onopen = () => {
                statusEl.textContent = '✅ Connected to TikEgg Server';
                statusEl.className = 'status connected';
                addLog('Connected to server');
            };
            ws.onclose = () => {
                statusEl.textContent = '❌ Disconnected - Reconnecting...';
                statusEl.className = 'status disconnected';
                setTimeout(connect, 3000);
            };
            ws.onmessage = (e) => {
                addLog('Received: ' + e.data);
            };
        }

        function sendGift() {
            const user = document.getElementById('user').value || 'Anonymous';
            const gift = document.getElementById('gift').value;
            const valueInput = document.getElementById('value').value;
            const value = valueInput ? parseInt(valueInput) : undefined;

            const data = { user, gift };
            if (value) data.value = value;

            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
                addLog('Sent: ' + JSON.stringify(data));
            } else {
                addLog('ERROR: Not connected!');
            }
        }

        function quickSend(gift, value) {
            const user = document.getElementById('user').value || 'Anonymous';
            const data = { user, gift, value };
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
                addLog('Sent: ' + JSON.stringify(data));
            }
        }

        function addLog(msg) {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.textContent = new Date().toLocaleTimeString() + ' - ' + msg;
            logEl.prepend(entry);
            if (logEl.children.length > 50) logEl.lastChild.remove();
        }

        connect();
    </script>
</body>
</html>`;
}

// ==========================================
// Graceful Shutdown
// ==========================================

process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down TikEgg server...');
    wss.close();
    httpServer.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    wss.close();
    httpServer.close();
    process.exit(0);
});
