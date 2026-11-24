import React from "react";
import { Card, Ornament } from "../ds/index.jsx";
import { IconBtn, Actions, Inp, Area, StringList, ObjList } from "../edit/EditKit.jsx";
import { ImageSlot } from "../components/ImageSlot.jsx";
import { tone } from "../lib/tone.js";
import { useImages } from "../lib/useImages.js";
import { images as imagesApi, guideBlocks, glossary as glossaryApi } from "../lib/db.js";
import { useCollection } from "../lib/useCollection.js";
import { Md } from "../components/Md.jsx";

const COLS = 4;

// Default footprint per block kind. Once a block is resized, its own span/height
// are persisted and these no longer apply to it.
const DEFAULTS = {
  entry: { span: 1, height: 260 },
  trivia: { span: 2, height: 170 },
  illustration: { span: 2, height: 190 },
  note: { span: 2, height: 250 },
  heading: { span: 4, height: 0 },
};

// Entries are the blocks that open as their own page. What an entry *is* — tool,
// technique, type, … — is free text in content.category, not a kind of its own.
const ENTRY_KINDS = ["entry", "tool", "technique"]; // tool/technique: rows from before 0004
const isEntry = (b) => ENTRY_KINDS.includes(b.kind);
const categoryOf = (b) => b.content.category ?? (b.kind === "entry" ? "" : b.kind);

// Offered in the add menu even before any entry uses them.
const STARTER_CATEGORIES = ["tool", "technique"];

const KINDS = [
  ["trivia", "trivia"],
  ["illustration", "illustration"],
  ["note", "note list"],
  ["heading", "section heading"],
];

/* ---------------------------------------------------------------- block bodies */

function Illustration({ block, editing, onChange }) {
  const { grouped, reload } = useImages("guide_block", block.id);
  const row = grouped.default?.[0] ?? null;
  const label = block.content.label ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      {editing && <Inp mono value={label} onChange={(v) => onChange({ label: v })} placeholder="what goes here" />}
      <ImageSlot
        row={row}
        radius={14}
        placeholder={label || "drop an illustration here"}
        style={{ width: "100%", flex: 1, minHeight: 0 }}
        onUpload={(file) =>
          imagesApi
            .upload(file, { parentType: "guide_block", parentId: block.id, role: "default", siblings: row ? [row] : [], replace: true })
            .then(reload)
        }
        onRemove={() => imagesApi.remove(row).then(reload)}
      />
    </div>
  );
}

function Trivia({ block, editing, onChange }) {
  const { title = "", text = "" } = block.content;
  return (
    <div
      className="tex-leaf"
      style={{ width: "100%", background: "color-mix(in srgb, var(--yellow-pale) 45%, var(--cream))", border: "1px solid var(--yellow)", borderRadius: "18px 18px 18px 4px", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}
    >
      {editing ? (
        <Inp mono value={title} onChange={(v) => onChange({ title: v })} placeholder="title" />
      ) : (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--yellow-deep)", paddingRight: 72 }}>{title}</div>
      )}
      {editing ? (
        <Area value={text} onChange={(v) => onChange({ text: v })} rows={3} />
      ) : (
        <Md style={{ fontFamily: "var(--font-serif)", fontSize: 15, lineHeight: 1.6, color: "var(--text)" }}>{text}</Md>
      )}
    </div>
  );
}

