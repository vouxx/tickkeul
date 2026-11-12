-- 티끌: 사용자별 학습 진도 저장 (financial_quiz 스키마)
-- Supabase 대시보드 > SQL Editor에서 그대로 실행하면 됩니다. 여러 번 실행해도 안전해요.

create schema if not exists financial_quiz;

grant usage on schema financial_quiz to anon, authenticated, service_role;

-- 한 사용자당 한 행: 학습 진도(progress)와 모의투자 기록(game)을 JSON으로 저장
create table if not exists financial_quiz.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  game jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table financial_quiz.user_progress is '티끌 학습 진도 (XP·스트릭·완료 레슨·익힌 용어·오답, 모의투자 기록)';

alter table financial_quiz.user_progress enable row level security;

-- 본인 행만 읽고 쓸 수 있다
drop policy if exists "user_progress_select_own" on financial_quiz.user_progress;
create policy "user_progress_select_own" on financial_quiz.user_progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_progress_insert_own" on financial_quiz.user_progress;
create policy "user_progress_insert_own" on financial_quiz.user_progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_progress_update_own" on financial_quiz.user_progress;
create policy "user_progress_update_own" on financial_quiz.user_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_progress_delete_own" on financial_quiz.user_progress;
create policy "user_progress_delete_own" on financial_quiz.user_progress
  for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on financial_quiz.user_progress to authenticated;
grant all on financial_quiz.user_progress to service_role;

-- 수정 시각 자동 갱신
create or replace function financial_quiz.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_progress_touch on financial_quiz.user_progress;
create trigger user_progress_touch
  before update on financial_quiz.user_progress
  for each row execute function financial_quiz.touch_updated_at();
