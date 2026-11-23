// Port of QuickSortLR (src/SortAlgo.cpp): Hoare's scheme with pointers at left
// and right. The original watches the pivot and both pointers, so the watch
// events that keep those indexes highlighted are emitted here as well.

import { DEFAULT_QUICK_SORT_PIVOT, selectPivot } from './quickSortPivot.js';

/// Partitions [lo, hi] (both inclusive) and returns the resulting [i, j].
function* partitionLR(A, lo, hi, pivotType) {
  // pick pivot and watch
  let p = yield* selectPivot(A, lo, hi + 1, pivotType);

  const pivot = yield* A.get(p);
  yield* A.watch(p, 2);

  let i = lo;
  let j = hi;
  yield* A.watch(i, 3);
  yield* A.watch(j, 3);

  while (i <= j) {
    while (yield* A.lessValue(i, pivot)) {
      i++;
      yield* A.watch(i, 3);
    }

    while (yield* A.greaterValue(j, pivot)) {
      j--;
      yield* A.watch(j, 3);
    }

    if (i <= j) {
      yield* A.swap(i, j);

      // follow pivot if it is swapped
      if (p === i) {
        p = j;
        yield* A.watch(p, 2);
      } else if (p === j) {
        p = i;
        yield* A.watch(p, 2);
      }

      i++;
      j--;
      yield* A.watch(i, 3);
      yield* A.watch(j, 3);
    }
  }

  yield* A.unwatchAll();

  return [i, j];
}

export function* quickSortLR(A, options = {}) {
  const pivotType = options.quicksortPivot ?? DEFAULT_QUICK_SORT_PIVOT;

  // The original reads A[0] on an empty array; return instead.
  if (A.size === 0) return;

  // The original recurses on [lo, j] first and then on [i, hi]. An explicit
  // stack visits the subarrays in exactly the same order, but keeps the
  // generator delegation depth flat, which the deep recursion of a bad pivot
  // would otherwise blow up.
  const stack = [[0, A.size - 1]];

  while (stack.length > 0) {
    const [lo, hi] = stack.pop();
    const [i, j] = yield* partitionLR(A, lo, hi, pivotType);

    if (i < hi) stack.push([i, hi]);
    if (lo < j) stack.push([lo, j]);
  }
}
