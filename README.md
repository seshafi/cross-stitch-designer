# Cross-Stitch Pattern Designer

A browser-based tool for designing cross-stitch patterns. Draw on a grid with real DMC thread colours, manage your thread inventory, and export patterns to print or share.

**[Try it live →](https://cross-stitch-pro.netlify.app)**

---

## Features

- **Grid canvas** — zoomable, pannable grid up to 300×300 stitches
- **DMC colour library** — search all ~451 DMC thread colours by number or name
- **Thread inventory** — mark which threads you own and filter the colour picker to your stash
- **Drawing tools** — paint, erase, and flood fill; draw straight lines with Shift+click
- **Keyboard painting** — use arrow keys to move and paint one cell at a time
- **Undo/redo** — up to 50 levels
- **Background colour** — set the Aida fabric colour behind unstitched cells
- **Save & load** — patterns stored locally in your browser
- **Export to JSON** — back up or share patterns as files; import on any device
- **Export to PDF** — print-ready pattern with DMC colour legend and stitch counts
- **Pattern preview** — clean view of the finished design

## How to use

Click the **?** button in the top-right corner of the app for a built-in guide covering everything from setting up your inventory to saving and sharing patterns.

## Running locally

```bash
npm install
npm run dev
```

Requires Node.js. Open [http://localhost:5173](http://localhost:5173).

## Tech

- React 19 + Vite 6
- Canvas 2D API for all grid rendering
- No runtime dependencies beyond React
