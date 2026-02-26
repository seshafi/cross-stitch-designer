import { useCallback, useEffect, useRef, useState } from 'react';
import { usePattern, usePatternDispatch } from '../context/PatternContext.jsx';
import { useCanvasGrid } from '../hooks/useCanvasGrid.js';
import { floodFill } from '../utils/floodFill.js';
import { insertRow, deleteRow, insertColumn, deleteColumn } from '../utils/gridHelpers.js';
import ContextMenu from './ContextMenu.jsx';

export default function GridCanvas({ fitRef, zoomRef, colorOverrides }) {
  const { width, height, grid, palette, background, showGrid, tool, activePaletteIndex } = usePattern();
  const dispatch = usePatternDispatch();
  const canvasElRef = useRef(null);
  const wheelRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);

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

  const onContextMenu = useCallback(({ cell, clientX, clientY }) => {
    setContextMenu({ cell, x: clientX, y: clientY });
  }, []);

  const handleMenuAction = useCallback((action) => {
    const { cell } = contextMenu;
    let newGrid, newWidth, newHeight;
    if (action === 'insertRowAbove') {
      newGrid = insertRow(grid, width, height, cell.y);
      newWidth = width; newHeight = height + 1;
    } else if (action === 'insertRowBelow') {
      newGrid = insertRow(grid, width, height, cell.y + 1);
      newWidth = width; newHeight = height + 1;
    } else if (action === 'deleteRow') {
      newGrid = deleteRow(grid, width, height, cell.y);
      newWidth = width; newHeight = height - 1;
    } else if (action === 'insertColLeft') {
      newGrid = insertColumn(grid, width, height, cell.x);
      newWidth = width + 1; newHeight = height;
    } else if (action === 'insertColRight') {
      newGrid = insertColumn(grid, width, height, cell.x + 1);
      newWidth = width + 1; newHeight = height;
    } else if (action === 'deleteCol') {
      newGrid = deleteColumn(grid, width, height, cell.x);
      newWidth = width - 1; newHeight = height;
    }
    if (newGrid) {
      dispatch({ type: 'RESIZE_GRID', grid: newGrid, width: newWidth, height: newHeight });
    }
  }, [contextMenu, grid, width, height, dispatch]);

  const closeMenu = useCallback(() => setContextMenu(null), []);

  // Close on outside mousedown or Escape
  useEffect(() => {
    if (!contextMenu) return;
    const onMouseDown = () => setContextMenu(null);
    const onKeyDown = (e) => { if (e.key === 'Escape') setContextMenu(null); };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [contextMenu]);

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
    colorOverrides,
    onCellPaint,
    onCellErase,
    onFloodFill,
    onBatchUpdate,
    onContextMenu,
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
    <>
      <canvas
        ref={callbackRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
      />
      {contextMenu && (
        <ContextMenu
          cell={contextMenu.cell}
          x={contextMenu.x}
          y={contextMenu.y}
          width={width}
          height={height}
          onAction={handleMenuAction}
          onClose={closeMenu}
        />
      )}
    </>
  );
}
