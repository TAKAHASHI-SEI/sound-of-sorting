// Port of BatcherSortNetwork (src/SortAlgo.cpp), Batcher's odd-even merge sort
// as a "parallel" sorting network. Like the bitonic network it records the
// generated compare-swap sequence, sorts it into network execution order and
// then replays it.

import { replayNetwork } from './bitonicSortNetwork.js';

function largestPowerOfTwoLessThan(n) {
  let k = 1;
  while (k < n) k <<= 1;
  return k >> 1;
}

/// Port of compare(): skip all swaps beyond the end of the array.
function pushCompare(seq, size, i, j, sortDepth, mergeDepth) {
  if (j >= size) return;
  seq.push([i, j, sortDepth, mergeDepth]);
}

/// lo is the starting position, n the length of the piece to merge and r the
/// distance of the elements to be compared.
function recordOddEvenMerge(seq, size, lo, n, r, sortDepth, mergeDepth) {
  const m = r * 2;
  if (m < n) {
    // even subsequence
    recordOddEvenMerge(seq, size, lo, n, m, sortDepth, mergeDepth + 1);
    // odd subsequence
    recordOddEvenMerge(seq, size, lo + r, n, m, sortDepth, mergeDepth + 1);

    for (let i = lo + r; i + r < lo + n; i += m) {
      pushCompare(seq, size, i, i + r, sortDepth, mergeDepth);
    }
  } else {
    pushCompare(seq, size, lo, lo + r, sortDepth, mergeDepth);
  }
}

function recordOddEvenMergeSort(seq, size, lo, n, sortDepth) {
  if (n > 1) {
    const m = n >> 1;
    recordOddEvenMergeSort(seq, size, lo, m, sortDepth + 1);
    recordOddEvenMergeSort(seq, size, lo + m, m, sortDepth + 1);
    recordOddEvenMerge(seq, size, lo, n, 1, sortDepth, 0);
  }
}

export function* batcherSortNetwork(A) {
  const seq = [];

  let n = largestPowerOfTwoLessThan(A.size);
  if (n !== A.size) n *= 2;

  recordOddEvenMergeSort(seq, A.size, 0, n, 0);
  seq.sort((a, b) =>
    a[2] !== b[2] ? b[2] - a[2] // sort_depth descending
      : a[3] !== b[3] ? b[3] - a[3] // merge_depth descending
        : a[0] - b[0]); // i ascending

  yield* replayNetwork(A, seq);
}
