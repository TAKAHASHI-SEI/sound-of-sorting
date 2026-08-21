// JavaScript counterpart of SortArray (src/SortArray.h): every array access an
// algorithm performs goes through this object and yields an operation event.
// The animation controller consumes the events for drawing, statistics and
// (from Phase 3 on) sound.
//
// Accesses are generators because they cost time and sound in the original;
// colors (mark/watch) are plain methods because they cost neither there.

export class InstrumentedArray {
  constructor(values, { marks = new Map(), watches = new Map() } = {}) {
    this.values = values;
    this.marks = marks;
    this.watches = watches;
  }

  get size() {
    return this.values.length;
  }

  /// Largest value in the array (SortArray::array_max), used by radix sorts.
  get arrayMax() {
    if (this.max === undefined) this.max = Math.max(1, ...this.values);
    return this.max;
  }

  /// Read without counting, sound or delay (SortArray::direct).
  direct(i) {
    return this.values[i];
  }

  *get(i) {
    yield { type: 'get', indices: [i] };
    return this.values[i];
  }

  *set(i, value) {
    this.values[i] = value;
    yield { type: 'set', index: i, value };
  }

  *swap(i, j) {
    const tmp = this.values[i];
    this.values[i] = this.values[j];
    this.values[j] = tmp;
    yield { type: 'swap', indices: [i, j] };
  }

  /// Three-way comparison counted as one (SortArray's ArrayItem::cmp).
  *compare(i, j) {
    yield { type: 'compare', indices: [i, j] };
    const a = this.values[i];
    const b = this.values[j];
    return a === b ? 0 : a < b ? -1 : 1;
  }

  *less(i, j) {
    return (yield* this.compare(i, j)) < 0;
  }

  *greater(i, j) {
    return (yield* this.compare(i, j)) > 0;
  }

  mark(i, color = 2) {
    this.marks.set(i, color);
  }

  markSwap(i, j) {
    const mi = this.marks.get(i) ?? 0;
    const mj = this.marks.get(j) ?? 0;
    this.mark(i, mj);
    this.mark(j, mi);
  }

  unmark(i) {
    this.marks.delete(i);
  }

  unmarkAll() {
    this.marks.clear();
  }

  /// Track a named index cursor (SortArray::watch on a volatile variable). The
  /// getter replaces the pointer the original reads while painting.
  watch(slot, getIndex, color = 3) {
    this.watches.set(slot, { getIndex, color });
  }

  unwatchAll() {
    this.watches.clear();
  }
}
