/// Port of HeapSort (src/SortAlgo.cpp).

function prevPowerOfTwo(x) {
  let v = x;
  v |= v >> 1;
  v |= v >> 2;
  v |= v >> 4;
  v |= v >> 8;
  v |= v >> 16;
  return v - (v >> 1);
}

/// Heap level color, as the original marks the levels differently.
function levelColor(i) {
  return Math.floor(Math.log2(prevPowerOfTwo(i + 1))) + 4;
}

export function* heapSort(A) {
  let n = A.size;
  let i = Math.floor(n / 2);

  for (let j = i; j < n; ++j) A.mark(j, levelColor(j));

  for (;;) {
    if (i > 0) {
      // build heap, sift A[i] down the heap
      i--;
    } else {
      // pop largest element from heap: swap front to back, and sift front
      // A[0] down the heap
      n--;
      if (n === 0) return;
      yield* A.swap(0, n);

      A.mark(n);
      if (n + 1 < A.size) A.unmark(n + 1);
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

    A.mark(i, levelColor(i));
  }
}
