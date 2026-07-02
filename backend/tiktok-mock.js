'use strict';

const { EventEmitter } = require('events');

const GIFTS = [
  { giftName: 'Rose', giftId: 5655, diamondCount: 1 },
  { giftName: 'TikTok', giftId: 5656, diamondCount: 1 },
  { giftName: 'Finger Heart', giftId: 5659, diamondCount: 5 },
  { giftName: 'Lion', giftId: 5752, diamondCount: 29 },
  { giftName: 'Galaxy', giftId: 6064, diamondCount: 1000 },
  { giftName: 'Universe', giftId: 6120, diamondCount: 34999 },
  { giftName: 'Sun Cream', giftId: 5827, diamondCount: 10 },
  { giftName: 'Diamond', giftId: 5900, diamondCount: 99 },
  { giftName: 'Garland', giftId: 5980, diamondCount: 69 },
  { giftName: 'Gold Mine', giftId: 6010, diamondCount: 1000 }
];

const USERNAMES = [
  { nickname: 'StarGazer', uniqueId: 'stargazer_22' },
  { nickname: 'MoonWalker', uniqueId: 'moonwalker99' },
  { nickname: 'NightOwl', uniqueId: 'night_owl_x' },
  { nickname: 'FireFly', uniqueId: 'firefly_lit' },
  { nickname: 'CoolBreeze', uniqueId: 'coolbreeze_7' },
  { nickname: 'SunShine', uniqueId: 'sunshine_forever' },
  { nickname: 'BlueSky', uniqueId: 'bluesky_tiktok' },
  { nickname: 'GoldenHeart', uniqueId: 'goldenheart_1' },
  { nickname: 'SilverWing', uniqueId: 'silverwing_fly' },
  { nickname: 'CrystalClear', uniqueId: 'crystal_clear_0' },
  { nickname: 'ThunderBolt', uniqueId: 'thunderbolt_zz' },
  { nickname: 'RainDrop', uniqueId: 'raindrop_melody' },
  { nickname: 'OceanWave', uniqueId: 'oceanwave_surf' },
  { nickname: 'PixelDust', uniqueId: 'pixeldust_art' },
  { nickname: 'VelvetRose', uniqueId: 'velvetrose_22' }
];

class TikTokMock extends EventEmitter {
  constructor() {
    super();
    this._interval = null;
    this._connected = false;
    this._username = '';
  }

  connect(username) {
    this._username = username || 'demo_user';
    this._connected = true;
    console.log(`[TikTokMock] Connected to @${this._username} (simulated)`);
    setTimeout(() => { if (this._connected) { this._emitGift(); } }, 2000);
    this._scheduleNext();
    return Promise.resolve({ isConnected: true, roomId: 'mock-room-' + Date.now() });
  }

  disconnect() {
    this._connected = false;
    if (this._interval) { clearTimeout(this._interval); this._interval = null; }
    console.log('[TikTokMock] Disconnected');
  }

  _scheduleNext() {
    if (!this._connected) return;
    const delay = Math.floor(Math.random() * 12000) + 3000;
    this._interval = setTimeout(() => {
      if (this._connected) { this._emitGift(); this._scheduleNext(); }
    }, delay);
  }

  _emitGift() {
    const gift = GIFTS[Math.floor(Math.random() * GIFTS.length)];
    const user = USERNAMES[Math.floor(Math.random() * USERNAMES.length)];
    const repeatCount = Math.random() < 0.3 ? Math.floor(Math.random() * 5) + 2 : 1;
    const giftData = {
      nickname: user.nickname,
      uniqueId: user.uniqueId,
      giftName: gift.giftName,
      giftId: gift.giftId,
      repeatCount: repeatCount,
      diamondCount: gift.diamondCount
    };
    this.emit('gift', giftData);
  }
}

module.exports = { TikTokMock };
