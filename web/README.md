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
- Canvas bar graph visualization with access/mark colors
- Bubble Sort, Selection Sort and Insertion Sort, ported as generators that
  yield operation events
- Start / Pause / Resume / Stop / Reset / Regenerate, array size and animation
  speed
- Comparison and array access counters
- Web Audio API sound: value-based frequency, triangle wave and ADSR envelope,
  plus sound on/off, volume and sound sustain (length) controls

Step execution, random run, Quick Sort pivot rules, the remaining algorithms and
the advanced statistics follow later — see the design document.

## Porting scope

- Original desktop version: 32 algorithms listed in the UI
- Planned Web port target: 29 algorithms
- Excluded from the Web target: `std::sort`, `std::stable_sort`,
  `std::sort_heap` (runtime/library dependent and not directly instrumentable in
  the same way)
- Implemented in the current Web version: 3 algorithms (`Bubble Sort`,
  `Selection Sort`, `Insertion Sort`)

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
| `js/utils/` | Input data templates and helpers |

## License

GPLv3, same as the original project.
