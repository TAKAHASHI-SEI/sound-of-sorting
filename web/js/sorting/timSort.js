// Port of TimSort (src/algorithms/timsort.cpp).
//
// The original runs on MyIterator: dereferencing reads the shown array (one
// counted, sounded access) and assignment writes it. Its temporary storage
// (tmp_) keeps plain values, so comparisons against it read no array element.
// The port preserves that distinction with two comparison helpers:
// `cmpKeyToElemArray` reads the element (one access), `cmpKeyToElemBuffer`
// compares two values that are already known (no access).

const MIN_MERGE = 32;
const MIN_GALLOP = 7;

/// cmp(key, element at `index`) where the element lives in the shown array.
function* cmpKeyToElemArray(A, index, key) {
  return -(yield* A.compareValue(index, key));
}

/// cmp(key, element at `index`) where the element is a plain buffered value.
function* cmpKeyToElemBuffer(A, buffer, index, key) {
  return yield* A.compareValues(key, buffer[index]);
}

/// std::lower_bound: first position whose element is not less than key.
function* lowerBound(cmp, first, last) {
  while (first < last) {
    const mid = (first + last) >> 1;
    if ((yield* cmp(mid)) <= 0) last = mid;
    else first = mid + 1;
  }
  return first;
}

/// std::upper_bound: first position whose element is greater than key.
function* upperBound(cmp, first, last) {
  while (first < last) {
    const mid = (first + last) >> 1;
    if ((yield* cmp(mid)) < 0) last = mid;
    else first = mid + 1;
  }
  return first;
}

/// Port of TimSort::gallopLeft. `cmp(off)` must return cmp(key, element at
/// offset `off`). Returns the offset where key belongs, keeping duplicates on
/// the left.
function* gallopLeft(cmp, len, hint) {
  let lastOfs = 0;
  let ofs = 1;

  if ((yield* cmp(hint)) > 0) {
    const maxOfs = len - hint;
    while (ofs < maxOfs && (yield* cmp(hint + ofs)) > 0) {
      lastOfs = ofs;
      ofs = (ofs << 1) + 1;
      if (ofs <= 0) ofs = maxOfs;
    }
    if (ofs > maxOfs) ofs = maxOfs;

    lastOfs += hint;
    ofs += hint;
  } else {
    const maxOfs = hint + 1;
    while (ofs < maxOfs && (yield* cmp(hint - ofs)) <= 0) {
      lastOfs = ofs;
      ofs = (ofs << 1) + 1;
      if (ofs <= 0) ofs = maxOfs;
    }
    if (ofs > maxOfs) ofs = maxOfs;

    const tmp = lastOfs;
    lastOfs = hint - ofs;
    ofs = hint - tmp;
  }

  return yield* lowerBound(cmp, lastOfs + 1, ofs);
}

/// Port of TimSort::gallopRight. See gallopLeft for the `cmp` contract.
function* gallopRight(cmp, len, hint) {
  let ofs = 1;
  let lastOfs = 0;

  if ((yield* cmp(hint)) < 0) {
    const maxOfs = hint + 1;
    while (ofs < maxOfs && (yield* cmp(hint - ofs)) < 0) {
      lastOfs = ofs;
      ofs = (ofs << 1) + 1;
      if (ofs <= 0) ofs = maxOfs;
    }
    if (ofs > maxOfs) ofs = maxOfs;

    const tmp = lastOfs;
    lastOfs = hint - ofs;
    ofs = hint - tmp;
  } else {
    const maxOfs = len - hint;
    while (ofs < maxOfs && (yield* cmp(hint + ofs)) >= 0) {
      lastOfs = ofs;
      ofs = (ofs << 1) + 1;
      if (ofs <= 0) ofs = maxOfs;
    }
    if (ofs > maxOfs) ofs = maxOfs;

    lastOfs += hint;
    ofs += hint;
  }

  return yield* upperBound(cmp, lastOfs + 1, ofs);
}

/// std::copy over the shown array: read then write, two accesses per element.
function* copyArrayToArray(A, src, dest, count) {
  for (let i = 0; i < count; ++i) {
    yield* A.set(dest + i, yield* A.get(src + i));
  }
}

