const PATTERNS_KEY = 'xstitch-patterns';
const INVENTORY_KEY = 'xstitch-inventory';
const SETTINGS_KEY = 'xstitch-settings';

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function listPatterns() {
  const patterns = safeGet(PATTERNS_KEY, []);
  return patterns.map(({ id, name, width, height, createdAt, modifiedAt }) => ({
    id, name, width, height, createdAt, modifiedAt,
  }));
}

export function loadPattern(id) {
  const patterns = safeGet(PATTERNS_KEY, []);
  return patterns.find(p => p.id === id) || null;
}

export function savePattern(pattern) {
  const patterns = safeGet(PATTERNS_KEY, []);
  const idx = patterns.findIndex(p => p.id === pattern.id);
  const updated = { ...pattern, modifiedAt: Date.now() };
  if (idx >= 0) {
    patterns[idx] = updated;
  } else {
    patterns.push(updated);
  }
  return safeSet(PATTERNS_KEY, patterns);
}

export function deletePattern(id) {
  const patterns = safeGet(PATTERNS_KEY, []);
  const filtered = patterns.filter(p => p.id !== id);
  return safeSet(PATTERNS_KEY, filtered);
}

export function loadInventory() {
  return safeGet(INVENTORY_KEY, []);
}

export function saveInventory(inventory) {
  return safeSet(INVENTORY_KEY, inventory);
}

export function loadSettings() {
  return safeGet(SETTINGS_KEY, {});
}

export function saveSettings(settings) {
  return safeSet(SETTINGS_KEY, settings);
}
