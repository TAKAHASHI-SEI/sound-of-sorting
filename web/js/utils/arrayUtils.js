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
