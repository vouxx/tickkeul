"use client";

import { BookOpen, Check, ChevronRight, Flag, Lock, Star, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { allLessons, currentLesson, isUnlocked, UNIT_LEVEL, units } from "@/data/course";
import { termOfDay } from "@/data/glossary";
import { levelInfo } from "@/data/levels";
import type { Unit } from "@/lib/course-types";
import { DAILY_GOAL_XP, localDay, useProgress, WORD_MASTERED, type Progress } from "@/lib/progress";

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

/** 오늘 목표 XP (모바일 홈 위쪽 한 줄 — 넓은 화면에서는 오른쪽 패널에 있다) */
export function DailyGoal() {
  const mounted = useMounted();
  const { progress } = useProgress();
  if (!mounted) return null;
  const goal = Math.min(1, progress.todayXp / DAILY_GOAL_XP);
  const done = goal >= 1;
  return (
    <div className="flex items-center gap-3 lg:hidden">
      <Target size={20} className={done ? "text-accent" : "text-gold"} aria-hidden="true" />
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-line-soft">
        <div
          className={`h-full rounded-full transition-all ${done ? "bg-accent" : "bg-gold"}`}
          style={{ width: `${Math.max(goal * 100, 3)}%` }}
        />
      </div>
      <span className="num shrink-0 text-[13px] font-bold text-muted">
        {done ? "오늘 목표 달성" : `${progress.todayXp} / ${DAILY_GOAL_XP} XP`}
      </span>
    </div>
  );
}

// 레슨 버튼이 좌우로 흔들리며 내려가는 길
const OFFSETS = [-60, -14, 40, -8, -60, -14, 40];

type NodeState = "done" | "current" | "open" | "locked";

function Circle({ state }: { state: NodeState }) {
  if (state === "locked")
    return (
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-line-soft shadow-[0_5px_0_var(--line)]">
        <Lock size={22} strokeWidth={2} className="text-muted" aria-hidden="true" />
      </span>
    );
  if (state === "open")
    return (
      <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent bg-accent-soft text-accent shadow-[0_5px_0_var(--accent-ring)]">
        <Star size={24} fill="currentColor" aria-hidden="true" />
      </span>
    );
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_5px_0_var(--accent-ink)]">
      {state === "done" ? (
        <Check size={26} strokeWidth={3} aria-hidden="true" />
      ) : (
        <Star size={26} fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
      )}
    </span>
  );
}

function LessonNode({ title, state, href, index }: { title: string; state: NodeState; href: string; index: number }) {
  const x = OFFSETS[index % OFFSETS.length];

  if (state === "current") {
    return (
      <li className="flex flex-col items-center gap-2" style={{ transform: `translateX(${x}px)` }}>
        <span className="rounded-xl border border-line bg-card px-3 py-1.5 text-[13px] font-bold text-accent-ink shadow-[0_2px_8px_rgba(18,22,28,0.06)]">
          {title}
        </span>
        <Link
          href={href}
          aria-label={`레슨 시작: ${title}`}
          className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-4 border-accent-ring"
        >
          <Circle state="current" />
        </Link>
      </li>
    );
  }

  return (
    <li className="flex flex-col items-center gap-1" style={{ transform: `translateX(${x}px)` }}>
      {state === "locked" ? (
        <span role="img" aria-label={`${title} (잠김)`}>
          <Circle state="locked" />
        </span>
      ) : (
        <Link href={href} aria-label={`${title}${state === "done" ? " (완료)" : ""}`} className="rounded-full">
          <Circle state={state} />
        </Link>
      )}
      <span
        className={`mt-1 text-xs ${
          state === "done" ? "font-bold text-accent-ink" : state === "open" ? "font-bold" : "font-medium text-muted"
        }`}
      >
        {title}
      </span>
    </li>
  );
}

