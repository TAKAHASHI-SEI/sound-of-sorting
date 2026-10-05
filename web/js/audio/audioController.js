import { appState } from '../state.js';

const BASE_FREQUENCY = 120;
const FREQUENCY_SPAN = 1200;
const MAX_POLYPHONY = 64;
const MIN_SOUND_SECONDS = 0.02;

export class AudioController {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.compressor = null;
    this.activeVoices = [];
  }

  async enableFromGesture() {
    if (!appState.soundEnabled) return false;
    await this.ensureContext();
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    return true;
  }

  setVolume(volume) {
    if (!Number.isFinite(volume)) return;
    appState.volume = Math.min(1, Math.max(0, volume));
    if (!this.masterGain || !this.context) return;
    this.masterGain.gain.setValueAtTime(appState.volume, this.context.currentTime);
  }

  stopAll() {
    for (const voice of this.activeVoices.splice(0)) {
      try {
        voice.oscillator.stop();
      } catch {
        // The oscillator may already be stopped.
      }
    }
  }

  handleEvent(event) {
    if (!appState.soundEnabled || !this.context || this.context.state !== 'running') {
      return;
    }

    switch (event.type) {
      case 'compare':
      case 'get':
      case 'swap':
        this.playIndices(event.indices);
        break;
      case 'set':
        this.playValue(event.value);
        break;
      default:
        break;
    }
  }

  async ensureContext() {
    if (this.context) return this.context;

    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('このブラウザは Web Audio API に対応していません');
    }

    this.context = new AudioContextClass();
    this.compressor = this.context.createDynamicsCompressor();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = appState.volume;
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
    return this.context;
  }

  playIndices(indices) {
    for (const index of indices) {
      this.playValue(appState.values[index]);
    }
  }

  playValue(value) {
    if (!Number.isFinite(value) || value <= 0) return;
    const context = this.context;
    if (!context || context.state !== 'running') return;

    const max = Math.max(1, appState.arrayMax);
    const relative = value / max;
    const frequency = BASE_FREQUENCY + FREQUENCY_SPAN * relative * relative;
    const duration = Math.max(MIN_SOUND_SECONDS, (appState.delayMs / 1000) * 0.7);
    const now = context.currentTime;

    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, now);

    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(0, now);

    const attack = duration * 0.025;
    const decay = duration * 0.1;
    const sustainStart = now + attack + decay;
    const releaseStart = now + duration * 0.7;

    gainNode.gain.linearRampToValueAtTime(0.18, now + attack);
    gainNode.gain.linearRampToValueAtTime(0.162, sustainStart);
    gainNode.gain.setValueAtTime(0.162, releaseStart);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.compressor);

    const voice = { oscillator, gainNode };
    oscillator.addEventListener('ended', () => {
      const index = this.activeVoices.indexOf(voice);
      if (index >= 0) this.activeVoices.splice(index, 1);
      oscillator.disconnect();
      gainNode.disconnect();
    });

    this.enforcePolyphony();
    this.activeVoices.push(voice);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  enforcePolyphony() {
    while (this.activeVoices.length >= MAX_POLYPHONY) {
      const oldest = this.activeVoices.shift();
      try {
        oldest.oscillator.stop();
      } catch {
        // The oscillator may already be stopped.
      }
    }
  }
}
