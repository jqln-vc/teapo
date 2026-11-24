import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The PC's Tailscale name. `tailscale serve` terminates TLS and proxies to the dev
// server, so requests arrive with this Host header — Vite blocks unknown hosts by
// default and would answer "Blocked request" to the phone.
const TAILNET_HOST = "nine-note-asus.taildb8222.ts.net";

export default defineConfig({
  plugins: [react()],
  server: {
    // Pinned to IPv4 loopback. Left as the default "localhost", Node binds ::1
    // only, and `tailscale serve` — which proxies to 127.0.0.1 — answers 502.
    // Still loopback-only: nothing on the LAN can reach it, only the tailnet
    // through the proxy.
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    // strictPort: fail loudly if 5173 is taken rather than drifting to 5174.
    // Supabase's Redirect URLs allowlist exact origins, so a silent port change
    // breaks Google sign-in in a way that looks like an auth bug.
    allowedHosts: ["localhost", "127.0.0.1", TAILNET_HOST],
  },
  preview: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    allowedHosts: ["localhost", "127.0.0.1", TAILNET_HOST],
  },
});
