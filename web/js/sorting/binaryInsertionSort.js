// Port of BinaryInsertionSort (src/SortAlgo.cpp). Like InsertionSort it swaps
// every time so intermediate states stay visible, but the insert position is
// found with a binary search. `key <= A[mid]` counts as one access plus one
// comparison, hence greaterOrEqualValue.

export function* binaryInsertionSort(A) {
  for (let i = 1; i < A.size; ++i) {
    const key = yield* A.get(i);
    yield* A.mark(i, 2);

    let lo = 0;
    let hi = i;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (yield* A.greaterOrEqualValue(mid, key)) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }

    // item has to go into position lo
    let j = i - 1;
    while (j >= lo) {
      yield* A.swap(j, j + 1);
      --j;
    }

    yield* A.unmark(i);
  }
}
