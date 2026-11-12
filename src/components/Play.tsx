"use client";

import { Check, ChevronRight, Flag, Lightbulb, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { getProblem, problems } from "@/data/problems";
import { pct, returns, settle, won } from "@/lib/game";
import { useGame } from "@/lib/store";
import { DISCLOSURE_LABEL, type Action, type Answer, type Problem } from "@/lib/types";
import { PriceChart } from "./PriceChart";

const WEIGHTS = [0.1, 0.3, 0.5];
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

const DIRS: { a: Action; sym: string; label: string }[] = [
  { a: "buy", sym: "▲", label: "오른다" },
  { a: "sell", sym: "▼", label: "내린다" },
  { a: "hold", sym: "–", label: "관망" },
];
const dirLabel = (a: Action) => DIRS.find((d) => d.a === a)!.label;

/** 금액을 '300만 원'처럼 짧게 */
function manwon(n: number) {
  const abs = Math.abs(n);
  if (abs >= 10_000) return `${(Math.round(abs / 1000) / 10).toLocaleString("ko-KR")}만 원`;
  return `${abs.toLocaleString("ko-KR")}원`;
}

/** 공시 원문 카드 (모의투자용: 실제 공시/예시 표시 + 표 + 차트) */
function DocCard({ problem, revealed }: { problem: Problem; revealed: boolean }) {
  return (
    <article aria-label="공시 원문" className="overflow-hidden rounded-2xl border border-line">
      <header className="flex flex-col gap-1.5 border-b border-line bg-soft px-4 pt-3.5 pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
              problem.source ? "bg-accent text-white" : "bg-line text-muted"
            }`}
          >
            {problem.source ? "실제 공시" : "예시"}
          </span>
          <span className="truncate text-xs text-muted">
            ○○주식회사 · {problem.sector} · 시총 {problem.marketCap}
          </span>
        </div>
        <h2 className="font-display text-base">{problem.title}</h2>
      </header>
      <dl className="px-4 text-sm">
        {problem.facts.map((f) => (
          <div key={f.label} className="flex gap-3 border-b border-line-soft py-2.5 last:border-0">
            <dt className="w-24 shrink-0 text-muted">{f.label}</dt>
            <dd className="font-medium">{f.value}</dd>
          </div>
        ))}
      </dl>
      <figure className="m-0 px-3 pb-3">
        <figcaption className="px-1 pt-1 text-xs text-muted">공시 전 60거래일 주가</figcaption>
        <PriceChart before={problem.before} after={revealed ? problem.after : undefined} />
      </figure>
    </article>
  );
}

export function Play({ id }: { id?: string }) {
  const mounted = useMounted();
  const router = useRouter();
  const { state, submit } = useGame();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [result, setResult] = useState<Answer | null>(null);

  if (!mounted) return <div className="h-96 animate-pulse rounded-2xl bg-line-soft" />;

  const solved = new Set(state.answers.map((a) => a.problemId));
  const problem =
    getProblem(pickedId ?? "") ?? (id ? getProblem(id) : problems.find((p) => !solved.has(p.id)));

  if (!problem) return <AllSolved />;

  const onSubmit = (action: Action, weight: number, reason: string) => {
    const s = settle(problem, action, action === "hold" ? 0 : weight, state.cash);
    const answer: Answer = {
      problemId: problem.id,
      type: problem.type,
      action,
      weight: action === "hold" ? 0 : weight,
      reason,
      ...s,
      at: 0,
    };
    // 결과 화면에 보여줄 '건 금액'은 제출 전 자금 기준
    submit(answer);
    setPickedId(problem.id);
    setResult({ ...answer, at: state.cash });
  };

  const onNext = () => {
    setPickedId(null);
    setResult(null);
    if (id) router.push("/play");
    window.scrollTo({ top: 0 });
  };

  if (result) return <PlayResult problem={problem} answer={result} onNext={onNext} />;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl">모의투자</h1>
        <Link href="/records" className="flex items-center gap-1 text-right">
          <span className="flex flex-col">
            <span className="text-[11px] text-muted">보유 자금</span>
            <strong className="num font-display text-[15px]">{won(state.cash)}</strong>
          </span>
          <ChevronRight size={18} className="text-muted" aria-hidden="true" />
        </Link>
      </header>
      <p className="text-[13px] text-muted">
        {DISCLOSURE_LABEL[problem.type]} 공시 · 문제 {problems.indexOf(problem) + 1} / {problems.length}
      </p>
      <DocCard problem={problem} revealed={false} />
      <Decision key={problem.id} cash={state.cash} onSubmit={onSubmit} />
    </div>
  );
}

function Decision({ cash, onSubmit }: { cash: number; onSubmit: (a: Action, w: number, reason: string) => void }) {
  const [action, setAction] = useState<Action | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const needBet = action !== "hold";
  const ready = action !== null && (!needBet || weight !== null);
  const amount = action === "hold" ? 0 : Math.round(cash * (weight ?? 0));

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 font-display text-base">1개월 뒤 주가를 어떻게 예상하나요?</legend>
        <div className="grid grid-cols-3 gap-2">
          {DIRS.map((d) => {
            const on = action === d.a;
            return (
              <button
                key={d.a}
                aria-pressed={on}
                onClick={() => setAction(d.a)}
                className={`flex h-16 flex-col items-center justify-center gap-0.5 rounded-[14px] border-2 border-b-4 text-sm font-bold ${
                  on ? "border-accent bg-accent-soft text-accent-ink" : "border-line"
                }`}
              >
                <span
                  className={`text-lg leading-none ${d.a === "buy" ? "text-up" : d.a === "sell" ? "text-down" : "text-muted"}`}
                  aria-hidden="true"
                >
                  {d.sym}
                </span>
                {d.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {needBet && (
        <fieldset className="flex flex-col">
          <legend className="mb-2.5 text-sm font-bold">
            얼마나 걸까요? <span className="font-normal text-muted">보유 자금 대비</span>
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {WEIGHTS.map((w) => {
              const on = weight === w;
              return (
                <button
                  key={w}
                  aria-pressed={on}
                  onClick={() => setWeight(w)}
                  className={`num flex h-14 flex-col items-center justify-center rounded-xl text-sm ${
                    on ? "border-2 border-accent bg-accent-soft font-bold text-accent-ink" : "border border-line font-medium"
                  }`}
                >
                  {w * 100}%<span className="text-[11px] font-normal text-muted">{manwon(cash * w)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-muted">
          판단 근거 한 줄 <span className="text-muted/80">(선택) · 오답 노트에서 다시 볼 수 있어요</span>
        </span>
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="예: 할인율이 크고 채무상환 비중이 있어서"
          className="resize-none rounded-xl border border-line bg-bg p-3 text-sm outline-none focus:border-accent"
        />
      </label>

      <button
        disabled={!ready}
        onClick={() => action && onSubmit(action, weight ?? 0, reason.trim())}
        className={`h-[52px] rounded-[14px] text-base font-black ${ready ? "bg-accent text-white" : "bg-line-soft text-muted"}`}
      >
        {!ready ? "방향과 금액을 골라 주세요" : action === "hold" ? "관망하기" : `${manwon(amount)} 걸기`}
      </button>
    </div>
  );
}

function PlayResult({ problem, answer, onNext }: { problem: Problem; answer: Answer; onNext: () => void }) {
  const [shown, setShown] = useState(false);
  const r = returns(problem);
  const cashBefore = answer.at;
  const bet = Math.round(cashBefore * answer.weight);
  const color = (v: number) => (v > 0 ? "text-up" : v < 0 ? "text-down" : "");
  const ok = answer.correct;
  return (
    <div className="flex flex-col gap-4">
      <section
        role="status"
        className={`flex items-center gap-3 rounded-[20px] px-4 py-4 text-white ${ok ? "bg-accent" : "bg-warn"}`}
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white ${ok ? "text-accent" : "text-warn"}`}>
          {ok ? <Check size={22} strokeWidth={3} aria-hidden="true" /> : <X size={20} strokeWidth={3} aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl">{ok ? "정답이에요" : "아쉬워요"}</h1>
          <span className="text-[13px] opacity-90">
            {answer.action === "hold" ? "관망했어요" : `'${dirLabel(answer.action)}'에 ${manwon(bet)}을 걸었어요`}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-[11px] opacity-90">이번 판 손익</span>
          <strong className="num font-display text-lg">
            {answer.pnl > 0 ? "+" : answer.pnl < 0 ? "−" : ""}
            {Math.abs(answer.pnl).toLocaleString("ko-KR")}원
          </strong>
        </div>
      </section>

      <article className="flex flex-col gap-3 rounded-2xl border border-line p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            {problem.source && shown ? (
              <span className="text-xs font-bold text-accent-ink">
                {problem.source.corpName} · {problem.source.date} 공시
              </span>
            ) : (
              <span className="text-xs text-muted">○○주식회사 · {problem.sector}</span>
            )}
            <h2 className="font-display text-[15px]">{problem.title}</h2>
          </div>
          {problem.source && !shown && (
            <button
              onClick={() => setShown(true)}
              className="shrink-0 rounded-lg border border-line px-2.5 py-1.5 text-[13px] font-bold text-accent"
            >
              정체 공개
            </button>
          )}
          {problem.source && shown && (
            <a
              href={`https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${problem.source.rceptNo}`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-[13px] font-bold text-accent underline"
            >
              DART 원문
            </a>
          )}
        </div>
        <PriceChart before={problem.before} after={problem.after} />
        <div className="grid grid-cols-3 gap-2 text-center">
          {(
            [
              ["다음 날", r.d1],
              ["1주 후", r.d5],
              ["1개월 후", r.d20],
            ] as [string, number][]
          ).map(([label, v]) => (
            <div key={label} className="rounded-xl bg-soft py-2">
              <span className="block text-[11px] text-muted">{label}</span>
              <strong className={`num text-[15px] ${color(v)}`}>{pct(v).replace("-", "−")}</strong>
            </div>
          ))}
        </div>
        <p className="num text-[11px] text-muted">
          직전 종가 {won(problem.before[problem.before.length - 1])} 기준 · 하락은 파랑, 상승은 빨강
        </p>
      </article>

      <section className="flex flex-col gap-3 rounded-2xl border border-line p-4">
        <h2 className="font-display text-[15px]">해설</h2>
        <p className="text-sm leading-relaxed">{problem.explanation}</p>
        <p className="rounded-xl bg-mark p-3 text-[13px] text-mark-ink">
          <Lightbulb size={15} className="mr-1 inline -mt-0.5" aria-hidden="true" />
          {problem.lesson}
        </p>
        {answer.reason && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted">내가 적은 근거</span>
            <span className="text-sm">{answer.reason}</span>
          </div>
        )}
      </section>

      <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
        <Link
          href="/records"
          className="flex h-[52px] items-center justify-center rounded-[14px] border-2 border-line text-[15px] font-bold text-muted"
        >
          기록 보기
        </Link>
        <button onClick={onNext} className="h-[52px] rounded-[14px] bg-accent text-base font-black text-white">
          다음 공시
        </button>
      </div>
    </div>
  );
}

function AllSolved() {
  return (
    <div className="rounded-2xl border-2 border-line p-8 text-center">
      <Flag size={40} className="mx-auto text-accent" aria-hidden="true" />
      <h1 className="mt-3 font-display text-2xl">모든 문제를 풀었어요</h1>
      <p className="mt-2 text-sm text-muted">기록에서 오답을 다시 풀어보거나, 처음부터 다시 도전해보세요.</p>
      <Link href="/records" className="mt-5 inline-block rounded-xl bg-accent px-6 py-3 font-bold text-white">
        내 기록 보기
      </Link>
    </div>
  );
}
