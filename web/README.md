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

## Current state (Phase 1)

- Array generation (all 6 input templates of the original)
- Canvas bar graph visualization with access/mark colors
- Bubble Sort, ported as a generator that yields operation events
- Start / Reset / Regenerate, array size and animation speed
- Comparison and array access counters

Animation, pause/stop, the remaining algorithms and the sound (Web Audio API)
follow in Phase 2 and 3 — see the design document.

## Porting scope

- Original desktop version: 32 algorithms listed in the UI
- Planned Web port target: 29 algorithms
- Excluded from the Web target: `std::sort`, `std::stable_sort`,
  `std::sort_heap` (runtime/library dependent and not directly instrumentable in
  the same way)
- Implemented in the current Web version: 1 algorithm (`Bubble Sort`)

The detailed list, priorities and the source-to-web mapping are documented in
[`docs/design.md`](../docs/design.md), especially sections 17 to 20.

## Sound plan

The original project generates sound from accessed / compared **values**, not
from indexes. The Web version keeps the same design direction:

- sorting algorithms emit operation events through `InstrumentedArray`
- the animation controller consumes those events for drawing and counters
- Web Audio API sound output is planned as Phase 3

The target behavior is documented in the design document's sound section.

## Layout

| Path | Contents |
| --- | --- |
| `js/main.js` | Initialization and wiring |
| `js/state.js` | Application state, array generation, slider scales |
| `js/ui.js` | DOM inputs, buttons and labels |
| `js/sorting/` | Algorithm registry and algorithms (`g_algolist` counterpart) |
| `js/sorting/instrumentedArray.js` | `SortArray` counterpart: emits operation events |
| `js/animation/` | Event playback, delay handling and Canvas drawing |
| `js/utils/` | Input data templates and helpers |

## License

GPLv3, same as the original project.
