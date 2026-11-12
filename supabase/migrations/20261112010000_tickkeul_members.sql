-- 티끌 회원 분리
-- 같은 Supabase 프로젝트를 여러 서비스가 쓰기 때문에 로그인 계정(auth.users)은 공유된다.
-- 그래서 "티끌에서 가입한 계정"만 financial_quiz.members 에 등록하고,
-- 진도 데이터는 티끌 회원만 읽고 쓸 수 있게 막는다. 다른 서비스 계정에는 영향이 없다.
-- Supabase 대시보드 > SQL Editor 에서 그대로 실행하면 된다. 여러 번 실행해도 안전하다.

-- 1) 티끌 회원 목록
create table if not exists financial_quiz.members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now()
);

comment on table financial_quiz.members is '티끌(tickkeul)에서 가입한 계정 목록 — 이 목록에 있어야 티끌 데이터에 접근할 수 있다';

alter table financial_quiz.members enable row level security;

-- 본인이 회원인지 확인하는 조회만 허용. 등록은 아래 트리거만 한다 (앱에서 직접 추가 불가)
drop policy if exists "members_select_own" on financial_quiz.members;
create policy "members_select_own" on financial_quiz.members
  for select to authenticated
  using ((select auth.uid()) = user_id);

grant select on financial_quiz.members to authenticated;
grant all on financial_quiz.members to service_role;

-- 2) 티끌 가입 화면에서 만든 계정(가입 정보 app = 'tickkeul')만 자동으로 회원 등록
create or replace function financial_quiz.handle_tickkeul_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ->> 'app' = 'tickkeul' then
    insert into financial_quiz.members (user_id) values (new.id)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

revoke execute on function financial_quiz.handle_tickkeul_signup() from public, anon, authenticated;

drop trigger if exists tickkeul_on_auth_user_created on auth.users;
create trigger tickkeul_on_auth_user_created
  after insert on auth.users
  for each row execute function financial_quiz.handle_tickkeul_signup();

-- 3) 이미 티끌에 진도를 저장한 계정은 회원으로 옮겨 둔다
insert into financial_quiz.members (user_id)
select user_id from financial_quiz.user_progress
on conflict (user_id) do nothing;

-- 4) 지금 로그인한 사람이 티끌 회원인지
create or replace function financial_quiz.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from financial_quiz.members where user_id = (select auth.uid()));
$$;

revoke execute on function financial_quiz.is_member() from public, anon;
grant execute on function financial_quiz.is_member() to authenticated;

-- 5) 진도 데이터: 본인 것 + 티끌 회원일 때만
drop policy if exists "user_progress_select_own" on financial_quiz.user_progress;
create policy "user_progress_select_own" on financial_quiz.user_progress
  for select to authenticated
  using ((select auth.uid()) = user_id and financial_quiz.is_member());

drop policy if exists "user_progress_insert_own" on financial_quiz.user_progress;
create policy "user_progress_insert_own" on financial_quiz.user_progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id and financial_quiz.is_member());

drop policy if exists "user_progress_update_own" on financial_quiz.user_progress;
create policy "user_progress_update_own" on financial_quiz.user_progress
  for update to authenticated
  using ((select auth.uid()) = user_id and financial_quiz.is_member())
  with check ((select auth.uid()) = user_id and financial_quiz.is_member());

drop policy if exists "user_progress_delete_own" on financial_quiz.user_progress;
create policy "user_progress_delete_own" on financial_quiz.user_progress
  for delete to authenticated
  using ((select auth.uid()) = user_id and financial_quiz.is_member());

-- 6) 테이블 설명 (앱 이름 변경 반영)
comment on table financial_quiz.user_progress is '티끌(tickkeul) 학습 진도 (XP·스트릭·완료 레슨·익힌 용어·오답, 모의투자 기록)';
