function isLightColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

export default function ColorSwatch({ color, overrideHex, selected, onClick, size = 32, showLabel, indicator }) {
  const effectiveHex = overrideHex || color.hex;
  const light = isLightColor(effectiveHex);
  return (
    <button
      onClick={onClick}
      title={`${color.dmc} - ${color.name}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        backgroundColor: effectiveHex,
        border: selected ? `2px solid var(--accent)` : '1px solid rgba(255,255,255,0.2)',
        borderRadius: 4,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size < 28 ? 8 : 10,
        color: light ? '#000' : '#fff',
        fontWeight: selected ? 700 : 400,
        cursor: 'pointer',
        boxShadow: selected ? '0 0 0 2px var(--accent)' : 'none',
      }}
    >
      {showLabel && color.dmc}
      {indicator && (
        <span style={{
          position: 'absolute',
          top: -3,
          right: -3,
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: indicator,
          border: '1px solid var(--bg-primary)',
        }} />
      )}
    </button>
  );
}
