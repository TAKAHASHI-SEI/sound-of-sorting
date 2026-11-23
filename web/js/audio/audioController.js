import { appState } from '../state.js';

const BASE_FREQUENCY = 120;
const FREQUENCY_SPAN = 1200;
/// Port of s_max_oscillators: the original reuses finished oscillators and
/// replaces the oldest one once this limit is reached.
const MAX_POLYPHONY = 512;
const MIN_SOUND_SECONDS = 0.02;
/// Peak amplitude of a single voice (the original's ADSR peaks at 1.0 before the
/// automatic scaling normalises the summed waveform).
const VOICE_PEAK = 0.18;
/// Time constant of the automatic volume ramp.
const VOLUME_RAMP = 0.02;

export class AudioController {
  constructor() {
    this.context = null;
    this.masterGain = null;
    /// Summing bus whose gain shrinks as more voices sound at once.
    this.voiceBus = null;
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
    this.updateVoiceGain();
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
        this.playValues(event.values);
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

    // Limiter stage: the original normalises the summed waveform so a busy mix
    // does not overload the output (automatic dynamic range compression).
    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.value = -12;
    this.compressor.knee.value = 12;
    this.compressor.ratio.value = 6;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.2;

    // Summing bus of all voices. Its gain is divided by the number of sounding
    // voices, the "scale output with number of waves mixed" of SoundCallback.
    this.voiceBus = this.context.createGain();
    this.voiceBus.gain.value = 1;

    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = appState.volume;

    this.voiceBus.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
    return this.context;
  }

  playIndices(indices) {
    if (!indices) return;
    for (const index of indices) {
      this.playValue(appState.values[index]);
    }
  }

  /// Values that are not array elements, e.g. the key in `A[j] > key`.
  playValues(values) {
    if (!values) return;
    for (const value of values) {
      this.playValue(value);
    }
  }

  playValue(value) {
    if (!Number.isFinite(value) || value <= 0) return;
    const context = this.context;
    if (!context || context.state !== 'running') return;

    const max = Math.max(1, appState.arrayMax);
    const relative = value / max;
    const frequency = BASE_FREQUENCY + FREQUENCY_SPAN * relative * relative;
    // Original: sound length = g_delay / 1000 * g_sound_sustain seconds.
    const sustain = Math.max(0, appState.soundSustain);
    const duration = Math.max(MIN_SOUND_SECONDS, (appState.delayMs / 1000) * sustain);
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

    gainNode.gain.linearRampToValueAtTime(VOICE_PEAK, now + attack);
    gainNode.gain.linearRampToValueAtTime(VOICE_PEAK * 0.9, sustainStart);
    gainNode.gain.setValueAtTime(VOICE_PEAK * 0.9, releaseStart);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.voiceBus);

    const voice = { oscillator, gainNode };
    oscillator.addEventListener('ended', () => {
      const index = this.activeVoices.indexOf(voice);
      if (index >= 0) this.activeVoices.splice(index, 1);
      this.updateVoiceGain();
      oscillator.disconnect();
      gainNode.disconnect();
    });

    this.enforcePolyphony();
    this.activeVoices.push(voice);
    this.updateVoiceGain();
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

  /// Automatic volume compression: divide the mixed signal by the number of
  /// sounding voices (square root, so uncorrelated notes stay audible) as the
  /// original's "scale output with number of waves mixed" does.
  updateVoiceGain() {
    if (!this.voiceBus || !this.context) return;
    const count = Math.max(1, this.activeVoices.length);
    const gain = 1 / Math.sqrt(count);
    this.voiceBus.gain.setTargetAtTime(gain, this.context.currentTime, VOLUME_RAMP);
  }
}
