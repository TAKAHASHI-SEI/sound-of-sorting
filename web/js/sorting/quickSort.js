// Ports of the quick sort variants of src/SortAlgo.cpp, including the pivot
// rule selection of QuickSortSelectPivot.

export const PIVOT_TYPES = [
  { id: 'first', name: 'First Item' },
  { id: 'last', name: 'Last Item' },
  { id: 'mid', name: 'Middle Item' },
  { id: 'random', name: 'Random Item' },
  { id: 'median3', name: 'Median of Three' },
];

let pivotType = PIVOT_TYPES[0].id;

export function setQuickSortPivot(id) {
  if (PIVOT_TYPES.some((p) => p.id === id)) pivotType = id;
}

export function getQuickSortPivot() {
  return pivotType;
}

function compareValues(a, b) {
  return a === b ? 0 : a < b ? -1 : 1;
}

/// Port of QuickSortSelectPivot; hi is exclusive.
function* selectPivot(A, lo, hi) {
  switch (pivotType) {
    case 'last':
      return hi - 1;
    case 'mid':
      return Math.floor((lo + hi) / 2);
    case 'random':
      return lo + Math.floor(Math.random() * (hi - lo));
    case 'median3': {
      const mid = Math.floor((lo + hi) / 2);
      // The original re-reads the three items per comparison; one read each is
      // enough here and keeps the access count proportional.
      const a = yield* A.get(lo);
      const b = yield* A.get(mid);
      const c = yield* A.get(hi - 1);

      if (a === b) return lo;
      if (a === c || b === c) return hi - 1;

      return a < b
        ? b < c
          ? mid
          : a < c
            ? hi - 1
            : lo
        : b > c
          ? mid
          : a < c
            ? lo
            : hi - 1;
    }
    default:
      return lo;
  }
}

// *** Quick Sort LR (pointers at left and right), hi is inclusive.

function* quickSortLRRange(A, lo, hi) {
  let p = yield* selectPivot(A, lo, hi + 1);
  const pivot = yield* A.get(p);
  A.watch('p', () => p, 2);

  let i = lo;
  let j = hi;
  A.watch('i', () => i, 3);
  A.watch('j', () => j, 3);

  while (i <= j) {
    while ((yield* A.get(i)) < pivot) i++;
    while ((yield* A.get(j)) > pivot) j--;

    if (i <= j) {
      yield* A.swap(i, j);

      // follow pivot if it is swapped
      if (p === i) p = j;
      else if (p === j) p = i;

      i++;
      j--;
    }
  }

  A.unwatchAll();

  if (lo < j) yield* quickSortLRRange(A, lo, j);
  if (i < hi) yield* quickSortLRRange(A, i, hi);
}

export function* quickSortLR(A) {
  if (A.size > 1) yield* quickSortLRRange(A, 0, A.size - 1);
}

// *** Quick Sort LL (two pointers at left, pivot moved to the back).

function* partitionLL(A, lo, hi) {
  const p = yield* selectPivot(A, lo, hi);

  const pivot = yield* A.get(p);
  yield* A.swap(p, hi - 1);
  A.mark(hi - 1);

  let i = lo;
  A.watch('i', () => i, 3);

  for (let j = lo; j < hi - 1; ++j) {
    if ((yield* A.get(j)) <= pivot) {
      yield* A.swap(i, j);
      ++i;
    }
  }

  yield* A.swap(i, hi - 1);
  A.unmark(hi - 1);
  A.unwatchAll();

  return i;
}

function* quickSortLLRange(A, lo, hi) {
  if (lo + 1 < hi) {
    const mid = yield* partitionLL(A, lo, hi);
    yield* quickSortLLRange(A, lo, mid);
    yield* quickSortLLRange(A, mid + 1, hi);
  }
}

export function* quickSortLL(A) {
  yield* quickSortLLRange(A, 0, A.size);
}

// *** Ternary Quick Sort LR: partitions "=<?>=" and copies the equal ranges
// into the middle afterwards. hi is inclusive.

