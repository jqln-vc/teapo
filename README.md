<div align="center">

<img src="public/icon-512.png" alt="teapo" width="112" />

# teapo

*what I have found, what I have poured*

A private tea library — a collection of teas, a guide to tools and technique,<br />
and a notebook of research. Everything you write, arrange and upload is kept.

**[teapo.vercel.app](https://teapo.vercel.app)**

![React](https://img.shields.io/badge/React-18-4A2B1B?style=flat-square&logo=react&logoColor=F0E6CC)
![Vite](https://img.shields.io/badge/Vite-6-4A2B1B?style=flat-square&logo=vite&logoColor=F0E6CC)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%C2%B7%20Storage%20%C2%B7%20Auth-2E5A28?style=flat-square&logo=supabase&logoColor=F0E6CC)
![PWA](https://img.shields.io/badge/installable-PWA-B33427?style=flat-square&logoColor=F0E6CC)

</div>

---

## The three rooms

| | | |
| :-- | :-- | :-- |
| 🍵 **collection** | *the teas themselves* | Name, original script, family, origin, cultivar, form, harvest, steep, tags, a tasting note, a running journal, and four photographs. Sort by date added or by hand; filter by family, year and month. |
| 📖 **guide** | *what I can use, how I can do* | A free-form grid of entries, headings, trivia, note lists and illustrations — drag to rearrange, drag a corner to resize. Plus a glossary. |
| 🔬 **exploration** | *what I have wondered* | Lines of research: topics, findings, a bibliography, notes that cite it, and figures. |

Light and dark paper themes, print-to-PDF from any tea, guide entry or research page, and an install button on Android.

## Tea families

The six traditional Chinese categories, in ascending order of oxidation. Each carries its own colour.

| family | | |
| :-- | :-: | :-- |
| **green** | 绿 | unoxidised |
| **white** | 白 | withered, barely worked |
| **yellow** | 黄 | green, then "sealed yellow" under cloth |
| **oolong** | 青 | partly oxidised, often roasted |
| **red** | 红 | fully oxidised — what the West calls *black* tea |
| **black** | 黑 | post-fermented: pu'er, liu bao, fu zhuan |

Defined once in `src/lib/tone.js`, enforced by a check constraint on `teas.family`.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # → dist/
npm run preview    # serve dist/ to check the production build
```

The app loads straight away, but signing in needs the one-time setup below.

### Deploying

Production is [teapo.vercel.app](https://teapo.vercel.app), imported from this GitHub repo:
**every push to `main` deploys itself.** Vercel builds with `npm run build` into `dist/`, and
needs two environment variables, both of type *Config* rather than *Secret* — anything prefixed
`VITE_` is compiled into the browser bundle, so it can't be secret, and doesn't need to be:

| variable | value |
| :-- | :-- |
| `VITE_SUPABASE_URL` | `https://mvkzwijcthbhmrbjgpko.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the `sb_publishable_…` key from **Project Settings → API** |

Never add the `service_role` key, under any name. Supabase's **Redirect URLs** must list
`https://teapo.vercel.app`, and it should be the **Site URL**, or sign-in can't hand back to
the app.

<details>
<summary><b>Setup — Supabase, Google sign-in, API key</b></summary>

<br />

Everything runs against Supabase project `mvkzwijcthbhmrbjgpko`.

#### 1 · Migrations

Supabase dashboard → **SQL Editor** → run in order. All are safe to re-run.

| file | what it does |
| :-- | :-- |
| `0001_init.sql` | tables, indexes, triggers, row-level security |
| `0002_storage.sql` | the private `media` bucket and its policies |
| `0003_family_types.sql` | moves an older database to the six families — no-op on a fresh one |
| `0004_guide_entries.sql` | guide tools/techniques become generic `entry` blocks — no-op on a fresh one |
| `0005_drop_oxidation_ratio.sql` | drops those two tea fields *and their data* |
| `0006_puer_families.sql` | superseded by 0007 — skip it on a fresh database |
| `0007_revert_families_add_form.sql` | back to six families (sheng/shu → `black`) and adds `form` |

#### 2 · Google OAuth client

[Google Cloud console](https://console.cloud.google.com) → **APIs & Services**.

- **OAuth consent screen** — External. While it's in *Testing*, add yourself under **Test users**.
- **Credentials → OAuth client ID → Web application** — the only redirect URI is Supabase's callback:

```
https://mvkzwijcthbhmrbjgpko.supabase.co/auth/v1/callback
```

Google never sees this app's own address; that allowlist lives in Supabase (step 3).

#### 3 · Supabase auth

- **Authentication → Sign In / Providers → Google** — enable, paste the client ID and secret.
  Skipping this gives `Unsupported provider: provider is not enabled`.
- **Authentication → URL Configuration → Redirect URLs** — every origin the app runs on, port
  included: `http://localhost:5173`, the tailnet address, the deployed address. A missing one
  makes Supabase fall back to the Site URL, which looks like sign-in "not opening the app".
- **Authentication → Sign In / Providers → Allow new users to sign up** — off, so only existing
  accounts can sign in.

#### 4 · API key

Copy `.env.local.example` to `.env.local` and fill in the publishable key from
**Project Settings → API**. That key is public by design — every table has RLS and the key alone
grants nothing. Never put the `service_role` key in this file.

On an empty account you're offered example content — one tea, the guide, two lines of
research — or you can start empty.

</details>

---

## How it works

**Persistent order.** Every reorderable list stores a `position` holding a base-62 fractional
index. Dropping an item between two neighbours computes a key that sorts between theirs, so a
reorder is a single-row `UPDATE` however long the list. The columns are `collate "C"` so
Postgres and JavaScript sort identically. → [`src/lib/frac.js`](src/lib/frac.js)

**Guide layout.** Blocks also persist `span` (1–4 columns) and `height`, so resizing survives
reload. Blocks that open as their own page are kind `entry`; what they are — tool, technique,
type — is free text in `content.category`.

**Inner lists** — journal notes, findings, bullets, specs, bibliography — are Postgres arrays
or `jsonb`. The editors always hand back a complete array, so its order *is* the stored order.

**Images** go to a private `media` bucket under `<user-id>/…`, are recorded in `images`, and
are shown through signed URLs. Tap any filled slot to open it full-window.

**Typing** is debounced and coalesced per row, then flushed when you leave the page or hide the
tab — a paragraph is one `UPDATE`, not one per keystroke.

**Ownership.** Every row carries `owner_id` with an RLS policy restricting it to its owner,
from the very first migration.

<details>
<summary><b>Project layout</b></summary>

<br />

```
src/
  lib/            supabase client, auth, data access, fractional indexing, hooks, seed data
  ds/             design-system components — Logo, Ornament, Card, Field, Tag, Input
  edit/           editing primitives — IconBtn, Inp, Area, StringList, ObjList
  components/     ImageSlot / ImageList (Supabase-backed), Md
  views/          AppShell, Library, Detail, Add, Guide, Research, SignIn
  styles/         design tokens and base stylesheet
  assets/fonts/   only the faces actually rendered
public/           favicon, app icons, manifest, service worker
supabase/
  migrations/     0001 … 0007
run-teapo.cmd     headless launcher for the always-on dev server (Windows)
```

The UI began as the *Teapo DS* Claude Design project (`ui_kits/teapot/`). Two pieces didn't
port: `image-slot.js`, which saved to a sidecar file that only exists inside the Design runtime
(replaced by `src/components/ImageSlot.jsx`), and the kit's `window`-global modules, converted to
ES modules.

</details>

---

## On the phone

teapo is an installable PWA: a manifest, icons rasterised from `public/favicon.svg`, and a
service worker. Open it in Chrome on Android → menu → **Install app**.

The service worker deliberately caches **nothing**. Every screen reads and writes Supabase live,
so a cached shell would show stale teas and swallow edits. There's no offline mode — real offline
support would need hashed asset caching plus a queue for writes.

Data needs no syncing: the phone and the PC talk to the same Supabase database.

<details>
<summary><b>Local hosting on this machine — always-on dev server and Tailscale</b></summary>

<br />

**Always-on dev server.** A Windows scheduled task, `\teapo`, runs `run-teapo.cmd` headless at
logon (after 15s, not elevated, no time limit). The launcher handles its own restarts — up to 3,
a minute apart — because `conhost --headless` always exits 0, so Task Scheduler can't see a
crash. It stops immediately when the task itself is being torn down. Logs: `run.log`, and
`run.prev.log` for the session before. It only starts at **logon**, not on wake from sleep.

```powershell
Get-Content C:\Users\jqlnv\teastds\teapo\run.log -Tail 30   # what it's doing
Stop-ScheduledTask teapo; Start-ScheduledTask teapo          # restart
Unregister-ScheduledTask teapo -Confirm:$false               # remove it
```

While it runs it holds port 5173, and `strictPort` is on, so a manual `npm run dev` fails with
*Port 5173 is in use* — expected.

**Tailscale.** `tailscale serve --bg --https=8444 http://127.0.0.1:5173` publishes
`https://nine-note-asus.taildb8222.ts.net:8444` to your own devices only.

One tailnet name serves three apps, and `tailscale serve` **silently overwrites** an existing
mapping — check `tailscale serve status` before claiming a port.

| app | address | local |
| :-- | :-- | :-- |
| ktrn | `nine-note-asus.taildb8222.ts.net` (`/` on 443) | `8765` |
| ninedocs | `nine-note-asus.taildb8222.ts.net:8443` | `9999` |
| teapo | `nine-note-asus.taildb8222.ts.net:8444` | `5173` |

- Never `tailscale funnel` — that publishes to the open internet.
- The dev server is pinned to `127.0.0.1` in `vite.config.js`. At the default `localhost`, Node
  binds `::1` only and the proxy answers 502.
- `server.allowedHosts` lists the tailnet name, or Vite answers "Blocked request".

</details>

---

## Known gaps

- **Fonts ship as `.ttf`** — about 650 KB. Converting to `.woff2` would roughly halve it.
- **Labels and tags** still use JetBrains Mono and Offside, which lack some pinyin tones
  (ǐ ǒ ǔ, the ü series). Reading text and headings are fully covered; see *Typography*.
- **Nexus**, the wordmark face, is freeware for non-commercial use only. Fine here; it would need
  a licence or a substitute if teapo were ever commercial.
- **No offline mode**, by design for now — see *On the phone*.

## Licence

The code is [MIT](LICENSE). The bundled typefaces keep their own licences, listed below — MIT
does not cover them.

## Typography

Every face that sets reading text or a heading covers the full pinyin set — each tone mark
on a e i o u, and the ü series (**lǜchá**, 绿茶, is "green tea"). A missing glyph doesn't
fail loudly: the browser borrows it from another font, at another weight, mid-word.

| role | face |
| :-- | :-- |
| reading text | **Ruda** — no italic exists, so italics are slanted synthetically |
| headings, tea names, personal notes | **Thasadith** |
| wordmark | **Nexus** |
| tags, chips | Offside |
| labels, data | JetBrains Mono |
| Chinese, Japanese, Devanagari | Noto Serif SC, Shippori Mincho, Noto Serif Devanagari |

Rajdhani and Barlow were the originals and were replaced on 2026-11-24: both drop ǎ ǐ ǒ ǔ
and the ü tones. To check a candidate before adopting it, test its `cmap` for those
characters — e.g. with `fontTools` — rather than trusting a specimen.

## Credits

Typefaces: [Ruda](https://fonts.google.com/specimen/Ruda),
[Thasadith](https://fonts.google.com/specimen/Thasadith) and
[Offside](https://fonts.google.com/specimen/Offside) under the SIL Open Font License;
[Nexus](https://www.fontspace.com/nexus-font-f74191) (freeware, non-commercial); Noto Serif SC,
Shippori Mincho, Noto Serif Devanagari and JetBrains Mono via Google Fonts.
