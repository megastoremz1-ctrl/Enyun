'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'data', 'config.json');

const DEFAULTS = {
  tiktokUsername: '',
  minGiftValue: 0,
  enableSound: true,
  enableAnimations: true,
  theme: 'dark',
  overlayDuration: 5
};

function ensureDataDir() {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function load() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const saved = JSON.parse(raw);
    return { ...DEFAULTS, ...saved };
  } catch (err) {
    return { ...DEFAULTS };
  }
}

function save(settings) {
  ensureDataDir();
  const current = load();
  const allowedKeys = Object.keys(DEFAULTS);
  const filtered = {};
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      filtered[key] = settings[key];
    }
  }
  const updated = { ...current, ...filtered };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf8');
  return updated;
}

function get() {
  return load();
}

module.exports = { get, save, DEFAULTS };
