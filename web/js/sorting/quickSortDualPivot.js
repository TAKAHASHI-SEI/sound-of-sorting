// Port of QuickSortDualPivot / dualPivotYaroslavskiy (src/SortAlgo.cpp), by
// Sebastian Wild. Partitions "<1<2?>" using three pointers, two at left and
// one at right. `left` and `right` are inclusive.

export function* quickSortDualPivot(A) {
  // The original recurses on [left, l-1], [l+1, g-1] and [g+1, right]. An
  // explicit stack visits the ranges in exactly the same order, but keeps the
  // generator delegation depth flat.
  const stack = [[0, A.size - 1]];

  while (stack.length > 0) {
    const [left, right] = stack.pop();
    if (!(right > left)) continue;

    if (yield* A.greater(left, right)) {
      yield* A.swap(left, right);
    }

    const p = yield* A.get(left);
    const q = yield* A.get(right);

    yield* A.mark(left);
    yield* A.mark(right);

    let l = left + 1;
    let g = right - 1;
    let k = l;

    yield* A.watch(l, 3);
    yield* A.watch(g, 3);
    yield* A.watch(k, 3);

    while (k <= g) {
      if (yield* A.lessValue(k, p)) {
        yield* A.swap(k, l);
        ++l;
        yield* A.watch(l, 3);
      } else if (yield* A.greaterOrEqualValue(k, q)) {
        while ((yield* A.greaterValue(g, q)) && k < g) --g;
        yield* A.swap(k, g);
        --g;
        yield* A.watch(g, 3);

        if (yield* A.lessValue(k, p)) {
          yield* A.swap(k, l);
          ++l;
          yield* A.watch(l, 3);
        }
      }
      ++k;
      yield* A.watch(k, 3);
    }
    --l;
    ++g;
    yield* A.swap(left, l);
    yield* A.swap(right, g);

    yield* A.unmarkAll();
    yield* A.unwatchAll();

    stack.push([g + 1, right]);
    stack.push([l + 1, g - 1]);
    stack.push([left, l - 1]);
  }
}
