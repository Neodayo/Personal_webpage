import HandNav from "@/components/HandNav";

const SECTIONS = [
  { id: "home", label: "HOME" },
  { id: "about", label: "ABOUT" },
  { id: "work", label: "WORK" },
  { id: "contact", label: "CONTACT" },
];

export default function Page() {
  return (
    <main>
      <HandNav items={SECTIONS} />

      <section id="home" className="panel">
        <div className="hero-copy">
          <span className="dash" aria-hidden="true" />
          <h1>
            I BUILD
            <br />
            THINGS<span className="cursor">_</span>
          </h1>
          <p className="sub">
            SOFTWARE ENGINEER.
            <br />
            BACKEND-LEANING.
            <br />
            ALWAYS SHIPPING.
          </p>
          <a href="#about" className="explore">
            <span>EXPLORE</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              aria-hidden="true"
            >
              <path d="M8 2v11M3 8.5l5 5 5-5" />
            </svg>
          </a>
        </div>
      </section>

      <section id="about" className="panel">
        <h2>About</h2>
        <p>lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
      </section>

      <section id="work" className="panel">
        <h2>Work</h2>
        <p>lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
      </section>

      <section id="contact" className="panel">
        <h2>Contact</h2>
        <p>lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
      </section>
    </main>
  );
}
