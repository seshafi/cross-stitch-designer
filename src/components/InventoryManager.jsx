import { useState, useMemo } from 'react';
import { DMC_COLORS } from '../data/dmcColors.js';

export default function InventoryManager({ inventory, setInventory }) {
  const [search, setSearch] = useState('');
  const [showOnly, setShowOnly] = useState('all'); // 'all' | 'owned' | 'unowned'
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    return DMC_COLORS.filter(c => {
      const q = search.toLowerCase();
      const matchesSearch = c.dmc.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (showOnly === 'owned') return inventory.includes(c.dmc);
      if (showOnly === 'unowned') return !inventory.includes(c.dmc);
      return true;
    });
  }, [search, showOnly, inventory]);

  const toggleColor = (dmc) => {
    setInventory(prev =>
      prev.includes(dmc) ? prev.filter(d => d !== dmc) : [...prev, dmc]
    );
  };

  const ownedCount = inventory.length;

  if (!isOpen) {
    return (
      <div style={{ padding: 8 }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '100%',
            padding: '6px 12px',
            borderRadius: 4,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            fontSize: 12,
            textAlign: 'left',
          }}
        >
          Thread Inventory ({ownedCount}/{DMC_COLORS.length})
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 8 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          Inventory ({ownedCount}/{DMC_COLORS.length})
        </span>
        <button
          onClick={() => setIsOpen(false)}
          style={{ fontSize: 12, color: 'var(--text-secondary)' }}
        >
          Close
        </button>
      </div>

      <input
        type="text"
        placeholder="Search DMC colors..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', marginBottom: 6 }}
      />

      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {['all', 'owned', 'unowned'].map(f => (
          <button
            key={f}
            onClick={() => setShowOnly(f)}
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              background: showOnly === f ? 'var(--accent)' : 'var(--bg-surface)',
              color: showOnly === f ? '#fff' : 'var(--text-primary)',
              border: '1px solid var(--border)',
              fontSize: 11,
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{
        maxHeight: 300,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}>
        {filtered.map(color => {
          const owned = inventory.includes(color.dmc);
          return (
            <label
              key={color.dmc}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '3px 6px',
                borderRadius: 3,
                cursor: 'pointer',
                background: owned ? 'rgba(74, 144, 217, 0.1)' : 'transparent',
                fontSize: 12,
              }}
            >
              <input
                type="checkbox"
                checked={owned}
                onChange={() => toggleColor(color.dmc)}
                style={{ accentColor: 'var(--accent)' }}
              />
              <span style={{
                width: 16,
                height: 16,
                borderRadius: 2,
                backgroundColor: color.hex,
                border: '1px solid rgba(255,255,255,0.2)',
                flexShrink: 0,
              }} />
              <span>
                <strong>{color.dmc}</strong> {color.name}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
