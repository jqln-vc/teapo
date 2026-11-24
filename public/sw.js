// Minimal service worker.
//
// Its only job is to satisfy Chrome's installability requirement — a registered
// worker with a fetch handler. It deliberately does NOT cache: teapo reads and
// writes Supabase on every screen, so a stale cached shell would show old teas and
// swallow edits, which is worse than simply not working offline.
//
// It also keeps no cache to invalidate, so the running dev server's constantly
// changing module URLs can never be served from a stale entry.
//
// If offline support is ever wanted, it needs a real strategy: cache the built
// assets by hash, and queue writes for replay — not a blanket cache here.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => e.respondWith(fetch(e.request)));
