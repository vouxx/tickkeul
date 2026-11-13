"use client";

import { Check, Flame, Heart, HeartCrack, Lightbulb, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { glossary } from "@/data/glossary";
import type { Question } from "@/lib/course-types";
import { useFocusLock } from "@/lib/focus";
import { useGate } from "@/lib/gate";
import { localDay, MAX_HEARTS, useProgress, XP_PER_LESSON } from "@/lib/progress";
import {
  ChartView,
  ChoiceView,
  DilutionFigure,
  DisclosureView,
  FindView,
  isDisclosureCorrect,
  isFindCorrect,
  MatchView,
} from "./QuestionViews";
import { SignupNudge } from "./Gate";
import { CandleFigure } from "./TechChart";

export interface Item {
  q: Question;
  key: string;
}

type Status = "answering" | "correct" | "wrong";
type Mode = "lesson" | "review" | "practice";

interface Result {
  xp: number;
  correct: number;
  total: number;
  seconds: number;
  wrong: number;
}

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

/** 카드 본문에서 ==문장== 을 형광펜으로. 표시가 없으면 첫 문장을 강조한다 */
function Highlighted({ text }: { text: string }) {
  const marked = text.includes("==") ? text : text.replace(/^([^.\n]+[.?!요다])/, "==$1==");
  const parts = marked.split("==");
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>))}
    </>
  );
}

/** 레슨 글에서 나온 용어(사전에 있는 것)를 '새로 배운 용어'로 */
function learnedTerms(items: Item[]) {
  const text = items
    .map(({ q }) => {
      if (q.kind === "card") return `${q.title} ${q.body}`;
      if (q.kind === "match") return q.pairs.flat().join(" ");
      if (q.kind === "choice" || q.kind === "chart") return `${q.prompt} ${q.options.join(" ")} ${q.explain}`;
      return "";
    })
    .join(" ");
  const clean = (t: string) => t.replace(/\(.*?\)/g, "").trim();
  return glossary
    .map((g) => clean(g.term))
    .filter((t, i, all) => t.length >= 2 && text.includes(t) && all.indexOf(t) === i)
    .sort((a, b) => b.length - a.length)
    .slice(0, 6);
}

