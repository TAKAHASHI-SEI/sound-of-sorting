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

## Current state (Phase 2)

- Array generation (all 6 input templates of the original)
- Canvas bar graph visualization with access/mark/watch colors
- 27 of the original's algorithms, ported as generators that yield operation
  events
- Quick Sort pivot selection (first / last / middle / random / median of three)
- Start / Pause / Resume / Step / Stop / Reset / Regenerate
- Array size (limited per algorithm, as `AlgoEntry::max_testsize` does) and
  animation speed
- Comparison and array access counters

Not ported: `std::sort`, `std::stable_sort` and `std::sort_heap`, which depend
on the original's iterator instrumentation, plus Tim Sort and Block Merge Sort
(WikiSort). The sound (Web Audio API) follows in Phase 3 — see the design
document.

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
