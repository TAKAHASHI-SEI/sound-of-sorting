// Ports of RadixSortMSD and RadixSortLSD (src/SortAlgo.cpp).

const RADIX = 4;

/// In-place MSD radix sort, permuting items by walking cycles.
function* radixSortMSDRange(A, lo, hi, depth) {
  A.mark(lo);
  A.mark(hi - 1);

  const pmax = Math.floor(Math.log(A.arrayMax + 1) / Math.log(RADIX));
  const base = RADIX ** (pmax - depth);
  const digit = (value) => Math.floor(value / base) % RADIX;

  // count digits
  const count = new Array(RADIX).fill(0);
  for (let i = lo; i < hi; ++i) {
    count[digit(yield* A.get(i))]++;
  }

  // inclusive prefix sum
  const bkt = new Array(RADIX).fill(0);
  for (let i = 0, sum = 0; i < RADIX; ++i) {
    sum += count[i];
    bkt[i] = sum;
  }

  // mark bucket boundaries
  for (let i = 0; i < bkt.length; ++i) {
    if (bkt[i] === 0) continue;
    A.mark(lo + bkt[i] - 1, 3);
  }

  // reorder items in-place by walking cycles
  for (let i = 0, j; i < hi - lo; ) {
    while ((j = --bkt[digit(yield* A.get(lo + i))]) > i) {
      yield* A.swap(lo + i, lo + j);
    }
    i += count[digit(yield* A.get(lo + i))];
  }

  A.unmarkAll();

  // no more depth to sort?
  if (depth + 1 > pmax) return;

  // recurse on buckets
  let sum = lo;
  for (let i = 0; i < RADIX; ++i) {
    if (count[i] > 1) yield* radixSortMSDRange(A, sum, sum + count[i], depth + 1);
    sum += count[i];
  }
}

export function* radixSortMSD(A) {
  yield* radixSortMSDRange(A, 0, A.size, 0);
}

/// LSD radix sort, copying items into a shadow array while counting.
export function* radixSortLSD(A) {
  const pmax = Math.ceil(Math.log(A.arrayMax + 1) / Math.log(RADIX));

  for (let p = 0; p < pmax; ++p) {
    const base = RADIX ** p;
    const digit = (value) => Math.floor(value / base) % RADIX;

    // count digits and copy data
    const count = new Array(RADIX).fill(0);
    const copy = new Array(A.size);

    for (let i = 0; i < A.size; ++i) {
      copy[i] = yield* A.get(i);
      count[digit(copy[i])]++;
    }

    // exclusive prefix sum
    const bkt = new Array(RADIX + 1).fill(0);
    for (let i = 0; i < RADIX; ++i) bkt[i + 1] = bkt[i] + count[i];

    // mark bucket boundaries
    for (let i = 0; i < bkt.length - 1; ++i) {
      if (bkt[i] >= A.size) continue;
      A.mark(bkt[i], 3);
    }

    // redistribute items back into array (stable)
    for (let i = 0; i < A.size; ++i) {
      yield* A.set(bkt[digit(copy[i])]++, copy[i]);
    }

    A.unmarkAll();
  }
}
