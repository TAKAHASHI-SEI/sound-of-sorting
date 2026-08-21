// Ports of BogoSort and BozoSort (src/SortAlgo.cpp).

/// Marks the sorted prefix while checking, as the original does.
function* bogoCheckSorted(A) {
  let prev = yield* A.get(0);
  A.mark(0);

  let i = 1;
  for (; i < A.size; ++i) {
    const val = yield* A.get(i);
    if (prev > val) break;
    prev = val;
    A.mark(i);
  }

  if (i === A.size) return true;

  while (i > 0) A.unmark(i--);
  A.unmark(0);

  return false;
}

function shuffle(perm) {
  for (let i = perm.length - 1; i > 0; --i) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = perm[i];
    perm[i] = perm[j];
    perm[j] = tmp;
  }
}

export function* bogoSort(A) {
  const perm = Array.from({ length: A.size }, (_, i) => i);

  for (;;) {
    if (yield* bogoCheckSorted(A)) break;

    shuffle(perm);

    // permute array in-place by walking the permutation's cycles
    const pmark = new Array(A.size).fill(false);

    for (let i = 0; i < A.size; ++i) {
      if (pmark[i]) continue;

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

export function* bozoSort(A) {
  for (;;) {
    if (yield* bogoCheckSorted(A)) break;

    yield* A.swap(
      Math.floor(Math.random() * A.size),
      Math.floor(Math.random() * A.size),
    );
  }
}
