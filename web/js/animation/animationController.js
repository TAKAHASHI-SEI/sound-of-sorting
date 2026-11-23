import { InstrumentedArray } from '../sorting/instrumentedArray.js';
import { appState, STATUS } from '../state.js';
import { isSorted } from '../utils/arrayUtils.js';

/// Palette of WSortView::paint (src/WSortView.cpp).
const PALETTE = [
  '#ffffff', '#ff0000', '#00ff00', '#00ffff',
  '#ffff00', '#ff00ff', '#ffc080', '#ff80c0',
  '#80c0ff', '#c0ff80', '#c080ff', '#80ffc0',
  '#8080ff', '#c080c0', '#80c0c0', '#c0c080',
  '#0080ff',
];

const MARGIN = 10;
/// The original repaints at 30 fps; one batch of events per frame matches that.
const FRAME_MS = 1000 / 30;
/// Never block the main thread longer than this per batch.
const BATCH_BUDGET_MS = 8;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

export class AnimationController {
  constructor(canvas, { onUpdate, audioController } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onUpdate = onUpdate ?? (() => {});
    this.audioController = audioController ?? null;
    this.runId = 0;
    this.activeRun = null;
    this.rendering = false;
  }

  /// Continuously repaint the current array state, decoupled from the algorithm.
  startRendering() {
    if (this.rendering) return;
    this.rendering = true;
    const loop = () => {
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
    const { canvas, ctx } = this;
    const cssWidth = canvas.clientWidth;
    if (cssWidth > 0) {
      const dpr = window.devicePixelRatio || 1;
      const width = Math.round(cssWidth * dpr);
      const height = Math.round((cssWidth / 2) * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const values = appState.values;
    const size = values.length;
    if (size === 0) return;

    const width = canvas.width - 2 * MARGIN;
    const height = canvas.height - 2 * MARGIN;
    if (width <= 0 || height <= 0) return;

    // Bar layout of WSortView::paint: one pixel between bars.
    const barWidth = Math.max((width - (size - 1)) / size, 0);
    const step = barWidth + 1;
    const drawWidth = Math.max(1, barWidth);
    const max = appState.arrayMax || 1;

    for (let i = 0; i < size; ++i) {
      ctx.fillStyle = PALETTE[this.indexColor(i)];
      const barHeight = (height * values[i]) / max;
      ctx.fillRect(MARGIN + i * step, MARGIN + height - barHeight, drawWidth, barHeight);
    }
  }

  /// Port of SortArray::GetIndexColor: access beats watch beats mark beats normal.
  indexColor(index) {
    if (appState.access.includes(index)) return 1;
    const watched = appState.watches.get(index);
    if (watched !== undefined) return watched;
    return appState.marks.get(index) ?? 0;
  }

  /// True while a run is in progress (running, paused or mid-step).
  isActive() {
    return this.activeRun !== null;
  }

  /// Generator state of one algorithm run over the currently shown array.
  createRun(algorithm) {
    return {
      runId: ++this.runId,
      events: algorithm.run(new InstrumentedArray(appState.values), {
        quicksortPivot: appState.quicksortPivot,
      }),
      paused: false,
      processing: false,
    };
  }

  /// Run one algorithm to completion, returning when it finished or was stopped.
  async run(algorithm) {
    if (this.activeRun) return false;

    const run = this.createRun(algorithm);
    this.activeRun = run;

    appState.status = STATUS.RUNNING;
    appState.message = '';
    this.onUpdate();
    return this.process(run);
  }

  /// Advance one event of a stepwise run, starting the run if none is active.
  /// Port of the Step button (WMain::OnStep): one array operation per click.
  step(algorithm) {
    if (this.activeRun && this.activeRun.processing) return false;

    const run = this.activeRun ?? this.createRun(algorithm);
    this.activeRun = run;
    run.paused = true;
    appState.message = '';

    const { done, value } = run.events.next();
    if (done) {
      this.finishRun();
      return true;
    }

    this.applyEvent(value);
    appState.status = STATUS.PAUSED;
    this.onUpdate();
    return false;
  }

  async process(run) {
    if (run.processing) return false;
    run.processing = true;

    try {
      while (this.activeRun === run) {
        if (run.paused) {
          appState.status = STATUS.PAUSED;
          appState.access = [];
          this.audioController?.stopAll();
          this.onUpdate();
          return false;
        }

        const batchStart = performance.now();
        let owedDelay = 0;
        let finished = false;

        while (true) {
          const { done, value } = run.events.next();
          if (done) {
            finished = true;
            break;
          }
          this.applyEvent(value);
          owedDelay += appState.delayMs * accessCount(value);
          if (owedDelay >= FRAME_MS) break;
          if (performance.now() - batchStart >= BATCH_BUDGET_MS) break;
        }

        this.onUpdate();
        if (finished) break;

        const elapsed = performance.now() - batchStart;
        if (owedDelay - elapsed >= 1) {
          await sleep(owedDelay - elapsed);
        } else {
          await nextFrame();
        }
      }

      if (this.activeRun !== run) return false;

      this.finishRun();
      return true;
    } finally {
      if (this.activeRun === run) {
        run.processing = false;
      }
    }
  }

  /// Complete a run: verification step of SortArray::CheckSorted, then release.
  finishRun() {
    appState.access = [];
    if (isSorted(appState.values)) {
      appState.status = STATUS.COMPLETED;
      for (let i = 0; i < appState.values.length; ++i) appState.marks.set(i, 2);
    } else {
      appState.status = STATUS.ERROR;
      appState.message = 'ソート結果が正しくありません';
    }
    this.audioController?.stopAll();
    this.activeRun = null;
    this.onUpdate();
  }

  pause() {
    if (!this.activeRun || this.activeRun.paused) return;
    this.activeRun.paused = true;
  }

  resume() {
    if (!this.activeRun || !this.activeRun.paused) return false;
    this.activeRun.paused = false;
    appState.status = STATUS.RUNNING;
    this.onUpdate();
    void this.process(this.activeRun);
    return true;
  }

  stop() {
    ++this.runId;
    this.activeRun = null;
    appState.access = [];
    appState.watches.clear();
    appState.status = STATUS.STOPPED;
    appState.message = '';
    this.audioController?.stopAll();
    this.onUpdate();
  }

  applyEvent(event) {
    const stats = appState.stats;

    switch (event.type) {
      case 'compare':
        stats.compares += 1;
        stats.accesses += event.indices.length;
        appState.access = event.indices;
        this.audioController?.handleEvent(event);
        break;
      case 'get':
      case 'swap':
        stats.accesses += event.indices.length;
        appState.access = event.indices;
        this.audioController?.handleEvent(event);
        break;
      case 'set':
        stats.accesses += 1;
        appState.access = [event.index];
        this.audioController?.handleEvent(event);
        break;
      case 'mark':
        appState.marks.set(event.index, event.color);
        break;
      case 'markSwap': {
        const [i, j] = event.indices;
        const left = appState.marks.get(i);
        const right = appState.marks.get(j);
        if (right === undefined) appState.marks.delete(i);
        else appState.marks.set(i, right);
        if (left === undefined) appState.marks.delete(j);
        else appState.marks.set(j, left);
        break;
      }
      case 'watch':
        if (event.index >= 0 && event.index < appState.values.length) {
          appState.watches.set(event.index, event.color);
        }
        break;
      case 'unwatchAll':
        appState.watches.clear();
        break;
      case 'unmark':
        appState.marks.delete(event.index);
        break;
      case 'unmarkAll':
        appState.marks.clear();
        break;
      default:
        break;
    }
  }
}

/// Number of array accesses an event stands for, i.e. how much delay it owes.
function accessCount(event) {
  switch (event.type) {
    case 'compare':
    case 'get':
    case 'swap':
      return event.indices.length;
    case 'set':
      return 1;
    default:
      return 0;
  }
}