/// std::copy_backward over the shown array.
function* copyArrayToArrayBackward(A, src, dest, count) {
  for (let i = count - 1; i >= 0; --i) {
    yield* A.set(dest + i, yield* A.get(src + i));
  }
}

/// Copy plain buffered values into the shown array: one write per element.
function* copyBufferToArray(A, buffer, src, dest, count) {
  for (let i = 0; i < count; ++i) {
    yield* A.set(dest + i, buffer[src + i]);
  }
}

function* reverseRange(A, lo, hi) {
  const n = hi - lo;
  for (let i = 0; i < (n >> 1); ++i) {
    yield* A.swap(lo + i, hi - 1 - i);
  }
}

/// Port of TimSort::binarySort.
function* binarySort(A, lo, hi, start) {
  if (start === lo) ++start;

  for (; start < hi; ++start) {
    const pivot = yield* A.get(start);

    const pos = yield* upperBound((off) => cmpKeyToElemArray(A, off, pivot), lo, start);
    for (let p = start; p > pos; --p) {
      yield* A.set(p, yield* A.get(p - 1));
    }
    yield* A.set(pos, pivot);
  }
}

/// Port of TimSort::countRunAndMakeAscending, returning the run length.
function* countRunAndMakeAscending(A, lo, hi) {
  let runHi = lo + 1;
  if (runHi === hi) return 1;

  const descending = (yield* A.compare(runHi, lo)) < 0;
  runHi = lo + 2;

  if (descending) {
    while (runHi < hi && (yield* A.compare(runHi, runHi - 1)) < 0) ++runHi;
    yield* reverseRange(A, lo, runHi);
  } else {
    while (runHi < hi && (yield* A.compare(runHi, runHi - 1)) >= 0) ++runHi;
  }

  return runHi - lo;
}

/// Port of TimSort::minRunLength.
function minRunLength(n) {
  let r = 0;
  while (n >= MIN_MERGE) {
    r |= n & 1;
    n >>= 1;
  }
  return n + r;
}

class TimSorter {
  constructor() {
    this.minGallop = MIN_GALLOP;
    /// runs still awaiting a merge: { base, len }
    this.pending = [];
  }

  pushRun(base, len) {
    this.pending.push({ base, len });
  }

  *mergeCollapse(A) {
    while (this.pending.length > 1) {
      let n = this.pending.length - 2;

      if (n > 0 && this.pending[n - 1].len <= this.pending[n].len + this.pending[n + 1].len) {
        if (this.pending[n - 1].len < this.pending[n + 1].len) --n;
        yield* this.mergeAt(A, n);
      } else if (this.pending[n].len <= this.pending[n + 1].len) {
        yield* this.mergeAt(A, n);
      } else {
        break;
      }
    }
  }

  *mergeForceCollapse(A) {
    while (this.pending.length > 1) {
      let n = this.pending.length - 2;
      if (n > 0 && this.pending[n - 1].len < this.pending[n + 1].len) --n;
      yield* this.mergeAt(A, n);
    }
  }

  *mergeAt(A, i) {
    const stackSize = this.pending.length;
    const base1 = this.pending[i].base;
    const len1 = this.pending[i].len;
    const base2 = this.pending[i + 1].base;
    let len2 = this.pending[i + 1].len;

    this.pending[i].len = len1 + len2;
    if (i === stackSize - 3) {
      this.pending[i + 1] = { base: this.pending[i + 2].base, len: this.pending[i + 2].len };
    }
    this.pending.pop();

    // gallopRight(*base2, base1, len1, 0): the key is the first element of the
    // second run, read from the shown array.
    const key = yield* A.get(base2);
    const k = yield* gallopRight((off) => cmpKeyToElemArray(A, base1 + off, key), len1, 0);
    const base1b = base1 + k;
    const len1b = len1 - k;
    if (len1b === 0) return;

    // gallopLeft(*(base1 + len1 - 1), base2, len2, len2 - 1).
    const key2 = yield* A.get(base1b + len1b - 1);
    len2 = yield* gallopLeft((off) => cmpKeyToElemArray(A, base2 + off, key2), len2, len2 - 1);
    if (len2 === 0) return;

    if (len1b <= len2) {
      yield* this.mergeLo(A, base1b, len1b, base2, len2);
    } else {
      yield* this.mergeHi(A, base1b, len1b, base2, len2);
    }
  }

