import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  Send, 
  PanelLeft, 
  Code,
  Layers,
  Mic, 
  MicOff, 
  ChevronDown, 
  Activity, 
  LayoutGrid, 
  Copy, 
  RotateCw, 
  Trash2, 
  Plus, 
  Settings,
  HeartHandshake,
  AudioLines
} from "lucide-react";
import { auth } from "../firebase";
import type { Message } from "../services/groq";
import { CodeBlock } from "./CodeBlock";
import { SahayakVoiceMode } from "./SahayakVoiceMode";
import "./ChatArea.css";

interface ChatAreaProps {
  chatTitle: string;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onToggleSidebar: () => void;
  onRegenerateMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  projectName: string | null;
  onOpenSettings: () => void;
  selectedModel: 'pro' | 'high' | 'low';
  onChangeModel: (model: 'pro' | 'high' | 'low') => void;
  activeAgent: 'fullstack' | 'uiux' | 'designtocode' | 'sahayak' | 'general';
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  chatTitle,
  messages,
  isLoading,
  onSendMessage,
  onToggleSidebar,
  onRegenerateMessage,
  onDeleteMessage,
  projectName,
  onOpenSettings,
  selectedModel,
  onChangeModel,
  activeAgent,
}) => {
  const [input, setInput] = useState("");
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);

  const getAgentDetails = () => {
    switch (activeAgent) {
      case 'designtocode':
        return { name: 'Design-to-Code Agent', color: '#8b5cf6', icon: Code, className: 'agent-designtocode' };
      case 'fullstack':
        return { name: 'Fullstack Agent', color: '#f59e0b', icon: Layers, className: 'agent-fullstack' };
      case 'sahayak':
        return { name: 'Sahayak', color: '#10b981', icon: HeartHandshake, className: 'agent-sahayak' };
      default:
        return null;
    }
  };
  const agentDetails = getAgentDetails();
  const [isListening, setIsListening] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    let effect: any = null;
    const initVanta = () => {
      if ((window as any).VANTA && (window as any).VANTA.NET) {
        try {
          effect = (window as any).VANTA.NET({
            el: "#vanta-chat-background",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0xffffff,
            backgroundColor: 0x0
          });
        } catch (err) {
          console.error("Vanta initialization failed:", err);
        }
      }
    };

    if (!(window as any).VANTA || !(window as any).VANTA.NET) {
      const interval = setInterval(() => {
        if ((window as any).VANTA && (window as any).VANTA.NET) {
          initVanta();
          clearInterval(interval);
        }
      }, 100);
      return () => {
        clearInterval(interval);
        if (effect) effect.destroy();
      };
    } else {
      initVanta();
    }

    return () => {
      if (effect) effect.destroy();
    };
  }, []);

  const user = auth.currentUser;

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? " " : "") + transcript);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      // Avoid clipping by setting directly to scrollHeight
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachedImage) || isLoading) return;
    
    let contentToSend = input.trim();
    if (attachedImage) {
      contentToSend += `\n\n![Code Screenshot](${attachedImage})`;
    }
    
    onSendMessage(contentToSend);
    setInput("");
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    const name = user?.displayName || user?.email?.split("@")[0] || "Developer";
    const upperName = name.toUpperCase();
    if (hr < 12) return `Good morning, ${upperName}`;
    if (hr < 18) return `Good afternoon, ${upperName}`;
    return `Good evening, ${upperName}`;
  };

  const getReasoningAndContent = (content: string) => {
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      return {
        reasoning: thinkMatch[1].trim(),
        cleanContent: content.replace(/<think>[\s\S]*?<\/think>/, "").trim()
      };
    }
    if (content && content.length > 20) {
      return {
        reasoning: "Analyzed request context and initialized the corresponding developer guide.",
        cleanContent: content
      };
    }
    return { reasoning: null, cleanContent: content };
  };

  const toggleReasoning = (messageId: string) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const isScrolledUp = container.scrollHeight - container.scrollTop - container.clientHeight > 200;
    setShowScrollBottom(isScrolledUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
    <div className="chat-area">
      <div id="vanta-chat-background" className="vanta-chat-bg"></div>

      
      <header className="chat-header d-flex align-items-center justify-content-between">
        <div className="chat-header-title d-flex align-items-center gap-2">
          <button className="sidebar-toggle-btn" onClick={onToggleSidebar} title="Toggle Sidebar">
            <PanelLeft size={20} />
          </button>
          <div className="chat-header-dropdown-trigger d-flex align-items-center gap-1 cursor-pointer">
            <span className="chat-header-name fw-medium">
              {projectName ? `${projectName} / ` : ""}{messages.length > 0 ? (chatTitle || "pixelcode") : "pixelcode"}
            </span>
            <ChevronDown size={14} className="text-muted" />
          </div>
          {agentDetails && (
            <span 
              className="ms-2 px-2 py-0.5 rounded text-white fw-semibold d-inline-flex align-items-center gap-1"
              style={{ 
                fontSize: "0.75rem", 
                backgroundColor: agentDetails.color,
                boxShadow: `0 0 8px ${agentDetails.color}40`,
                lineHeight: "1.2"
              }}
            >
              <agentDetails.icon size={11} />
              {agentDetails.name}
            </span>
          )}
        </div>
        
        <div className="chat-header-actions d-flex align-items-center gap-2">
          {activeAgent === 'sahayak' && (
            <button 
              className={`sahayak-voice-trigger-btn ${voiceModeOpen ? "active" : ""}`}
              onClick={() => setVoiceModeOpen(!voiceModeOpen)}
              title={voiceModeOpen ? "Stop Voice Mode" : "Start Voice Mode"}
              style={voiceModeOpen ? {
                background: "rgba(16, 185, 129, 0.25)",
                borderColor: "#10b981",
                boxShadow: "0 0 12px rgba(16, 185, 129, 0.3)"
              } : undefined}
            >
              <AudioLines size={15} />
              <span>{voiceModeOpen ? "Voice Active" : "Voice"}</span>
            </button>
          )}
          <button className="header-action-btn" title="Activity Wave">
            <Activity size={18} />
          </button>
          <button className="header-action-btn" title="Workspace Layout">
            <LayoutGrid size={18} />
          </button>
        </div>
      </header>

      <div className="messages-container" onScroll={handleScroll}>
        {messages.length === 0 ? (
          <div className="welcome-screen d-flex align-items-center justify-content-center w-100 h-100 flex-grow-1">
            <h1 className="welcome-title text-center">
              {getGreeting()}
            </h1>
          </div>
        ) : (
          messages.map((msg) => {
            const isAssistant = msg.role === "assistant";
            const { reasoning, cleanContent } = isAssistant
              ? getReasoningAndContent(msg.content)
              : { reasoning: null, cleanContent: msg.content };

            return (
              <div key={msg.id} className={`message-row ${msg.role}`}>
                <div className="message-bubble">
                  {isAssistant && (
                    <div className="message-avatar-wrapper">
                      <div 
                        className="message-avatar-icon text-white"
                        style={agentDetails ? { backgroundColor: agentDetails.color, borderColor: agentDetails.color } : undefined}
                      >
                        {agentDetails ? <agentDetails.icon size={12} /> : <Code size={12} />}
                      </div>
                      <span 
                        className="message-avatar-name"
                        style={agentDetails ? { color: agentDetails.color } : undefined}
                      >
                        {agentDetails ? agentDetails.name : "Assistant"}
                      </span>
                    </div>
                  )}

                  {isAssistant && reasoning && (
                    <div className="reasoning-accordion mb-2">
                      <button 
                        type="button"
                        className="reasoning-toggle-btn d-flex align-items-center gap-1"
                        onClick={() => toggleReasoning(msg.id)}
                      >
                        <ChevronDown 
                          size={14} 
                          style={{ 
                            transform: expandedReasoning[msg.id] ? "rotate(0deg)" : "rotate(-90deg)",
                            transition: "transform 0.2s" 
                          }} 
                        />
                        <span>Reasoned for a few seconds</span>
                      </button>
                      
                      {expandedReasoning[msg.id] && (
                        <div className="reasoning-content p-3 mt-1 rounded-3">
                          {reasoning}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="markdown-content">
                    <ReactMarkdown
                      urlTransform={(value: string) => value}
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          const language = match ? match[1] : "";
                          const isInline = !match;

                          return !isInline ? (
                            <CodeBlock
                              language={language}
                              value={String(children).replace(/\n$/, "")}
                            />
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {cleanContent.replace("[UI_GENERATION_IN_PROGRESS]", "")}
                    </ReactMarkdown>
                  </div>
                  
                  {cleanContent.includes("[UI_GENERATION_IN_PROGRESS]") && (
                    <div className="image-generation-loader mt-3">
                      <div className="image-generation-shimmer"></div>
                      <div className="image-generation-content d-flex align-items-center justify-content-center gap-2">
                        <Activity size={18} className="text-white" />
                        <span className="fw-medium text-white" style={{ letterSpacing: "1px", fontSize: "0.85rem" }}>GENERATING UI DESIGN...</span>
                      </div>
                    </div>
                  )}

                  {isAssistant && (
                    <div className="assistant-message-actions d-flex align-items-center gap-1 mt-2">
                      <button 
                        type="button"
                        className="message-action-btn-circle" 
                        onClick={() => navigator.clipboard.writeText(cleanContent)} 
                        title="Copy Response"
                      >
                        <Copy size={13} />
                      </button>
                      <button 
                        type="button"
                        className="message-action-btn-circle" 
                        onClick={() => onRegenerateMessage && onRegenerateMessage(msg.id)} 
                        title="Regenerate Response"
                      >
                        <RotateCw size={13} />
                      </button>
                      <button 
                        type="button"
                        className="message-action-btn-circle" 
                        onClick={() => onDeleteMessage && onDeleteMessage(msg.id)} 
                        title="Delete Message"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="message-row assistant">
            <div className="message-bubble">
              <div className="message-avatar-wrapper">
                <div 
                  className="message-avatar-icon text-white"
                  style={agentDetails ? { backgroundColor: agentDetails.color, borderColor: agentDetails.color } : undefined}
                >
                  {agentDetails ? <agentDetails.icon size={12} /> : <Code size={12} />}
                </div>
                <span 
                  className="message-avatar-name"
                  style={agentDetails ? { color: agentDetails.color } : undefined}
                >
                  {agentDetails ? agentDetails.name : "Assistant"}
                </span>
              </div>
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showScrollBottom && (
        <button 
          type="button"
          className="scroll-bottom-btn" 
          onClick={scrollToBottom} 
          title="Scroll to bottom"
        >
          ↓
        </button>
      )}

      <div className="input-container">
        <form 
          className={`input-form-wrapper ${agentDetails ? agentDetails.className : ''}`} 
          onSubmit={handleSend}
          style={agentDetails ? {
            borderColor: `${agentDetails.color}50`,
            boxShadow: `0 0 10px ${agentDetails.color}10`
          } : undefined}
        >
          {attachedImage && (
            <div className="image-attachment-preview mb-2 position-relative d-inline-block" style={{ textAlign: "left" }}>
              <img 
                src={attachedImage} 
                alt="Upload preview" 
                style={{ maxHeight: "80px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)" }} 
              />
              <button
                type="button"
                className="position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center"
                style={{
                  width: "18px",
                  height: "18px",
                  fontSize: "9px",
                  transform: "translate(50%, -50%)",
                  border: "none",
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
                onClick={handleRemoveAttachment}
              >
                ✕
              </button>
            </div>
          )}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything or @mention"
            className="chat-textarea"
            disabled={isLoading}
          />
          
          <div className="input-toolbar d-flex align-items-center justify-content-between w-100 mt-2">
            <div className="d-flex align-items-center gap-2">
              <button 
                type="button" 
                className="toolbar-btn" 
                title="Add files"
                onClick={handlePlusClick}
              >
                <Plus size={16} />
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleFileChange}
              />
              <button 
                type="button" 
                className="toolbar-btn" 
                title="Settings"
                onClick={onOpenSettings}
              >
                <Settings size={16} />
              </button>
              
              <div className="model-dropdown-container position-relative">
                <div 
                  className="model-dropdown" 
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  <span>
                    {selectedModel === 'pro' ? 'Pro Model' : selectedModel === 'high' ? 'High Model' : 'Low Model'}
                  </span>
                  <span style={{ marginLeft: "4px" }}>▾</span>
                </div>
                
                {modelDropdownOpen && (
                  <div 
                    className="model-select-menu"
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      left: "0",
                      backgroundColor: "#18181b",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "8px",
                      padding: "4px",
                      zIndex: "100",
                      marginBottom: "6px",
                      minWidth: "150px"
                    }}
                  >
                    <div 
                      className={`model-select-item p-2 rounded-2 ${selectedModel === 'pro' ? 'active' : ''}`}
                      style={{ cursor: "pointer", padding: "8px 12px", color: "#fff", fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}
                      onClick={() => {
                        onChangeModel('pro');
                        setModelDropdownOpen(false);
                      }}
                    >
                      Pro Model (70B)
                    </div>
                    <div 
                      className={`model-select-item p-2 rounded-2 ${selectedModel === 'high' ? 'active' : ''}`}
                      style={{ cursor: "pointer", padding: "8px 12px", color: "#fff", fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}
                      onClick={() => {
                        onChangeModel('high');
                        setModelDropdownOpen(false);
                      }}
                    >
                      High Model (Mixtral)
                    </div>
                    <div 
                      className={`model-select-item p-2 rounded-2 ${selectedModel === 'low' ? 'active' : ''}`}
                      style={{ cursor: "pointer", padding: "8px 12px", color: "#fff", fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}
                      onClick={() => {
                        onChangeModel('low');
                        setModelDropdownOpen(false);
                      }}
                    >
                      Low Model (Gemma)
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              {activeAgent === 'sahayak' ? (
                <button
                  type="button"
                  className={`voice-btn-circle sahayak-voice-toggle ${voiceModeOpen ? "active" : ""}`}
                  onClick={() => setVoiceModeOpen(!voiceModeOpen)}
                  title={voiceModeOpen ? "Disable Sahayak Voice Mode" : "Enable Sahayak Voice Mode"}
                  style={{
                    backgroundColor: voiceModeOpen ? "#10b981" : undefined,
                    boxShadow: voiceModeOpen ? "0 0 10px rgba(16, 185, 129, 0.4)" : undefined,
                    color: "#fff"
                  }}
                >
                  <AudioLines size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className={`voice-btn-circle ${isListening ? "listening" : ""}`}
                  onClick={toggleListening}
                  title={isListening ? "Stop listening" : "Dictate message"}
                  disabled={isLoading}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              )}

              <button type="submit" className="send-btn" disabled={!input.trim() || isLoading}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </form>
        <p className="input-footer-text">
          Pixelcode. Powered by Pixelstudio & OpenRouter.
        </p>
      </div>

      {/* Sahayak Voice Mode Compact Floating Widget */}
      <SahayakVoiceMode
        isOpen={voiceModeOpen}
        onClose={() => setVoiceModeOpen(false)}
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        messages={messages}
        onTranscriptChange={setInput}
      />
    </div>
    </>
  );
};
