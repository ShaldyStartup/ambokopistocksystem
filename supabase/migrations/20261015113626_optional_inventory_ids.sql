create or replace function public.save_category(p_id uuid default null, p_name text default null, p_active boolean default true)
returns uuid language sql security invoker set search_path='' as $$
  select inventory_private.save_category(p_id,p_name,p_active);
$$;
create or replace function public.save_item(p_id uuid default null, p_data jsonb default '{}'::jsonb)
returns uuid language sql security invoker set search_path='' as $$
  select inventory_private.save_item(p_id,p_data);
$$;
