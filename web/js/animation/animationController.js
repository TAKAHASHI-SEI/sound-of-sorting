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
  constructor(canvas, { onUpdate } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onUpdate = onUpdate ?? (() => {});
    this.runId = 0;
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

  /// Port of SortArray::GetIndexColor: access beats mark beats normal.
  indexColor(index) {
    if (appState.access.includes(index)) return 1;
    return appState.marks.get(index) ?? 0;
  }

  /// Run one algorithm to completion, returning when it finished or was stopped.
  async run(algorithm) {
    const runId = ++this.runId;
    const array = new InstrumentedArray(appState.values);
    const events = algorithm.run(array);

    appState.status = STATUS.RUNNING;
    appState.message = '';
    this.onUpdate();

    while (this.runId === runId) {
      const batchStart = performance.now();
      let owedDelay = 0;
      let finished = false;

      while (true) {
        const { done, value } = events.next();
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

    if (this.runId !== runId) return false;

    appState.access = [];
    // Verification step of SortArray::CheckSorted.
    if (isSorted(appState.values)) {
      appState.status = STATUS.COMPLETED;
      for (let i = 0; i < appState.values.length; ++i) appState.marks.set(i, 2);
    } else {
      appState.status = STATUS.ERROR;
      appState.message = 'ソート結果が正しくありません';
    }
    this.onUpdate();
    return true;
  }

  stop() {
    ++this.runId;
    appState.access = [];
  }

  applyEvent(event) {
    const stats = appState.stats;

    switch (event.type) {
      case 'compare':
        stats.compares += 1;
        stats.accesses += event.indices.length;
        appState.access = event.indices;
        break;
      case 'get':
      case 'swap':
        stats.accesses += event.indices.length;
        appState.access = event.indices;
        break;
      case 'set':
        stats.accesses += 1;
        appState.access = [event.index];
        break;
      case 'mark':
        appState.marks.set(event.index, event.color);
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
