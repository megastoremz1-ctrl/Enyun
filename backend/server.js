'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const { WebSocketServer } = require('./websocket');
const { TikTokMock } = require('./tiktok-mock');
const storage = require('./storage');
const config = require('./config');

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

const MIME_TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg',
  '.webmanifest': 'application/manifest+json'
};

const wsServer = new WebSocketServer();
const tiktok = new TikTokMock();

tiktok.on('gift', (giftData) => {
  const settings = config.get();
  const totalValue = giftData.diamondCount * giftData.repeatCount;
  if (totalValue < settings.minGiftValue) return;
  const saved = storage.saveGift(giftData);
  wsServer.broadcast({ type: 'gift', data: saved });
  console.log(`[Gift] ${giftData.nickname} sent ${giftData.giftName} x${giftData.repeatCount} (${giftData.diamondCount} coins each)`);
});

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); if (body.length > 1e6) { req.destroy(); reject(new Error('Body too large')); } });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch (err) { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function serveStaticFile(req, res, filePath) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(FRONTEND_DIR))) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.stat(resolved, (err, stats) => {
    if (err || !stats.isFile()) { res.writeHead(404); res.end('Not Found'); return; }
    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(resolved).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === '/api/history' && req.method === 'GET') { const limit = parseInt(parsedUrl.query.limit) || 50; res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(storage.getHistory(limit))); return; }
  if (pathname === '/api/stats' && req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(storage.getStats())); return; }
  if (pathname === '/api/top-gifters' && req.method === 'GET') { const limit = parseInt(parsedUrl.query.limit) || 10; res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(storage.getTopGifters(limit))); return; }
  if (pathname === '/api/export-csv' && req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="gifts.csv"' }); res.end(storage.exportCSV()); return; }
  if (pathname === '/api/config' && req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(config.get())); return; }
  if (pathname === '/api/config' && req.method === 'POST') { try { const body = await parseBody(req); const updated = config.save(body); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(updated)); } catch (err) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: err.message })); } return; }

  if (!fs.existsSync(FRONTEND_DIR)) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ service: 'enyun-backend', message: 'Backend API is running. Frontend is hosted separately.', endpoints: ['/api/history', '/api/stats', '/api/top-gifters', '/api/config', '/api/export-csv'] }));
    return;
  }

  let filePath = path.join(FRONTEND_DIR, pathname === '/' ? 'index.html' : pathname);
  serveStaticFile(req, res, filePath);
});

server.on('upgrade', (req, socket, head) => { wsServer.handleUpgrade(req, socket, head); });

server.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] WebSocket available at ws://localhost:${PORT}`);
  const settings = config.get();
  tiktok.connect(settings.tiktokUsername || 'demo_streamer');
});

process.on('SIGINT', () => { tiktok.disconnect(); server.close(); process.exit(0); });
process.on('SIGTERM', () => { tiktok.disconnect(); server.close(); process.exit(0); });
