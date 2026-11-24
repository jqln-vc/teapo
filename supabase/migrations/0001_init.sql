-- teapo — initial schema
--
-- Design notes:
--  * Every table carries owner_id and has RLS enabled with a strict policy.
--    Nothing is readable or writable without an authenticated user that owns the row.
--  * Ordering is persisted with fractional indexes (`position text`). Moving one item
--    between two neighbours rewrites ONE row instead of renumbering the whole list.
--    Generated client-side by src/lib/frac.js. Collated as C so ordering is bytewise
--    and matches the JS string comparison exactly.
--  * Inner lists that the editors replace wholesale (StringList / ObjList always hand
--    back a complete new array) are stored as arrays or jsonb rather than child tables.
--    Postgres preserves array order, so their ordering is persisted for free.
--    Only top-level collections and images — the things that are individually
--    reordered — get their own rows with a position.

-- gen_random_uuid() is built into Postgres 13+, so no extension is needed.

-- ---------------------------------------------------------------- helpers

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

-- ---------------------------------------------------------------- teas

create table public.teas (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  position    text not null collate "C",

  name        text not null default '',
  kanji       text not null default '',
  -- The six traditional Chinese categories, ascending oxidation:
  -- 绿 green, 白 white, 黄 yellow, 青 oolong, 红 red, 黑 black.
  -- 'red' is what the West calls black tea; 'black' is post-fermented (pu'er,
  -- liu bao, fu zhuan).
  family      text not null default 'green'
              check (family in ('green','white','yellow','oolong','red','black')),
  region      text not null default '',
  country     text not null default '',
  cultivar    text not null default '',
  -- how the leaf comes: loose, a 357g cake, a tuo, a brick, pearls. Free text,
  -- like every other descriptive field here.
  form        text not null default '',
  -- harvest is deliberately text, not date: the collection holds values like
  -- '2011-04' and '2023' alongside full dates.
  harvest     text not null default '',
  steep       text not null default '',

  tags        text[] not null default '{}',
  notes       text not null default '',
  journal     text[] not null default '{}',

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index teas_owner_position_idx on public.teas (owner_id, position);

-- ---------------------------------------------------------------- guide

-- One ordered grid of heterogeneous blocks. `span` and `height` are the
-- persisted result of the drag-resize handle in GuideView.
--
-- `content` shape by kind:
--   heading       { label }
--   trivia        { title, text }
--   note          { title, items: [string] }
--   illustration  { label }
--   entry         { category, name, kanji, tone, blurb, specs: [[k,v]],
--                   body: [string], bullets: [string], bulletsTitle }
--                 category is free text (tool, technique, type, …); entries are the
--                 blocks that open as their own page.
create table public.guide_blocks (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  position    text not null collate "C",

  kind        text not null
              check (kind in ('entry','trivia','illustration','note','heading')),
  span        smallint not null default 1 check (span between 1 and 4),
  height      integer  not null default 260 check (height >= 0),
  content     jsonb    not null default '{}'::jsonb,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index guide_blocks_owner_position_idx on public.guide_blocks (owner_id, position);

create table public.glossary_terms (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  position    text not null collate "C",

  term        text not null default '',
  definition  text not null default '',

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index glossary_terms_owner_position_idx on public.glossary_terms (owner_id, position);

-- ---------------------------------------------------------------- exploration

create table public.research_items (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  position        text not null collate "C",

  title           text not null default '',
  tone            text not null default 'green',
  description     text not null default '',

  -- [[label, kind]] where kind is one of tea | microbe | compound
  topics          jsonb  not null default '[]'::jsonb,
  findings        text[] not null default '{}',
  -- [{ authors, title, year, where, url? }]
  biblio          jsonb  not null default '[]'::jsonb,
  -- [{ note, ref? }] where ref is an index into biblio
  log             jsonb  not null default '[]'::jsonb,

  findings_title  text not null default 'findings',
  notes_title     text not null default 'notes & citations',
  biblio_title    text not null default 'bibliography',

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index research_items_owner_position_idx on public.research_items (owner_id, position);

-- ---------------------------------------------------------------- images

-- Replaces the design kit's <image-slot> sidecar persistence.
-- storage_path points into the private 'media' bucket, always under <owner_id>/.
--
-- role, by parent_type:
--   tea             'a' | 'b' | 'c' | 'd'   — the four fixed slots on the detail page
--   guide_block     'default'               — one per entry or illustration block
--   research_item   'fig' | 'plate'         — two independent ordered lists
--
-- Teas use four fixed roles today, but the row-per-image shape means becoming a
-- free-form ordered gallery later is a UI change, not a migration.
create table public.images (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,

  parent_type   text not null check (parent_type in ('tea','guide_block','research_item')),
  parent_id     uuid not null,
  role          text not null default 'default',
  position      text not null collate "C",

  storage_path  text not null,
  caption       text not null default '',
  width         integer,
  height        integer,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index images_owner_parent_idx
  on public.images (owner_id, parent_type, parent_id, role, position);

-- One image per fixed slot on a tea.
create unique index images_tea_slot_uniq
  on public.images (parent_id, role)
  where parent_type = 'tea';

-- ---------------------------------------------------------------- triggers

do $do$
declare t text;
begin
  foreach t in array array['teas','guide_blocks','glossary_terms','research_items','images']
  loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t, t);
  end loop;
end
$do$;

-- ---------------------------------------------------------------- row level security

-- Enabled on every table, with a single policy per table: you may only touch
-- rows you own, and you may only create rows owned by you. There is no
-- anonymous access — the anon key alone grants nothing.
do $do$
declare t text;
begin
  foreach t in array array['teas','guide_blocks','glossary_terms','research_items','images']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I_owner_all on public.%I', t, t);
    execute format(
      'create policy %I_owner_all on public.%I
         for all to authenticated
         using (owner_id = auth.uid())
         with check (owner_id = auth.uid())', t, t);
  end loop;
end
$do$;
