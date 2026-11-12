import type { Level } from "../levels";
import analysis from "./analysis.json";
import basicsMarket from "./basics-market.json";
import chartDisclosure from "./chart-disclosure.json";
import globalDeriv from "./global-deriv.json";
import macroBond from "./macro-bond.json";
import products from "./products.json";
import strategy from "./strategy.json";
import taxLife from "./tax-life.json";

export interface BankQuestion {
  id: string;
  level: Level;
  category: string;
  variant?: "predict";
  scenario?: string;
  prompt: string;
  options: string[];
  answer: number;
  explain: string;
}

/** 레벨별 실전 문제 은행 */
export const questionBank: BankQuestion[] = [
  basicsMarket,
  products,
  taxLife,
  analysis,
  chartDisclosure,
  macroBond,
  globalDeriv,
  strategy,
].flat() as unknown as BankQuestion[];
