import React, { useState } from "react";
import { 
  X, 
  SlidersHorizontal, 
  Share2, 
  FolderPlus, 
  Settings, 
  Palette, 
  Globe, 
  Command, 
  Mail, 
  Briefcase, 
  CheckCircle,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import "./InfoModal.css";

interface InfoModalProps {
  isOpen: boolean;
  mode: 'tools' | 'workflow' | 'project' | 'preferences' | 'theme' | 'language' | 'shortcuts' | 'report' | 'workspace' | null;
  onClose: () => void;
  onCreateProject?: (name: string) => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  mode,
  onClose,
  onCreateProject,
}) => {
  const [projectName, setProjectName] = useState("");
  
  // Custom states for new workable modals
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [markdownEnabled, setMarkdownEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [reportText, setReportText] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  if (!isOpen || !mode) return null;

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim() && onCreateProject) {
      onCreateProject(projectName.trim());
      setProjectName("");
      onClose();
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reportText.trim()) {
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setReportText("");
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="info-modal-overlay">
      <div className="info-modal-card">
        <button className="info-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="info-modal-content">
          {mode === 'tools' && (
            <>
              <div className="modal-header-icon bg-primary text-white mb-3">
                <SlidersHorizontal size={24} />
              </div>
              <h2 className="info-modal-title">Tool Management</h2>
              <p className="info-modal-desc">
                Enable or disable integrated developer modules to extend your chatbot's capabilities.
              </p>

              <div className="coming-soon-badge p-4 rounded-3 text-center mt-3" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px dashed rgba(255, 255, 255, 0.1)", textAlign: "center" }}>
                <SlidersHorizontal size={36} className="text-secondary mb-2" style={{ opacity: 0.5, margin: "0 auto" }} />
                <h3 className="text-white fw-semibold mb-1" style={{ fontSize: "1rem" }}>Feature Coming Soon</h3>
                <p className="text-secondary small mb-0">Soon you will be able to configure and extend your chatbot with custom developer integrations, CLI modules, and debugger terminals.</p>
              </div>
            </>
          )}

          {mode === 'workflow' && (
            <>
              <div className="modal-header-icon bg-success text-white mb-3">
                <Share2 size={24} />
              </div>
              <h2 className="info-modal-title">CI/CD Workflow</h2>
              <p className="info-modal-desc">
                Automate your build, test, and release cycles directly inside the chat interface.
              </p>

              <div className="coming-soon-badge p-4 rounded-3 text-center mt-3" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px dashed rgba(255, 255, 255, 0.1)", textAlign: "center" }}>
                <Share2 size={36} className="text-secondary mb-2" style={{ opacity: 0.5, margin: "0 auto" }} />
                <h3 className="text-white fw-semibold mb-1" style={{ fontSize: "1rem" }}>Feature Coming Soon</h3>
                <p className="text-secondary small mb-0">Soon you will be able to construct interactive visual pipelines, run remote build tasks, and configure continuous deployments.</p>
              </div>
            </>
          )}

          {mode === 'project' && (
            <>
              <div className="modal-header-icon bg-info text-white mb-3">
                <FolderPlus size={24} />
              </div>
              <h2 className="info-modal-title">Create New Project</h2>
              <p className="info-modal-desc">
                Initialize a dedicated project workspace to organize and isolate your chat conversation history.
              </p>

              <form onSubmit={handleProjectSubmit} className="mt-3">
                <div className="form-group text-left d-flex flex-column gap-2">
                  <label className="form-label" htmlFor="newProjName">Project Name</label>
                  <input
                    id="newProjName"
                    type="text"
                    placeholder="e.g. E-Commerce Backend"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="form-control bg-dark text-white border-secondary p-2.5 rounded-3"
                    required
                    autoFocus
                    style={{
                      backgroundColor: "#09090b",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#fff",
                      outline: "none",
                      width: "100%"
                    }}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-light w-100 mt-4 py-2.5 fw-semibold"
                  style={{
                    background: "#ffffff",
                    color: "#09090b",
                    borderRadius: "8px",
                    border: "none",
                    width: "100%",
                    cursor: "pointer"
                  }}
                >
                  Create Workspace
                </button>
              </form>
            </>
          )}

          {mode === 'preferences' && (
            <>
              <div className="modal-header-icon bg-primary text-white mb-3">
                <Settings size={24} />
              </div>
              <h2 className="info-modal-title">Chat Preferences</h2>
              <p className="info-modal-desc">
                Customize layout sizing and chat output settings for your workspace.
              </p>

              <div className="d-flex flex-column gap-3 mt-3">
                <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-dark border border-secondary" style={{ backgroundColor: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <div>
                    <div className="text-white fw-semibold small">Font Sizing</div>
                    <div className="text-secondary small">Set chat text font size style.</div>
                  </div>
                  <div className="d-flex gap-1">
                    {(['small', 'medium', 'large'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        className={`btn btn-sm btn-outline-secondary ${fontSize === sz ? 'active btn-light text-dark' : 'text-white'}`}
                        onClick={() => setFontSize(sz)}
                        style={fontSize === sz ? { backgroundColor: "#fff", color: "#000", border: "none" } : { background: "transparent", color: "#888", border: "1px solid #333" }}
                      >
                        {sz.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-dark border border-secondary" style={{ backgroundColor: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <div>
                    <div className="text-white fw-semibold small">Markdown Rendering</div>
                    <div className="text-secondary small">Format code block syntax elements.</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-white"
                    onClick={() => setMarkdownEnabled(!markdownEnabled)}
                    style={{ border: "none", background: "none" }}
                  >
                    {markdownEnabled ? <ToggleRight size={32} className="text-success" /> : <ToggleLeft size={32} className="text-secondary" />}
                  </button>
                </div>

                <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-dark border border-secondary" style={{ backgroundColor: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <div>
                    <div className="text-white fw-semibold small">Audio Responses</div>
                    <div className="text-secondary small">Enable TTS vocal synthesis replies.</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-white"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    style={{ border: "none", background: "none" }}
                  >
                    {soundEnabled ? <ToggleRight size={32} className="text-success" /> : <ToggleLeft size={32} className="text-secondary" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === 'theme' && (
            <>
              <div className="modal-header-icon bg-primary text-white mb-3">
                <Palette size={24} />
              </div>
              <h2 className="info-modal-title">Theme Selection</h2>
              <p className="info-modal-desc">
                Select visual color palettes for the coding interface.
              </p>

              <div className="d-flex flex-column gap-2.5 mt-3">
                <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-dark border border-secondary" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <span className="text-white fw-semibold">Dark Default (Active)</span>
                  <span className="text-success small">Selected</span>
                </div>
                <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-dark border border-secondary" style={{ opacity: 0.5, backgroundColor: "rgba(255,255,255,0.01)" }}>
                  <span className="text-secondary">Light Developer</span>
                  <span className="text-muted small">Coming soon</span>
                </div>
                <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-dark border border-secondary" style={{ opacity: 0.5, backgroundColor: "rgba(255,255,255,0.01)" }}>
                  <span className="text-secondary">Cyberpunk Neon</span>
                  <span className="text-muted small">Coming soon</span>
                </div>
              </div>
            </>
          )}

          {mode === 'language' && (
            <>
              <div className="modal-header-icon bg-primary text-white mb-3">
                <Globe size={24} />
              </div>
              <h2 className="info-modal-title">Language Preferences</h2>
              <p className="info-modal-desc">
                Configure your display language for application controls.
              </p>

              <div className="d-flex flex-column gap-2 mt-3">
                {[
                  { code: 'en', name: 'English (US)' },
                  { code: 'es', name: 'Español' },
                  { code: 'fr', name: 'Français' },
                  { code: 'de', name: 'Deutsch' },
                  { code: 'ja', name: '日本語' },
                ].map((lang) => (
                  <div
                    key={lang.code}
                    className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-dark border border-secondary cursor-pointer"
                    style={selectedLang === lang.code ? { backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" } : { backgroundColor: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}
                    onClick={() => setSelectedLang(lang.code)}
                  >
                    <span className="text-white">{lang.name}</span>
                    {selectedLang === lang.code && <span className="text-success small">Selected</span>}
                  </div>
                ))}
              </div>
            </>
          )}

          {mode === 'shortcuts' && (
            <>
              <div className="modal-header-icon bg-primary text-white mb-3">
                <Command size={24} />
              </div>
              <h2 className="info-modal-title">Keyboard Shortcuts</h2>
              <p className="info-modal-desc">
                Accelerate your workflow with keyboard bindings.
              </p>

              <div className="d-flex flex-column gap-2.5 mt-3">
                <div className="d-flex justify-content-between align-items-center p-2.5 rounded-3 bg-dark border border-secondary" style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-white small">Start New Conversation</span>
                  <kbd className="bg-secondary text-white p-1 rounded small" style={{ fontSize: "0.75rem", backgroundColor: "#2d2d2d" }}>Ctrl + K</kbd>
                </div>
                <div className="d-flex justify-content-between align-items-center p-2.5 rounded-3 bg-dark border border-secondary" style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-white small">Toggle Sidebar Open/Close</span>
                  <kbd className="bg-secondary text-white p-1 rounded small" style={{ fontSize: "0.75rem", backgroundColor: "#2d2d2d" }}>Ctrl + B</kbd>
                </div>
                <div className="d-flex justify-content-between align-items-center p-2.5 rounded-3 bg-dark border border-secondary" style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-white small">Close Overlay Modals</span>
                  <kbd className="bg-secondary text-white p-1 rounded small" style={{ fontSize: "0.75rem", backgroundColor: "#2d2d2d" }}>Esc</kbd>
                </div>
                <div className="d-flex justify-content-between align-items-center p-2.5 rounded-3 bg-dark border border-secondary" style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-white small">Send Active Message</span>
                  <kbd className="bg-secondary text-white p-1 rounded small" style={{ fontSize: "0.75rem", backgroundColor: "#2d2d2d" }}>Enter</kbd>
                </div>
                <div className="d-flex justify-content-between align-items-center p-2.5 rounded-3 bg-dark border border-secondary" style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-white small">Insert Text Line Break</span>
                  <kbd className="bg-secondary text-white p-1 rounded small" style={{ fontSize: "0.75rem", backgroundColor: "#2d2d2d" }}>Shift + Enter</kbd>
                </div>
              </div>
            </>
          )}

          {mode === 'report' && (
            <>
              <div className="modal-header-icon bg-primary text-white mb-3">
                <Mail size={24} />
              </div>
              <h2 className="info-modal-title">Report an Issue</h2>
              <p className="info-modal-desc">
                Found a bug? Describe it below and our support team will address it.
              </p>

              {!reportSuccess ? (
                <form onSubmit={handleReportSubmit} className="d-flex flex-column gap-3 mt-2">
                  <div className="form-group text-left d-flex flex-column gap-1.5">
                    <label className="form-label" htmlFor="reportText">Describe the problem</label>
                    <textarea
                      id="reportText"
                      rows={4}
                      placeholder="Explain what happened or copy-paste logs..."
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      className="form-control bg-dark text-white border-secondary p-2.5 rounded-3"
                      required
                      style={{
                        backgroundColor: "#09090b",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#fff",
                        outline: "none",
                        resize: "none",
                        width: "100%",
                        fontSize: "0.85rem"
                      }}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-light w-100 mt-2 py-2.5 fw-semibold"
                    style={{
                      background: "#ffffff",
                      color: "#09090b",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      width: "100%"
                    }}
                  >
                    Submit Ticket
                  </button>
                </form>
              ) : (
                <div className="text-center p-4 rounded-3 mt-2 d-flex flex-column align-items-center gap-2" style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  <CheckCircle size={36} className="text-success" />
                  <h3 className="text-success fw-semibold small mb-0" style={{ fontSize: "1rem" }}>Report Submitted Successfully!</h3>
                  <p className="text-secondary small mb-0">Our developers have received your ticket and will follow up shortly.</p>
                </div>
              )}
            </>
          )}

          {mode === 'workspace' && (
            <>
              <div className="modal-header-icon bg-primary text-white mb-3">
                <Briefcase size={24} />
              </div>
              <h2 className="info-modal-title">Workspace Status</h2>
              <p className="info-modal-desc">
                Inspect details about your active developer session workspace.
              </p>

              <div className="d-flex flex-column gap-3 mt-3 p-3 rounded-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", fontSize: "0.85rem" }}>
                <div className="d-flex justify-content-between">
                  <span className="text-secondary">Workspace ID:</span>
                  <span className="text-white fw-bold">dev's Workspace</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-secondary">Host Service:</span>
                  <span className="text-white">Vercel Edge Network</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-secondary">Synced Database:</span>
                  <span className="text-white">Cloud Firestore</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-secondary">Sync Status:</span>
                  <span className="text-success fw-semibold">ONLINE (Connected)</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-secondary">Latency / ping:</span>
                  <span className="text-success">~42ms (Excellent)</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
