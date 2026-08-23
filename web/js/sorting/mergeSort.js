/// Port of Merge (src/SortAlgo.cpp): out-of-place merge into a shadow array
/// which is copied back afterwards.
function* merge(A, lo, mid, hi) {
  A.mark(lo);
  A.mark(mid, 3);
  A.mark(hi - 1);

  const out = new Array(hi - lo);
  let i = lo;
  let j = mid;
  let o = 0;

  while (i < mid && j < hi) {
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

  while (i < mid) {
    out[o++] = yield* A.get(i);
    ++i;
  }
  while (j < hi) {
    out[o++] = yield* A.get(j);
    ++j;
  }

  A.unmark(mid);

  for (let k = 0; k < hi - lo; ++k) yield* A.set(lo + k, out[k]);

  A.unmark(lo);
  A.unmark(hi - 1);
}

function* mergeSortRange(A, lo, hi) {
  if (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    yield* mergeSortRange(A, lo, mid);
    yield* mergeSortRange(A, mid, hi);
    yield* merge(A, lo, mid, hi);
  }
}

export function* mergeSort(A) {
  yield* mergeSortRange(A, 0, A.size);
}

/// Port of MergeSortIterative: merges subarrays of powers of two.
export function* mergeSortIterative(A) {
  for (let s = 1; s < A.size; s *= 2) {
    for (let i = 0; i + s < A.size; i += 2 * s) {
      yield* merge(A, i, i + s, Math.min(i + 2 * s, A.size));
    }
  }
}
