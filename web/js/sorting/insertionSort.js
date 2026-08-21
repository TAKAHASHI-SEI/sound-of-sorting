/// Port of InsertionSort (src/SortAlgo.cpp): swaps every time, so all values
/// stay visible.
export function* insertionSort(A) {
  for (let i = 1; i < A.size; ++i) {
    const key = yield* A.get(i);
    A.mark(i);

    let j = i - 1;
    while (j >= 0 && (yield* A.get(j)) > key) {
      yield* A.swap(j, j + 1);
      --j;
    }

    A.unmark(i);
  }
}

/// Port of BinaryInsertionSort (src/SortAlgo.cpp).
export function* binaryInsertionSort(A) {
  for (let i = 1; i < A.size; ++i) {
    const key = yield* A.get(i);
    A.mark(i);

    let lo = 0;
    let hi = i;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (key <= (yield* A.get(mid))) hi = mid;
      else lo = mid + 1;
    }

    // item has to go into position lo
    let j = i - 1;
    while (j >= lo) {
      yield* A.swap(j, j + 1);
      --j;
    }

    A.unmark(i);
  }
}
