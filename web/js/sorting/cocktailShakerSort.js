// Port of CocktailShakerSort (src/SortAlgo.cpp). The original tracks the last
// swap position in `mov` and shrinks the unsorted range [lo, hi] with it.

export function* cocktailShakerSort(A) {
  let lo = 0;
  let hi = A.size - 1;
  let mov = lo;

  while (lo < hi) {
    for (let i = hi; i > lo; --i) {
      if (yield* A.greater(i - 1, i)) {
        yield* A.swap(i - 1, i);
        mov = i;
      }
    }

    lo = mov;

    for (let i = lo; i < hi; ++i) {
      if (yield* A.greater(i, i + 1)) {
        yield* A.swap(i, i + 1);
        mov = i;
      }
    }

    hi = mov;
  }
}
