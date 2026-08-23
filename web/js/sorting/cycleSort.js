/// Port of CycleSort (src/SortAlgo.cpp). The original holds a reference to
/// A[cycleStart] and swaps it with A[rank], which is a plain swap of the two
/// array slots here.
export function* cycleSort(A) {
  const n = A.size;
  let cycleStart = 0;
  let rank = 0;

  A.watch('cycleStart', () => cycleStart, 16);
  A.watch('rank', () => rank, 3);

  for (cycleStart = 0; cycleStart < n - 1; ++cycleStart) {
    let item = A.direct(cycleStart);

    do {
      // find where to put the item
      rank = cycleStart;
      for (let i = cycleStart + 1; i < n; ++i) {
        if ((yield* A.get(i)) < item) rank++;
      }

      // if the item is already there, this is a 1-cycle
      if (rank === cycleStart) {
        A.mark(rank, 2);
        break;
      }

      // otherwise, put the item after any duplicates
      while (item === (yield* A.get(rank))) rank++;

      // put item into right place and colorize
      yield* A.swap(cycleStart, rank);
      item = A.direct(cycleStart);
      A.mark(rank, 2);

      // continue for rest of the cycle
    } while (rank !== cycleStart);
  }

  A.unwatchAll();
}
