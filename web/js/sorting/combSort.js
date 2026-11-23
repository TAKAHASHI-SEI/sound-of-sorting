// Port of CombSort (src/SortAlgo.cpp). The original truncates the gap towards
// zero after each pass (`(size_t)((float)gap / shrink)`).

export function* combSort(A) {
  const shrink = 1.3;

  let swapped = false;
  let gap = A.size;

  while (gap > 1 || swapped) {
    if (gap > 1) {
      gap = Math.trunc(gap / shrink);
    }

    swapped = false;

    for (let i = 0; gap + i < A.size; ++i) {
      if (yield* A.greater(i, i + gap)) {
        yield* A.swap(i, i + gap);
        swapped = true;
      }
    }
  }
}
