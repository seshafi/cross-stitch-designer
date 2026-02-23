import { useRef, useState, useEffect, useCallback } from 'react';
import { PatternProvider, usePattern, usePatternDispatch } from './context/PatternContext.jsx';
import Layout from './components/Layout.jsx';
import Toolbar from './components/Toolbar.jsx';
import GridCanvas from './components/GridCanvas.jsx';
import ColorPalette from './components/ColorPalette.jsx';
import PatternManager from './components/PatternManager.jsx';
import PatternSettings from './components/PatternSettings.jsx';
import InventoryManager from './components/InventoryManager.jsx';
import PreviewModal from './components/PreviewModal.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import './App.css';

function AppInner() {
  const { dirty, name, undoStack, redoStack } = usePattern();
  const dispatch = usePatternDispatch();
  const fitRef = useRef(null);
  const zoomRef = useRef(null);
  const [inventory, setInventory] = useLocalStorage('xstitch-inventory', []);
  const [showPreview, setShowPreview] = useState(false);

  const handleFitToScreen = useCallback(() => {
    if (fitRef.current) fitRef.current();
  }, []);

  const handleZoomIn = useCallback(() => {
    if (zoomRef.current) zoomRef.current(1.25);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (zoomRef.current) zoomRef.current(1 / 1.25);
  }, []);

  const handleToggleGrid = useCallback(() => {
    dispatch({ type: 'TOGGLE_GRID' });
  }, [dispatch]);

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Don't handle shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      // Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y for undo/redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            dispatch({ type: 'REDO' });
          } else {
            dispatch({ type: 'UNDO' });
          }
          return;
        }
        if (e.key === 'y') {
          e.preventDefault();
          dispatch({ type: 'REDO' });
          return;
        }
      }

      switch (e.key.toLowerCase()) {
        case 'p':
          dispatch({ type: 'SET_TOOL', tool: 'paint' });
          break;
        case 'e':
          dispatch({ type: 'SET_TOOL', tool: 'erase' });
          break;
        case 'f':
          dispatch({ type: 'SET_TOOL', tool: 'fill' });
          break;
        case 'g':
          handleToggleGrid();
          break;
        case '=':
        case '+':
          // Zoom in handled by canvas wheel
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch, handleToggleGrid]);

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const header = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      gap: 12,
    }}>
      <div style={{
        padding: '0 12px',
        fontWeight: 700,
        fontSize: 15,
        whiteSpace: 'nowrap',
        color: 'var(--accent)',
      }}>
        Cross-Stitch Designer
      </div>
      <Toolbar
        onFitToScreen={handleFitToScreen}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleGrid={handleToggleGrid}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
      />
      <div style={{ marginLeft: 'auto', paddingRight: 12, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setShowPreview(true)}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            fontSize: 13,
          }}
        >
          Preview
        </button>
      </div>
    </div>
  );

  const leftSidebar = (
    <>
      <ColorPalette inventory={inventory} />
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <InventoryManager inventory={inventory} setInventory={setInventory} />
      </div>
    </>
  );

  const rightSidebar = (
    <>
      <PatternManager />
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <PatternSettings />
      </div>
    </>
  );

  return (
    <>
      <Layout
        header={header}
        leftSidebar={leftSidebar}
        rightSidebar={rightSidebar}
      >
        <GridCanvas fitRef={fitRef} zoomRef={zoomRef} />
      </Layout>
      {showPreview && <PreviewModal onClose={() => setShowPreview(false)} />}
    </>
  );
}

export default function App() {
  return (
    <PatternProvider>
      <AppInner />
    </PatternProvider>
  );
}
