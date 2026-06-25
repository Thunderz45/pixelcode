import React, { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { auth } from "../firebase";
import "./Auth.css";

export const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let effect: any = null;
    const initVanta = () => {
      if ((window as any).VANTA && (window as any).VANTA.WAVES) {
        try {
          effect = (window as any).VANTA.WAVES({
            el: "#vanta-waves-background",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x0,
            shininess: 60.00
          });
        } catch (err) {
          console.error("Vanta WAVES initialization failed:", err);
        }
      }
    };

    if (!(window as any).VANTA || !(window as any).VANTA.WAVES) {
      const interval = setInterval(() => {
        if ((window as any).VANTA && (window as any).VANTA.WAVES) {
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password should be at least 6 characters.");
        setLoading(false);
        return;
      }
    }

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName.trim()) {
          await updateProfile(userCredential.user, {
            displayName: displayName.trim(),
          });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      let friendlyError = "Authentication failed. Please check your credentials.";
      if (err.code === "auth/email-already-in-use") {
        friendlyError = "This email is already registered. Please sign in.";
      } else if (err.code === "auth/invalid-email") {
        friendlyError = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        friendlyError = "Password is too weak. Make it at least 6 characters.";
      } else if (err.code === "auth/invalid-credential") {
        friendlyError = "Incorrect email or password. Please try again.";
      } else if (err.code === "auth/operation-not-allowed") {
        friendlyError = "Email/Password sign-in is disabled in your Firebase console. Please enable it under Authentication > Sign-in method.";
      } else if (err.code) {
        friendlyError = `Authentication failed (${err.code}). Please check your Firebase setup.`;
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
  };

  return (
    <div className="auth-container">
      <div id="vanta-waves-background" className="vanta-bg"></div>
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Pixelcode</h1>
          <p className="auth-subtitle">
            {isSignUp ? "Create an account to start coding" : "Welcome back, developer"}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="displayName">Name (Optional)</label>
              <input
                id="displayName"
                type="text"
                className="form-input"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <span>{isSignUp ? "Already have an account?" : "Don't have an account?"}</span>
          <button type="button" className="auth-toggle-link" onClick={toggleAuthMode}>
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};
