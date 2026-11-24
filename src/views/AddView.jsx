import React from "react";
import { Input, Card, Ornament } from "../ds/index.jsx";
import { IconBtn } from "../edit/EditKit.jsx";
import { FAMILIES, familyLabel } from "../lib/tone.js";

export function AddView({ tea, onCancel, onSave }) {
  const editing = !!tea;
  const [saving, setSaving] = React.useState(false);
  const [f, setF] = React.useState(() =>
    tea
      ? {
          name: tea.name || "",
          kanji: tea.kanji || "",
          family: tea.family || "green",
          region: tea.region || "",
          country: tea.country || "",
          cultivar: tea.cultivar || "",
          form: tea.form || "",
          harvest: tea.harvest || "",
          steep: tea.steep || "",
          notes: tea.notes || "",
          tags: (tea.tags || []).join(", "),
        }
      : { name: "", kanji: "", family: "green", region: "", country: "", cultivar: "", form: "", harvest: "", steep: "", notes: "", tags: "" },
  );

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    if (!f.name || saving) return;
    setSaving(true);
    try {
      await onSave({ ...f, tags: f.tags.split(",").map((s) => s.trim()).filter(Boolean) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 760 }}>
      <button
        onClick={onCancel}
        style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 700, lineHeight: 1, color: "var(--brown)", alignSelf: "flex-start" }}
      >
        ←
      </button>

      <header>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
          {editing ? "revisions" : "a new leaf"}
        </div>
        <h1 className="page-title" style={{ marginTop: 6, color: "var(--brown)" }}>{editing ? "edit leaf" : "steep new"}</h1>
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-muted)", marginTop: 8 }}>
          {editing ? "trim the branch" : "new discovery, another leaf for the tree of knowledge"}
        </p>
      </header>

      <Ornament variant="flourish" color="var(--green)" />

      <Card padding="lg">
        <div className="add-fields">
          <Input label="name" placeholder="Da Hong Pao" value={f.name} onChange={set("name")} />
          <Input label="original script" mono placeholder="大红袍 · देवनागरी" value={f.kanji} onChange={set("kanji")} />

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--text-muted)" }}>family</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FAMILIES.map((fam) => (
                <button
                  key={fam}
                  onClick={() => setF({ ...f, family: fam })}
                  style={{
                    background: f.family === fam ? "var(--brown)" : "transparent",
                    color: f.family === fam ? "var(--paper)" : "var(--text-muted)",
                    border: "1px solid " + (f.family === fam ? "var(--brown)" : "var(--line)"),
                    padding: "4px 10px",
                    borderRadius: 999,
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    textTransform: "lowercase",
                  }}
                >
                  {familyLabel(fam)}
                </button>
              ))}
            </div>
          </div>
          <Input label="country" placeholder="China" value={f.country} onChange={set("country")} />

          <Input label="region" placeholder="Wuyi, Fujian" value={f.region} onChange={set("region")} />
          <Input label="cultivar" mono placeholder="Bei Dou" value={f.cultivar} onChange={set("cultivar")} />

          <Input label="form" placeholder="loose leaf" value={f.form} onChange={set("form")} />
          <Input label="harvest" mono placeholder="2023-05-04" value={f.harvest} onChange={set("harvest")} />

          <Input label="steep" mono placeholder="95°C · 0:20" value={f.steep} onChange={set("steep")} />
        </div>

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--text-muted)" }}>tags</span>
          <Input placeholder="rock rhyme, roasted, cliff" value={f.tags} onChange={set("tags")} hint="comma-separated" />
        </div>

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--text-muted)" }}>tasting note</span>
          <textarea
            value={f.notes}
            onChange={set("notes")}
            placeholder="A wet-stone rock, a fire long banked…"
            rows={4}
            style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--text)", background: "transparent", border: "1px solid var(--line)", borderRadius: 0, padding: 12, resize: "vertical", lineHeight: 1.55, outline: "none" }}
          />
        </div>

        <div style={{ marginTop: 28, display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
          {!f.name && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)" }}>a name is required</span>
          )}
          <IconBtn kind="save" solid color="var(--green-deep)" size={34} disabled={!f.name || saving} title={editing ? "save changes" : "keep this leaf"} onClick={submit} />
        </div>
      </Card>
    </div>
  );
}