export function LessonPlayer({
  items,
  lessonId,
  mode = "lesson",
  title,
  onAnswer,
  exitHref,
  onExit,
  onDone,
  retryWrong = true,
}: {
  items: Item[];
  lessonId?: string;
  /** practice: 하트·오답 기록 없이 연습 (용어 퀴즈 등) */
  mode?: Mode;
  title: string;
  /** 문제별 첫 채점 결과 (용어 숙련도 기록용) */
  onAnswer?: (key: string, correct: boolean) => void;
  exitHref?: string;
  /** 같은 페이지 안에서 연 경우(복습·용어) 링크 대신 이 콜백으로 닫는다 */
  onExit?: () => void;
  /** 다 풀었을 때 완료 화면 대신 호출 (레벨 테스트 등) */
  onDone?: () => void;
  /** 틀린 문제를 끝에 다시 낼지 (테스트에서는 끈다) */
  retryWrong?: boolean;
}) {
  const mounted = useMounted();
  const { progress, loseHeart, addMistakes, finishLesson } = useProgress();
  useFocusLock();

  // 틀린 문제는 레슨 끝에 다시 나온다 (듀오링고 방식)
  const [queue, setQueue] = useState(() => items.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [status, setStatus] = useState<Status>("answering");
  const [picked, setPicked] = useState<number | null>(null);
  const [matchDone, setMatchDone] = useState(false);
  const [wrongKeys, setWrongKeys] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Result | null>(null);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const startedAt = useRef<number | null>(null);

  const answerable = useMemo(() => items.filter((i) => i.q.kind !== "card").length, [items]);
  const terms = useMemo(() => learnedTerms(items), [items]);

  if (!mounted) return <div className="h-96 animate-pulse rounded-2xl bg-line-soft" />;

  const hearts = progress.hearts;
  // 마지막 하트를 잃은 문제의 해설은 보여준 뒤, 다음 문제로 넘어갈 때 막는다
  if (mode === "lesson" && hearts <= 0 && !done && status === "answering") return <OutOfHearts />;
  if (done)
    return <Complete result={done} mode={mode} terms={terms} exitHref={exitHref} onExit={onExit} />;

  const item = items[queue[pos]];
  const { q } = item;
  const progressPct = (pos / queue.length) * 100;
  const touch = () => {
    startedAt.current ??= Date.now();
  };

  const report = (correct: boolean) => {
    if (answered.has(item.key)) return;
    setAnswered(new Set(answered).add(item.key));
    onAnswer?.(item.key, correct);
  };

  const markCorrect = () => {
    setStatus("correct");
    report(true);
  };

  const markWrong = () => {
    setStatus("wrong");
    report(false);
    if (mode === "lesson") loseHeart();
    if (!wrongKeys.has(item.key)) {
      setWrongKeys(new Set(wrongKeys).add(item.key));
      if (mode !== "practice") addMistakes([item.key]);
    }
  };

  const check = () => {
    touch();
    const ok =
      picked !== null &&
      (q.kind === "choice" || q.kind === "chart"
        ? picked === q.answer
        : q.kind === "disclosure"
          ? isDisclosureCorrect(q.problemId, picked)
          : q.kind === "find"
            ? isFindCorrect(q, picked)
            : false);
    if (ok) markCorrect();
    else markWrong();
  };

  /** 틀린 문제를 바로 다시 풀기 (끝에 다시 내지 않는다) */
  const retry = () => {
    setPicked(null);
    setStatus("answering");
  };

  const next = () => {
    touch();
    const wasWrong = retryWrong && status === "wrong" && q.kind !== "match";
    const nextQueue = wasWrong ? [...queue, queue[pos]] : queue;
    if (wasWrong) setQueue(nextQueue);
    setPicked(null);
    setMatchDone(false);
    setStatus("answering");
    if (pos + 1 >= nextQueue.length) {
      const perfect = wrongKeys.size === 0;
      const xp = mode === "lesson" ? XP_PER_LESSON + (perfect ? 5 : 0) : 5;
      finishLesson({
        lessonId: mode === "lesson" ? lessonId : undefined,
        xp,
        // 이번에 결국 맞힌 문제는 복습 목록에서 뺀다
        cleared: mode === "review" ? items.map((i) => i.key) : [],
        refillHearts: mode === "review",
      });
      if (onDone) onDone();
      else
        setDone({
          xp,
          correct: answerable - wrongKeys.size,
          total: answerable,
          wrong: wrongKeys.size,
          seconds: Math.round((Date.now() - (startedAt.current ?? Date.now())) / 1000),
        });
    } else {
      setPos(pos + 1);
    }
  };

  const canCheck = q.kind !== "card" && q.kind !== "match" && picked !== null && status === "answering";
  const locked = status !== "answering";
  const pick = (i: number) => {
    touch();
    setPicked(i);
  };

  return (
    <div className="flex min-h-[calc(100dvh-2rem)] flex-col">
      <header className="sticky top-0 z-10 -mx-5 flex items-center gap-3 bg-bg px-3 pt-2 pb-2">
        <ExitLink
          href={exitHref ?? (mode === "review" ? "/review" : "/")}
          onExit={onExit}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-muted"
          label="레슨 닫기"
        >
          <X size={24} strokeWidth={2.25} />
        </ExitLink>
        <div
          className="h-3 flex-1 overflow-hidden rounded-full bg-line-soft"
          role="progressbar"
          aria-label="레슨 진행률"
          aria-valuenow={pos}
          aria-valuemin={0}
          aria-valuemax={queue.length}
        >
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.max(progressPct, 4)}%` }} />
        </div>
        {mode === "lesson" && (
          <span className="num inline-flex items-center gap-1 pr-1 text-sm font-bold" aria-label={`하트 ${hearts}`}>
            <Heart size={20} fill="#FDE2E3" stroke="#D93A40" strokeWidth={2} aria-hidden="true" />
            {hearts}
            <span className="sr-only">/{MAX_HEARTS}</span>
          </span>
        )}
      </header>

      <p className="mt-2 mb-3 text-xs text-muted">{title}</p>

      <div className="flex-1" key={`${pos}-${queue[pos]}`}>
        {q.kind === "card" && (
          <div className="flex flex-col gap-5">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-accent">
              <Lightbulb size={16} aria-hidden="true" />새 개념
            </span>
            <article className="flex flex-col gap-5 rounded-[20px] border-2 border-line px-5 py-6">
              <h2 className="font-display text-2xl leading-snug">{q.title}</h2>
              {q.figure === "dilution" && <DilutionFigure />}
              {q.figure === "candle" && <CandleFigure />}
              <p className="text-base leading-[1.7] whitespace-pre-line">
                <Highlighted text={q.body} />
              </p>
            </article>
          </div>
        )}
        {q.kind === "choice" && <ChoiceView q={q} picked={picked} onPick={pick} locked={locked} />}
        {q.kind === "find" && <FindView q={q} picked={picked} onPick={pick} locked={locked} />}
        {q.kind === "match" && (
          <MatchView
            q={q}
            seed={queue[pos] + pos}
            onMistake={() => {
              touch();
              if (!wrongKeys.has(item.key)) markWrong();
            }}
            onComplete={() => {
              setMatchDone(true);
              if (wrongKeys.has(item.key)) setStatus("wrong");
              else markCorrect();
            }}
          />
        )}
        {q.kind === "chart" && <ChartView q={q} picked={picked} onPick={pick} locked={locked} />}
        {q.kind === "disclosure" && (
          <DisclosureView problemId={q.problemId} picked={picked} onPick={pick} revealed={locked} />
        )}
      </div>

      <BottomBar
        status={status}
        kind={q.kind}
        lostHeart={mode === "lesson"}
        explain={q.kind === "choice" || q.kind === "match" || q.kind === "chart" || q.kind === "find" ? q.explain : undefined}
        correctText={
          q.kind === "choice" || q.kind === "chart"
            ? q.options[q.answer]
            : q.kind === "find"
              ? `'${q.answerLabel}' 줄`
              : undefined
        }
        canCheck={canCheck}
        matchDone={matchDone}
        onCheck={check}
        onNext={next}
        onRetry={q.kind !== "match" && q.kind !== "card" ? retry : undefined}
      />
    </div>
  );
}

const BTN = "flex h-[52px] w-full items-center justify-center rounded-[14px] text-base font-black transition";

function BottomBar({
  status,
  kind,
  lostHeart,
  explain,
  correctText,
  canCheck,
  matchDone,
  onCheck,
  onNext,
  onRetry,
}: {
  status: Status;
  kind: Question["kind"];
  lostHeart: boolean;
  explain?: string;
  correctText?: string;
  canCheck: boolean;
  matchDone: boolean;
  onCheck: () => void;
  onNext: () => void;
  onRetry?: () => void;
}) {
  const wrap = "sticky bottom-0 -mx-5 mt-6";

  if (kind === "card") {
    return (
      <div className={`${wrap} bg-bg px-5 pt-4 pb-8`}>
        <button onClick={onNext} className={`${BTN} bg-accent text-white`}>
          이해했어요
        </button>
      </div>
    );
  }

  if (status === "answering" || (kind === "match" && !matchDone)) {
    if (kind === "match") return <div className="h-24" />;
    return (
      <div className={`${wrap} border-t border-line-soft bg-bg px-5 pt-4 pb-8`}>
        <button
          onClick={onCheck}
          disabled={!canCheck}
          className={`${BTN} ${canCheck ? "bg-accent text-white" : "bg-line-soft text-muted"}`}
        >
          확인
        </button>
      </div>
    );
  }

  const ok = status === "correct";
  return (
    <div role="status" className={`${wrap} flex flex-col gap-3.5 px-5 pt-[18px] pb-8 ${ok ? "bg-accent-soft" : "bg-warn-soft"}`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${ok ? "bg-accent" : "bg-warn"}`}
        >
          {ok ? <Check size={20} strokeWidth={3} aria-hidden="true" /> : <X size={18} strokeWidth={3} aria-hidden="true" />}
        </span>
        <div className={`flex flex-col gap-1 ${ok ? "text-accent-ink" : "text-warn-ink"}`}>
          <strong className="font-display text-lg">
            {ok ? (kind === "match" ? "모두 연결했어요!" : "정답이에요!") : lostHeart ? "하트 1개를 잃었어요" : "아쉬워요"}
          </strong>
          {!ok && correctText && <span className="text-sm font-bold">정답: {correctText}</span>}
          {explain && <span className="text-sm leading-normal">{explain}</span>}
        </div>
      </div>
      {ok ? (
        <button onClick={onNext} className={`${BTN} bg-accent text-white`}>
          계속
        </button>
      ) : (
        <div className="flex gap-2.5">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex h-[52px] shrink-0 items-center gap-1.5 rounded-[14px] border-2 border-warn/40 bg-bg px-[18px] text-[15px] font-bold text-warn-ink"
            >
              <RotateCcw size={16} aria-hidden="true" />
              다시 풀기
            </button>
          )}
          <button onClick={onNext} className={`${BTN} bg-warn text-white`}>
            계속
          </button>
        </div>
      )}
    </div>
  );
}

