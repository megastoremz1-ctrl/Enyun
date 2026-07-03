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
      console.log('[TikTok] No username provided');
      return Promise.resolve({ isConnected: false });
    }

    console.log('[TikTok] Connecting to @' + username + '...');

    var options = {
      processInitialData: true,
      enableExtendedGiftInfo: true,
      enableWebsocketUpgrade: true,
      requestPollingIntervalMs: 2000
    };

    if (process.env.TIKTOK_SESSION_ID) {
      options.sessionId = process.env.TIKTOK_SESSION_ID;
      console.log('[TikTok] Using session ID for authentication');
    }

    this._connection = new WebcastPushConnection(username, options);

    this._connection.connect().then(function(state) {
      this._connected = true;
      console.log('[TikTok] Connected! Room ID: ' + state.roomId);
    }.bind(this)).catch(function(err) {
      console.log('[TikTok] Connection failed: ' + err.message);
      this._scheduleReconnect();
    }.bind(this));

    this._connection.on('gift', function(data) {
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
    }.bind(this));

    this._connection.on('disconnected', function() {
      console.log('[TikTok] Disconnected');
      this._connected = false;
      this._scheduleReconnect();
    }.bind(this));

    this._connection.on('error', function(err) {
      console.log('[TikTok] Error: ' + (err ? err.message : 'unknown'));
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
    this._reconnectTimeout = setTimeout(function() {
      this._reconnectTimeout = null;
      this.connect(this._username);
    }.bind(this), 30000);
  }
}

module.exports = { TikTokReal };
