import type { Action, GameState, Problem } from "./types";

export const START_CASH = 10_000_000;
/** 이 범위 안의 움직임이면 '관망'이 정답 */
export const HOLD_BAND = 0.03;

export const EMPTY: GameState = { cash: START_CASH, answers: [] };

export function returns(p: Problem) {
  const base = p.before[p.before.length - 1];
  const r = (d: number) => p.after[d - 1] / base - 1;
  return { d1: r(1), d5: r(5), d20: r(20) };
}

export function correctAction(return1m: number): Action {
  if (return1m > HOLD_BAND) return "buy";
  if (return1m < -HOLD_BAND) return "sell";
  return "hold";
}

/** 매수는 상승분, 매도(하락 베팅)는 하락분만큼 수익. 관망은 0. */
export function settle(p: Problem, action: Action, weight: number, cash: number) {
  const r = returns(p).d20;
  const stake = Math.round(cash * weight);
  const sign = action === "buy" ? 1 : action === "sell" ? -1 : 0;
  return { return1m: r, pnl: Math.round(stake * r * sign), correct: action === correctAction(r) };
}

export const won = (n: number) =>
  `${n < 0 ? "-" : ""}${Math.abs(n).toLocaleString("ko-KR")}원`;

export const pct = (r: number, signed = true) =>
  `${signed && r > 0 ? "+" : ""}${(r * 100).toFixed(1)}%`;
