// Registry of sorting algorithms, the counterpart of g_algolist
// (src/SortAlgo.cpp). Algorithms are added here as they are ported.

import { batcherSortNetwork } from './batcherSortNetwork.js';
import { binaryInsertionSort } from './binaryInsertionSort.js';
import { bitonicSortNetwork } from './bitonicSortNetwork.js';
import { bogoSort } from './bogoSort.js';
import { bozoSort } from './bozoSort.js';
import { bubbleSort } from './bubbleSort.js';
import { cocktailShakerSort } from './cocktailShakerSort.js';
import { combSort } from './combSort.js';
import { cycleSort } from './cycleSort.js';
import { gnomeSort } from './gnomeSort.js';
import { heapSort } from './heapSort.js';
import { insertionSort } from './insertionSort.js';
import { mergeSort, mergeSortIterative } from './mergeSort.js';
import { oddEvenSort } from './oddEvenSort.js';
import { quickSortDualPivot } from './quickSortDualPivot.js';
import { quickSortLL } from './quickSortLL.js';
import { quickSortLR } from './quickSortLR.js';
import { quickSortTernaryLL } from './quickSortTernaryLL.js';
import { quickSortTernaryLR } from './quickSortTernaryLR.js';
import { radixSortLSD, radixSortMSD } from './radixSort.js';
import { selectionSort } from './selectionSort.js';
import { shellSort } from './shellSort.js';
import { slowSort } from './slowSort.js';
import { smoothSort } from './smoothSort.js';
import { stoogeSort } from './stoogeSort.js';
import { timSort } from './timSort.js';
import { wikiSort } from './wikiSort.js';

export const ALGORITHMS = [
  {
    id: 'bubble',
    name: 'Bubble Sort',
    run: bubbleSort,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'selection',
    name: 'Selection Sort',
    run: selectionSort,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'insertion',
    name: 'Insertion Sort',
    run: insertionSort,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'binary-insertion',
    name: 'Binary Insertion Sort',
    run: binaryInsertionSort,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'cocktail',
    name: 'Cocktail Shaker Sort',
    run: cocktailShakerSort,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'gnome',
    name: 'Gnome Sort',
    run: gnomeSort,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'comb',
    name: 'Comb Sort',
    run: combSort,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'oddeven',
    name: 'Odd-Even Sort',
    run: oddEvenSort,
    maxSize: Infinity,
    inversionCountLimit: 1024,
    description: '',
  },
  {
    id: 'shell',
    name: 'Shell Sort',
    run: shellSort,
    maxSize: Infinity,
    inversionCountLimit: 1024,
    description: '',
  },
  {
    id: 'heap',
    name: 'Heap Sort',
    run: heapSort,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'smooth',
    name: 'Smooth Sort',
    run: smoothSort,
    maxSize: Infinity,
    inversionCountLimit: 1024,
    description: '',
  },
  {
    id: 'merge',
    name: 'Merge Sort',
    run: mergeSort,
    maxSize: Infinity,
    inversionCountLimit: 512,
    description: '',
  },
  {
    id: 'merge-iterative',
    name: 'Merge Sort (iterative)',
    run: mergeSortIterative,
    maxSize: Infinity,
    inversionCountLimit: 512,
    description: '',
  },
  {
    id: 'quick-lr',
    name: 'Quick Sort (LR ptrs)',
    run: quickSortLR,
    usesPivot: true,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'quick-ll',
    name: 'Quick Sort (LL ptrs)',
    run: quickSortLL,
    usesPivot: true,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'quick-ternary-lr',
    name: 'Quick Sort (ternary, LR ptrs)',
    run: quickSortTernaryLR,
    usesPivot: true,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'quick-ternary-ll',
    name: 'Quick Sort (ternary, LL ptrs)',
    run: quickSortTernaryLL,
    usesPivot: true,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'quick-dual-pivot',
    name: 'Quick Sort (dual pivot)',
    run: quickSortDualPivot,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'cycle',
    name: 'Cycle Sort',
    run: cycleSort,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'radix-lsd',
    name: 'Radix Sort (LSD)',
    run: radixSortLSD,
    maxSize: Infinity,
    inversionCountLimit: 512,
    description: '',
  },
  {
    id: 'radix-msd',
    name: 'Radix Sort (MSD)',
    run: radixSortMSD,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'bitonic',
    name: "Batcher's Bitonic Sort",
    run: bitonicSortNetwork,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'batcher-oddeven',
    name: "Batcher's Odd-Even Merge Sort",
    run: batcherSortNetwork,
    maxSize: Infinity,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'tim',
    name: 'Tim Sort',
    run: timSort,
    maxSize: Infinity,
    inversionCountLimit: 512,
    description: '',
  },
  {
    id: 'wiki',
    name: 'Block Merge Sort (WikiSort)',
    run: wikiSort,
    maxSize: Infinity,
    inversionCountLimit: 512,
    description: 'An O(1) place O(n log n) time stable merge sort.',
  },
  {
    id: 'bogo',
    name: 'Bogo Sort',
    run: bogoSort,
    maxSize: 10,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'bozo',
    name: 'Bozo Sort',
    run: bozoSort,
    maxSize: 10,
    inversionCountLimit: Infinity,
    description: '',
  },
  {
    id: 'stooge',
    name: 'Stooge Sort',
    run: stoogeSort,
    maxSize: 256,
    inversionCountLimit: 512,
    description: '',
  },
  {
    id: 'slow',
    name: 'Slow Sort',
    run: slowSort,
    maxSize: 128,
    inversionCountLimit: 512,
    description: '',
  },
];

export function findAlgorithm(id) {
  return ALGORITHMS.find((a) => a.id === id) ?? ALGORITHMS[0];
}
