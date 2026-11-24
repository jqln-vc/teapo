-- teapo — revert to six families, and add `form`
--
-- Two changes, independent of each other. Safe to re-run; both are no-ops on a
-- fresh database where 0001 already reflects them.

-- ── 1. back to the six traditional categories ──────────────────────────────────
--
--   green white yellow oolong red sheng shu   →   green white yellow oolong red black
--
-- The pu'er split is undone: 黑茶 is one post-fermented family again, covering both
-- processes. Existing rows in either pu'er category collapse into 'black' — 'shu'
-- because that is where the current tea sits, and 'sheng' because the value is
-- going away and 'black' is the only category left that means post-fermented.
--
-- Check what this will touch before running:
--
--   select name, family from public.teas where family in ('sheng', 'shu');

do $do$
declare c text;
begin
  if to_regclass('public.teas') is null then
    raise notice 'public.teas does not exist yet — nothing to migrate';
    return;
  end if;

  -- Drop first: the remap writes a value the current constraint would reject.
  -- Found by definition rather than by name, so a constraint created under any
  -- other name cannot survive and keep rejecting 'black'.
  for c in
    select con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
     where nsp.nspname = 'public'
       and rel.relname = 'teas'
       and con.contype = 'c'
       and pg_get_constraintdef(con.oid) ilike '%family%'
  loop
    execute format('alter table public.teas drop constraint %I', c);
  end loop;

  update public.teas set family = 'black' where family in ('sheng', 'shu');

  alter table public.teas
    add constraint teas_family_check
    check (family in ('green', 'white', 'yellow', 'oolong', 'red', 'black'));
end
$do$;

-- ── 2. the new `form` attribute ────────────────────────────────────────────────
--
-- How the leaf comes: loose, a 357g cake, a tuo, a brick, pearls. Free text, like
-- cultivar and steep — not a constrained set, so nothing has to be migrated when a
-- shape turns up that no list anticipated.

alter table public.teas add column if not exists form text not null default '';
