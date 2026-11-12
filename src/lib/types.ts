export type DisclosureType = "rights_offering" | "buyback" | "earnings";

export const DISCLOSURE_LABEL: Record<DisclosureType, string> = {
  rights_offering: "유상증자",
  buyback: "자사주",
  earnings: "잠정실적",
};

export type Action = "buy" | "sell" | "hold";

export const ACTION_LABEL: Record<Action, string> = {
  buy: "매수 (오른다)",
  sell: "매도 (내린다)",
  hold: "관망",
};

export interface Problem {
  id: string;
  type: DisclosureType;
  /** 가려진 회사 정보 (업종·규모만 공개) */
  sector: string;
  marketCap: string;
  title: string;
  /** 공시 핵심 항목 */
  facts: { label: string; value: string }[];
  /** 공시 전 60거래일 종가 */
  before: number[];
  /** 공시 후 20거래일 종가 */
  after: number[];
  /** 결과 공개 후 보여줄 해설 */
  explanation: string;
  /** 이 문제에서 배울 포인트 */
  lesson: string;
  /** 실제 공시로 만든 문제면 결과 공개 후 회사·원문을 보여준다 */
  source?: { corpName: string; date: string; rceptNo: string };
}

export interface Answer {
  problemId: string;
  type: DisclosureType;
  action: Action;
  /** 투자 비중 (0~1) */
  weight: number;
  reason: string;
  /** 1개월 수익률 */
  return1m: number;
  pnl: number;
  correct: boolean;
  at: number;
}

export interface GameState {
  cash: number;
  answers: Answer[];
}
