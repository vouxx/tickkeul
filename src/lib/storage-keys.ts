/**
 * 브라우저 저장 키. 앱 이름을 바꾸면서 접두사를 disclosure-quest → tickkeul 로 바꿨다.
 * 예전 키에 진도가 있으면 처음 읽을 때 새 키로 옮기고 예전 키는 지운다.
 */
export const STORAGE_KEYS = {
  progress: "tickkeul:progress:v1",
  game: "tickkeul:game:v1",
  wordsLevel: "tickkeul:words-level",
} as const;

const LEGACY: Record<string, string> = {
  [STORAGE_KEYS.progress]: "disclosure-quest:progress:v1",
  [STORAGE_KEYS.game]: "disclosure-quest:v1",
  [STORAGE_KEYS.wordsLevel]: "disclosure-quest:words-level",
};

/** localStorage.getItem 대신 사용: 새 키가 비어 있으면 예전 키 값을 옮겨 온다 */
export function readKey(key: string): string | null {
  const value = localStorage.getItem(key);
  if (value !== null) return value;
  const old = LEGACY[key];
  const legacy = old ? localStorage.getItem(old) : null;
  if (legacy !== null && old) {
    try {
      localStorage.setItem(key, legacy);
      localStorage.removeItem(old);
    } catch {
      // 옮기지 못해도 이번에는 예전 값을 그대로 쓴다
    }
  }
  return legacy;
}
