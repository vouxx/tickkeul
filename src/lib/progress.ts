"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Level } from "@/data/levels";
import { readKey, STORAGE_KEYS } from "./storage-keys";

export const MAX_HEARTS = 5;
/** 하트 1개가 다시 차는 시간 */
export const HEART_REFILL_MS = 30 * 60 * 1000;
export const DAILY_GOAL_XP = 30;
export const XP_PER_LESSON = 10;

export interface Progress {
  xp: number;
  hearts: number;
  /** 하트가 마지막으로 줄어든(또는 리필 계산된) 시각 */
  heartsAt: number;
  streak: number;
  /** 마지막으로 학습한 날 (YYYY-MM-DD, 로컬 기준) */
  lastDay: string | null;
  todayXp: number;
  completed: string[];
  /** 틀린 문제 키 (lessonId#index) */
  mistakes: string[];
  /** 용어별 숙련도: 맞히면 +1, 틀리면 0으로 */
  words: Record<string, number>;
  /** 스스로 고르거나 레벨 테스트로 정한 내 레벨 (아직 안 정했으면 null) */
  level: Level | null;
  /** 날짜별 획득 XP (최근 30일) — 주간 그래프·연속 학습 표시용 */
  xpByDay: Record<string, number>;
  /** 처음 학습한 날 */
  since: string | null;
}

/** 이 횟수 이상 연속으로 맞히면 '익힌 용어' (틀리면 0으로 초기화) */
export const WORD_MASTERED = 1;

const KEY = STORAGE_KEYS.progress;
const EMPTY: Progress = {
  xp: 0,
  hearts: MAX_HEARTS,
  heartsAt: 0,
  streak: 0,
  lastDay: null,
  todayXp: 0,
  completed: [],
  mistakes: [],
  words: {},
  level: null,
  xpByDay: {},
  since: null,
};

export const localDay = (t = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const dayDiff = (a: string, b: string) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

/** 시간 경과로 차는 하트, 날짜가 바뀐 경우의 스트릭·오늘 XP를 반영 */
function normalize(p: Progress, now = Date.now()): Progress {
  let { hearts, heartsAt, streak, todayXp } = p;
  if (hearts < MAX_HEARTS && heartsAt) {
    const gained = Math.floor((now - heartsAt) / HEART_REFILL_MS);
    if (gained > 0) {
      hearts = Math.min(MAX_HEARTS, hearts + gained);
      heartsAt = hearts === MAX_HEARTS ? 0 : heartsAt + gained * HEART_REFILL_MS;
    }
  }
  const today = localDay(now);
  if (p.lastDay && p.lastDay !== today) {
    todayXp = 0;
    if (dayDiff(p.lastDay, today) > 1) streak = 0; // 하루 이상 빠지면 끊김
  }
  return { ...p, hearts, heartsAt, streak, todayXp };
}

let cached: Progress | null = null;
const listeners = new Set<() => void>();

function read(): Progress {
  if (cached) return cached;
  try {
    const raw = readKey(KEY);
    cached = normalize(raw ? { ...EMPTY, ...(JSON.parse(raw) as Progress) } : EMPTY);
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function write(next: Progress) {
  cached = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장 실패 시 메모리 상태로만 동작
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cached = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  // 하트 리필·날짜 변경을 반영하기 위해 1분마다 다시 계산
  const timer = window.setInterval(() => {
    const cur = read();
    const next = normalize(cur);
    if (next.hearts !== cur.hearts || next.todayXp !== cur.todayXp || next.streak !== cur.streak) write(next);
  }, 60_000);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
    window.clearInterval(timer);
  };
}

export function useProgress() {
  const progress = useSyncExternalStore(subscribe, read, () => EMPTY);

  const loseHeart = useCallback(() => {
    const cur = normalize(read());
    if (cur.hearts <= 0) return;
    write({ ...cur, hearts: cur.hearts - 1, heartsAt: cur.heartsAt || Date.now() });
  }, []);

  const addMistakes = useCallback((keys: string[]) => {
    const cur = read();
    write({ ...cur, mistakes: [...new Set([...cur.mistakes, ...keys])] });
  }, []);

  /** 레슨 완료: XP 지급, 스트릭 갱신, 맞힌 복습 문제는 오답 목록에서 제거 */
  const finishLesson = useCallback(
    (opts: { lessonId?: string; xp: number; cleared?: string[]; refillHearts?: boolean }) => {
      const cur = normalize(read());
      const today = localDay();
      const streak =
        cur.lastDay === today ? cur.streak : cur.lastDay && dayDiff(cur.lastDay, today) === 1 ? cur.streak + 1 : 1;
      const cleared = new Set(opts.cleared ?? []);
      const xpByDay = { ...cur.xpByDay, [today]: (cur.xpByDay?.[today] ?? 0) + opts.xp };
      // 30일보다 오래된 기록은 버린다
      for (const d of Object.keys(xpByDay)) if (dayDiff(d, today) > 30) delete xpByDay[d];
      write({
        ...cur,
        xpByDay,
        since: cur.since ?? today,
        xp: cur.xp + opts.xp,
        todayXp: cur.todayXp + opts.xp,
        streak,
        lastDay: today,
        completed:
          opts.lessonId && !cur.completed.includes(opts.lessonId)
            ? [...cur.completed, opts.lessonId]
            : cur.completed,
        mistakes: cur.mistakes.filter((k) => !cleared.has(k)),
        ...(opts.refillHearts ? { hearts: MAX_HEARTS, heartsAt: 0 } : {}),
      });
    },
    [],
  );

  const recordWord = useCallback((id: string, correct: boolean) => {
    const cur = read();
    write({ ...cur, words: { ...cur.words, [id]: correct ? (cur.words[id] ?? 0) + 1 : 0 } });
  }, []);

  const setLevel = useCallback((level: Level) => {
    write({ ...read(), level });
  }, []);

  return { progress, loseHeart, addMistakes, finishLesson, recordWord, setLevel };
}

/** 서버 동기화용: 컴포넌트 밖에서 진도를 읽고, 교체하고, 변경을 구독한다 */
export const progressStore = {
  get: (): Progress => read(),
  set: (p: Progress) => write(normalize({ ...EMPTY, ...p })),
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  empty: EMPTY,
};
