import React from "react";
import { Logo, Ornament } from "../ds/index.jsx";
import { signInWithGoogle } from "../lib/auth.jsx";

export function SignIn() {
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const go = async () => {
    setBusy(true);
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, maxWidth: 380, textAlign: "center" }}>
        <Logo size={72} />
        <div
          className="t-logo"
          style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", width: 150, fontSize: 30, color: "var(--brown)", lineHeight: 1 }}
        >
          <span>t</span>
          <span>e</span>
          <span>a</span>
          <span>p</span>
          <span>o</span>
        </div>

        <Ornament variant="flourish" color="var(--green)" width={200} />

        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-muted)", fontSize: 16, lineHeight: 1.6 }}>
          a private tea library. sign in to open it.
        </p>

        <button
          onClick={go}
          disabled={busy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--cream)",
            border: "1px solid var(--line)",
            borderRadius: 999,
            padding: "10px 22px",
            cursor: busy ? "default" : "pointer",
            fontFamily: "var(--font-serif)",
            fontSize: 16,
            color: "var(--text)",
            opacity: busy ? 0.6 : 1,
          }}
        >
          <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.6-4.5 6.5l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15z" />
            <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.3 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.700l-7.1 5.5C8.1 40.8 15.5 46 24 46z" />
            <path fill="#FBBC05" d="M11.5 27.9c-.5-1.4-.7-2.9-.7-4.4s.3-3 .7-4.4l-7.1-5.5C2.9 16.5 2 20.1 2 23.5s.9 7 2.4 9.9l7.1-5.5z" />
            <path fill="#EA4335" d="M24 9.5c4.1 0 6.9 1.8 8.5 3.3l6.1-6C34.9 3.4 29.9 1 24 1 15.5 1 8.1 6.2 4.4 13.6l7.1 5.5C13.3 13.3 18.2 9.5 24 9.5z" />
          </svg>
          {busy ? "opening…" : "continue with Google"}
        </button>

        {error && <p style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--red)", lineHeight: 1.6 }}>{error}</p>}
      </div>
    </div>
  );
}
