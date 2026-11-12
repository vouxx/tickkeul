import type { Term } from "../glossary";
import analysis from "./analysis.json";
import basicsMarket from "./basics-market.json";
import chartDisclosure from "./chart-disclosure.json";
import globalDeriv from "./global-deriv.json";
import macroBond from "./macro-bond.json";
import products from "./products.json";
import strategy from "./strategy.json";
import taxLife from "./tax-life.json";

/**
 * 분야별로 나눠 작성한 용어 JSON을 모은다.
 * 새 파일을 추가하면 여기에 import하고, `node scripts/check-content.mjs`로 검사한다.
 */
export const generatedTerms: Term[] = [
  basicsMarket,
  products,
  taxLife,
  analysis,
  chartDisclosure,
  macroBond,
  globalDeriv,
  strategy,
].flat() as unknown as Term[];
