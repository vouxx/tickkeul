"use client";

import { Check, ClipboardCheck, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { LEVELS, levelInfo, type Level } from "@/data/levels";
import { questionBank, type BankQuestion } from "@/data/questions";
import { useFocusLock } from "@/lib/focus";
import { useGate } from "@/lib/gate";
import { useProgress } from "@/lib/progress";
import { LevelIcon } from "./icons";

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

/** 레벨당 문제 수. 각 레벨에서 이만큼 중 PASS개 이상 맞히면 통과 */
const PER_LEVEL = 3;
const PASS = 2;
const TOTAL = PER_LEVEL * LEVELS.length;

const shuffled = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

const tint = (color: string, pct = 16) => `color-mix(in oklab, ${color} ${pct}%, transparent)`;

function makeTest(): BankQuestion[] {
  return LEVELS.flatMap((l) => shuffled(questionBank.filter((q) => q.level === l.id)).slice(0, PER_LEVEL));
}

/** 홈 화면: 아직 레벨을 안 정했을 때 */
export function LevelPrompt() {
  const mounted = useMounted();
  const { progress } = useProgress();
  if (!mounted || progress.level) return null;
  return (
    <section className="flex flex-col gap-3 rounded-[20px] border-2 border-line p-5">
      <h2 className="font-display text-xl">내 레벨부터 정해요</h2>
      <p className="text-sm text-muted">이미 아는 유닛은 건너뛰고, 용어도 내 수준부터 보여드려요.</p>
      <div className="flex gap-1.5">
        {LEVELS.map((l) => (
          <LevelIcon key={l.id} level={l.id} size={22} />
        ))}
      </div>
      <Link href="/level" className="flex h-[52px] items-center justify-center rounded-[14px] bg-accent font-black text-white">
        레벨 정하기
      </Link>
    </section>
  );
}

type Phase =
  | { kind: "pick" }
  | { kind: "test"; qs: BankQuestion[]; i: number; scores: Record<Level, number>; asked: Record<Level, number> }
  | { kind: "result"; scores: Record<Level, number>; asked: Record<Level, number> };

const zero = () => ({ 1: 0, 2: 0, 3: 0, 4: 0 }) as Record<Level, number>;

/** 낮은 레벨부터 차례로 통과한 가장 높은 레벨 */
function recommend(scores: Record<Level, number>): Level {
  let lv: Level = 1;
  for (const l of [1, 2, 3, 4] as Level[]) {
    if (scores[l] >= PASS) lv = l;
    else break;
  }
  return lv;
}

const BTN = "flex h-[52px] w-full items-center justify-center rounded-[14px] text-base font-black";

export function LevelPage() {
  const mounted = useMounted();
  const router = useRouter();
  const { progress, setLevel } = useProgress();
  const gate = useGate();
  const [phase, setPhase] = useState<Phase>({ kind: "pick" });
  const [chosen, setChosen] = useState<Level | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  useFocusLock();

  if (!mounted) return <div className="h-96 animate-pulse rounded-3xl bg-line-soft" />;

  const start = (l: Level) => {
    setLevel(l);
    router.push("/");
  };

  if (phase.kind === "test") {
    const q = phase.qs[phase.i];
    const lv = q.level;
    const blockIndex = phase.i % PER_LEVEL;
    const submit = (correct: boolean) => {
      const scores = { ...phase.scores, [lv]: phase.scores[lv] + (correct ? 1 : 0) };
      const asked = { ...phase.asked, [lv]: phase.asked[lv] + 1 };
      const endOfBlock = blockIndex === PER_LEVEL - 1;
      const last = phase.i + 1 >= phase.qs.length;
      setAnswer(null);
      // 한 레벨을 통과하지 못하면 그 위 레벨은 풀지 않는다
      if (last || (endOfBlock && scores[lv] < PASS)) setPhase({ kind: "result", scores, asked });
      else setPhase({ ...phase, i: phase.i + 1, scores, asked });
    };
    return (
      <div className="flex min-h-[calc(100dvh-2rem)] flex-col">
        <header className="flex flex-col gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPhase({ kind: "pick" })}
              aria-label="테스트 그만두기"
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-xl text-muted"
            >
              <X size={24} />
            </button>
            <strong className="flex-1 font-display text-base">레벨 테스트</strong>
            <span className="num text-sm font-bold text-muted">
              {phase.i + 1} / {TOTAL}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5" aria-label={`${levelInfo(lv).name} 진행 중`}>
            {LEVELS.map((l) => {
              const doneInLevel = phase.asked[l.id];
              const fill = l.id < lv ? 100 : l.id === lv ? (doneInLevel / PER_LEVEL) * 100 : 0;
              return (
                <div key={l.id} className="flex flex-col gap-1">
                  <span className="h-1.5 overflow-hidden rounded-full bg-line-soft">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${fill}%` }} />
                  </span>
                  <span
                    className={`text-[11px] ${
                      l.id < lv ? "font-bold text-accent-ink" : l.id === lv ? "font-bold" : "text-muted"
                    }`}
                  >
                    {l.name}
                  </span>
                </div>
              );
            })}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 pt-6" key={phase.i}>
          {q.scenario && <p className="rounded-2xl border-2 border-line p-4 text-sm leading-relaxed">{q.scenario}</p>}
          <h1 className="font-display text-[22px] leading-snug">{q.prompt}</h1>
          <div role="radiogroup" aria-label="보기" className="flex flex-col gap-2.5">
            {q.options.map((o, i) => (
              <button
                key={o}
                role="radio"
                aria-checked={answer === i}
                onClick={() => setAnswer(i)}
                className={`rounded-[14px] border-2 border-b-4 px-4 py-3.5 text-left text-base ${
                  answer === i ? "border-accent bg-accent-soft font-bold text-accent-ink" : "border-line font-medium"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          <p className="text-[13px] text-muted">테스트에서는 정답을 바로 알려주지 않아요. 하트도 줄지 않아요.</p>
        </main>
        <footer className="grid grid-cols-[1fr_1.6fr] gap-2.5 pt-4 pb-8">
          <button
            onClick={() => submit(false)}
            className="h-[52px] rounded-[14px] border-2 border-line text-[15px] font-bold text-muted"
          >
            모르겠어요
          </button>
          <button
            disabled={answer === null}
            onClick={() => submit(answer === q.answer)}
            className={`${BTN} ${answer === null ? "bg-line-soft text-muted" : "bg-accent text-white"}`}
          >
            다음
          </button>
        </footer>
      </div>
    );
  }

  if (phase.kind === "result") {
    const rec = recommend(phase.scores);
    const info = levelInfo(rec);
    return (
      <div className="flex min-h-[calc(100dvh-2rem)] flex-col">
        <main className="flex flex-1 flex-col items-center gap-6 pt-14 text-center">
          <span className="flex h-28 w-28 items-center justify-center rounded-full" style={{ background: tint(info.color) }}>
            <LevelIcon level={rec} size={56} />
          </span>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-muted">추천 레벨</span>
            <h1 className="font-display text-[32px]" style={{ color: info.color }}>
              {info.name}
            </h1>
            <p className="text-[15px] text-muted">
              {info.desc}.
              {rec > 1 && (
                <>
                  <br />
                  {levelInfo((rec - 1) as Level).name} 이하 유닛은 건너뛰어도 돼요.
                </>
              )}
            </p>
            {rec > 1 && gate.guest && (
              <p className="mt-2 rounded-xl bg-accent-soft px-3 py-2.5 text-[13px] font-bold text-accent-ink">
                가입 전에는 1단원만 열려요. 가입하면 {info.name} 단원부터 바로 시작할 수 있어요.
              </p>
            )}
          </div>
          <section className="w-full rounded-2xl border border-line px-4 py-2 text-left">
            <h2 className="sr-only">레벨별 결과</h2>
            <ul className="text-[15px]">
              {LEVELS.map((l) => {
                const asked = phase.asked[l.id];
                const passed = phase.scores[l.id] >= PASS;
                return (
                  <li
                    key={l.id}
                    className={`grid grid-cols-[1fr_auto_56px] items-center gap-3 border-b border-line-soft py-3 last:border-0 ${
                      asked ? "" : "text-muted"
                    }`}
                  >
                    <span>{l.name}</span>
                    <span className="num font-bold">{asked ? `${phase.scores[l.id]} / ${asked}` : "—"}</span>
                    <span className={`text-right text-xs ${asked && passed ? "font-bold text-accent-ink" : "text-muted"}`}>
                      {!asked ? "안 품" : passed ? "통과" : "미통과"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </main>
        <footer className="flex flex-col gap-2.5 pt-4 pb-8">
          <button onClick={() => start(rec)} className={`${BTN} bg-accent text-white`}>
            {info.name}로 시작하기
          </button>
          <button
            onClick={() => {
              setChosen(rec);
              setPhase({ kind: "pick" });
            }}
            className="h-12 text-[15px] font-bold text-accent"
          >
            다른 레벨 직접 고르기
          </button>
        </footer>
      </div>
    );
  }

  const selected = chosen ?? progress.level;
  return (
    <div className="flex min-h-[calc(100dvh-2rem)] flex-col">
      <header className="pt-2">
        <button
          onClick={() => router.back()}
          aria-label="닫기"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-xl text-muted"
        >
          <X size={24} />
        </button>
      </header>
      <main className="flex flex-1 flex-col gap-5 pt-2">
        <div>
          <h1 className="font-display text-[26px]">내 레벨부터 정해요</h1>
          <p className="mt-1.5 text-[15px] text-muted">이미 아는 유닛은 건너뛰고, 용어도 내 수준부터 보여드려요.</p>
        </div>
        <div role="radiogroup" aria-label="레벨" className="flex flex-col gap-2.5">
          {LEVELS.map((l) => {
            const on = selected === l.id;
            return (
              <button
                key={l.id}
                role="radio"
                aria-checked={on}
                onClick={() => setChosen(l.id)}
                className={`flex items-center gap-3.5 rounded-2xl border-2 p-4 text-left ${
                  on ? "border-accent bg-accent-soft" : "border-line"
                }`}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: on ? "var(--bg)" : tint(l.color) }}
                >
                  <LevelIcon level={l.id} size={24} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className={`block font-display text-base ${on ? "text-accent-ink" : ""}`}>{l.name}</strong>
                  <span className={`block text-[13px] ${on ? "" : "text-muted"}`}>{l.who}</span>
                </span>
                {on ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                    <Check size={15} strokeWidth={3} aria-hidden="true" />
                  </span>
                ) : (
                  <span className="h-6 w-6 shrink-0 rounded-full border-2 border-line" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            setAnswer(null);
            setPhase({ kind: "test", qs: makeTest(), i: 0, scores: zero(), asked: zero() });
          }}
          className="inline-flex items-center gap-2 self-start text-[15px] font-bold text-accent"
        >
          <ClipboardCheck size={18} aria-hidden="true" />
          잘 모르겠다면 레벨 테스트 ({TOTAL}문제)
        </button>
      </main>
      <footer className="pt-4 pb-8">
        <button
          disabled={!selected}
          onClick={() => selected && start(selected)}
          className={`${BTN} ${selected ? "bg-accent text-white" : "bg-line-soft text-muted"}`}
        >
          {selected ? `${levelInfo(selected).name}로 시작하기` : "레벨을 골라 주세요"}
        </button>
      </footer>
    </div>
  );
}
