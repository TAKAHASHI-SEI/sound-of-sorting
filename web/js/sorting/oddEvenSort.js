// Port of OddEvenSort (src/SortAlgo.cpp). Odd and even passes alternate until
// no swap happened in either of them.

export function* oddEvenSort(A) {
  let sorted = false;

  while (!sorted) {
    sorted = true;

    for (let i = 1; i < A.size - 1; i += 2) {
      if (yield* A.greater(i, i + 1)) {
        yield* A.swap(i, i + 1);
        sorted = false;
      }
    }

    for (let i = 0; i < A.size - 1; i += 2) {
      if (yield* A.greater(i, i + 1)) {
        yield* A.swap(i, i + 1);
        sorted = false;
      }
    }
  }
}
