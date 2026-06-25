import { useState, useRef } from "react";
import { 
  Terminal, 
  BookOpen, 
  Gauge, 
  Rocket, 
  BarChart3, 
  Check, 
  Copy 
} from "lucide-react";
import "./LandingPage.css";

interface LandingPageProps {
  onTryPixelCode: () => void;
}

export function LandingPage({ onTryPixelCode }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [activeLink, setActiveLink] = useState("Home");

  const rustCode = `fn main() {
    let server = PixelCode::new()
        .port(8080)
        .route("/", handle_req);

    // Precision engineered execution
    server.ignite().await;
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rustCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navLinks = ["Home", "Features", "Pricing", "Blog", "Contact"];

  return (
    <div className="landing-container" ref={containerRef}>
      {/* Background grid + radial glow details */}
      <div className="grid-overlay"></div>
      <div className="radial-glow-hero"></div>
      <div className="radial-glow-cards"></div>

      <div className="content-wrapper">
        {/* Header Navigation */}
        <header className="landing-header">
          <div className="logo-container">
            <Terminal className="logo-icon" size={18} />
            <span className="logo-text">Pixel Code</span>
          </div>

          <nav className="header-nav">
            {navLinks.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className={`nav-item ${activeLink === link ? "active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveLink(link);
                  if (link === "Home") {
                    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                  } else if (link === "Features") {
                    const el = document.getElementById("features");
                    if (el && containerRef.current) {
                      containerRef.current.scrollTo({
                        top: el.offsetTop - 100, // 100px offset for sticky header
                        behavior: "smooth"
                      });
                    }
                  }
                }}
              >
                {link}
              </a>
            ))}
          </nav>

          <button className="nav-signup-btn" onClick={onTryPixelCode}>
            Sign Up
          </button>
        </header>

        {/* Hero Section */}
        <main className="landing-main">
          <section className="hero-section">
            <div className="hero-left">
              {/* Version Badge */}
              <div className="badge">
                <span className="pulse-dot"></span>
                <span className="badge-text">v2.4.0 Now Available</span>
              </div>

              {/* Catchy Headline */}
              <h1 className="hero-title">
                Build with Precision.
                <br />
                Code at the Speed of
                <br />
                <span className="highlight-text">Light.</span>
              </h1>

              {/* Subheading description */}
              <p className="hero-subtitle">
                The ultimate toolkit for modern architects of the web. Performance-first, 
                developer-driven. Experience unparalleled execution velocity.
              </p>

              {/* CTA Buttons */}
              <div className="hero-cta-group">
                <button className="primary-btn" onClick={onTryPixelCode}>
                  Get Started Free
                </button>
                <button className="secondary-btn" onClick={() => window.open("#", "_self")}>
                  <BookOpen size={16} />
                  View Docs
                </button>
              </div>
            </div>

            {/* Right side: Mock Editor (main.rs) */}
            <div className="hero-right">
              <div className="editor-mockup">
                <div className="editor-header">
                  <div className="window-controls">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <span className="editor-filename">main.rs</span>
                  <button 
                    className="editor-copy-btn" 
                    onClick={copyToClipboard}
                    title="Copy code"
                  >
                    {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="editor-body">
                  <pre>
                    <code>
                      <span className="syntax-keyword">fn</span> <span className="syntax-function">main</span>() &#123;{"\n"}
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="syntax-keyword">let</span> server = PixelCode::new(){"\n"}
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.port(<span className="syntax-number">8080</span>){"\n"}
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.route(<span className="syntax-string">"/"</span>, handle_req);{"\n"}{"\n"}
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="syntax-comment">// Precision engineered execution</span>{"\n"}
                      &nbsp;&nbsp;&nbsp;&nbsp;server.<span className="syntax-function">ignite</span>().<span className="syntax-keyword">await</span>;{"\n"}
                      &#125;
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Engineered for Extremes */}
          <section id="features" className="features-section">
            <div className="features-header">
              <h2 className="features-title">Engineered for Extremes</h2>
              <p className="features-subtitle">
                Designed to eliminate friction in high-performance environments.
              </p>
            </div>

            {/* 3-Card Grid */}
            <div className="features-grid">
              {/* Card 1: Ultra-Low Latency */}
              <div className="feature-card">
                <div className="card-icon-wrapper">
                  <Gauge size={20} className="card-icon" />
                </div>
                <h3 className="card-title">Ultra-Low Latency</h3>
                <p className="card-desc">
                  Optimized for high-frequency workflows. Core engine rewritten in Rust 
                  for memory safety and theoretical max throughput.
                </p>
                <div className="card-link font-mono">
                  &lt; 1ms response &rarr;
                </div>
              </div>

              {/* Card 2: Zero-Config Deployment */}
              <div className="feature-card">
                <div className="card-icon-wrapper">
                  <Rocket size={20} className="card-icon" />
                </div>
                <h3 className="card-title">Zero-Config Deployment</h3>
                <p className="card-desc">
                  Ship code faster with automated pipelines. Push to main and watch the 
                  global edge network propagate in seconds.
                </p>
                <div className="card-link font-mono">
                  git push origin main &rarr;
                </div>
              </div>

              {/* Card 3: Precision Analytics */}
              <div className="feature-card">
                <div className="card-icon-wrapper">
                  <BarChart3 size={20} className="card-icon" />
                </div>
                <h3 className="card-title">Precision Analytics</h3>
                <p className="card-desc">
                  Deep insights into your code's performance. Microscopic telemetry data 
                  visualized in real-time dark mode dashboards.
                </p>
                <div className="card-link font-mono">
                  view telemetry &rarr;
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer Section */}
        <footer className="landing-footer">
          <div className="footer-left">
            <div className="logo-container">
              <Terminal className="logo-icon" size={18} />
              <span className="logo-text">Pixel Code</span>
            </div>
            <p className="footer-copyright">
              &copy; 2024 Pixel Code. Precision engineered for architects.
            </p>
          </div>

          <div className="footer-right">
            <div className="footer-column">
              <h4 className="footer-col-title">Resources</h4>
              <ul className="footer-links">
                <li><a href="#docs">Documentation</a></li>
                <li><a href="#changelog">Changelog</a></li>
                <li><a href="#security">Security</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-col-title">Legal</h4>
              <ul className="footer-links">
                <li><a href="#privacy">Privacy</a></li>
                <li><a href="#terms">Terms</a></li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