  /// Port of TimSort::mergeLo. Buffers the first run into `tmp` (plain
  /// values), then merges forward into the shown array.
  *mergeLo(A, base1, len1, base2, len2) {
    const tmp = new Array(len1);
    for (let i = 0; i < len1; ++i) tmp[i] = yield* A.get(base1 + i);

    let c1 = 0; // tmp cursor
    let c2 = base2; // array cursor over the second run
    let dest = base1;

    yield* A.set(dest++, yield* A.get(c2++));
    if (--len2 === 0) {
      yield* copyBufferToArray(A, tmp, c1, dest, len1);
      return;
    }
    if (len1 === 1) {
      yield* copyArrayToArray(A, c2, dest, len2);
      yield* A.set(dest + len2, tmp[c1]);
      return;
    }

    let minGallop = this.minGallop;

    for (;;) {
      let count1 = 0;
      let count2 = 0;
      let breakOuter = false;

      do {
        if ((yield* A.compareValue(c2, tmp[c1])) < 0) {
          yield* A.set(dest++, yield* A.get(c2++));
          ++count2;
          count1 = 0;
          if (--len2 === 0) {
            breakOuter = true;
            break;
          }
        } else {
          yield* A.set(dest++, tmp[c1++]);
          ++count1;
          count2 = 0;
          if (--len1 === 1) {
            breakOuter = true;
            break;
          }
        }
      } while ((count1 | count2) < minGallop);
      if (breakOuter) break;

      do {
        // gallopRight(*cursor2, cursor1, len1, 0).
        const key1 = yield* A.get(c2);
        count1 = yield* gallopRight(
          (off) => cmpKeyToElemBuffer(A, tmp, c1 + off, key1),
          len1,
          0,
        );
        if (count1 !== 0) {
          yield* copyBufferToArray(A, tmp, c1, dest, count1);
          dest += count1;
          c1 += count1;
          len1 -= count1;
          if (len1 <= 1) {
            breakOuter = true;
            break;
          }
        }
        yield* A.set(dest++, yield* A.get(c2++));
        if (--len2 === 0) {
          breakOuter = true;
          break;
        }

        // gallopLeft(*cursor1, cursor2, len2, 0).
        const key2 = tmp[c1];
        count2 = yield* gallopLeft(
          (off) => cmpKeyToElemArray(A, c2 + off, key2),
          len2,
          0,
        );
        if (count2 !== 0) {
          yield* copyArrayToArray(A, c2, dest, count2);
          dest += count2;
          c2 += count2;
          len2 -= count2;
          if (len2 === 0) {
            breakOuter = true;
            break;
          }
        }
        yield* A.set(dest++, tmp[c1++]);
        if (--len1 === 1) {
          breakOuter = true;
          break;
        }

        --minGallop;
      } while ((count1 >= MIN_GALLOP) | (count2 >= MIN_GALLOP));
      if (breakOuter) break;

      if (minGallop < 0) minGallop = 0;
      minGallop += 2;
    }

    this.minGallop = Math.min(minGallop, 1);

    if (len1 === 1) {
      yield* copyArrayToArray(A, c2, dest, len2);
      yield* A.set(dest + len2, tmp[c1]);
    } else {
      yield* copyBufferToArray(A, tmp, c1, dest, len1);
    }
  }

