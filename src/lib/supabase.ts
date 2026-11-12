"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** 이 앱의 테이블은 모두 financial_quiz 스키마에 있다 */
export const SCHEMA = "financial_quiz";

/**
 * 같은 Supabase 프로젝트를 다른 서비스와 같이 쓰기 때문에, 티끌에서 가입한 계정에는
 * 가입 정보(user_metadata.app)에 이 값을 남긴다. DB 트리거가 이걸 보고 티끌 회원으로 등록한다.
 */
export const APP_ID = "tickkeul";

export const supabaseConfigured = Boolean(url && key);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: SupabaseClient<any, any, any> | null = null;

/** 환경변수가 없으면 null — 로그인 없이도 앱은 그대로 동작한다 */
export function getSupabase() {
  if (!url || !key) return null;
  client ??= createClient(url, key, {
    db: { schema: SCHEMA },
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
  });
  return client;
}

export type Provider = "kakao" | "google" | "github";

/** 대시보드에서 켜 둔 로그인 수단만 버튼으로 보여주기 위해 Auth 설정을 읽는다 */
export async function fetchAuthProviders(): Promise<Record<"email" | Provider, boolean> | null> {
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
    if (!res.ok) return null;
    const body = (await res.json()) as { external?: Record<string, boolean> };
    const ext = body.external ?? {};
    return { email: !!ext.email, kakao: !!ext.kakao, google: !!ext.google, github: !!ext.github };
  } catch {
    return null;
  }
}
