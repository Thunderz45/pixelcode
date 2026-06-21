import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, PanelLeft, Code, Mic, MicOff } from "lucide-react";
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
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  chatTitle,
  messages,
  isLoading,
  onSendMessage,
  onToggleSidebar,
}) => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
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

  return (
    <div className="chat-area">
      <div id="vanta-chat-background" className="vanta-chat-bg"></div>
      <header className="chat-header">
        <div className="chat-header-title">
          <button className="sidebar-toggle-btn" onClick={onToggleSidebar} title="Toggle Sidebar">
            <PanelLeft size={20} />
          </button>
          <span className="chat-header-name">{messages.length > 0 ? (chatTitle || "pixelcode") : "pixelcode"}</span>
        </div>
      </header>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-screen d-flex align-items-center justify-content-center w-100 h-100 flex-grow-1">
            <h1 className="welcome-title text-center">
              {getGreeting()}
            </h1>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.role}`}>
              <div className="message-bubble">
                {msg.role === "assistant" && (
                  <div className="message-avatar-wrapper">
                    <div className="message-avatar-icon">
                      <Code size={12} />
                    </div>
                    <span className="message-avatar-name">Assistant</span>
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
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))
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
          
          <div className="input-toolbar d-flex align-items-center justify-content-end w-100 mt-2 gap-2">
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
        </form>
        <p className="input-footer-text">
          Pixelcode. Powered by Pixelstudio & Groq.
        </p>
      </div>
    </div>
  );
};
