import React from "react";
import { byPosition } from "./frac.js";

/**
 * Loads an ordered collection and gives back optimistic mutators.
 *
 * The views were written against React state and call onChange on every
 * keystroke. Rather than rewrite them into forms with explicit saves, updates
 * are applied to local state immediately and flushed to Postgres on a debounce,
 * coalescing per row — so typing a paragraph is one UPDATE, not one per key.
 *
 * Pending edits are flushed on unmount and on tab hide, so navigating away or
 * closing the tab mid-sentence does not lose the last few characters.
 *
 * `error` means the list could not be loaded, so there is nothing to show.
 * `writeError` means one save failed; the list is still valid (it is reloaded
 * from the server) and the view should say so without hiding its content.
 */
export function useCollection(api, { debounceMs = 600 } = {}) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [writeError, setWriteError] = React.useState(null);
  const dismissError = React.useCallback(() => setWriteError(null), []);

  const pending = React.useRef(new Map()); // id -> merged patch
  const timers = React.useRef(new Map()); // id -> timeout handle

  const reload = React.useCallback(async () => {
    try {
      setItems(await api.list());
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [api]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const flush = React.useCallback(
    async (id) => {
      const patch = pending.current.get(id);
      if (!patch) return;
      pending.current.delete(id);
      clearTimeout(timers.current.get(id));
      timers.current.delete(id);
      try {
        await api.update(id, patch);
      } catch (e) {
        setWriteError(e);
        await reload(); // local state may be wrong now; take the server's word
      }
    },
    [api, reload],
  );

  const flushAll = React.useCallback(() => {
    for (const id of [...pending.current.keys()]) flush(id);
  }, [flush]);

  // Don't lose the tail of an edit when the tab is hidden or the view unmounts.
  React.useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flushAll();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      flushAll();
    };
  }, [flushAll]);

  const update = React.useCallback(
    (id, patch) => {
      setItems((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)));

      const merged = { ...(pending.current.get(id) ?? {}), ...patch };
      pending.current.set(id, merged);

      clearTimeout(timers.current.get(id));
      timers.current.set(id, setTimeout(() => flush(id), debounceMs));
    },
    [debounceMs, flush],
  );

  const create = React.useCallback(
    async (fields, opts = {}) => {
      try {
        const row = await api.create(fields, { list: items, ...opts });
        setItems((list) => [...list, row].sort(byPosition));
        return row;
      } catch (e) {
        setWriteError(e);
        throw e;
      }
    },
    [api, items],
  );

  const remove = React.useCallback(
    async (id) => {
      pending.current.delete(id);
      clearTimeout(timers.current.get(id));
      setItems((list) => list.filter((x) => x.id !== id));
      try {
        await api.remove(id);
      } catch (e) {
        setWriteError(e);
        await reload();
      }
    },
    [api, reload],
  );

  const move = React.useCallback(
    async (id, toIndex) => {
      const snapshot = items;
      try {
        const row = await api.move(snapshot, id, toIndex);
        setItems((list) => list.map((x) => (x.id === id ? { ...x, position: row.position } : x)).sort(byPosition));
      } catch (e) {
        setWriteError(e);
        await reload();
      }
    },
    [api, items, reload],
  );

  /** Move `fromId` to where `toId` currently sits — what the drag handlers give us. */
  const moveBefore = React.useCallback(
    (fromId, toId) => {
      if (!fromId || fromId === toId) return;
      const toIndex = items.findIndex((x) => x.id === toId);
      if (toIndex < 0) return;
      return move(fromId, toIndex);
    },
    [items, move],
  );

  return { items, loading, error, writeError, dismissError, reload, create, update, remove, move, moveBefore, flushAll };
}
