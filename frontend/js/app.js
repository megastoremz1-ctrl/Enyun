/* ===== TikTok Gift Display - Dark Neon Futurista Dashboard ===== */

(function () {
    'use strict';

    var API_BASE = (window.APP_CONFIG && window.APP_CONFIG.BACKEND_URL) || '';

    var GIFT_EMOJIS = {
        'Rose': '\u{1F339}',
        'TikTok': '\u{1F3B5}',
        'Finger Heart': '\u{1F90C}',
        'Lion': '\u{1F981}',
        'Galaxy': '\u{1F30C}',
        'Universe': '\u{1F31F}',
        'Sun Cream': '\u{2600}\u{FE0F}',
        'Diamond': '\u{1F48E}',
        'Garland': '\u{1F490}',
        'Gold Mine': '\u{1F4B0}'
    };

    var DEFAULT_EMOJI = '\u{1F381}';

    var LEVELS = [
        { name: 'Lendario', minCoins: 50000, color: '#9400d3', cssClass: 'level-lendario', emoji: '\u{1F451}' },
        { name: 'Diamante', minCoins: 20000, color: '#00bfff', cssClass: 'level-diamante', emoji: '\u{1F48E}' },
        { name: 'Ouro', minCoins: 5000, color: '#ffd700', cssClass: 'level-ouro', emoji: '\u{1F3C5}' },
        { name: 'Prata', minCoins: 1000, color: '#c0c0c0', cssClass: 'level-prata', emoji: '\u{1F3C5}' },
        { name: 'Bronze', minCoins: 100, color: '#cd7f32', cssClass: 'level-bronze', emoji: '\u{1F3C5}' }
    ];
    var DEFAULT_LEVEL = { name: 'Novato', minCoins: 0, color: '#ffffff', cssClass: '', emoji: '' };

    var TITLES = [
        { emoji: '\u{1F451}', title: 'Rei da Live' },
        { emoji: '\u{1F48E}', title: 'Maior Apoiador' },
        { emoji: '\u{1F525}', title: 'Lenda da Live' },
        { emoji: '\u{26A1}', title: 'MVP' },
        { emoji: '\u{2B50}', title: 'Super Fa' }
    ];
    var DEFAULT_TITLE = { emoji: '\u{1F680}', title: 'Top Gifter' };

    var GIFT_TYPE_CLASSES = {
        'Rose': 'gift-type-rose',
        'Diamond': 'gift-type-diamond',
        'Lion': 'gift-type-lion',
        'Galaxy': 'gift-type-galaxy',
        'Universe': 'gift-type-universe'
    };

    var ws = null;
    var reconnectAttempts = 0;
    var reconnectTimeout = null;
    var config = { tiktokUsername: '', minGiftValue: 0, enableSound: true, enableAnimations: true, theme: 'dark', overlayDuration: 5 };

    var els = {};

    function initElements() {
        els.connectionStatus = document.getElementById('connectionStatus');
        els.statusDot = els.connectionStatus.querySelector('.status-dot');
        els.statusText = els.connectionStatus.querySelector('.status-text');
        els.lastGiftEmoji = document.getElementById('lastGiftEmoji');
        els.lastGiftName = document.getElementById('lastGiftName');
        els.lastGiftUser = document.getElementById('lastGiftUser');
        els.lastGiftCount = document.getElementById('lastGiftCount');
        els.lastGiftDisplay = document.getElementById('lastGiftDisplay');
        els.hallOfFameGrid = document.getElementById('hallOfFameGrid');
        els.historyList = document.getElementById('historyList');
        els.rankingList = document.getElementById('rankingList');
        els.statTotalGifts = document.getElementById('statTotalGifts');
        els.statTotalCoins = document.getElementById('statTotalCoins');
        els.statTopGift = document.getElementById('statTopGift');
        els.statTopGifter = document.getElementById('statTopGifter');
        els.settingsModal = document.getElementById('settingsModal');
        els.settingsBtn = document.getElementById('settingsBtn');
        els.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        els.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        els.settingUsername = document.getElementById('settingUsername');
        els.settingMinGift = document.getElementById('settingMinGift');
        els.minGiftValue = document.getElementById('minGiftValue');
        els.settingSound = document.getElementById('settingSound');
        els.settingAnimations = document.getElementById('settingAnimations');
        els.settingOverlayDuration = document.getElementById('settingOverlayDuration');
        els.overlayDurationValue = document.getElementById('overlayDurationValue');
        els.fullscreenBtn = document.getElementById('fullscreenBtn');
        els.exportCsvBtn = document.getElementById('exportCsvBtn');
    }

    function getLevel(totalCoins) { for (var i = 0; i < LEVELS.length; i++) { if (totalCoins >= LEVELS[i].minCoins) return LEVELS[i]; } return DEFAULT_LEVEL; }
    function getTitle(position) { if (position >= 0 && position < TITLES.length) return TITLES[position]; return DEFAULT_TITLE; }
    function getGiftTypeClass(giftName) { return GIFT_TYPE_CLASSES[giftName] || ''; }

    function connectWebSocket() {
        var wsUrl = (window.APP_CONFIG && window.APP_CONFIG.WS_URL) || ('ws://' + window.location.host);
        try { ws = new WebSocket(wsUrl); } catch (e) { scheduleReconnect(); return; }
        ws.onopen = function () { reconnectAttempts = 0; setConnectionStatus(true); loadInitialData(); };
        ws.onmessage = function (event) { try { var msg = JSON.parse(event.data); if (msg.type === 'gift') { handleGiftEvent(msg.data); } } catch (e) {} };
        ws.onclose = function () { setConnectionStatus(false); scheduleReconnect(); };
        ws.onerror = function () { setConnectionStatus(false); };
    }

    function scheduleReconnect() { if (reconnectTimeout) return; var delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); reconnectAttempts++; reconnectTimeout = setTimeout(function () { reconnectTimeout = null; connectWebSocket(); }, delay); }
    function setConnectionStatus(online) { if (online) { els.statusDot.className = 'status-dot online'; els.statusText.textContent = 'Online'; } else { els.statusDot.className = 'status-dot offline'; els.statusText.textContent = 'Offline'; } }

    function loadInitialData() {
        fetch(API_BASE + '/api/history?limit=50').then(function (r) { return r.json(); }).then(function (data) { renderHistory(data); }).catch(function () {});
        fetch(API_BASE + '/api/stats').then(function (r) { return r.json(); }).then(function (data) { renderStats(data); }).catch(function () {});
        fetch(API_BASE + '/api/top-gifters?limit=10').then(function (r) { return r.json(); }).then(function (data) { renderRanking(data); renderHallOfFame(data); }).catch(function () {});
        fetch(API_BASE + '/api/config').then(function (r) { return r.json(); }).then(function (data) { applyConfig(data); }).catch(function () {});
    }

    function handleGiftEvent(gift) {
        var totalValue = gift.diamondCount * (gift.repeatCount || 1);
        if (totalValue < config.minGiftValue) return;
        updateLastGift(gift);
        if (config.enableSound) { playGiftSound(gift.diamondCount); }
        prependHistoryItem(gift);
        fetch(API_BASE + '/api/top-gifters?limit=10').then(function (r) { return r.json(); }).then(function (data) { renderRanking(data); renderHallOfFame(data); }).catch(function () {});
        fetch(API_BASE + '/api/stats').then(function (r) { return r.json(); }).then(function (data) { renderStats(data); }).catch(function () {});
    }

    function updateLastGift(gift) {
        var emoji = GIFT_EMOJIS[gift.giftName] || DEFAULT_EMOJI;
        els.lastGiftEmoji.textContent = emoji;
        els.lastGiftName.textContent = gift.giftName;
        els.lastGiftUser.textContent = '@' + (gift.nickname || gift.uniqueId);
        els.lastGiftCount.textContent = 'x' + gift.repeatCount + ' \u2022 ' + gift.diamondCount + ' coins';
        els.lastGiftName.className = 'gift-name';
        var typeClass = getGiftTypeClass(gift.giftName);
        if (typeClass) { els.lastGiftName.classList.add(typeClass); }
        if (config.enableAnimations) { els.lastGiftDisplay.classList.remove('gift-animate'); void els.lastGiftDisplay.offsetWidth; els.lastGiftDisplay.classList.add('gift-animate'); }
    }

    function renderHallOfFame(gifters) {
        if (!gifters || gifters.length === 0) { els.hallOfFameGrid.innerHTML = '<p class="empty-state">Aguardando gifters...</p>'; return; }
        var top5 = gifters.slice(0, 5); var html = '';
        for (var i = 0; i < top5.length; i++) { var g = top5[i]; var title = getTitle(i); var level = getLevel(g.totalCoins || 0); html += '<div class="fame-item"><div class="fame-position">' + title.emoji + '</div><div class="fame-name">' + escapeHtml(g.nickname || g.uniqueId) + '</div><div class="fame-title">' + title.title + '</div><div class="fame-coins">' + formatNumber(g.totalCoins || 0) + ' coins</div><span class="fame-level-badge ' + level.cssClass + '" style="border: 1px solid ' + level.color + '; color: ' + level.color + ';">' + level.emoji + ' ' + level.name + '</span></div>'; }
        els.hallOfFameGrid.innerHTML = html;
    }

    function renderHistory(gifts) {
        if (!gifts || gifts.length === 0) { els.historyList.innerHTML = '<p class="empty-state">Nenhum gift recebido ainda</p>'; return; }
        var html = '';
        for (var i = 0; i < gifts.length; i++) { var g = gifts[i]; var emoji = GIFT_EMOJIS[g.giftName] || DEFAULT_EMOJI; var typeClass = getGiftTypeClass(g.giftName); html += '<div class="history-item"><span class="item-emoji">' + emoji + '</span><div class="item-details"><div class="item-name ' + typeClass + '">' + escapeHtml(g.giftName) + '</div><div class="item-user">@' + escapeHtml(g.nickname || g.uniqueId) + '</div></div><span class="item-coins">' + g.diamondCount + ' \u{1FA99}</span></div>'; }
        els.historyList.innerHTML = html;
    }

    function prependHistoryItem(gift) {
        var emoji = GIFT_EMOJIS[gift.giftName] || DEFAULT_EMOJI; var typeClass = getGiftTypeClass(gift.giftName);
        var itemHtml = '<div class="history-item"><span class="item-emoji">' + emoji + '</span><div class="item-details"><div class="item-name ' + typeClass + '">' + escapeHtml(gift.giftName) + '</div><div class="item-user">@' + escapeHtml(gift.nickname || gift.uniqueId) + '</div></div><span class="item-coins">' + gift.diamondCount + ' \u{1FA99}</span></div>';
        var emptyState = els.historyList.querySelector('.empty-state'); if (emptyState) { els.historyList.innerHTML = ''; }
        els.historyList.insertAdjacentHTML('afterbegin', itemHtml);
        while (els.historyList.children.length > 50) { els.historyList.removeChild(els.historyList.lastChild); }
    }

    function renderRanking(gifters) {
        if (!gifters || gifters.length === 0) { els.rankingList.innerHTML = '<p class="empty-state">Nenhum gifter ainda</p>'; return; }
        var html = '';
        for (var i = 0; i < gifters.length; i++) { var g = gifters[i]; var level = getLevel(g.totalCoins || 0); var title = getTitle(i); html += '<div class="ranking-item"><span class="ranking-position">' + (i + 1) + '</span><div class="ranking-info"><div class="ranking-name"><span class="ranking-title-emoji">' + title.emoji + '</span> ' + escapeHtml(g.nickname || g.uniqueId) + '</div><div class="ranking-meta"><span class="ranking-level-badge ' + level.cssClass + '" style="border-color: ' + level.color + '; color: ' + level.color + ';">' + level.emoji + ' ' + level.name + '</span><span>' + g.giftCount + ' gifts</span></div></div><span class="ranking-coins">' + formatNumber(g.totalCoins || 0) + ' \u{1FA99}</span></div>'; }
        els.rankingList.innerHTML = html;
    }

    function renderStats(stats) { els.statTotalGifts.textContent = formatNumber(stats.totalGifts || 0); els.statTotalCoins.textContent = formatNumber(stats.totalCoins || 0); els.statTopGift.textContent = (stats.topGift && stats.topGift.giftName) ? stats.topGift.giftName : '-'; els.statTopGifter.textContent = stats.topGifter || '-'; }

    function applyConfig(cfg) {
        if (!cfg) return; config = Object.assign(config, cfg);
        els.settingUsername.value = config.tiktokUsername || ''; els.settingMinGift.value = config.minGiftValue || 0; els.minGiftValue.textContent = config.minGiftValue || 0; els.settingSound.checked = config.enableSound !== false; els.settingAnimations.checked = config.enableAnimations !== false; els.settingOverlayDuration.value = config.overlayDuration || 5; els.overlayDurationValue.textContent = config.overlayDuration || 5;
    }

    function saveConfig() {
        config.tiktokUsername = els.settingUsername.value; config.minGiftValue = parseInt(els.settingMinGift.value, 10) || 0; config.enableSound = els.settingSound.checked; config.enableAnimations = els.settingAnimations.checked; config.overlayDuration = parseInt(els.settingOverlayDuration.value, 10) || 5;
        fetch(API_BASE + '/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) }).then(function (r) { return r.json(); }).then(function () { closeSettings(); }).catch(function () {});
    }

    var audioCtx = null;
    function getAudioContext() { if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } return audioCtx; }
    function playTone(frequency, duration, type) { try { var ctx = getAudioContext(); var osc = ctx.createOscillator(); var gain = ctx.createGain(); osc.type = type || 'sine'; osc.frequency.setValueAtTime(frequency, ctx.currentTime); gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration); osc.connect(gain); gain.connect(ctx.destination); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration); } catch (e) {} }
    function playGiftSound(coinValue) { if (coinValue <= 5) { playTone(660, 0.15, 'sine'); } else if (coinValue <= 100) { playTone(660, 0.1, 'sine'); setTimeout(function () { playTone(880, 0.15, 'sine'); }, 120); } else { playTone(523, 0.12, 'triangle'); setTimeout(function () { playTone(659, 0.12, 'triangle'); }, 100); setTimeout(function () { playTone(784, 0.12, 'triangle'); }, 200); setTimeout(function () { playTone(1047, 0.3, 'triangle'); }, 300); } }

    function toggleFullscreen() { if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(function () {}); } else { document.exitFullscreen().catch(function () {}); } }
    function openSettings() { els.settingsModal.classList.add('active'); }
    function closeSettings() { els.settingsModal.classList.remove('active'); }
    function escapeHtml(str) { if (!str) return ''; return str.replace(/&/g, '&').replace(/</g, '&lt;').replace(/>/g, '>').replace(/"/g, '"'); }
    function formatNumber(num) { if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'; if (num >= 1000) return (num / 1000).toFixed(1) + 'K'; return String(num); }

    function bindEvents() {
        els.settingsBtn.addEventListener('click', openSettings); els.closeSettingsBtn.addEventListener('click', closeSettings); els.saveSettingsBtn.addEventListener('click', saveConfig); els.fullscreenBtn.addEventListener('click', toggleFullscreen);
        els.exportCsvBtn.addEventListener('click', function () { window.open(API_BASE + '/api/export-csv', '_blank'); });
        els.settingsModal.addEventListener('click', function (e) { if (e.target === els.settingsModal) { closeSettings(); } });
        els.settingMinGift.addEventListener('input', function () { els.minGiftValue.textContent = this.value; });
        els.settingOverlayDuration.addEventListener('input', function () { els.overlayDurationValue.textContent = this.value; });
    }

    function registerServiceWorker() { if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').catch(function () {}); } }

    function init() { initElements(); bindEvents(); registerServiceWorker(); connectWebSocket(); }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
