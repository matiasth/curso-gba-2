-- ============================================================
-- SETUP SUPABASE - Eurovision Spain
-- Pegar y ejecutar completo en: SQL Editor (icono >_ del menu)
-- ============================================================

-- 1) Tabla de una sola fila (id=1): el articulo destacado como JSONB
create table if not exists public.site_data (
  id int primary key default 1 check (id = 1),
  featured jsonb not null,
  updated_at timestamptz not null default now()
);

-- 2) Fila semilla con tu contenido actual (no sobrescribe si ya existe)
insert into public.site_data (id, featured)
values (
  1,
  $${"featured":{"category":"Bulgaria","title":"Eurovision se hara en Bulgaria !!!!!!\naca va a ir mas texto","date":{"day":"21","month":"AGO","year":"2027"},"image":{"url":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRspLMhlYdolmzukEl00TJPjRSq4jgvevPNtiR8t86lfr7yjlRwv7Q0nEw&s=10","placeholder":"[FOTO: Fachada del edificio moderno de AVROTROS con su logotipo azul visible]"}}}$$::jsonb
)
on conflict (id) do nothing;

-- 3) Seguridad a nivel de fila (RLS):
--    cualquiera puede LEER, solo usuarios autenticados pueden EDITAR
alter table public.site_data enable row level security;

drop policy if exists "lectura publica" on public.site_data;
create policy "lectura publica"
  on public.site_data for select
  using (true);

drop policy if exists "edicion solo autenticados" on public.site_data;
create policy "edicion solo autenticados"
  on public.site_data for update
  to authenticated
  using (true)
  with check (true);
