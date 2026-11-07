import Backdrop from './Backdrop';
import RateSlider from './RateSlider';
import styles from './nasa.module.css';

const FACTS: [string, string][] = [
  ['Diameter', '12,742 km'],
  ['Distance', '1.00 AU'],
  ['Orbital period', '365.25 d'],
  ['Day length', '24 h'],
];

// Mission patch: circular lettering on a path, orbit ellipse in the middle.
function Patch() {
  return (
    <svg className={styles.patch} viewBox="0 0 120 120" role="img" aria-label="Thessaris simulation mission patch">
      <defs>
        <path id="np-patch-arc" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
      </defs>
      <circle cx="60" cy="60" r="57" fill="#101012" stroke="#FF6A3D" strokeWidth="3" />
      <circle cx="60" cy="60" r="31" fill="none" stroke="#8A9098" strokeWidth="1.5" />
      <text
        fontSize="9.5"
        fontWeight="700"
        letterSpacing="1.2"
        fill="#8A9098"
        style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
      >
        <textPath href="#np-patch-arc" textLength="272" lengthAdjust="spacing">
          THESSARIS · ORBITAL SIMULATION · SOL SYSTEM ·
        </textPath>
      </text>
      <ellipse cx="60" cy="60" rx="24" ry="9" fill="none" stroke="#FF6A3D" strokeWidth="1.5" transform="rotate(-24 60 60)" />
      <circle cx="60" cy="60" r="5" fill="#FF6A3D" />
      <circle cx="80" cy="50" r="2.4" fill="#8A9098" />
    </svg>
  );
}

function Lever({ name, defaultChecked }: { name: string; defaultChecked?: boolean }) {
  return (
    <label className={styles.lever}>
      <input type="checkbox" defaultChecked={defaultChecked} />
      <span className={styles.slot} aria-hidden="true" />
      <span className={styles.lText}>
        <span className={styles.legend}>{name}</span>
        <span className={styles.state} aria-hidden="true" />
      </span>
    </label>
  );
}

