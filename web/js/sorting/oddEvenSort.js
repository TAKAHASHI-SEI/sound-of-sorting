/// Port of OddEvenSort (src/SortAlgo.cpp).
export function* oddEvenSort(A) {
  let sorted = false;

  while (!sorted) {
    sorted = true;

    for (let i = 1; i + 1 < A.size; i += 2) {
      if (yield* A.greater(i, i + 1)) {
        yield* A.swap(i, i + 1);
        sorted = false;
      }
    }

    for (let i = 0; i + 1 < A.size; i += 2) {
      if (yield* A.greater(i, i + 1)) {
        yield* A.swap(i, i + 1);
        sorted = false;
      }
    }
  }
}
