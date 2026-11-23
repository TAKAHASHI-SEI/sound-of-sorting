// Port of GnomeSort (src/SortAlgo.cpp). The original tests `A[i] >= A[i-1]`,
// which is one comparison and two accesses, so it is written as the negation of
// `A.less(i, i - 1)`.

export function* gnomeSort(A) {
  for (let i = 1; i < A.size; ) {
    if (!(yield* A.less(i, i - 1))) {
      ++i;
    } else {
      yield* A.swap(i, i - 1);
      if (i > 1) --i;
    }
  }
}
