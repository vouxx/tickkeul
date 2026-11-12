// 용어·문제 JSON 검사: node scripts/check-content.mjs [--fix]
// --fix: 다른 파일/핵심 용어와 이름이 겹치는 용어, 형식이 깨진 항목을 제거해 다시 저장한다.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const FIX = process.argv.includes("--fix");
const root = new URL("../src/data/", import.meta.url);
const CATS = [
  "기초", "시장·거래", "계좌·상품", "세금·제도", "생활 금융", "기업 분석", "차트",
  "공시·기업", "거시경제", "채권·금리", "해외 투자", "파생·대체", "투자 전략",
];
const norm = (s) => s.replace(/\s|\(.*?\)/g, "").toLowerCase();

// 핵심 용어(glossary.ts) 이름
const core = [...readFileSync(new URL("glossary.ts", root), "utf8").matchAll(/t\("([^"]+)", "([^"]+)"/g)];
const seenTerm = new Map(core.map((m) => [norm(m[2]), "core"]));
const seenId = new Set(core.map((m) => m[1]));
const seenShort = new Set();

let problems = 0;
const warn = (f, msg) => {
  problems++;
  console.log(`  ✗ ${f}: ${msg}`);
};

const stats = { terms: 0, questions: 0, byLevel: { 1: 0, 2: 0, 3: 0, 4: 0 }, qByLevel: { 1: 0, 2: 0, 3: 0, 4: 0 } };

for (const dir of ["terms", "questions"]) {
  const files = readdirSync(new URL(dir, root)).filter((f) => f.endsWith(".json")).sort();
  for (const f of files) {
    const url = new URL(`${dir}/${f}`, root);
    let data;
    try {
      data = JSON.parse(readFileSync(url, "utf8"));
    } catch (e) {
      warn(f, `JSON 파싱 실패 ${e.message}`);
      continue;
    }
    const keep = [];
    for (const x of data) {
      const tag = `${dir}/${f} ${x.id ?? "?"}`;
      let ok = true;
      const bad = (m) => {
        warn(tag, m);
        ok = false;
      };
      if (!x.id || seenId.has(x.id)) bad("id 없음/중복");
      if (![1, 2, 3, 4].includes(x.level)) bad("level 오류");
      if (!CATS.includes(x.category)) bad(`분류 오류 ${x.category}`);
      if (dir === "terms") {
        if (!x.term || !x.short) bad("term/short 없음");
        else {
          const k = norm(x.term);
          if (seenTerm.has(k)) bad(`용어 중복 '${x.term}' (${seenTerm.get(k)})`);
          if (x.short.length > 80) bad("short 너무 김");
          if (k.length > 1 && norm(x.short).includes(k)) bad(`short에 용어 포함 '${x.term}'`);
          if (seenShort.has(x.short)) bad("short 중복");
        }
      } else {
        const n = x.options?.length;
        if (!x.prompt || !x.explain) bad("prompt/explain 없음");
        if (!(n >= 3 && n <= 4)) bad("보기 수 오류");
        else if (new Set(x.options).size !== n) bad("보기 중복");
        if (!(x.answer >= 0 && x.answer < n)) bad("정답 번호 오류");
      }
      if (ok) {
        seenId.add(x.id);
        if (dir === "terms") {
          seenTerm.set(norm(x.term), f);
          seenShort.add(x.short);
          stats.terms++;
          stats.byLevel[x.level]++;
        } else {
          stats.questions++;
          stats.qByLevel[x.level]++;
        }
        keep.push(x);
      }
    }
    if (FIX && keep.length !== data.length) {
      writeFileSync(url, JSON.stringify(keep, null, 2) + "\n");
      console.log(`  ↻ ${dir}/${f}: ${data.length - keep.length}개 제거`);
    }
  }
}

console.log(
  `\n생성 용어 ${stats.terms}개 (초${stats.byLevel[1]} 중${stats.byLevel[2]} 고${stats.byLevel[3]} 특${stats.byLevel[4]}) · 핵심 용어 ${core.length}개`,
);
console.log(
  `실전 문제 ${stats.questions}개 (초${stats.qByLevel[1]} 중${stats.qByLevel[2]} 고${stats.qByLevel[3]} 특${stats.qByLevel[4]})`,
);
console.log(problems ? `문제 ${problems}건${FIX ? " (제거됨)" : ""}` : "문제 없음 ✅");
process.exit(problems && !FIX ? 1 : 0);
