-- teapo — switch tea families to the traditional six Chinese categories
--
--   green white oolong black dark roasted   →   green white yellow oolong red black
--
-- The new set is the classical six, in ascending order of oxidation:
-- 绿 green, 白 white, 黄 yellow, 青 oolong, 红 red, 黑 black.
--
-- Which means `black` changes meaning. It used to be Western "black tea"
-- (Darjeeling, Assam); it is now 黑茶, post-fermented dark tea (pu-erh). Western
-- black tea is `red` (红茶). Existing rows are remapped accordingly:
--
--   black   → red     Darjeeling and friends keep their identity under the new name
--   dark    → black   pu-erh moves into the slot that now means post-fermented
--   roasted → green   not a category in this system; hōjicha is a roasted green
--
-- Only needed if 0001_init.sql was already run with the old constraint. On a fresh
-- database 0001 already carries the new definition and this is a harmless no-op.

do $do$
declare c text;
begin
  if to_regclass('public.teas') is null then
    raise notice 'public.teas does not exist yet — nothing to migrate';
    return;
  end if;

  -- Drop first: the remap writes values the old constraint would reject.
  -- Found by definition rather than assumed to be named teas_family_check — a
  -- leftover constraint under any other name would silently keep rejecting the
  -- new values after this migration claimed success.
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

  -- One statement, so every CASE arm sees the pre-update value. Doing these as
  -- separate updates would fold black and dark together.
  update public.teas
     set family = case family
                    when 'black'   then 'red'
                    when 'dark'    then 'black'
                    when 'roasted' then 'green'
                    else family
                  end
   where family in ('black', 'dark', 'roasted');

  alter table public.teas
    add constraint teas_family_check
    check (family in ('green', 'white', 'yellow', 'oolong', 'red', 'black'));
end
$do$;
