"use client";

import { allLessons, units } from "@/data/course";
import { useAccount } from "./account";
import { localDay } from "./progress";
import { supabaseConfigured } from "./supabase";
import type { Answer } from "./types";

/**
 * 비회원 맛보기 범위.
 * 1단원 레슨, 용어·실전 문제 레벨별 첫 세트, 모의투자 하루 몇 판까지는 가입 없이 쓸 수 있고
 * 나머지는 가입 안내로 보낸다. 화면에서만 막는 가입 유도용 잠금이다.
 */
export const FREE_UNIT_ID = units[0].id;
export const FREE_PLAYS_PER_DAY = 3;
export const FREE_SETS = 1;

export type GateReason = "unit" | "review" | "words" | "play";

/** 가입을 요구해야 하는 상태인지: 로그인 확인이 끝났고, 회원이 아니고, 가입을 받을 수 있을 때 */
export function useGate() {
  const acc = useAccount();
  const enabled = supabaseConfigured;
  return {
    /** 로그인 상태를 아직 모르는 동안은 잠금 여부도 판단하지 않는다 */
    ready: !enabled || acc.ready,
    guest: enabled && acc.ready && !acc.user,
  };
}

export function isFreeLesson(lessonId: string) {
  return allLessons.find((l) => l.id === lessonId)?.unit.id === FREE_UNIT_ID;
}

export function playsToday(answers: Answer[]) {
  const today = localDay();
  return answers.filter((a) => a.at > 0 && localDay(a.at) === today).length;
}

const NEXT_KEY = "tickkeul:after-signup";

/** 가입 화면으로 가기 전에 돌아올 곳을 기억해 둔다 */
export function rememberReturn(path: string) {
  try {
    sessionStorage.setItem(NEXT_KEY, path);
  } catch {
    // 못 기억해도 가입은 된다
  }
}

/** 가입·로그인 직후 한 번 꺼내 쓰고 지운다 */
export function takeReturn(): string | null {
  try {
    const v = sessionStorage.getItem(NEXT_KEY);
    sessionStorage.removeItem(NEXT_KEY);
    return v && v.startsWith("/") ? v : null;
  } catch {
    return null;
  }
}
