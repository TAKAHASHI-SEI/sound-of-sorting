// Port of HeapSort (src/SortAlgo.cpp), which also tints the heap by level.

/// Port of prevPowerOfTwo (src/SortAlgo.cpp).
function prevPowerOfTwo(x) {
  x |= x >> 1;
  x |= x >> 2;
  x |= x >> 4;
  x |= x >> 8;
  x |= x >> 16;
  return x - (x >> 1);
}

/// The original colors a heap level with `log(prevPowerOfTwo(i+1))/log(2) + 4`.
/// The value is the exact level of the index, so it is computed as such here.
function heapLevelColor(index) {
  return Math.round(Math.log2(prevPowerOfTwo(index + 1))) + 4;
}

export function* heapSort(A) {
  let n = A.size;
  let i = Math.floor(n / 2);

  // The original underflows on an empty array; return instead.
  if (n === 0) return;

  // mark heap levels with different colors
  for (let j = i; j < n; ++j) {
    yield* A.mark(j, heapLevelColor(j));
  }

  while (true) {
    if (i > 0) {
      // build heap, sift A[i] down the heap
      i--;
    } else {
      // pop largest element from heap: swap front to back, and sift
      // front A[0] down the heap
      n--;
      if (n === 0) return;
      yield* A.swap(0, n);

      yield* A.mark(n);
      if (n + 1 < A.size) yield* A.unmark(n + 1);
    }

    let parent = i;
    let child = i * 2 + 1;

    // sift operation - push the value of A[i] down the heap
    while (child < n) {
      if (child + 1 < n && (yield* A.greater(child + 1, child))) {
        child++;
      }
      if (yield* A.greater(child, parent)) {
        yield* A.swap(parent, child);
        parent = child;
        child = parent * 2 + 1;
      } else {
        break;
      }
    }

    // mark heap levels with different colors
    yield* A.mark(i, heapLevelColor(i));
  }
}
