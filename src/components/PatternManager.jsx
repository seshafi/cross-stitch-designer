import { useState, useEffect } from 'react';
import { usePattern, usePatternDispatch } from '../context/PatternContext.jsx';
import { listPatterns, loadPattern, savePattern, deletePattern } from '../utils/storage.js';
import { gridToArray, arrayToGrid } from '../utils/gridHelpers.js';

export default function PatternManager() {
  const state = usePattern();
  const dispatch = usePatternDispatch();
  const [patterns, setPatterns] = useState([]);
  const [showList, setShowList] = useState(false);

  const refreshList = () => {
    setPatterns(listPatterns());
  };

  useEffect(() => {
    refreshList();
  }, []);

  const handleSave = () => {
    const id = state.id || `pattern_${Date.now()}`;
    const patternData = {
      id,
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
    const ok = savePattern(patternData);
    if (ok) {
      dispatch({ type: 'MARK_SAVED', id });
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

  return (
    <div style={{ padding: 8 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Patterns</span>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        <button
          onClick={handleSave}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 12,
          }}
        >
          Save{state.dirty ? ' *' : ''}
        </button>
        <button
          onClick={handleNew}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            fontSize: 12,
          }}
        >
          New
        </button>
        <button
          onClick={() => { refreshList(); setShowList(!showList); }}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            fontSize: 12,
          }}
        >
          {showList ? 'Close' : 'Load'}
        </button>
      </div>

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
                style={{
                  textAlign: 'left',
                  flex: 1,
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 500 }}>{p.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                  {p.width}×{p.height}
                </div>
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                title="Delete pattern"
                style={{
                  color: 'var(--danger)',
                  fontSize: 14,
                  padding: '0 4px',
                }}
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
