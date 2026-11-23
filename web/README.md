# The Sound of Sorting (web)

Web (HTML/CSS/JavaScript) port of [The Sound of Sorting](http://panthema.net/2013/sound-of-sorting/)
by Timo Bingmann. The design document is in [docs/design.md](../docs/design.md).

## Running

Static files only — any HTTP server works. ES Modules require a server
(opening `index.html` via `file://` does not work).

```sh
cd web
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. In GitHub Codespaces, use the forwarded
port 8000 URL.

## Current state (Phase 1 + part of Phase 2/3)

- Array generation (all 6 input templates of the original)
- Canvas bar graph visualization with access / watch / mark colors
  (priority: access > watch > mark)
- All 29 ported algorithms as generators that yield operation events: Bubble,
  Selection, Insertion, Binary Insertion, Cocktail Shaker, Gnome, Comb, Odd-Even,
  Shell, Heap, Smooth, Merge (recursive and iterative) Sort, the five Quick Sort
  variants (LR ptrs, LL ptrs, ternary LR ptrs, ternary LL ptrs, dual pivot),
  Cycle Sort, Radix Sort (LSD and MSD), Batcher's Bitonic / Odd-Even Merge
  sorting networks, Tim Sort, Block Merge Sort (WikiSort), Bogo Sort,
  Bozo Sort, Stooge Sort and Slow Sort
- Quick Sort pivot rule selector (`first` / `last` / `mid` / `random` /
  `median3`), shown only for the Quick Sort variants
- Start / Step / Pause / Resume / Stop / Reset / Regenerate / Random, array size
  and animation speed
- Comparison, array access, inversion and run counters. The inversion counter
  follows the original `SortArray` semantics: click it to toggle counting on and
  off, and arrays above the selected algorithm's `inversion_count_limit` show
  `skipped`
- Web Audio API sound: value-based frequency, triangle wave and ADSR envelope,
  up to 512 simultaneous voices with automatic volume scaling (1/√n) plus a
  limiter, and sound on/off, volume and sound sustain (length) controls

The remaining item is the AudioWorklet-based mixer — see the design document.

## Porting scope

- Original desktop version: 32 algorithms listed in the UI
- Planned Web port target: 29 algorithms
- Excluded from the Web target: `std::sort`, `std::stable_sort`,
  `std::sort_heap` (runtime/library dependent and not directly instrumentable in
  the same way)
- Implemented in the current Web version: all 29 target algorithms (see the
  registry in `js/sorting/index.js`)

The detailed list, priorities and the source-to-web mapping are documented in
[`docs/design.md`](../docs/design.md), especially sections 17 to 20.

## Sound

The original project generates sound from accessed / compared **values**, not
from indexes. The Web version keeps the same design direction:

- sorting algorithms emit operation events through `InstrumentedArray`
- the animation controller consumes those events for drawing, counters and sound
- `js/audio/audioController.js` recreates the oscillator design with
  `OscillatorNode` (triangle) + `GainNode` (ADSR) and a `DynamicsCompressorNode`
  on the master bus

The browser requires a user gesture before audio can start, so the
`AudioContext` is created on the first Start click or sound toggle.

## Layout

| Path | Contents |
| --- | --- |
| `js/main.js` | Initialization and wiring |
| `js/state.js` | Application state, array generation, slider scales |
| `js/ui.js` | DOM inputs, buttons and labels |
| `js/sorting/` | Algorithm registry and algorithms (`g_algolist` counterpart) |
| `js/sorting/instrumentedArray.js` | `SortArray` counterpart: emits operation events |
| `js/animation/` | Event playback, pause/stop, delay handling and Canvas drawing |
| `js/audio/` | Web Audio API sound (`SortSound.cpp` counterpart) |
| `js/utils/` | Input data templates plus inversion / run counting helpers |

## License

GPLv3, same as the original project.
