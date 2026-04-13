import { useState, useEffect, useRef } from "react";

export default function CommandInput({ onSubmit, loading, injectedPrompt }) {
  const [prompt, setPrompt] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (injectedPrompt) {
      setPrompt(injectedPrompt);
    }
  }, [injectedPrompt]);

  const handleFile = (file) => {
    if (!file) return;
    setAttachedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
    // Auto-append file reference to prompt if empty
    if (!prompt.trim()) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
        setPrompt(`Analyze this image: https://simulated-upload.clawshield.local/${file.name}`);
      } else {
        setPrompt(`Process this file: https://simulated-upload.clawshield.local/${file.name}`);
      }
    } else if (!prompt.includes("simulated-upload")) {
      setPrompt((prev) => prev + ` https://simulated-upload.clawshield.local/${file.name}`);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const removeFile = () => {
    setAttachedFile(null);
    setFilePreview(null);
  };

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
      <form
        onSubmit={handleSubmit}
        className="input-wrapper"
        style={{ margin: 0, position: "relative" }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Drag overlay */}
        {dragActive && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 10, borderRadius: 8,
            background: "rgba(100,149,237,0.15)", border: "2px dashed var(--blue)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.9rem", fontWeight: 600, color: "var(--blue)",
            pointerEvents: "none",
          }}>
            Drop file here
          </div>
        )}

        {/* File preview bar */}
        {attachedFile && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
            background: "rgba(100,149,237,0.08)", borderRadius: "8px 8px 0 0",
            borderBottom: "1px solid rgba(100,149,237,0.2)", fontSize: "0.8rem",
          }}>
            {filePreview && (
              <img src={filePreview} alt="preview" style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover" }} />
            )}
            <span style={{ flex: 1, color: "var(--text-muted)" }}>
              {attachedFile.name} ({(attachedFile.size / 1024).toFixed(0)} KB)
            </span>
            <button type="button" onClick={removeFile} style={{
              background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontWeight: 700, fontSize: "1rem",
            }}>x</button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          {/* File attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "rgba(100,149,237,0.1)", border: "1px solid rgba(100,149,237,0.3)",
              borderRadius: 6, padding: "8px 10px", cursor: "pointer", color: "var(--blue)",
              fontSize: "1.1rem", lineHeight: 1, flexShrink: 0,
            }}
            title="Attach file (image, document)"
          >
            +
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <textarea
            id="prompt-input"
            className="prompt-input"
            placeholder='Enter any instruction... "Wire $5000", "Analyze cheque", "Screen sanctions for Viktor Bout"'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={2}
            autoFocus
            style={{ flex: 1 }}
          />
          <button
            id="submit-btn"
            type="submit"
            className={`submit-btn${loading ? " loading" : ""}`}
            disabled={loading || !prompt.trim()}
          >
            {loading ? (
              <><span className="spinner" /> Running...</>
            ) : (
              <>Execute</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
