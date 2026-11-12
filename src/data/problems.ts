import { makeAfter, makeBefore } from "@/lib/series";
import type { DisclosureType, Problem } from "@/lib/types";
import dartProblems from "./dart-problems.json";

/**
 * 학습용 예시 문제. 실제 공시가 아니라 공시 유형별 전형적인 사례를 바탕으로 만든 가상 데이터예요.
 * DART 연동 후에는 같은 형태로 실제 공시 데이터를 채워 넣으면 됩니다.
 */
interface Seed {
  id: string;
  type: DisclosureType;
  sector: string;
  marketCap: string;
  title: string;
  facts: { label: string; value: string }[];
  price: number;
  trend: number;
  after: { d1: number; d5: number; d20: number };
  explanation: string;
  lesson: string;
}

const seeds: Seed[] = [
  {
    id: "ro-01",
    type: "rights_offering",
    sector: "2차전지 소재",
    marketCap: "약 3,200억 원",
    title: "주요사항보고서(유상증자결정)",
    facts: [
      { label: "증자 방식", value: "주주배정 후 실권주 일반공모" },
      { label: "신주 수", value: "기존 발행주식의 32%" },
      { label: "예정 발행가 할인율", value: "25%" },
      { label: "자금 용도", value: "운영자금 70%, 채무상환 30%" },
    ],
    price: 18450,
    trend: 0.08,
    after: { d1: -0.142, d5: -0.17, d20: -0.185 },
    explanation:
      "기존 주식의 32%에 달하는 신주가 25% 싸게 풀린다는 뜻이라 주당 가치가 크게 희석돼요. 자금 용도도 '운영자금·채무상환'이라 성장 투자보다는 '돈이 부족하다'는 신호로 읽혔어요. 공시 다음 날 급락하고, 발행가가 확정될 때까지 약세가 이어지는 전형적인 패턴이에요.",
    lesson: "유증은 '규모(희석률)'와 '자금 용도'를 먼저 본다. 운영자금·채무상환 목적의 대규모 공모는 악재일 때가 많다.",
  },
  {
    id: "ro-02",
    type: "rights_offering",
    sector: "AI 반도체 설계",
    marketCap: "약 1,800억 원",
    title: "주요사항보고서(유상증자결정)",
    facts: [
      { label: "증자 방식", value: "제3자배정" },
      { label: "배정 대상", value: "국내 대기업 계열 전략적 투자자" },
      { label: "발행가", value: "기준주가 대비 5% 할증" },
      { label: "보호예수", value: "1년" },
      { label: "자금 용도", value: "차세대 칩 개발 시설자금" },
    ],
    price: 24300,
    trend: -0.06,
    after: { d1: 0.15, d5: 0.21, d20: 0.22 },
    explanation:
      "같은 유상증자라도 '누가, 얼마에' 사느냐가 핵심이에요. 대기업이 시장가보다 비싸게(할증) 사고 1년 동안 팔지 않겠다고 약속했다는 건, 회사 가치를 높게 본다는 강한 신호예요. 사업 협력 기대감까지 겹치면서 상승했어요.",
    lesson: "제3자배정 유증은 '배정 대상의 신뢰도·할증 여부·보호예수'가 핵심. 전략적 투자자가 할증으로 들어오면 호재로 읽힌다.",
  },
  {
    id: "ro-03",
    type: "rights_offering",
    sector: "중견 건설",
    marketCap: "약 900억 원",
    title: "주요사항보고서(유상증자결정)",
    facts: [
      { label: "증자 방식", value: "주주배정" },
      { label: "신주 수", value: "기존 발행주식의 45%" },
      { label: "예정 발행가 할인율", value: "20%" },
      { label: "자금 용도", value: "채무상환 100%" },
      { label: "참고", value: "직전 분기 부채비율 380%" },
    ],
    price: 3420,
    trend: -0.15,
    after: { d1: -0.09, d5: -0.11, d20: -0.125 },
    explanation:
      "부채비율이 높은 회사가 빚을 갚으려고 대규모 증자를 하는 경우예요. 당장 부도 위험은 줄지만, 주주 입장에서는 내 지분이 크게 희석되고 회사가 버는 돈이 늘어나는 것도 아니에요. 이미 주가가 빠지고 있었는데도 추가로 하락했어요.",
    lesson: "'이미 많이 빠졌으니 바닥'이라는 생각은 위험하다. 재무 위기형 증자는 하락 추세를 더 키울 수 있다.",
  },
  {
    id: "bb-01",
    type: "buyback",
    sector: "금융지주",
    marketCap: "약 8조 원",
    title: "자기주식 취득 결정",
    facts: [
      { label: "취득 규모", value: "시가총액의 약 5%" },
      { label: "취득 방법", value: "장내 직접 취득" },
      { label: "취득 후 처리", value: "전량 소각" },
      { label: "취득 기간", value: "3개월" },
    ],
    price: 61200,
    trend: 0.03,
    after: { d1: 0.045, d5: 0.07, d20: 0.092 },
    explanation:
      "자사주를 사서 '소각'하면 발행주식 수 자체가 줄어 남은 주주의 주당 가치가 올라가요. 시총의 5%면 규모도 큰 편이고, 3개월 동안 회사가 직접 시장에서 사들이니 수급에도 도움이 돼요. 꾸준히 오른 대표적인 주주환원 사례예요.",
    lesson: "자사주는 '소각' 여부가 핵심. 매입 후 소각은 확실한 주주환원이고, 규모가 클수록 효과가 크다.",
  },
  {
    id: "bb-02",
    type: "buyback",
    sector: "게임",
    marketCap: "약 1조 2,000억 원",
    title: "자기주식취득 신탁계약 체결 결정",
    facts: [
      { label: "계약 금액", value: "시가총액의 약 0.5%" },
      { label: "취득 방법", value: "증권사 신탁계약" },
      { label: "취득 후 처리", value: "미정 (소각 계획 없음)" },
      { label: "참고", value: "공시 전 1개월간 신작 기대감으로 +35%" },
    ],
    price: 48900,
    trend: 0.38,
    after: { d1: 0.012, d5: -0.005, d20: 0.008 },
    explanation:
      "'자사주 매입'이라는 제목만 보면 호재 같지만, 규모가 시총의 0.5%로 작고 소각 계획도 없어요. 이미 신작 기대감으로 많이 오른 상태라 이 공시가 주가를 더 끌어올릴 힘은 약했어요. 결과적으로 한 달간 제자리걸음이었어요.",
    lesson: "제목에 속지 말고 '규모'와 '처리 방법'을 본다. 작은 신탁계약은 주가 영향이 미미하다.",
  },
  {
    id: "bb-03",
    type: "buyback",
    sector: "화학",
    marketCap: "약 2조 5,000억 원",
    title: "자기주식 처분 결정",
    facts: [
      { label: "처분 규모", value: "발행주식의 7%" },
      { label: "처분 목적", value: "교환사채(EB) 발행 대상" },
      { label: "교환가액", value: "현재가 대비 10% 할증" },
    ],
    price: 132500,
    trend: 0.05,
    after: { d1: -0.055, d5: -0.07, d20: -0.081 },
    explanation:
      "회사가 갖고 있던 자사주를 교환사채로 내보내는 건, 나중에 그 물량이 시장에 다시 풀릴 수 있다는 뜻이에요(잠재적 매물, '오버행'). 소각하면 주주에게 돌아갈 가치를 자금 조달에 쓴 셈이라 시장은 부정적으로 반응했어요.",
    lesson: "자사주 '매입'은 호재일 수 있지만 '처분'은 반대. 특히 교환사채 발행은 오버행 우려로 악재가 되기 쉽다.",
  },
  {
    id: "ea-01",
    type: "earnings",
    sector: "전력 설비",
    marketCap: "약 4조 원",
    title: "연결재무제표기준 영업(잠정)실적(공정공시)",
    facts: [
      { label: "매출액", value: "전년 동기 대비 +32%" },
      { label: "영업이익", value: "전년 동기 대비 +81%" },
      { label: "시장 예상치(컨센서스) 대비", value: "영업이익 +24% 상회" },
      { label: "수주잔고", value: "역대 최대" },
    ],
    price: 87600,
    trend: 0.04,
    after: { d1: 0.08, d5: 0.115, d20: 0.142 },
    explanation:
      "실적이 좋은 것 자체보다 '시장이 예상한 것보다 훨씬 좋았다'는 점이 중요해요. 주가에는 이미 예상치가 반영돼 있어서, 그 예상을 크게 넘어서야(어닝 서프라이즈) 오를 여지가 생겨요. 수주잔고까지 최대라 다음 분기 기대감도 함께 올라갔어요.",
    lesson: "실적은 '전년 대비'보다 '컨센서스 대비'가 주가를 움직인다.",
  },
  {
    id: "ea-02",
    type: "earnings",
    sector: "화장품",
    marketCap: "약 6,500억 원",
    title: "연결재무제표기준 영업(잠정)실적(공정공시)",
    facts: [
      { label: "매출액", value: "전년 동기 대비 +18%" },
      { label: "영업이익", value: "전년 동기 대비 +41%" },
      { label: "시장 예상치(컨센서스) 대비", value: "영업이익 -16% 하회" },
      { label: "참고", value: "공시 전 2개월간 수출 기대감으로 +45%" },
    ],
    price: 156000,
    trend: 0.45,
    after: { d1: -0.072, d5: -0.09, d20: -0.104 },
    explanation:
      "영업이익이 41%나 늘었는데 왜 떨어졌을까요? 시장은 이미 더 좋은 숫자를 기대하고 주가를 45%나 올려놨기 때문이에요. 기대에 못 미치면(어닝 쇼크) '좋은 실적'이어도 차익실현 매물이 쏟아져요.",
    lesson: "'좋은 실적 = 상승'이 아니다. 많이 오른 종목일수록 기대치가 높아 작은 실망에도 크게 빠진다.",
  },
  {
    id: "ea-03",
    type: "earnings",
    sector: "바이오 CDMO",
    marketCap: "약 1조 원",
    title: "연결재무제표기준 영업(잠정)실적(공정공시)",
    facts: [
      { label: "매출액", value: "전년 동기 대비 +6%" },
      { label: "영업이익", value: "적자 지속 (적자폭 12% 축소)" },
      { label: "시장 예상치(컨센서스) 대비", value: "부합" },
    ],
    price: 37250,
    trend: -0.02,
    after: { d1: 0.006, d5: 0.015, d20: 0.018 },
    explanation:
      "적자가 조금 줄었고 시장 예상과 거의 같았어요. 새로운 정보가 거의 없는 공시라 주가도 크게 움직이지 않았어요. 이런 문제에서는 '관망'이 정답이에요.",
    lesson: "예상과 같은 공시는 새로운 정보가 없다. 모든 공시에 베팅할 필요는 없다.",
  },
];

const samples: Problem[] = seeds.map((s, i) => {
  const before = makeBefore(1000 + i * 37, s.price, s.trend);
  const after = makeAfter(1000 + i * 37, s.price, s.after);
  return {
    id: s.id,
    type: s.type,
    sector: s.sector,
    marketCap: s.marketCap,
    title: s.title,
    facts: s.facts,
    before,
    after,
    explanation: s.explanation,
    lesson: s.lesson,
  };
});

/** 예시 문제(튜토리얼) → 실제 공시 문제 순서. 실제 문제는 `npm run problems`로 생성 */
export const problems: Problem[] = [...samples, ...(dartProblems as unknown as Problem[])];

export const getProblem = (id: string) => problems.find((p) => p.id === id);
