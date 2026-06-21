import React, { useState, useEffect, useRef } from "react";
import { Copy, Check, Play, X, Terminal as TerminalIcon } from "lucide-react";
import "./CodeBlock.css";

interface CodeBlockProps {
  language: string;
  value: string;
}

const extractCPrintf = (code: string): string => {
  const regex = /printf\s*\(\s*"([^"]*)"(?:\s*,\s*[^)]*)?\s*\)/g;
  const outputLines: string[] = [];
  let match;
  while ((match = regex.exec(code)) !== null) {
    const text = match[1]
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/%d|%s|%f|%ld/g, "value");
    outputLines.push(text);
  }
  return outputLines.length > 0 ? outputLines.join("") : "Program finished with exit code 0";
};

const CTerminal: React.FC<{ code: string }> = ({ code }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sequence = [
      { text: "$ gcc main.c -o main", delay: 100 },
      { text: "$ ./main", delay: 800 },
      { text: extractCPrintf(code), delay: 1300 }
    ];

    setLines([]);
    setLoading(true);

    sequence.forEach((item, index) => {
      setTimeout(() => {
        setLines(prev => [...prev, item.text]);
        if (index === sequence.length - 1) {
          setLoading(false);
        }
      }, item.delay);
    });
  }, [code]);

  return (
    <div className="c-terminal">
      {lines.map((line, i) => (
        <pre key={i} className={i === 2 ? "terminal-output" : "terminal-cmd"}>
          {line}
        </pre>
      ))}
      {loading && <span className="terminal-cursor">█</span>}
    </div>
  );
};

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const cleanLang = (language || "").toLowerCase().trim();
  const isRunnable = cleanLang === "html" || cleanLang === "c";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleRun = () => {
    setShowSandbox(true);
  };

  const handleClose = () => {
    setShowSandbox(false);
  };

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (showSandbox) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSandbox]);

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-block-language">{language || "code"}</span>
        <div style={{ display: "flex", alignItems: "center" }}>
          {isRunnable && (
            <button
              onClick={handleRun}
              className="code-block-run-btn"
              title={`Run ${language.toUpperCase()} code`}
            >
              <Play size={12} />
              <span>Run Code</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className={`code-block-copy-btn ${copied ? "copied" : ""}`}
            aria-label="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy code</span>
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="code-block-pre">
        <code className="code-block-code">{value}</code>
      </pre>

      {showSandbox && (
        <div className="run-modal-overlay" onClick={handleClose}>
          <div 
            className="run-modal-container" 
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
          >
            <div className="run-modal-header">
              <span className="run-modal-title">
                {cleanLang === "c" ? <TerminalIcon size={16} /> : <Play size={16} />}
                <span>
                  {cleanLang === "c" ? "GCC Compiler Console (main.c)" : "HTML Preview Sandbox"}
                </span>
              </span>
              <button 
                className="run-modal-close-btn" 
                onClick={handleClose}
                title="Close Sandbox"
              >
                <X size={16} />
              </button>
            </div>
            <div className="run-modal-body">
              {cleanLang === "html" ? (
                <iframe 
                  srcDoc={value} 
                  className="sandbox-iframe" 
                  title="HTML Output Sandbox" 
                  sandbox="allow-scripts"
                />
              ) : (
                <CTerminal code={value} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