function* quickSortTernaryLRRange(A, lo, hi) {
  if (hi <= lo) return;

  const piv = yield* selectPivot(A, lo, hi + 1);
  yield* A.swap(piv, hi);
  A.mark(hi);

  const pivot = yield* A.get(hi);

  // schema: |p ===  |i <<< | ??? |j >>> |q === |piv
  let i = lo;
  let j = hi - 1;
  let p = lo;
  let q = hi - 1;

  A.watch('i', () => i, 3);
  A.watch('j', () => j, 3);

  for (;;) {
    let cmp;

    // partition on left
    while (i <= j && (cmp = compareValues(yield* A.get(i), pivot)) <= 0) {
      if (cmp === 0) {
        A.mark(p, 4);
        yield* A.swap(i, p++);
      }
      ++i;
    }

    // partition on right
    while (i <= j && (cmp = compareValues(yield* A.get(j), pivot)) >= 0) {
      if (cmp === 0) {
        A.mark(q, 4);
        yield* A.swap(j, q--);
      }
      --j;
    }

    if (i > j) break;

    // swap item between < > regions
    yield* A.swap(i++, j--);
  }

  // swap pivot to right place
  yield* A.swap(i, hi);
  A.markSwap(i, hi);

  const numLess = i - p;
  const numGreater = q - j;

  // swap equal ranges into center, but avoid swapping equal elements
  j = i - 1;
  i = i + 1;

  const pe = lo + Math.min(p - lo, numLess);
  for (let k = lo; k < pe; k++, j--) {
    yield* A.swap(k, j);
    A.markSwap(k, j);
  }

  // one item is already greater at the end
  const qe = hi - 1 - Math.min(hi - 1 - q, numGreater - 1);
  for (let k = hi - 1; k > qe; k--, i++) {
    yield* A.swap(i, k);
    A.markSwap(i, k);
  }

  A.unwatchAll();
  A.unmarkAll();

  yield* quickSortTernaryLRRange(A, lo, lo + numLess - 1);
  yield* quickSortTernaryLRRange(A, hi - numGreater + 1, hi);
}

export function* quickSortTernaryLR(A) {
  if (A.size > 1) yield* quickSortTernaryLRRange(A, 0, A.size - 1);
}

// *** Ternary Quick Sort LL: partitions "<>?=" and copies the "=" to middle.

function* partitionTernaryLL(A, lo, hi) {
  const p = yield* selectPivot(A, lo, hi);

  const pivot = yield* A.get(p);
  yield* A.swap(p, hi - 1);
  A.mark(hi - 1);

  let i = lo;
  let k = hi - 1;
  A.watch('i', () => i, 3);

  for (let j = lo; j < k; ++j) {
    const cmp = compareValues(yield* A.get(j), pivot);
    if (cmp === 0) {
      yield* A.swap(--k, j);
      --j; // reclassify A[j]
      A.mark(k, 4);
    } else if (cmp < 0) {
      yield* A.swap(i++, j);
    }
  }

  // unwatch i, because the pivot is swapped there in the first step of the
  // following swap loop
  A.unwatchAll();

  const j = i + (hi - k);

  for (let s = 0; s < hi - k; ++s) {
    yield* A.swap(i + s, hi - 1 - s);
    A.markSwap(i + s, hi - 1 - s);
  }
  A.unmarkAll();

  return [i, j];
}

function* quickSortTernaryLLRange(A, lo, hi) {
  if (lo + 1 < hi) {
    const [first, second] = yield* partitionTernaryLL(A, lo, hi);
    yield* quickSortTernaryLLRange(A, lo, first);
    yield* quickSortTernaryLLRange(A, second, hi);
  }
}

export function* quickSortTernaryLL(A) {
  yield* quickSortTernaryLLRange(A, 0, A.size);
}

// *** Dual-Pivot Quick Sort (Yaroslavskiy), by Sebastian Wild.

function* dualPivotYaroslavskiy(A, left, right) {
  if (right > left) {
    if (yield* A.greater(left, right)) {
      yield* A.swap(left, right);
    }

    const p = yield* A.get(left);
    const q = yield* A.get(right);

    A.mark(left);
    A.mark(right);

    let l = left + 1;
    let g = right - 1;
    let k = l;

    A.watch('l', () => l, 3);
    A.watch('g', () => g, 3);
    A.watch('k', () => k, 3);

    while (k <= g) {
      if ((yield* A.get(k)) < p) {
        yield* A.swap(k, l);
        ++l;
      } else if ((yield* A.get(k)) >= q) {
        while ((yield* A.get(g)) > q && k < g) --g;
        yield* A.swap(k, g);
        --g;

        if ((yield* A.get(k)) < p) {
          yield* A.swap(k, l);
          ++l;
        }
      }
      ++k;
    }
    --l;
    ++g;
    yield* A.swap(left, l);
    yield* A.swap(right, g);

    A.unmarkAll();
    A.unwatchAll();

    yield* dualPivotYaroslavskiy(A, left, l - 1);
    yield* dualPivotYaroslavskiy(A, l + 1, g - 1);
    yield* dualPivotYaroslavskiy(A, g + 1, right);
  }
}

export function* quickSortDualPivot(A) {
  yield* dualPivotYaroslavskiy(A, 0, A.size - 1);
}
