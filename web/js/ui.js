import {
  appState,
  clampArraySize,
  delayFromSlider,
  formatDelay,
  STATUS,
  STATUS_LABEL,
} from './state.js';
import { ALGORITHMS } from './sorting/index.js';
import { INPUT_TYPES } from './utils/arrayUtils.js';

const el = {
  algorithm: document.getElementById('algorithm'),
  inputType: document.getElementById('inputType'),
  arraySize: document.getElementById('arraySize'),
  arraySizeValue: document.getElementById('arraySizeValue'),
  speed: document.getElementById('speed'),
  delayValue: document.getElementById('delayValue'),
  run: document.getElementById('run'),
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

export function initUI({ onRun, onReset, onRegenerate }) {
  fillSelect(el.algorithm, ALGORITHMS);
  fillSelect(el.inputType, INPUT_TYPES);

  appState.algorithmId = ALGORITHMS[0].id;
  appState.inputTypeId = INPUT_TYPES[0].id;
  el.algorithm.value = appState.algorithmId;
  el.inputType.value = appState.inputTypeId;

  appState.arraySize = clampArraySize(Number(el.arraySize.value));
  appState.delayMs = delayFromSlider(Number(el.speed.value));

  el.algorithm.addEventListener('change', () => {
    appState.algorithmId = el.algorithm.value;
  });

  el.inputType.addEventListener('change', () => {
    appState.inputTypeId = el.inputType.value;
    onRegenerate();
  });

  el.arraySize.addEventListener('input', () => {
    appState.arraySize = clampArraySize(Number(el.arraySize.value));
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
  el.reset.addEventListener('click', onReset);
  el.regenerate.addEventListener('click', onRegenerate);

  render();
}

export function render() {
  const running = appState.status === STATUS.RUNNING;

  el.arraySizeValue.value = String(appState.arraySize);
  el.delayValue.value = formatDelay(appState.delayMs);
  el.statusText.value = appState.message || STATUS_LABEL[appState.status];
  el.compareCount.value = String(appState.stats.compares);
  el.accessCount.value = String(appState.stats.accesses);

  el.run.disabled = running;
  el.run.textContent = running ? '実行中' : '開始';
  el.algorithm.disabled = running;
  el.inputType.disabled = running;
  el.arraySize.disabled = running;
}
