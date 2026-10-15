-- Content Center: custom card order on the Kanban board (2026-10-15)
-- board_rank = position inside a column when the board is sorted "Custom" (ลากเรียงเอง).
-- Stored in the DB (not localStorage) so the order matches on MacBook and iPhone.
-- Nullable: cards never dragged have no rank and fall back to newest-first.

alter table public.content_variants add column if not exists board_rank integer;
alter table public.content_items    add column if not exists board_rank integer;

-- One call per drop: renumber a whole column in the order given.
-- security invoker → the existing owner_all_* RLS policies (is_owner()) still decide who may write.
create or replace function public.content_variants_reorder(p_ids text[])
returns void language sql security invoker set search_path = public as $$
  update public.content_variants v set board_rank = o.ord
  from unnest(p_ids) with ordinality as o(id, ord)
  where v.variant_id = o.id;
$$;

create or replace function public.content_items_reorder(p_ids text[])
returns void language sql security invoker set search_path = public as $$
  update public.content_items i set board_rank = o.ord
  from unnest(p_ids) with ordinality as o(id, ord)
  where i.content_id = o.id;
$$;

revoke all on function public.content_variants_reorder(text[]) from public, anon;
revoke all on function public.content_items_reorder(text[]) from public, anon;
grant execute on function public.content_variants_reorder(text[]) to authenticated;
grant execute on function public.content_items_reorder(text[]) to authenticated;
