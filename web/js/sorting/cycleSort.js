// Port of CycleSort (src/SortAlgo.cpp). The original watches two local
// variables (cycleStart with color 16, rank with color 3); since the Web
// version tracks watched indexes explicitly, a watch event is emitted whenever
// the tracked value changes.

export function* cycleSort(A) {
  const n = A.size;
  yield* A.watch(0, 16);
  yield* A.watch(0, 3);

  // Loop through the array to find cycles to rotate.
  for (let cycleStart = 0; cycleStart < n - 1; ++cycleStart) {
    yield* A.watch(cycleStart, 16);
    let item = yield* A.get(cycleStart);

    let rank;
    do {
      // Find where to put the item.
      rank = cycleStart;
      yield* A.watch(rank, 3);
      for (let i = cycleStart + 1; i < n; ++i) {
        if (yield* A.lessValue(i, item)) {
          rank++;
          yield* A.watch(rank, 3);
        }
      }

      // If the item is already there, this is a 1-cycle.
      if (rank === cycleStart) {
        yield* A.mark(rank, 2);
        break;
      }

      // Otherwise, put the item after any duplicates.
      while ((yield* A.compareValue(rank, item)) === 0) {
        rank++;
        yield* A.watch(rank, 3);
      }

      // Put item into right place and colorize. In the original `item` is a
      // reference into the array at cycleStart, so `swap(A[rank], item)`
      // exchanges the two positions and item becomes the displaced value.
      yield* A.swap(cycleStart, rank);
      item = A.direct(cycleStart);
      yield* A.mark(rank, 2);

      // Continue for rest of the cycle.
    } while (rank !== cycleStart);
  }

  yield* A.unwatchAll();
}
