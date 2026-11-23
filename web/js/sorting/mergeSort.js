// Port of MergeSort and MergeSortIterative (src/SortAlgo.cpp). Both share the
// out-of-place Merge helper, which copies the merged run into a shadow array
// and writes it back. The recursive variant delegates O(log n) deep, so the
// generator recursion is fine (unlike Quick Sort).

/// Port of Merge(A, lo, mid, hi). `hi` is exclusive.
export function* mergeRuns(A, lo, mid, hi) {
  // mark merge boundaries
  yield* A.mark(lo, 2);
  yield* A.mark(mid, 3);
  yield* A.mark(hi - 1, 2);

  const out = new Array(hi - lo);
  let i = lo;
  let j = mid;
  let o = 0; // first and second halves

  while (i < mid && j < hi) {
    // copy out for fewer time steps: both sides are read, then one is taken
    const ai = yield* A.get(i);
    const aj = yield* A.get(j);
    if (ai < aj) {
      out[o++] = ai;
      ++i;
    } else {
      out[o++] = aj;
      ++j;
    }
  }

  // copy rest
  while (i < mid) out[o++] = yield* A.get(i++);
  while (j < hi) out[o++] = yield* A.get(j++);

  yield* A.unmark(mid);

  // copy back
  for (i = 0; i < hi - lo; ++i) {
    yield* A.set(lo + i, out[i]);
  }

  yield* A.unmark(lo);
  yield* A.unmark(hi - 1);
}

function* mergeSortRange(A, lo, hi) {
  if (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;

    yield* mergeSortRange(A, lo, mid);
    yield* mergeSortRange(A, mid, hi);

    yield* mergeRuns(A, lo, mid, hi);
  }
}

export function* mergeSort(A) {
  yield* mergeSortRange(A, 0, A.size);
}

export function* mergeSortIterative(A) {
  const n = A.size;
  for (let s = 1; s < n; s *= 2) {
    for (let i = 0; i + s < n; i += 2 * s) {
      yield* mergeRuns(A, i, i + s, Math.min(i + 2 * s, n));
    }
  }
}
