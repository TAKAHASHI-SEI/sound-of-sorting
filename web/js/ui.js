import {
  appState,
  clampArraySize,
  delayFromSlider,
  formatDelay,
  STATUS,
  STATUS_LABEL,
} from './state.js';
import { ALGORITHMS, findAlgorithm } from './sorting/index.js';
import { PIVOT_TYPES, setQuickSortPivot } from './sorting/quickSort.js';
import { INPUT_TYPES } from './utils/arrayUtils.js';

const el = {
  algorithm: document.getElementById('algorithm'),
  inputType: document.getElementById('inputType'),
  pivot: document.getElementById('pivot'),
  algorithmDescription: document.getElementById('algorithmDescription'),
  arraySize: document.getElementById('arraySize'),
  arraySizeValue: document.getElementById('arraySizeValue'),
  speed: document.getElementById('speed'),
  delayValue: document.getElementById('delayValue'),
  run: document.getElementById('run'),
  step: document.getElementById('step'),
  stop: document.getElementById('stop'),
  reset: document.getElementById('reset'),
  regenerate: document.getElementById('regenerate'),
  statusText: document.getElementById('statusText'),
  compareCount: document.getElementById('compareCount'),
  accessCount: document.getElementById('accessCount'),
};

function fillSelect(select, items) {
  for (const item of items) {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    select.append(option);
  }
}

export function initUI({ onRun, onStep, onStop, onReset, onRegenerate }) {
  fillSelect(el.algorithm, ALGORITHMS);
  fillSelect(el.inputType, INPUT_TYPES);
  fillSelect(el.pivot, PIVOT_TYPES);

  appState.algorithmId = ALGORITHMS[0].id;
  appState.inputTypeId = INPUT_TYPES[0].id;
  el.algorithm.value = appState.algorithmId;
  el.inputType.value = appState.inputTypeId;

  appState.arraySize = clampSize(Number(el.arraySize.value));
  appState.delayMs = delayFromSlider(Number(el.speed.value));

  el.algorithm.addEventListener('change', () => {
    appState.algorithmId = el.algorithm.value;
    // Very slow algorithms have a size limit (AlgoEntry::max_testsize).
    const clamped = clampSize(appState.arraySize);
    if (clamped !== appState.arraySize) {
      appState.arraySize = clamped;
      el.arraySize.value = String(clamped);
      onRegenerate();
    }
    render();
  });

  el.pivot.addEventListener('change', () => {
    setQuickSortPivot(el.pivot.value);
  });

  el.inputType.addEventListener('change', () => {
    appState.inputTypeId = el.inputType.value;
    onRegenerate();
  });

  el.arraySize.addEventListener('input', () => {
    appState.arraySize = clampSize(Number(el.arraySize.value));
    render();
  });

  el.arraySize.addEventListener('change', () => {
    onRegenerate();
  });

  el.speed.addEventListener('input', () => {
    appState.delayMs = delayFromSlider(Number(el.speed.value));
    render();
  });

  el.run.addEventListener('click', onRun);
  el.step.addEventListener('click', onStep);
  el.stop.addEventListener('click', onStop);
  el.reset.addEventListener('click', onReset);
  el.regenerate.addEventListener('click', onRegenerate);

  render();
}

/// Clamp to both the global range and the current algorithm's size limit.
function clampSize(size) {
  const maxSize = findAlgorithm(appState.algorithmId).maxSize;
  return Math.min(clampArraySize(size), maxSize);
}

const RUN_LABEL = {
  [STATUS.RUNNING]: '一時停止',
  [STATUS.PAUSED]: '再開',
};

export function render() {
  const running = appState.status === STATUS.RUNNING;
  const paused = appState.status === STATUS.PAUSED;
  const active = running || paused;

  el.arraySizeValue.value = String(appState.arraySize);
  el.delayValue.value = formatDelay(appState.delayMs);
  el.statusText.value = appState.message || STATUS_LABEL[appState.status];
  el.compareCount.value = String(appState.stats.compares);
  el.accessCount.value = String(appState.stats.accesses);

  const algorithm = findAlgorithm(appState.algorithmId);
  el.algorithmDescription.textContent = algorithm.description;
  el.pivot.disabled = active || !algorithm.pivot;

  el.run.textContent = RUN_LABEL[appState.status] ?? '開始';
  el.step.disabled = running;
  el.stop.disabled = !active;
  // Settings must not change underneath a running algorithm.
  el.algorithm.disabled = active;
  el.inputType.disabled = active;
  el.arraySize.disabled = active;
}
