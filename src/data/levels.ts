export type Level = 1 | 2 | 3 | 4;

export interface LevelInfo {
  id: Level;
  /** 레벨 이름 (티어) */
  name: string;
  /** 이 레벨에서 할 수 있게 되는 것 */
  desc: string;
  /** 스스로 고를 때 보여주는 '이런 분께' 설명 */
  who: string;
  color: string;
}

export const LEVELS: LevelInfo[] = [
  {
    id: 1,
    name: "브론즈",
    desc: "주식·계좌·금리처럼 꼭 필요한 기본기",
    who: "주식 계좌를 처음 만들었거나, 아직 사본 적이 없어요",
    color: "#b4703c",
  },
  {
    id: 2,
    name: "실버",
    desc: "뉴스와 차트를 스스로 읽는 단계",
    who: "주식을 사본 적은 있는데, 뉴스나 차트는 아직 어려워요",
    color: "#7d8ea3",
  },
  {
    id: 3,
    name: "골드",
    desc: "경제 흐름과 기업 가치를 분석하는 단계",
    who: "PER·금리·환율이 주가에 미치는 영향을 대충은 알아요",
    color: "#d39b00",
  },
  {
    id: 4,
    name: "다이아",
    desc: "애널리스트·전문가가 쓰는 용어까지",
    who: "재무제표·채권·파생상품까지 깊게 공부하고 싶어요",
    color: "#14a6c4",
  },
];

export const levelInfo = (l: Level) => LEVELS[l - 1];
