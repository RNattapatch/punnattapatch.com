-- CRM document-to-sales ledger.
-- A quote is an offer. Revenue exists only as a purchase payment.

alter table public.documents drop constraint if exists documents_status_check;
alter table public.documents add constraint documents_status_check
  check (status = any (array['draft', 'issued', 'sent', 'partial', 'paid', 'void']));

alter table public.documents enable row level security;
drop policy if exists owner_all_documents on public.documents;
create policy owner_all_documents on public.documents
  for all to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

alter table public.document_line_items enable row level security;
drop policy if exists owner_all_document_line_items on public.document_line_items;
create policy owner_all_document_line_items on public.document_line_items
  for all to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create or replace function public.record_document_payment(
  p_document_id uuid,
  p_package text,
  p_amount_thb numeric,
  p_tax_mode text,
  p_purchased_at timestamptz,
  p_note text default null,
  p_mark_paid boolean default true
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_document public.documents%rowtype;
  v_purchase public.purchases%rowtype;
  v_total_paid numeric;
  v_status text;
  v_purchase_count integer;
  v_outcome text;
  v_net numeric;
begin
  if p_document_id is null then
    raise exception 'document_id_required' using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_package, '')), '') is null then
    raise exception 'package_required' using errcode = '22023';
  end if;
  if p_amount_thb is null or p_amount_thb <= 0 then
    raise exception 'amount_required' using errcode = '22023';
  end if;
  if p_tax_mode not in ('cash', 'wht_3', 'vat_7') then
    raise exception 'tax_mode_invalid' using errcode = '22023';
  end if;
  if p_purchased_at is null then
    raise exception 'purchased_at_required' using errcode = '22023';
  end if;

  select * into v_document
  from public.documents
  where id = p_document_id
  for update;

  if not found then
    raise exception 'document_not_found' using errcode = 'P0002';
  end if;
  if v_document.status = 'void' then
    raise exception 'document_void' using errcode = '22023';
  end if;
  if v_document.status = 'paid' then
    raise exception 'document_already_paid' using errcode = '23505';
  end if;
  if v_document.lead_id is null then
    raise exception 'document_lead_required' using errcode = '22023';
  end if;

  v_net := case when p_tax_mode = 'wht_3' then round(p_amount_thb * 0.97, 2) else p_amount_thb end;
  insert into public.purchases (
    lead_id, package, amount_thb, tax_mode, net_amount_thb,
    document_id, source, note, purchased_at
  ) values (
    v_document.lead_id, btrim(p_package), p_amount_thb, p_tax_mode, v_net,
    v_document.id, 'dashboard', nullif(btrim(coalesce(p_note, '')), ''), p_purchased_at
  ) returning * into v_purchase;

  select coalesce(sum(amount_thb), 0) into v_total_paid
  from public.purchases
  where document_id = v_document.id;

  v_status := case
    when p_mark_paid or v_total_paid + 0.005 >= v_document.grand_total then 'paid'
    else 'partial'
  end;

  update public.documents
  set status = v_status
  where id = v_document.id;

  select purchase_count into v_purchase_count
  from public.leads
  where id = v_document.lead_id;
  v_outcome := case when coalesce(v_purchase_count, 0) > 1 then 'repeat' else 'won' end;

  update public.leads
  set deal_outcome = v_outcome,
      payment_status = case when v_status = 'paid' then 'paid' else 'partial' end,
      package = case when p_mark_paid then btrim(p_package) else package end,
      package_price = case when p_mark_paid then p_amount_thb else package_price end,
      tax_mode = case when p_mark_paid then p_tax_mode else tax_mode end,
      last_touch_at = now(),
      updated_at = now()
  where id = v_document.lead_id;

  return jsonb_build_object(
    'purchase', to_jsonb(v_purchase),
    'document_id', v_document.id,
    'document_status', v_status,
    'total_paid_thb', v_total_paid,
    'deal_outcome', v_outcome
  );
end;
$$;

revoke all on function public.record_document_payment(uuid, text, numeric, text, timestamptz, text, boolean) from public;
grant execute on function public.record_document_payment(uuid, text, numeric, text, timestamptz, text, boolean) to authenticated;

-- Existing Doc-Bot receipts create their purchase directly. Mirror that payment
-- truth onto the linked receipt document without changing QO/invoice behavior.
create or replace function public.mark_receipt_document_paid()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.document_id is not null and new.source = 'receipt' then
    update public.documents set status = 'paid' where id = new.document_id and status <> 'void';
  end if;
  return new;
end;
$$;

drop trigger if exists purchases_mark_receipt_document_paid on public.purchases;
create trigger purchases_mark_receipt_document_paid
  after insert on public.purchases
  for each row execute function public.mark_receipt_document_paid();
