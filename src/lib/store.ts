"use client";

import { useCallback, useSyncExternalStore } from "react";
import { EMPTY } from "./game";
import { readKey, STORAGE_KEYS } from "./storage-keys";
import type { Answer, GameState } from "./types";

const KEY = STORAGE_KEYS.game;

let cached: GameState | null = null;
const listeners = new Set<() => void>();

function read(): GameState {
  if (cached) return cached;
  try {
    const raw = readKey(KEY);
    cached = raw ? (JSON.parse(raw) as GameState) : EMPTY;
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function write(next: GameState) {
  cached = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장 실패해도 이번 세션 동안은 메모리 상태로 동작
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
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useGame() {
  const state = useSyncExternalStore(subscribe, read, () => EMPTY);

  const submit = useCallback((input: Omit<Answer, "at">) => {
    const cur = read();
    const answer: Answer = { ...input, at: Date.now() };
    write({ cash: cur.cash + answer.pnl, answers: [...cur.answers, answer] });
  }, []);

  const reset = useCallback(() => write(EMPTY), []);

  return { state, submit, reset };
}


/** 서버 동기화용: 컴포넌트 밖에서 모의투자 기록을 읽고, 교체하고, 변경을 구독한다 */
export const gameStore = {
  get: (): GameState => read(),
  set: (g: GameState) => write(g),
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
