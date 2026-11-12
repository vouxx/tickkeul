/**
 * DART 실제 공시 + 공공데이터포털 주가로 문제 은행을 만든다.
 *
 *   npm run problems                      # 최근 1년(결과 확인 가능한 구간)
 *   npm run problems -- --from 20240101 --to 20241231 --per-type 20
 *
 * 필요한 환경변수(.env.local): DART_API_KEY, DATA_GO_KR_KEY
 * 결과: src/data/dart-problems.json
 */
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import type { DisclosureType, Problem } from "../src/lib/types";

const DART = "https://opendart.fss.or.kr/api";
const PRICE =
  "https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo";
const OUT = new URL("../src/data/dart-problems.json", import.meta.url);

const BEFORE_DAYS = 60;
const AFTER_DAYS = 20;

// ---------- 설정 ----------

const { values: args } = parseArgs({
  options: {
    from: { type: "string" },
    to: { type: "string" },
    "per-type": { type: "string", default: "15" },
  },
});

const DART_KEY = process.env.DART_API_KEY;
const PRICE_KEY = process.env.DATA_GO_KR_KEY;
if (!DART_KEY || !PRICE_KEY) {
  console.error(
    "❌ .env.local에 DART_API_KEY와 DATA_GO_KR_KEY를 넣어주세요. (.env.example 참고)",
  );
  process.exit(1);
}

const ymd = (d: Date) => d.toISOString().slice(0, 10).replaceAll("-", "");
const parseYmd = (s: string) =>
  new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)));
const addDays = (s: string, n: number) => {
  const d = parseYmd(s);
  d.setUTCDate(d.getUTCDate() + n);
  return ymd(d);
};

const today = ymd(new Date());
// 공시 후 20거래일 결과가 있어야 하므로 기본 종료일은 45일 전
const to = args.to ?? addDays(today, -45);
const from = args.from ?? addDays(to, -365);
const perType = Number(args["per-type"]);

// ---------- HTTP ----------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson<T>(url: string, label: string): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as T;
      await sleep(120); // 호출 제한 여유
      return body;
    } catch (e) {
      if (attempt >= 3) throw new Error(`${label} 요청 실패: ${(e as Error).message}`);
      await sleep(1000 * attempt);
    }
  }
}

type DartRes<T> = { status: string; message: string; list?: T[]; total_page?: number };

async function dart<T>(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ crtfc_key: DART_KEY!, ...params });
  const body = await getJson<DartRes<T>>(`${DART}/${path}?${qs}`, `DART ${path}`);
  if (body.status === "013") return { list: [] as T[], totalPage: 0 }; // 조회 데이터 없음
  if (body.status !== "000") throw new Error(`DART ${path}: [${body.status}] ${body.message}`);
  return { list: body.list ?? [], totalPage: body.total_page ?? 1 };
}

// ---------- 1. 공시 목록 ----------

interface ListItem {
  corp_cls: string;
  corp_name: string;
  corp_code: string;
  stock_code: string;
  report_nm: string;
  rcept_no: string;
  rcept_dt: string;
}

const MATCH: [DisclosureType, string, RegExp][] = [
  ["rights_offering", "piicDecsn.json", /^주요사항보고서\(유상증자결정\)$/],
  ["buyback", "tsstkAqDecsn.json", /^주요사항보고서\(자기주식취득결정\)$/],
  ["buyback", "tsstkDpDecsn.json", /^주요사항보고서\(자기주식처분결정\)$/],
];

