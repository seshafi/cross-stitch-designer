# Cross-Stitch Pattern Designer

## Project Overview

A web app for designing cross-stitch patterns. Think of it like a specialized pixel art editor built around the cross-stitch workflow: grid-based drawing with DMC thread colors, inventory tracking, and pattern management.

### Original Requirements

1. Grid-based interface for creating patterns (similar to Excel but designed for cross stitch)
2. Ability to input and manage DMC thread color inventory
3. Visual representation showing how patterns will look with actual thread colors
4. Ability to save/load patterns

## Tech Stack

- **React 19** + **Vite 6** (no TypeScript, no external state libs)
- All rendering via **Canvas 2D API** (not DOM elements for the grid)
- Zero runtime dependencies beyond React/ReactDOM
- Dark theme with CSS custom properties

## Environment

- Windows (Git Bash / MINGW64)
- Node.js installed via conda: must run `export PATH="/c/Users/sarah/miniforge3:$PATH"` before any npm/node commands
- Dev server: `npm run dev`
- Build: `npm run build` (output ~243KB JS, ~75KB gzipped)

## Architecture

### State Management

- **Context + useReducer** (`PatternContext.jsx`) — single source of truth for pattern state
- Separate dispatch context to avoid unnecessary re-renders
- Pattern state includes: grid data, palette, active tool, grid dimensions, dirty flag, undo/redo stacks
- Thread inventory managed separately via `useLocalStorage` hook in App

### Grid Data Model

- Flat `Uint16Array(width * height)` — palette index 0 = empty cell, 1+ = palette color
- When a palette color is removed, all grid references are shifted down
- Max grid size: 300x300
- Conversion helpers in `src/utils/gridHelpers.js` for serialization (`gridToArray`/`arrayToGrid`)

### Canvas Rendering (`useCanvasGrid` hook)

This is the most complex part of the codebase. Key design decisions:

- **Viewport culling**: only draws cells visible in the current viewport
- **Color batching**: groups cells by color to minimize `fillStyle` changes
- **Mutable refs for interaction state**: pan/paint state lives in `stateRef` (not React state) to avoid re-renders during drag operations
- **Stable callbacks**: all mouse handlers use `useCallback([])` with refs to latest values, preventing re-bindingCanvasRenderingContext2D
- **requestAnimationFrame coalescing**: `requestDraw()` deduplicates via `rafRef`
- **Wheel events**: attached via `addEventListener` with `{ passive: false }` (React synthetic wheel events are passive and can't `preventDefault`). Pinch/Ctrl+scroll = zoom, two-finger scroll = pan.
- **ResizeObserver** managed in a `useEffect` (not the callback ref) so React StrictMode's cleanup/re-run cycle properly recreates it and resets `rafRef.current`

### Rendering Details

- Grid lines appear at cellSize >= 4px; heavy lines every 10 cells at 40% opacity
- Stitch marks (X pattern) appear at cellSize >= 12px
- Grid border always drawn around entire pattern area

### Tools

- **Paint** (P): draw with active palette color, mutates grid ref directly during drag, dispatches batch update on mouseUp. Saves a `gridBeforePaint` snapshot at mouseDown for undo.
- **Erase** (E): same as paint but sets cells to 0
- **Fill** (F): flood fill using stack-based algorithm (`src/utils/floodFill.js`)
- **Pan**: middle-click, shift+left-click, or two-finger trackpad scroll

### Persistence

- `localStorage` via `src/utils/storage.js`
- Patterns stored under key `xstitch-patterns` as JSON array (grid serialized as plain array)
- Inventory stored under key `xstitch-inventory` as array of DMC number strings
- `beforeunload` warns if there are unsaved changes (`dirty` flag)

## File Structure

```
src/
  App.jsx                    # Root component, keyboard shortcuts, layout wiring
  App.css                    # Hover effects for palette remove buttons
  index.css                  # Global styles, dark theme CSS variables, resets
  main.jsx                   # Entry point
  components/
    Layout.jsx               # CSS Grid shell: header, left/right sidebars, canvas area
    Toolbar.jsx              # Tool buttons (paint/erase/fill), undo/redo, grid toggle, fit-to-screen
    GridCanvas.jsx           # Canvas element + event wiring, bridges context to useCanvasGrid
    ColorPalette.jsx         # Active palette display + DMC color picker/search
    ColorSwatch.jsx          # Single color button with selection/indicator states
    InventoryManager.jsx     # Checkbox list of all DMC colors (owned/unowned filtering)
    PatternManager.jsx       # Save/load/new/delete patterns via localStorage
    PatternSettings.jsx      # Pattern name, grid resize, notes
    PreviewModal.jsx         # Full preview with color legend and stitch counts
  context/
    PatternContext.jsx       # useReducer state: grid, palette, tool, dimensions, dirty flag, undo/redo stacks
  hooks/
    useCanvasGrid.js         # All canvas rendering + interaction logic
    useLocalStorage.js       # Generic localStorage-backed useState
  utils/
    gridHelpers.js           # createGrid, resizeGrid, serialization
    floodFill.js             # Stack-based flood fill on Uint16Array
    storage.js               # localStorage CRUD for patterns, inventory, settings
  data/
    dmcColors.js             # ~451 DMC thread colors: { dmc, name, hex }
```

### Undo/Redo

- Up to 50 undo levels stored as `{ grid, palette, width, height }` snapshots
- Undoable actions: `SET_CELLS` (paint/erase strokes), `UPDATE_GRID` (flood fill), `RESIZE_GRID`, `REMOVE_PALETTE_COLOR`
- `SET_CELLS` uses `action.previousGrid` (snapshot from mouseDown) because painting mutates `state.grid` in place via refs — the reducer can't use `state.grid` for the undo snapshot
- Stacks cleared on `NEW_PATTERN` and `SET_PATTERN` (load)

## Keyboard Shortcuts

- **P** — Paint tool
- **E** — Erase tool
- **F** — Fill tool
- **G** — Toggle grid lines
- **Ctrl+Z** — Undo
- **Ctrl+Shift+Z** / **Ctrl+Y** — Redo

Shortcuts are ignored when focus is in an input/textarea/select.

## Conventions

- Inline styles throughout (no CSS modules or styled-components)
- CSS custom properties for theming (defined in `index.css :root`)
- No TypeScript — plain `.js` and `.jsx` files
- No test framework configured
- Components are default-exported; hooks and utilities are named exports
- DMC color data is a static array, not fetched from an API

## Known Gotchas

- **StrictMode + canvas**: ResizeObserver and rAF cleanup must reset `rafRef.current = null`, otherwise StrictMode's effect double-fire permanently blocks `requestDraw()`. Observer must live in a `useEffect` (not callback ref) so it's recreated on re-mount.
- **Paint stroke undo**: painting mutates `gridRef.current` (same object as `state.grid`) in place for performance. The undo snapshot must be captured at mouseDown and passed via the dispatch — the reducer cannot use `state.grid` because it's already been mutated by the time `SET_CELLS` fires.
