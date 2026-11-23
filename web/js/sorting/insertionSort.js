// Port of InsertionSort (src/SortAlgo.cpp). This keeps the original
// swap-based behavior so intermediate states remain visible during playback.
// The key is compared against a plain value (`A[j] > key`), which the original
// counts both as an array access and as one comparison.

export function* insertionSort(A) {
  for (let i = 1; i < A.size; ++i) {
    const key = yield* A.get(i);
    yield* A.mark(i, 2);

    let j = i - 1;
    while (j >= 0 && (yield* A.greaterValue(j, key))) {
      yield* A.swap(j, j + 1);
      --j;
    }

    yield* A.unmark(i);
  }
}
