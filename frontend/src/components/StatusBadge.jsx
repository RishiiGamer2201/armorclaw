// frontend/src/components/StatusBadge.jsx

const CONFIG = {
  executed: { label: "ALLOWED", icon: "✅", cls: "badge-allowed"  },
  allowed:  { label: "ALLOWED", icon: "✅", cls: "badge-allowed"  },
  blocked:  { label: "BLOCKED", icon: "🚫", cls: "badge-blocked"  },
  error:    { label: "ERROR",   icon: "⚠️",  cls: "badge-error"   },
  pending:  { label: "PENDING", icon: "⏳", cls: "badge-pending"  },
};

export default function StatusBadge({ status }) {
  const c = CONFIG[status] ?? CONFIG.pending;
  return (
    <span className={`badge ${c.cls}`}>
      {c.icon} {c.label}
    </span>
  );
}
