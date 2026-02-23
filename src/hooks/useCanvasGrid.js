import { useRef, useEffect, useCallback } from 'react';

const MIN_CELL_SIZE = 1;
const MAX_CELL_SIZE = 80;
const GRID_LINE_THRESHOLD = 4;
const STITCH_MARK_THRESHOLD = 12;
const HEAVY_LINE_INTERVAL = 10;

export function useCanvasGrid({
  width: gridWidth,
  height: gridHeight,
  grid,
  palette,
  showGrid,
  tool,
  activePaletteIndex,
  onCellPaint,
  onCellErase,
  onFloodFill,
  onBatchUpdate,
}) {
  const canvasRef = useRef(null);
  const observerRef = useRef(null);
  const stateRef = useRef({
    cellSize: 15,
    offsetX: 0,
    offsetY: 0,
    isPanning: false,
    isPainting: false,
    panStartX: 0,
    panStartY: 0,
    panOffsetStartX: 0,
    panOffsetStartY: 0,
    lastPaintX: -1,
    lastPaintY: -1,
    paintedCells: null,
    canvasWidth: 0,
    canvasHeight: 0,
    dpr: 1,
    hasInitialFit: false,
    cursor: null,     // { x, y } keyboard cursor / line-draw origin
  });

  const gridRef = useRef(grid);
  const rafRef = useRef(null);

  // Keep refs to latest callbacks to avoid stale closures
  const callbacksRef = useRef({ onFloodFill, onBatchUpdate, tool, activePaletteIndex, palette });
  callbacksRef.current = { onFloodFill, onBatchUpdate, tool, activePaletteIndex, palette };

  // Keep grid dimensions in a ref for the draw function
  const dimsRef = useRef({ gridWidth, gridHeight });
  dimsRef.current = { gridWidth, gridHeight };

  const showGridRef = useRef(showGrid);
  showGridRef.current = showGrid;

  const paletteRef = useRef(palette);
  paletteRef.current = palette;

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;
    const { cellSize, offsetX, offsetY, canvasWidth, canvasHeight, dpr } = s;
    const g = gridRef.current;
    const { gridWidth: gw, gridHeight: gh } = dimsRef.current;
    const pal = paletteRef.current;
    const sg = showGridRef.current;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const startCol = Math.max(0, Math.floor(-offsetX / cellSize));
    const endCol = Math.min(gw, Math.ceil((canvasWidth - offsetX) / cellSize));
    const startRow = Math.max(0, Math.floor(-offsetY / cellSize));
    const endRow = Math.min(gh, Math.ceil((canvasHeight - offsetY) / cellSize));

    if (startCol >= endCol || startRow >= endRow) return;

    // Draw background for visible grid area
    const gridPixelX = offsetX + startCol * cellSize;
    const gridPixelY = offsetY + startRow * cellSize;
    const gridPixelW = (endCol - startCol) * cellSize;
    const gridPixelH = (endRow - startRow) * cellSize;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gridPixelX, gridPixelY, gridPixelW, gridPixelH);

    // Batch cells by color to minimize fillStyle changes
    const colorBuckets = new Map();
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const val = g[row * gw + col];
        if (val > 0 && val <= pal.length) {
          if (!colorBuckets.has(val)) colorBuckets.set(val, []);
          colorBuckets.get(val).push(col, row);
        }
      }
    }

    for (const [colorIdx, coords] of colorBuckets) {
      const color = pal[colorIdx - 1];
      if (!color) continue;
      ctx.fillStyle = color.hex;
      for (let i = 0; i < coords.length; i += 2) {
        const cx = coords[i];
        const cy = coords[i + 1];
        ctx.fillRect(
          offsetX + cx * cellSize,
          offsetY + cy * cellSize,
          cellSize,
          cellSize,
        );
      }
    }

    // Stitch marks when zoomed in
    if (cellSize >= STITCH_MARK_THRESHOLD) {
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = Math.max(1, cellSize / 12);
      const pad = cellSize * 0.2;
      for (const [, coords] of colorBuckets) {
        for (let i = 0; i < coords.length; i += 2) {
          const cx = coords[i];
          const cy = coords[i + 1];
          const px = offsetX + cx * cellSize;
          const py = offsetY + cy * cellSize;
          ctx.beginPath();
          ctx.moveTo(px + pad, py + pad);
          ctx.lineTo(px + cellSize - pad, py + cellSize - pad);
          ctx.moveTo(px + cellSize - pad, py + pad);
          ctx.lineTo(px + pad, py + cellSize - pad);
          ctx.stroke();
        }
      }
    }

    // Grid lines
    if (sg && cellSize >= GRID_LINE_THRESHOLD) {
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      for (let col = startCol; col <= endCol; col++) {
        if (col % HEAVY_LINE_INTERVAL === 0) continue;
        const x = offsetX + col * cellSize;
        ctx.moveTo(x, gridPixelY);
        ctx.lineTo(x, gridPixelY + gridPixelH);
      }
      for (let row = startRow; row <= endRow; row++) {
        if (row % HEAVY_LINE_INTERVAL === 0) continue;
        const y = offsetY + row * cellSize;
        ctx.moveTo(gridPixelX, y);
        ctx.lineTo(gridPixelX + gridPixelW, y);
      }
      ctx.stroke();

      // Heavy lines every 10
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      for (let col = startCol; col <= endCol; col++) {
        if (col % HEAVY_LINE_INTERVAL !== 0) continue;
        const x = offsetX + col * cellSize;
        ctx.moveTo(x, gridPixelY);
        ctx.lineTo(x, gridPixelY + gridPixelH);
      }
      for (let row = startRow; row <= endRow; row++) {
        if (row % HEAVY_LINE_INTERVAL !== 0) continue;
        const y = offsetY + row * cellSize;
        ctx.moveTo(gridPixelX, y);
        ctx.lineTo(gridPixelX + gridPixelW, y);
      }
      ctx.stroke();
    }

    // Border around entire grid
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, gw * cellSize, gh * cellSize);

    // Keyboard cursor highlight (hidden in fill mode)
    const cur = s.cursor;
    if (cur && callbacksRef.current.tool !== 'fill' && cur.x >= startCol && cur.x < endCol && cur.y >= startRow && cur.y < endRow) {
      const lw = Math.max(2, Math.min(4, cellSize / 6));
      ctx.strokeStyle = '#2196F3';
      ctx.lineWidth = lw;
      ctx.strokeRect(
        offsetX + cur.x * cellSize + lw / 2,
        offsetY + cur.y * cellSize + lw / 2,
        cellSize - lw,
        cellSize - lw,
      );
    }

  }, []); // stable — reads from refs

  const requestDraw = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      draw();
    });
  }, [draw]);

  // Convert canvas coords to grid cell
  const canvasToCell = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const s = stateRef.current;
    const { gridWidth: gw, gridHeight: gh } = dimsRef.current;
    const x = (clientX - rect.left - s.offsetX) / s.cellSize;
    const y = (clientY - rect.top - s.offsetY) / s.cellSize;
    const col = Math.floor(x);
    const row = Math.floor(y);
    if (col < 0 || col >= gw || row < 0 || row >= gh) return null;
    return { x: col, y: row };
  }, []);

  const paintCell = useCallback((x, y) => {
    const s = stateRef.current;
    if (x === s.lastPaintX && y === s.lastPaintY) return;
    s.lastPaintX = x;
    s.lastPaintY = y;

    const g = gridRef.current;
    const { tool: t, activePaletteIndex: api, palette: pal } = callbacksRef.current;
    const { gridWidth: gw } = dimsRef.current;
    const colorIndex = api + 1;

    if (t === 'paint') {
      if (pal.length === 0) return;
      if (g[y * gw + x] === colorIndex) return;
      g[y * gw + x] = colorIndex;
      if (s.paintedCells) s.paintedCells.add(`${x},${y}`);
      s.cursor = { x, y };
      requestDraw();
    } else if (t === 'erase') {
      if (g[y * gw + x] === 0) return;
      g[y * gw + x] = 0;
      if (s.paintedCells) s.paintedCells.add(`${x},${y}`);
      s.cursor = { x, y };
      requestDraw();
    }
  }, [requestDraw]);

  // Mouse handlers — all stable via refs
  const handleMouseDown = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;
    const { tool: t, onFloodFill: fill } = callbacksRef.current;

    // Middle click or Ctrl+left-drag = pan
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      e.preventDefault();
      s.isPanning = true;
      s.panStartX = e.clientX;
      s.panStartY = e.clientY;
      s.panOffsetStartX = s.offsetX;
      s.panOffsetStartY = s.offsetY;
      canvas.style.cursor = 'grabbing';
      return;
    }

    if (e.button !== 0) return;
    const cell = canvasToCell(e.clientX, e.clientY);
    if (!cell) return;

    // Shift+left-click = draw line from last cursor position (paint/erase only)
    if (e.shiftKey && (t === 'paint' || t === 'erase')) {
      const origin = s.cursor;
      if (origin && (cell.x === origin.x || cell.y === origin.y)) {
        const { activePaletteIndex: api, palette: pal, onBatchUpdate } = callbacksRef.current;
        if (t === 'paint' && pal.length === 0) return;
        const g = gridRef.current;
        const { gridWidth: gw } = dimsRef.current;
        const prev = new Uint16Array(g);
        const colorIndex = t === 'paint' ? api + 1 : 0;
        if (cell.y === origin.y) {
          const minX = Math.min(origin.x, cell.x), maxX = Math.max(origin.x, cell.x);
          for (let x = minX; x <= maxX; x++) g[origin.y * gw + x] = colorIndex;
        } else {
          const minY = Math.min(origin.y, cell.y), maxY = Math.max(origin.y, cell.y);
          for (let y = minY; y <= maxY; y++) g[y * gw + origin.x] = colorIndex;
        }
        onBatchUpdate(g, prev);
        s.cursor = { x: cell.x, y: cell.y };
        requestDraw();
      }
      return;
    }

    // Regular left click = paint/erase/fill
    if (t === 'fill') {
      fill(cell.x, cell.y);
      return;
    }

    s.isPainting = true;
    s.lastPaintX = -1;
    s.lastPaintY = -1;
    s.paintedCells = new Set();
    s.gridBeforePaint = new Uint16Array(gridRef.current);
    paintCell(cell.x, cell.y);
  }, [canvasToCell, paintCell, requestDraw]);

  const handleMouseMove = useCallback((e) => {
    const s = stateRef.current;

    if (s.isPanning) {
      s.offsetX = s.panOffsetStartX + (e.clientX - s.panStartX);
      s.offsetY = s.panOffsetStartY + (e.clientY - s.panStartY);
      requestDraw();
      return;
    }

    if (s.isPainting) {
      const cell = canvasToCell(e.clientX, e.clientY);
      if (cell) paintCell(cell.x, cell.y);
    }
  }, [canvasToCell, paintCell, requestDraw]);

  const handleMouseUp = useCallback(() => {
    const canvas = canvasRef.current;
    const s = stateRef.current;

    if (s.isPanning) {
      s.isPanning = false;
      if (canvas) canvas.style.cursor = '';
      return;
    }

    if (s.isPainting) {
      s.isPainting = false;
      if (s.paintedCells && s.paintedCells.size > 0) {
        callbacksRef.current.onBatchUpdate(gridRef.current, s.gridBeforePaint);
      }
      s.paintedCells = null;
      s.gridBeforePaint = null;
    }
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (e.ctrlKey || e.metaKey) {
      // Pinch-to-zoom (trackpad) or Ctrl+scroll (mouse)
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const oldCellSize = s.cellSize;
      const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newCellSize = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, oldCellSize * zoomFactor));

      const worldX = (mouseX - s.offsetX) / oldCellSize;
      const worldY = (mouseY - s.offsetY) / oldCellSize;
      s.cellSize = newCellSize;
      s.offsetX = mouseX - worldX * newCellSize;
      s.offsetY = mouseY - worldY * newCellSize;
    } else {
      // Two-finger scroll = pan
      s.offsetX -= e.deltaX;
      s.offsetY -= e.deltaY;
    }

    requestDraw();
  }, [requestDraw]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Move keyboard cursor and paint/erase the destination cell
  const moveCursorAndPaint = useCallback((dx, dy) => {
    const s = stateRef.current;
    if (!s.cursor) return;
    if (callbacksRef.current.tool === 'fill') return;
    const { gridWidth: gw, gridHeight: gh } = dimsRef.current;
    const nx = Math.max(0, Math.min(gw - 1, s.cursor.x + dx));
    const ny = Math.max(0, Math.min(gh - 1, s.cursor.y + dy));
    s.cursor = { x: nx, y: ny };

    const { tool: t, activePaletteIndex: api, palette: pal, onBatchUpdate } = callbacksRef.current;
    const g = gridRef.current;

    if (t === 'paint' && pal.length > 0) {
      const prev = new Uint16Array(g);
      g[ny * gw + nx] = api + 1;
      onBatchUpdate(g, prev);
    } else if (t === 'erase') {
      const prev = new Uint16Array(g);
      g[ny * gw + nx] = 0;
      onBatchUpdate(g, prev);
    }

    // Scroll to keep cursor visible (1-cell margin)
    const margin = s.cellSize;
    const px = s.offsetX + nx * s.cellSize;
    const py = s.offsetY + ny * s.cellSize;
    if (px < margin) s.offsetX += margin - px;
    else if (px + s.cellSize > s.canvasWidth - margin) s.offsetX -= (px + s.cellSize) - (s.canvasWidth - margin);
    if (py < margin) s.offsetY += margin - py;
    else if (py + s.cellSize > s.canvasHeight - margin) s.offsetY -= (py + s.cellSize) - (s.canvasHeight - margin);

    requestDraw();
  }, [requestDraw]);

  // Arrow key + Escape handling for keyboard cursor
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      switch (e.key) {
        case 'ArrowLeft':  e.preventDefault(); moveCursorAndPaint(-1,  0); break;
        case 'ArrowRight': e.preventDefault(); moveCursorAndPaint( 1,  0); break;
        case 'ArrowUp':    e.preventDefault(); moveCursorAndPaint( 0, -1); break;
        case 'ArrowDown':  e.preventDefault(); moveCursorAndPaint( 0,  1); break;
        case 'Escape':
          stateRef.current.cursor = null;
          requestDraw();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [moveCursorAndPaint, requestDraw]);

  // Zoom centered on canvas center
  const zoom = useCallback((factor) => {
    const s = stateRef.current;
    const centerX = s.canvasWidth / 2;
    const centerY = s.canvasHeight / 2;
    const oldCellSize = s.cellSize;
    const newCellSize = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, oldCellSize * factor));
    const worldX = (centerX - s.offsetX) / oldCellSize;
    const worldY = (centerY - s.offsetY) / oldCellSize;
    s.cellSize = newCellSize;
    s.offsetX = centerX - worldX * newCellSize;
    s.offsetY = centerY - worldY * newCellSize;
    requestDraw();
  }, [requestDraw]);

  // Fit grid to canvas
  const fitToScreen = useCallback(() => {
    const s = stateRef.current;
    const { gridWidth: gw, gridHeight: gh } = dimsRef.current;
    const padding = 40;
    const availW = s.canvasWidth - padding * 2;
    const availH = s.canvasHeight - padding * 2;
    if (availW <= 0 || availH <= 0) return;
    const cellW = availW / gw;
    const cellH = availH / gh;
    s.cellSize = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, Math.min(cellW, cellH)));
    s.offsetX = (s.canvasWidth - gw * s.cellSize) / 2;
    s.offsetY = (s.canvasHeight - gh * s.cellSize) / 2;
    requestDraw();
  }, [requestDraw]);

  // Setup canvas ref only — sizing/observer managed by effect below
  const setupCanvas = useCallback((canvas) => {
    if (!canvas) return;
    canvasRef.current = canvas;
  }, []);

  // Canvas sizing and ResizeObserver — managed as a proper effect so
  // React StrictMode's cleanup/re-run cycle works correctly
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const s = stateRef.current;
    const dpr = window.devicePixelRatio || 1;
    s.dpr = dpr;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      s.canvasWidth = rect.width;
      s.canvasHeight = rect.height;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      requestDraw();
    };

    const observer = new ResizeObserver(updateSize);
    observerRef.current = observer;
    observer.observe(canvas);
    updateSize();

    if (!s.hasInitialFit) {
      s.hasInitialFit = true;
      fitToScreen();
    }

    return () => {
      observer.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [requestDraw, fitToScreen]);

  // Re-draw when dependencies change
  useEffect(() => {
    requestDraw();
  }, [grid, palette, showGrid, requestDraw]);

  // Recenter when grid dimensions change
  useEffect(() => {
    fitToScreen();
  }, [gridWidth, gridHeight, fitToScreen]);

  return {
    canvasRef,
    setupCanvas,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleContextMenu,
    fitToScreen,
    zoom,
  };
}
