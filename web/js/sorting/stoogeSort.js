// Port of StoogeSort (src/SortAlgo.cpp).

export function* stoogeSortRange(A, i, j) {
  if (yield* A.greater(i, j)) {
    yield* A.swap(i, j);
  }

  if (j - i + 1 >= 3) {
    const t = Math.floor((j - i + 1) / 3);

    yield* A.mark(i, 3);
    yield* A.mark(j, 3);

    yield* stoogeSortRange(A, i, j - t);
    yield* stoogeSortRange(A, i + t, j);
    yield* stoogeSortRange(A, i, j - t);

    yield* A.unmark(i);
    yield* A.unmark(j);
  }
}

export function* stoogeSort(A) {
  if (A.size === 0) return;
  yield* stoogeSortRange(A, 0, A.size - 1);
}
