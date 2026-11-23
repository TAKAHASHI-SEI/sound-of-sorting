// Port of WikiSort (src/algorithms/wikisort.cpp), a block merge sort by
// Mike McFadden. The C++ version drives MyIterator over the shown array and
// keeps a small fixed cache of plain values plus "buffer" ranges carved out of
// the array itself. The port mirrors that: array reads/writes/swaps go through
// the InstrumentedArray, while the cache and the buffer bookkeeping are plain
// values and indices.
//
// ColoringComparator::touch (a per-frame display colour) has no counterpart in
// the event stream, so it is omitted: every comparison already highlights its
// two operands through the 'compare' event.

const CACHE_SIZE = 8;
const BASE_SIZE = 8;

/// 63 -> 32, 64 -> 64, etc. (sorting network style).
function floorPowerOfTwo(value) {
  let x = value;
  x |= x >> 1;
  x |= x >> 2;
  x |= x >> 4;
  x |= x >> 8;
  x |= x >> 16;
  x |= x >> 32;
  return x - (x >> 1);
}

const len = (r) => r.end - r.start;

/// compare(*x, *y): two elements read from the shown array.
function* cmpAA(A, x, y) {
  return (yield* A.compare(x, y)) < 0;
}

/// compare(*x, key): one element read from the shown array.
function* cmpAV(A, x, key) {
  return (yield* A.compareValue(x, key)) < 0;
}

/// std::lower_bound(first, last, key): first element not less than key.
function* lowerBoundRange(A, first, last, key) {
  while (first < last) {
    const mid = (first + last) >> 1;
    if ((yield* A.compareValue(mid, key)) < 0) first = mid + 1;
    else last = mid;
  }
  return first;
}

/// std::upper_bound(first, last, key): first element greater than key.
function* upperBoundRange(A, first, last, key) {
  while (first < last) {
    const mid = (first + last) >> 1;
    if ((yield* A.compareValue(mid, key)) > 0) last = mid;
    else first = mid + 1;
  }
  return first;
}

/// Rotate [begin, end) so that the element at `begin + amount` becomes first.
function* rotateRange(A, begin, end, amount) {
  if (begin >= end) return;
  const n = end - begin;
  const split = amount >= 0 ? begin + amount : end + amount;
  const r1 = split - begin;
  const r2 = end - split;
  if (r1 === 0 || r2 === 0) return;

  const tmp = new Array(n);
  for (let i = 0; i < n; ++i) tmp[i] = yield* A.get(begin + i);
  let o = 0;
  for (let i = 0; i < r2; ++i) yield* A.set(begin + o++, tmp[r1 + i]);
  for (let i = 0; i < r1; ++i) yield* A.set(begin + o++, tmp[i]);
}

/// std::swap_ranges: element-wise swap of two equally long blocks.
function* blockSwap(A, start1, start2, size) {
  for (let i = 0; i < size; ++i) yield* A.swap(start1 + i, start2 + i);
}

/// Insertion sort via rotate, as WikiSortNS::InsertionSort.
function* insertionSort(A, begin, end) {
  for (let it = begin + 1; it < end; ++it) {
    const key = yield* A.get(it);
    const pos = yield* upperBoundRange(A, begin, it, key);
    yield* rotateRange(A, pos, it + 1, it - pos);
  }
}

/// Merge two adjacent ranges, reading the A values either from the small
/// `cache` (when A fits) or from the `buffer` region of the array.
function* mergeBlocks(A, buffer, rangeA, rangeB, cache) {
  if (len(rangeA) <= CACHE_SIZE) {
    let ai = 0;
    const aLast = len(rangeA);
    let bi = rangeB.start;
    const bLast = rangeB.end;
    let ins = rangeA.start;

    if (len(rangeB) > 0 && len(rangeA) > 0) {
      for (;;) {
        if (!(yield* cmpAV(A, bi, cache[ai]))) {
          yield* A.set(ins, cache[ai]);
          ai++;
          ins++;
          if (ai === aLast) break;
        } else {
          yield* A.set(ins, yield* A.get(bi));
          bi++;
          ins++;
          if (bi === bLast) break;
        }
      }
    }
    for (let k = ai; k < aLast; ++k) yield* A.set(ins++, cache[k]);
  } else {
    let ai = buffer.start;
    let bi = rangeB.start;
    const aLast = buffer.start + len(rangeA);
    const bLast = rangeB.end;
    let ins = rangeA.start;

    if (len(rangeB) > 0 && len(rangeA) > 0) {
      for (;;) {
        if (!(yield* cmpAA(A, bi, ai))) {
          yield* A.swap(ins, ai);
          ai++;
          ins++;
          if (ai === aLast) break;
        } else {
          yield* A.swap(ins, bi);
          bi++;
          ins++;
          if (bi === bLast) break;
        }
      }
    }
    if (ai < aLast) yield* blockSwap(A, ai, ins, aLast - ai);
  }
}

