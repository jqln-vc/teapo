// Teapo design system — the components the app actually renders.
//
// Ported verbatim from the Claude Design project (components/brand, /controls,
// /surfaces, /data). Kept in one file because only six of them are used; if the
// design system grows, split this back out to mirror the source paths.
//
// Button, Chip and IconButton exist in the design system but no view renders
// them — the views use the IconBtn in ../edit/EditKit.jsx instead.

import React from "react";

/* ---------------------------------------------------------------- brand */

export function Logo({ size = 96, monochrome = false, theme = "light", style, className }) {
  const dark = theme === "dark";
  const brown = monochrome ? "currentColor" : dark ? "#C8A98A" : "#4A2B1B";
  const red = monochrome ? "currentColor" : dark ? "#E6A497" : "#B33427";
  const green = monochrome ? "currentColor" : dark ? "#A9C48A" : "#2E7A2A";
  const greenPale = monochrome ? "currentColor" : dark ? "#C9DFAE" : "#7EB84B";
  const yellow = monochrome ? "currentColor" : dark ? "#F0D68A" : "#D9A73B";
  const cid = React.useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      style={style}
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Teapo"
      role="img"
    >
      <defs>
        <clipPath id={"bowl-" + cid}>
          <path d="M60 138 Q64 190 120 206 Q176 190 180 138 Z" />
        </clipPath>
      </defs>
      <path d="M120 16 C110 16 104 26 104 36 C104 46 112 52 120 52 C128 52 136 46 136 36 C136 26 130 16 120 16 Z" fill={red} />
      <path d="M62 108 Q62 100 74 100 Q92 74 120 66 Q148 74 166 100 Q178 100 178 108" stroke={brown} strokeWidth="10" fill="none" />
      {!monochrome && (
        <g clipPath={"url(#bowl-" + cid + ")"}>
          <rect x="55" y="138" width="130" height="22" fill={green} />
          <rect x="55" y="160" width="130" height="16" fill={greenPale} />
          <rect x="55" y="176" width="130" height="34" fill={yellow} />
        </g>
      )}
      <path d="M28 132 Q40 122 52 126 Q60 132 62 140 Q66 190 120 206 Q174 190 178 140 Q180 132 188 126 Q200 122 212 132" stroke={brown} strokeWidth="10" fill="none" />
      <path d="M34 214 Q34 228 120 228 Q206 228 206 214" stroke={red} strokeWidth="10" fill="none" />
    </svg>
  );
}

