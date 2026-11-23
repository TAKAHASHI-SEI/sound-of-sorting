// Port of SelectionSort (src/SortAlgo.cpp). The original watches the current
// minimum index and swaps its mark color when a new minimum is found.

export function* selectionSort(A) {
  let jMin = 0;
  yield* A.watch(jMin, 3);

  for (let i = 0; i + 1 < A.size; ++i) {
    jMin = i;
    yield* A.watch(jMin, 3);

    for (let j = i + 1; j < A.size; ++j) {
      if (yield* A.less(j, jMin)) {
        yield* A.markSwap(j, jMin);
        jMin = j;
        yield* A.watch(jMin, 3);
      }
    }

    yield* A.swap(i, jMin);

    // mark the last good element
    if (i > 0) yield* A.unmark(i - 1);
    yield* A.mark(i);
  }

  yield* A.unwatchAll();
}
