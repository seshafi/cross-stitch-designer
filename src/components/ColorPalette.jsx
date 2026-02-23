import { useState } from 'react';
import { usePattern, usePatternDispatch } from '../context/PatternContext.jsx';
import { DMC_COLORS } from '../data/dmcColors.js';
import ColorSwatch from './ColorSwatch.jsx';

export default function ColorPalette({ inventory }) {
  const { palette, activePaletteIndex } = usePattern();
  const dispatch = usePatternDispatch();
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);

  const filteredDmc = DMC_COLORS.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = c.dmc.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
    const matchesStock = !inStockOnly || !inventory || inventory.includes(c.dmc);
    return matchesSearch && matchesStock;
  });

  const addColor = (color) => {
    dispatch({ type: 'ADD_PALETTE_COLOR', color });
  };

  const removeColor = (index) => {
    dispatch({ type: 'REMOVE_PALETTE_COLOR', index });
  };

  return (
    <div style={{ padding: 8 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Palette</span>
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={{
            padding: '2px 8px',
            borderRadius: 4,
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 12,
          }}
        >
          {showPicker ? 'Close' : '+ Add'}
        </button>
      </div>

      {palette.length === 0 && !showPicker && (
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
          No colors yet. Click "+ Add" to add DMC colors.
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {palette.map((color, i) => {
          const owned = !inventory || inventory.length === 0 || inventory.includes(color.dmc);
          return (
            <div key={color.dmc} style={{ position: 'relative' }}>
              <ColorSwatch
                color={color}
                selected={i === activePaletteIndex}
                onClick={() => dispatch({ type: 'SET_ACTIVE_COLOR', index: i })}
                size={34}
                showLabel
                indicator={!owned ? 'var(--danger)' : null}
              />
              <button
                onClick={(e) => { e.stopPropagation(); removeColor(i); }}
                title="Remove color"
                className="remove-btn"
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  width: 15,
                  height: 15,
                  borderRadius: '50%',
                  background: 'var(--danger)',
                  color: '#fff',
                  fontSize: 9,
                  border: '1px solid var(--bg-primary)',
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {showPicker && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
          <input
            type="text"
            placeholder="Search DMC colors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', marginBottom: 6 }}
          />
          {inventory && inventory.length > 0 && (
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--text-secondary)',
              marginBottom: 8,
              cursor: 'pointer',
              userSelect: 'none',
            }}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              In stock only
            </label>
          )}
          <div style={{
            maxHeight: 200,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}>
            {filteredDmc.slice(0, 50).map(color => {
              const inPalette = palette.some(p => p.dmc === color.dmc);
              return (
                <button
                  key={color.dmc}
                  onClick={() => !inPalette && addColor(color)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: inPalette ? 'var(--bg-hover)' : 'transparent',
                    opacity: inPalette ? 0.5 : 1,
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span style={{
                    width: 20,
                    height: 20,
                    borderRadius: 3,
                    backgroundColor: color.hex,
                    border: '1px solid rgba(255,255,255,0.2)',
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12 }}>
                    <strong>{color.dmc}</strong> {color.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
