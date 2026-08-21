/// Port of ShellSort (src/SortAlgo.cpp), with the gaps of Robert Sedgewick.
const INCS = [
  1391376, 463792, 198768, 86961, 33936,
  13776, 4592, 1968, 861, 336,
  112, 48, 21, 7, 3, 1,
];

export function* shellSort(A) {
  for (const h of INCS) {
    for (let i = h; i < A.size; i++) {
      const v = yield* A.get(i);
      let j = i;

      while (j >= h && (yield* A.get(j - h)) > v) {
        yield* A.set(j, yield* A.get(j - h));
        j -= h;
      }

      yield* A.set(j, v);
    }
  }
}