function NoteCard({ block, editing, onChange }) {
  const { title = "", items = [] } = block.content;
  return (
    <Card inset padding="md" className="tex-veins" style={{ width: "100%", background: "color-mix(in srgb, var(--green-pale) 30%, var(--cream))", borderColor: "var(--green)", overflow: "hidden" }}>
      {editing ? (
        <div style={{ marginBottom: 12 }}>
          <Inp mono value={title} onChange={(v) => onChange({ title: v })} placeholder="title" />
        </div>
      ) : (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green-deep)", marginBottom: 12, paddingRight: 72 }}>{title}</div>
      )}
      {editing ? (
        <StringList color="var(--green-deep)" addLabel="line" items={items} placeholder="line" onChange={(lines) => onChange({ items: lines })} />
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((b, i) => (
            <li key={i} style={{ fontSize: 15, lineHeight: 1.55 }}>
              <Md>{b}</Md>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Heading({ block, editing, onChange }) {
  const c = "var(--red-deep)";
  const label = block.content.label ?? "";
  return (
    <div style={{ width: "100%", display: "flex", alignItems: "flex-end", borderBottom: `2px solid color-mix(in srgb, ${c} 40%, transparent)`, paddingBottom: 8, paddingRight: 80 }}>
      {editing ? (
        <Inp value={label} onChange={(v) => onChange({ label: v })} placeholder="section heading" />
      ) : (
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 30, color: c, lineHeight: 1 }}>{label}</h2>
      )}
    </div>
  );
}

function CategoryInput({ value, categories, onChange }) {
  const listId = React.useId();
  return (
    <>
      <input
        list={listId}
        value={value}
        placeholder="what is it — tool, type, technique…"
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", boxSizing: "border-box", background: "var(--cream)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "6px 10px", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--red-deep)" }}
      />
      <datalist id={listId}>
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </>
  );
}

function EntryCard({ block, onOpen, editing, onChange, categories }) {
  const c = tone("red");
  const { name = "", kanji = "", blurb = "" } = block.content;
  const cell = {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    background: c.fill,
    border: `1px solid color-mix(in srgb, ${c.line} 55%, transparent)`,
    borderRadius: 28,
    padding: "26px 24px 22px",
    overflow: "hidden",
  };

  if (editing)
    return (
      <div style={cell}>
        <CategoryInput value={categoryOf(block)} categories={categories} onChange={(v) => onChange({ category: v })} />
        <Inp value={name} onChange={(v) => onChange({ name: v })} placeholder="name" />
        <Inp mono value={kanji} onChange={(v) => onChange({ kanji: v })} placeholder="original transcript" />
        <Area value={blurb} onChange={(v) => onChange({ blurb: v })} placeholder="short description" rows={4} />
      </div>
    );

  return (
    <div style={{ ...cell, cursor: "pointer" }} onClick={() => onOpen(block.id)}>
      <div style={{ minWidth: 0 }}>
        <div className="wrap-anywhere" style={{ fontFamily: "var(--font-display)", fontSize: 26, color: c.ink, lineHeight: 1.1, paddingRight: 72 }}>{name || "untitled"}</div>
        {kanji && <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: c.line, marginTop: 4 }}>{kanji}</div>}
        <Md style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6, color: "var(--text)" }}>{blurb}</Md>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- arrangeable wrapper */

function Block({ b, colStep, editing, onEdit, onSave, onDelete, onMove, onResize, children }) {
  const [over, setOver] = React.useState(false);

  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sy = e.clientY;
    const s0 = b.span;
    const h0 = b.height || 200;
    const move = (ev) =>
      onResize({
        span: Math.max(1, Math.min(COLS, s0 + Math.round((ev.clientX - sx) / (colStep || 240)))),
        height: Math.max(110, h0 + (ev.clientY - sy)),
      });
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // Tool visibility (hover on desktop, always on touch) and the column span both
  // live in layout.css, which narrows the span on smaller screens.
  return (
    <div
      className="guide-block"
      data-span={b.span}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onMove(e.dataTransfer.getData("text/plain"), b.id);
      }}
      style={{
        position: "relative",
        display: "flex",
        "--span": b.span,
        "--min-h": b.height ? `${b.height}px` : undefined,
        borderRadius: 20,
        outline: over ? "2px dashed var(--red)" : "2px dashed transparent",
        outlineOffset: 5,
      }}
    >
      {children}
      <div className="block-tool" style={{ position: "absolute", top: 10, right: 12, display: "flex", gap: 4, zIndex: 6 }}>
        <span
          className="block-grip"
          draggable
          onDragStart={(e) => e.dataTransfer.setData("text/plain", b.id)}
          title="drag to move"
          style={{
            width: 24,
            height: 24,
            borderRadius: "var(--r-md)",
            cursor: "grab",
            background: "color-mix(in srgb, var(--brown-soft) 16%, var(--cream))",
            color: "var(--brown-soft)",
            border: "1px solid color-mix(in srgb, var(--brown-soft) 45%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            lineHeight: 1,
          }}
        >
          ⠿
        </span>
        {onEdit &&
          (editing ? (
            <IconBtn kind="save" solid color="var(--green-deep)" size={24} title="save" onClick={onSave} />
          ) : (
            <IconBtn kind="edit" color="var(--brown-soft)" size={24} title="edit" onClick={onEdit} />
          ))}
        <IconBtn kind="del" color="var(--red)" size={24} title="remove" onClick={onDelete} />
      </div>
      <div
        onPointerDown={startResize}
        title="drag to resize"
        className="block-tool block-resize"
        style={{ position: "absolute", right: 3, bottom: 3, width: 18, height: 18, cursor: "nwse-resize", zIndex: 6, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", color: "var(--brown-soft)", fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1 }}
      >
        ⌟
      </div>
    </div>
  );
}

