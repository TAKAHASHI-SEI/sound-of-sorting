// Port of QuickSortTernaryLL / PartitionTernaryLL (src/SortAlgo.cpp):
// ternary-split variant partitioning "<>?=" with two pointers at left and one
// at right, then copying the "=" to the middle. `hi` is exclusive.

import { DEFAULT_QUICK_SORT_PIVOT, selectPivot } from './quickSortPivot.js';

/// Partitions [lo, hi) and returns the [first, second] split point.
function* partitionTernaryLL(A, lo, hi, pivotType) {
  // pick pivot and swap to back
  const p = yield* selectPivot(A, lo, hi, pivotType);

  const pivot = yield* A.get(p);
  yield* A.swap(p, hi - 1);
  yield* A.mark(hi - 1);

  let i = lo;
  let k = hi - 1;
  yield* A.watch(i, 3);

  for (let j = lo; j < k; ++j) {
    const cmp = yield* A.compareValue(j, pivot); // ternary comparison
    if (cmp === 0) {
      yield* A.swap(--k, j);
      --j; // reclassify A[j]
      yield* A.mark(k, 4);
    } else if (cmp < 0) {
      yield* A.swap(i++, j);
      yield* A.watch(i, 3);
    }
  }

  // unwatch i, because the pivot is swapped there in the first step of the
  // following swap loop.
  yield* A.unwatchAll();

  const j = i + (hi - k);

  for (let s = 0; s < hi - k; ++s) {
    yield* A.swap(i + s, hi - 1 - s);
    yield* A.markSwap(i + s, hi - 1 - s);
  }
  yield* A.unmarkAll();

  return [i, j];
}

export function* quickSortTernaryLL(A, options = {}) {
  const pivotType = options.quicksortPivot ?? DEFAULT_QUICK_SORT_PIVOT;

  // Explicit stack instead of the original's recursion: same subarray order,
  // flat generator delegation depth.
  const stack = [[0, A.size]];

  while (stack.length > 0) {
    const [lo, hi] = stack.pop();

    if (lo + 1 < hi) {
      const [midFirst, midSecond] = yield* partitionTernaryLL(A, lo, hi, pivotType);

      stack.push([midSecond, hi]);
      stack.push([lo, midFirst]);
    }
  }
}
