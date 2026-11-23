// Port of BogoSort and BogoCheckSorted (src/SortAlgo.cpp). The original loops
// forever until the random permutation happens to be sorted, so it is only
// usable on very small arrays (its g_algolist entry caps test runs at 10).

/// Port of BogoCheckSorted: mark the ascending prefix, return whether it is
/// the whole array.
export function* bogoCheckSorted(A) {
  if (A.size === 0) return true;

  let i = 1;
  let prev = yield* A.get(0);
  yield* A.mark(0);

  for (; i < A.size; ++i) {
    const val = yield* A.get(i);
    if ((yield* A.compareValues(prev, val)) > 0) break;
    prev = val;
    yield* A.mark(i);
  }

  if (i === A.size) {
    // this is amazing.
    return true;
  }

  while (i > 0) yield* A.unmark(i--);
  yield* A.unmark(0);

  return false;
}

export function* bogoSort(A) {
  if (A.size === 0) return;

  // keep a permutation of [0,size)
  const perm = new Array(A.size);
  for (let i = 0; i < A.size; ++i) perm[i] = i;

  while (true) {
    // check if array is sorted
    if (yield* bogoCheckSorted(A)) break;

    // pick a random permutation of indexes
    for (let i = perm.length - 1; i > 0; --i) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = perm[i];
      perm[i] = perm[j];
      perm[j] = tmp;
    }

    // permute array in-place
    const pmark = new Array(A.size).fill(false);

    for (let i = 0; i < A.size; ++i) {
      if (pmark[i]) continue;

      // walk a cycle
      let j = i;
      while (perm[j] !== i) {
        yield* A.swap(j, perm[j]);
        pmark[j] = true;
        j = perm[j];
      }
      pmark[j] = true;
    }
  }
}
