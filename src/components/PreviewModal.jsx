import { useEffect, useRef, useCallback } from 'react';
import { usePattern } from '../context/PatternContext.jsx';

export default function PreviewModal({ onClose }) {
  const { width, height, grid, palette, name } = usePattern();
  const canvasRef = useRef(null);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const maxW = canvas.parentElement.clientWidth - 40;
    const maxH = window.innerHeight - 200;
    const cellSize = Math.max(1, Math.min(Math.floor(maxW / width), Math.floor(maxH / height)));

    const cw = width * cellSize;
    const ch = height * cellSize;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);

    // Batch by color
    const colorBuckets = new Map();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const val = grid[y * width + x];
        if (val > 0 && val <= palette.length) {
          if (!colorBuckets.has(val)) colorBuckets.set(val, []);
          colorBuckets.get(val).push(x, y);
        }
      }
    }

    for (const [colorIdx, coords] of colorBuckets) {
      const color = palette[colorIdx - 1];
      if (!color) continue;
      ctx.fillStyle = color.hex;
      for (let i = 0; i < coords.length; i += 2) {
        ctx.fillRect(coords[i] * cellSize, coords[i + 1] * cellSize, cellSize, cellSize);
      }
    }

    // Grid border
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, cw, ch);
  }, [width, height, grid, palette]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Stitch counts
  const colorCounts = {};
  for (let i = 0; i < grid.length; i++) {
    const v = grid[i];
    if (v > 0) colorCounts[v] = (colorCounts[v] || 0) + 1;
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          padding: 20,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{name}</h2>
          <button
            onClick={onClose}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
            }}
          >
            Close
          </button>
        </div>

        <div style={{ marginBottom: 12, textAlign: 'center' }}>
          <canvas ref={canvasRef} />
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
          {width} × {height} stitches
        </div>

        {palette.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Color Legend</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {palette.map((color, i) => {
                const count = colorCounts[i + 1] || 0;
                return (
                  <div key={color.dmc} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                  }}>
                    <span style={{
                      width: 18,
                      height: 18,
                      borderRadius: 3,
                      backgroundColor: color.hex,
                      border: '1px solid rgba(255,255,255,0.2)',
                      flexShrink: 0,
                    }} />
                    <span><strong>{color.dmc}</strong></span>
                    <span style={{ color: 'var(--text-secondary)' }}>{color.name}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>
                      {count} stitches
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
