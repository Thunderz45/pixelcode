import React, { useState, useEffect, useRef } from "react";
import { Mic, X, Volume2, Loader, Square } from "lucide-react";
import type { Message } from "../services/groq";
import "./SahayakVoiceMode.css";

type VoiceState = "LISTENING" | "PROCESSING" | "SPEAKING";

interface SahayakVoiceModeProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  messages: Message[];
  onTranscriptChange?: (text: string) => void;
}

export const SahayakVoiceMode: React.FC<SahayakVoiceModeProps> = ({
  isOpen,
  onClose,
  onSendMessage,
  isLoading,
  messages,
  onTranscriptChange,
}) => {
  const [state, setState] = useState<VoiceState>("LISTENING");
  const [displayText, setDisplayText] = useState("Listening...");

  const recognitionRef = useRef<any>(null);
  const prevLoadingRef = useRef(false);
  const stateRef = useRef<VoiceState>("LISTENING");
  const mountedRef = useRef(true);
  const restartTimerRef = useRef<any>(null);
  const spokenTextLengthRef = useRef(0);
  const currentMessageIdRef = useRef<string | null>(null);

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopEverything();
    };
  }, []);

  // Load voices early (Chrome needs this)
  useEffect(() => {
    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    };
  }, []);

  // Start voice mode when overlay opens
  useEffect(() => {
    if (isOpen) {
      const SR =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (!SR) {
        alert(
          "Speech recognition is not supported in this browser. Please use Chrome or Edge."
        );
        onClose();
        return;
      }

      setState("LISTENING");
      setDisplayText("Listening...");
      prevLoadingRef.current = false;

      // Small delay to let the overlay render before starting mic
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          startListening();
        }
      }, 500);

      return () => {
        clearTimeout(timer);
      };
    } else {
      stopEverything();
    }
  }, [isOpen]);

  const startListening = () => {
    if (!mountedRef.current) return;

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    let finalText = "";

    rec.onresult = (event: any) => {
      let interim = "";
      finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const display = finalText || interim;
      if (display && mountedRef.current) {
        setDisplayText(display);
        onTranscriptChange?.(display);
      }
    };

    rec.onend = () => {
      if (!mountedRef.current) return;
      const text = finalText.trim();

      if (text && stateRef.current === "LISTENING") {
        // User spoke something → send it
        setState("PROCESSING");
        setDisplayText(text);
        onSendMessage(text);
        onTranscriptChange?.(""); // Clear input when message is sent
      } else if (stateRef.current === "LISTENING") {
        // No speech detected → restart after a short delay
        restartTimerRef.current = setTimeout(() => {
          if (mountedRef.current && stateRef.current === "LISTENING") {
            startListening();
          }
        }, 300);
      }
    };

    rec.onerror = (event: any) => {
      if (!mountedRef.current) return;

      if (
        event.error === "no-speech" &&
        stateRef.current === "LISTENING"
      ) {
        // No speech heard → restart after delay
        restartTimerRef.current = setTimeout(() => {
          if (mountedRef.current && stateRef.current === "LISTENING") {
            startListening();
          }
        }, 300);
      } else if (event.error === "aborted") {
        // Intentionally stopped, ignore
      } else {
        console.error("Speech recognition error:", event.error);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
    }
  };

  // Watch for AI streaming (sentence-by-sentence reading)
  useEffect(() => {
    if (!isOpen) return;

    // Reset/cancel speech if the user sends a new message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "user") {
      window.speechSynthesis.cancel();
      spokenTextLengthRef.current = 0;
      prevLoadingRef.current = isLoading;
      return;
    }

    // Find the latest assistant message
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");

    if (!lastAssistant) {
      prevLoadingRef.current = isLoading;
      return;
    }

    // If we have a new assistant message ID, reset character pointer
    if (currentMessageIdRef.current !== lastAssistant.id) {
      currentMessageIdRef.current = lastAssistant.id;
      spokenTextLengthRef.current = 0;
    }

    // Extract the new text since our last check
    const rawContent = lastAssistant.content;
    if (rawContent.length > spokenTextLengthRef.current) {
      const newSegment = rawContent.substring(spokenTextLengthRef.current);

      // Search for terminators: ". ", "? ", "! ", "\n"
      let searchIndex = 0;
      const terminators = [". ", "? ", "! ", "\n"];

      while (searchIndex < newSegment.length) {
        let earliestTerminatorIndex = -1;
        let terminatorLength = 0;

        for (const term of terminators) {
          const idx = newSegment.indexOf(term, searchIndex);
          if (idx !== -1 && (earliestTerminatorIndex === -1 || idx < earliestTerminatorIndex)) {
            earliestTerminatorIndex = idx;
            terminatorLength = term.length;
          }
        }

        if (earliestTerminatorIndex !== -1) {
          const sentencePart = newSegment.substring(searchIndex, earliestTerminatorIndex + terminatorLength);
          const cleanSentence = cleanTextForTTS(sentencePart);
          
          if (cleanSentence) {
            setState("SPEAKING");
            setDisplayText(cleanSentence);
            speakSentence(cleanSentence, false);
          }

          searchIndex = earliestTerminatorIndex + terminatorLength;
          spokenTextLengthRef.current += sentencePart.length;
        } else {
          break;
        }
      }
    }

    // If AI finished loading and we've got remaining text
    if (prevLoadingRef.current && !isLoading) {
      const rawContent = lastAssistant.content;
      const remainingText = rawContent.substring(spokenTextLengthRef.current);
      const cleanRemaining = cleanTextForTTS(remainingText);

      if (cleanRemaining) {
        setState("SPEAKING");
        setDisplayText(cleanRemaining);
        speakSentence(cleanRemaining, true); // true = final sentence
        spokenTextLengthRef.current = rawContent.length;
      } else {
        // If there's no remaining text to speak, transition back to listening
        setState("LISTENING");
        setDisplayText("Listening...");
        restartTimerRef.current = setTimeout(() => {
          if (mountedRef.current && stateRef.current === "LISTENING") {
            startListening();
          }
        }, 500);
      }
    }

    prevLoadingRef.current = isLoading;
  }, [isLoading, messages, isOpen]);

  const cleanTextForTTS = (content: string): string => {
    return content
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/[*_~]/g, "")
      .replace(/->|=>/g, " to ")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  const speakSentence = (text: string, isFinal: boolean) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98; // Warm, professional pacing
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    
    // Select the absolute best English voice available using a premium quality rating scale
    const preferredVoice = voices.reduce((best: any, current: any) => {
      if (!current.lang.startsWith("en")) return best;
      
      const getScore = (voice: any) => {
        const name = voice.name;
        if (name.includes("Siri")) return 100;
        if (name.includes("Natural") || name.includes("Enhanced") || name.includes("Premium")) return 90;
        if (name.includes("Google US English") || name.includes("Google UK English Female")) return 85;
        if (name.includes("Ava") || name.includes("Samantha") || name.includes("Allison") || name.includes("Daniel") || name.includes("Kate") || name.includes("Serena") || name.includes("Oliver")) return 80;
        if (name.includes("Google") && voice.lang.startsWith("en")) return 70;
        if (voice.lang.startsWith("en-US") || voice.lang.startsWith("en-GB")) return 60;
        return 50;
      };
      
      if (!best) return current;
      return getScore(current) > getScore(best) ? current : best;
    }, null);

    if (preferredVoice) utterance.voice = preferredVoice;

    if (isFinal) {
      utterance.onend = () => {
        if (!mountedRef.current) return;
        if (stateRef.current === "SPEAKING") {
          setState("LISTENING");
          setDisplayText("Listening...");
          // Delay before restarting mic to prevent audio feedback
          restartTimerRef.current = setTimeout(() => {
            if (mountedRef.current && stateRef.current === "LISTENING") {
              startListening();
            }
          }, 600);
        }
      };

      utterance.onerror = () => {
        if (!mountedRef.current) return;
        if (stateRef.current === "SPEAKING") {
          setState("LISTENING");
          setDisplayText("Listening...");
          restartTimerRef.current = setTimeout(() => {
            if (mountedRef.current && stateRef.current === "LISTENING") {
              startListening();
            }
          }, 600);
        }
      };
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeaking = () => {
    window.speechSynthesis.cancel();
    spokenTextLengthRef.current = 0;
    if (mountedRef.current) {
      setState("LISTENING");
      setDisplayText("Listening...");
      restartTimerRef.current = setTimeout(() => {
        if (mountedRef.current && stateRef.current === "LISTENING") {
          startListening();
        }
      }, 500);
    }
  };

  const stopEverything = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    window.speechSynthesis.cancel();
  };

  const handleClose = () => {
    stopEverything();
    setState("LISTENING");
    setDisplayText("");
    onTranscriptChange?.(""); // Clear transcription on close
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="sahayak-voice-widget" id="sahayak-voice-widget">
      {/* Close button */}
      <button
        className="sahayak-voice-close"
        onClick={handleClose}
        title="End Voice Conversation"
      >
        <X size={16} />
      </button>

      {/* Brand */}
      <div className="sahayak-voice-brand">
        <span className="sahayak-voice-brand-dot" />
        Sahayak Voice
      </div>

      {/* Main content */}
      <div className="sahayak-voice-content">
        {/* State label */}
        <div className={`sahayak-voice-state-label state-${state.toLowerCase()}`}>
          {state === "LISTENING" && "LISTENING"}
          {state === "PROCESSING" && "THINKING"}
          {state === "SPEAKING" && "SAHAYAK IS SPEAKING"}
        </div>

        {/* The orb */}
        <div 
          className={`sahayak-voice-orb state-${state.toLowerCase()}`}
          onClick={state === "SPEAKING" ? handleStopSpeaking : undefined}
          style={state === "SPEAKING" ? { cursor: "pointer" } : undefined}
          title={state === "SPEAKING" ? "Click orb to stop speaking" : undefined}
        >
          <div className="sahayak-voice-orb-inner">
            {state === "LISTENING" && <Mic size={24} />}
            {state === "PROCESSING" && (
              <Loader size={24} className="sahayak-voice-spinner" />
            )}
            {state === "SPEAKING" && <Volume2 size={24} />}
          </div>

          {/* Pulse rings for LISTENING */}
          {state === "LISTENING" && (
            <>
              <div className="sahayak-pulse-ring ring-1" />
              <div className="sahayak-pulse-ring ring-2" />
              <div className="sahayak-pulse-ring ring-3" />
            </>
          )}

          {/* Sound waves for SPEAKING */}
          {state === "SPEAKING" && (
            <div className="sahayak-sound-waves">
              <div className="sahayak-wave-bar bar-1" />
              <div className="sahayak-wave-bar bar-2" />
              <div className="sahayak-wave-bar bar-3" />
              <div className="sahayak-wave-bar bar-4" />
              <div className="sahayak-wave-bar bar-5" />
              <div className="sahayak-wave-bar bar-6" />
              <div className="sahayak-wave-bar bar-7" />
            </div>
          )}

          {/* Processing ring */}
          {state === "PROCESSING" && (
            <div className="sahayak-processing-ring" />
          )}
        </div>

        {/* Transcript / Display text */}
        <div className="sahayak-voice-transcript">
          {state === "PROCESSING" && isLoading && (
            <div className="sahayak-voice-stream-dots">
              <span />
              <span />
              <span />
            </div>
          )}
          <p className="sahayak-voice-text">{displayText}</p>
        </div>

        {/* Hint text */}
        <div className="sahayak-voice-hint">
          {state === "LISTENING" && "🎤 Speak now — I'm listening"}
          {state === "PROCESSING" && "⏳ Processing..."}
          {state === "SPEAKING" && (
            <button 
              className="sahayak-voice-stop-btn"
              onClick={handleStopSpeaking}
              title="Stop Speaking"
            >
              <Square size={10} fill="currentColor" style={{ marginRight: "4px" }} />
              Stop Voice
            </button>
          )}
        </div>
      </div>

      {/* State indicator bar */}
      <div className="sahayak-voice-footer">
        <div className={`sahayak-state-indicator state-${state.toLowerCase()}`}>
          <div className="sahayak-state-dot" />
          <span>
            {state === "LISTENING" && "Mic ON — AI Muted"}
            {state === "PROCESSING" && "Processing"}
            {state === "SPEAKING" && "Mic OFF — AI Active"}
          </span>
        </div>
      </div>
    </div>
  );
};