function AddMenu({ onAdd, categories }) {
  const [open, setOpen] = React.useState(false);
  const pick = (fn) => () => {
    fn();
    setOpen(false);
  };
  return (
    <div style={{ position: "relative" }}>
      <IconBtn kind="add" solid color="var(--red-deep)" size={30} title="add to the guide" onClick={() => setOpen(!open)} />
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 19 }} />
          <div style={{ position: "absolute", right: 0, top: 38, zIndex: 20, minWidth: 180, padding: 6, background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 14, display: "flex", flexDirection: "column", gap: 2, boxShadow: "0 10px 30px rgba(0,0,0,0.22)" }}>
            <div style={menuHeading}>entries · own page</div>
            {categories.map((cat) => (
              <button key={`entry-${cat}`} onClick={pick(() => onAdd("entry", cat))} style={menuItem}>
                {cat}
              </button>
            ))}
            <button onClick={pick(() => onAdd("entry", ""))} style={{ ...menuItem, fontStyle: "italic", color: "var(--text-muted)" }}>
              new kind of entry…
            </button>
            <div style={{ ...menuHeading, borderTop: "1px solid var(--line)", marginTop: 4, paddingTop: 10 }}>on the page</div>
            {KINDS.map(([k, label]) => (
              <button key={k} onClick={pick(() => onAdd(k))} style={menuItem}>
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const menuItem = { textAlign: "left", cursor: "pointer", background: "transparent", border: 0, padding: "8px 10px", borderRadius: "var(--r-md)", fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--text)" };
const menuHeading = { padding: "6px 10px 2px", fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-faint)" };

/* ---------------------------------------------------------------- detail */

function GuideDetail({ block, onBack, onChange, onDelete, categories }) {
  const c = tone("red");
  const [edit, setEdit] = React.useState(false);
  const { grouped, reload } = useImages("guide_block", block.id);
  const row = grouped.default?.[0] ?? null;

  const { name = "", kanji = "", blurb = "", specs = [], body = [], bullets = [], bulletsTitle } = block.content;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 760 }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onBack} style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 700, lineHeight: 1, color: c.ink }}>
          ←
        </button>
        <Actions>
          {edit ? (
            <IconBtn kind="save" solid color={c.chip} size={32} title="save" onClick={() => setEdit(false)} />
          ) : (
            <IconBtn kind="edit" color={c.ink} size={32} title="edit" onClick={() => setEdit(true)} />
          )}
          <IconBtn kind="pdf" color={c.ink} size={32} title="export to PDF" onClick={() => window.print()} />
          <IconBtn kind="del" color="var(--red)" size={32} title="remove" onClick={onDelete} />
        </Actions>
      </div>

      <header style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {!edit && <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: c.line }}>{categoryOf(block)}</div>}
        {edit ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <CategoryInput value={categoryOf(block)} categories={categories} onChange={(v) => onChange({ category: v })} />
            <Inp value={name} onChange={(v) => onChange({ name: v })} placeholder="name" />
            <Inp mono value={kanji} onChange={(v) => onChange({ kanji: v })} placeholder="original transcript" />
            <Area value={blurb} onChange={(v) => onChange({ blurb: v })} rows={2} placeholder="short description" />
          </div>
        ) : (
          <>
            <div className="guide-entry-title">
              <h1 className="wrap-anywhere" style={{ color: c.ink }}>{name || "untitled"}</h1>
              {kanji && <span style={{ fontFamily: "var(--font-display)", fontSize: 28, color: c.line }}>{kanji}</span>}
            </div>
            <Md style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-muted)", fontSize: 16, lineHeight: 1.5 }}>{blurb}</Md>
          </>
        )}
      </header>

      {edit ? (
        <ObjList
          color={c.ink}
          addLabel="spec"
          items={specs.map(([k, v]) => ({ k, v }))}
          fields={[
            ["k", "label", true],
            ["v", "value", true],
          ]}
          onChange={(rows) => onChange({ specs: rows.map((r) => [r.k, r.v]) })}
        />
      ) : (
        specs.length > 0 && (
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", borderTop: `1px solid color-mix(in srgb, ${c.line} 55%, transparent)`, borderBottom: `1px solid color-mix(in srgb, ${c.line} 55%, transparent)`, padding: "12px 0" }}>
            {specs.map(([k, v], i) => (
              <div key={`${k}-${i}`}>
                <div style={{ color: c.line }}>{k}</div>
                <div style={{ color: c.ink, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        )
      )}

      {edit ? (
        <StringList color={c.ink} addLabel="paragraph" items={body} placeholder="paragraph" onChange={(v) => onChange({ body: v })} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {body.map((p, i) => (
            <Md key={i} style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text)" }}>
              {p}
            </Md>
          ))}
        </div>
      )}

      <ImageSlot
        row={row}
        placeholder={`drop an image for ${name || "this entry"}`}
        style={{ width: "100%", height: 220 }}
        onUpload={(file) =>
          imagesApi
            .upload(file, { parentType: "guide_block", parentId: block.id, role: "default", siblings: row ? [row] : [], replace: true })
            .then(reload)
        }
        onRemove={() => imagesApi.remove(row).then(reload)}
      />

      <Card inset padding="md" className="tex-veins" style={{ background: "var(--paper-cool)", borderColor: `color-mix(in srgb, ${c.line} 60%, transparent)` }}>
        {edit ? (
          <div style={{ marginBottom: 10 }}>
            <Inp mono value={bulletsTitle ?? "in practice"} onChange={(v) => onChange({ bulletsTitle: v })} placeholder="section title" />
          </div>
        ) : (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: c.ink, marginBottom: 10 }}>{bulletsTitle ?? "in practice"}</div>
        )}
        {edit ? (
          <StringList color={c.ink} addLabel="point" items={bullets} multiline={false} placeholder="one practice point" onChange={(v) => onChange({ bullets: v })} />
        ) : bullets.length === 0 ? (
          <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-faint)" }}>nothing noted yet</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            {bullets.map((b, i) => (
              <li key={i} style={{ fontSize: 15, lineHeight: 1.55, color: "var(--text)" }}>
                <Md>{b}</Md>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------- page */

export function GuideView() {
  const blocks = useCollection(guideBlocks);
  const [openId, setOpenId] = React.useState(null);
  const [editId, setEditId] = React.useState(null);
  const [glossary, setGlossary] = React.useState([]);
  const [glossEdit, setGlossEdit] = React.useState(false);
  // Last state known to be in the database. replace() diffs against this to work
  // out which rows were deleted — comparing the edited array against itself would
  // always report nothing removed.
  const glossarySaved = React.useRef([]);
  const gridRef = React.useRef(null);
  const [colStep, setColStep] = React.useState(240);

  const loadGlossary = React.useCallback(async (rows) => {
    glossarySaved.current = rows;
    setGlossary(rows);
  }, []);

  React.useEffect(() => {
    glossaryApi.list().then(loadGlossary).catch(() => {});
  }, [loadGlossary]);

  React.useEffect(() => {
    const measure = () => {
      if (gridRef.current) setColStep((gridRef.current.offsetWidth + 16) / COLS);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Content edits merge into the jsonb column; span/height are top-level.
  const patchContent = (block, partial) => blocks.update(block.id, { content: { ...block.content, ...partial } });

  // Every category in use, starters first, in the order they appear on the page.
  const categories = [...new Set([...STARTER_CATEGORIES, ...blocks.items.filter(isEntry).map(categoryOf)])].filter(Boolean);

  const add = async (kind, category = "") => {
    const seedContent =
      kind === "heading"
        ? { label: "new section" }
        : kind === "trivia"
          ? { title: "trivia", text: "" }
          : kind === "note"
            ? { title: "a list", items: [] }
            : kind === "illustration"
              ? { label: "drop an illustration here" }
              : { category, name: "", kanji: "", tone: "red", blurb: "", specs: [], body: [], bullets: [] };

    const row = await blocks.create({ kind, ...DEFAULTS[kind], content: seedContent }, { at: "end" }).catch(() => null);
    if (row) setEditId(row.id);
  };

  const open = blocks.items.find((b) => b.id === openId);
  if (open)
    return (
      <>
      <ErrorNote error={blocks.writeError} onDismiss={blocks.dismissError} />
      <GuideDetail
        block={open}
        categories={categories}
        onBack={() => setOpenId(null)}
        onChange={(p) => patchContent(open, p)}
        onDelete={() => {
          blocks.remove(open.id);
          setOpenId(null);
        }}
      />
      </>
    );

  if (blocks.loading) return <Loading />;
  if (blocks.error) return <ErrorNote error={blocks.error} />;

  const body = (b) => {
    const editing = editId === b.id;
    const onChange = (p) => patchContent(b, p);
    if (b.kind === "heading") return <Heading block={b} editing={editing} onChange={onChange} />;
    if (b.kind === "trivia") return <Trivia block={b} editing={editing} onChange={onChange} />;
    if (b.kind === "note") return <NoteCard block={b} editing={editing} onChange={onChange} />;
    if (b.kind === "illustration") return <Illustration block={b} editing={editing} onChange={onChange} />;
    return <EntryCard block={b} onOpen={setOpenId} editing={editing} onChange={onChange} categories={categories} />;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <ErrorNote error={blocks.writeError} onDismiss={blocks.dismissError} />
      <header className="page-head">
        <div style={{ maxWidth: 640 }}>
          <h1 className="page-title" style={{ color: "var(--red-deep)" }}>the guide</h1>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-muted)", marginTop: 8, fontSize: 16 }}>
            what I can use, how I can do, the names of things
          </p>
        </div>
        <AddMenu onAdd={add} categories={categories} />
      </header>

      <Ornament variant="flourish" color="var(--red)" />

      {/* COLS (4) is mirrored in layout.css as the desktop column count. */}
      <div ref={gridRef} className="guide-grid">
        {blocks.items.map((b) => (
          <Block
            key={b.id}
            b={b}
            colStep={colStep}
            editing={editId === b.id}
            onEdit={() => setEditId(b.id)}
            onSave={() => setEditId(null)}
            onDelete={() => {
              blocks.remove(b.id);
              setEditId(null);
            }}
            onMove={blocks.moveBefore}
            onResize={(p) => blocks.update(b.id, p)}
          >
            {body(b)}
          </Block>
        ))}
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, borderBottom: "2px solid color-mix(in srgb, var(--yellow-deep) 40%, transparent)", paddingBottom: 8 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 30, color: "var(--yellow-deep)", lineHeight: 1 }}>glossary</h2>
          <IconBtn
            kind={glossEdit ? "save" : "edit"}
            solid={glossEdit}
            color="var(--yellow-deep)"
            size={28}
            title={glossEdit ? "done" : "edit terms"}
            onClick={async () => {
              if (glossEdit) await loadGlossary(await glossaryApi.replace(glossary, glossarySaved.current));
              setGlossEdit(!glossEdit);
            }}
          />
        </div>
        {glossEdit ? (
          <ObjList
            color="var(--yellow-deep)"
            addLabel="term"
            items={glossary}
            fields={[
              ["term", "term", true],
              ["definition", "definition"],
            ]}
            onChange={setGlossary}
          />
        ) : (
          <dl className="glossary">
            {glossary.map(({ id, term, definition }) => (
              <div key={id ?? term}>
                <dt style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--yellow-deep)" }}>{term}</dt>
                <dd style={{ margin: "6px 0 0", fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)" }}>{definition}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <Ornament variant="leaf" color="var(--green)" />
    </div>
  );
}

export function Loading() {
  return <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-faint)" }}>loading…</p>;
}

export function ErrorNote({ error, onDismiss }) {
  if (!error) return null;
  const text = <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--red)" }}>{error.message || String(error)}</p>;
  if (!onDismiss) return text;
  return (
    <div role="alert" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "10px 14px", border: "1px solid color-mix(in srgb, var(--red) 45%, transparent)", borderRadius: 12, background: "color-mix(in srgb, var(--red) 8%, var(--cream))" }}>
      {text}
      <IconBtn kind="del" color="var(--red)" size={22} title="dismiss" onClick={onDismiss} />
    </div>
  );
}
