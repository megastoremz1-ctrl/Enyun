'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = path.join(__dirname, 'data');
const GIFTS_PATH = path.join(DATA_DIR, 'gifts.json');
const STATS_PATH = path.join(DATA_DIR, 'stats.json');

const MAX_GIFT_ENTRIES = 10000;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function writeJSON(filePath, data) {
  ensureDataDir();
  const dir = path.dirname(filePath);
  const tmpPath = path.join(dir, '.tmp_' + path.basename(filePath) + '.' + process.pid + '.' + Date.now());
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);
}

function saveGift(data) {
  ensureDataDir();
  const gifts = readJSON(GIFTS_PATH, []);
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    timestamp: new Date().toISOString(),
    nickname: data.nickname || 'Anonymous',
    uniqueId: data.uniqueId || 'unknown',
    giftName: data.giftName || 'Unknown Gift',
    giftId: data.giftId || 0,
    repeatCount: data.repeatCount || 1,
    diamondCount: data.diamondCount || 0
  };
  gifts.push(entry);

  if (gifts.length > MAX_GIFT_ENTRIES) {
    gifts.splice(0, gifts.length - MAX_GIFT_ENTRIES);
  }

  writeJSON(GIFTS_PATH, gifts);

  const stats = readJSON(STATS_PATH, {
    totalGifts: 0,
    totalCoins: 0,
    topGift: null,
    topGifter: null,
    gifterTotals: {}
  });

  stats.totalGifts += entry.repeatCount;
  stats.totalCoins += entry.diamondCount * entry.repeatCount;

  const giftValue = entry.diamondCount * entry.repeatCount;
  if (!stats.topGift || giftValue > stats.topGift.value) {
    stats.topGift = {
      giftName: entry.giftName,
      nickname: entry.nickname,
      value: giftValue
    };
  }

  const gifterId = entry.uniqueId;
  if (!stats.gifterTotals[gifterId]) {
    stats.gifterTotals[gifterId] = {
      nickname: entry.nickname,
      uniqueId: entry.uniqueId,
      totalCoins: 0,
      giftCount: 0
    };
  }
  stats.gifterTotals[gifterId].totalCoins += entry.diamondCount * entry.repeatCount;
  stats.gifterTotals[gifterId].giftCount += entry.repeatCount;

  let topGifter = null;
  let topCoins = 0;
  for (const id of Object.keys(stats.gifterTotals)) {
    if (stats.gifterTotals[id].totalCoins > topCoins) {
      topCoins = stats.gifterTotals[id].totalCoins;
      topGifter = stats.gifterTotals[id].nickname;
    }
  }
  stats.topGifter = topGifter;

  writeJSON(STATS_PATH, stats);
  return entry;
}

function getHistory(limit) {
  const gifts = readJSON(GIFTS_PATH, []);
  if (limit && limit > 0) {
    return gifts.slice(-limit).reverse();
  }
  return gifts.slice().reverse();
}

function getTopGifters(limit) {
  const stats = readJSON(STATS_PATH, { gifterTotals: {} });
  const gifters = Object.values(stats.gifterTotals || {});
  gifters.sort((a, b) => b.totalCoins - a.totalCoins);
  if (limit && limit > 0) {
    return gifters.slice(0, limit);
  }
  return gifters;
}

function getStats() {
  const stats = readJSON(STATS_PATH, {
    totalGifts: 0,
    totalCoins: 0,
    topGift: null,
    topGifter: null
  });
  return {
    totalGifts: stats.totalGifts || 0,
    totalCoins: stats.totalCoins || 0,
    topGift: stats.topGift || null,
    topGifter: stats.topGifter || null
  };
}

function exportCSV() {
  const gifts = readJSON(GIFTS_PATH, []);
  const header = 'id,timestamp,nickname,uniqueId,giftName,giftId,repeatCount,diamondCount';
  const rows = gifts.map(g => {
    return [
      g.id,
      g.timestamp,
      '"' + (g.nickname || '').replace(/"/g, '""') + '"',
      g.uniqueId,
      '"' + (g.giftName || '').replace(/"/g, '""') + '"',
      g.giftId,
      g.repeatCount,
      g.diamondCount
    ].join(',');
  });
  return [header, ...rows].join(' ');
}

module.exports = { saveGift, getHistory, getTopGifters, getStats, exportCSV };