function UnitHeader({ unit, index, progress }: { unit: Unit; index: number; progress: Progress }) {
  const [guide, setGuide] = useState(false);
  const done = unit.lessons.filter((l) => progress.completed.includes(l.id)).length;
  const lv = levelInfo(UNIT_LEVEL[unit.id] ?? 1);
  const skippable = !!progress.level && lv.id < progress.level && done < unit.lessons.length;
  return (
    <section className="flex flex-col gap-3 rounded-[20px] bg-accent px-5 py-[18px] text-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium opacity-85">
            {index + 1}단원 · {lv.name} · 레슨 {done} / {unit.lessons.length}
            {skippable && " · 건너뛰어도 돼요"}
          </span>
          <h2 className="font-display text-xl">{unit.title}</h2>
        </div>
        <button
          onClick={() => setGuide(!guide)}
          aria-expanded={guide}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border border-white/50 px-3 text-[13px] font-bold"
        >
          <BookOpen size={16} aria-hidden="true" />
          가이드
        </button>
      </div>
      {guide && <p className="text-sm opacity-95">{unit.desc}</p>}
      <div className="h-2 overflow-hidden rounded-full bg-white/25">
        <div className="h-full rounded-full bg-white" style={{ width: `${(done / unit.lessons.length) * 100}%` }} />
      </div>
    </section>
  );
}

export function LearnPath() {
  const mounted = useMounted();
  const { progress } = useProgress();
  if (!mounted) return <div className="h-96 animate-pulse rounded-3xl bg-line-soft" />;

  const current = currentLesson(progress.completed, progress.level);

  return (
    <div className="flex flex-col gap-8">
      {units.map((u, ui) => {
        const open = u.lessons.some((l) => isUnlocked(l.id, progress.completed, progress.level));
        // 아직 열린 레슨이 없는 단원은 구분선으로만 보여준다
        if (!open) {
          return (
            <div key={u.id} className="flex items-center gap-3 text-[13px] font-medium text-muted">
              <span className="h-px flex-1 bg-line" />
              <Lock size={14} aria-hidden="true" />
              {ui + 1}단원 · {u.title}
              <span className="h-px flex-1 bg-line" />
            </div>
          );
        }
        return (
          <div key={u.id} className="flex flex-col gap-5">
            <UnitHeader unit={u} index={ui} progress={progress} />
            <ol aria-label={`${ui + 1}단원 레슨`} className="flex flex-col items-center gap-3.5">
              {u.lessons.map((l, i) => {
                const done = progress.completed.includes(l.id);
                const unlocked = isUnlocked(l.id, progress.completed, progress.level);
                const state: NodeState =
                  current?.id === l.id ? "current" : done ? "done" : unlocked ? "open" : "locked";
                return <LessonNode key={l.id} title={l.title} state={state} href={`/lesson/${l.id}`} index={i} />;
              })}
            </ol>
          </div>
        );
      })}
      <CourseEnd done={progress.completed.length} total={allLessons.length} />
    </div>
  );
}

export function TodayTerm() {
  const mounted = useMounted();
  const { progress } = useProgress();
  if (!mounted) return null;
  const term = termOfDay(localDay());
  const known = (progress.words[term.id] ?? 0) >= WORD_MASTERED;
  return (
    <Link href="/words" className="flex items-center gap-4 rounded-2xl border-2 border-line p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mark text-mark-ink">
        <BookOpen size={22} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold text-muted">
          오늘의 용어{known && <span className="ml-1.5 text-accent">익힘</span>}
        </span>
        <span className="block font-display text-lg leading-tight">{term.term}</span>
        <span className="block truncate text-[13px] text-muted">{term.short}</span>
      </span>
      <ChevronRight size={20} className="shrink-0 text-muted" aria-hidden="true" />
    </Link>
  );
}

function CourseEnd({ done, total }: { done: number; total: number }) {
  const finished = done >= total;
  return (
    <div className="rounded-2xl border-2 border-line p-6 text-center">
      {finished ? (
        <Trophy size={40} className="mx-auto text-gold" aria-hidden="true" />
      ) : (
        <Flag size={40} className="mx-auto text-accent" aria-hidden="true" />
      )}
      <p className="mt-2 font-display text-lg">{finished ? "전체 코스를 완주했어요" : "코스 완주까지"}</p>
      <p className="num mt-1 text-sm text-muted">
        레슨 {done} / {total}
        {finished ? " · 복습과 용어 퀴즈로 실력을 유지해보세요" : ""}
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-line-soft">
        <div className="h-full rounded-full bg-accent" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      {finished && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold">
          <Link href="/review" className="rounded-xl bg-accent py-3 text-white">
            복습하기
          </Link>
          <Link href="/words" className="rounded-xl border-2 border-line py-3">
            용어 퀴즈
          </Link>
        </div>
      )}
    </div>
  );
}
