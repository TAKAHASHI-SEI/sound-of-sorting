// Port of ShellSort (src/SortAlgo.cpp), using the gap sequence by Robert
// Sedgewick. The original compares a plain value (`A[j-h] > v`), which counts
// as one array access plus one comparison.

export function* shellSort(A) {
  const incs = [
    1391376, 463792, 198768, 86961, 33936, 13776, 4592, 1968, 861, 336, 112, 48,
    21, 7, 3, 1,
  ];

  for (let k = 0; k < incs.length; k++) {
    for (let h = incs[k], i = h; i < A.size; i++) {
      const v = yield* A.get(i);
      let j = i;

      while (j >= h && (yield* A.greaterValue(j - h, v))) {
        const shifted = yield* A.get(j - h);
        yield* A.set(j, shifted);
        j -= h;
      }

      yield* A.set(j, v);
    }
  }
}
