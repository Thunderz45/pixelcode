import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  Send, 
  PanelLeft, 
  Code, 
  Mic, 
  MicOff, 
  ChevronDown, 
  Activity, 
  LayoutGrid, 
  Copy, 
  RotateCw, 
  Trash2, 
  Plus, 
  Settings 
} from "lucide-react";
import { auth } from "../firebase";
import type { Message } from "../services/groq";
import { CodeBlock } from "./CodeBlock";
import "./ChatArea.css";

interface ChatAreaProps {
  chatTitle: string;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onToggleSidebar: () => void;
  onRegenerateMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  chatTitle,
  messages,
  isLoading,
  onSendMessage,
  onToggleSidebar,
  onRegenerateMessage,
  onDeleteMessage,
}) => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [showScrollBottom, setShowScrollBottom] = useState(false);
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
            backgroundColor: 0x0d0d0d
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
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
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
    <div className="chat-area">
      <div id="vanta-chat-background" className="vanta-chat-bg"></div>
      
      <header className="chat-header d-flex align-items-center justify-content-between">
        <div className="chat-header-title d-flex align-items-center gap-2">
          <button className="sidebar-toggle-btn" onClick={onToggleSidebar} title="Toggle Sidebar">
            <PanelLeft size={20} />
          </button>
          <div className="chat-header-dropdown-trigger d-flex align-items-center gap-1 cursor-pointer">
            <span className="chat-header-name fw-medium">
              {messages.length > 0 ? (chatTitle || "pixelcode") : "pixelcode"}
            </span>
            <ChevronDown size={14} className="text-muted" />
          </div>
        </div>
        
        <div className="chat-header-actions d-flex align-items-center gap-2">
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
                      <div className="message-avatar-icon">
                        <Code size={12} />
                      </div>
                      <span className="message-avatar-name">Assistant</span>
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
                      {cleanContent}
                    </ReactMarkdown>
                  </div>

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
                <div className="message-avatar-icon">
                  <Code size={12} />
                </div>
                <span className="message-avatar-name">Assistant</span>
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
        <form className="input-form-wrapper" onSubmit={handleSend}>
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
              <button type="button" className="toolbar-btn" title="Add files">
                <Plus size={16} />
              </button>
              <button type="button" className="toolbar-btn" title="Settings">
                <Settings size={16} />
              </button>
              <div className="tools-badge">
                <span>Tools</span>
                <span className="tools-count">3</span>
              </div>
              <div className="model-dropdown">
                <span>llama-3.3-70b</span>
                <span style={{ marginLeft: "4px" }}>▾</span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className={`voice-btn-circle ${isListening ? "listening" : ""}`}
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Dictate message"}
                disabled={isLoading}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button type="submit" className="send-btn" disabled={!input.trim() || isLoading}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </form>
        <p className="input-footer-text">
          Pixelcode. Powered by Pixelstudio & Groq.
        </p>
      </div>
    </div>
  );
};

