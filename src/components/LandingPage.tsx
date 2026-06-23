import { useEffect, useRef, useState } from "react";
import { Terminal, Code2, PenTool, Zap, ChevronRight } from "lucide-react";
import Lottie from "lottie-react";
import heroAnimation from "../../public/hero-animation.json";
import "./LandingPage.css";

interface LandingPageProps {
  onTryPixelCode: () => void;
}

export function LandingPage({ onTryPixelCode }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  useEffect(() => {
    if (!vantaEffect && vantaRef.current && (window as any).VANTA) {
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
          color: 0xffffff,
          backgroundColor: 0x0,
          points: 8.00
        })
      );
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

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

  return (
    <div className="landing-container" ref={containerRef}>
      {/* Vanta.js Background */}
      <div className="vanta-bg" ref={vantaRef}></div>

      {/* Main Content Wrapper with opacity */}
      <div className="content-wrapper">
        <header className="landing-header">
        <div className="logo-container">
          <Terminal className="logo-icon" size={28} />
          <span className="logo-text">PixelCode</span>
        </div>
        <div className="header-actions">
          <button className="primary-btn sm" onClick={onTryPixelCode}>
            Sign In
          </button>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-content">
            <div className="badge">Built by PixelStudio</div>
            <h1 className="hero-title">
              Code, Design, & Build with <span className="text-gradient">Intelligent AI</span>
            </h1>
            <p className="hero-subtitle">
              PixelCode empowers you with advanced AI agents. From generating high-fidelity UI designs 
              to converting sketches directly into production-ready React code.
            </p>
            <div className="hero-cta-group">
              <button className="primary-btn lg cta-glow" onClick={onTryPixelCode}>
                Try PixelCode <ChevronRight size={20} />
              </button>
              <button className="secondary-btn lg" onClick={onTryPixelCode}>
                Explore Features
              </button>
            </div>
          </div>
          <div className="hero-animation">
            <Lottie animationData={heroAnimation} loop={true} />
          </div>
        </section>

        <section className="features-section">
          <div className="feature-card glass">
            <div className="feature-icon-wrapper blue">
              <Code2 size={24} />
            </div>
            <h3>Fullstack Assistant</h3>
            <p>Write robust code, debug complex issues, and architect systems with our state-of-the-art coding models.</p>
          </div>
          
          <div className="feature-card glass">
            <div className="feature-icon-wrapper purple">
              <Zap size={24} />
            </div>
            <h3>Design-to-Code</h3>
            <p>Upload a sketch or UI mockup. Our Owl Alpha vision model converts it into clean, interactive frontend code.</p>
          </div>

          <div className="feature-card glass">
            <div className="feature-icon-wrapper pink">
              <PenTool size={24} />
            </div>
            <h3>UI/UX Designer</h3>
            <p>Generate stunning visual mockups and web design inspirations directly from text prompts.</p>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>Created and developed by Bhushan Padghan under PixelStudio.</p>
      </footer>
      </div>
    </div>
  );
}
