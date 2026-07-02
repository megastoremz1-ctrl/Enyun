'use strict';

const { WebcastPushConnection } = require('tiktok-live-connector');
const { EventEmitter } = require('events');

class TikTokReal extends EventEmitter {
  constructor() {
    super();
    this._connection = null;
    this._connected = false;
    this._username = '';
    this._reconnectTimeout = null;
  }

  connect(username) {
    this._username = username;
    if (!username) {
      console.log('[TikTok] No username provided, waiting...');
      return Promise.resolve({ isConnected: false });
    }

    console.log('[TikTok] Connecting to @' + username + '...');

    this._connection = new WebcastPushConnection(username, {
      processInitialData: true,
      enableExtendedGiftInfo: true,
      enableWebsocketUpgrade: true,
      requestPollingIntervalMs: 2000
    });

    this._connection.connect()
      .then(state => {
        this._connected = true;
        console.log('[TikTok] Connected! Room ID: ' + state.roomId);
      })
      .catch(err => {
        console.log('[TikTok] Connection failed: ' + err.message);
        this._scheduleReconnect();
      });

    this._connection.on('gift', (data) => {
      if (data.giftType === 1 && !data.repeatEnd) {
        return;
      }
      var giftData = {
        nickname: data.nickname || data.uniqueId,
        uniqueId: data.uniqueId,
        giftName: data.giftName || 'Unknown Gift',
        giftId: data.giftId || 0,
        repeatCount: data.repeatCount || 1,
        diamondCount: data.diamondCount || 0
      };
      this.emit('gift', giftData);
    });

    this._connection.on('disconnected', () => {
      console.log('[TikTok] Disconnected');
      this._connected = false;
      this._scheduleReconnect();
    });

    this._connection.on('error', (err) => {
      console.log('[TikTok] Error: ' + err.message);
    });

    return Promise.resolve({ isConnected: true });
  }

  disconnect() {
    this._connected = false;
    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout);
      this._reconnectTimeout = null;
    }
    if (this._connection) {
      this._connection.disconnect();
      this._connection = null;
    }
    console.log('[TikTok] Disconnected manually');
  }

  _scheduleReconnect() {
    if (this._reconnectTimeout) return;
    console.log('[TikTok] Reconnecting in 30 seconds...');
    this._reconnectTimeout = setTimeout(() => {
      this._reconnectTimeout = null;
      this.connect(this._username);
    }, 30000);
  }
}

module.exports = { TikTokReal };
