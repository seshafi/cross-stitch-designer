export default function Layout({ header, leftSidebar, rightSidebar, children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: 'var(--header-height) 1fr',
      gridTemplateColumns: 'var(--sidebar-width) 1fr var(--sidebar-width)',
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        gridColumn: '1 / -1',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
      }}>
        {header}
      </div>

      {/* Left Sidebar */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {leftSidebar}
      </div>

      {/* Canvas Area */}
      <div style={{
        background: 'var(--bg-primary)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {children}
      </div>

      {/* Right Sidebar */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {rightSidebar}
      </div>
    </div>
  );
}