export function Ornament({ variant = "flourish", width = 220, color = "var(--brown)", style, className }) {
  const common = { display: "block", margin: "0 auto", color, ...style };
  if (variant === "flourish") {
    return (
      <svg viewBox="0 0 220 24" width={width} height={24} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" style={common} className={className}>
        <path d="M4 12 C 30 12, 44 4, 60 12 C 76 20, 90 4, 110 12 C 130 20, 144 4, 160 12 C 176 20, 190 12, 216 12" />
        <circle cx="110" cy="12" r="2" fill="currentColor" />
      </svg>
    );
  }
  if (variant === "leaf") {
    // Sprig: three leaves off a central stem — reads as foliage, not an eye.
    return (
      <svg viewBox="0 0 220 32" width={width} height={32} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" style={common} className={className}>
        <line x1="4" y1="16" x2="86" y2="16" />
        <line x1="134" y1="16" x2="216" y2="16" />
        <path d="M92 16 C 96 10, 104 10, 106 14 C 102 20, 94 20, 92 16 Z" fill="currentColor" fillOpacity="0.18" />
        <line x1="93" y1="16" x2="105" y2="14" />
        <path d="M128 16 C 126 10, 118 10, 114 14 C 116 20, 124 20, 128 16 Z" fill="currentColor" fillOpacity="0.18" />
        <line x1="127" y1="16" x2="115" y2="14" />
        <circle cx="110" cy="26" r="1.4" fill="currentColor" />
      </svg>
    );
  }
  if (variant === "dotrule") {
    // A long dotted run — flanks a centered nav or title. Real circles at a
    // fixed 14px pitch, so they stay dots at any length.
    const w = typeof width === "number" ? width : 220;
    const gap = 14;
    const n = Math.max(2, Math.floor((w - 4) / gap));
    const dots = [];
    for (let i = 0; i < n; i++) dots.push(<circle key={i} cx={2 + i * gap} cy={2} r={1.6} />);
    return (
      <svg viewBox={`0 0 ${w} 4`} width={w} height={4} fill="currentColor" style={{ ...common, opacity: 0.65 }} className={className}>
        {dots}
      </svg>
    );
  }
  if (variant === "dots") {
    return (
      <svg viewBox="0 0 220 8" width={width} height={8} fill="currentColor" style={common} className={className}>
        <circle cx="94" cy="4" r="1.5" />
        <circle cx="110" cy="4" r="1.5" />
        <circle cx="126" cy="4" r="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 220 2" width={width} height={2} style={common} className={className}>
      <line x1="0" y1="1" x2="220" y2="1" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/* ---------------------------------------------------------------- surfaces */

const pads = { sm: "16px", md: "24px", lg: "36px" };
const accents = { green: "var(--green)", red: "var(--red)", yellow: "var(--yellow)", brown: "var(--brown)" };

export function Card({ accent = "none", padding = "md", inset = false, as = "div", children, style, className }) {
  const Tag = as;
  const s = {
    background: inset ? "var(--paper-warm)" : "var(--cream)",
    border: "1px solid var(--line)",
    padding: pads[padding] || pads.md,
    position: "relative",
    ...style,
  };
  const rule =
    accent !== "none" ? (
      // Named palette accent, or any CSS colour — the tea families mix their own.
      <span style={{ position: "absolute", left: 0, right: 0, top: 0, height: 3, background: accents[accent] || accent }} />
    ) : null;
  return (
    <Tag style={s} className={className}>
      {rule}
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------- data */

export function Field({ label, value, layout = "row", mono = true, muted = false, style, className }) {
  const wrap =
    layout === "row"
      ? { display: "grid", gridTemplateColumns: "minmax(100px, 34%) 1fr", alignItems: "baseline", gap: "16px", padding: "6px 0", borderBottom: "1px dashed var(--line-hairline)" }
      : { display: "flex", flexDirection: "column", gap: 2, padding: "6px 0" };
  const labelStyle = { fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-muted)", fontSize: "var(--fs-sm)" };
  const valueStyle = {
    fontFamily: mono ? "var(--font-mono)" : "var(--font-serif)",
    fontSize: "var(--fs-body)",
    color: muted ? "var(--text-muted)" : "var(--text)",
    fontVariantNumeric: "tabular-nums",
  };
  return (
    <div style={{ ...wrap, ...style }} className={className}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- controls */

const tones = {
  neutral: { fg: "var(--text)", bg: "var(--paper-warm)", bd: "var(--line)" },
  green: { fg: "var(--green-deep)", bg: "color-mix(in srgb, var(--green-pale) 55%, var(--cream))", bd: "var(--green-pale)" },
  red: { fg: "var(--red-deep)", bg: "color-mix(in srgb, var(--red-pale) 45%, var(--cream))", bd: "var(--red-pale)" },
  yellow: { fg: "var(--yellow-deep)", bg: "color-mix(in srgb, var(--yellow-pale) 50%, var(--cream))", bd: "var(--yellow-pale)" },
  brown: { fg: "var(--brown)", bg: "color-mix(in srgb, var(--brown-pale) 45%, var(--cream))", bd: "var(--brown-pale)" },
};

export function Tag({ tone = "neutral", variant = "solid", children, style, className }) {
  const t = tones[tone] || tones.neutral;
  const s = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-xs)",
    textTransform: "lowercase",
    letterSpacing: "0.02em",
    padding: "3px 10px",
    lineHeight: 1.4,
    whiteSpace: "nowrap",
    color: t.fg,
    background: variant === "solid" ? t.bg : "transparent",
    border: `1px solid ${t.bd}`,
    borderRadius: "999px",
    ...style,
  };
  return (
    <span style={s} className={className}>
      {children}
    </span>
  );
}

export function Input({ value, defaultValue, placeholder, label, hint, error, type = "text", disabled, fullWidth, mono, onChange, style, className }) {
  const [focus, setFocus] = React.useState(false);
  const wrapStyle = { display: "flex", flexDirection: "column", gap: 4, width: fullWidth ? "100%" : "auto", ...style };
  const rowStyle = {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    borderBottom: `1px solid ${error ? "var(--red)" : focus ? "var(--brown)" : "var(--line)"}`,
    paddingBottom: 4,
    transition: "border-color var(--dur) var(--ease)",
    opacity: disabled ? 0.5 : 1,
  };
  const labelStyle = { fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--fs-sm)", color: "var(--text-muted)", whiteSpace: "nowrap" };
  const inputStyle = {
    flex: 1,
    minWidth: 0,
    border: 0,
    background: "transparent",
    outline: "none",
    fontFamily: mono ? "var(--font-mono)" : "var(--font-serif)",
    fontSize: "var(--fs-body)",
    color: "var(--text)",
    padding: "4px 0",
  };
  return (
    <div style={wrapStyle} className={className}>
      <div style={rowStyle}>
        {label ? <span style={labelStyle}>{label}</span> : null}
        <input
          type={type}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={onChange}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={inputStyle}
        />
      </div>
      {error ? (
        <span style={{ color: "var(--red)", fontSize: "var(--fs-xs)" }}>{error}</span>
      ) : hint ? (
        <span style={{ color: "var(--text-faint)", fontSize: "var(--fs-xs)", fontStyle: "italic" }}>{hint}</span>
      ) : null}
    </div>
  );
}
