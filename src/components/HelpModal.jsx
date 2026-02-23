export default function HelpModal({ onClose }) {
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
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 24,
          width: 580,
          maxWidth: '95vw',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>How to use Cross-Stitch Designer</h2>
          <button
            onClick={onClose}
            style={{ padding: '4px 12px', borderRadius: 4, background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: 13 }}
          >
            Close
          </button>
        </div>

        <Section title="1. Start a pattern">
          <p>
            When you open the app a blank 50×50 grid is ready to go. To change the size, head to the
            <strong> Settings panel</strong> on the right — you can resize up to 300×300 at any time
            without losing your work. Give your pattern a name while you're there, and optionally
            set the <strong>background colour</strong> to match your Aida fabric.
          </p>
          <p>
            Use <strong>New</strong> in the Patterns panel to start fresh whenever you like.
          </p>
        </Section>

        <Section title="2. Build your thread inventory">
          <p>
            Open the <strong>Inventory</strong> section in the left panel and tick off every DMC
            thread colour you own. This is optional, but worth doing — once your inventory is set
            up you can filter the colour picker to show only the threads you actually have,
            making it much easier to plan a pattern around your stash.
          </p>
        </Section>

        <Section title="3. Choose your colours">
          <p>
            Use the <strong>colour picker</strong> at the top of the left panel to search for DMC
            colours by number or name. Toggle <em>In stock</em> to filter by your inventory.
            Click a colour to add it to your pattern palette.
          </p>
          <p>
            Click any colour in your palette to make it the <strong>active colour</strong> for
            painting. To remove a colour, hover over it and click ×. Any cells painted with that
            colour will be cleared.
          </p>
        </Section>

        <Section title="4. Paint your pattern">
          <p>
            Three tools live in the toolbar — switch between them with the buttons or keyboard shortcuts:
          </p>
          <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li><strong>Paint (P)</strong> — click and drag to colour cells.</li>
            <li><strong>Erase (E)</strong> — click and drag to clear cells.</li>
            <li><strong>Fill (F)</strong> — click a cell to flood-fill the connected area with the active colour.</li>
          </ul>
          <p>
            <strong>Drawing lines:</strong> with Paint or Erase active, click a cell to mark it as
            your origin (shown with a blue outline). Then <strong>Shift+click</strong> any cell in
            the same row or column to fill the entire line between them in one go.
          </p>
          <p>
            <strong>Keyboard painting:</strong> once a cell is selected (blue outline), use the
            <strong> arrow keys</strong> to move and paint one cell at a time — useful for precise
            work without reaching for the mouse. Press <strong>Escape</strong> to deselect.
          </p>
          <p>
            <strong>Undo/Redo:</strong> Ctrl+Z / Ctrl+Y, or the buttons in the toolbar.
          </p>
        </Section>

        <Section title="5. Get around the canvas">
          <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li><strong>Zoom</strong> — pinch on a trackpad, Ctrl+scroll, or use the + / − buttons.</li>
            <li><strong>Pan</strong> — Ctrl+drag or middle-click drag.</li>
            <li><strong>Fit</strong> — click Fit in the toolbar to zoom the whole pattern into view.</li>
            <li><strong>Grid lines</strong> — toggle with G or the Grid button. Heavy lines mark every 10 cells.</li>
          </ul>
        </Section>

        <Section title="6. Save and share your work" last>
          <p>
            Click <strong>Save</strong> (or Ctrl+S) to store your pattern in this browser. An
            asterisk (*) on the Save button means you have unsaved changes. Use <strong>Load</strong> to
            switch between saved patterns.
          </p>
          <p>
            To back up or share a pattern, click <strong>Export → JSON</strong>. Anyone with the
            file can import it on their own device using the <strong>Import</strong> button.
          </p>
          <p>
            Click <strong>Export → PDF</strong> to generate a printable version of your pattern,
            complete with a DMC colour legend and stitch counts — handy to have beside you while you stitch.
          </p>
          <p>
            Use <strong>Preview</strong> (top right) at any time to see a clean view of how your
            finished pattern will look.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 24 }}>
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--accent)',
        marginBottom: 10,
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 13,
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {children}
      </div>
    </div>
  );
}
