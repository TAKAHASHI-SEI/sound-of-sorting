// Ports of BitonicSortNetwork and BatcherSortNetwork (src/SortAlgo.cpp): the
// recursion only records the swap pairs, which are then reordered into the
// sequence a parallel sorting network would use and replayed on the array.

function largestPowerOfTwoLessThan(n) {
  let k = 1;
  while (k < n) k = k << 1;
  return k >> 1;
}

function* replay(A, sequence) {
  for (const { i, j } of sequence) {
    if (yield* A.greater(i, j)) yield* A.swap(i, j);
  }
}

// *** Batcher's Bitonic Sort as a sorting network

function bitonicMerge(sequence, lo, n, dir, sortDepth, mergeDepth) {
  if (n > 1) {
    const m = largestPowerOfTwoLessThan(n);

    for (let i = lo; i < lo + n - m; i++) {
      if (dir) sequence.push({ i, j: i + m, sortDepth, mergeDepth });
      else sequence.push({ i: i + m, j: i, sortDepth, mergeDepth });
    }

    bitonicMerge(sequence, lo, m, dir, sortDepth, mergeDepth + 1);
    bitonicMerge(sequence, lo + m, n - m, dir, sortDepth, mergeDepth + 1);
  }
}

function bitonicSortRecord(sequence, lo, n, dir, sortDepth) {
  if (n > 1) {
    const m = Math.floor(n / 2);
    bitonicSortRecord(sequence, lo, m, !dir, sortDepth + 1);
    bitonicSortRecord(sequence, lo + m, n - m, dir, sortDepth + 1);
    bitonicMerge(sequence, lo, n, dir, sortDepth, 0);
  }
}

export function* bitonicSortNetwork(A) {
  const sequence = [];
  bitonicSortRecord(sequence, 0, A.size, true, 0);

  sequence.sort((a, b) => {
    if (a.sortDepth !== b.sortDepth) return b.sortDepth - a.sortDepth;
    if (a.mergeDepth !== b.mergeDepth) return a.mergeDepth - b.mergeDepth;
    return a.i - b.i;
  });

  yield* replay(A, sequence);
}

// *** Batcher's Odd-Even Merge Sort as a sorting network

/// lo is the starting position, n the length of the piece to be merged and r
/// the distance of the elements to be compared.
function oddEvenMerge(sequence, size, lo, n, r, sortDepth, mergeDepth) {
  const push = (i, j) => {
    // skip all swaps beyond end of array
    if (j >= size) return;
    sequence.push({ i, j, sortDepth, mergeDepth });
  };

  const m = r * 2;
  if (m < n) {
    // even and odd subsequences
    oddEvenMerge(sequence, size, lo, n, m, sortDepth, mergeDepth + 1);
    oddEvenMerge(sequence, size, lo + r, n, m, sortDepth, mergeDepth + 1);

    for (let i = lo + r; i + r < lo + n; i += m) push(i, i + r);
  } else {
    push(lo, lo + r);
  }
}

function oddEvenMergeSort(sequence, size, lo, n, sortDepth) {
  if (n > 1) {
    const m = Math.floor(n / 2);
    oddEvenMergeSort(sequence, size, lo, m, sortDepth + 1);
    oddEvenMergeSort(sequence, size, lo + m, m, sortDepth + 1);
    oddEvenMerge(sequence, size, lo, n, 1, sortDepth, 0);
  }
}

export function* batcherSortNetwork(A) {
  const sequence = [];

  let n = largestPowerOfTwoLessThan(A.size);
  if (n !== A.size) n *= 2;

  oddEvenMergeSort(sequence, A.size, 0, n, 0);

  sequence.sort((a, b) => {
    if (a.sortDepth !== b.sortDepth) return b.sortDepth - a.sortDepth;
    if (a.mergeDepth !== b.mergeDepth) return b.mergeDepth - a.mergeDepth;
    return a.i - b.i;
  });

  yield* replay(A, sequence);
}
