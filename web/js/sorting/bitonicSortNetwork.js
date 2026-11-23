// Port of BitonicSortNetwork (src/SortAlgo.cpp). The original first records the
// recursively generated compare-swap sequence, sorts it back into the order a
// parallel sorting network would execute it, and then replays it on the array.

function largestPowerOfTwoLessThan(n) {
  let k = 1;
  while (k < n) k <<= 1;
  return k >> 1;
}

function recordBitonicMerge(seq, lo, n, dir, sortDepth, mergeDepth) {
  if (n > 1) {
    const m = largestPowerOfTwoLessThan(n);

    for (let i = lo; i < lo + n - m; ++i) {
      seq.push(dir ? [i, i + m, sortDepth, mergeDepth]
        : [i + m, i, sortDepth, mergeDepth]);
    }

    recordBitonicMerge(seq, lo, m, dir, sortDepth, mergeDepth + 1);
    recordBitonicMerge(seq, lo + m, n - m, dir, sortDepth, mergeDepth + 1);
  }
}

function recordBitonicSort(seq, lo, n, dir, sortDepth) {
  if (n > 1) {
    const m = n >> 1;
    recordBitonicSort(seq, lo, m, !dir, sortDepth + 1);
    recordBitonicSort(seq, lo + m, n - m, dir, sortDepth + 1);
    recordBitonicMerge(seq, lo, n, dir, sortDepth, 0);
  }
}

/// Port of replay(): perform each recorded comparison, swapping on inversion.
export function* replayNetwork(A, seq) {
  for (const [i, j] of seq) {
    if (yield* A.greater(i, j)) {
      yield* A.swap(i, j);
    }
  }
}

export function* bitonicSortNetwork(A) {
  const seq = [];
  recordBitonicSort(seq, 0, A.size, true, 0);
  seq.sort((a, b) =>
    a[2] !== b[2] ? b[2] - a[2] // sort_depth descending
      : a[3] !== b[3] ? a[3] - b[3] // merge_depth ascending
        : a[0] - b[0]); // i ascending
  yield* replayNetwork(A, seq);
}
