import React, { useState, useEffect } from "react";
import { X, User, Mail } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { UserProfile } from "../services/db";
import "./SettingsModal.css";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  profile: UserProfile | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userId,
  profile,
}) => {
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!username.trim()) {
      setError("Username cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        username: username.trim(),
        updatedAt: Date.now(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Failed to update username:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal-card">
        <button className="settings-modal-close" onClick={onClose} aria-label="Close settings">
          <X size={20} />
        </button>

        <div className="settings-modal-content">
          <h2 className="settings-modal-title">User Settings</h2>
          <p className="settings-modal-desc">
            Customize your developer profile and view account details. All changes synchronize across your devices in real-time.
          </p>

          <form onSubmit={handleSave} className="settings-form">
            <div className="form-group">
              <label className="form-label" htmlFor="settingsUsername">
                <User size={14} style={{ marginRight: "6px" }} /> Username
              </label>
              <input
                id="settingsUsername"
                type="text"
                placeholder="Developer Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="settings-input"
                required
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="settingsEmail">
                <Mail size={14} style={{ marginRight: "6px" }} /> Email Address
              </label>
              <input
                id="settingsEmail"
                type="email"
                value={profile?.email || ""}
                className="settings-input text-muted"
                disabled
                readOnly
              />
              <span className="form-hint">Email address cannot be changed.</span>
            </div>

            {/* Account details box removed */}

            {error && <div className="settings-error-msg mt-3">{error}</div>}
            {success && <div className="settings-success-msg mt-3">Profile updated successfully!</div>}

            <button type="submit" className="settings-submit-btn mt-4" disabled={isSaving}>
              {isSaving ? "Saving changes..." : "Save Settings"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
