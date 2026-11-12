"use client";

import type { Session } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { mergeGame, mergeProgress } from "./merge";
import { progressStore } from "./progress";
import { gameStore } from "./store";
import { getSupabase, type Provider } from "./supabase";

export type SyncStatus = "off" | "syncing" | "synced" | "error";

export interface AccountState {
  ready: boolean;
  user: { id: string; email: string | null; provider: string | null } | null;
  sync: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
  /** 비밀번호 재설정 메일의 링크로 들어온 상태 */
  recovery: boolean;
}

const TABLE = "user_progress";
const PUSH_DELAY_MS = 1500;

let state: AccountState = { ready: false, user: null, sync: "off", lastSyncedAt: null, error: null, recovery: false };
const listeners = new Set<() => void>();
const set = (patch: Partial<AccountState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

const SERVER_STATE: AccountState = { ready: false, user: null, sync: "off", lastSyncedAt: null, error: null, recovery: false };

export function useAccount() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => state,
    () => SERVER_STATE,
  );
}

/** 자주 보는 오류를 사람이 읽을 수 있게 바꾼다 */
function explain(message: string) {
  if (/Invalid login credentials/i.test(message)) return "이메일 또는 비밀번호가 맞지 않아요.";
  if (/already registered|already been registered/i.test(message)) return "이미 가입된 이메일이에요. 로그인해주세요.";
  if (/Email not confirmed/i.test(message)) return "가입 확인 메일의 링크를 먼저 눌러주세요.";
  if (/Password should be at least/i.test(message)) return "비밀번호는 8자 이상으로 정해주세요.";
  if (/weak|pwned|leaked/i.test(message)) return "너무 쉬운 비밀번호예요. 다른 비밀번호를 써주세요.";
  if (/rate limit|too many/i.test(message)) return "요청이 너무 많아요. 잠시 후 다시 시도해주세요.";
  if (/invalid.*email|email.*invalid/i.test(message)) return "사용할 수 없는 이메일 주소예요.";
  if (/same.*password|different from the old/i.test(message)) return "기존과 다른 비밀번호를 입력해주세요.";
  if (/schema must be one of|Invalid schema/i.test(message))
    return "Supabase 대시보드 > Project Settings > Data API의 Exposed schemas에 financial_quiz를 추가해주세요.";
  if (/relation .* does not exist|Could not find the table/i.test(message))
    return "financial_quiz.user_progress 테이블이 없어요. supabase/migrations의 SQL을 먼저 실행해주세요.";
  if (/permission denied/i.test(message)) return "테이블 권한이 없어요. 마이그레이션 SQL의 grant 구문이 실행됐는지 확인해주세요.";
  return message;
}

let unsubStores: (() => void) | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pulling = false;

async function push(userId: string) {
  const sb = getSupabase();
  if (!sb) return;
  set({ sync: "syncing" });
  const { error } = await sb
    .from(TABLE)
    .upsert({ user_id: userId, progress: progressStore.get(), game: gameStore.get() }, { onConflict: "user_id" });
  if (error) set({ sync: "error", error: explain(error.message) });
  else set({ sync: "synced", lastSyncedAt: Date.now(), error: null });
}

/** 로그인 직후: 서버 진도를 받아 이 기기 진도와 합치고, 합친 결과를 다시 올린다 */
async function pullAndMerge(userId: string) {
  const sb = getSupabase();
  if (!sb || pulling) return;
  pulling = true;
  set({ sync: "syncing", error: null });
  try {
    const { data, error } = await sb.from(TABLE).select("progress, game").eq("user_id", userId).maybeSingle();
    if (error) {
      set({ sync: "error", error: explain(error.message) });
      return;
    }
    if (data) {
      progressStore.set(mergeProgress(progressStore.get(), data.progress));
      gameStore.set(mergeGame(gameStore.get(), data.game));
    }
    await push(userId);
  } finally {
    pulling = false;
  }
}

function watchStores(userId: string) {
  unsubStores?.();
  const schedule = () => {
    if (pulling) return; // 병합 중 생긴 변경은 병합 후 push에 포함된다
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => void push(userId), PUSH_DELAY_MS);
  };
  const a = progressStore.subscribe(schedule);
  const b = gameStore.subscribe(schedule);
  unsubStores = () => {
    a();
    b();
    if (pushTimer) clearTimeout(pushTimer);
  };
}

function applySession(session: Session | null) {
  const u = session?.user ?? null;
  const prev = state.user?.id;
  set({
    ready: true,
    user: u ? { id: u.id, email: u.email ?? null, provider: (u.app_metadata?.provider as string) ?? null } : null,
  });
  if (u && u.id !== prev) {
    void pullAndMerge(u.id).then(() => watchStores(u.id));
  }
  if (!u) {
    unsubStores?.();
    unsubStores = null;
    set({ sync: "off", lastSyncedAt: null });
  }
}

let started = false;

/** 앱 시작 시 한 번: 세션 복원 + 로그인 상태 변화 감시 */
export function startAccount() {
  if (started) return;
  started = true;
  const sb = getSupabase();
  if (!sb) {
    set({ ready: true });
    return;
  }
  void sb.auth.getSession().then(({ data }) => applySession(data.session));
  sb.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") set({ recovery: true });
    // 콜백 안에서 바로 Supabase를 다시 부르면 교착될 수 있어 다음 틱으로 미룬다
    setTimeout(() => applySession(session), 0);
  });
}

const redirectTo = () => `${window.location.origin}/account`;

export async function signInWithProvider(provider: Provider) {
  const sb = getSupabase();
  if (!sb) return "Supabase 설정이 없어요.";
  const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } });
  return error ? explain(error.message) : null;
}

/** 회원가입. 이메일 확인이 켜져 있으면 세션 없이 끝나고 확인 메일이 간다 */
export async function signUpWithPassword(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) return { error: "Supabase 설정이 없어요.", needsConfirm: false };
  const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
  if (error) return { error: explain(error.message), needsConfirm: false };
  // 이미 가입된 이메일이면 Supabase는 오류 대신 identities가 빈 사용자를 돌려준다
  if (data.user && data.user.identities?.length === 0)
    return { error: "이미 가입된 이메일이에요. 로그인해주세요.", needsConfirm: false };
  return { error: null, needsConfirm: !data.session };
}

export async function signInWithPassword(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) return "Supabase 설정이 없어요.";
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return error ? explain(error.message) : null;
}

export async function sendPasswordReset(email: string) {
  const sb = getSupabase();
  if (!sb) return "Supabase 설정이 없어요.";
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: redirectTo() });
  return error ? explain(error.message) : null;
}

export async function updatePassword(password: string) {
  const sb = getSupabase();
  if (!sb) return "Supabase 설정이 없어요.";
  const { error } = await sb.auth.updateUser({ password });
  if (!error) set({ recovery: false });
  return error ? explain(error.message) : null;
}

export async function signOut() {
  await getSupabase()?.auth.signOut();
}

export async function syncNow() {
  if (state.user) await pullAndMerge(state.user.id);
}
