import styles from './buttons.module.css';

// Every state of the shared button styles from globals.css, on the two surfaces they sit on in the real site.
function Row({ surface }: { surface: 'ink' | 'card' }) {
  return (
    <div className={`${styles.row} ${surface === 'card' ? styles.onCard : styles.onInk}`}>
      <p className={styles.surface}>On {surface}</p>
      <div className={styles.keys}>
        <button type="button" className="btn-neo px-6 py-3.5 font-sans text-xs uppercase tracking-[0.2em] text-fg">
          [ Standard ]
        </button>
        <button
          type="button"
          className="btn-neo btn-neo-accent px-6 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.2em]"
        >
          Transmit ↗
        </button>
        <button
          type="button"
          aria-pressed="true"
          className="btn-neo px-6 py-3.5 font-sans text-xs uppercase tracking-[0.2em] text-fg"
        >
          Guides On
        </button>
        <button
          type="button"
          aria-pressed="false"
          className="btn-neo px-6 py-3.5 font-sans text-xs uppercase tracking-[0.2em] text-fg"
        >
          Guides Off
        </button>
        <button type="button" className="btn-neo btn-neo-sm px-3 py-1.5 font-sans text-[11px] uppercase tracking-[0.15em] text-muted">
          Luna
        </button>
        <button type="button" className="btn-neo btn-neo-sm px-4 py-2 font-sans text-[11px] uppercase tracking-[0.2em] text-muted">
          [ Menu ]
        </button>
        <button
          type="button"
          disabled
          className="btn-neo btn-neo-accent px-6 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] disabled:bg-quiet"
        >
          Sending…
        </button>
      </div>
    </div>
  );
}

export default function ButtonLab() {
  return (
    <section id="buttons" className={styles.root} aria-labelledby="btn-title">
      <div className={styles.inner}>
        <p className={styles.kicker}>C · applied across the site</p>
        <h2 id="btn-title" className={styles.h2}>
          NASA-HUD soft buttons
        </h2>
        <p className={styles.lede}>
          The shared <code>btn-neo</code> styles from <code>globals.css</code>, in every state. Hover the keys to see
          each button&rsquo;s own fill; press and hold one to see it push in. &ldquo;Guides On&rdquo; shows the lit LED
          and the pushed-in look a real toggle gets.
        </p>
        <Row surface="ink" />
        <Row surface="card" />
      </div>
    </section>
  );
}
