// Port of RadixSortLSD / RadixSortMSD (src/SortAlgo.cpp). Both use RADIX = 4
// and read the digits through A[i].get(), which the original counts as an array
// access. The number of digit positions is derived from the maximum value in
// the array (constant across a sort because sorting preserves the multiset).

const RADIX = 4;

/// Highest value currently in the array, read without emitting events.
/// Counterpart of SortArray::array_max().
function arrayMaxValue(A) {
  let max = 0;
  for (let i = 0; i < A.size; ++i) {
    const v = A.direct(i);
    if (v > max) max = v;
  }
  return max;
}

/// `value / base % RADIX` with C++ unsigned integer division semantics.
function digit(value, base) {
  return Math.floor(value / base) % RADIX;
}

/// Port of RadixSortLSD: out-of-place redistribute, least significant digit
/// first, stable.
export function* radixSortLSD(A) {
  const n = A.size;
  if (n === 0) return;

  const max = arrayMaxValue(A);
  const pmax = Math.ceil(Math.log(max + 1) / Math.log(RADIX));

  for (let p = 0; p < pmax; ++p) {
    const base = Math.pow(RADIX, p);

    // count digits and copy data
    const count = new Array(RADIX).fill(0);
    const copy = new Array(n);
    for (let i = 0; i < n; ++i) {
      const v = yield* A.get(i);
      copy[i] = v;
      count[digit(v, base)]++;
    }

    // exclusive prefix sum
    const bkt = new Array(RADIX + 1).fill(0);
    for (let i = 0; i < RADIX; ++i) bkt[i + 1] = bkt[i] + count[i];

    // mark bucket boundaries
    for (let i = 0; i < RADIX; ++i) {
      if (bkt[i] >= n) continue;
      yield* A.mark(bkt[i], 3);
    }

    // redistribute items back into array (stable)
    for (let i = 0; i < n; ++i) {
      const r = digit(copy[i], base);
      yield* A.set(bkt[r], copy[i]);
      bkt[r]++;
    }

    yield* A.unmarkAll();
  }
}

function* radixSortMSDRange(A, lo, hi, depth, pmax) {
  yield* A.mark(lo, 2);
  yield* A.mark(hi - 1, 2);

  const base = Math.pow(RADIX, pmax - depth);

  // count digits
  const count = new Array(RADIX).fill(0);
  for (let i = lo; i < hi; ++i) {
    count[digit(yield* A.get(i), base)]++;
  }

  // inclusive prefix sum
  const bkt = new Array(RADIX).fill(0);
  let acc = 0;
  for (let i = 0; i < RADIX; ++i) {
    acc += count[i];
    bkt[i] = acc;
  }

  // mark bucket boundaries
  for (let i = 0; i < RADIX; ++i) {
    if (bkt[i] === 0) continue;
    yield* A.mark(lo + bkt[i] - 1, 3);
  }

  // reorder items in-place by walking cycles
  for (let i = 0; i < hi - lo; ) {
    for (;;) {
      const r = digit(yield* A.get(lo + i), base);
      bkt[r]--;
      const j = bkt[r];
      if (j > i) {
        yield* A.swap(lo + i, lo + j);
      } else {
        break;
      }
    }
    i += count[digit(yield* A.get(lo + i), base)];
  }

  yield* A.unmarkAll();

  // no more depth to sort?
  if (depth + 1 > pmax) return;

  // recurse on buckets
  let sum = lo;
  for (let i = 0; i < RADIX; ++i) {
    if (count[i] > 1) {
      yield* radixSortMSDRange(A, sum, sum + count[i], depth + 1, pmax);
    }
    sum += count[i];
  }
}

/// Port of RadixSortMSD: in-place redistribution, most significant digit first.
export function* radixSortMSD(A) {
  if (A.size === 0) return;

  const max = arrayMaxValue(A);
  const pmax = Math.floor(Math.log(max + 1) / Math.log(RADIX));

  yield* radixSortMSDRange(A, 0, A.size, 0, pmax);
}
