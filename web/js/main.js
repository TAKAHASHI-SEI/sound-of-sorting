import { AnimationController } from './animation/animationController.js';
import { findAlgorithm } from './sorting/index.js';
import {
  appState,
  clearHighlights,
  regenerateArray,
  resetStats,
  restoreArray,
  STATUS,
} from './state.js';
import { initUI, render } from './ui.js';
import { isSorted } from './utils/arrayUtils.js';

const canvas = document.getElementById('sortview');
const controller = new AnimationController(canvas, { onUpdate: render });

function onRegenerate() {
  controller.stop();
  regenerateArray();
  render();
}

function onReset() {
  controller.stop();
  restoreArray();
  render();
}

async function onRun() {
  if (appState.status === STATUS.RUNNING) return;

  // The original regenerates the data when a sorted array is run again.
  if (isSorted(appState.values)) regenerateArray();

  appState.originalValues = appState.values.slice();
  clearHighlights();
  resetStats();

  await controller.run(findAlgorithm(appState.algorithmId));
  render();
}

initUI({ onRun, onReset, onRegenerate });
regenerateArray();
controller.startRendering();
render();
