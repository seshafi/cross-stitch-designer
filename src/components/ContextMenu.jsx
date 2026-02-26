const MAX_DIM = 300;

export default function ContextMenu({ cell, x, y, width, height, onAction, onClose }) {
  const menuWidth = 210;
  const menuHeight = 220;
  const nudgedX = Math.min(x, window.innerWidth - menuWidth - 8);
  const nudgedY = Math.min(y, window.innerHeight - menuHeight - 8);

  const row = cell.y + 1;
  const col = cell.x + 1;
  const canInsert = width < MAX_DIM && height < MAX_DIM;
  const canInsertRow = height < MAX_DIM;
  const canInsertCol = width < MAX_DIM;
  const canDeleteRow = height > 1;
  const canDeleteCol = width > 1;

  const btn = (label, action, enabled) => (
    <button
      key={action}
      disabled={!enabled}
      onClick={() => { onAction(action); onClose(); }}
      style={{
        display: 'block',
        width: '100%',
        padding: '6px 12px',
        background: 'none',
        border: 'none',
        color: enabled ? 'var(--text-primary)' : 'var(--text-muted)',
        cursor: enabled ? 'pointer' : 'default',
        textAlign: 'left',
        fontSize: '13px',
        borderRadius: '3px',
      }}
      onMouseEnter={e => { if (enabled) e.currentTarget.style.background = 'var(--bg-hover, #333)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
    >
      {label}
    </button>
  );

  return (
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: nudgedX,
        top: nudgedY,
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        zIndex: 1000,
        padding: '4px',
        minWidth: menuWidth,
      }}
    >
      {btn(`Insert row above (row ${row})`, 'insertRowAbove', canInsertRow)}
      {btn(`Insert row below (row ${row})`, 'insertRowBelow', canInsertRow)}
      {btn(`Delete row ${row}`, 'deleteRow', canDeleteRow)}
      <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
      {btn(`Insert column left (col ${col})`, 'insertColLeft', canInsertCol)}
      {btn(`Insert column right (col ${col})`, 'insertColRight', canInsertCol)}
      {btn(`Delete column ${col}`, 'deleteCol', canDeleteCol)}
    </div>
  );
}
