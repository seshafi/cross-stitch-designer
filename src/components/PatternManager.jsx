import { useState, useEffect, useRef } from 'react';
import { usePattern, usePatternDispatch } from '../context/PatternContext.jsx';
import { listPatterns, loadPattern, savePattern, deletePattern } from '../utils/storage.js';
import { gridToArray } from '../utils/gridHelpers.js';

function buildPatternData(state) {
  return {
    exportVersion: 1,
    id: state.id || `pattern_${Date.now()}`,
    name: state.name,
    width: state.width,
    height: state.height,
    notes: state.notes,
    background: state.background,
    palette: state.palette,
    grid: gridToArray(state.grid),
    createdAt: state.createdAt,
    modifiedAt: Date.now(),
  };
}

const BTN = {
  padding: '4px 10px',
  borderRadius: 4,
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  fontSize: 12,
};

export default function PatternManager({ colorOverrides = {} }) {
  const state = usePattern();
  const resolveHex = (color) => colorOverrides[color.dmc] || color.hex;
  const dispatch = usePatternDispatch();
  const [patterns, setPatterns] = useState([]);
  const [showList, setShowList] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const importRef = useRef(null);
  const exportMenuRef = useRef(null);

  const refreshList = () => setPatterns(listPatterns());

  useEffect(() => { refreshList(); }, []);

  // Close export dropdown on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExportMenu]);

  const handleSave = () => {
    const data = buildPatternData(state);
    const ok = savePattern(data);
    if (ok) {
      dispatch({ type: 'MARK_SAVED', id: data.id });
      refreshList();
    }
  };

  const handleLoad = (id) => {
    const data = loadPattern(id);
    if (!data) return;
    dispatch({ type: 'SET_PATTERN', pattern: data });
    setShowList(false);
  };

  const handleDelete = (id) => {
    deletePattern(id);
    refreshList();
  };

  const handleNew = () => {
    dispatch({ type: 'NEW_PATTERN' });
    setShowList(false);
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.grid || !data.width || !data.height) {
          alert('Invalid pattern file.');
          return;
        }
        const nameFromFile = file.name.replace(/\.json$/i, '');
        const imported = { ...data, id: `pattern_${Date.now()}`, name: nameFromFile };
        savePattern(imported);
        dispatch({ type: 'SET_PATTERN', pattern: imported });
        refreshList();
      } catch {
        alert('Could not read pattern file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportJSON = () => {
    const data = buildPatternData(state);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.name || 'pattern'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportSVG = () => {
    setShowExportMenu(false);
    const { width, height, grid, palette, background, name } = state;
    const cellSize = 10;
    const pad = 24;
    const legendRowH = 20;

    const counts = {};
    for (let i = 0; i < grid.length; i++) {
      const v = grid[i];
      if (v > 0) counts[v] = (counts[v] || 0) + 1;
    }
    const legend = palette
      .map((c, i) => ({ ...c, count: counts[i + 1] || 0 }))
      .filter(c => c.count > 0);

    const gridW = width * cellSize;
    const gridH = height * cellSize;
    const legendH = legend.length > 0 ? pad + legend.length * legendRowH : 0;
    const svgW = gridW + pad * 2;
    const svgH = gridH + pad * 2 + legendH;

    const parts = [];
    parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`);
    parts.push(`<title>${name}</title>`);

    // Background
    parts.push(`<rect x="${pad}" y="${pad}" width="${gridW}" height="${gridH}" fill="${background || '#ffffff'}"/>`);

    // Cells grouped by color for compact output
    const colorGroups = {};
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const val = grid[y * width + x];
        if (val > 0 && val <= palette.length) {
          const hex = resolveHex(palette[val - 1]);
          if (!colorGroups[hex]) colorGroups[hex] = [];
          colorGroups[hex].push([x, y]);
        }
      }
    }
    for (const [hex, cells] of Object.entries(colorGroups)) {
      parts.push(`<g fill="${hex}">`);
      for (const [x, y] of cells) {
        parts.push(`<rect x="${pad + x * cellSize}" y="${pad + y * cellSize}" width="${cellSize}" height="${cellSize}"/>`);
      }
      parts.push(`</g>`);
    }

    // Light grid lines
    const lightPaths = [];
    for (let x = 1; x < width; x++) {
      if (x % 10 !== 0) lightPaths.push(`M${pad + x * cellSize},${pad}V${pad + gridH}`);
    }
    for (let y = 1; y < height; y++) {
      if (y % 10 !== 0) lightPaths.push(`M${pad},${pad + y * cellSize}H${pad + gridW}`);
    }
    if (lightPaths.length) {
      parts.push(`<path d="${lightPaths.join(' ')}" stroke="rgba(0,0,0,0.12)" stroke-width="0.5" fill="none"/>`);
    }

    // Heavy lines every 10
    const heavyPaths = [];
    for (let x = 0; x <= width; x += 10) heavyPaths.push(`M${pad + x * cellSize},${pad}V${pad + gridH}`);
    for (let y = 0; y <= height; y += 10) heavyPaths.push(`M${pad},${pad + y * cellSize}H${pad + gridW}`);
    parts.push(`<path d="${heavyPaths.join(' ')}" stroke="rgba(0,0,0,0.35)" stroke-width="1" fill="none"/>`);

    // Border
    parts.push(`<rect x="${pad}" y="${pad}" width="${gridW}" height="${gridH}" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="1.5"/>`);

    // Legend
    if (legend.length > 0) {
      const ly = pad * 2 + gridH;
      parts.push(`<g font-family="sans-serif" font-size="11">`);
      legend.forEach((c, i) => {
        const ry = ly + i * legendRowH;
        parts.push(`<rect x="${pad}" y="${ry}" width="12" height="12" fill="${resolveHex(c)}" stroke="#bbb" stroke-width="0.5"/>`);
        parts.push(`<text x="${pad + 18}" y="${ry + 10}" fill="#111"><tspan font-weight="bold">DMC ${c.dmc}</tspan> \u2014 ${c.name} (${c.count})</text>`);
      });
      parts.push(`</g>`);
    }

    parts.push(`</svg>`);

    const blob = new Blob([parts.join('\n')], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name || 'pattern'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    setShowExportMenu(false);
    const { width, height, grid, palette, background, name } = state;
    const cellSize = 10;
    const pad = 24;

    const canvas = document.createElement('canvas');
    canvas.width = width * cellSize + pad * 2;
    canvas.height = height * cellSize + pad * 2;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = background || '#ffffff';
    ctx.fillRect(pad, pad, width * cellSize, height * cellSize);

    // Cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const val = grid[y * width + x];
        if (val > 0 && val <= palette.length) {
          ctx.fillStyle = resolveHex(palette[val - 1]);
          ctx.fillRect(pad + x * cellSize, pad + y * cellSize, cellSize, cellSize);
        }
      }
    }

    // Light grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 0; x <= width; x++) {
      if (x % 10 === 0) continue;
      ctx.moveTo(pad + x * cellSize, pad);
      ctx.lineTo(pad + x * cellSize, pad + height * cellSize);
    }
    for (let y = 0; y <= height; y++) {
      if (y % 10 === 0) continue;
      ctx.moveTo(pad, pad + y * cellSize);
      ctx.lineTo(pad + width * cellSize, pad + y * cellSize);
    }
    ctx.stroke();

    // Heavy lines every 10
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 10) {
      ctx.moveTo(pad + x * cellSize, pad);
      ctx.lineTo(pad + x * cellSize, pad + height * cellSize);
    }
    for (let y = 0; y <= height; y += 10) {
      ctx.moveTo(pad, pad + y * cellSize);
      ctx.lineTo(pad + width * cellSize, pad + y * cellSize);
    }
    ctx.stroke();

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad, pad, width * cellSize, height * cellSize);

    // Stitch counts per colour
    const counts = {};
    for (let i = 0; i < grid.length; i++) {
      const v = grid[i];
      if (v > 0) counts[v] = (counts[v] || 0) + 1;
    }
    const legend = palette
      .map((c, i) => ({ ...c, count: counts[i + 1] || 0 }))
      .filter(c => c.count > 0);

    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) { alert('Allow pop-ups to export PDF.'); return; }

    win.document.write(`<!DOCTYPE html><html><head>
<title>${name} — Cross-Stitch Pattern</title>
<style>
  body { margin: 0; padding: 16mm; font-family: sans-serif; color: #111; box-sizing: border-box; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { font-size: 12px; color: #666; margin-bottom: 16px; }
  img { width: 100%; height: auto; display: block; image-rendering: pixelated; margin-bottom: 20px; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 24px; }
  .item { display: flex; align-items: center; gap: 8px; font-size: 12px; min-width: 200px; }
  .swatch { width: 14px; height: 14px; border: 1px solid #bbb; flex-shrink: 0;
            -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @media print {
    @page { margin: 16mm; }
    body { padding: 0; }
    img { width: 100%; height: auto; }
  }
</style></head><body>
<h1>${name}</h1>
<p class="sub">${width} × ${height} stitches &nbsp;·&nbsp; ${legend.length} colour${legend.length !== 1 ? 's' : ''}</p>
<img src="${dataUrl}" />
<div class="legend">${legend.map(c =>
  `<div class="item"><div class="swatch" style="background:${resolveHex(c)};-webkit-print-color-adjust:exact;print-color-adjust:exact"></div><span><b>DMC ${c.dmc}</b> — ${c.name} &nbsp;<span style="color:#888">(${c.count})</span></span></div>`
).join('')}</div>
<script>window.onload=()=>window.print()<\/script>
</body></html>`);
    win.document.close();
  };

  return (
    <div style={{ padding: 8 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Patterns</div>

      {/* Row 1: New, Load, Import */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        <button onClick={handleNew} style={BTN}>New</button>
        <button
          onClick={() => { refreshList(); setShowList(!showList); }}
          style={BTN}
        >
          {showList ? 'Close' : 'Load'}
        </button>
        <button onClick={() => importRef.current.click()} style={BTN}>Import</button>
        <input
          ref={importRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
        />
      </div>

      {/* Row 2: Save, Export (split button) */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <button
          onClick={handleSave}
          style={{ ...BTN, background: 'var(--accent)', color: '#fff', border: 'none' }}
        >
          Save{state.dirty ? ' *' : ''}
        </button>

        {/* Export split button */}
        <div ref={exportMenuRef} style={{ position: 'relative', display: 'flex' }}>
          <button
            onClick={handleExportSVG}
            style={{ ...BTN, borderRadius: '4px 0 0 4px', borderRight: 'none' }}
          >
            Export
          </button>
          <button
            onClick={() => setShowExportMenu(v => !v)}
            title="Export options"
            style={{ ...BTN, borderRadius: '0 4px 4px 0', padding: '4px 7px' }}
          >
            ▾
          </button>
          {showExportMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 2,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              zIndex: 200,
              minWidth: 120,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>
              <button
                onClick={handleExportSVG}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', fontSize: 12 }}
              >
                SVG
              </button>
              <button
                onClick={handleExportJSON}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', fontSize: 12 }}
              >
                JSON
              </button>
              <button
                onClick={handleExportPDF}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', fontSize: 12 }}
              >
                PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Saved pattern list */}
      {showList && (
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          {patterns.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No saved patterns.</p>
          )}
          {patterns.map(p => (
            <div key={p.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              borderRadius: 4,
              background: 'var(--bg-surface)',
              border: p.id === state.id ? '1px solid var(--accent)' : '1px solid var(--border)',
            }}>
              <button
                onClick={() => handleLoad(p.id)}
                style={{ textAlign: 'left', flex: 1, fontSize: 12 }}
              >
                <div style={{ fontWeight: 500 }}>{p.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{p.width}×{p.height}</div>
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                title="Delete pattern"
                style={{ color: 'var(--danger)', fontSize: 14, padding: '0 4px' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
