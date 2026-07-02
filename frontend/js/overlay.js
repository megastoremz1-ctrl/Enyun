/* ===== TikTok Gift Display - Dark Neon Futurista Overlay ===== */
(function () {
    'use strict';

    var API_BASE = (window.APP_CONFIG && window.APP_CONFIG.BACKEND_URL) || '';

    var GIFT_EMOJIS = { 'Rose': '\u{1F339}', 'TikTok': '\u{1F3B5}', 'Finger Heart': '\u{1F90C}', 'Lion': '\u{1F981}', 'Galaxy': '\u{1F30C}', 'Universe': '\u{1F31F}', 'Sun Cream': '\u{2600}\u{FE0F}', 'Diamond': '\u{1F48E}', 'Garland': '\u{1F490}', 'Gold Mine': '\u{1F4B0}' };
    var DEFAULT_EMOJI = '\u{1F381}';

    var TITLES = [ { emoji: '\u{1F451}', title: 'Rei da Live' }, { emoji: '\u{1F48E}', title: 'Maior Apoiador' }, { emoji: '\u{1F525}', title: 'Lenda da Live' }, { emoji: '\u{26A1}', title: 'MVP da Live' }, { emoji: '\u{2B50}', title: 'Super Fa' } ];
    var DEFAULT_TITLE = { emoji: '\u{1F680}', title: 'Top Gifter' };

    var LEVELS = [ { name: 'Lendario', minCoins: 50000, color: '#9400d3' }, { name: 'Diamante', minCoins: 20000, color: '#00bfff' }, { name: 'Ouro', minCoins: 5000, color: '#ffd700' }, { name: 'Prata', minCoins: 1000, color: '#c0c0c0' }, { name: 'Bronze', minCoins: 100, color: '#cd7f32' } ];
    var DEFAULT_LEVEL = { name: 'Novato', minCoins: 0, color: '#ffffff' };

    var urlParams = new URLSearchParams(window.location.search);
    var overlayDuration = parseInt(urlParams.get('duration'), 10) || 6;
    var showBg = urlParams.get('bg') !== 'false';

    var alertQueue = [], isShowingAlert = false, container = null, topGifters = [], localGifterData = {}, recentGifts = [];
    var ws = null, reconnectAttempts = 0, reconnectTimeout = null, audioCtx = null;

    function getAudioContext() { if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } return audioCtx; }
    function getLevel(totalCoins) { for (var i = 0; i < LEVELS.length; i++) { if (totalCoins >= LEVELS[i].minCoins) return LEVELS[i]; } return DEFAULT_LEVEL; }
    function getTitle(position) { if (position >= 0 && position < TITLES.length) return TITLES[position]; return DEFAULT_TITLE; }
    function getRankPosition(uniqueId) { for (var i = 0; i < topGifters.length; i++) { if (topGifters[i].uniqueId === uniqueId) return i; } return -1; }
    function escapeHtml(str) { if (!str) return ''; return str.replace(/&/g, '&amp;').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"'); }
    function formatCoins(n) { if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'; if (n >= 1000) return (n / 1000).toFixed(1) + 'K'; return String(n); }

    function playSound(giftName) { try { var ctx = getAudioContext(); if (ctx.state === 'suspended') ctx.resume(); switch (giftName) { case 'Rose': playSoftChime(ctx); break; case 'Diamond': playCrystalPing(ctx); break; case 'Lion': playPowerfulChord(ctx); break; case 'Galaxy': playEtherealSweep(ctx); break; case 'Universe': playEpicFanfare(ctx); break; default: playSoftChime(ctx); break; } } catch (e) {} }

    function playSoftChime(ctx) { var now = ctx.currentTime; var osc = ctx.createOscillator(); var gain = ctx.createGain(); osc.type = 'sine'; osc.frequency.setValueAtTime(880, now); osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1); gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8); osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 0.8); }
    function playCrystalPing(ctx) { var now = ctx.currentTime; var osc1 = ctx.createOscillator(); var osc2 = ctx.createOscillator(); var gain = ctx.createGain(); osc1.type = 'sine'; osc1.frequency.setValueAtTime(2400, now); osc1.frequency.exponentialRampToValueAtTime(3200, now + 0.05); osc2.type = 'triangle'; osc2.frequency.setValueAtTime(4800, now); gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6); osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination); osc1.start(now); osc2.start(now); osc1.stop(now + 0.6); osc2.stop(now + 0.6); }
    function playPowerfulChord(ctx) { var now = ctx.currentTime; var freqs = [220, 277, 330, 440]; for (var i = 0; i < freqs.length; i++) { var osc = ctx.createOscillator(); var gain = ctx.createGain(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(freqs[i], now); gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2); osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 1.2); } }
    function playEtherealSweep(ctx) { var now = ctx.currentTime; var osc = ctx.createOscillator(); var gain = ctx.createGain(); osc.type = 'sine'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 1.5); osc.frequency.exponentialRampToValueAtTime(400, now + 2.5); gain.gain.setValueAtTime(0.01, now); gain.gain.linearRampToValueAtTime(0.2, now + 0.3); gain.gain.linearRampToValueAtTime(0.15, now + 1.5); gain.gain.exponentialRampToValueAtTime(0.01, now + 2.5); osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 2.5); }
    function playEpicFanfare(ctx) { var now = ctx.currentTime; var notes = [{ freq: 261, time: 0 }, { freq: 329, time: 0.15 }, { freq: 392, time: 0.3 }, { freq: 523, time: 0.5 }, { freq: 659, time: 0.7 }, { freq: 784, time: 0.9 }]; for (var i = 0; i < notes.length; i++) { var n = notes[i]; var osc = ctx.createOscillator(); var gain = ctx.createGain(); osc.type = 'square'; osc.frequency.setValueAtTime(n.freq, now + n.time); gain.gain.setValueAtTime(0.01, now + n.time); gain.gain.linearRampToValueAtTime(0.12, now + n.time + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, now + n.time + 0.8); osc.connect(gain); gain.connect(ctx.destination); osc.start(now + n.time); osc.stop(now + n.time + 0.8); } }

    function connectWebSocket() { var wsUrl = (window.APP_CONFIG && window.APP_CONFIG.WS_URL) || ('ws://' + window.location.host); try { ws = new WebSocket(wsUrl); } catch (e) { scheduleReconnect(); return; } ws.onopen = function () { reconnectAttempts = 0; }; ws.onmessage = function (event) { try { var msg = JSON.parse(event.data); if (msg.type === 'gift') handleGift(msg.data); } catch (e) {} }; ws.onclose = function () { scheduleReconnect(); }; ws.onerror = function () {}; }
    function scheduleReconnect() { if (reconnectTimeout) return; var delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); reconnectAttempts++; reconnectTimeout = setTimeout(function () { reconnectTimeout = null; connectWebSocket(); }, delay); }

    function handleGift(gift) {
        var uid = gift.uniqueId || gift.nickname;
        if (!localGifterData[uid]) { localGifterData[uid] = { nickname: gift.nickname, uniqueId: uid, totalCoins: 0, giftCount: 0 }; }
        localGifterData[uid].totalCoins += (gift.diamondCount || 0) * (gift.repeatCount || 1);
        localGifterData[uid].giftCount += (gift.repeatCount || 1);
        localGifterData[uid].nickname = gift.nickname || uid;
        addRecentGift(gift);
        alertQueue.push(gift);
        if (!isShowingAlert) showNextAlert();
        debouncedFetch();
    }

    function addRecentGift(gift) { recentGifts.unshift(gift); if (recentGifts.length > 5) recentGifts.pop(); renderRecentFeed(); }

    function showNextAlert() { if (alertQueue.length === 0) { isShowingAlert = false; return; } isShowingAlert = true; var gift = alertQueue.shift(); displayGiftAlert(gift); }

    function displayGiftAlert(gift) {
        var emoji = GIFT_EMOJIS[gift.giftName] || DEFAULT_EMOJI;
        var uid = gift.uniqueId || gift.nickname;
        var gifterData = localGifterData[uid] || { totalCoins: 0 };
        var level = getLevel(gifterData.totalCoins);
        var rankPos = getRankPosition(uid);
        var titleInfo = rankPos >= 0 ? getTitle(rankPos) : DEFAULT_TITLE;
        var giftClass = getGiftClass(gift.giftName);
        playSound(gift.giftName);
        var alert = document.createElement('div');
        alert.className = 'gift-alert ' + giftClass;
        alert.innerHTML = '<div class="alert-title" style="color:' + level.color + '">' + titleInfo.emoji + ' ' + escapeHtml(titleInfo.title) + '</div>' + '<div class="alert-username" style="color:' + level.color + '">' + escapeHtml(gift.nickname || uid) + '</div>' + '<div class="alert-action">Enviou</div>' + '<div class="alert-gift"><span class="alert-gift-emoji">' + emoji + '</span><span style="color:' + level.color + '">' + escapeHtml(gift.giftName) + ' x' + (gift.repeatCount || 1) + '</span></div>' + '<div class="alert-count">' + (gift.diamondCount || 0) + ' coins</div>';
        container.appendChild(alert);
        createGiftParticles(alert, gift.giftName);
        if (gift.giftName === 'Galaxy') createGalaxyEffect(alert);
        if (gift.giftName === 'Universe') createUniverseEffect(alert);
        setTimeout(function () { alert.classList.add('exit'); setTimeout(function () { if (alert.parentNode) alert.parentNode.removeChild(alert); var effects = container.querySelectorAll('.cosmic-ring, .galaxy-ring'); for (var i = 0; i < effects.length; i++) { if (effects[i].parentNode) effects[i].parentNode.removeChild(effects[i]); } showNextAlert(); }, 600); }, overlayDuration * 1000);
    }

    function getGiftClass(giftName) { switch (giftName) { case 'Rose': return 'gift-rose'; case 'Diamond': return 'gift-diamond'; case 'Lion': return 'gift-lion'; case 'Galaxy': return 'gift-galaxy'; case 'Universe': return 'gift-universe'; default: return 'gift-default'; } }

    function createGiftParticles(alertEl, giftName) {
        var count = giftName === 'Universe' ? 30 : giftName === 'Galaxy' ? 20 : 12;
        var colors = getParticleColors(giftName);
        var classBase = 'particle particle--' + giftName.toLowerCase();
        for (var i = 0; i < count; i++) { var p = document.createElement('div'); p.className = classBase; var angle = (i / count) * 360 + (Math.random() * 30 - 15); var distance = 80 + Math.random() * (giftName === 'Universe' ? 200 : 120); var px = Math.cos(angle * Math.PI / 180) * distance; var py = Math.sin(angle * Math.PI / 180) * distance; var size = 4 + Math.random() * 6; p.style.width = size + 'px'; p.style.height = size + 'px'; p.style.setProperty('--px', px + 'px'); p.style.setProperty('--py', py + 'px'); p.style.left = '50%'; p.style.top = '50%'; p.style.animationDelay = (Math.random() * 0.5) + 's'; p.style.animationDuration = (1.5 + Math.random()) + 's'; if (giftName === 'Universe') { p.style.background = colors[i % colors.length]; p.style.color = colors[i % colors.length]; } alertEl.appendChild(p); }
    }

    function getParticleColors(giftName) { switch (giftName) { case 'Rose': return ['#ff69b4', '#ff1493', '#ffb6c1']; case 'Diamond': return ['#00bfff', '#87ceeb', '#4169e1']; case 'Lion': return ['#ffd700', '#ff8c00', '#ff4500']; case 'Galaxy': return ['#9400d3', '#8a2be2', '#4b0082']; case 'Universe': return ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff', '#ff00ff']; default: return ['#7c3aed', '#a78bfa']; } }

    function createGalaxyEffect(alertEl) { for (var i = 0; i < 3; i++) { var ring = document.createElement('div'); ring.className = 'galaxy-ring'; ring.style.left = '50%'; ring.style.top = '50%'; ring.style.marginLeft = '-10px'; ring.style.marginTop = '-10px'; ring.style.animationDelay = (i * 0.4) + 's'; ring.style.borderColor = 'hsla(' + (270 + i * 30) + ', 80%, 50%, 0.4)'; alertEl.appendChild(ring); } }

    function createUniverseEffect(alertEl) { var colors = ['rgba(255,100,100,0.6)', 'rgba(100,100,255,0.6)', 'rgba(100,255,100,0.5)', 'rgba(255,255,100,0.5)']; for (var i = 0; i < 4; i++) { var ring = document.createElement('div'); ring.className = 'cosmic-ring'; ring.style.left = '50%'; ring.style.top = '50%'; ring.style.marginLeft = '0'; ring.style.marginTop = '0'; ring.style.transform = 'translate(-50%, -50%)'; ring.style.animationDelay = (i * 0.3) + 's'; ring.style.borderColor = colors[i]; alertEl.appendChild(ring); } }

    var fetchDebounce = null;
    function debouncedFetch() { clearTimeout(fetchDebounce); fetchDebounce = setTimeout(function () { fetchTopGifters(); fetchStats(); }, 500); }

    function fetchTopGifters() {
        fetch(API_BASE + '/api/top-gifters?limit=10').then(function (r) { return r.json(); }).then(function (data) {
            if (Array.isArray(data)) { topGifters = data; for (var i = 0; i < data.length; i++) { var g = data[i]; var uid = g.uniqueId || g.nickname; if (!localGifterData[uid]) { localGifterData[uid] = { nickname: g.nickname, uniqueId: uid, totalCoins: g.totalCoins || 0, giftCount: g.giftCount || 0 }; } else if ((g.totalCoins || 0) > localGifterData[uid].totalCoins) { localGifterData[uid].totalCoins = g.totalCoins || 0; localGifterData[uid].giftCount = Math.max(localGifterData[uid].giftCount, g.giftCount || 0); } } renderHallOfFame(); }
        }).catch(function () {});
    }

    function fetchStats() { fetch(API_BASE + '/api/stats').then(function (r) { return r.json(); }).then(function (data) { if (data) renderStats(data); }).catch(function () {}); }

    function renderHallOfFame() {
        var list = document.getElementById('hofList'); if (!list) return; var html = ''; var max = Math.min(topGifters.length, 5);
        for (var i = 0; i < max; i++) { var g = topGifters[i]; var level = getLevel(g.totalCoins || 0); var titleInfo = getTitle(i); html += '<div class="hof-entry"><span class="hof-rank">' + titleInfo.emoji + '</span><div class="hof-info"><div class="hof-name" style="color:' + level.color + '">' + escapeHtml(g.nickname) + '</div><div class="hof-coins">' + formatCoins(g.totalCoins || 0) + ' coins | ' + (g.giftCount || 0) + ' gifts</div></div><span class="hof-level-badge" style="background:' + level.color + ';color:#000">' + level.name + '</span></div>'; }
        list.innerHTML = html;
    }

    function renderStats(data) { var totalCoinsEl = document.getElementById('totalCoins'); var totalGiftsEl = document.getElementById('totalGifts'); if (totalCoinsEl) totalCoinsEl.textContent = formatCoins(data.totalCoins || 0); if (totalGiftsEl) totalGiftsEl.textContent = String(data.totalGifts || 0); }

    function renderRecentFeed() { var list = document.getElementById('feedList'); if (!list) return; var html = ''; for (var i = 0; i < recentGifts.length; i++) { var g = recentGifts[i]; var emoji = GIFT_EMOJIS[g.giftName] || DEFAULT_EMOJI; html += '<div class="feed-item"><span class="feed-name">' + escapeHtml(g.nickname) + '</span> <span class="feed-gift">' + emoji + ' ' + escapeHtml(g.giftName) + ' x' + (g.repeatCount || 1) + '</span></div>'; } list.innerHTML = html; }

    function setupAudioEnableButton() {
        var ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            var btn = document.createElement('button'); btn.id = 'audioEnableBtn'; btn.textContent = '\u{1F50A} Click to Enable Audio';
            btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;padding:12px 20px;border:1px solid #00f5ff;border-radius:8px;background:rgba(10,10,15,0.9);color:#00f5ff;font-size:14px;cursor:pointer;font-family:inherit;box-shadow:0 0 10px rgba(0,245,255,0.3);transition:opacity 0.3s ease;';
            btn.addEventListener('click', function () { ctx.resume().then(function () { btn.style.opacity = '0'; setTimeout(function () { if (btn.parentNode) btn.parentNode.removeChild(btn); }, 300); }); });
            document.body.appendChild(btn);
            ctx.addEventListener('statechange', function () { if (ctx.state === 'running' && btn.parentNode) { btn.style.opacity = '0'; setTimeout(function () { if (btn.parentNode) btn.parentNode.removeChild(btn); }, 300); } });
        }
    }

    function init() {
        container = document.getElementById('alertContainer');
        if (!showBg) { document.body.classList.add('transparent-bg'); }
        connectWebSocket(); fetchTopGifters(); fetchStats(); setupAudioEnableButton();
        setInterval(function () { fetchTopGifters(); fetchStats(); }, 10000);
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
