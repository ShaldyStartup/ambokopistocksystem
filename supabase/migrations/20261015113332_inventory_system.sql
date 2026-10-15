-- Ambo Coffee: production schema, no sample inventory or accounts.
create schema if not exists inventory_private;
revoke all on schema inventory_private from public, anon;
grant usage on schema inventory_private to authenticated;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete restrict,
 name text not null check (length(name) between 1 and 120),
 role text not null default 'staff' check (role in ('staff','owner','manager')),
 active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.inventory_categories (
 id uuid primary key default gen_random_uuid(), name text not null unique check(length(trim(name)) between 1 and 80),
 description text not null default '', active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.inventory_items (
 id uuid primary key default gen_random_uuid(), category_id uuid not null references public.inventory_categories(id),
 name text not null check(length(trim(name)) between 1 and 120), unit text not null check(length(trim(unit)) between 1 and 30),
 current_stock numeric(15,3) not null default 0 check(current_stock between 0 and 999999999),
 minimum_stock numeric(15,3) not null default 0 check(minimum_stock between 0 and 999999999),
 notes text not null default '' check(length(notes)<=1000), active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 updated_by uuid not null references public.profiles(id)
);
create table public.stock_records (
 id uuid primary key default gen_random_uuid(), inventory_item_id uuid not null references public.inventory_items(id),
 record_type text not null check(record_type in ('initial','stock_count','addition','reduction','correction')),
 previous_quantity numeric(15,3) not null check(previous_quantity>=0), new_quantity numeric(15,3) not null check(new_quantity>=0),
 quantity_change numeric(15,3) not null, shift_date date, shift_label text,
 notes text check(length(notes)<=1600), reason text check(length(reason)<=200),
 recorded_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
 item_name text not null, unit text not null, minimum_stock numeric(15,3) not null, category_name text not null, recorder_name text not null,
 check(new_quantity - previous_quantity = quantity_change)
);
create index stock_records_created on public.stock_records(created_at desc);
create index stock_records_item on public.stock_records(inventory_item_id,created_at desc);
create index stock_records_user on public.stock_records(recorded_by,created_at desc);
create index inventory_category on public.inventory_items(category_id);
create index inventory_updated_by on public.inventory_items(updated_by);

create function inventory_private.app_role() returns text language sql stable security definer set search_path = '' as $$
 select role from public.profiles where id=auth.uid() and active;
$$;
create function inventory_private.require_role(management boolean default false) returns void language plpgsql security invoker set search_path = '' as $$
begin
 if inventory_private.app_role() is null or (management and inventory_private.app_role() not in ('owner','manager')) then
 raise exception 'Akses ditolak.' using errcode='42501'; end if;
end; $$;

alter table public.profiles enable row level security;
alter table public.inventory_categories enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_records enable row level security;
create policy profiles_read on public.profiles for select to authenticated using (id=(select auth.uid()) or (select inventory_private.app_role()) in ('owner','manager'));
create policy categories_read on public.inventory_categories for select to authenticated using ((select inventory_private.app_role()) is not null);
create policy items_read on public.inventory_items for select to authenticated using ((select inventory_private.app_role()) is not null);
create policy records_read on public.stock_records for select to authenticated using ((select inventory_private.app_role()) in ('owner','manager') or ((select inventory_private.app_role())='staff' and created_at >= now()-interval '30 days'));
revoke all on public.profiles, public.inventory_categories, public.inventory_items, public.stock_records from anon, authenticated;
grant select on public.profiles, public.inventory_categories, public.inventory_items, public.stock_records to authenticated;

create function inventory_private.prevent_history_changes() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'Riwayat stok bersifat permanen.'; end; $$;
create trigger immutable_history before update or delete on public.stock_records for each row execute function inventory_private.prevent_history_changes();

create function inventory_private.save_category(p_id uuid, p_name text, p_active boolean) returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
 perform inventory_private.require_role(true);
 if p_id is null then
 insert into public.inventory_categories(name,active) values(trim(p_name),p_active) returning id into result;
 else
 update public.inventory_categories set name=trim(p_name),active=p_active,updated_at=now() where id=p_id returning id into result;
 if result is null then raise exception 'Kategori tidak ditemukan.'; end if;
 end if;
 return result;
end; $$;

create function inventory_private.save_item(p_id uuid, p_data jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid; initial numeric; minimum numeric; cat text; actor text;
begin
 perform inventory_private.require_role(true);
 minimum := (p_data->>'minimum_stock')::numeric;
 if minimum is null or minimum<0 or minimum>999999999 or minimum<>round(minimum,3) then raise exception 'Stok minimum tidak valid.'; end if;
 select name into cat from public.inventory_categories where id=(p_data->>'category_id')::uuid;
 if cat is null then raise exception 'Kategori tidak ditemukan.'; end if;
 if p_id is null then
 initial := (p_data->>'initial_stock')::numeric;
 if initial is null or initial<0 or initial>999999999 or initial<>round(initial,3) then raise exception 'Jumlah tidak valid.'; end if;
 insert into public.inventory_items(name,category_id,unit,current_stock,minimum_stock,notes,active,updated_by)
 values(trim(p_data->>'name'),(p_data->>'category_id')::uuid,trim(p_data->>'unit'),initial,(p_data->>'minimum_stock')::numeric,coalesce(p_data->>'notes',''),(p_data->>'active')::boolean,auth.uid()) returning id into result;
 select name into actor from public.profiles where id=auth.uid();
 insert into public.stock_records(inventory_item_id,record_type,previous_quantity,new_quantity,quantity_change,recorded_by,item_name,unit,minimum_stock,category_name,recorder_name,notes)
 values(result,'initial',0,initial,initial,auth.uid(),trim(p_data->>'name'),trim(p_data->>'unit'),(p_data->>'minimum_stock')::numeric,cat,actor,'Stok awal saat item dibuat');
 else
 update public.inventory_items set name=trim(p_data->>'name'),category_id=(p_data->>'category_id')::uuid,unit=trim(p_data->>'unit'),minimum_stock=(p_data->>'minimum_stock')::numeric,notes=coalesce(p_data->>'notes',''),active=(p_data->>'active')::boolean,updated_at=now(),updated_by=auth.uid()
 where id=p_id returning id into result;
 if result is null then raise exception 'Item tidak ditemukan.'; end if;
 end if;
 return result;
end; $$;

create function inventory_private.record_stock(p_entries jsonb, p_type text, p_shift_date date default null, p_shift_label text default null, p_reason text default null, p_notes text default '') returns integer language plpgsql security definer set search_path = '' as $$
declare entry jsonb; item public.inventory_items%rowtype; value numeric; next_value numeric; actor text; cat text; total integer:=0;
begin
 perform inventory_private.require_role(false);
 if p_type is null or p_type not in ('stock_count','addition','reduction','correction') then raise exception 'Jenis tidak valid.'; end if;
 if p_entries is null or jsonb_typeof(p_entries)<>'array' or jsonb_array_length(p_entries) not between 1 and 500 then raise exception 'Pilih item.'; end if;
 if (select count(distinct (e->>'id')::uuid) from jsonb_array_elements(p_entries) e) <> jsonb_array_length(p_entries) then raise exception 'Item duplikat.'; end if;
 if p_type='stock_count' and (p_shift_date is null or nullif(trim(p_shift_label),'') is null or length(p_shift_label)>80) then raise exception 'Tanggal dan shift wajib diisi.'; end if;
 if p_type<>'stock_count' and (jsonb_array_length(p_entries)<>1 or nullif(trim(p_reason),'') is null) then raise exception 'Alasan wajib diisi.'; end if;
 if length(p_notes)>1000 or length(p_reason)>200 then raise exception 'Catatan terlalu panjang.'; end if;
 select name into actor from public.profiles where id=auth.uid();
 -- A deterministic lock order avoids deadlocks for overlapping stock counts.
 for entry in select e from jsonb_array_elements(p_entries) e order by (e->>'id')::uuid loop
 select * into item from public.inventory_items where id=(entry->>'id')::uuid for update;
 if not found or not item.active then raise exception 'Item tidak aktif atau tidak ditemukan.'; end if;
 if (entry->>'expected') is null or (entry->>'expected')::numeric<>item.current_stock then raise exception 'Stok berubah. Muat ulang halaman sebelum menyimpan.' using errcode='40001'; end if;
 value:=(entry->>'quantity')::numeric;
 if value is null or value<0 or value>999999999 or value<>round(value,3) or (p_type<>'stock_count' and value<=0) then raise exception 'Jumlah tidak valid.'; end if;
 next_value:=case p_type when 'addition' then item.current_stock+value when 'reduction' then item.current_stock-value else value end;
 if next_value<0 or next_value>999999999 then raise exception 'Jumlah stok tidak boleh negatif atau terlalu besar.'; end if;
 if length(coalesce(entry->>'notes',''))>500 then raise exception 'Catatan terlalu panjang.'; end if;
 select name into cat from public.inventory_categories where id=item.category_id;
 insert into public.stock_records(inventory_item_id,record_type,previous_quantity,new_quantity,quantity_change,shift_date,shift_label,notes,reason,recorded_by,item_name,unit,minimum_stock,category_name,recorder_name)
 values(item.id,p_type,item.current_stock,next_value,next_value-item.current_stock,p_shift_date,p_shift_label,concat_ws(' · ',nullif(p_notes,''),nullif(entry->>'notes','')),p_reason,auth.uid(),item.name,item.unit,item.minimum_stock,cat,actor);
 update public.inventory_items set current_stock=next_value,updated_at=now(),updated_by=auth.uid() where id=item.id;
 total:=total+1;
 end loop;
 return total;
end; $$;
revoke execute on function inventory_private.app_role(),inventory_private.require_role(boolean),inventory_private.prevent_history_changes(),inventory_private.save_category(uuid,text,boolean),inventory_private.save_item(uuid,jsonb),inventory_private.record_stock(jsonb,text,date,text,text,text) from public, anon, authenticated;
grant execute on function inventory_private.app_role(),inventory_private.require_role(boolean),inventory_private.save_category(uuid,text,boolean),inventory_private.save_item(uuid,jsonb),inventory_private.record_stock(jsonb,text,date,text,text,text) to authenticated;
-- Accounts and roles are provisioned through the Supabase admin console or the separate demo script.
-- No application endpoint permits self-registration or changing roles.

alter table public.stock_records add column was_low_stock boolean generated always as (new_quantity <= minimum_stock) stored;



-- Data API entrypoints keep privileged implementations in an unexposed schema.
create function public.save_category(p_id uuid, p_name text, p_active boolean) returns uuid language sql security invoker set search_path='' as $$ select inventory_private.save_category(p_id,p_name,p_active); $$;
create function public.save_item(p_id uuid, p_data jsonb) returns uuid language sql security invoker set search_path='' as $$ select inventory_private.save_item(p_id,p_data); $$;
create function public.record_stock(p_entries jsonb, p_type text, p_shift_date date default null, p_shift_label text default null, p_reason text default null, p_notes text default '') returns integer language sql security invoker set search_path='' as $$ select inventory_private.record_stock(p_entries,p_type,p_shift_date,p_shift_label,p_reason,p_notes); $$;
revoke execute on function public.save_category(uuid,text,boolean),public.save_item(uuid,jsonb),public.record_stock(jsonb,text,date,text,text,text) from public,anon,authenticated;
grant execute on function public.save_category(uuid,text,boolean),public.save_item(uuid,jsonb),public.record_stock(jsonb,text,date,text,text,text) to authenticated;
