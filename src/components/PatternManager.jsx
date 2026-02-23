import { useState, useEffect, useRef } from 'react';
import { usePattern, usePatternDispatch } from '../context/PatternContext.jsx';
import { listPatterns, loadPattern, savePattern, deletePattern } from '../utils/storage.js';
import { gridToArray, arrayToGrid } from '../utils/gridHelpers.js';

export default function PatternManager() {
  const state = usePattern();
  const dispatch = usePatternDispatch();
  const [patterns, setPatterns] = useState([]);
  const [showList, setShowList] = useState(false);
  const importRef = useRef(null);

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

  const handleExport = () => {
    const patternData = {
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
    const blob = new Blob([JSON.stringify(patternData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.name || 'pattern'}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
        const imported = { ...data, id: `pattern_${Date.now()}` };
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
        <button
          onClick={handleExport}
          title="Export current pattern as a JSON file"
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            fontSize: 12,
          }}
        >
          Export
        </button>
        <button
          onClick={() => importRef.current.click()}
          title="Import a pattern from a JSON file"
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            fontSize: 12,
          }}
        >
          Import
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
        />
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
