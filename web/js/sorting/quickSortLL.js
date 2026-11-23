// Port of QuickSortLL / PartitionLL (src/SortAlgo.cpp), the CLRS 3rd edition
// variant with two pointers on the left. `hi` is exclusive.

import { DEFAULT_QUICK_SORT_PIVOT, selectPivot } from './quickSortPivot.js';

function* partitionLL(A, lo, hi, pivotType) {
  // pick pivot and move to back
  const p = yield* selectPivot(A, lo, hi, pivotType);

  const pivot = yield* A.get(p);
  yield* A.swap(p, hi - 1);
  yield* A.mark(hi - 1);

  let i = lo;
  yield* A.watch(i, 3);

  for (let j = lo; j < hi - 1; ++j) {
    if (yield* A.lessOrEqualValue(j, pivot)) {
      yield* A.swap(i, j);
      ++i;
      yield* A.watch(i, 3);
    }
  }

  yield* A.swap(i, hi - 1);
  yield* A.unmark(hi - 1);
  yield* A.unwatchAll();

  return i;
}

export function* quickSortLL(A, options = {}) {
  const pivotType = options.quicksortPivot ?? DEFAULT_QUICK_SORT_PIVOT;

  // Explicit stack instead of the original's recursion: same subarray order,
  // flat generator delegation depth.
  const stack = [[0, A.size]];

  while (stack.length > 0) {
    const [lo, hi] = stack.pop();

    if (lo + 1 < hi) {
      const mid = yield* partitionLL(A, lo, hi, pivotType);

      stack.push([mid + 1, hi]);
      stack.push([lo, mid]);
    }
  }
}
