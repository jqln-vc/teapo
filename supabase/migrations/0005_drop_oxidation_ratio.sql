-- teapo — drop the oxidation and ratio fields from teas
--
-- Both were free-text columns on the tea record. Removed from the Add form, the
-- detail panel, and the collection card footer, so the data behind them has no
-- remaining reader.
--
-- This DESTROYS whatever is stored in those two columns. If any of it is worth
-- keeping, run the SELECT at the bottom first and save the result.
--
-- Unrelated uses of the same words stay: the guide's "oxidation" glossary entry and
-- the "ratio" specs on brewing techniques live in guide_blocks.content, untouched.
--
-- Safe to re-run; safe on a fresh database where 0001 already omits the columns.

alter table public.teas drop column if exists oxidation;
alter table public.teas drop column if exists ratio;

-- Run BEFORE the drops if you want to keep the values:
--
--   select name, oxidation, ratio
--     from public.teas
--    where coalesce(oxidation, '') <> '' or coalesce(ratio, '') <> ''
--    order by name;
