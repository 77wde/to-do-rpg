-- ============================================================================
-- Pin the search_path on set_updated_at().
--
-- Without it the function resolves unqualified names through whatever
-- search_path the caller happens to have, so a schema earlier on that path can
-- shadow the objects the body meant to reach. Flagged by the database linter
-- as `function_search_path_mutable` (0011).
--
-- An empty search_path still resolves pg_catalog, which is where now() lives,
-- so the body needs no other change.
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
