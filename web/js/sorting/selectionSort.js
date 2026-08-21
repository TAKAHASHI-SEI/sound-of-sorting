/// Port of SelectionSort (src/SortAlgo.cpp).
export function* selectionSort(A) {
  let jMin = 0;
  A.watch('jMin', () => jMin, 3);

  for (let i = 0; i + 1 < A.size; ++i) {
    jMin = i;

    for (let j = i + 1; j < A.size; ++j) {
      if (yield* A.less(j, jMin)) {
        A.markSwap(j, jMin);
        jMin = j;
      }
    }

    yield* A.swap(i, jMin);

    // mark the last good element
    if (i > 0) A.unmark(i - 1);
    A.mark(i);
  }

  A.unwatchAll();
}
