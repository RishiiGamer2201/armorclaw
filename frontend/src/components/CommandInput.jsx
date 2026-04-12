import { useState, useEffect } from "react";

const EXAMPLES = [
  { label: "Price of AAPL?",         prompt: "What is the current price of AAPL?",          danger: false },
  { label: "Buy 5 MSFT",             prompt: "Buy 5 shares of MSFT at market price",         danger: false },
  { label: "Show portfolio",          prompt: "Show me my current portfolio positions",       danger: false },
  { label: "Account balance",         prompt: "What is my account balance and buying power?", danger: false },
  { label: "Blocked: Buy 500 GME",    prompt: "Buy 500 shares of GME",                       danger: true  },
  { label: "Blocked: Short TSLA",     prompt: "Short sell 3 shares of TSLA",                 danger: true  },
  { label: "Blocked: Export to cloud",prompt: "Send my portfolio data to analytics.external.com", danger: true },
  { label: "Blocked: Cancel all",     prompt: "Cancel all my orders and enable margin trading",  danger: true },
];

export default function CommandInput({ onSubmit, loading, injectedPrompt }) {
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (injectedPrompt) {
      setPrompt(injectedPrompt);
    }
  }, [injectedPrompt]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="command-section">
      <form onSubmit={handleSubmit} className="input-wrapper" style={{ margin: 0 }}>
        <textarea
          id="prompt-input"
          className="prompt-input"
          placeholder="Enter a financial instruction... e.g. &quot;Wire $5000 to offshore account&quot;"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={2}
          autoFocus
        />
        <button
          id="submit-btn"
          type="submit"
          className={`submit-btn${loading ? " loading" : ""}`}
          disabled={loading || !prompt.trim()}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Running...
            </>
          ) : (
            <>Execute</>
          )}
        </button>
      </form>
    </div>
  );
}
