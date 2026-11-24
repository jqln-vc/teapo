import { supabase } from "./supabase.js";
import { keyBetween, keyForMove, byPosition } from "./frac.js";

// Every write goes through here. owner_id is filled in by the column default
// (auth.uid()) and enforced by RLS, so it never appears in application code.

const rethrow = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const sorted = (rows) => (rows ?? []).slice().sort(byPosition);

/** Position that puts a new row at the top of `list`. */
const topOf = (list) => keyBetween(null, sorted(list)[0]?.position ?? null);
/** Position that puts a new row at the end of `list`. */
const endOf = (list) => keyBetween(sorted(list).at(-1)?.position ?? null, null);

// ---------------------------------------------------------------- generic CRUD

function collection(table) {
  return {
    async list() {
      const rows = await supabase.from(table).select("*").then(rethrow);
      return sorted(rows);
    },

    async create(fields, { list = [], at = "top" } = {}) {
      const position = at === "top" ? topOf(list) : endOf(list);
      const rows = await supabase
        .from(table)
        .insert({ ...fields, position })
        .select()
        .then(rethrow);
      return rows[0];
    },

    async update(id, patch) {
      // position is managed by move(); never let a caller patch it by accident.
      const { position, id: _ignored, owner_id, created_at, updated_at, ...safe } = patch;
      const rows = await supabase.from(table).update(safe).eq("id", id).select().then(rethrow);
      return rows[0];
    },

    async remove(id) {
      await supabase.from(table).delete().eq("id", id).then(rethrow);
    },

    /** Move `id` to index `toIndex` within `list`. Writes exactly one row. */
    async move(list, id, toIndex) {
      const position = keyForMove(sorted(list), id, toIndex);
      const rows = await supabase
        .from(table)
        .update({ position })
        .eq("id", id)
        .select()
        .then(rethrow);
      return rows[0];
    },
  };
}

export const teas = collection("teas");
export const guideBlocks = guideBlocksApi();
export const researchItems = collection("research_items");

// ---------------------------------------------------------------- guide blocks

// Guide entries (blocks that open as their own page) are kind 'entry', with what
// they are in content.category. Databases that have not run 0004 yet only accept
// the old 'tool' / 'technique' kinds, so an insert rejected by the kind check is
// retried under a legacy kind. The category travels in content either way, and
// 0004 converts those rows to 'entry' when it is run.
const LEGACY_ENTRY_KIND = "tool";
const isKindCheck = (e) => e?.code === "23514" && /guide_blocks_kind_check/.test(e.message ?? "");

const asLegacy = (row) => (row.kind === "entry" ? { ...row, kind: LEGACY_ENTRY_KIND } : row);

async function withLegacyFallback(rows, write) {
  try {
    return await write(rows);
  } catch (e) {
    if (!rows.some((r) => r.kind === "entry") || !isKindCheck(e)) throw e;
    console.warn("guide_blocks does not accept kind 'entry' yet — run supabase/migrations/0004_guide_entries.sql");
    return write(rows.map(asLegacy));
  }
}

function guideBlocksApi() {
  const base = collection("guide_blocks");
  return {
    ...base,
    create: (fields, opts) => withLegacyFallback([fields], ([f]) => base.create(f, opts)),
    /** Bulk insert of complete rows, positions included. */
    insertMany: (rows) =>
      withLegacyFallback(rows, (rs) => supabase.from("guide_blocks").insert(rs).select().then(rethrow)),
  };
}

// ---------------------------------------------------------------- glossary

// The glossary is edited through ObjList, which hands back the whole array on every
// change. Rows keep their ids across edits (ObjList preserves unknown keys), so we
// reconcile rather than delete-and-reinsert — that keeps positions stable and avoids
// churning rows the user did not touch.
const glossaryTable = collection("glossary_terms");

export const glossary = {
  list: glossaryTable.list,

  async replace(next, previous) {
    const nextIds = new Set(next.filter((r) => r.id).map((r) => r.id));
    const removed = previous.filter((r) => !nextIds.has(r.id));

    // Positions follow array order; each row's key sits between its neighbours.
    let prevKey = null;
    const withPositions = [];
    for (const row of next) {
      const position = keyBetween(prevKey, null);
      prevKey = position;
      withPositions.push({ ...row, position });
    }

    const inserts = withPositions
      .filter((r) => !r.id)
      .map(({ id, ...r }) => ({ term: r.term ?? "", definition: r.definition ?? "", position: r.position }));

    const updates = withPositions.filter((r) => r.id);

    await Promise.all([
      removed.length
        ? supabase.from("glossary_terms").delete().in("id", removed.map((r) => r.id)).then(rethrow)
        : null,
      inserts.length ? supabase.from("glossary_terms").insert(inserts).then(rethrow) : null,
      ...updates.map((r) =>
        supabase
          .from("glossary_terms")
          .update({ term: r.term ?? "", definition: r.definition ?? "", position: r.position })
          .eq("id", r.id)
          .then(rethrow),
      ),
    ]);

    return glossaryTable.list();
  },
};

// ---------------------------------------------------------------- images

const BUCKET = "media";

export const images = {
  /** All images for one parent, grouped by role and ordered within each role. */
  async listFor(parentType, parentId) {
    const rows = await supabase
      .from("images")
      .select("*")
      .eq("parent_type", parentType)
      .eq("parent_id", parentId)
      .then(rethrow);

    const grouped = {};
    for (const row of sorted(rows)) {
      (grouped[row.role] ??= []).push(row);
    }
    return grouped;
  },

  /** Signed URLs for a set of rows, keyed by image id. The bucket is private. */
  async signedUrls(rows, expiresIn = 60 * 60) {
    if (!rows.length) return {};
    const paths = rows.map((r) => r.storage_path);
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, expiresIn);
    if (error) throw error;

    const byPath = Object.fromEntries(data.map((d) => [d.path, d.signedUrl]));
    return Object.fromEntries(rows.map((r) => [r.id, byPath[r.storage_path] ?? null]));
  },

  /**
   * Upload a file and record it. For the tea detail page's four fixed slots pass a
   * `role` of 'a'|'b'|'c'|'d' and `replace: true` — the unique index allows only one
   * image per slot, so an existing one is swapped out.
   */
  async upload(file, { parentType, parentId, role = "default", siblings = [], replace = false }) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const uid = userData.user?.id;
    if (!uid) throw new Error("not signed in");

    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const storage_path = `${uid}/${parentType}/${parentId}/${role}-${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storage_path, file, { contentType: file.type, upsert: false });
    if (upErr) throw upErr;

    if (replace) {
      const existing = siblings.filter((s) => s.role === role);
      if (existing.length) await images.remove(existing);
    }

    const position = endOf(siblings.filter((s) => s.role === role));
    const rows = await supabase
      .from("images")
      .insert({ parent_type: parentType, parent_id: parentId, role, position, storage_path })
      .select()
      .then(rethrow);

    return rows[0];
  },

  /** Delete rows and their stored files together. */
  async remove(rows) {
    const list = Array.isArray(rows) ? rows : [rows];
    if (!list.length) return;
    await supabase.storage.from(BUCKET).remove(list.map((r) => r.storage_path));
    await supabase
      .from("images")
      .delete()
      .in("id", list.map((r) => r.id))
      .then(rethrow);
  },

  async update(id, patch) {
    const rows = await supabase.from("images").update(patch).eq("id", id).select().then(rethrow);
    return rows[0];
  },

  async move(list, id, toIndex) {
    const position = keyForMove(sorted(list), id, toIndex);
    return supabase.from("images").update({ position }).eq("id", id).select().then(rethrow);
  },
};
