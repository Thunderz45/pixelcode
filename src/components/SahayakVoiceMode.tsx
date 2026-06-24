import React, { useState, useEffect, useRef } from "react";
import { Mic, X, Volume2, Loader } from "lucide-react";
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
  const [spokenMessageId, setSpokenMessageId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const prevLoadingRef = useRef(false);
  const stateRef = useRef<VoiceState>("LISTENING");
  const mountedRef = useRef(true);
  const restartTimerRef = useRef<any>(null);

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
      setSpokenMessageId(null);
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

  // Watch for AI streaming completion (isLoading: true → false)
  useEffect(() => {
    if (
      prevLoadingRef.current &&
      !isLoading &&
      state === "PROCESSING"
    ) {
      // AI finished streaming — get the latest assistant message
      const lastAssistant = [...messages]
        .reverse()
        .find((m) => m.role === "assistant");

      if (lastAssistant && lastAssistant.id !== spokenMessageId) {
        setSpokenMessageId(lastAssistant.id);

        // Clean the text for TTS: strip markdown, code blocks, etc.
        const cleanText = lastAssistant.content
          .replace(/<think>[\s\S]*?<\/think>/g, "")
          .replace(/```[\s\S]*?```/g, " code block ")
          .replace(/`([^`]+)`/g, "$1")
          .replace(/!\[.*?\]\(.*?\)/g, "")
          .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
          .replace(/#{1,6}\s/g, "")
          .replace(/[*_~]/g, "")
          .replace(/\n{2,}/g, ". ")
          .replace(/\n/g, " ")
          .replace(/\s{2,}/g, " ")
          .trim();

        if (cleanText) {
          setState("SPEAKING");
          // Show truncated display text
          setDisplayText(
            cleanText.length > 300
              ? cleanText.substring(0, 300) + "..."
              : cleanText
          );
          speakText(cleanText);
        } else {
          // Nothing to speak, go back to listening
          setState("LISTENING");
          setDisplayText("Listening...");
          restartTimerRef.current = setTimeout(() => {
            if (mountedRef.current && stateRef.current === "LISTENING") {
              startListening();
            }
          }, 500);
        }
      }
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, state, messages, spokenMessageId]);

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98; // Warm, professional pacing
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Prefer a highly professional, natural-sounding English voice (especially high-fidelity macOS premium/enhanced voices)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.name.includes("Google US English") && v.lang.startsWith("en")) ||
      voices.find((v) => v.name.includes("Google UK English Female") && v.lang.startsWith("en")) ||
      voices.find((v) => v.name.includes("Google UK English Male") && v.lang.startsWith("en")) ||
      voices.find((v) => v.name.includes("Ava") && v.lang.startsWith("en")) ||
      voices.find((v) => v.name.includes("Samantha") && v.name.includes("Enhanced") && v.lang.startsWith("en")) ||
      voices.find((v) => v.name.includes("Allison") && v.name.includes("Enhanced") && v.lang.startsWith("en")) ||
      voices.find((v) => v.name.includes("Samantha") && v.lang.startsWith("en")) ||
      voices.find((v) => v.name.includes("Daniel") && v.lang.startsWith("en")) ||
      voices.find((v) => v.name.includes("Natural") && v.lang.startsWith("en")) ||
      voices.find((v) => v.name.includes("Premium") && v.lang.startsWith("en")) ||
      voices.find((v) => v.lang.startsWith("en-US")) ||
      voices.find((v) => v.lang.startsWith("en-"));
    if (preferredVoice) utterance.voice = preferredVoice;

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

    window.speechSynthesis.speak(utterance);
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
    setSpokenMessageId(null);
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
        <div className={`sahayak-voice-orb state-${state.toLowerCase()}`}>
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
          {state === "SPEAKING" && "🔇 AI speaking"}
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
