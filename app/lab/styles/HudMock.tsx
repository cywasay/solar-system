import type { CSSProperties } from 'react';
import Backdrop from './Backdrop';
import RateSlider from './RateSlider';
import styles from './hud.module.css';

const FACTS: { label: string; value: string; unit: string; fill: string }[] = [
  { label: 'Diameter', value: '12,742', unit: 'km', fill: '12%' },
  { label: 'Distance', value: '1.00', unit: 'AU', fill: '22%' },
  { label: 'Orbital period', value: '365.25', unit: 'd', fill: '38%' },
  { label: 'Day length', value: '24.0', unit: 'h', fill: '18%' },
];

function Meter({ fill }: { fill: string }) {
  return <span className={styles.meter} style={{ '--v': fill } as CSSProperties} aria-hidden="true" />;
}

export default function HudMock() {
  return (
    <section id="hud" className={styles.root} aria-labelledby="hud-title">
      <div className={styles.inner}>
        <div className={styles.intro}>
          <p className={styles.letter} aria-hidden="true">
            B
          </p>
          <div>
            <h2 id="hud-title" className={styles.h2}>
              Sci-fi HUD
            </h2>
            <p className={styles.lede}>
              A thin-line cockpit overlay: corner brackets, tick rulers, segmented meters and coordinate readouts. It is
              the direction the Explore view already leans toward ([ Pause ], &ldquo;Tracking&rdquo;), taken further.
            </p>
            <ul className={styles.traits}>
              <li>1px lines at low opacity; brackets only on the corners that matter</li>
              <li>Numbers are the hero: mono readouts with small unit labels and segmented meters</li>
              <li>Orange is reserved for live data, active states and the focus ring</li>
            </ul>
          </div>
          <dl className={styles.spec}>
            <div>
              <dt>Needs</dt>
              <dd>No new tokens. Slate lines and the existing orange accent are enough</dd>
            </div>
            <div>
              <dt>Best on</dt>
              <dd>Explore HUD, planet pages as overlays on the 3D scene, the menu</dd>
            </div>
            <div>
              <dt>Risk</dt>
              <dd>Safest fit with the current site, but the most common sci-fi trope, so it is the least distinctive</dd>
            </div>
          </dl>
        </div>

        <div className={styles.stage}>
          <Backdrop id="hud" orbitColor="rgba(138, 144, 152,0.2)">
            <g fill="none" stroke="rgba(138, 144, 152,0.85)" strokeWidth="1">
              <path d="M470 206 V216 M470 294 V284 M424 250 H434 M516 250 H506" />
              <path d="M424 216 V204 H436 M516 216 V204 H504 M424 284 V296 H436 M516 284 V296 H504" stroke="#FF6A3D" strokeWidth="1.6" />
              <path d="M436 218 L404 178 H318" />
            </g>
            <text
              x="320"
              y="171"
              fontSize="11"
              letterSpacing="1.5"
              fill="#8A9098"
              style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
            >
              EARTH · 1.00 AU
            </text>
            <text
              x="398"
              y="194"
              textAnchor="end"
              fontSize="10"
              letterSpacing="0.8"
              fill="#8A9098"
              style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
            >
              LAT +00.00° LON 000.00°
            </text>
          </Backdrop>

          <aside className={`${styles.panel} ${styles.telemetry}`} aria-label="Telemetry panel mock-up">
            <header className={styles.head}>
              <h3>
                <i className={styles.dot} aria-hidden="true" />
                Telemetry
              </h3>
              <span className={styles.sys}>SYS.04 // Tracking</span>
            </header>
            <div className={styles.ruler} aria-hidden="true" />
            <div className={styles.body}>
              <p className={styles.coord}>X +149.60 · Y −000.00 · Z +000.01</p>
              <p className={styles.name}>Earth</p>
              <dl className={styles.facts}>
                {FACTS.map((f) => (
                  <div className={styles.row} key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>
                      {f.value}
                      <small>{f.unit}</small>
                    </dd>
                    <Meter fill={f.fill} />
                  </div>
                ))}
              </dl>
              <p className={styles.note}>Third planet from the Sun, and the only world known to harbour life.</p>
            </div>
          </aside>

          <div className={`${styles.panel} ${styles.console}`} role="group" aria-label="Time console mock-up">
            <div className={styles.cGroup}>
              <button type="button" className={styles.bracketBtn}>
                Pause
              </button>
            </div>
            <div className={styles.cGroup}>
              <label htmlFor="hud-rate" className={styles.label}>
                Rate
              </label>
              <RateSlider
                id="hud-rate"
                wrapClassName={styles.rateWrap}
                sliderClassName={styles.rate}
                readoutClassName={styles.readout}
                unit="×"
                pad
              />
            </div>
            <div className={styles.cGroup}>
              <span id="hud-guides" className={styles.label}>
                Guides
              </span>
              <div className={styles.seg} role="radiogroup" aria-labelledby="hud-guides">
                <label>
                  <input type="radio" name="hud-guides" defaultChecked />
                  <span>On</span>
                </label>
                <label>
                  <input type="radio" name="hud-guides" />
                  <span>Off</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sheet}>
          <section className={`${styles.panel} ${styles.card}`} aria-labelledby="hud-c1">
            <header className={styles.head}>
              <h3 id="hud-c1">Actions</h3>
              <span className={styles.sys}>04.1</span>
            </header>
            <div className={styles.ruler} aria-hidden="true" />
            <div className={styles.cardBody}>
              <div className={styles.btnRow}>
                <button type="button" className={styles.btnPrimary}>
                  Begin ↗
                </button>
                <button type="button" className={styles.btnSecondary}>
                  Resume
                </button>
                <button type="button" className={styles.btnGhost}>
                  View all ↗
                </button>
                <button type="button" className={styles.btnSecondary} disabled>
                  Locked
                </button>
              </div>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.card}`} aria-labelledby="hud-c2">
            <header className={styles.head}>
              <h3 id="hud-c2">Toggles &amp; status</h3>
              <span className={styles.sys}>04.2</span>
            </header>
            <div className={styles.ruler} aria-hidden="true" />
            <div className={styles.cardBody}>
              <div className={styles.sqRow}>
                <label className={styles.sq}>
                  <input type="checkbox" defaultChecked />
                  <span className={styles.box} aria-hidden="true" />
                  Orbits
                </label>
                <label className={styles.sq}>
                  <input type="checkbox" defaultChecked />
                  <span className={styles.box} aria-hidden="true" />
                  Labels
                </label>
                <label className={styles.sq}>
                  <input type="checkbox" />
                  <span className={styles.box} aria-hidden="true" />
                  Moons
                </label>
              </div>
              <ul className={styles.statusList}>
                <li>
                  <i className={`${styles.mark} ${styles.markOk}`} aria-hidden="true" />
                  Online
                </li>
                <li>
                  <i className={`${styles.mark} ${styles.markStandby}`} aria-hidden="true" />
                  Standby
                </li>
                <li>
                  <i className={`${styles.mark} ${styles.markFault}`} aria-hidden="true" />
                  Fault
                </li>
              </ul>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.card}`} aria-labelledby="hud-c3">
            <header className={styles.head}>
              <h3 id="hud-c3">Tags &amp; readouts</h3>
              <span className={styles.sys}>04.3</span>
            </header>
            <div className={styles.ruler} aria-hidden="true" />
            <div className={styles.cardBody}>
              <div className={styles.tags}>
                <span className={styles.tag}>8 Planets</span>
                <span className={styles.tag}>20 Moons</span>
                <span className={styles.tag}>1 Star</span>
              </div>
              <div className={styles.bigStats}>
                <div>
                  <p>08</p>
                  <span>Planets</span>
                </div>
                <div>
                  <p>20</p>
                  <span>Moons</span>
                </div>
                <div>
                  <p>01</p>
                  <span>Star</span>
                </div>
              </div>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.card}`} aria-labelledby="hud-c4">
            <header className={styles.head}>
              <h3 id="hud-c4">Comms</h3>
              <span className={styles.sys}>04.4</span>
            </header>
            <div className={styles.ruler} aria-hidden="true" />
            <div className={styles.cardBody}>
              <div className={styles.form} role="group" aria-labelledby="hud-c4">
                <div className={styles.field}>
                  <label htmlFor="hud-name">
                    <b>01</b> Name
                  </label>
                  <input id="hud-name" className={styles.input} type="text" placeholder="Commander Vance" />
                </div>
                <div className={styles.field}>
                  <label htmlFor="hud-email">
                    <b>02</b> Email
                  </label>
                  <input id="hud-email" className={styles.input} type="email" placeholder="vance@station.space" />
                </div>
                <div className={styles.field}>
                  <label htmlFor="hud-msg">
                    <b>03</b> Message
                  </label>
                  <textarea id="hud-msg" className={styles.input} rows={3} placeholder="State your inquiry." />
                </div>
                <div>
                  <button type="button" className={styles.btnPrimary}>
                    Transmit ↗
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
