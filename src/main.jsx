import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./lib/auth.jsx";
import "./styles/styles.css";

// Restore the paper theme before first paint so there is no light flash.
try {
  if (localStorage.getItem("teapo-theme") === "dark") document.body.classList.add("paper-dark");
} catch (e) {
  /* private browsing */
}

// PDF exports always print on light paper.
addEventListener("beforeprint", () => document.body.classList.remove("paper-dark"));
addEventListener("afterprint", () => {
  try {
    if (localStorage.getItem("teapo-theme") === "dark") document.body.classList.add("paper-dark");
  } catch (e) {
    /* private browsing */
  }
});

// Registers the no-op worker that makes the app installable on Android. Failure is
// non-fatal: over plain http on a LAN address there is no secure context and the
// registration is rejected, which only costs the install prompt.
if ("serviceWorker" in navigator) {
  addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
