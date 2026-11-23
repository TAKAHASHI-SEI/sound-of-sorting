// Port of SlowSort (src/SortAlgo.cpp).

export function* slowSortRange(A, i, j) {
  if (i >= j) return;

  const m = Math.floor((i + j) / 2);

  yield* slowSortRange(A, i, m);
  yield* slowSortRange(A, m + 1, j);

  if (yield* A.greater(m, j)) {
    yield* A.swap(m, j);
  }

  yield* A.mark(j, 2);

  yield* slowSortRange(A, i, j - 1);

  yield* A.unmark(j);
}

export function* slowSort(A) {
  if (A.size === 0) return;
  yield* slowSortRange(A, 0, A.size - 1);
}