function ExitLink({
  href,
  onExit,
  className,
  label,
  children,
}: {
  href: string;
  onExit?: () => void;
  className: string;
  label?: string;
  children: ReactNode;
}) {
  return onExit ? (
    <button onClick={onExit} className={className} aria-label={label}>
      {children}
    </button>
  ) : (
    <Link href={href} className={className} aria-label={label}>
      {children}
    </Link>
  );
}

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

/** 이번 주 월~일 중 공부한 날 */
function useWeek() {
  const { progress } = useProgress();
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return DAYS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = localDay(d.getTime());
    return { label, studied: (progress.xpByDay?.[key] ?? 0) > 0, today: key === localDay() };
  });
}

function Complete({
  result,
  mode,
  terms,
  exitHref,
  onExit,
}: {
  result: Result;
  mode: Mode;
  terms: string[];
  exitHref?: string;
  onExit?: () => void;
}) {
  const { progress } = useProgress();
  const week = useWeek();
  const gate = useGate();
  const [later, setLater] = useState(false);
  const mm = Math.floor(result.seconds / 60);
  const ss = String(result.seconds % 60).padStart(2, "0");
  const titleText = mode === "review" ? "복습 완료!" : mode === "practice" ? "연습 완료!" : "레슨 완료!";
  return (
    <div className="flex min-h-[calc(100dvh-2rem)] flex-col">
      <div className="flex flex-1 flex-col items-center gap-6 pt-12">
        <div className="relative flex h-[136px] w-[136px] items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-accent-soft" />
          <span className="absolute inset-4 rounded-full bg-accent-ring" />
          <span
            className="relative flex h-[92px] w-[76px] -rotate-[5deg] flex-col justify-center gap-2 rounded-[10px] border-[3px] border-accent bg-white px-3 shadow-[0_6px_0_var(--accent-ink)]"
            role="img"
            aria-label="형광펜이 칠해진 공시 문서"
          >
            <span className="h-1 rounded-sm bg-[#C9CEC7]" />
            <span className="h-2.5 rounded-[3px] bg-[#FFE58A]" />
            <span className="h-1 w-[70%] rounded-sm bg-[#C9CEC7]" />
            <span className="h-1 rounded-sm bg-[#C9CEC7]" />
          </span>
        </div>

        <div className="text-center">
          <h1 className="font-display text-[28px]">{titleText}</h1>
          {mode === "review" && <p className="mt-2 text-[15px] text-muted">하트가 모두 채워졌어요.</p>}
        </div>

        <div className="grid w-full grid-cols-3 gap-2.5 text-center">
          <div className="overflow-hidden rounded-2xl border-2 border-[#F2C46A]">
            <div className="bg-[#F2C46A] py-1.5 text-xs font-bold text-[#5A3D00]">획득 XP</div>
            <div className="num py-3 font-display text-[22px]">+{result.xp}</div>
          </div>
          <div className="overflow-hidden rounded-2xl border-2 border-accent">
            <div className="bg-accent py-1.5 text-xs font-bold text-white">맞힌 문제</div>
            <div className="num py-3 font-display text-[22px]">
              {result.correct} / {result.total}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border-2 border-line">
            <div className="bg-line-soft py-1.5 text-xs font-bold text-muted">걸린 시간</div>
            <div className="num py-3 font-display text-[22px]">
              {mm}:{ss}
            </div>
          </div>
        </div>

        {terms.length > 0 && (
          <section className="flex w-full flex-col gap-2.5">
            <h2 className="text-sm font-bold text-muted">이 레슨에 나온 용어</h2>
            <ul className="flex flex-wrap gap-2">
              {terms.map((t) => (
                <li key={t}>
                  <Link href="/words" className="block rounded-full bg-mark px-3 py-2 text-sm font-bold text-mark-ink">
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {mode === "lesson" && gate.guest && !later && (
          <SignupNudge xp={progress.xp} onLater={() => setLater(true)} />
        )}

        <section className="flex w-full flex-col gap-3 rounded-2xl bg-soft p-4">
          <div className="flex items-center gap-2">
            <Flame size={22} fill="#FDE7B8" stroke="#E0900B" aria-hidden="true" />
            <strong className="font-display text-[15px]">{progress.streak}일 연속 학습 중</strong>
          </div>
          <ol aria-label="이번 주 학습 기록" className="grid grid-cols-7 gap-1.5 text-center text-[11px] text-muted">
            {week.map((d) => (
              <li key={d.label} className={`flex flex-col items-center gap-1.5 ${d.today ? "font-bold text-fg" : ""}`}>
                {d.label}
                <span
                  className={`h-[26px] w-[26px] rounded-full ${d.studied ? "bg-gold" : "bg-line"}`}
                  style={d.today ? { boxShadow: "0 0 0 3px var(--soft), 0 0 0 5px var(--gold)" } : undefined}
                  aria-label={d.studied ? "학습함" : "학습 안 함"}
                />
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="flex flex-col gap-2.5 pt-4 pb-8">
        <ExitLink href={exitHref ?? "/"} onExit={onExit} className={`${BTN} bg-accent text-white`}>
          계속하기
        </ExitLink>
        {mode === "lesson" && result.wrong > 0 && (
          <Link href="/review" className="flex h-12 items-center justify-center text-[15px] font-bold text-accent">
            틀린 {result.wrong}문제 복습하기
          </Link>
        )}
      </div>
    </div>
  );
}

function OutOfHearts() {
  return (
    <div className="flex min-h-[calc(100dvh-2rem)] flex-col">
      <header className="pt-2">
        <Link href="/" aria-label="닫기" className="flex h-11 w-11 items-center justify-center rounded-xl text-muted">
          <X size={24} strokeWidth={2.25} />
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <span className="flex h-28 w-28 items-center justify-center rounded-full bg-[#FDECEC]">
          <HeartCrack size={56} stroke="#D93A40" fill="#FDE2E3" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-[26px]">하트를 모두 썼어요</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            틀린 문제를 복습하면 하트가 다시 채워져요.
            <br />
            30분마다 하나씩도 다시 차요.
          </p>
        </div>
        <div className="flex gap-1.5" aria-label={`하트 0 / ${MAX_HEARTS}`}>
          {Array.from({ length: MAX_HEARTS }, (_, i) => (
            <Heart key={i} size={28} stroke="#D5DAD4" strokeWidth={2} aria-hidden="true" />
          ))}
        </div>
      </main>
      <footer className="flex flex-col gap-2.5 pb-8">
        <Link href="/review" className={`${BTN} gap-2 bg-accent text-white`}>
          <RotateCcw size={18} aria-hidden="true" />
          복습하고 하트 채우기
        </Link>
        <Link href="/" className="flex h-12 items-center justify-center text-[15px] font-bold text-accent">
          홈으로
        </Link>
      </footer>
    </div>
  );
}
