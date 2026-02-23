import { useCallback, useEffect, useRef } from 'react';
import { usePattern, usePatternDispatch } from '../context/PatternContext.jsx';
import { useCanvasGrid } from '../hooks/useCanvasGrid.js';
import { floodFill } from '../utils/floodFill.js';

export default function GridCanvas({ fitRef, zoomRef }) {
  const { width, height, grid, palette, background, showGrid, tool, activePaletteIndex } = usePattern();
  const dispatch = usePatternDispatch();
  const canvasElRef = useRef(null);
  const wheelRef = useRef(null);

  const onCellPaint = useCallback((x, y) => {
    dispatch({ type: 'SET_CELL', x, y, colorIndex: activePaletteIndex + 1 });
  }, [dispatch, activePaletteIndex]);

  const onCellErase = useCallback((x, y) => {
    dispatch({ type: 'SET_CELL', x, y, colorIndex: 0 });
  }, [dispatch]);

  const onFloodFill = useCallback((x, y) => {
    if (palette.length === 0 && tool === 'fill') return;
    const newGrid = new Uint16Array(grid);
    const colorIndex = tool === 'erase' ? 0 : activePaletteIndex + 1;
    const changed = floodFill(newGrid, width, height, x, y, colorIndex);
    if (changed) {
      dispatch({ type: 'UPDATE_GRID', grid: newGrid });
    }
  }, [grid, width, height, palette, activePaletteIndex, tool, dispatch]);

  const onBatchUpdate = useCallback((gridData, previousGrid) => {
    dispatch({ type: 'SET_CELLS', grid: gridData, previousGrid });
  }, [dispatch]);

  const {
    setupCanvas,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleContextMenu,
    fitToScreen,
    zoom,
  } = useCanvasGrid({
    width,
    height,
    grid,
    palette,
    background,
    showGrid,
    tool,
    activePaletteIndex,
    onCellPaint,
    onCellErase,
    onFloodFill,
    onBatchUpdate,
  });

  // Expose fitToScreen and zoom via refs
  useEffect(() => {
    if (fitRef) fitRef.current = fitToScreen;
    if (zoomRef) zoomRef.current = zoom;
  }, [fitRef, fitToScreen, zoomRef, zoom]);

  // Keep wheel handler ref current so the stable listener uses latest version
  wheelRef.current = handleWheel;

  // One-time canvas mount with stable wheel listener
  const callbackRef = useCallback((el) => {
    if (!el) return;
    canvasElRef.current = el;
    setupCanvas(el);

    // Non-passive wheel listener so preventDefault works
    el.addEventListener('wheel', (e) => {
      if (wheelRef.current) wheelRef.current(e);
    }, { passive: false });
  }, []);// eslint-disable-line -- intentionally run once

  return (
    <canvas
      ref={callbackRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
    />
  );
}
