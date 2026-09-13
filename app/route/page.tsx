export default function Route() {
  return (
    <main className="route-page">
      <header>
        <a className="brand" href="/">
          <span className="brand-mark">SF</span> BAY CITY <em>KART</em>
        </a>
        <a href="/vc">Try the VC circuit →</a>
      </header>
      <nav className="course-choices">
        <a href="/">Drive A · Waterfront · 2.18 km</a>
        <a href="/vc">Drive B · VC Circuit · 3.71 km</a>
      </nav>
      <div className="course-heading">
        <h1>Two routes. Same karts.</h1>
        <p>Compare the waterfront loop with a longer circuit past three VC offices.</p>
      </div>
      <div className="route-layout">
        <section>
          <span className="eyebrow">COURSE PROPOSAL · 01</span>
          <h1>
            South Park
            <br />
            Waterfront Circuit
          </h1>
          <p>
            A 2.18 km lap on mapped San Francisco streets. Either side of South Park is open,
            followed by city streets and a paved waterfront promenade.
          </p>
          <div className="route-stats">
            <b>
              2.18 km <small>ONE LAP</small>
            </b>
            <b>
              ~1–2 min <small>TARGET TIME</small>
            </b>
          </div>
          <ol>
            {[
              'South Park — start at 3rd and pass the park',
              '2nd Street — turn toward Brannan',
              'Brannan Street — run toward the waterfront',
              'Waterfront Promenade — Herb Caen Way beside the Embarcadero',
              'King Street — continue beside Oracle Park',
              '3rd Street — return to the start',
            ].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <a className="route-drive" href="/">
            Drive the prototype →
          </a>
          <p className="route-note">
            Lap time is an estimate to test: about 61 seconds at the 80 mph maximum before
            acceleration and braking. This prototype treats streets as a closed race course,
            including travel against normal traffic directions. Building detail and photo textures
            come after the route feels right.
          </p>
        </section>
        <img
          src="/course-map.svg"
          alt="Map of the 2.18 km circuit. Start on South Park at 3rd, then take 2nd, Brannan, the waterfront promenade, King, and 3rd back to the start."
        />
      </div>
      <div className="route-layout">
        <section>
          <span className="eyebrow">ALTERNATIVE · 02</span>
          <h1>The VC Circuit</h1>
          <p>
            Start at 3rd and Brannan, beside South Park. Pass SPC, turn down 2nd, sweep along
            Townsend past a16z and Pear, then return via 8th and Brannan.
          </p>
          <div className="route-stats">
            <b>
              3.71 km <small>ONE LAP</small>
            </b>
            <b>
              ~2–3 min <small>ESTIMATED TIME</small>
            </b>
          </div>
          <ol className="office-list">
            <li>
              <a href="https://www.southparkcommons.com/">South Park Commons — 380 Brannan St</a>
            </li>
            <li>
              <a href="https://a16z.com/offices/">a16z — 180 Townsend St</a>
            </li>
            <li>
              <a href="https://pear.vc/contact-us/">Pear VC — 600 Townsend St</a>
            </li>
          </ol>
          <a className="route-drive" href="/vc">
            Drive B · VC circuit →
          </a>
          <p className="route-note">
            Same acceleration, steering, boost and opponents as A. There is no forward-speed cap;
            boost accelerates faster. Lap time depends on how you drive. Real mapped footprints with
            approximate heights and generic textures; office markers identify locations, not
            finished replica facades. Streets are treated as a closed race course.
          </p>
        </section>
        <img
          src="/vc-course-map.svg"
          alt="VC loop along Brannan, 2nd, Townsend and 8th, marked with South Park Commons, a16z and Pear VC."
        />
      </div>
    </main>
  );
}
