// Port of QuickSortSelectPivot and g_quicksort_pivot (src/SortAlgo.cpp).
// `hi` is exclusive, matching the original's convention.

export const QUICK_SORT_PIVOTS = [
  { id: 'first', name: '先頭' },
  { id: 'last', name: '末尾' },
  { id: 'mid', name: '中央' },
  { id: 'random', name: 'ランダム' },
  { id: 'median3', name: '3値の中央値' },
];

/// The original defaults to PIVOT_FIRST.
export const DEFAULT_QUICK_SORT_PIVOT = QUICK_SORT_PIVOTS[0].id;

export function* selectPivot(A, lo, hi, pivotType) {
  if (pivotType === 'last') return hi - 1;

  if (pivotType === 'mid') return Math.floor((lo + hi) / 2);

  if (pivotType === 'random') return lo + Math.floor(Math.random() * (hi - lo));

  if (pivotType === 'median3') {
    const mid = Math.floor((lo + hi) / 2);

    // cases if two are equal
    if ((yield* A.compare(lo, mid)) === 0) return lo;
    if ((yield* A.compare(lo, hi - 1)) === 0) return hi - 1;
    if ((yield* A.compare(mid, hi - 1)) === 0) return hi - 1;

    // cases if three are different
    if (yield* A.less(lo, mid)) {
      if (yield* A.less(mid, hi - 1)) return mid;
      return (yield* A.less(lo, hi - 1)) ? hi - 1 : lo;
    }

    if (yield* A.greater(mid, hi - 1)) return mid;
    return (yield* A.less(lo, hi - 1)) ? lo : hi - 1;
  }

  return lo;
}
