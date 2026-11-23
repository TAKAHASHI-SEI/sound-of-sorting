// Port of SortArray::FillData / FillInputlist (src/SortArray.cpp).

function shuffle(values) {
  for (let i = values.length - 1; i > 0; --i) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

function ascending(n) {
  return Array.from({ length: n }, (_, i) => i + 1);
}

// Skew of [1,n] by x^exp, as in the "Shuffled Cubic/Quintic" templates.
function skewed(n, exponent) {
  return Array.from({ length: n }, (_, i) => {
    const x = (2 * i) / n - 1;
    const v = Math.pow(x, exponent);
    const w = (((v + 1) / 2) * n + 1) / 3;
    return Math.floor(w + 1);
  });
}

export const INPUT_TYPES = [
  { id: 'random', name: 'Random Shuffle', fill: (n) => shuffle(ascending(n)) },
  { id: 'ascending', name: 'Ascending', fill: (n) => ascending(n) },
  { id: 'descending', name: 'Descending', fill: (n) => ascending(n).reverse() },
  { id: 'cubic', name: 'Shuffled Cubic', fill: (n) => shuffle(skewed(n, 3)) },
  { id: 'quintic', name: 'Shuffled Quintic', fill: (n) => shuffle(skewed(n, 5)) },
  {
    id: 'equal',
    name: 'Shuffled n-2 Equal',
    fill: (n) => {
      const values = new Array(n).fill(Math.floor(n / 2) + 1);
      values[0] = 1;
      values[n - 1] = n;
      return shuffle(values);
    },
  },
];

export function findInputType(id) {
  return INPUT_TYPES.find((t) => t.id === id) ?? INPUT_TYPES[0];
}

export function generateValues(inputTypeId, size) {
  return findInputType(inputTypeId).fill(Math.max(1, size));
}

export function isSorted(values) {
  for (let i = 1; i < values.length; ++i) {
    if (values[i - 1] > values[i]) return false;
  }
  return true;
}

/// Port of SortArray::GetRuns: number of ascending runs, i.e. descending
/// adjacent pairs counted plus one.
export function countRuns(values) {
  let runs = 1;
  for (let i = 1; i < values.length; ++i) {
    if (values[i - 1] > values[i]) ++runs;
  }
  return runs;
}

function lowerBound(sorted, value) {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/// Number of inversions: pairs i < j with values[i] > values[j], the same
/// quantity as SortArray::RecalcInversions but counted in O(n log n) with a
/// Fenwick tree over the value ranks instead of O(n^2).
export function countInversions(values) {
  const n = values.length;
  if (n < 2) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const bit = new Array(n + 1).fill(0);

  const prefixSum = (index) => {
    let sum = 0;
    for (let i = index; i > 0; i -= i & -i) sum += bit[i];
    return sum;
  };
  const add = (index) => {
    for (let i = index; i <= n; i += i & -i) ++bit[i];
  };

  let inversions = 0;
  for (let i = 0; i < n; ++i) {
    // Equal values share a rank, so they are not counted as inversions
    // (ArrayItem::greater_direct is a strict comparison).
    const rank = lowerBound(sorted, values[i]) + 1;
    inversions += i - prefixSum(rank);
    add(rank);
  }
  return inversions;
}
