// JavaScript counterpart of SortArray (src/SortArray.h): every array access an
// algorithm performs goes through this object and yields an operation event.
// The animation controller consumes the events for drawing, statistics and
// (from Phase 3 on) sound.

export class InstrumentedArray {
  constructor(values) {
    this.values = values;
  }

  get size() {
    return this.values.length;
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

  *mark(i, color = 2) {
    yield { type: 'mark', index: i, color };
  }

  *unmark(i) {
    yield { type: 'unmark', index: i };
  }

  *unmarkAll() {
    yield { type: 'unmarkAll' };
  }

  *watch(index, color = 3) {
    yield { type: 'watch', index, color };
  }

  *unwatchAll() {
    yield { type: 'unwatchAll' };
  }
}
