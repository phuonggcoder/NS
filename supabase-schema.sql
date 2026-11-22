-- Chạy câu lệnh SQL này trong Supabase SQL Editor nếu bạn chọn lưu trữ miễn phí bằng Supabase Postgres
create table if not exists public.specpage_kv (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.specpage_kv enable row level security;
-- Lưu ý: Server dùng SUPABASE_SERVICE_ROLE_KEY nên không mở quyền đọc/ghi public anon key.
