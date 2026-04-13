import { useState, useEffect, useRef, useCallback } from "react";

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

function FilePreviewCard({ file, onRemove }) {
  const isImage = file.type?.startsWith("image/") && file.preview;
  return (
    <div style={{
      position: "relative", flexShrink: 0, width: 96, height: 96, borderRadius: 12,
      overflow: "hidden", border: "1px solid rgba(100,149,237,0.3)",
      background: "rgba(30,41,59,0.5)", transition: "border-color 0.2s",
    }}>
      {isImage ? (
        <img src={file.preview} alt={file.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ padding: 10, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 1 }}>
            {file.name.split(".").pop()}
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{formatFileSize(file.size)}</div>
          </div>
        </div>
      )}
      <button onClick={() => onRemove(file.id)} style={{
        position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%",
        background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700,
        opacity: 0.7, transition: "opacity 0.2s",
      }} onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.7}>x</button>
      {file.uploading && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="spinner" style={{ width: 20, height: 20 }} />
        </div>
      )}
    </div>
  );
}

function PastedContentCard({ content, onRemove }) {
  return (
    <div style={{
      position: "relative", flexShrink: 0, width: 112, height: 96, borderRadius: 12,
      overflow: "hidden", border: "1px solid rgba(100,149,237,0.2)",
      background: "rgba(30,41,59,0.4)", padding: 10, display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontFamily: "monospace", overflow: "hidden", lineHeight: 1.3, maxHeight: 50, wordBreak: "break-all" }}>
        {content.text.slice(0, 150)}
      </p>
      <div style={{ display: "inline-flex", alignItems: "center", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(100,149,237,0.3)", width: "fit-content" }}>
        <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 1 }}>PASTED</span>
      </div>
      <button onClick={() => onRemove(content.id)} style={{
        position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: "50%",
        background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem",
      }}>x</button>
    </div>
  );
}

export default function CommandInput({ onSubmit, loading, injectedPrompt }) {
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState([]);
  const [pastedContent, setPastedContent] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (injectedPrompt) setPrompt(injectedPrompt);
  }, [injectedPrompt]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [prompt]);

  const handleFiles = useCallback((fileList) => {
    const newFiles = Array.from(fileList).map(file => {
      const isImage = file.type.startsWith("image/");
      return {
        id: Math.random().toString(36).slice(2, 9),
        file, name: file.name, size: file.size,
        type: file.type,
        preview: isImage ? URL.createObjectURL(file) : null,
        uploading: true,
      };
    });
    setFiles(prev => [...prev, ...newFiles]);

    // Auto-set prompt if empty
    if (!prompt.trim()) {
      const f = newFiles[0];
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
        setPrompt(`Analyze this cheque image for fraud: https://simulated-upload.clawshield.local/${f.name}`);
      } else {
        setPrompt(`Analyze this document: https://simulated-upload.clawshield.local/${f.name}`);
      }
    } else if (!prompt.includes("simulated-upload")) {
      setPrompt(prev => prev + ` https://simulated-upload.clawshield.local/${newFiles[0].name}`);
    }

    // Simulate upload complete
    newFiles.forEach(f => {
      setTimeout(() => {
        setFiles(prev => prev.map(p => p.id === f.id ? { ...p, uploading: false } : p));
      }, 600 + Math.random() * 800);
    });
  }, [prompt]);

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    const pastedFiles = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        const file = items[i].getAsFile();
        if (file) pastedFiles.push(file);
      }
    }
    if (pastedFiles.length > 0) {
      e.preventDefault();
      handleFiles(pastedFiles);
      return;
    }
    // Large text paste -> card
    const text = e.clipboardData.getData("text");
    if (text.length > 300) {
      e.preventDefault();
      setPastedContent(prev => [...prev, { id: Math.random().toString(36).slice(2, 9), text, timestamp: new Date() }]);
      if (!prompt.trim()) setPrompt("Analyze this pasted content");
    }
  };

  const handleDrop = (e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files); };
  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  };

  return (
    <div className="command-section" onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} style={{ position: "relative" }}>
      {/* Drag overlay */}
      {dragActive && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 20, borderRadius: 12,
          background: "rgba(100,149,237,0.12)", border: "2px dashed var(--blue)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(4px)", pointerEvents: "none",
        }}>
          <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>+</div>
          <div style={{ fontWeight: 600, color: "var(--blue)" }}>Drop files here</div>
        </div>
      )}

      {/* File & Paste previews */}
      {(files.length > 0 || pastedContent.length > 0) && (
        <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "8px 0 12px", marginBottom: 4 }}>
          {pastedContent.map(c => (
            <PastedContentCard key={c.id} content={c} onRemove={id => setPastedContent(prev => prev.filter(x => x.id !== id))} />
          ))}
          {files.map(f => (
            <FilePreviewCard key={f.id} file={f} onRemove={id => setFiles(prev => prev.filter(x => x.id !== id))} />
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="input-wrapper" style={{ margin: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", width: "100%" }}>
          {/* Attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "rgba(100,149,237,0.1)", border: "1px solid rgba(100,149,237,0.3)",
              borderRadius: 8, width: 38, height: 38, cursor: "pointer", color: "var(--blue)",
              fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.2s",
            }}
            title="Attach file (image, document)"
          >+</button>
          <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" style={{ display: "none" }} multiple
            onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }} />

          <textarea
            ref={textareaRef}
            id="prompt-input"
            className="prompt-input"
            placeholder='Ask anything... "Wire $5000", "Screen sanctions for Viktor Bout", "Run compliance onboarding"'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={loading}
            rows={1}
            autoFocus
            style={{ flex: 1, minHeight: "2.4em", resize: "none" }}
          />

          <button
            id="submit-btn"
            type="submit"
            className={`submit-btn${loading ? " loading" : ""}`}
            disabled={loading || !prompt.trim()}
            style={{ flexShrink: 0 }}
          >
            {loading ? (<><span className="spinner" /> Running...</>) : (<>Execute</>)}
          </button>
        </div>
      </form>

      <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} />
    </div>
  );
}