  /// Port of TimSort::mergeHi. Buffers the second run into `tmp` (plain
  /// values), then merges backward into the shown array.
  *mergeHi(A, base1, len1, base2, len2) {
    const tmp = new Array(len2);
    for (let i = 0; i < len2; ++i) tmp[i] = yield* A.get(base2 + i);

    let c1 = base1 + (len1 - 1); // array cursor over the first run
    let c2 = len2 - 1; // tmp cursor
    let dest = base2 + (len2 - 1);

    yield* A.set(dest--, yield* A.get(c1--));
    if (--len1 === 0) {
      yield* copyBufferToArray(A, tmp, 0, dest - (len2 - 1), len2);
      return;
    }
    if (len2 === 1) {
      dest -= len1;
      c1 -= len1;
      yield* copyArrayToArrayBackward(A, c1 + 1, dest + 1, len1);
      yield* A.set(dest, tmp[c2]);
      return;
    }

    let minGallop = this.minGallop;

    for (;;) {
      let count1 = 0;
      let count2 = 0;
      let breakOuter = false;

      do {
        if ((yield* A.compareValue(c1, tmp[c2])) > 0) {
          yield* A.set(dest--, yield* A.get(c1--));
          ++count1;
          count2 = 0;
          if (--len1 === 0) {
            breakOuter = true;
            break;
          }
        } else {
          yield* A.set(dest--, tmp[c2--]);
          ++count2;
          count1 = 0;
          if (--len2 === 1) {
            breakOuter = true;
            break;
          }
        }
      } while ((count1 | count2) < minGallop);
      if (breakOuter) break;

      do {
        // count1 = len1 - gallopRight(*cursor2, base1, len1, len1 - 1).
        const key1 = tmp[c2];
        count1 = len1 - (yield* gallopRight(
          (off) => cmpKeyToElemArray(A, base1 + off, key1),
          len1,
          len1 - 1,
        ));
        if (count1 !== 0) {
          dest -= count1;
          c1 -= count1;
          len1 -= count1;
          yield* copyArrayToArrayBackward(A, c1 + 1, dest + 1, count1);
          if (len1 === 0) {
            breakOuter = true;
            break;
          }
        }
        yield* A.set(dest--, tmp[c2--]);
        if (--len2 === 1) {
          breakOuter = true;
          break;
        }

        // count2 = len2 - gallopLeft(*cursor1, tmp.begin(), len2, len2 - 1).
        const key2 = yield* A.get(c1);
        count2 = len2 - (yield* gallopLeft(
          (off) => cmpKeyToElemBuffer(A, tmp, off, key2),
          len2,
          len2 - 1,
        ));
        if (count2 !== 0) {
          dest -= count2;
          c2 -= count2;
          len2 -= count2;
          yield* copyBufferToArray(A, tmp, c2 + 1, dest + 1, count2);
          if (len2 <= 1) {
            breakOuter = true;
            break;
          }
        }
        yield* A.set(dest--, yield* A.get(c1--));
        if (--len1 === 0) {
          breakOuter = true;
          break;
        }

        --minGallop;
      } while ((count1 >= MIN_GALLOP) | (count2 >= MIN_GALLOP));
      if (breakOuter) break;

      if (minGallop < 0) minGallop = 0;
      minGallop += 2;
    }

    this.minGallop = Math.min(minGallop, 1);

    if (len2 === 1) {
      dest -= len1;
      c1 -= len1;
      yield* copyArrayToArrayBackward(A, c1 + 1, dest + 1, len1);
      yield* A.set(dest, tmp[c2]);
    } else {
      yield* copyBufferToArray(A, tmp, 0, dest - (len2 - 1), len2);
    }
  }
}

export function* timSort(A) {
  const nRemaining = A.size;
  if (nRemaining < 2) return;

  if (nRemaining < MIN_MERGE) {
    const initRunLen = yield* countRunAndMakeAscending(A, 0, A.size);
    yield* binarySort(A, 0, A.size, initRunLen);
    return;
  }

  const ts = new TimSorter();
  const minRun = minRunLength(nRemaining);
  let cur = 0;
  let remaining = nRemaining;

  do {
    let runLen = yield* countRunAndMakeAscending(A, cur, A.size);

    if (runLen < minRun) {
      const force = Math.min(remaining, minRun);
      yield* binarySort(A, cur, cur + force, cur + runLen);
      runLen = force;
    }

    ts.pushRun(cur, runLen);
    yield* ts.mergeCollapse(A);

    cur += runLen;
    remaining -= runLen;
  } while (remaining !== 0);

  yield* ts.mergeForceCollapse(A);
}
