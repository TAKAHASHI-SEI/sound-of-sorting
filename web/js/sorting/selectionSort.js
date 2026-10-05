// Port of SelectionSort (src/SortAlgo.cpp), adapted to the current Web event
// model. The original also watches the current minimum index; here we use a
// temporary mark color until watch-specific rendering is implemented.

export function* selectionSort(A) {
  for (let i = 0; i + 1 < A.size; ++i) {
    let minIndex = i;
    yield* A.mark(minIndex, 3);

    for (let j = i + 1; j < A.size; ++j) {
      if (yield* A.less(j, minIndex)) {
        if (minIndex !== i) yield* A.unmark(minIndex);
        minIndex = j;
        yield* A.mark(minIndex, 3);
      }
    }

    if (minIndex !== i) {
      yield* A.swap(i, minIndex);
      yield* A.unmark(minIndex);
    }

    yield* A.mark(i, 2);
  }

  yield* A.mark(A.size - 1, 2);
}
