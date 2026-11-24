import React from "react";
import { Logo, Ornament } from "../ds/index.jsx";
import { tone, familyTone, familyLabel } from "../lib/tone.js";
import { signOut } from "../lib/auth.jsx";

export function AppShell({ route, onNavigate, teas = [], children }) {
  const [dark, setDark] = React.useState(() => document.body.classList.contains("paper-dark"));

  React.useEffect(() => {
    document.body.classList.toggle("paper-dark", dark);
    try {
      localStorage.setItem("teapo-theme", dark ? "dark" : "light");
    } catch (e) {
      /* private browsing — the theme just won't be remembered */
    }
  }, [dark]);

  const byFamily = teas.reduce((a, t) => {
    a[t.family] = (a[t.family] || 0) + 1;
    return a;
  }, {});
  const families = Object.entries(byFamily).sort((a, b) => b[1] - a[1]);

  const active = route === "detail" || route === "add" ? "library" : route;
  const nav = [
    { k: "guide", label: "guide" },
    { k: "library", label: "collection" },
    { k: "research", label: "exploration" },
  ];

  const ghostButton = {
    width: 30,
    height: 30,
    borderRadius: 999,
    cursor: "pointer",
    background: "transparent",
    color: "var(--brown-soft)",
    border: "1px solid color-mix(in srgb, var(--brown-soft) 45%, transparent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    lineHeight: 1,
    padding: 0,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <div className="print-mark">
        <Logo size={40} />
      </div>

      <header className="shell-header" style={{ borderBottom: "1px solid var(--line)", background: "var(--paper-cool)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div className="no-print" style={{ position: "absolute", right: 0, top: 0, display: "flex", gap: 6 }}>
            <button onClick={() => setDark(!dark)} aria-label={dark ? "light theme" : "dark theme"} title={dark ? "light theme" : "dark theme"} style={ghostButton}>
              {dark ? "☀" : "☾"}
            </button>
            <button onClick={signOut} aria-label="sign out" title="sign out" style={{ ...ghostButton, fontSize: 11 }}>
              ⏻
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Logo size={44} theme={dark ? "dark" : "light"} />
            <div
              className="t-logo"
              style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", width: 119, position: "relative", left: 3, fontSize: 24, letterSpacing: 0, color: "var(--brown)", lineHeight: 1, textAlign: "center" }}
            >
              <span>t</span>
              <span>e</span>
              <span>a</span>
              <span>p</span>
              <span>o</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Ornament variant="dotrule" width={220} color="var(--brown-soft)" className="shell-dotrule" />
            <nav style={{ display: "flex", gap: 4 }}>
              {nav.map((n) => (
                <button
                  key={n.k}
                  onClick={() => onNavigate(n.k)}
                  style={{
                    background: "transparent",
                    color: active === n.k ? "var(--red-deep)" : "var(--brown-soft)",
                    border: 0,
                    padding: "8px 14px 12px",
                    cursor: "pointer",
                    fontFamily: "var(--font-serif)",
                    fontSize: 15,
                    borderBottom: `2px solid ${active === n.k ? "var(--red)" : "transparent"}`,
                    marginBottom: -1,
                  }}
                >
                  {n.label}
                </button>
              ))}
            </nav>
            <Ornament variant="dotrule" width={220} color="var(--brown-soft)" className="shell-dotrule" />
          </div>
        </div>
      </header>

      <div
        className="no-print shell-tally"
        style={{ maxWidth: 1240, margin: "0 auto", display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)" }}
      >
        <span style={{ color: "var(--text-muted)" }}>
          {teas.length} {teas.length === 1 ? "tea" : "teas"} kept
        </span>
        <span aria-hidden="true" style={{ color: "var(--brown-soft)" }}>
          :
        </span>
        {families.map(([f, n]) => (
          <span key={f} style={{ color: tone(familyTone(f)).ink }}>
            {familyLabel(f)} {n}
          </span>
        ))}
      </div>

      <main className="shell-main" style={{ maxWidth: 1240, margin: "0 auto" }}>{children}</main>
    </div>
  );
}
