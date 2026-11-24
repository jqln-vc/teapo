import React from "react";
import { Card, Ornament } from "../ds/index.jsx";
import { IconBtn, Actions, Inp, Area, StringList, ObjList } from "../edit/EditKit.jsx";
import { ImageList } from "../components/ImageSlot.jsx";
import { useImages } from "../lib/useImages.js";
import { researchItems } from "../lib/db.js";
import { useCollection } from "../lib/useCollection.js";
import { Loading, ErrorNote } from "./GuideView.jsx";
import { Md, mdPreview } from "../components/Md.jsx";

const GREEN = {
  ink: "var(--green-deep)",
  line: "var(--green)",
  chip: "var(--green-deep)",
  fill: "color-mix(in srgb, var(--green-pale) 30%, var(--cream))",
  fillSoft: "color-mix(in srgb, var(--green-pale) 18%, var(--cream))",
};
const DETAIL = "var(--brown-soft)";

const CHIP = {
  tea: { bg: "color-mix(in srgb, var(--green-pale) 55%, var(--cream))", fg: "var(--green-deep)", bd: "var(--green)" },
  microbe: { bg: "var(--green-deep)", fg: "var(--white)", bd: "var(--green-deep)" },
  compound: { bg: "transparent", fg: "var(--brown)", bd: "var(--brown-pale)" },
};

function TopicChip({ label, kind }) {
  const s = CHIP[kind] || CHIP.compound;
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 8px", borderRadius: 999, background: s.bg, color: s.fg, border: `1px solid ${s.bd}`, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

const topicsToText = (topics = []) => topics.map(([t, k]) => `${t}:${k}`).join(", ");
const textToTopics = (txt = "") =>
  txt
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [t, k] = s.split(":").map((x) => x.trim());
      return [t, k || "compound"];
    });

