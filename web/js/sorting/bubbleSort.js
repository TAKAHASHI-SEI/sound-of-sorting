/// Port of BubbleSort (src/SortAlgo.cpp).
export function* bubbleSort(A) {
  for (let i = 0; i + 1 < A.size; ++i) {
    for (let j = 0; j + 1 < A.size - i; ++j) {
      if (yield* A.greater(j, j + 1)) {
        yield* A.swap(j, j + 1);
      }
    }
  }
}
