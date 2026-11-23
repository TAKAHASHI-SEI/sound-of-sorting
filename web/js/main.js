import { AnimationController } from './animation/animationController.js';
import { AudioController } from './audio/audioController.js';
import { ALGORITHMS, findAlgorithm } from './sorting/index.js';
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

async function enableAudio() {
  try {
    await audio.enableFromGesture();
  } catch (error) {
    appState.soundEnabled = false;
    appState.message = error instanceof Error ? error.message : '音声の初期化に失敗しました';
  }
}

/// Shared setup of Run and Step: the original regenerates the data when a
/// sorted array is run again, then a fresh snapshot becomes the reset target.
function prepareRun() {
  if (isSorted(appState.values)) regenerateArray();
  appState.originalValues = appState.values.slice();
  clearHighlights();
  resetStats();
}

function onSoundToggle(enabled) {
  if (!enabled) {
    audio.stopAll();
    return Promise.resolve();
  }
  return enableAudio();
}

function onVolumeChange(volume) {
  audio.setVolume(volume);
}

async function onRun() {
  if (appState.status === STATUS.RUNNING || appState.status === STATUS.PAUSED) return;

  await enableAudio();
  prepareRun();

  await controller.run(findAlgorithm(appState.algorithmId));
  render();
}

/// Step button: one array operation per click, pausing between operations.
async function onStep() {
  if (appState.status === STATUS.RUNNING) return;

  if (!controller.isActive()) {
    await enableAudio();
    prepareRun();
  }

  controller.step(findAlgorithm(appState.algorithmId));
  render();
}

/// Random button: stop, regenerate the data and run a random algorithm.
async function onRandom() {
  controller.stop();
  audio.stopAll();
  regenerateArray();

  const choice = ALGORITHMS[Math.floor(Math.random() * ALGORITHMS.length)];
  appState.algorithmId = choice.id;
  render();

  await onRun();
}

initUI({ onRun, onStep, onRandom, onPause, onStop, onReset, onRegenerate, onSoundToggle, onVolumeChange });
regenerateArray();
controller.startRendering();
render();
