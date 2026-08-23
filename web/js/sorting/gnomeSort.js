/// Port of GnomeSort (src/SortAlgo.cpp).
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
