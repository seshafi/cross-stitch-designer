import { useState } from 'react';
import { usePattern, usePatternDispatch } from '../context/PatternContext.jsx';
import { resizeGrid } from '../utils/gridHelpers.js';

export default function PatternSettings() {
  const { name, width, height, notes } = usePattern();
  const dispatch = usePatternDispatch();
  const state = usePattern();

  const [newWidth, setNewWidth] = useState(width);
  const [newHeight, setNewHeight] = useState(height);

  const handleResize = () => {
    const w = Math.max(1, Math.min(300, parseInt(newWidth) || width));
    const h = Math.max(1, Math.min(300, parseInt(newHeight) || height));
    if (w === width && h === height) return;
    const newGrid = resizeGrid(state.grid, width, height, w, h);
    dispatch({ type: 'RESIZE_GRID', width: w, height: h, grid: newGrid });
    setNewWidth(w);
    setNewHeight(h);
  };

  return (
    <div style={{ padding: 8 }}>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Settings</span>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>
          Pattern Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => dispatch({ type: 'SET_NAME', name: e.target.value })}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>
          Grid Size (max 300)
        </label>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input
            type="number"
            min="1"
            max="300"
            value={newWidth}
            onChange={(e) => setNewWidth(e.target.value)}
            style={{ width: 60 }}
          />
          <span>×</span>
          <input
            type="number"
            min="1"
            max="300"
            value={newHeight}
            onChange={(e) => setNewHeight(e.target.value)}
            style={{ width: 60 }}
          />
          <button
            onClick={handleResize}
            disabled={parseInt(newWidth) === width && parseInt(newHeight) === height}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 12,
              opacity: parseInt(newWidth) === width && parseInt(newHeight) === height ? 0.5 : 1,
            }}
          >
            Resize
          </button>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          Current: {width}×{height}
        </span>
      </div>

      <div>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => dispatch({ type: 'SET_NOTES', notes: e.target.value })}
          rows={3}
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>
    </div>
  );
}
