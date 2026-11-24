// Shared editing primitives. Ported from the design kit's EditKit.jsx, converted
// from window globals to ES module exports.
//
// StringList and ObjList always hand back a COMPLETE new array on every change.
// That is why the schema stores these inner lists as Postgres arrays / jsonb
// rather than child tables — the editor never does a partial update, so there is
// nothing to reconcile and array order is the persisted order.

import React from "react";

const GLYPH = { edit: "✎", del: "×", add: "+", save: "✓", cancel: "⊘", pdf: "⇩" };

export function IconBtn({ kind = "edit", onClick, color = "var(--brown)", size = 26, title, solid = false, disabled = false }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick(e);
      }}
      disabled={disabled}
      aria-label={title || kind}
      title={title || kind}
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        flex: "0 0 auto",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
        background: solid ? color : `color-mix(in srgb, ${color} 16%, var(--cream))`,
        color: solid ? "var(--white)" : color,
        border: solid ? "0" : `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono)",
        fontSize: kind === "del" ? 15 : 12,
        lineHeight: 1,
        padding: 0,
      }}
    >
      {GLYPH[kind]}
    </button>
  );
}

export function Actions({ children, gap = 6 }) {
  return <div style={{ display: "flex", gap, alignItems: "center", flex: "0 0 auto" }}>{children}</div>;
}

const fieldBase = {
  fontFamily: "var(--font-serif)",
  fontSize: 15,
  color: "var(--text)",
  background: "var(--white)",
  border: "1px solid var(--line)",
  borderRadius: 6,
  padding: "7px 10px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export function Inp({ value, onChange, placeholder, mono, label }) {
  const input = (
    <input
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      style={{ ...fieldBase, ...(mono ? { fontFamily: "var(--font-mono)", fontSize: 13 } : {}) }}
    />
  );
  if (!label) return input;
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--brown-soft)" }}>{label}</span>
      {input}
    </label>
  );
}

export function Area({ value, onChange, placeholder, rows = 3, label }) {
  const area = (
    <textarea
      value={value || ""}
      placeholder={placeholder}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      style={{ ...fieldBase, lineHeight: 1.6, resize: "vertical" }}
    />
  );
  if (!label) return area;
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--brown-soft)" }}>{label}</span>
      {area}
    </label>
  );
}

/* editable list of plain strings */
export function StringList({ items = [], onChange, placeholder = "", multiline = true, addLabel = "add", color = "var(--brown)" }) {
  const set = (i, v) => onChange(items.map((x, j) => (j === i ? v : x)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          {multiline ? (
            <Area value={it} onChange={(v) => set(i, v)} placeholder={placeholder} rows={3} />
          ) : (
            <Inp value={it} onChange={(v) => set(i, v)} placeholder={placeholder} />
          )}
          <IconBtn kind="del" color="var(--red)" title="remove" onClick={() => onChange(items.filter((_, j) => j !== i))} />
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ""])}
        style={{
          alignSelf: "flex-start",
          background: "transparent",
          border: `1px dashed color-mix(in srgb, ${color} 45%, transparent)`,
          color,
          borderRadius: 6,
          padding: "5px 10px",
          cursor: "pointer",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
        }}
      >
        + {addLabel}
      </button>
    </div>
  );
}

/* editable list of objects; fields: [[key,label,mono?]] */
export function ObjList({ items = [], fields, onChange, addLabel = "add", color = "var(--brown)" }) {
  const blank = () => fields.reduce((a, [k]) => ((a[k] = ""), a), {});
  const set = (i, k, v) => onChange(items.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((it, i) => (
        <div key={it.id ?? i} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "var(--paper-cool)", border: "1px solid var(--line)", borderRadius: 8, padding: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            {fields.map(([k, label, mono]) => (
              <Inp key={k} label={label} mono={mono} value={it[k]} onChange={(v) => set(i, k, v)} />
            ))}
          </div>
          <IconBtn kind="del" color="var(--red)" title="remove" onClick={() => onChange(items.filter((_, j) => j !== i))} />
        </div>
      ))}
      <button
        onClick={() => onChange([...items, blank()])}
        style={{
          alignSelf: "flex-start",
          background: "transparent",
          border: `1px dashed color-mix(in srgb, ${color} 45%, transparent)`,
          color,
          borderRadius: 6,
          padding: "5px 10px",
          cursor: "pointer",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
        }}
      >
        + {addLabel}
      </button>
    </div>
  );
}
