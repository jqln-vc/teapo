import React from "react";
import { AppShell } from "./views/AppShell.jsx";
import { LibraryView } from "./views/LibraryView.jsx";
import { DetailView } from "./views/DetailView.jsx";
import { AddView } from "./views/AddView.jsx";
import { GuideView, Loading, ErrorNote } from "./views/GuideView.jsx";
import { ResearchView } from "./views/ResearchView.jsx";
import { SignIn } from "./views/SignIn.jsx";
import { useAuth } from "./lib/auth.jsx";
import { useCollection } from "./lib/useCollection.js";
import { teas as teasApi } from "./lib/db.js";
import { isConfigured } from "./lib/supabase.js";
import { isEmpty, seedExample } from "./lib/seed.js";

// Shown once, on a completely empty account. Seeding is opt-in: the brief is to
// author from scratch, so the example content is offered rather than assumed.
function FirstRun({ onSeeded }) {
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    isEmpty().then(setShow).catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <div style={{ border: "1px dashed var(--line)", borderRadius: 12, padding: "18px 22px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap", background: "var(--paper-cool)" }}>
      <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--text-muted)", fontSize: 15 }}>
        this library is empty. load the example content — one tea, the guide, and two lines of research — or just start writing.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => setShow(false)}
          style={{ background: "transparent", border: "1px solid var(--line)", borderRadius: 999, padding: "6px 16px", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}
        >
          start empty
        </button>
        <button
          onClick={async () => {
            setBusy(true);
            try {
              await seedExample();
              setShow(false);
              onSeeded();
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
          style={{ background: "var(--green-deep)", border: 0, borderRadius: 999, padding: "6px 16px", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--white)", opacity: busy ? 0.6 : 1 }}
        >
          {busy ? "loading…" : "load example"}
        </button>
      </div>
    </div>
  );
}

function Teapo() {
  const [route, setRoute] = React.useState({ name: "library" });
  const teas = useCollection(teasApi);

  const go = (name, id) => setRoute({ name, id });

  const save = async (fields) => {
    if (route.id) {
      teas.update(route.id, fields);
      teas.flushAll();
      go("detail", route.id);
      return;
    }
    await teas.create(fields, { at: "top" });
    go("library");
  };

  const removeTea = async (id) => {
    await teas.remove(id);
    go("library");
  };

  let view;
  if (teas.loading) view = <Loading />;
  else if (teas.error) view = <ErrorNote error={teas.error} />;
  else if (route.name === "library")
    view = (
      <>
        <FirstRun onSeeded={teas.reload} />
        <LibraryView
          teas={teas.items}
          onOpen={(id) => go("detail", id)}
          onAdd={() => go("add")}
          onReorder={teas.moveBefore}
        />
      </>
    );
  else if (route.name === "detail")
    view = (
      <DetailView
        tea={teas.items.find((t) => t.id === route.id)}
        onBack={() => go("library")}
        onEdit={() => go("add", route.id)}
        onDelete={() => removeTea(route.id)}
        onChange={(patch) => teas.update(route.id, patch)}
      />
    );
  else if (route.name === "add")
    view = (
      <AddView
        tea={route.id ? teas.items.find((t) => t.id === route.id) : null}
        onCancel={() => go(route.id ? "detail" : "library", route.id)}
        onSave={save}
      />
    );
  else if (route.name === "guide") view = <GuideView />;
  else if (route.name === "research") view = <ResearchView />;

  return (
    <AppShell route={route.name} onNavigate={go} teas={teas.items}>
      {route.name !== "guide" && route.name !== "research" && <ErrorNote error={teas.writeError} onDismiss={teas.dismissError} />}
      {view}
    </AppShell>
  );
}

function NeedsSetup() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, background: "var(--paper)" }}>
      <div style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 14 }}>
        <h1 style={{ fontSize: 34, margin: 0, color: "var(--brown)" }}>almost there</h1>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 16, lineHeight: 1.65, color: "var(--text-muted)" }}>
          <code>.env.local</code> still has the placeholder key. Copy the <strong>anon public</strong> key from
          your Supabase project (Project Settings → API) into <code>VITE_SUPABASE_ANON_KEY</code>, then restart
          <code> npm run dev</code>.
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, lineHeight: 1.6, color: "var(--text-faint)" }}>
          the anon key is meant to be public — row-level security is what protects the data. do not paste the
          service_role key here.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  if (!isConfigured) return <NeedsSetup />;
  return <Authed />;
}

function Authed() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <SignIn />;
  return <Teapo />;
}
