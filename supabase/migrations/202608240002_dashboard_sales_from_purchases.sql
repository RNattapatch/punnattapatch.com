-- Dashboard revenue must follow the payment ledger, never the latest quoted lead value.
do $$
declare
  v_definition text;
begin
  select pg_get_functiondef('public.get_dashboard_data()'::regprocedure) into v_definition;
  v_definition := regexp_replace(
    v_definition,
    $pattern$(?s)coalesce\(sum\(net_amt\) filter \(where deal_outcome in \('won','repeat','retainer'\)\),0\) as sales_total,\s*coalesce\(sum\(net_amt\) filter \(where deal_outcome in \('won','repeat','retainer'\) and close_m=\(select cur_m from p\)\),0\) as sales_this_month,\s*coalesce\(sum\(net_amt\) filter \(where deal_outcome in \('won','repeat','retainer'\) and close_m=\(select prev_m from p\)\),0\) as sales_prev_month,$pattern$,
    $replacement$coalesce((select sum(pu.net_amount_thb) from public.purchases pu),0) as sales_total,
    coalesce((select sum(pu.net_amount_thb) from public.purchases pu where date_trunc('month', pu.purchased_at at time zone 'Asia/Bangkok')=(select cur_m from p)),0) as sales_this_month,
    coalesce((select sum(pu.net_amount_thb) from public.purchases pu where date_trunc('month', pu.purchased_at at time zone 'Asia/Bangkok')=(select prev_m from p)),0) as sales_prev_month,$replacement$
  );
  if position('sum(pu.net_amount_thb)' in v_definition) = 0 then
    raise exception 'dashboard_sales_ledger_replacement_failed';
  end if;
  execute v_definition;
end;
$$;
