// Registry of sorting algorithms, the counterpart of g_algolist
// (src/SortAlgo.cpp). Algorithms are added here as they are ported.

import { bubbleSort } from './bubbleSort.js';
import { insertionSort } from './insertionSort.js';
import { selectionSort } from './selectionSort.js';

export const ALGORITHMS = [
  {
    id: 'bubble',
    name: 'Bubble Sort',
    run: bubbleSort,
    maxSize: Infinity,
    description: '',
  },
  {
    id: 'selection',
    name: 'Selection Sort',
    run: selectionSort,
    maxSize: Infinity,
    description: '',
  },
  {
    id: 'insertion',
    name: 'Insertion Sort',
    run: insertionSort,
    maxSize: Infinity,
    description: '',
  },
];

export function findAlgorithm(id) {
  return ALGORITHMS.find((a) => a.id === id) ?? ALGORITHMS[0];
}