async function listDisclosures(): Promise<ListItem[]> {
  const out: ListItem[] = [];
  // corp_code 없이 조회하면 기간이 최대 3개월이라 나눠서 조회
  for (let start = from; start <= to; start = addDays(start, 90)) {
    const end = addDays(start, 89) < to ? addDays(start, 89) : to;
    for (let page = 1; ; page++) {
      const { list, totalPage } = await dart<ListItem>("list.json", {
        bgn_de: start,
        end_de: end,
        pblntf_ty: "B",
        page_no: String(page),
        page_count: "100",
      });
      out.push(...list);
      process.stdout.write(`\r📄 공시 목록 ${start}~${end} · ${page}/${totalPage}페이지   `);
      if (page >= totalPage) break;
    }
  }
  console.log();
  // 코스피·코스닥 상장사의 최초 공시만 ([기재정정] 등 제외)
  return out.filter((d) => (d.corp_cls === "Y" || d.corp_cls === "K") && d.stock_code.trim());
}

// ---------- 2. 주가 ----------

interface PriceItem {
  basDt: string;
  srtnCd: string;
  itmsNm: string;
  clpr: string;
  mrktTotAmt: string;
}

async function prices(stockCode: string, around: string) {
  const qs = new URLSearchParams({
    serviceKey: PRICE_KEY!,
    resultType: "json",
    likeSrtnCd: stockCode,
    beginBasDt: addDays(around, -130),
    endBasDt: addDays(around, 60),
    numOfRows: "300",
  });
  const body = await getJson<{
    response?: { header: { resultCode: string; resultMsg: string }; body: { items: { item?: PriceItem[] } } };
  }>(`${PRICE}?${qs}`, "주가");
  if (!body.response) throw new Error(`주가 API 응답 형식 오류: ${JSON.stringify(body).slice(0, 200)}`);
  if (body.response.header.resultCode !== "00")
    throw new Error(`주가 API: ${body.response.header.resultMsg}`);
  return (body.response.body.items.item ?? [])
    .filter((p) => p.srtnCd === stockCode)
    .sort((a, b) => a.basDt.localeCompare(b.basDt));
}

// ---------- 3. 공시 상세 → 문제 ----------

const num = (s?: string) => Number((s ?? "").replaceAll(",", "")) || 0;
const eok = (won: number) =>
  won >= 1e12 ? `약 ${(won / 1e12).toFixed(1)}조 원` : `약 ${Math.round(won / 1e8).toLocaleString("ko-KR")}억 원`;
const pctText = (r: number) => `${(r * 100).toFixed(1)}%`;

interface Built {
  facts: { label: string; value: string }[];
  /** 해설에 쓸 특징 문장 */
  notes: string[];
  lesson: string;
}