function* wikiSortRange(A, first, last) {
  const size = last - first;
  const cache = new Array(CACHE_SIZE);

  const powerOfTwo = floorPowerOfTwo(size);
  const fractionalBase = size < BASE_SIZE ? 1 : Math.floor(powerOfTwo / BASE_SIZE);
  let fractionalStep = size % fractionalBase;
  let decimalStep = Math.floor(size / fractionalBase);

  // First insertion sort everything at the lowest level.
  let start = first;
  let end = first;
  let fractional = 0;
  while (end < last) {
    end += decimalStep;
    fractional += fractionalStep;
    if (fractional >= fractionalBase) {
      fractional -= fractionalBase;
      end++;
    }
    yield* insertionSort(A, start, end);
    start = end;
  }

  // Then merge sort the higher levels.
  for (let mergeSize = BASE_SIZE; mergeSize < powerOfTwo; mergeSize += mergeSize) {
    const blockSize = Math.floor(Math.sqrt(decimalStep));
    const bufferSize = Math.floor(decimalStep / blockSize) + 1;

    let level1 = { start: first, end: first };
    let level2 = { start: first, end: first };
    let levelA = { start: first, end: first };
    let levelB = { start: first, end: first };

    let decimal = 0;
    let frac = 0;
    while (decimal < size) {
      start = first + decimal;

      decimal += decimalStep;
      frac += fractionalStep;
      if (frac >= fractionalBase) {
        frac -= fractionalBase;
        decimal++;
      }
      let mid = first + decimal;

      decimal += decimalStep;
      frac += fractionalStep;
      if (frac >= fractionalBase) {
        frac -= fractionalBase;
        decimal++;
      }
      end = first + decimal;

      if (yield* cmpAA(A, end - 1, start)) {
        // The two ranges are in reverse order: a rotation fixes it.
        yield* rotateRange(A, start, end, mid - start);
      } else if (yield* cmpAA(A, mid, mid - 1)) {
        // The two ranges are not in order, so merge them.
        let rangeA = { start, end: mid };
        let rangeB = { start: mid, end };

        if (len(rangeA) <= CACHE_SIZE) {
          for (let i = 0; i < len(rangeA); ++i) cache[i] = yield* A.get(rangeA.start + i);
          yield* mergeBlocks(A, { start: first, end: first }, rangeA, rangeB, cache);
          continue;
        }

        let bufferA;
        let bufferB;
        let buffer1;
        let buffer2;

        if (len(level1) > 0) {
          // Reuse the buffers found in a previous iteration.
          bufferA = { start: rangeA.start, end: rangeA.start };
          bufferB = { start: rangeB.end, end: rangeB.end };
          buffer1 = level1;
          buffer2 = level2;
        } else {
          // Find unique values for the buffers.
          let count = 1;
          buffer1 = { start: rangeA.start + 1, end: 0 };
          for (; buffer1.start < rangeA.end; buffer1.start++) {
            if (
              (yield* cmpAA(A, buffer1.start - 1, buffer1.start)) ||
              (yield* cmpAA(A, buffer1.start, buffer1.start - 1))
            ) {
              if (++count === bufferSize) break;
            }
          }
          buffer1.end = buffer1.start + count;

          if (bufferSize <= CACHE_SIZE) {
            buffer2 = { start: rangeA.start, end: rangeA.start };

            if (len(buffer1) === bufferSize) {
              bufferA = { start: buffer1.start, end: buffer1.start + bufferSize };
              bufferB = { start: rangeB.end, end: rangeB.end };
              buffer1 = { start: rangeA.start, end: rangeA.start + bufferSize };
            } else {
              bufferA = { start: buffer1.start, end: buffer1.start };
              buffer1 = { start: rangeA.start, end: rangeA.start };

              count = 1;
              buffer1.start = rangeB.end - 2;
              for (; buffer1.start >= rangeB.start; buffer1.start--) {
                if (
                  (yield* cmpAA(A, buffer1.start, buffer1.start + 1)) ||
                  (yield* cmpAA(A, buffer1.start + 1, buffer1.start))
                ) {
                  if (++count === bufferSize) break;
                }
              }
              buffer1.end = buffer1.start + count;

              if (len(buffer1) === bufferSize) {
                bufferB = { start: buffer1.start, end: buffer1.start + bufferSize };
                buffer1 = { start: rangeB.end - bufferSize, end: rangeB.end };
              }
            }
          } else {
            count = 0;
            buffer2 = { start: buffer1.start + 1, end: 0 };
            for (; buffer2.start < rangeA.end; buffer2.start++) {
              if (
                (yield* cmpAA(A, buffer2.start - 1, buffer2.start)) ||
                (yield* cmpAA(A, buffer2.start, buffer2.start - 1))
              ) {
                if (++count === bufferSize) break;
              }
            }
            buffer2.end = buffer2.start + count;

            if (len(buffer2) === bufferSize) {
              bufferA = { start: buffer2.start, end: buffer2.start + bufferSize * 2 };
              bufferB = { start: rangeB.end, end: rangeB.end };
              buffer1 = { start: rangeA.start, end: rangeA.start + bufferSize };
              buffer2 = { start: rangeA.start + bufferSize, end: rangeA.start + bufferSize * 2 };
            } else if (len(buffer1) === bufferSize) {
              bufferA = { start: buffer1.start, end: buffer1.start + bufferSize };
              buffer1 = { start: rangeA.start, end: rangeA.start + bufferSize };

              count = 1;
              buffer2.start = rangeB.end - 2;
              for (; buffer2.start >= rangeB.start; buffer2.start--) {
                if (
                  (yield* cmpAA(A, buffer2.start, buffer2.start + 1)) ||
                  (yield* cmpAA(A, buffer2.start + 1, buffer2.start))
                ) {
                  if (++count === bufferSize) break;
                }
              }
              buffer2.end = buffer2.start + count;

              if (len(buffer2) === bufferSize) {
                bufferB = { start: buffer2.start, end: buffer2.start + bufferSize };
                buffer2 = { start: rangeB.end - bufferSize, end: rangeB.end };
              } else {
                buffer1.end = buffer1.start; // failure
              }
            } else {
              count = 1;
              buffer1.start = rangeB.end - 2;
              for (; buffer1.start >= rangeB.start; buffer1.start--) {
                if (
                  (yield* cmpAA(A, buffer1.start, buffer1.start + 1)) ||
                  (yield* cmpAA(A, buffer1.start + 1, buffer1.start))
                ) {
                  if (++count === bufferSize) break;
                }
              }
              buffer1.end = buffer1.start + count;

              count = 0;
              buffer2.start = buffer1.start - 1;
              for (; buffer2.start >= rangeB.start; buffer2.start--) {
                if (
                  (yield* cmpAA(A, buffer2.start, buffer2.start + 1)) ||
                  (yield* cmpAA(A, buffer2.start + 1, buffer2.start))
                ) {
                  if (++count === bufferSize) break;
                }
              }
              buffer2.end = buffer2.start + count;

              if (len(buffer2) === bufferSize) {
                bufferA = { start: rangeA.start, end: rangeA.start };
                bufferB = { start: buffer2.start, end: buffer2.start + bufferSize * 2 };
                buffer1 = { start: rangeB.end - bufferSize, end: rangeB.end };
                buffer2 = { start: buffer1.start - bufferSize, end: buffer1.start };
              } else {
                buffer1.end = buffer1.start; // failure
              }
            }
          }

          if (len(buffer1) < bufferSize) {
            // Not enough unique values: the input repeats a lot, so use a
            // merge optimised for repeated values.
            while (len(rangeA) > 0 && len(rangeB) > 0) {
              const md = yield* lowerBoundRange(
                A,
                rangeB.start,
                rangeB.end,
                yield* A.get(rangeA.start),
              );
              const amount = md - rangeA.end;
              yield* rotateRange(A, rangeA.start, md, -amount);

              rangeB.start = md;
              const key = yield* A.get(rangeA.start + amount);
              const ub = yield* upperBoundRange(A, rangeA.start, rangeA.end, key);
              rangeA = { start: ub, end: rangeB.start };
            }
            continue;
          }

          // Move the unique values to the start of A.
          {
            const length = len(bufferA);
            let c = 0;
            for (let index = bufferA.start; c < length; index--) {
              if (
                index === rangeA.start ||
                (yield* cmpAA(A, index - 1, index)) ||
                (yield* cmpAA(A, index, index - 1))
              ) {
                yield* rotateRange(A, index + 1, bufferA.start + 1, -c);
                bufferA.start = index + c;
                c++;
              }
            }
            bufferA = { start: rangeA.start, end: rangeA.start + length };
          }

          // Move the unique values to the end of B.
          {
            const length = len(bufferB);
            let c = 0;
            for (let index = bufferB.start; c < length; index++) {
              if (
                index === rangeB.end - 1 ||
                (yield* cmpAA(A, index, index + 1)) ||
                (yield* cmpAA(A, index + 1, index))
              ) {
                yield* rotateRange(A, bufferB.start, index, c);
                bufferB.start = index - c;
                c++;
              }
            }
            bufferB = { start: rangeB.end - length, end: rangeB.end };
          }

          level1 = buffer1;
          level2 = buffer2;
          levelA = bufferA;
          levelB = bufferB;
        }

        // Break the remainder of A into blocks.
        const blockA = { start: bufferA.end, end: rangeA.end };
        const firstA = {
          start: bufferA.end,
          end: bufferA.end + (len(blockA) % blockSize),
        };

        // Swap the second value of each A block with the value in buffer1.
        for (
          let index = buffer1.start, indexA = firstA.end + 1;
          indexA < blockA.end;
          index++, indexA += blockSize
        ) {
          yield* A.swap(index, indexA);
        }

        let lastA = { start: firstA.start, end: firstA.end };
        let lastB = { start: first, end: first };
        let blockB = {
          start: rangeB.start,
          end: rangeB.start + Math.min(blockSize, len(rangeB) - len(bufferB)),
        };
        blockA.start += len(firstA);

        let minA = blockA.start;
        let indexA = buffer1.start;
        let minValue = yield* A.get(minA);

        if (len(lastA) <= CACHE_SIZE) {
          for (let i = 0; i < len(lastA); ++i) cache[i] = yield* A.get(lastA.start + i);
        } else {
          yield* blockSwap(A, lastA.start, buffer2.start, len(lastA));
        }

        for (;;) {
          if (
            (len(lastB) > 0 && !(yield* cmpAV(A, lastB.end - 1, minValue))) ||
            len(blockB) === 0
          ) {
            const bSplit = yield* lowerBoundRange(A, lastB.start, lastB.end, minValue);
            const bRemaining = lastB.end - bSplit;

            yield* blockSwap(A, blockA.start, minA, blockSize);
            yield* A.swap(blockA.start + 1, indexA++);

            yield* mergeBlocks(A, buffer2, lastA, { start: lastA.end, end: bSplit }, cache);

            if (blockSize <= CACHE_SIZE) {
              for (let i = 0; i < blockSize; ++i) cache[i] = yield* A.get(blockA.start + i);
            } else {
              yield* blockSwap(A, blockA.start, buffer2.start, blockSize);
            }

            yield* blockSwap(A, bSplit, blockA.start + blockSize - bRemaining, bRemaining);

            lastA = {
              start: blockA.start - bRemaining,
              end: blockA.start - bRemaining + blockSize,
            };
            lastB = { start: lastA.end, end: lastA.end + bRemaining };

            blockA.start += blockSize;
            if (len(blockA) === 0) break;

            // Find the new minimum A block through its unique second value.
            minA = blockA.start + 1;
            for (let findA = minA + blockSize; findA < blockA.end; findA += blockSize) {
              if (yield* cmpAA(A, findA, minA)) minA = findA;
            }
            minA = minA - 1;
            minValue = yield* A.get(minA);
          } else if (len(blockB) < blockSize) {
            yield* rotateRange(A, blockA.start, blockB.end, -len(blockB));
            lastB = { start: blockA.start, end: blockA.start + len(blockB) };
            blockA.start += len(blockB);
            blockA.end += len(blockB);
            minA += len(blockB);
            blockB.end = blockB.start;
          } else {
            yield* blockSwap(A, blockA.start, blockB.start, blockSize);
            lastB = { start: blockA.start, end: blockA.start + blockSize };
            if (minA === blockA.start) minA = blockA.end;

            blockA.start += blockSize;
            blockA.end += blockSize;
            blockB.start += blockSize;
            blockB.end += blockSize;

            if (blockB.end > bufferB.start) blockB.end = bufferB.start;
          }
        }

        // Merge the last A block with the remaining B blocks.
        yield* mergeBlocks(A, buffer2, lastA, {
          start: lastA.end,
          end: rangeB.end - len(bufferB),
        }, cache);
      }
    }

    if (len(level1) > 0) {
      // Insertion sort the jumbled buffer, then redistribute both buffers.
      yield* insertionSort(A, level2.start, level2.end);

      const levelStart = levelA.start;
      for (let index = levelA.end; len(levelA) > 0; index++) {
        if (index === levelB.start || !(yield* cmpAA(A, index, levelA.start))) {
          const amount = index - levelA.end;
          yield* rotateRange(A, levelA.start, index, -amount);
          levelA.start += amount + 1;
          levelA.end += amount;
          index--;
        }
      }

      for (let index = levelB.start; len(levelB) > 0; index--) {
        if (index === levelStart || !(yield* cmpAA(A, levelB.end - 1, index - 1))) {
          const amount = levelB.start - index;
          yield* rotateRange(A, index, levelB.end, amount);
          levelB.start -= amount;
          levelB.end -= amount + 1;
          index++;
        }
      }
    }

    decimalStep += decimalStep;
    fractionalStep += fractionalStep;
    if (fractionalStep >= fractionalBase) {
      fractionalStep -= fractionalBase;
      decimalStep++;
    }
  }
}

export function* wikiSort(A) {
  if (A.size < 2) return;
  yield* wikiSortRange(A, 0, A.size);
}
