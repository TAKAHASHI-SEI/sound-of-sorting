/// Port of SmoothSort (src/SortAlgo.cpp), based on the Wikipedia version.

/// Leonardo numbers.
const LP = [
  1, 1, 3, 5, 9, 15, 25, 41, 67, 109,
  177, 287, 465, 753, 1219, 1973, 3193, 5167, 8361, 13529, 21891,
  35421, 57313, 92735, 150049, 242785, 392835, 635621, 1028457,
  1664079, 2692537, 4356617, 7049155, 11405773, 18454929, 29860703,
  48315633, 78176337, 126491971, 204668309, 331160281, 535828591,
  866988873,
];

/// Number of trailing zero bits, i.e. __builtin_ctz.
function ctz(x) {
  if (x === 0) return 32;
  let n = 0;
  let v = x;
  while ((v & 1) === 0) {
    v >>= 1;
    ++n;
  }
  return n;
}

function* sift(A, pshift, head) {
  // Floyd's improvements are not used here: unlike heapsort this does not
  // always move nodes from near the bottom of the tree to the root.
  const val = yield* A.get(head);
  let shift = pshift;
  let node = head;

  while (shift > 1) {
    const rt = node - 1;
    const lf = node - 1 - LP[shift - 2];

    if (val >= (yield* A.get(lf)) && val >= (yield* A.get(rt))) break;

    if ((yield* A.get(lf)) >= (yield* A.get(rt))) {
      yield* A.set(node, yield* A.get(lf));
      node = lf;
      shift -= 1;
    } else {
      yield* A.set(node, yield* A.get(rt));
      node = rt;
      shift -= 2;
    }
  }

  yield* A.set(node, val);
}

function* trinkle(A, p0, pshift0, head0, isTrusty0) {
  const val = yield* A.get(head0);
  let p = p0;
  let pshift = pshift0;
  let head = head0;
  let isTrusty = isTrusty0;

  while (p !== 1) {
    const stepson = head - LP[pshift];

    if ((yield* A.get(stepson)) <= val) break; // current node is greater, sift

    // no need to check this if we know the current node is trusty, because we
    // just checked the head (which is val, in the first iteration)
    if (!isTrusty && pshift > 1) {
      const rt = head - 1;
      const lf = head - 1 - LP[pshift - 2];
      if (
        (yield* A.get(rt)) >= (yield* A.get(stepson)) ||
        (yield* A.get(lf)) >= (yield* A.get(stepson))
      ) {
        break;
      }
    }

    yield* A.set(head, yield* A.get(stepson));

    head = stepson;
    const trail = ctz(p & ~1);
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

  // The bitmap of the current standard concatenation, right-shifted by all
  // trailing zeros: mantissa p and exponent pshift. pshift is the index into
  // LP[] giving the size of the rightmost heap, and (p & 3) == 3 means the
  // rightmost two heaps are consecutive Leonardo numbers.
  let p = 1;
  let pshift = 1;

  while (head < hi) {
    if ((p & 3) === 3) {
      // add 1 by merging the first two blocks into a larger one
      yield* sift(A, pshift, head);
      p >>= 2;
      pshift += 2;
    } else {
      // adding a new block of length 1
      if (LP[pshift - 1] >= hi - head) {
        // this block is its final size
        yield* trinkle(A, p, pshift, head, false);
      } else {
        // this block will get merged, just make it trusty
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
      // block of length 1, no fiddling needed
      const trail = ctz(p & ~1);
      p >>= trail;
      pshift += trail;
    } else {
      p <<= 2;
      p ^= 7;
      pshift -= 2;

      // This block gets broken into three bits: the rightmost is a block of
      // length 1, the left hand part is split into LP[pshift+1] and LP[pshift].
      // Both are heapified, but their root nodes are not necessarily in order.
      yield* trinkle(A, p >> 1, pshift + 1, head - LP[pshift] - 1, true);
      yield* trinkle(A, p, pshift, head - 1, true);
    }

    head--;
  }
}

export function* smoothSort(A) {
  if (A.size > 1) yield* smoothSortRange(A, 0, A.size - 1);
}
