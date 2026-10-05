import { AnimationController } from './animation/animationController.js';
import { AudioController } from './audio/audioController.js';
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
const audio = new AudioController();
const controller = new AnimationController(canvas, { onUpdate: render, audioController: audio });

function onRegenerate() {
  controller.stop();
  audio.stopAll();
  regenerateArray();
  render();
}

function onReset() {
  controller.stop();
  audio.stopAll();
  restoreArray();
  render();
}

function onPause() {
  if (appState.status === STATUS.RUNNING) {
    controller.pause();
    return;
  }
  if (appState.status === STATUS.PAUSED) {
    controller.resume();
  }
}

function onStop() {
  controller.stop();
  audio.stopAll();
  render();
}

async function onSoundToggle(enabled) {
  if (!enabled) {
    audio.stopAll();
    return;
  }

  try {
    await audio.enableFromGesture();
  } catch (error) {
    appState.soundEnabled = false;
    appState.message = error instanceof Error ? error.message : '音声の初期化に失敗しました';
  }
}

function onVolumeChange(volume) {
  audio.setVolume(volume);
}

async function onRun() {
  if (appState.status === STATUS.RUNNING || appState.status === STATUS.PAUSED) return;

  try {
    await audio.enableFromGesture();
  } catch (error) {
    appState.soundEnabled = false;
    appState.message = error instanceof Error ? error.message : '音声の初期化に失敗しました';
  }

  // The original regenerates the data when a sorted array is run again.
  if (isSorted(appState.values)) regenerateArray();

  appState.originalValues = appState.values.slice();
  clearHighlights();
  resetStats();

  await controller.run(findAlgorithm(appState.algorithmId));
  render();
}

initUI({ onRun, onPause, onStop, onReset, onRegenerate, onSoundToggle, onVolumeChange });
regenerateArray();
controller.startRendering();
render();
