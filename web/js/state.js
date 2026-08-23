import { generateValues } from './utils/arrayUtils.js';

export const STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  STOPPED: 'stopped',
  COMPLETED: 'completed',
  ERROR: 'error',
};

export const STATUS_LABEL = {
  [STATUS.IDLE]: '待機中',
  [STATUS.RUNNING]: '実行中',
  [STATUS.PAUSED]: '一時停止中',
  [STATUS.STOPPED]: '停止済み',
  [STATUS.COMPLETED]: '完了',
  [STATUS.ERROR]: 'エラー',
};

export const ARRAY_SIZE_MIN = 2;
export const ARRAY_SIZE_MAX = 2048;

export const appState = {
  status: STATUS.IDLE,
  algorithmId: null,
  inputTypeId: 'random',
  arraySize: 32,
  delayMs: 0,
  values: [],
  originalValues: [],
  arrayMax: 1,
  /// index -> palette color, set by the algorithm (SortArray::mark)
  marks: new Map(),
  /// slot name -> { index, color }, the algorithm's index cursors (SortArray::watch)
  watches: new Map(),
  /// indices touched by the current operation (SortArray::m_access1/2)
  access: [],
  stats: { compares: 0, accesses: 0 },
  message: '',
};

/// Port of WMain::SetDelay: exponential slider scale up to 10 seconds.
export function delayFromSlider(pos) {
  if (pos <= 0) return 0;
  const base = 4;
  return Math.pow(base, ((pos / 2000) * Math.log(2 * 1000 * 10)) / Math.log(base)) / 10;
}

export function formatDelay(delayMs) {
  if (delayMs > 10) return `${delayMs.toFixed(0)} ms`;
  if (delayMs > 1) return `${delayMs.toFixed(1)} ms`;
  return `${delayMs.toFixed(2)} ms`;
}

export function clampArraySize(size) {
  if (!Number.isFinite(size)) return appState.arraySize;
  return Math.min(ARRAY_SIZE_MAX, Math.max(ARRAY_SIZE_MIN, Math.floor(size)));
}

export function resetStats() {
  appState.stats.compares = 0;
  appState.stats.accesses = 0;
}

export function clearHighlights() {
  appState.marks.clear();
  appState.watches.clear();
  appState.access = [];
}

/// Generate a new array from the current input type and size.
export function regenerateArray() {
  appState.arraySize = clampArraySize(appState.arraySize);
  appState.values = generateValues(appState.inputTypeId, appState.arraySize);
  appState.originalValues = appState.values.slice();
  appState.arrayMax = Math.max(...appState.values);
  clearHighlights();
  resetStats();
  appState.status = STATUS.IDLE;
  appState.message = '';
}

/// Restore the array the last run started from, without generating new data.
export function restoreArray() {
  appState.values = appState.originalValues.slice();
  appState.arrayMax = Math.max(1, ...appState.values);
  clearHighlights();
  resetStats();
  appState.status = STATUS.IDLE;
  appState.message = '';
}
