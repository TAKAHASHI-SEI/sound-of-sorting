// Port of SmoothSort (src/SortAlgo.cpp). Uses Leonardo heaps; the heap string
// is encoded as a bitmap "p" plus shift "pshift" as in the original.

const LP = [
  1, 1, 3, 5, 9, 15, 25, 41, 67, 109,
  177, 287, 465, 753, 1219, 1973, 3193, 5167, 8361, 13529, 21891,
  35421, 57313, 92735, 150049, 242785, 392835, 635621, 1028457,
  1664079, 2692537, 4356617, 7049155, 11405773, 18454929, 29860703,
  48315633, 78176337, 126491971, 204668309, 331160281, 535828591,
  866988873,
];

/// Port of __builtin_ctz: number of trailing zero bits.
function countTrailingZeros(x) {
  if (x === 0) return 32;
  let n = 0;
  while ((x & 1) === 0) {
    x >>= 1;
    n++;
  }
  return n;
}

/// Port of sift(A, pshift, head). `val.cmp(A[x])` is a comparison against a
/// plain value; `A.set(head, A[x])` reads x and writes head.
function* sift(A, pshift, head) {
  const val = yield* A.get(head);

  while (pshift > 1) {
    const rt = head - 1;
    const lf = head - 1 - LP[pshift - 2];

    // val.cmp(A[lf]) >= 0 && val.cmp(A[rt]) >= 0, i.e. both children <= val
    if ((yield* A.compareValue(lf, val)) <= 0 && (yield* A.compareValue(rt, val)) <= 0) {
      break;
    }

    let child;
    if ((yield* A.compare(lf, rt)) >= 0) {
      child = yield* A.get(lf);
      yield* A.set(head, child);
      head = lf;
      pshift -= 1;
    } else {
      child = yield* A.get(rt);
      yield* A.set(head, child);
      head = rt;
      pshift -= 2;
    }
  }

  yield* A.set(head, val);
}

/// Port of trinkle(A, p, pshift, head, isTrusty).
function* trinkle(A, p, pshift, head, isTrusty) {
  const val = yield* A.get(head);

  while (p !== 1) {
    const stepson = head - LP[pshift];

    if ((yield* A.compareValue(stepson, val)) <= 0) {
      break; // current node is greater than head. sift.
    }

    if (!isTrusty && pshift > 1) {
      const rt = head - 1;
      const lf = head - 1 - LP[pshift - 2];
      if ((yield* A.compare(rt, stepson)) >= 0 || (yield* A.compare(lf, stepson)) >= 0) {
        break;
      }
    }

    const moved = yield* A.get(stepson);
    yield* A.set(head, moved);

    head = stepson;
    const trail = countTrailingZeros(p & ~1);
    p >>= trail;
    pshift += trail;
    isTrusty = false;
  }

  if (!isTrusty) {
    yield* A.set(head, val);
    yield* sift(A, pshift, head);
  }
}

function* smoothSortRange(A, lo, hi) {
  let head = lo;

  let p = 1; // the bitmap of the current standard concatenation >> pshift
  let pshift = 1;

  while (head < hi) {
    if ((p & 3) === 3) {
      // merge the first two blocks into a larger one
      yield* sift(A, pshift, head);
      p >>= 2;
      pshift += 2;
    } else {
      // adding a new block of length 1
      if (LP[pshift - 1] >= hi - head) {
        // this block is its final size
        yield* trinkle(A, p, pshift, head, false);
      } else {
        // this block will get merged. Just make it trusty.
        yield* sift(A, pshift, head);
      }

      if (pshift === 1) {
        // LP[1] is being used, so we add use LP[0]
        p <<= 1;
        pshift--;
      } else {
        // shift out to position 1, add LP[1]
        p <<= pshift - 1;
        pshift = 1;
      }
    }
    p |= 1;
    head++;
  }

  yield* trinkle(A, p, pshift, head, false);

  while (pshift !== 1 || p !== 1) {
    if (pshift <= 1) {
      // block of length 1. No fiddling needed
      const trail = countTrailingZeros(p & ~1);
      p >>= trail;
      pshift += trail;
    } else {
      p <<= 2;
      p ^= 7;
      pshift -= 2;

      // This block gets broken into three bits. The rightmost bit is a block
      // of length 1. The left hand part is split into two, a block of length
      // LP[pshift+1] and one of LP[pshift]. Both are heapified, but the root
      // nodes are not necessarily in order, so we semitrinkle both.
      yield* trinkle(A, p >> 1, pshift + 1, head - LP[pshift] - 1, true);
      yield* trinkle(A, p, pshift, head - 1, true);
    }

    head--;
  }
}

export function* smoothSort(A) {
  if (A.size === 0) return;
  yield* smoothSortRange(A, 0, A.size - 1);
}