function buildRightsOffering(d: Record<string, string>, marketCap: number): Built {
  const newShares = num(d.nstk_ostk_cnt);
  const oldShares = num(d.bfic_tisstk_ostk);
  const dilution = oldShares ? newShares / oldShares : 0;
  const uses: [string, number][] = [
    ["시설자금", num(d.fdpp_fclt)],
    ["영업양수", num(d.fdpp_bsninh)],
    ["운영자금", num(d.fdpp_op)],
    ["채무상환", num(d.fdpp_dtrp)],
    ["타법인 증권 취득", num(d.fdpp_ocsa)],
    ["기타", num(d.fdpp_etc)],
  ];
  const total = uses.reduce((s, [, v]) => s + v, 0);
  const useText = uses
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${Math.round((v / total) * 100)}%`)
    .join(", ");
  const weakUse = total ? (num(d.fdpp_op) + num(d.fdpp_dtrp)) / total : 0;
  const method = d.ic_mthn ?? "";
  const thirdParty = method.includes("제3자");

  const notes: string[] = [];
  if (thirdParty) notes.push("특정 투자자에게 새 주식을 배정하는 제3자배정 방식이었어요. 이때는 '누가, 얼마에' 사는지가 핵심이에요.");
  if (dilution >= 0.2) notes.push(`신주가 기존 주식의 ${pctText(dilution)}로 희석 규모가 큰 편이었어요.`);
  else if (dilution > 0) notes.push(`신주는 기존 주식의 ${pctText(dilution)}로 희석 규모는 크지 않았어요.`);
  if (weakUse >= 0.6) notes.push("조달 자금 대부분이 운영자금·채무상환용이라, 성장 투자보다는 자금 부족 신호로 읽힐 수 있었어요.");
  else if (num(d.fdpp_fclt) / (total || 1) >= 0.5) notes.push("자금 대부분이 시설 투자용이라 성장 기대와 희석 우려가 엇갈릴 수 있는 공시였어요.");

  return {
    facts: [
      { label: "증자 방식", value: method || "-" },
      { label: "신주 수", value: dilution ? `기존 발행주식의 ${pctText(dilution)}` : `${newShares.toLocaleString("ko-KR")}주` },
      { label: "조달 규모", value: total ? `${eok(total)} (시가총액의 ${pctText(total / marketCap)})` : "-" },
      { label: "자금 용도", value: useText || "-" },
    ],
    notes,
    lesson: thirdParty
      ? "제3자배정 유증은 배정 대상·발행가·보호예수를 확인한다."
      : "유증은 희석률과 자금 용도를 먼저 본다.",
  };
}

function buildBuyback(d: Record<string, string>, marketCap: number): Built {
  const amount = num(d.aqpln_prc_ostk);
  const purpose = d.aq_pp ?? "";
  const burn = purpose.includes("소각");
  const ratio = amount / marketCap;
  const notes = [
    burn
      ? "취득 목적에 '소각'이 포함돼 있어요. 소각하면 주식 수가 줄어 남은 주주의 주당 가치가 올라가요."
      : "소각 계획이 명시되지 않았어요. 사들인 자사주가 나중에 다시 시장에 나올 수도 있어요.",
    ratio >= 0.03
      ? `매입 규모가 시가총액의 ${pctText(ratio)}로 큰 편이었어요.`
      : `매입 규모는 시가총액의 ${pctText(ratio)}로 크지 않았어요.`,
  ];
  return {
    facts: [
      { label: "취득 규모", value: `${eok(amount)} (시가총액의 ${pctText(ratio)})` },
      { label: "취득 방법", value: d.aq_mth || "-" },
      { label: "취득 목적", value: purpose || "-" },
    ],
    notes,
    lesson: "자사주 매입은 '소각 여부'와 '시총 대비 규모'가 핵심이다.",
  };
}

function buildDisposal(d: Record<string, string>, marketCap: number): Built {
  const amount = num(d.dppln_prc_ostk);
  const ratio = amount / marketCap;
  const offMarket = num(d.dp_m_ovtm) + num(d.dp_m_otc) + num(d.dp_m_etc);
  return {
    facts: [
      { label: "처분 규모", value: `${eok(amount)} (시가총액의 ${pctText(ratio)})` },
      { label: "처분 목적", value: d.dp_pp || "-" },
      {
        label: "처분 방법",
        value: offMarket > num(d.dp_m_mkt) ? "장외·시간외 처분 중심" : "장내 매도 중심",
      },
    ],
    notes: [
      "자사주 '처분'은 회사가 갖고 있던 주식이 시장에 풀린다는 뜻이라, 매입과 반대로 수급 부담이 될 수 있어요.",
      `처분 규모는 시가총액의 ${pctText(ratio)}였어요.`,
    ],
    lesson: "자사주는 '매입'인지 '처분'인지부터 구분한다. 처분은 오버행(잠재 매물) 우려를 만든다.",
  };
}

function outcomeSentence(d1: number, d20: number) {
  const dir = (r: number) => (r > 0.03 ? "올랐고" : r < -0.03 ? "내렸고" : "거의 움직이지 않았고");
  const dir20 = d20 > 0.03 ? "상승" : d20 < -0.03 ? "하락" : "보합";
  return `실제로 주가는 공시 직후 ${pctText(d1)} ${dir(d1)}, 한 달 뒤에는 ${pctText(d20)}로 ${dir20} 마감했어요.`;
}

async function toProblem(item: ListItem, type: DisclosureType, api: string): Promise<Problem | null> {
  const { list } = await dart<Record<string, string>>(api, {
    corp_code: item.corp_code,
    bgn_de: item.rcept_dt,
    end_de: item.rcept_dt,
  });
  const detail = list.find((d) => d.rcept_no === item.rcept_no) ?? list[0];
  if (!detail) return null;

  const series = await prices(item.stock_code, item.rcept_dt);
  // 공시일 장중 반응까지 결과로 보도록, 공시 '전날' 종가를 기준으로 삼는다
  const cut = series.findIndex((p) => p.basDt >= item.rcept_dt);
  if (cut < BEFORE_DAYS || series.length - cut < AFTER_DAYS) return null;

  const before = series.slice(cut - BEFORE_DAYS, cut).map((p) => num(p.clpr));
  const after = series.slice(cut, cut + AFTER_DAYS).map((p) => num(p.clpr));
  const marketCap = num(series[cut - 1].mrktTotAmt);
  if (!marketCap || before.some((v) => !v) || after.some((v) => !v)) return null;

  const built =
    api === "piicDecsn.json"
      ? buildRightsOffering(detail, marketCap)
      : api === "tsstkAqDecsn.json"
        ? buildBuyback(detail, marketCap)
        : buildDisposal(detail, marketCap);

  // 규모 정보가 없는 공시(금액 미기재 등)는 문제로 쓰기 어렵다
  if (built.facts.some((f) => f.value.startsWith("약 0억"))) return null;

  const base = before[before.length - 1];
  const d1 = after[0] / base - 1;
  const d20 = after[AFTER_DAYS - 1] / base - 1;

  return {
    id: `dart-${item.rcept_no}`,
    type,
    sector: item.corp_cls === "Y" ? "코스피 상장사" : "코스닥 상장사",
    marketCap: eok(marketCap),
    title: item.report_nm.trim(),
    facts: built.facts,
    before,
    after,
    explanation: [...built.notes, outcomeSentence(d1, d20)].join(" "),
    lesson: built.lesson,
    source: {
      corpName: item.corp_name,
      date: `${item.rcept_dt.slice(0, 4)}.${item.rcept_dt.slice(4, 6)}.${item.rcept_dt.slice(6)}`,
      rceptNo: item.rcept_no,
    },
  };
}

// ---------- 실행 ----------

async function main() {
  console.log(`🔎 기간 ${from} ~ ${to}, 유형별 최대 ${perType}개`);
  const all = await listDisclosures();

  const problems: Problem[] = [];
  for (const [type, api, re] of MATCH) {
    // 기간 전체에 고르게 퍼지도록 간격을 두고 뽑는다
    const candidates = all.filter((d) => re.test(d.report_nm.trim()));
    const limit = api === "tsstkDpDecsn.json" ? Math.ceil(perType / 3) : perType;
    const step = Math.max(1, Math.floor(candidates.length / (limit * 2)));
    let made = 0;
    console.log(`\n${api}: 후보 ${candidates.length}건`);
    for (let i = 0; i < candidates.length && made < limit; i += step) {
      const c = candidates[i];
      try {
        const p = await toProblem(c, type, api);
        if (p) {
          problems.push(p);
          made++;
          console.log(`  ✅ ${c.rcept_dt} ${c.corp_name}`);
        } else {
          console.log(`  ⏭️  ${c.rcept_dt} ${c.corp_name} (주가 데이터 부족)`);
        }
      } catch (e) {
        console.log(`  ⚠️  ${c.rcept_dt} ${c.corp_name}: ${(e as Error).message}`);
      }
    }
  }

  writeFileSync(OUT, JSON.stringify(problems, null, 1) + "\n");
  console.log(`\n🎉 ${problems.length}문제 저장 → src/data/dart-problems.json`);
}

main().catch((e) => {
  console.error(`\n❌ ${(e as Error).message}`);
  process.exit(1);
});