function ResearchRow({ item, onOpen, editing, onSave, onDelete, onChange, onMove, draggable }) {
  const [over, setOver] = React.useState(false);
  const c = GREEN;
  const shell = {
    display: "flex",
    alignItems: "center",
    gap: 16,
    background: c.fill,
    border: `1px solid color-mix(in srgb, ${c.line} 55%, transparent)`,
    borderRadius: 10,
    padding: "12px 16px 12px 24px",
    borderLeft: `3px solid ${DETAIL}`,
    outline: over ? "2px dashed var(--green)" : "2px dashed transparent",
    outlineOffset: 3,
  };

  if (editing)
    return (
      <div style={{ ...shell, alignItems: "flex-start" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <Inp value={item.title} onChange={(v) => onChange({ title: v })} placeholder="title of this line of research" />
          <Inp mono value={topicsToText(item.topics)} onChange={(v) => onChange({ topics: textToTopics(v) })} placeholder="gyokuro:tea, Aspergillus niger:microbe, gallic acid:compound" />
          <Area value={item.description} onChange={(v) => onChange({ description: v })} rows={2} placeholder="short description" />
        </div>
        <Actions>
          <IconBtn kind="save" solid color={c.chip} size={28} title="save" onClick={onSave} />
          <IconBtn kind="del" color="var(--red)" size={28} title="remove" onClick={onDelete} />
        </Actions>
      </div>
    );

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onMove(e.dataTransfer.getData("text/plain"), item.id);
      }}
      style={{ ...shell, cursor: "pointer" }}
      onClick={() => onOpen(item.id)}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: c.ink, lineHeight: 1.15, flex: "0 1 auto", minWidth: 0 }}>{item.title || "untitled"}</div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {(item.topics || []).map(([t, k], i) => (
            <TopicChip key={`${t}-${i}`} label={t} kind={k} />
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: DETAIL, flex: "1 1 260px", minWidth: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {mdPreview(item.description, 220)}
        </p>
      </div>
    </div>
  );
}

function ResearchDetail({ item, onBack, onChange, onDelete }) {
  const c = GREEN;
  const [edit, setEdit] = React.useState(false);
  const { grouped, reload } = useImages("research_item", item.id);
  const notes = item.log || [];
  const biblio = item.biblio || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
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

      <header style={{ maxWidth: 820, display: "flex", flexDirection: "column", gap: 14 }}>
        {edit ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Inp value={item.title} onChange={(v) => onChange({ title: v })} placeholder="title" />
            <Inp mono value={topicsToText(item.topics)} onChange={(v) => onChange({ topics: textToTopics(v) })} placeholder="topic:tea, topic:microbe, topic:compound" />
            <Area value={item.description} onChange={(v) => onChange({ description: v })} rows={2} placeholder="short description" />
          </div>
        ) : (
          <>
            <h1 className="research-title wrap-anywhere" style={{ color: c.ink }}>{item.title || "untitled"}</h1>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(item.topics || []).map(([t, k], i) => (
                <TopicChip key={`${t}-${i}`} label={t} kind={k} />
              ))}
            </div>
            <Md style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 17, lineHeight: 1.6, color: DETAIL }}>{item.description}</Md>
          </>
        )}
      </header>

      <Ornament variant="leaf" color={c.line} />

      <div className="research-body">
        <div style={{ display: "flex", flexDirection: "column", gap: 26, minWidth: 0 }}>
          <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {edit ? (
              <Inp mono value={item.findings_title ?? "findings"} onChange={(v) => onChange({ findings_title: v })} placeholder="section title" />
            ) : (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: c.ink }}>{item.findings_title ?? "findings"}</div>
            )}
            {edit ? (
              <StringList color={c.ink} addLabel="paragraph" items={item.findings || []} placeholder="paragraph" onChange={(findings) => onChange({ findings })} />
            ) : (
              (item.findings || []).map((p, i) => (
                <Md key={i} style={{ fontSize: 16, lineHeight: 1.75, color: "var(--text)" }}>
                  {p}
                </Md>
              ))
            )}
          </section>

          <ImageList
            rows={grouped.fig || []}
            role="fig"
            parentType="research_item"
            parentId={item.id}
            onChanged={reload}
            height={240}
            editable={edit}
            placeholder="drop a figure, chart, or photograph"
          />

          <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {edit ? (
              <Inp mono value={item.notes_title ?? "notes & citations"} onChange={(v) => onChange({ notes_title: v })} placeholder="section title" />
            ) : (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: c.ink }}>{item.notes_title ?? "notes & citations"}</div>
            )}
            {edit ? (
              <ObjList
                color={c.ink}
                addLabel="note"
                items={notes.map((n) => ({ note: n.note, ref: n.ref === undefined ? "" : String(n.ref) }))}
                fields={[
                  ["note", "note"],
                  ["ref", "bibliography no. (optional)", true],
                ]}
                onChange={(rows) =>
                  onChange({
                    log: rows.map((r) => {
                      const n = { note: r.note };
                      if (String(r.ref).trim() !== "" && !isNaN(Number(r.ref))) n.ref = Number(r.ref);
                      return n;
                    }),
                  })
                }
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {notes.map((l, i) => {
                  const src = typeof l.ref === "number" ? biblio[l.ref] : null;
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "14px 0", borderBottom: `1px dashed color-mix(in srgb, ${DETAIL} 50%, transparent)` }}>
                      <Md style={{ fontFamily: "var(--font-serif)", fontSize: 15, lineHeight: 1.65, color: "var(--text)" }}>{l.note}</Md>
                      {src && (
                        <a href={`#biblio-${item.id}-${l.ref}`} style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: c.ink, textDecoration: "underline", textDecorationColor: `color-mix(in srgb, ${c.line} 60%, transparent)` }}>
                          ↗ {String(src.authors || "").split(",")[0]} {src.year}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card inset padding="md" className="tex-veins" style={{ background: c.fillSoft, borderColor: `color-mix(in srgb, ${c.line} 60%, transparent)` }}>
            {edit ? (
              <div style={{ marginBottom: 14 }}>
                <Inp mono value={item.biblio_title ?? "bibliography"} onChange={(v) => onChange({ biblio_title: v })} placeholder="section title" />
              </div>
            ) : (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: c.ink, marginBottom: 14 }}>{item.biblio_title ?? "bibliography"}</div>
            )}
            {edit ? (
              <ObjList
                color={c.ink}
                addLabel="reference"
                items={biblio}
                fields={[
                  ["title", "title"],
                  ["authors", "authors"],
                  ["where", "publication", true],
                  ["year", "year", true],
                  ["url", "link (optional)", true],
                ]}
                onChange={(rows) => onChange({ biblio: rows })}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {biblio.map((b, i) => (
                  <div key={i} id={`biblio-${item.id}-${i}`} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <a
                      href={b.url || "#"}
                      target={b.url ? "_blank" : undefined}
                      rel={b.url ? "noreferrer" : undefined}
                      onClick={(e) => {
                        if (!b.url) e.preventDefault();
                      }}
                      style={{ fontFamily: "var(--font-serif)", fontSize: 15, lineHeight: 1.45, color: c.ink, textDecoration: "underline", textDecorationColor: `color-mix(in srgb, ${c.line} 60%, transparent)` }}
                    >
                      {b.title}
                    </a>
                    <span style={{ fontSize: 13, lineHeight: 1.45, color: "var(--text-muted)" }}>{b.authors}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: DETAIL }}>
                      {[b.where, b.year].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <ImageList
            rows={grouped.plate || []}
            role="plate"
            parentType="research_item"
            parentId={item.id}
            onChanged={reload}
            height={200}
            editable={edit}
            placeholder="drop a supporting image"
          />
        </div>
      </div>
    </div>
  );
}

export function ResearchView() {
  const items = useCollection(researchItems);
  const [openId, setOpenId] = React.useState(null);
  const [editId, setEditId] = React.useState(null);

  const open = items.items.find((i) => i.id === openId);
  if (open)
    return (
      <ResearchDetail
        item={open}
        onBack={() => setOpenId(null)}
        onChange={(patch) => items.update(open.id, patch)}
        onDelete={() => {
          items.remove(open.id);
          setOpenId(null);
        }}
      />
    );

  if (items.loading) return <Loading />;
  if (items.error) return <ErrorNote error={items.error} />;

  const addItem = async () => {
    const row = await items.create({ title: "", tone: "green", topics: [], description: "", findings: [], biblio: [], log: [] }).catch(() => null);
    if (row) setEditId(row.id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <ErrorNote error={items.writeError} onDismiss={items.dismissError} />
      <header className="page-head">
        <div style={{ maxWidth: 660 }}>
          <h1 className="page-title" style={{ color: "var(--green-deep)" }}>the exploration</h1>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: DETAIL, marginTop: 8, fontSize: 16 }}>
            what I have wondered, where I have explored, what I have learned
          </p>
        </div>
        <IconBtn kind="add" solid color="var(--green-deep)" size={34} title="new research line" onClick={addItem} />
      </header>

      <Ornament variant="flourish" color="var(--green)" />

      {items.items.length === 0 && (
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-faint)" }}>nothing explored yet — press + to start a line of research.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {items.items.map((i) => (
          <ResearchRow
            key={i.id}
            item={i}
            onOpen={setOpenId}
            editing={editId === i.id}
            draggable={editId === null}
            onSave={() => setEditId(null)}
            onDelete={() => {
              items.remove(i.id);
              setEditId(null);
            }}
            onChange={(patch) => items.update(i.id, patch)}
            onMove={items.moveBefore}
          />
        ))}
      </div>
    </div>
  );
}
