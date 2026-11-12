"use client";

import { ChevronLeft, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { getProblem } from "@/data/problems";
import { pct, START_CASH, won } from "@/lib/game";
import { useGame } from "@/lib/store";
import { DISCLOSURE_LABEL, type Answer, type DisclosureType } from "@/lib/types";

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

export function Records() {
  const mounted = useMounted();
  const { state, reset } = useGame();
  const [confirming, setConfirming] = useState(false);
  const [openAt, setOpenAt] = useState<number | null>(null);

  if (!mounted) return <div className="h-96 animate-pulse rounded-2xl bg-line-soft" />;

  const answers = [...state.answers].reverse();
  const n = state.answers.length;
  const correct = state.answers.filter((a) => a.correct).length;
  const profit = state.cash / START_CASH - 1;

  const byType = (Object.keys(DISCLOSURE_LABEL) as DisclosureType[]).map((t) => {
    const list = state.answers.filter((a) => a.type === t);
    const ok = list.filter((a) => a.correct).length;
    return { t, ok, n: list.length, rate: list.length ? ok / list.length : 0 };
  });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-2">
        <Link href="/play" aria-label="모의투자로 돌아가기" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-xl">
          <ChevronLeft size={24} aria-hidden="true" />
        </Link>
        <h1 className="font-display text-[22px]">내 기록</h1>
      </header>

      <section className="flex flex-col gap-4 rounded-[20px] border border-line p-5">
        <div className="flex flex-col">
          <span className="text-[13px] text-muted">보유 자금</span>
          <strong className="num font-display text-[28px]">{won(state.cash)}</strong>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col rounded-xl bg-soft p-3">
            <span className="text-xs text-muted">누적 수익률</span>
            <strong className={`num text-lg ${profit > 0 ? "text-up" : profit < 0 ? "text-down" : ""}`}>
              {pct(profit).replace("-", "−")}
            </strong>
          </div>
          <div className="flex flex-col rounded-xl bg-soft p-3">
            <span className="text-xs text-muted">정답률</span>
            <strong className="num text-lg">{n ? `${correct} / ${n} · ${Math.round((correct / n) * 100)}%` : "-"}</strong>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[20px] border border-line p-5">
        <h2 className="font-display text-[15px]">공시 유형별 숙련도</h2>
        <div className="grid grid-cols-[80px_1fr_52px] items-center gap-x-2.5 gap-y-3 text-[13px]">
          {byType.map(({ t, ok, n: cnt, rate }) => (
            <Row key={t} label={DISCLOSURE_LABEL[t]} played={cnt > 0} rate={rate} text={`${ok} / ${cnt}`} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display text-[15px]">전체 기록</h2>
        {answers.length ? (
          <ul className="flex flex-col gap-2 text-sm">
            {answers.map((a) => (
              <RecordRow
                key={a.at}
                a={a}
                open={openAt === a.at}
                onToggle={() => setOpenAt(openAt === a.at ? null : a.at)}
              />
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-line p-6 text-center text-sm text-muted">
            아직 푼 문제가 없어요.
            <Link href="/play" className="mt-3 block font-bold text-accent">
              첫 공시 풀기
            </Link>
          </div>
        )}
      </section>

      {answers.length > 0 && (
        <button onClick={() => setConfirming(true)} className="self-center py-2 text-[13px] text-muted underline">
          기록과 자금 초기화
        </button>
      )}

      {confirming && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-[rgba(18,22,28,0.45)]"
          onClick={() => setConfirming(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-t-3xl bg-bg px-5 pt-6 pb-8"
          >
            <h2 id="reset-title" className="font-display text-[19px]">
              모든 기록과 자금을 초기화할까요?
            </h2>
            <p className="mt-2 text-sm text-muted">
              보유 자금이 1,000만 원으로 돌아가고, 푼 문제 기록이 모두 지워져요. 되돌릴 수 없어요.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setConfirming(false)}
                className="h-[52px] rounded-[14px] border-2 border-line text-[15px] font-bold text-muted"
              >
                취소
              </button>
              <button
                onClick={() => {
                  reset();
                  setConfirming(false);
                }}
                className="h-[52px] rounded-[14px] bg-warn text-[15px] font-black text-white"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, played, rate, text }: { label: string; played: boolean; rate: number; text: string }) {
  return (
    <>
      <span className={played ? "" : "text-muted"}>{label}</span>
      {played ? (
        <span className="h-2 overflow-hidden rounded-full bg-line-soft">
          <span
            className={`block h-full rounded-full ${rate >= 0.5 ? "bg-accent" : "bg-gold"}`}
            style={{ width: `${rate * 100}%` }}
          />
        </span>
      ) : (
        <span className="text-xs text-muted">미도전</span>
      )}
      <span className="num text-right font-bold">{played ? text : ""}</span>
    </>
  );
}

function RecordRow({ a, open, onToggle }: { a: Answer; open: boolean; onToggle: () => void }) {
  const p = getProblem(a.problemId);
  if (!p) return null;
  return (
    <li className="rounded-2xl border border-line">
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left">
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
            a.correct ? "bg-accent text-white" : "bg-warn-soft text-warn-ink"
          }`}
        >
          {a.correct ? "정답" : "오답"}
        </span>
        <span className="min-w-0 flex-1 truncate">
          {DISCLOSURE_LABEL[p.type]} · {p.source?.corpName ?? p.sector}
        </span>
        <strong className={`num ${a.pnl > 0 ? "text-up" : a.pnl < 0 ? "text-down" : "text-muted"}`}>
          {a.pnl > 0 ? "+" : a.pnl < 0 ? "−" : ""}
          {Math.abs(a.pnl).toLocaleString("ko-KR")}
        </strong>
      </button>
      {open && (
        <div className="flex flex-col gap-2 border-t border-line-soft px-3.5 py-3 text-[13px]">
          <p className="text-muted">
            1개월 수익률 <span className="num">{pct(a.return1m).replace("-", "−")}</span>
            {a.reason && <> · 내 근거: {a.reason}</>}
          </p>
          <p className="rounded-lg bg-mark p-2 text-mark-ink">
            <Lightbulb size={14} className="mr-1 inline -mt-0.5" aria-hidden="true" />
            {p.lesson}
          </p>
          {!a.correct && (
            <Link href={`/play?id=${p.id}`} className="font-bold text-accent">
              다시 풀기
            </Link>
          )}
        </div>
      )}
    </li>
  );
}
