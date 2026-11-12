"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** 이 앱의 테이블은 모두 financial_quiz 스키마에 있다 */
export const SCHEMA = "financial_quiz";

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
