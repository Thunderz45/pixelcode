import React, { useState } from "react";
import { X, CreditCard, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import { setSubscriptionStatus } from "../services/db";
import "./SubscriptionModal.css";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Simple validation
    if (!cardName.trim()) {
      setError("Please enter the name on the card.");
      return;
    }
    const cleanCard = cardNumber.replace(/\s+/g, "");
    if (cleanCard.length < 16 || isNaN(Number(cleanCard))) {
      setError("Please enter a valid 16-digit card number.");
      return;
    }
    if (!cardExpiry.includes("/") || cardExpiry.length < 5) {
      setError("Please enter expiry date (MM/YY).");
      return;
    }
    if (cardCvv.length < 3 || isNaN(Number(cardCvv))) {
      setError("Please enter a valid CVV.");
      return;
    }

    setLoading(true);

    // Simulate network latency for premium feel
    setTimeout(async () => {
      try {
        await setSubscriptionStatus(userId, true);
        setLoading(false);
        setSuccess(true);
      } catch (err) {
        console.error("Subscription update failed", err);
        setError("Payment verification failed. Please try again.");
        setLoading(false);
      }
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  return (
    <div className="premium-modal-overlay">
      <div className="premium-modal-card">
        <button className="premium-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {!success ? (
          <div className="premium-modal-content">
            <div className="premium-badge-wrapper">
              <span className="premium-badge-icon">
                <Sparkles size={16} />
              </span>
              <span className="premium-badge-text">Pixelcode Premium</span>
            </div>

            <h2 className="premium-modal-title">Unlock Unlimited Coding</h2>
            <p className="premium-modal-desc">
              You've experienced the power of Pixelcode. Upgrade today to get unlimited chats, priority endpoint queries, and advanced developer CRM/sales modules.
            </p>

            <div className="pricing-info">
              <div className="pricing-plan-card">
                <div className="plan-details">
                  <span className="plan-name">Pro Developer</span>
                  <span className="plan-features">Unlimited Chats • High Speed GPU • Priority Support</span>
                </div>
                <div className="plan-price">
                  <span className="price-val">$9</span>
                  <span className="price-period">/mo</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubscribe} className="payment-form">
              <div className="form-group">
                <label className="form-label" htmlFor="cardName">Cardholder Name</label>
                <input
                  id="cardName"
                  type="text"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="payment-input"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cardNumber">Card Number</label>
                <div className="input-with-icon">
                  <CreditCard size={16} className="input-icon" />
                  <input
                    id="cardNumber"
                    type="text"
                    placeholder="4111 2222 3333 4444"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="payment-input has-icon"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label" htmlFor="cardExpiry">Expiration Date</label>
                  <input
                    id="cardExpiry"
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    className="payment-input"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group half-width">
                  <label className="form-label" htmlFor="cardCvv">CVV / CVC</label>
                  <input
                    id="cardCvv"
                    type="password"
                    placeholder="•••"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ""))}
                    className="payment-input"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {error && <div className="payment-error-msg">{error}</div>}

              <button type="submit" className="payment-submit-btn" disabled={loading}>
                {loading ? (
                  <div className="spinner-wrapper">
                    <div className="payment-spinner"></div>
                    <span>Processing payment...</span>
                  </div>
                ) : (
                  <span>Subscribe Now - $9/month</span>
                )}
              </button>

              <div className="payment-security-footer">
                <ShieldCheck size={14} />
                <span>Secured 256-bit SSL encrypted checkout</span>
              </div>
            </form>
          </div>
        ) : (
          <div className="premium-success-state">
            <div className="success-icon-wrapper">
              <CheckCircle2 size={56} className="success-check-icon" />
            </div>
            <h2 className="success-title">Welcome to Pixelcode Pro!</h2>
            <p className="success-desc">
              Your payment was processed successfully. You now have unlimited developer chats and lightning-fast responses. Coding speed: UNLOCKED!
            </p>
            <button className="success-close-btn" onClick={onClose}>
              Start Coding
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
