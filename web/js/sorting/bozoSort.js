// Port of BozoSort (src/SortAlgo.cpp). Like Bogo Sort it loops until the array
// happens to become sorted; its g_algolist entry caps test runs at 10.

import { bogoCheckSorted } from './bogoSort.js';

export function* bozoSort(A) {
  if (A.size === 0) return;

  while (true) {
    // check if array is sorted
    if (yield* bogoCheckSorted(A)) break;

    // swap two random items
    yield* A.swap(
      Math.floor(Math.random() * A.size),
      Math.floor(Math.random() * A.size),
    );
  }
}
