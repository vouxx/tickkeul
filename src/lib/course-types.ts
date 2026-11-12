/** 개념 설명 카드 — 정답 없이 '계속'으로 넘어간다 */
export interface CardQ {
  kind: "card";
  /** lucide 아이콘 이름 (components/icons.tsx의 ICONS) */
  icon: string;
  title: string;
  body: string;
  /** 설명 그림 */
  figure?: "candle" | "dilution";
}

/** 객관식. variant "predict"는 상황을 주고 시장 반응을 고르는 문제 */
export interface ChoiceQ {
  kind: "choice";
  variant?: "predict";
  /** predict 문제의 상황 설명 */
  scenario?: string;
  prompt: string;
  options: string[];
  answer: number;
  explain: string;
}

/** 짝 맞추기 — 왼쪽 항목과 오른쪽 결과를 연결 */
export interface MatchQ {
  kind: "match";
  prompt: string;
  pairs: [string, string][];
  explain?: string;
}

/** 모의투자 공시 문제를 레슨 안에서 풀기 */
export interface DisclosureQ {
  kind: "disclosure";
  problemId: string;
}

/** 생성한 차트를 보고 답하는 문제 */
export interface ChartQ {
  kind: "chart";
  /** 주가가 지나갈 기준점(상대값). 같은 간격으로 놓고 사이를 노이즈로 채운다 */
  shape: number[];
  seed: number;
  /** 거래일 수 (기본 80) */
  days?: number;
  /** 변동성 (기본 0.012) */
  vol?: number;
  overlays?: ("ma5" | "ma20" | "ma60")[];
  /** 수평선 (지지·저항). 값은 shape와 같은 단위 */
  lines?: { value: number; label: string }[];
  /** 거래량 막대: shape처럼 기준점을 주면 함께 그린다 */
  volume?: number[];
  prompt: string;
  options: string[];
  answer: number;
  explain: string;
}

/** 공시 원문 표에서 정답 줄을 찾아 탭하기 (탭한 줄에 형광펜) */
export interface FindQ {
  kind: "find";
  /** 이 공시 문제의 항목을 표로 보여준다 */
  problemId: string;
  prompt: string;
  /** 정답 줄의 항목 이름 (facts[].label) */
  answerLabel: string;
  explain: string;
}

export type Question = CardQ | ChoiceQ | MatchQ | DisclosureQ | ChartQ | FindQ;

export interface Lesson {
  id: string;
  title: string;
  questions: Question[];
}

export interface Unit {
  id: string;
  title: string;
  desc: string;
  /** lucide 아이콘 이름 */
  icon: string;
  /** 유닛 색 (path 노드·헤더) */
  color: string;
  lessons: Lesson[];
}

/** 복습용으로 문제를 가리키는 키 */
export const qKey = (lessonId: string, index: number) => `${lessonId}#${index}`;
