"use client";

import { useEffect, useSyncExternalStore } from "react";

/** 레슨·퀴즈를 푸는 동안 위·아래 메뉴를 숨기기 위한 전역 표시 */
let count = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function useFocusMode() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => count > 0,
    () => false,
  );
}

/** 이 컴포넌트가 화면에 있는 동안 집중 모드 */
export function useFocusLock() {
  useEffect(() => {
    count++;
    emit();
    return () => {
      count--;
      emit();
    };
  }, []);
}
