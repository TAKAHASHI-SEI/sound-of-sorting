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