export default function NasaMock() {
  return (
    <section id="nasa" className={styles.root} aria-labelledby="nasa-title">
      <div className={styles.inner}>
        <div className={styles.intro}>
          <p className={styles.letter} aria-hidden="true">
            A
          </p>
          <div>
            <h2 id="nasa-title" className={styles.h2}>
              NASA-punk
            </h2>
            <p className={styles.lede}>
              The 1970s NASA graphics manual crossed with mission-control hardware: flat bone-and-orange plates, hazard
              stripes, screws, dotted-leader data sheets, and controls that look like they can be pressed.
            </p>
            <ul className={styles.traits}>
              <li>Heavy uppercase grotesque, with data rows that run on dotted leaders</li>
              <li>Physical controls: keycaps, levers, LED indicators, a tape-gauge fader</li>
              <li>Bone label plates on dark steel; orange stays the only loud colour</li>
            </ul>
          </div>
          <dl className={styles.spec}>
            <div>
              <dt>Needs</dt>
              <dd>Two new tokens: bone #8A9098, and signal red #FF6A3D for guarded actions only</dd>
            </div>
            <div>
              <dt>Best on</dt>
              <dd>Explore console and telemetry, planet data sheets, the contact page as &ldquo;Form 1975-C&rdquo;</dd>
            </div>
            <div>
              <dt>Risk</dt>
              <dd>Most ownable, but furthest from the landing page, so keep it to instrument surfaces</dd>
            </div>
          </dl>
        </div>

        <div className={styles.stage}>
          <Backdrop id="np" orbitColor="rgba(138, 144, 152,0.2)" orbitDash="2 6">
            <g>
              <path d="M455.7 230.7 L430 196 H340" fill="none" stroke="#8A9098" strokeWidth="1.5" />
              <circle cx="455.7" cy="230.7" r="2.5" fill="#8A9098" />
              <rect x="226" y="180" width="114" height="32" fill="#8A9098" />
              <text
                x="283"
                y="200.5"
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                letterSpacing="1.4"
                fill="#101012"
                style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
              >
                03 · EARTH
              </text>
            </g>
          </Backdrop>

          <Patch />

          <aside className={`${styles.panel} ${styles.telemetry}`} aria-label="Telemetry panel mock-up">
            <div className={styles.hazard} aria-hidden="true" />
            <header className={styles.plate}>
              <h3>Telemetry</h3>
              <span className={styles.status}>
                <i className={styles.led} aria-hidden="true" />
                Tracking
              </span>
            </header>
            <div className={styles.body}>
              <p className={styles.designator}>Sect. 3.2 · Planet 03 · Sol</p>
              <p className={styles.name}>Earth</p>
              <dl className={styles.facts}>
                {FACTS.map(([label, value]) => (
                  <div className={styles.row} key={label}>
                    <dt>{label}</dt>
                    <i className={styles.leader} aria-hidden="true" />
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <p className={styles.note}>
                <b>Note 1.</b> Third planet from the Sun, and the only world known to harbour life.
              </p>
            </div>
          </aside>

          <div className={`${styles.panel} ${styles.console}`} role="group" aria-label="Time console mock-up">
            <div className={styles.cGroup}>
              <button type="button" className={`${styles.key} ${styles.keyPrimary}`}>
                Pause
              </button>
            </div>
            <div className={styles.cGroup}>
              <label htmlFor="np-rate" className={styles.legend}>
                Rate
              </label>
              <RateSlider
                id="np-rate"
                wrapClassName={styles.faderWrap}
                sliderClassName={styles.fader}
                readoutClassName={styles.window}
                unit="x"
              />
            </div>
            <div className={styles.cGroup}>
              <Lever name="Guides" defaultChecked />
            </div>
          </div>
        </div>

        <div className={styles.sheet}>
          <section className={`${styles.panel} ${styles.card}`} aria-labelledby="np-c1">
            <header className={styles.plate}>
              <h3 id="np-c1">Actuators</h3>
              <span className={styles.sectNo}>Sect. 4.1</span>
            </header>
            <div className={styles.cardBody}>
              <div className={styles.btnRow}>
                <button type="button" className={`${styles.key} ${styles.keyPrimary}`}>
                  Begin ▸
                </button>
                <button type="button" className={styles.key}>
                  Resume
                </button>
                <button type="button" className={`${styles.key} ${styles.keyGhost}`}>
                  Guides
                </button>
                <span className={styles.guard}>
                  <button type="button" className={`${styles.key} ${styles.keyGuard}`}>
                    Abort
                  </button>
                </span>
                <button type="button" className={styles.key} disabled>
                  Locked
                </button>
              </div>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.card}`} aria-labelledby="np-c2">
            <header className={styles.plate}>
              <h3 id="np-c2">Switches &amp; indicators</h3>
              <span className={styles.sectNo}>Sect. 4.2</span>
            </header>
            <div className={styles.cardBody}>
              <div className={styles.leverRow}>
                <Lever name="Orbits" defaultChecked />
                <Lever name="Labels" defaultChecked />
                <Lever name="Moons" />
              </div>
              <ul className={styles.ledList}>
                <li>
                  <i className={`${styles.ledDot} ${styles.ledOk}`} aria-hidden="true" />
                  Nominal
                </li>
                <li>
                  <i className={`${styles.ledDot} ${styles.ledStandby}`} aria-hidden="true" />
                  Standby
                </li>
                <li>
                  <i className={`${styles.ledDot} ${styles.ledFault}`} aria-hidden="true" />
                  Fault
                </li>
              </ul>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.card}`} aria-labelledby="np-c3">
            <header className={styles.plate}>
              <h3 id="np-c3">Spec plates</h3>
              <span className={styles.sectNo}>Sect. 4.3</span>
            </header>
            <div className={styles.cardBody}>
              <div className={styles.chips}>
                <span className={styles.chip}>8 Planets</span>
                <span className={styles.chip}>20 Moons</span>
                <span className={`${styles.chip} ${styles.chipFill}`}>1 Star</span>
              </div>
              <dl className={styles.dataPlate}>
                <div>
                  <dt>Model</dt>
                  <dd>THESSARIS-01</dd>
                </div>
                <div>
                  <dt>Serial</dt>
                  <dd>0001-ORB</dd>
                </div>
                <div>
                  <dt>Form</dt>
                  <dd>1975-C</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.card}`} aria-labelledby="np-c4">
            <header className={styles.plate}>
              <h3 id="np-c4">Form 1975-C · Comms request</h3>
              <span className={styles.sectNo}>Sect. 4.4</span>
            </header>
            <div className={styles.cardBody}>
              <div className={styles.form} role="group" aria-labelledby="np-c4">
                <div className={styles.field}>
                  <label className={styles.legend} htmlFor="np-name">
                    Field 01 · Name
                  </label>
                  <input id="np-name" className={styles.input} type="text" placeholder="Commander Vance" />
                </div>
                <div className={styles.field}>
                  <label className={styles.legend} htmlFor="np-email">
                    Field 02 · Email
                  </label>
                  <input id="np-email" className={styles.input} type="email" placeholder="vance@station.space" />
                </div>
                <div className={styles.field}>
                  <label className={styles.legend} htmlFor="np-msg">
                    Field 03 · Message
                  </label>
                  <textarea id="np-msg" className={styles.input} rows={3} placeholder="State your inquiry." />
                </div>
                <div>
                  <button type="button" className={`${styles.key} ${styles.keyPrimary}`}>
                    Transmit ▸
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
