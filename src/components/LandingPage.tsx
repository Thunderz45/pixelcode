import { useEffect, useRef, useState } from "react";
import { 
  Terminal, 
  Code2, 
  PenTool, 
  Zap, 
  Copy, 
  Check, 
  Activity, 
  Cpu, 
  ShieldCheck, 
  Database,
  ArrowRight,
  Sparkles,
  Play
} from "lucide-react";
import Lottie from "lottie-react";
import heroAnimation from "../assets/hero-animation.json";
import "./LandingPage.css";

interface LandingPageProps {
  onTryPixelCode: () => void;
}

export function LandingPage({ onTryPixelCode }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  // Terminal interactivity state
  const [terminalCommand, setTerminalCommand] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "SYSTEM // INITIALIZING ENGINE...",
    "DATABASE // CONNECTED STATUS: OK",
    "AGENT // ACTIVE OWL-ALPHA v1.4",
    "Ready. Type 'help' or 'build' to execute commands."
  ]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Code copy state
  const [copied, setCopied] = useState(false);

  const sampleCode = `import { useAgent } from 'pixelcode';

export function OwlAssistant() {
  const { agent, status } = useAgent("owl-alpha");

  return (
    <div className="agent-container">
      <StatusPanel state={status} />
      <DesignCompiler 
        sketch="/mockups/dashboard.png" 
        target="react-ts"
        onBuildComplete={(code) => agent.deploy(code)}
      />
    </div>
  );
}`;

  useEffect(() => {
    if (!vantaEffect && vantaRef.current && (window as any).VANTA) {
      try {
        setVantaEffect(
          (window as any).VANTA.NET({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x00dce5,
            backgroundColor: 0x0a0a0b,
            points: 10.00,
            maxDistance: 22.00,
            spacing: 16.00
          })
        );
      } catch (err) {
        console.error("Vanta NET initialization failed:", err);
      }
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  // Handle card mouse movement glow effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      containerRef.current.style.setProperty("--mouse-x", `${x}px`);
      containerRef.current.style.setProperty("--mouse-y", `${y}px`);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalCommand.trim().toLowerCase();
    if (!cmd) return;

    let response: string[] = [];
    if (cmd === "help") {
      response = [
        `$ ${terminalCommand}`,
        "Available commands:",
        "  build    - Compile the workspace bundle",
        "  agent    - Query autonomous agent status",
        "  clear    - Clear console buffer"
      ];
    } else if (cmd === "build") {
      response = [
        `$ ${terminalCommand}`,
        "Executing: vite build...",
        "✓ 28 modules transformed.",
        "dist/index.html                  0.83 kB",
        "dist/assets/index-B54m6y1A.css  24.32 kB",
        "dist/assets/index-D_n7Wz6k.js  382.41 kB",
        "✓ Compiled successfully in 410ms.",
        "STATUS // DEPLOYED TO STAGING."
      ];
    } else if (cmd === "agent") {
      response = [
        `$ ${terminalCommand}`,
        "Owl-Alpha Vision System: ONLINE",
        "Latency: 24ms",
        "Context Window: 128k tokens",
        "Status: STANDBY // AWAITING SKETCH INPUT"
      ];
    } else if (cmd === "clear") {
      setTerminalLogs([]);
      setTerminalCommand("");
      return;
    } else {
      response = [
        `$ ${terminalCommand}`,
        `Command not found: '${cmd}'. Type 'help' for options.`
      ];
    }

    setTerminalLogs(prev => [...prev, ...response]);
    setTerminalCommand("");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="landing-container" ref={containerRef}>
      {/* Vanta.js Background */}
      <div className="vanta-bg" ref={vantaRef}></div>

      {/* Main Content Wrapper */}
      <div className="content-wrapper">
        <header className="landing-header">
          <div className="logo-container">
            <Terminal className="logo-icon" size={20} />
            <span className="logo-text">PixelCode</span>
            <div className="status-pill-indicator">
              <span className="pulse-dot"></span>
              <span className="status-label">SYS_ONLINE</span>
            </div>
          </div>
          
          <nav className="header-nav">
            <a href="#features" className="nav-item">Features</a>
            <a href="#terminal" className="nav-item">Terminal</a>
            <a href="#preview" className="nav-item">Preview</a>
          </nav>

          <div className="header-actions">
            <button className="ghost-btn" onClick={onTryPixelCode}>
              Sign In
            </button>
            <button className="primary-btn sm" onClick={onTryPixelCode}>
              Initialize App
            </button>
          </div>
        </header>

        <main className="landing-main">
          {/* Hero Section */}
          <section className="hero-section">
            <div className="hero-content">
              <div className="badge">
                <span className="badge-marker"></span>
                SYSTEM: ONLINE // VER 1.0.4
              </div>
              <h1 className="hero-title">
                The Digital Engine for <span className="text-gradient">Pixel-Perfect</span> Code
              </h1>
              <p className="hero-subtitle">
                A developer-centric workspace combining state-of-the-art AI agents with low-latency compilation, real-time UI rendering, and natural language design-to-code pipelines.
              </p>
              
              <div className="hero-cta-group">
                <button className="primary-btn lg" onClick={onTryPixelCode}>
                  Initialize Workspace <ArrowRight size={18} />
                </button>
                <a href="#features" className="secondary-btn lg">
                  Explore Engine Specs
                </a>
              </div>

              {/* Status Dashboard Panel */}
              <div className="status-dashboard-panel glass">
                <div className="dashboard-grid">
                  <div className="dashboard-item">
                    <Activity size={16} className="dash-icon text-cyan" />
                    <div className="dash-info">
                      <span className="dash-label">API LATENCY</span>
                      <span className="dash-value">24ms</span>
                    </div>
                  </div>
                  <div className="dashboard-item">
                    <Cpu size={16} className="dash-icon text-violet" />
                    <div className="dash-info">
                      <span className="dash-label">CORE INSTANCE</span>
                      <span className="dash-value">OWL-ALPHA v1.4</span>
                    </div>
                  </div>
                  <div className="dashboard-item">
                    <Database size={16} className="dash-icon text-emerald" />
                    <div className="dash-info">
                      <span className="dash-label">BUILD TIME</span>
                      <span className="dash-value">0.4s</span>
                    </div>
                  </div>
                  <div className="dashboard-item">
                    <ShieldCheck size={16} className="dash-icon text-white" />
                    <div className="dash-info">
                      <span className="dash-label">SECURITY</span>
                      <span className="dash-value">SSL SECURE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-animation-container">
              <div className="hero-animation-frame">
                <div className="animation-header-bar">
                  <span className="bar-dot red"></span>
                  <span className="bar-dot yellow"></span>
                  <span className="bar-dot green"></span>
                  <span className="bar-title">owl_alpha_vision_engine.bin</span>
                </div>
                <div className="animation-body">
                  <Lottie animationData={heroAnimation} loop={true} />
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="features-section-container">
            <div className="section-header-block">
              <span className="section-label">ENGINE CAPABILITIES</span>
              <h2 className="section-title">Designed for Developer Efficiency</h2>
            </div>
            
            <div className="features-section">
              <div className="feature-card">
                <div className="feature-card-header">
                  <div className="feature-icon-wrapper cyan-theme">
                    <Code2 size={22} />
                  </div>
                  <span className="chip-tag violet-theme">DUAL-MODEL</span>
                </div>
                <h3>Fullstack Assistant</h3>
                <p>Write robust code, debug complex issues, and architect full systems with state-of-the-art LLM reasoning models built into your console.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-card-header">
                  <div className="feature-icon-wrapper violet-theme">
                    <Zap size={22} />
                  </div>
                  <span className="chip-tag cyan-theme">OWL-ALPHA</span>
                </div>
                <h3>Design-to-Code</h3>
                <p>Upload UI mockups, screenshots, or layout sketches. The OWL-Alpha vision pipeline translates inputs into production-ready React code instantly.</p>
              </div>

              <div className="feature-card">
                <div className="feature-card-header">
                  <div className="feature-icon-wrapper emerald-theme">
                    <PenTool size={22} />
                  </div>
                  <span className="chip-tag emerald-theme">LIVE-SYNC</span>
                </div>
                <h3>UI/UX Canvas</h3>
                <p>Synthesize interactive interfaces from description scripts. Compile and preview changes side-by-side with zero hot-reload latency.</p>
              </div>
            </div>
          </section>

          {/* Interactive Terminal Mockup */}
          <section id="terminal" className="terminal-section-container">
            <div className="section-header-block">
              <span className="section-label">CONSOLE INTEGRATION</span>
              <h2 className="section-title">Run Compile Operations Live</h2>
            </div>

            <div className="terminal-mockup glass">
              <div className="terminal-header">
                <div className="terminal-tabs">
                  <span className="terminal-tab active"><Terminal size={12} /> sh - pixelcode</span>
                  <span className="terminal-tab"><Code2 size={12} /> main.tsx</span>
                  <span className="terminal-tab"><Sparkles size={12} /> owl-agent</span>
                </div>
                <div className="terminal-header-status">
                  <span className="indicator-led online"></span>
                  <span>CONNECTED</span>
                </div>
              </div>
              <div className="terminal-body">
                <div className="terminal-scroll-area">
                  {terminalLogs.map((log, index) => (
                    <div key={index} className="terminal-log-line">
                      {log}
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>
                <form onSubmit={handleTerminalSubmit} className="terminal-input-line">
                  <span className="terminal-prompt">$</span>
                  <input
                    type="text"
                    value={terminalCommand}
                    onChange={(e) => setTerminalCommand(e.target.value)}
                    className="terminal-input"
                    placeholder="Type 'help' or 'build' to interact..."
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <button type="submit" className="terminal-submit-btn">
                    <Play size={10} />
                  </button>
                </form>
              </div>
            </div>
          </section>

          {/* Interactive Code Preview Block */}
          <section id="preview" className="preview-section-container">
            <div className="section-header-block">
              <span className="section-label">SYNTAX HIGHLIGHTING</span>
              <h2 className="section-title">High Density Design System Output</h2>
            </div>

            <div className="code-block-wrapper">
              <div className="code-block-header">
                <span className="code-block-filename">components/OwlAssistant.tsx</span>
                <button className="code-block-copy-btn" onClick={copyToClipboard}>
                  {copied ? (
                    <>
                      <Check size={14} className="text-emerald" />
                      <span className="text-emerald">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="code-block-pre">
                <code className="code-block-code">
                  {/* Manually highlighting the code snippet for premium aesthetic */}
                  <span className="syntax-keyword">import</span> &#123; useAgent &#125; <span className="syntax-keyword">from</span> <span className="syntax-string">'pixelcode'</span>;<span className="syntax-comment"></span>{"\n\n"}
                  <span className="syntax-keyword">export function</span> <span className="syntax-function">OwlAssistant</span>() &#123;{"\n"}
                  &nbsp;&nbsp;<span className="syntax-keyword">const</span> &#123; agent, status &#125; = <span className="syntax-function">useAgent</span>(<span className="syntax-string">"owl-alpha"</span>);{"\n\n"}
                  &nbsp;&nbsp;<span className="syntax-keyword">return</span> ({"\n"}
                  &nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="syntax-tag">div</span> <span className="syntax-attr">className</span>=<span className="syntax-string">"agent-container"</span>&gt;{"\n"}
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="syntax-tag">StatusPanel</span> <span className="syntax-attr">state</span>=&#123;status&#125; /&gt;{"\n"}
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="syntax-tag">DesignCompiler</span>{"\n"}
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="syntax-attr">sketch</span>=<span className="syntax-string">"/mockups/dashboard.png"</span>{"\n"}
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="syntax-attr">target</span>=<span className="syntax-string">"react-ts"</span>{"\n"}
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="syntax-attr">onBuildComplete</span>=&#123;(code) =&gt; agent.deploy(code)&#125;{"\n"}
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&gt;{"\n"}
                  &nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="syntax-tag">div</span>&gt;{"\n"}
                  &nbsp;&nbsp;);{"\n"}
                  &#125;
                </code>
              </pre>
            </div>
          </section>
        </main>

        <footer className="landing-footer">
          <div className="footer-content">
            <p>Created and developed by Bhushan Padghan under PixelStudio.</p>
            <p className="footer-meta">ENGINE CONFIG // CONNECTED STABLE // © {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
