-- teapo — one generic "entry" kind for guide blocks that open as their own page
--
--   tool, technique   →   entry { category: 'tool' | 'technique' | anything }
--
-- Tools and techniques were two hardcoded kinds with identical content and the same
-- detail page. They become a single `entry` kind whose category is free text in
-- content.category, so the guide can hold types, vessels, regions — any object-like
-- entry — without a migration per kind.
--
-- Existing rows keep their category (the old kind name) and everything else in content.
-- Safe to re-run.

do $do$
declare c text;
begin
  if to_regclass('public.guide_blocks') is null then
    raise notice 'public.guide_blocks does not exist yet — nothing to migrate';
    return;
  end if;

  -- Found by definition, not by name, for the same reason as 0003.
  for c in
    select con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
     where nsp.nspname = 'public'
       and rel.relname = 'guide_blocks'
       and con.contype = 'c'
       and pg_get_constraintdef(con.oid) ilike '%kind%'
  loop
    execute format('alter table public.guide_blocks drop constraint %I', c);
  end loop;

  -- A category already set on the row wins over the old kind name.
  update public.guide_blocks
     set content = jsonb_build_object('category', kind) || content,
         kind    = 'entry'
   where kind in ('tool', 'technique');

  alter table public.guide_blocks
    add constraint guide_blocks_kind_check
    check (kind in ('entry', 'trivia', 'illustration', 'note', 'heading'));
end
$do$;
