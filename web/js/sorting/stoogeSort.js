// Ports of StoogeSort and SlowSort (src/SortAlgo.cpp).

function* stoogeSortRange(A, i, j) {
  if (yield* A.greater(i, j)) {
    yield* A.swap(i, j);
  }

  if (j - i + 1 >= 3) {
    const t = Math.floor((j - i + 1) / 3);

    A.mark(i, 3);
    A.mark(j, 3);

    yield* stoogeSortRange(A, i, j - t);
    yield* stoogeSortRange(A, i + t, j);
    yield* stoogeSortRange(A, i, j - t);

    A.unmark(i);
    A.unmark(j);
  }
}

export function* stoogeSort(A) {
  if (A.size > 1) yield* stoogeSortRange(A, 0, A.size - 1);
}

function* slowSortRange(A, i, j) {
  if (i >= j) return;

  const m = Math.floor((i + j) / 2);

  yield* slowSortRange(A, i, m);
  yield* slowSortRange(A, m + 1, j);

  if (yield* A.greater(m, j)) yield* A.swap(m, j);

  A.mark(j, 2);

  yield* slowSortRange(A, i, j - 1);

  A.unmark(j);
}

export function* slowSort(A) {
  if (A.size > 1) yield* slowSortRange(A, 0, A.size - 1);
}
