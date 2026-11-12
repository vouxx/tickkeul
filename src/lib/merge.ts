import { START_CASH } from "./game";
import type { Progress } from "./progress";
import type { Answer, GameState } from "./types";

const union = (a: string[] = [], b: string[] = []) => [...new Set([...a, ...b])];

/**
 * 두 기기(또는 로컬·서버)의 진도를 합친다. 어느 쪽에서 한 공부도 잃지 않는 방향으로:
 * 완료 레슨·오답은 합집합, XP는 큰 값, 용어 숙련도는 키별 큰 값,
 * 스트릭·오늘 XP는 더 최근에 학습한 쪽을 따른다.
 */
export function mergeProgress(local: Progress, remote: Partial<Progress> | null | undefined): Progress {
  if (!remote || !Object.keys(remote).length) return local;
  const r = { ...local, ...remote } as Progress;
  const words: Record<string, number> = { ...(remote.words ?? {}) };
  for (const [k, v] of Object.entries(local.words ?? {})) words[k] = Math.max(words[k] ?? 0, v);
  const recent = (local.lastDay ?? "") >= (r.lastDay ?? "") ? local : r;
  const older = recent === local ? r : local;
  const sameDay = local.lastDay && local.lastDay === r.lastDay;
  // 한 기기는 어제, 다른 기기는 오늘 공부했다면 스트릭은 이어진 것으로 본다
  const consecutive =
    !!recent.lastDay && !!older.lastDay && Date.parse(recent.lastDay) - Date.parse(older.lastDay) === 86_400_000;
  return {
    ...local,
    xp: Math.max(local.xp ?? 0, r.xp ?? 0),
    completed: union(r.completed, local.completed),
    mistakes: union(r.mistakes, local.mistakes),
    words,
    lastDay: recent.lastDay,
    streak: sameDay
      ? Math.max(local.streak, r.streak)
      : consecutive
        ? Math.max(recent.streak, older.streak + 1)
        : recent.streak,
    todayXp: sameDay ? Math.max(local.todayXp, r.todayXp) : recent.todayXp,
    xpByDay: (() => {
      const out: Record<string, number> = { ...(remote.xpByDay ?? {}) };
      for (const [d, v] of Object.entries(local.xpByDay ?? {})) out[d] = Math.max(out[d] ?? 0, v);
      return out;
    })(),
    since: [local.since, r.since].filter(Boolean).sort()[0] ?? null,
    // 레벨은 이 기기에서 정한 값이 있으면 그것을, 없으면 서버 값을
    level: local.level ?? r.level ?? null,
    // 하트는 현재 기기 상태를 유지
    hearts: local.hearts,
    heartsAt: local.heartsAt,
  };
}

/** 모의투자: 답안을 시각·문제 기준으로 합치고 보유 자금은 손익 합계로 다시 계산 */
export function mergeGame(local: GameState, remote: Partial<GameState> | null | undefined): GameState {
  if (!remote?.answers?.length) return local;
  const byKey = new Map<string, Answer>();
  for (const a of [...remote.answers, ...local.answers]) byKey.set(`${a.at}:${a.problemId}`, a);
  const answers = [...byKey.values()].sort((a, b) => a.at - b.at);
  return { answers, cash: START_CASH + answers.reduce((s, a) => s + a.pnl, 0) };
}
