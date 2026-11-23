// Port of QuickSortTernaryLR (src/SortAlgo.cpp): ternary-split variant adapted
// from the multikey quicksort by Bentley & Sedgewick. Partitions "=<?>=" using
// two pairs of pointers at left and right, then copies the "=" to the middle.
// `lo` and `hi` are inclusive.

import { DEFAULT_QUICK_SORT_PIVOT, selectPivot } from './quickSortPivot.js';

/// Partitions [lo, hi] and returns the [numLess, numGreater] split sizes.
function* partitionTernaryLR(A, lo, hi, pivotType) {
  // pick pivot and swap to back
  const piv = yield* selectPivot(A, lo, hi + 1, pivotType);
  yield* A.swap(piv, hi);
  yield* A.mark(hi);

  const pivot = yield* A.get(hi);

  // schema: |p === |i <<< | ??? |j >>> |q === |piv
  let i = lo;
  let j = hi - 1;
  let p = lo;
  let q = hi - 1;

  yield* A.watch(i, 3);
  yield* A.watch(j, 3);

  for (;;) {
    // partition on left
    let cmp;
    while (i <= j && (cmp = yield* A.compareValue(i, pivot)) <= 0) {
      if (cmp === 0) {
        yield* A.mark(p, 4);
        yield* A.swap(i, p++);
      }
      ++i;
      yield* A.watch(i, 3);
    }

    // partition on right
    while (i <= j && (cmp = yield* A.compareValue(j, pivot)) >= 0) {
      if (cmp === 0) {
        yield* A.mark(q, 4);
        yield* A.swap(j, q--);
      }
      --j;
      yield* A.watch(j, 3);
    }

    if (i > j) break;

    // swap item between < > regions
    yield* A.swap(i++, j--);
    yield* A.watch(i, 3);
    yield* A.watch(j, 3);
  }

  // swap pivot to right place
  yield* A.swap(i, hi);
  yield* A.markSwap(i, hi);

  const numLess = i - p;
  const numGreater = q - j;

  // swap equal ranges into center, but avoid swapping equal elements
  j = i - 1;
  i = i + 1;

  const pe = lo + Math.min(p - lo, numLess);
  for (let k = lo; k < pe; k++, j--) {
    yield* A.swap(k, j);
    yield* A.markSwap(k, j);
  }

  const qe = hi - 1 - Math.min(hi - 1 - q, numGreater - 1); // one already greater at end
  for (let k = hi - 1; k > qe; k--, i++) {
    yield* A.swap(i, k);
    yield* A.markSwap(i, k);
  }

  yield* A.unwatchAll();
  yield* A.unmarkAll();

  return [numLess, numGreater];
}

export function* quickSortTernaryLR(A, options = {}) {
  const pivotType = options.quicksortPivot ?? DEFAULT_QUICK_SORT_PIVOT;

  // Explicit stack instead of the original's recursion: same subarray order,
  // flat generator delegation depth.
  const stack = [[0, A.size - 1]];

  while (stack.length > 0) {
    const [lo, hi] = stack.pop();
    if (hi <= lo) continue;

    const [numLess, numGreater] = yield* partitionTernaryLR(A, lo, hi, pivotType);

    stack.push([hi - numGreater + 1, hi]);
    stack.push([lo, lo + numLess - 1]);
  }
}
