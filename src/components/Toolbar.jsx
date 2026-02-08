import { usePattern, usePatternDispatch } from '../context/PatternContext.jsx';

const TOOLS = [
  { id: 'paint', label: 'Paint', shortcut: 'P', icon: '✏' },
  { id: 'erase', label: 'Erase', shortcut: 'E', icon: '◻' },
  { id: 'fill', label: 'Fill', shortcut: 'F', icon: '◆' },
];

export default function Toolbar({ onFitToScreen, onToggleGrid, onUndo, onRedo, canUndo, canRedo }) {
  const { tool, showGrid } = usePattern();
  const dispatch = usePatternDispatch();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '0 8px',
      height: '100%',
    }}>
      {TOOLS.map(t => (
        <button
          key={t.id}
          onClick={() => dispatch({ type: 'SET_TOOL', tool: t.id })}
          title={`${t.label} (${t.shortcut})`}
          style={{
            padding: '4px 10px',
            borderRadius: 4,
            background: tool === t.id ? 'var(--accent)' : 'var(--bg-surface)',
            color: tool === t.id ? '#fff' : 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontSize: 13,
          }}
        >
          {t.icon} {t.label}
        </button>
      ))}
      <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        style={{
          padding: '4px 10px',
          borderRadius: 4,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          fontSize: 13,
          opacity: canUndo ? 1 : 0.4,
        }}
      >
        Undo
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
        style={{
          padding: '4px 10px',
          borderRadius: 4,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          fontSize: 13,
          opacity: canRedo ? 1 : 0.4,
        }}
      >
        Redo
      </button>
      <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
      <button
        onClick={onToggleGrid}
        title="Toggle Grid (G)"
        style={{
          padding: '4px 10px',
          borderRadius: 4,
          background: showGrid ? 'var(--bg-hover)' : 'var(--bg-surface)',
          border: '1px solid var(--border)',
          fontSize: 13,
        }}
      >
        Grid
      </button>
      <button
        onClick={onFitToScreen}
        title="Fit to Screen"
        style={{
          padding: '4px 10px',
          borderRadius: 4,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          fontSize: 13,
        }}
      >
        Fit
      </button>
    </div>
  );
}
