import { useState, useRef, useEffect } from "react";
import { runTelegramAgent } from "../api/agent";

export default function TelegramChat() {
  const [messages, setMessages] = useState([
    { id: 1, sender: "bot", text: "🦞 **ClawShield Finance**\n━━━━━━━━━━━━━━━━━━━━\nI am connected. Send me a financial instruction." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Add user message
    const userMsg = { id: Date.now(), sender: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Call the Telegram formatted endpoint
      const replyText = await runTelegramAgent(trimmed);
      const botMsg = { id: Date.now() + 1, sender: "bot", text: replyText };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = { id: Date.now() + 1, sender: "bot", text: `⚠️ Error connecting to ClawShield:\n${err.message}` };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="telegram-chat-container card">
      <div className="card-header telegram-header">
        <span className="card-title">
          <span>📱</span> Telegram Interface Simulator
        </span>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          Direct connection to /api/agent/telegram
        </span>
      </div>

      <div className="chat-messages">
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble-wrapper ${m.sender}`}>
            <div className={`chat-bubble ${m.sender}`}>
              {m.text.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </div>
            <div className="chat-bubble-time">
              {new Date(m.id).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble-wrapper bot">
            <div className="chat-bubble bot typing">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Message ClawShield..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <button type="submit" disabled={!input.trim() || loading}>
          ➤
        </button>
      </form>
    </div>
  );
}
