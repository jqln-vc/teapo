import React from "react";
import { Input, Tag, Card, Ornament } from "../ds/index.jsx";
import { IconBtn } from "../edit/EditKit.jsx";
import { tone, familyTone, familyAccent, familyLabel, FAMILIES } from "../lib/tone.js";
import { mdPreview } from "../components/Md.jsx";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const SORTS = [
  ["newest", "newest"],
  ["oldest", "oldest"],
  ["manual", "my order"],
];

// The sort choice is a per-device preference, not shared data, so it lives in
// localStorage rather than the database. Wrapped because private browsing throws.
const SORT_KEY = "teapo-collection-sort";
function readSort() {
  try {
    const v = localStorage.getItem(SORT_KEY);
    return SORTS.some(([k]) => k === v) ? v : "newest";
  } catch {
    return "newest";
  }
}

const added = (t) => new Date(t.created_at);
const formatAdded = (t) => {
  const d = added(t);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

function Chip({ on, color = "var(--brown)", onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: on ? color : "transparent",
        color: on ? "var(--white)" : color,
        border: "1px solid " + (on ? color : "color-mix(in srgb, " + color + " 40%, transparent)"),
        padding: "4px 10px",
        borderRadius: 999,
        cursor: "pointer",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        textTransform: "lowercase",
      }}
    >
      {children}
    </button>
  );
}

export function LibraryView({ teas, onOpen, onAdd, onReorder }) {
  const [q, setQ] = React.useState("");
  const [family, setFamily] = React.useState("all");
  const [sort, setSortState] = React.useState(readSort);
  const [year, setYear] = React.useState("all");
  const [month, setMonth] = React.useState("all");
  const [dragOver, setDragOver] = React.useState(null);

  const setSort = (s) => {
    setSortState(s);
    try {
      localStorage.setItem(SORT_KEY, s);
    } catch {
      /* private browsing — the choice just isn't remembered */
    }
  };

  // Years and months come from the teas themselves, so the filter only ever offers
  // periods that have something in them.
  const years = [...new Set(teas.map((t) => added(t).getFullYear()))].sort((a, b) => b - a);
  const months =
    year === "all"
      ? []
      : [...new Set(teas.filter((t) => added(t).getFullYear() === year).map((t) => added(t).getMonth()))].sort((a, b) => b - a);

  const pickYear = (y) => {
    setYear(y);
    setMonth("all");
  };

  const families = ["all", ...FAMILIES];
  const filtered = teas.filter(
    (t) =>
      (family === "all" || t.family === family) &&
      (year === "all" || added(t).getFullYear() === year) &&
      (month === "all" || added(t).getMonth() === month) &&
      (q === "" || (t.name + t.region + (t.tags || []).join(" ") + t.notes).toLowerCase().includes(q.toLowerCase())),
  );

  // `teas` arrives in manual (position) order, so "manual" is simply no re-sort.
  const shown =
    sort === "manual"
      ? filtered
      : [...filtered].sort((a, b) => (sort === "newest" ? added(b) - added(a) : added(a) - added(b)));

  // Dragging writes a manual position, so it only makes sense in manual order,
  // and only against the full, unfiltered list.
  const reorderable = sort === "manual" && q === "" && family === "all" && year === "all";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <header className="page-head">
        <div>
          <h1 className="page-title" style={{ color: "var(--brown)" }}>the collection</h1>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-muted)", marginTop: 8 }}>
            what I have found, what I have poured
          </p>
        </div>
        <IconBtn kind="add" solid color="var(--red)" size={34} title="steep new" onClick={onAdd} />
      </header>

      <Ornament variant="flourish" color="var(--green)" />

      <div className="lib-filters">
        <Input fullWidth label="find" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="lib-families">
          {families.map((f) => {
            const c = f === "all" ? { chip: "var(--brown)" } : tone(familyTone(f));
            const on = family === f;
            return (
              <button
                key={f}
                onClick={() => setFamily(f)}
                style={{
                  background: on ? c.chip : "transparent",
                  color: on ? "var(--white)" : c.chip,
                  border: "1px solid " + (on ? c.chip : "color-mix(in srgb, " + c.chip + " 40%, transparent)"),
                  padding: "4px 10px",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  textTransform: "lowercase",
                }}
              >
                {familyLabel(f)}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--text-muted)", marginRight: 4 }}>added</span>
            <Chip on={year === "all"} onClick={() => pickYear("all")}>
              any time
            </Chip>
            {years.map((y) => (
              <Chip key={y} on={year === y} onClick={() => pickYear(y)}>
                {y}
              </Chip>
            ))}
          </div>
          {months.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingLeft: 52 }}>
              <Chip on={month === "all"} color="var(--brown-soft)" onClick={() => setMonth("all")}>
                all of {year}
              </Chip>
              {months.map((m) => (
                <Chip key={m} on={month === m} color="var(--brown-soft)" onClick={() => setMonth(m)}>
                  {MONTHS[m]}
                </Chip>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--text-muted)", marginRight: 4 }}>order</span>
          {SORTS.map(([k, label]) => (
            <Chip key={k} on={sort === k} onClick={() => setSort(k)}>
              {label}
            </Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-faint)", padding: "24px 0" }}>
          {teas.length === 0 ? "nothing kept yet — press + to add the first leaf." : "no tea matches that."}
        </p>
      )}

      <div className="lib-grid">
        {shown.map((t) => {
          const c = tone(familyTone(t.family));
          return (
            <div
              key={t.id}
              draggable={reorderable}
              onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
              onDragOver={(e) => {
                if (!reorderable) return;
                e.preventDefault();
                setDragOver(t.id);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                if (!reorderable) return;
                e.preventDefault();
                setDragOver(null);
                onReorder(e.dataTransfer.getData("text/plain"), t.id);
              }}
              style={{
                display: "flex",
                borderRadius: 4,
                outline: dragOver === t.id ? "2px dashed var(--red)" : "2px dashed transparent",
                outlineOffset: 4,
              }}
            >
              <Card accent={c.chip} padding="md" style={{ cursor: "pointer", background: c.fill, display: "flex", width: "100%" }}>
                <div
                  onClick={() => onOpen(t.id)}
                  style={{ textAlign: "left", background: "transparent", border: 0, padding: 0, width: "100%", cursor: "pointer", display: "flex", flexDirection: "column" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: 1 }}>
                      <div className="wrap-anywhere" style={{ fontFamily: "var(--font-display)", fontSize: 28, color: c.ink, lineHeight: 1.15 }}>{t.name || "untitled"}</div>
                      <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-muted)", fontSize: 13 }}>
                        {[t.region, t.country].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    {t.kanji && (
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: c.line, flex: "0 0 auto", whiteSpace: "nowrap" }}>{t.kanji}</div>
                    )}
                  </div>
                  <p style={{ fontSize: 14, color: "var(--text)", margin: "10px 0 12px", lineHeight: 1.5 }}>
                    {mdPreview(t.notes, 90)}
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, marginTop: "auto" }}>
                    {(t.tags || []).slice(0, 3).map((tag) => (
                      <Tag key={tag} tone={familyTone(t.family)}>
                        {tag}
                      </Tag>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: c.ink }}>
                    <span>{(t.steep || "").split(" · ")[0]}</span>
                    <span style={{ color: "var(--text-faint)" }}>added {formatAdded(t)}</span>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      <Ornament variant="flourish" color="var(--green)" />
    </div>
  );
}
