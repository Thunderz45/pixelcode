import { useState, useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import { Auth } from "./components/Auth";
import { LandingPage } from "./components/LandingPage";
import { ChatWorkspace } from "./components/ChatWorkspace";
import { Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setShowAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100vw",
          height: "100vh",
          backgroundColor: "var(--bg-primary)",
          gap: "16px",
        }}
      >
        <div
          className="loading-logo"
          style={{
            animation: "pulse-slow 2s infinite alternate",
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Terminal size={32} style={{ color: "var(--color-cyan)" }} />
          <span style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-headline)", color: "#fff", letterSpacing: "-0.5px" }}>
            PixelCode
          </span>
        </div>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(255,255,255,0.05)",
            borderTopColor: "var(--color-cyan)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            @keyframes pulse-slow {
              from { opacity: 0.6; }
              to { opacity: 1; }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <AnimatePresence mode="wait">
        {user ? (
          <motion.div
            key="workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: "100%", height: "100%" }}
          >
            <ChatWorkspace />
          </motion.div>
        ) : showAuth ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ width: "100%", height: "100%" }}
          >
            <Auth onBack={() => setShowAuth(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: "100%", height: "100%" }}
          >
            <LandingPage onTryPixelCode={() => setShowAuth(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
