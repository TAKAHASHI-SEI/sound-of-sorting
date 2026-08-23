// Registry of sorting algorithms, the counterpart of g_algolist
// (src/SortAlgo.cpp). maxSize mirrors the original's max_testsize, which is
// used here to keep the very slow algorithms usable.

import { bogoSort, bozoSort } from './bogoSort.js';
import { bubbleSort } from './bubbleSort.js';
import { cocktailShakerSort } from './cocktailShakerSort.js';
import { combSort } from './combSort.js';
import { cycleSort } from './cycleSort.js';
import { gnomeSort } from './gnomeSort.js';
import { heapSort } from './heapSort.js';
import { binaryInsertionSort, insertionSort } from './insertionSort.js';
import { mergeSort, mergeSortIterative } from './mergeSort.js';
import { batcherSortNetwork, bitonicSortNetwork } from './networkSorts.js';
import { oddEvenSort } from './oddEvenSort.js';
import {
  quickSortDualPivot,
  quickSortLL,
  quickSortLR,
  quickSortTernaryLL,
  quickSortTernaryLR,
} from './quickSort.js';
import { radixSortLSD, radixSortMSD } from './radixSort.js';
import { selectionSort } from './selectionSort.js';
import { shellSort } from './shellSort.js';
import { slowSort, stoogeSort } from './stoogeSort.js';
import { smoothSort } from './smoothSort.js';

export const ALGORITHMS = [
  { id: 'selection', name: 'Selection Sort', run: selectionSort },
  { id: 'insertion', name: 'Insertion Sort', run: insertionSort },
  { id: 'binary-insertion', name: 'Binary Insertion Sort', run: binaryInsertionSort },
  {
    id: 'merge',
    name: 'Merge Sort',
    run: mergeSort,
    description: '2つのソート済み列をシャドウ配列でマージし、元の配列へ書き戻す。',
  },
  {
    id: 'merge-iterative',
    name: 'Merge Sort (iterative)',
    run: mergeSortIterative,
    description: '2の冪サイズの部分配列を反復的にマージする。',
  },
  {
    id: 'quick-lr',
    name: 'Quick Sort (LR ptrs)',
    run: quickSortLR,
    pivot: true,
    description: '左右から進む2つのポインタを使う変種。',
  },
  {
    id: 'quick-ll',
    name: 'Quick Sort (LL ptrs)',
    run: quickSortLL,
    pivot: true,
    description: 'CLRS第3版の変種。左側に2つのポインタを使う。',
  },
  {
    id: 'quick-ternary-lr',
    name: 'Quick Sort (ternary, LR ptrs)',
    run: quickSortTernaryLR,
    pivot: true,
    description: '3分割変種。左右2組のポインタで "=<?>=" に分割し、中央へ移動する。',
  },
  {
    id: 'quick-ternary-ll',
    name: 'Quick Sort (ternary, LL ptrs)',
    run: quickSortTernaryLL,
    pivot: true,
    description: '3分割変種。左2つ・右1つのポインタで "<>?=" に分割する。',
  },
  {
    id: 'quick-dual-pivot',
    name: 'Quick Sort (dual pivot)',
    run: quickSortDualPivot,
    description: '2ピボット変種。3つのポインタで "<1<2?>" に分割する。',
  },
  { id: 'bubble', name: 'Bubble Sort', run: bubbleSort },
  { id: 'cocktail-shaker', name: 'Cocktail Shaker Sort', run: cocktailShakerSort },
  { id: 'gnome', name: 'Gnome Sort', run: gnomeSort },
  { id: 'comb', name: 'Comb Sort', run: combSort },
  { id: 'shell', name: 'Shell Sort', run: shellSort },
  { id: 'heap', name: 'Heap Sort', run: heapSort },
  { id: 'smooth', name: 'Smooth Sort', run: smoothSort },
  { id: 'odd-even', name: 'Odd-Even Sort', run: oddEvenSort },
  { id: 'bitonic-network', name: "Batcher's Bitonic Sort", run: bitonicSortNetwork },
  {
    id: 'batcher-network',
    name: "Batcher's Odd-Even Merge Sort",
    run: batcherSortNetwork,
  },
  { id: 'cycle', name: 'Cycle Sort', run: cycleSort, maxSize: 512 },
  {
    id: 'radix-lsd',
    name: 'Radix Sort (LSD)',
    run: radixSortLSD,
    description: '下位桁から処理する基数ソート。計数時にシャドウ配列へ複製する。',
  },
  {
    id: 'radix-msd',
    name: 'Radix Sort (MSD)',
    run: radixSortMSD,
    description: '上位桁から処理する基数ソート。巡回置換で in-place に並べ替える。',
  },
  { id: 'bogo', name: 'Bogo Sort', run: bogoSort, maxSize: 10 },
  { id: 'bozo', name: 'Bozo Sort', run: bozoSort, maxSize: 10 },
  { id: 'stooge', name: 'Stooge Sort', run: stoogeSort, maxSize: 256 },
  { id: 'slow', name: 'Slow Sort', run: slowSort, maxSize: 128 },
].map((algo) => ({
  maxSize: Infinity,
  pivot: false,
  description: '',
  ...algo,
}));

export function findAlgorithm(id) {
  return ALGORITHMS.find((a) => a.id === id) ?? ALGORITHMS[0];
}
