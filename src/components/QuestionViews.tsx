"use client";

import { CircleHelp, Highlighter, Lightbulb, ListChecks, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { getProblem } from "@/data/problems";
import type { ChartQ, ChoiceQ, FindQ, MatchQ } from "@/lib/course-types";
import { correctAction, pct, returns, won } from "@/lib/game";
import type { Action } from "@/lib/types";
import { PriceChart } from "./PriceChart";
import { TechChart } from "./TechChart";

type OptState = "idle" | "picked" | "right" | "wrong" | "done";

export const optionCls = (state: OptState) =>
  `w-full rounded-[14px] border-2 border-b-4 px-4 py-3.5 text-left font-medium transition active:translate-y-0.5 active:border-b-2 ${
    {
      idle: "border-line bg-card",
      picked: "border-accent bg-accent-soft font-bold text-accent-ink",
      right: "border-accent bg-accent-soft font-bold text-accent-ink",
      wrong: "border-warn bg-warn-soft font-bold text-warn-ink",
      done: "border-line-soft bg-soft text-muted",
    }[state]
  }`;

/** 문제 유형 표시 (아이콘 + 짧은 이름) */
export function KindLabel({ icon: Icon, children }: { icon: typeof TrendingUp; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-accent">
      <Icon size={16} aria-hidden="true" />
      {children}
    </span>
  );
}

export function ChoiceView({
  q,
  picked,
  onPick,
  locked,
}: {
  q: ChoiceQ;
  picked: number | null;
  onPick: (i: number) => void;
  locked: boolean;
}) {
  return (
    <div className="space-y-4">
      <KindLabel icon={q.variant === "predict" ? TrendingUp : CircleHelp}>
        {q.variant === "predict" ? "시장 반응 예측" : "고르기"}
      </KindLabel>
      {q.scenario && (
        <div className="rounded-2xl border-2 border-line p-5">
          <p className="text-xs font-bold text-muted">상황</p>
          <p className="mt-2 leading-relaxed">{q.scenario}</p>
        </div>
      )}
      <h2 className="font-display text-[21px] leading-snug">{q.prompt}</h2>
      <div className="space-y-2">
        {q.options.map((o, i) => {
          const state = locked
            ? i === q.answer
              ? "right"
              : i === picked
                ? "wrong"
                : "idle"
            : i === picked
              ? "picked"
              : "idle";
          return (
            <button key={o} disabled={locked} onClick={() => onPick(i)} className={optionCls(state)}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ChartView({
  q,
  picked,
  onPick,
  locked,
}: {
  q: ChartQ;
  picked: number | null;
  onPick: (i: number) => void;
  locked: boolean;
}) {
  return (
    <div className="space-y-4">
      <TechChart q={q} />
      <ChoiceView
        q={{ kind: "choice", prompt: q.prompt, options: q.options, answer: q.answer, explain: q.explain }}
        picked={picked}
        onPick={onPick}
        locked={locked}
      />
    </div>
  );
}

function shuffle<T>(arr: T[], seed: number) {
  const a = [...arr];
  let s = seed + 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // 우연히 원래 순서와 같으면 한 칸 돌린다
  return a.every((v, i) => v === arr[i]) ? [...a.slice(1), a[0]] : a;
}

export function MatchView({
  q,
  seed,
  onMistake,
  onComplete,
}: {
  q: MatchQ;
  seed: number;
  onMistake: () => void;
  onComplete: () => void;
}) {
  const rights = useMemo(() => shuffle(q.pairs.map((p) => p[1]), seed), [q, seed]);
  const [left, setLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [flash, setFlash] = useState<number | null>(null);

  const tapRight = (r: string, ri: number) => {
    if (left === null) return;
    if (q.pairs[left][1] === r) {
      const next = new Set(matched).add(left);
      setMatched(next);
      setLeft(null);
      if (next.size === q.pairs.length) onComplete();
    } else {
      setFlash(ri);
      setTimeout(() => setFlash(null), 450);
      onMistake();
    }
  };

  const doneRight = (r: string) => q.pairs.some((p, i) => matched.has(i) && p[1] === r);

  return (
    <div className="space-y-4">
      <KindLabel icon={ListChecks}>짝 맞추기</KindLabel>
      <h2 className="font-display text-[21px] leading-snug">{q.prompt}</h2>
      <div className="grid grid-cols-[2fr_3fr] gap-2.5">
        <div className="space-y-2.5" aria-label="왼쪽">
          {q.pairs.map(([l], i) => (
            <button
              key={l}
              disabled={matched.has(i)}
              onClick={() => setLeft(i)}
              className={`${optionCls(matched.has(i) ? "done" : left === i ? "picked" : "idle")} min-h-[72px] px-2 text-center text-[15px] font-bold`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="space-y-2.5" aria-label="오른쪽">
          {rights.map((r, ri) => (
            <button
              key={r}
              disabled={doneRight(r)}
              onClick={() => tapRight(r, ri)}
              className={`${optionCls(doneRight(r) ? "done" : flash === ri ? "wrong" : "idle")} min-h-[72px] px-3 text-[13px] leading-snug`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <p className="num text-sm text-muted">
        {matched.size} / {q.pairs.length} 연결
      </p>
    </div>
  );
}

const ACTIONS: { a: Action; label: string; Icon: typeof TrendingUp }[] = [
  { a: "buy", label: "오른다", Icon: TrendingUp },
  { a: "sell", label: "내린다", Icon: TrendingDown },
  { a: "hold", label: "별 변화 없다", Icon: Minus },
];

export function isDisclosureCorrect(problemId: string, picked: number) {
  const p = getProblem(problemId);
  return !!p && ACTIONS[picked].a === correctAction(returns(p).d20);
}

export function DisclosureView({
  problemId,
  picked,
  onPick,
  revealed,
}: {
  problemId: string;
  picked: number | null;
  onPick: (i: number) => void;
  revealed: boolean;
}) {
  const p = getProblem(problemId);
  if (!p) return <p className="text-muted">문제를 찾을 수 없어요.</p>;
  const r = returns(p);
  const answer = ACTIONS.findIndex((x) => x.a === correctAction(r.d20));

  return (
    <div className="space-y-4">
      <KindLabel icon={TrendingUp}>공시 읽고 예측</KindLabel>
      <article aria-label="공시 원문" className="overflow-hidden rounded-2xl border border-line">
        <DocHeader sector={p.sector} marketCap={p.marketCap} title={p.title} />
        <dl className="px-4 text-sm">
          {p.facts.map((f) => (
            <div key={f.label} className="flex gap-3 border-b border-line-soft py-2.5 last:border-0">
              <dt className="w-24 shrink-0 text-muted">{f.label}</dt>
              <dd className="font-medium">{f.value}</dd>
            </div>
          ))}
        </dl>
        <div className="px-3 pb-3">
          <PriceChart before={p.before} after={revealed ? p.after : undefined} />
        </div>
        {revealed && (
          <p className="num pb-3 text-center text-sm text-muted">
            다음 날 {pct(r.d1)} · 1주 {pct(r.d5)} · 1개월 {pct(r.d20)} (직전 종가{" "}
            {won(p.before[p.before.length - 1])})
          </p>
        )}
      </article>
      <h2 className="font-display text-[21px] leading-snug">한 달 뒤 주가는?</h2>
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map((x, i) => (
          <button
            key={x.a}
            disabled={revealed}
            onClick={() => onPick(i)}
            className={`${optionCls(
              revealed ? (i === answer ? "right" : i === picked ? "wrong" : "idle") : i === picked ? "picked" : "idle",
            )} flex flex-col items-center gap-1 text-center text-sm`}
          >
            <x.Icon size={20} aria-hidden="true" />
            {x.label}
          </button>
        ))}
      </div>
      {revealed && (
        <div className="space-y-2 rounded-2xl border-2 border-line p-5 text-sm leading-relaxed">
          <p>{p.explanation}</p>
          <p className="rounded-xl bg-mark p-3 text-mark-ink">
            <Lightbulb size={15} className="mr-1 inline -mt-0.5" aria-hidden="true" />
            {p.lesson}
          </p>
        </div>
      )}
    </div>
  );
}

/** 공시 원문 머리: 가려진 회사 정보 + 보고서 이름 */
export function DocHeader({
  sector,
  marketCap,
  title,
  badge = "공시 원문",
}: {
  sector: string;
  marketCap: string;
  title: string;
  badge?: string;
}) {
  return (
    <header className="flex flex-col gap-1.5 border-b border-line bg-soft px-4 pt-3.5 pb-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">
          ○○주식회사 · {sector} · 시총 {marketCap}
        </span>
        <span className="shrink-0 rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-bold text-accent-ink">
          {badge}
        </span>
      </div>
      <h3 className="font-display text-base">{title}</h3>
    </header>
  );
}

/** 공시 원문 표에서 정답 줄을 찾아 탭하기 */
export function FindView({
  q,
  picked,
  onPick,
  locked,
}: {
  q: FindQ;
  picked: number | null;
  onPick: (i: number) => void;
  locked: boolean;
}) {
  const p = getProblem(q.problemId);
  if (!p) return <p className="text-muted">문제를 찾을 수 없어요.</p>;
  const answer = p.facts.findIndex((f) => f.label === q.answerLabel);
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <KindLabel icon={Highlighter}>찾아서 탭하기</KindLabel>
        <h2 className="font-display text-[21px] leading-snug">{q.prompt}</h2>
      </div>
      <article aria-label="공시 원문" className="overflow-hidden rounded-2xl border border-line">
        <DocHeader sector={p.sector} marketCap={p.marketCap} title={p.title} />
        <div className="flex flex-col p-1.5">
          {p.facts.map((f, i) => {
            const state = locked
              ? i === answer
                ? "right"
                : i === picked
                  ? "wrong"
                  : "dim"
              : i === picked
                ? "picked"
                : "idle";
            const cls = {
              idle: "",
              picked: "bg-mark",
              right: "bg-accent-soft text-accent-ink",
              wrong: "bg-warn-soft text-warn-ink",
              dim: "text-muted",
            }[state];
            return (
              <button
                key={f.label}
                disabled={locked}
                aria-pressed={state === "picked"}
                onClick={() => onPick(i)}
                className={`flex min-h-12 items-baseline gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition ${cls}`}
              >
                <span className={`w-24 shrink-0 text-[13px] ${state === "idle" ? "text-muted" : ""}`}>{f.label}</span>
                <span
                  className={`text-sm ${
                    state === "right" ? "font-black" : state === "wrong" ? "font-bold line-through" : state === "picked" ? "font-bold" : "font-medium"
                  }`}
                >
                  {f.value}
                </span>
              </button>
            );
          })}
        </div>
      </article>
      <p className="text-xs text-muted">탭한 줄에 형광펜이 칠해져요.</p>
    </div>
  );
}

export function isFindCorrect(q: FindQ, picked: number) {
  const p = getProblem(q.problemId);
  return !!p && p.facts[picked]?.label === q.answerLabel;
}

/** 개념 카드 그림: 유상증자로 조각이 늘어 내 몫이 줄어드는 모습 */
export function DilutionFigure() {
  const row = (n: number, pctText: string, label: string, extra: boolean) => (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="font-bold text-accent-ink">내 몫 {pctText}</span>
      </div>
      <div className="grid h-9 gap-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {Array.from({ length: n }, (_, i) => (
          <span
            key={i}
            className={`rounded-lg ${
              i === 0 ? "bg-accent" : extra && i === n - 1 ? "border-2 border-dashed border-[#C99A00] bg-mark-strong" : "bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
  return (
    <figure className="m-0 flex flex-col gap-3.5" aria-label="증자 전에는 4조각 중 1조각(25%), 증자 후에는 5조각 중 1조각(20%)">
      {row(4, "25%", "증자 전 · 4조각", false)}
      {row(5, "20%", "증자 후 · 5조각", true)}
      <span className="self-end text-xs text-mark-ink">새로 생긴 조각</span>
    </figure>
  );
}
