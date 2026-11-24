-- teapo — split the post-fermented family into sheng and shu pu'er
--
--   green white yellow oolong red black
--     →   green white yellow oolong red sheng shu
--
-- `black` (黑茶) was a single catch-all for post-fermented tea. It becomes the two
-- pu'er processes: 'sheng' ages slowly in air over years, 'shu' is pile-fermented
-- in weeks. Values stay slugs; the app renders "sheng pu'er" / "shu pu'er".
--
-- EXISTING `black` ROWS ARE MAPPED TO 'shu'. That is a guess — the two cannot be
-- told apart from the stored data. Check what it touched before running:
--
--   select id, name, harvest from public.teas where family = 'black';
--
-- and flip any that were raw afterwards:
--
--   update public.teas set family = 'sheng' where name = 'whichever one';
--
-- Safe to re-run; a no-op on a fresh database where 0001 already has the new set.

do $do$
declare c text;
begin
  if to_regclass('public.teas') is null then
    raise notice 'public.teas does not exist yet — nothing to migrate';
    return;
  end if;

  -- Drop first: the remap writes values the old constraint would reject. Found by
  -- definition rather than by name, so a constraint created under any other name
  -- cannot survive and keep rejecting the new values.
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

  update public.teas set family = 'shu' where family = 'black';

  alter table public.teas
    add constraint teas_family_check
    check (family in ('green', 'white', 'yellow', 'oolong', 'red', 'sheng', 'shu'));
end
$do$;
