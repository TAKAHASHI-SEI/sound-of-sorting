// Port of InsertionSort (src/SortAlgo.cpp). This keeps the original
// swap-based behavior so intermediate states remain visible during playback.

export function* insertionSort(A) {
  for (let i = 1; i < A.size; ++i) {
    const key = yield* A.get(i);
    yield* A.mark(i, 2);

    let j = i - 1;
    while (j >= 0 && (yield* A.get(j)) > key) {
      yield* A.swap(j, j + 1);
      --j;
    }

    yield* A.unmark(i);
  }
}
