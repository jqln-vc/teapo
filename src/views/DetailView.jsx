import React from "react";
import { Tag, Card, Field, Ornament } from "../ds/index.jsx";
import { IconBtn, Actions, StringList } from "../edit/EditKit.jsx";
import { ImageSlot } from "../components/ImageSlot.jsx";
import { tone, familyTone, familyLabel } from "../lib/tone.js";
import { useImages } from "../lib/useImages.js";
import { images as imagesApi } from "../lib/db.js";
import { Md } from "../components/Md.jsx";

// The four fixed slots from the design kit, in grid order.
const SLOTS = [
  ["a", "drop a photograph of the {name} leaf"],
  ["b", "second photograph of {name}"],
  ["c", "third photograph of {name}"],
  ["d", "fourth photograph of {name}"],
];

export function DetailView({ tea, onBack, onEdit, onDelete, onChange }) {
  const [noteEdit, setNoteEdit] = React.useState(false);
  const { grouped, reload } = useImages("tea", tea?.id);

  if (!tea) return null;

  const t = familyTone(tea.family);
  const c = tone(t);
  const allImages = Object.values(grouped).flat();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <button
        className="no-print"
        onClick={onBack}
        style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", fontFamily: "var(--font-mono)", color: c.ink, fontSize: 26, lineHeight: 1, fontWeight: 700, alignSelf: "flex-start" }}
      >
        ←
      </button>

      <header className="tea-head">
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: c.line, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            {[familyLabel(tea.family), tea.country].filter(Boolean).join(" · ")}
          </div>
          <h1 className="tea-title wrap-anywhere" style={{ color: c.ink }}>{tea.name || "untitled"}</h1>
          {tea.kanji && <div style={{ fontFamily: "var(--font-display)", fontSize: 32, color: c.line, marginTop: 4 }}>{tea.kanji}</div>}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 20 }}>
            {(tea.tags || []).map((tag) => (
              <Tag key={tag} tone={t}>
                {tag}
              </Tag>
            ))}
          </div>
        </div>

        <div className="tea-aside">
          <div className="no-print" style={{ display: "flex", gap: 6 }}>
            <IconBtn kind="edit" color={c.ink} size={34} title="edit" onClick={onEdit} />
            <IconBtn kind="pdf" color={c.ink} size={34} title="export to PDF" onClick={() => window.print()} />
            <IconBtn kind="del" color="var(--red)" size={34} title="remove this tea" onClick={onDelete} />
          </div>
          <div className="tea-photos">
            {SLOTS.map(([role, hint]) => {
              const row = grouped[role]?.[0] ?? null;
              return (
                <ImageSlot
                  key={role}
                  row={row}
                  placeholder={hint.replace("{name}", tea.name || "this tea")}
                  style={{ width: "100%", height: 115 }}
                  onUpload={(file) =>
                    imagesApi
                      .upload(file, { parentType: "tea", parentId: tea.id, role, siblings: allImages, replace: true })
                      .then(reload)
                  }
                  onRemove={() => imagesApi.remove(row).then(reload)}
                />
              );
            })}
          </div>
        </div>
      </header>

      <div className="tea-body">
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: c.ink, fontSize: 13, marginBottom: 6 }}>info</div>
          <Md style={{ fontFamily: "var(--font-serif)", fontSize: 20, lineHeight: 1.55, color: "var(--text)" }}>{tea.notes}</Md>

          <Ornament variant="leaf" color={`var(--${t === "brown" ? "brown" : t})`} style={{ margin: "28px auto 20px" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: c.ink, fontSize: 13 }}>notes</div>
            <Actions>
              {noteEdit ? (
                <IconBtn kind="save" solid color={c.chip} title="save" onClick={() => setNoteEdit(false)} />
              ) : (
                <IconBtn kind="edit" color={c.ink} title="edit notes" onClick={() => setNoteEdit(true)} />
              )}
              <IconBtn
                kind="add"
                solid
                color={c.chip}
                title="add a note"
                onClick={() => {
                  onChange({ journal: [...(tea.journal || []), ""] });
                  setNoteEdit(true);
                }}
              />
            </Actions>
          </div>

          {noteEdit ? (
            <StringList color={c.ink} addLabel="note" items={tea.journal || []} placeholder="a note, a verse, a finding" onChange={(journal) => onChange({ journal })} />
          ) : (tea.journal || []).length === 0 ? (
            <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-faint)" }}>nothing written down yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {tea.journal.map((n, i) => (
                <Md
                  key={i}
                  style={{ padding: "12px 0", borderBottom: `1px dashed color-mix(in srgb, ${c.line} 50%, transparent)`, fontFamily: "var(--font-serif)", fontSize: 16, lineHeight: 1.6, color: "var(--text)" }}
                >
                  {n}
                </Md>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card inset padding="md" className="tex-veins">
            <Field label="cultivar" value={tea.cultivar} />
            <Field label="region" value={tea.region} mono={false} />
            <Field label="form" value={tea.form} mono={false} />
            <Field label="harvest" value={tea.harvest} />
            <Field label="steep" value={tea.steep} />
          </Card>
        </div>
      </div>
    </div>
  );
}
