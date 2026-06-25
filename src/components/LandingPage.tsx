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
                  } else {
                    const sectionId = link.toLowerCase();
                    const el = document.getElementById(sectionId);
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

          {/* Section: Pricing */}
          <section id="pricing" className="pricing-section">
            <div className="features-header">
              <h2 className="features-title">Simple, Predictable Pricing</h2>
              <p className="features-subtitle">
                Start building for free, upgrade as you scale.
              </p>
            </div>

            <div className="pricing-grid">
              {/* Plan 1: Developer */}
              <div className="pricing-card">
                <div className="plan-name font-mono">DEVELOPER</div>
                <div className="plan-price">
                  <span className="price-symbol">$</span>0<span className="price-period">/mo</span>
                </div>
                <p className="plan-desc">For individual developers and testing integrations.</p>
                <ul className="plan-features font-mono">
                  <li>● 1 active workspace</li>
                  <li>● 100 queries / day</li>
                  <li>● Standard edge deploys</li>
                  <li>● Basic community support</li>
                </ul>
                <button className="pricing-action-btn secondary-btn" onClick={onTryPixelCode}>
                  Current Plan
                </button>
              </div>

              {/* Plan 2: Pro */}
              <div className="pricing-card featured">
                <div className="plan-badge-highlight font-mono">COMING SOON</div>
                <div className="plan-name font-mono">PRO_ENGINE</div>
                <div className="plan-price">
                  <span className="price-symbol">$</span>29<span className="price-period">/mo</span>
                </div>
                <p className="plan-desc">For power developers and fast-paced teams.</p>
                <ul className="plan-features font-mono">
                  <li>● Unlimited workspaces</li>
                  <li>● Unlimited agent queries</li>
                  <li>● Advanced vision-to-code</li>
                  <li>● Priority edge compiler</li>
                </ul>
                <button className="pricing-action-btn primary-btn disabled" disabled>
                  Coming Soon
                </button>
              </div>

              {/* Plan 3: Enterprise */}
              <div className="pricing-card">
                <div className="plan-badge-highlight font-mono">COMING SOON</div>
                <div className="plan-name font-mono">ENTERPRISE</div>
                <div className="plan-price font-mono">CUSTOM</div>
                <p className="plan-desc">For organizations requiring security and custom setups.</p>
                <ul className="plan-features font-mono">
                  <li>● Dedicated clusters</li>
                  <li>● Custom model training</li>
                  <li>● 99.9% uptime SLA</li>
                  <li>● 24/7 priority support</li>
                </ul>
                <button className="pricing-action-btn secondary-btn disabled" disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </section>

          {/* Section: Blog */}
          <section id="blog" className="blog-section">
            <div className="features-header">
              <h2 className="features-title">From the Engine Room</h2>
              <p className="features-subtitle">
                Technical deep-dives, product updates, and architecture insights.
              </p>
            </div>

            <div className="blog-grid">
              {/* Blog Post 1 */}
              <article className="blog-card">
                <div className="blog-tag font-mono text-cyan">ENGINE</div>
                <h3 className="blog-title font-mono">Rewriting compiler in Rust: A 10x speedup story</h3>
                <p className="blog-excerpt">
                  How we replaced our core TypeScript compiler routines with high-performance Rust bindings to achieve ultra-fast edge compiles.
                </p>
                <div className="blog-footer">
                  <span className="blog-date font-mono">June 24, 2026</span>
                  <span className="blog-readmore font-mono">read article &rarr;</span>
                </div>
              </article>

              {/* Blog Post 2 */}
              <article className="blog-card">
                <div className="blog-tag font-mono text-violet">PRODUCT</div>
                <h3 className="blog-title font-mono">Introducing vision React code generation pipelines</h3>
                <p className="blog-excerpt">
                  Deploying state-of-the-art vision reasoning models to compile sketches and UI screenshots directly to functional React typescript.
                </p>
                <div className="blog-footer">
                  <span className="blog-date font-mono">June 18, 2026</span>
                  <span className="blog-readmore font-mono">read article &rarr;</span>
                </div>
              </article>

              {/* Blog Post 3 */}
              <article className="blog-card">
                <div className="blog-tag font-mono text-emerald">ARCHITECTURE</div>
                <h3 className="blog-title font-mono">Scaling zero-config edge functions globally</h3>
                <p className="blog-excerpt">
                  A look under the hood at how we minimize cold starts and route developer requests to the nearest edge node in milliseconds.
                </p>
                <div className="blog-footer">
                  <span className="blog-date font-mono">June 12, 2026</span>
                  <span className="blog-readmore font-mono">read article &rarr;</span>
                </div>
              </article>
            </div>
          </section>

          {/* Section: Contact */}
          <section id="contact" className="contact-section">
            <div className="features-header">
              <h2 className="features-title">Get in Touch</h2>
              <p className="features-subtitle">
                Have questions about the digital engine? Let's connect.
              </p>
            </div>

            <div className="contact-container">
              <div className="contact-info">
                <h3 className="info-title font-mono">SYSTEM_DIAGNOSTICS</h3>
                <p className="info-desc">
                  Ping our support engineers or send us details of your integration inquiries.
                </p>
                <div className="info-list font-mono">
                  <div className="info-item">
                    <span className="info-label">SUPPORT:</span>
                    <span className="info-value">support@pixelcode.dev</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">STATUS:</span>
                    <span className="info-value text-emerald">PING_OK (24ms)</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">LOCATION:</span>
                    <span className="info-value">San Francisco, CA</span>
                  </div>
                </div>
              </div>

              <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert('Message sent successfully!'); }}>
                <div className="form-group">
                  <label className="form-label font-mono" htmlFor="email-input">EMAIL_ADDRESS</label>
                  <input id="email-input" type="email" placeholder="dev@example.com" className="form-input font-mono" required />
                </div>
                <div className="form-group">
                  <label className="form-label font-mono" htmlFor="message-input">MESSAGE_BODY</label>
                  <textarea id="message-input" rows={4} placeholder="Type your inquiry here..." className="form-input font-mono" required></textarea>
                </div>
                <button type="submit" className="contact-submit-btn font-mono">
                  SEND_MESSAGE &rarr;
                </button>
              </form>
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
