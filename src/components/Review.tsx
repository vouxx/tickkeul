"use client";

import { Heart, RotateCcw, Shuffle } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { allLessons, getLesson, getQuestionByKey } from "@/data/course";
import { getProblem } from "@/data/problems";
import { qKey, type Question } from "@/lib/course-types";
import { MAX_HEARTS, useProgress } from "@/lib/progress";
import { DISCLOSURE_LABEL } from "@/lib/types";
import { LessonPlayer, type Item } from "./LessonPlayer";

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);
const MISTAKE_SET = 8;
const PRACTICE_SET = 5;

const shuffled = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

/** 오답 목록 한 줄: 분류 칩 + 무엇을 틀렸는지 */
function describe(key: string, q: Question) {
  const lesson = getLesson(key.split("#")[0]);
  const chip = lesson?.unit.title ?? "레슨";
  let text = "";
  if (q.kind === "choice" || q.kind === "chart" || q.kind === "find") text = q.prompt;
  else if (q.kind === "match") text = q.prompt;
  else if (q.kind === "disclosure") {
    const p = getProblem(q.problemId);
    return { chip: p ? DISCLOSURE_LABEL[p.type] : "공시", text: "공시 보고 한 달 뒤 주가 예측" };
  }
  return { chip, text };
}

export function Review() {
  const mounted = useMounted();
  const { progress } = useProgress();
  const [started, setStarted] = useState<{ items: Item[]; title: string } | null>(null);

  if (!mounted) return <div className="h-96 animate-pulse rounded-2xl bg-line-soft" />;
  if (started)
    return (
      <LessonPlayer items={started.items} mode="review" title={started.title} onExit={() => setStarted(null)} />
    );

  const mistakes: Item[] = progress.mistakes
    .map((key) => ({ key, q: getQuestionByKey(key)! }))
    .filter((i) => i.q && i.q.kind !== "card");

  const practice: Item[] = allLessons
    .filter((l) => progress.completed.includes(l.id))
    .flatMap((l) => l.questions.map((q, i) => ({ q, key: qKey(l.id, i) })))
    .filter((i) => i.q.kind !== "card");

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl">복습</h1>
        <span className="num inline-flex items-center gap-1 text-sm font-bold" aria-label={`하트 ${progress.hearts}`}>
          <Heart size={20} fill="#FDE2E3" stroke="#D93A40" aria-hidden="true" />
          {progress.hearts} / {MAX_HEARTS}
        </span>
      </header>

      <section className="flex flex-col gap-4 rounded-[20px] border-2 border-line p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warn-soft text-warn">
            <RotateCcw size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-[17px]">오답 복습</h2>
            <p className="text-[13px] text-muted">
              {mistakes.length
                ? `틀린 문제 ${mistakes.length}개 · 맞히면 복습 목록에서 빠져요.`
                : "틀린 문제가 없어요. 레슨에서 틀리면 여기에 모여요."}
            </p>
          </div>
        </div>
        {mistakes.length > 0 && (
          <ul className="flex flex-col gap-2">
            {mistakes.slice(0, 3).map(({ key, q }) => {
              const d = describe(key, q);
              return (
                <li key={key} className="flex items-center gap-2 rounded-xl bg-soft px-3 py-2.5 text-sm">
                  <span className="shrink-0 rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-bold text-accent-ink">
                    {d.chip}
                  </span>
                  <span className="truncate">{d.text}</span>
                </li>
              );
            })}
            {mistakes.length > 3 && <li className="px-1 text-xs text-muted">외 {mistakes.length - 3}개</li>}
          </ul>
        )}
        <button
          disabled={!mistakes.length}
          onClick={() => setStarted({ items: shuffled(mistakes).slice(0, MISTAKE_SET), title: "오답 복습" })}
          className={`flex h-[52px] items-center justify-center rounded-[14px] text-base font-black ${
            mistakes.length ? "bg-accent text-white" : "bg-line-soft text-muted"
          }`}
        >
          오답 복습 시작
        </button>
      </section>

      <section className="flex flex-col gap-4 rounded-[20px] border-2 border-line p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Shuffle size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-[17px]">섞어서 연습</h2>
            <p className="text-[13px] text-muted">
              {practice.length
                ? `완료한 레슨에서 무작위로 ${PRACTICE_SET}문제를 내요.`
                : "레슨을 하나 끝내면 섞어서 연습할 수 있어요."}
            </p>
          </div>
        </div>
        {practice.length ? (
          <button
            onClick={() => setStarted({ items: shuffled(practice).slice(0, PRACTICE_SET), title: "섞어서 연습" })}
            className="flex h-[52px] items-center justify-center rounded-[14px] border-2 border-accent-ring text-[15px] font-bold text-accent-ink"
          >
            연습 시작
          </button>
        ) : (
          <Link
            href="/"
            className="flex h-[52px] items-center justify-center rounded-[14px] border-2 border-accent-ring text-[15px] font-bold text-accent-ink"
          >
            레슨 하러 가기
          </Link>
        )}
      </section>

      <p className="flex items-center gap-1.5 text-[13px] text-muted">
        <Heart size={15} aria-hidden="true" />
        복습을 마치면 하트가 모두 채워져요.
      </p>
    </div>
  );
}
