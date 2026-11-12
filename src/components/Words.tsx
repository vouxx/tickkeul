"use client";

import { Check, Layers, Lightbulb, Puzzle, X } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { CATEGORIES, glossary, type Term, type TermCategory } from "@/data/glossary";
import { LEVELS, levelInfo, type Level } from "@/data/levels";
import { questionBank, type BankQuestion } from "@/data/questions";
import type { ChoiceQ } from "@/lib/course-types";
import { useProgress, WORD_MASTERED } from "@/lib/progress";
import { readKey, STORAGE_KEYS } from "@/lib/storage-keys";
import { LevelIcon } from "./icons";
import { LessonPlayer, type Item } from "./LessonPlayer";

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

const STAGE_SIZE = 12;
const SET_SIZE = 10;
const LEVEL_KEY = STORAGE_KEYS.wordsLevel;

const shuffled = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

const chunk = <T,>(a: T[], n: number) =>
  Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

/** 오답 보기: 같은 분류·같은 레벨 → 같은 분류 → 나머지 순으로 골라 너무 쉽지 않게 */
function distractors(term: Term, n: number) {
  const others = glossary.filter((g) => g.id !== term.id);
  const tiers = [
    others.filter((g) => g.category === term.category && g.level === term.level),
    others.filter((g) => g.category === term.category && g.level !== term.level),
    others.filter((g) => g.category !== term.category),
  ];
  const out: Term[] = [];
  for (const tier of tiers) for (const g of shuffled(tier)) if (out.length < n) out.push(g);
  return out;
}

function termQuiz(terms: Term[]): Item[] {
  return shuffled(terms).map((term, i) => {
    const options = shuffled([term, ...distractors(term, 3)]);
    const q: ChoiceQ =
      i % 2 === 0
        ? {
            kind: "choice",
            prompt: `‘${term.term}’의 뜻은?`,
            options: options.map((o) => o.short),
            answer: options.indexOf(term),
            explain: term.example ? `${term.short} — ${term.example}` : term.short,
          }
        : {
            kind: "choice",
            prompt: `“${term.short}” — 이 설명에 맞는 용어는?`,
            options: options.map((o) => o.term),
            answer: options.indexOf(term),
            explain: `${term.term}: ${term.short}${term.example ? ` — ${term.example}` : ""}`,
          };
    return { q, key: `word:${term.id}` };
  });
}

const bankItems = (qs: BankQuestion[]): Item[] =>
  shuffled(qs).map((b) => ({
    key: `q:${b.id}`,
    q: {
      kind: "choice",
      variant: b.variant,
      scenario: b.scenario,
      prompt: b.prompt,
      options: b.options,
      answer: b.answer,
      explain: b.explain,
    },
  }));

type View =
  | { kind: "home" }
  | { kind: "quiz"; items: Item[]; title: string }
  | { kind: "cards"; deck: Term[] };

type Tab = "stage" | "practice" | "dict";

function readLevel(): Level {
  try {
    const v = Number(readKey(LEVEL_KEY));
    return (v >= 1 && v <= 4 ? v : 1) as Level;
  } catch {
    return 1;
  }
}

export function Words() {
  const mounted = useMounted();
  const { progress, recordWord } = useProgress();
  const [view, setView] = useState<View>({ kind: "home" });
  const [level, setLevelState] = useState<Level | null>(null);
  const [tab, setTab] = useState<Tab>("stage");

  const stagesByLevel = useMemo(() => {
    const order = (t: Term) => CATEGORIES.indexOf(t.category);
    return Object.fromEntries(
      LEVELS.map((l) => [
        l.id,
        chunk(
          glossary.filter((g) => g.level === l.id).sort((a, b) => order(a) - order(b) || a.id.localeCompare(b.id)),
          STAGE_SIZE,
        ),
      ]),
    ) as Record<Level, Term[][]>;
  }, []);

  if (!mounted) return <div className="h-96 animate-pulse rounded-2xl bg-card" />;

  const lv = level ?? progress.level ?? readLevel();
  const setLevel = (l: Level) => {
    setLevelState(l);
    try {
      localStorage.setItem(LEVEL_KEY, String(l));
    } catch {
      // 저장 못 해도 화면 전환은 된다
    }
  };

  const mastered = (id: string) => (progress.words[id] ?? 0) >= WORD_MASTERED;
  const record = (key: string, ok: boolean) => recordWord(key.replace(/^word:/, ""), ok);
  const back = () => setView({ kind: "home" });

  if (view.kind === "quiz") {
    return (
      <LessonPlayer
        key={view.title}
        items={view.items}
        mode="practice"
        title={view.title}
        onExit={back}
        onAnswer={record}
      />
    );
  }
  if (view.kind === "cards") return <Flashcards deck={view.deck} onRecord={recordWord} onExit={back} />;

  const masteredAll = glossary.filter((g) => mastered(g.id)).length;
  const info = levelInfo(lv);
  const stages = stagesByLevel[lv];
  const bank = questionBank.filter((q) => q.level === lv);

  const levelChips = (
    <div className="flex gap-1.5 overflow-x-auto pb-1" role="radiogroup" aria-label="레벨">
      {LEVELS.map((l) => (
        <button
          key={l.id}
          role="radio"
          aria-checked={l.id === lv}
          onClick={() => setLevel(l.id)}
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[13px] ${
            l.id === lv ? "border-accent bg-accent-soft font-bold text-accent-ink" : "border-line text-muted"
          }`}
        >
          <LevelIcon level={l.id} size={14} />
          {l.name}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <h1 className="font-display text-2xl">용어 · 레벨 학습</h1>
        <span className="num text-[13px] text-muted">
          익힌 용어 <b className="text-accent">{masteredAll.toLocaleString("ko-KR")}</b> / {glossary.length.toLocaleString("ko-KR")}
        </span>
      </div>

      <div role="tablist" aria-label="보기" className="grid grid-cols-3 rounded-xl bg-line-soft p-1 text-sm">
        {(
          [
            ["stage", "단계별 학습"],
            ["practice", "실전 문제"],
            ["dict", "용어 사전"],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`rounded-lg py-2 ${tab === k ? "bg-bg font-bold" : "font-medium text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "stage" && (
        <ol className="flex flex-col gap-2">
          {LEVELS.map((l) => {
            const terms = glossary.filter((g) => g.level === l.id);
            const doneCount = terms.filter((g) => mastered(g.id)).length;
            const active = l.id === lv;
            const complete = doneCount === terms.length;
            return (
              <li key={l.id}>
                <button
                  onClick={() => setLevel(l.id)}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3.5 text-left ${
                    active ? "border-2 border-accent" : "border border-line"
                  }`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `color-mix(in oklab, ${l.color} 16%, transparent)` }}
                  >
                    <LevelIcon level={l.id} size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-[15px]">{l.name}</strong>
                    <span className="block truncate text-[13px] text-muted">{l.desc}</span>
                  </span>
                  {complete ? (
                    <span className="text-xs font-bold text-accent-ink">완료</span>
                  ) : active ? (
                    <span className="shrink-0 rounded-full bg-accent px-2 py-1 text-xs font-bold text-white">지금 할 차례</span>
                  ) : (
                    <span className="num shrink-0 text-xs text-muted">
                      {doneCount}/{terms.length}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {tab === "stage" && (
        <StageList
          stages={stages}
          mastered={mastered}
          onCards={(deck) => setView({ kind: "cards", deck: shuffled(deck) })}
          onQuiz={(terms, i) =>
            setView({ kind: "quiz", items: termQuiz(terms), title: `${info.name} 스테이지 ${i + 1}` })
          }
        />
      )}

      {tab === "practice" && levelChips}
      {tab === "practice" && (
        <PracticeSets
          sets={chunk(bank, SET_SIZE)}
          solved={(id) => (progress.words[`q:${id}`] ?? 0) > 0}
          onStart={(qs, i) =>
            setView({ kind: "quiz", items: bankItems(qs), title: `${info.name} 실전 세트 ${i + 1}` })
          }
        />
      )}

      {tab === "dict" && <Dictionary mastered={mastered} />}
    </div>
  );
}

function StageList({
  stages,
  mastered,
  onCards,
  onQuiz,
}: {
  stages: Term[][];
  mastered: (id: string) => boolean;
  onCards: (deck: Term[]) => void;
  onQuiz: (terms: Term[], index: number) => void;
}) {
  if (!stages.length) return <p className="py-8 text-center text-sm text-muted">이 레벨의 용어가 없어요.</p>;
  // 아직 다 못 익힌 첫 스테이지를 '지금 할 차례'로 표시
  const current = stages.findIndex((s) => s.some((t) => !mastered(t.id)));
  return (
    <ul className="space-y-2">
      {stages.map((s, i) => {
        const done = s.filter((t) => mastered(t.id)).length;
        const complete = done === s.length;
        const cats = [...new Set(s.map((t) => t.category))].slice(0, 3).join(" · ");
        return (
          <li
            key={i}
            className={`rounded-2xl p-4 ${i === current ? "border-2 border-accent" : "border border-line"}`}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: complete ? "var(--accent)" : i === current ? "var(--accent)" : "var(--muted)" }}
              >
                {complete ? <Check size={18} strokeWidth={3} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  스테이지 {i + 1}
                  {i === current && <span className="ml-2 text-xs text-accent">지금 할 차례</span>}
                </p>
                <p className="truncate text-xs text-muted">
                  {cats} · {s.slice(0, 3).map((t) => t.term).join(", ")}…
                </p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line-soft">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(done / s.length) * 100}%` }} />
                </div>
              </div>
              <span className="num shrink-0 text-xs text-muted">
                {done}/{s.length}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold">
              <button onClick={() => onCards(s)} className="rounded-xl border-2 border-line py-2.5">
                <Layers size={16} className="mr-1 inline -mt-0.5" aria-hidden="true" />
                카드로 외우기
              </button>
              <button onClick={() => onQuiz(s, i)} className="rounded-xl bg-accent py-2.5 text-white">
                <Puzzle size={16} className="mr-1 inline -mt-0.5" aria-hidden="true" />
                퀴즈 {s.length}문제
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PracticeSets({
  sets,
  solved,
  onStart,
}: {
  sets: BankQuestion[][];
  solved: (id: string) => boolean;
  onStart: (qs: BankQuestion[], index: number) => void;
}) {
  if (!sets.length) return <p className="py-8 text-center text-sm text-muted">이 레벨의 실전 문제가 없어요.</p>;
  return (
    <>
      <p className="text-sm text-muted">상황 판단·계산·시장 반응 예측 문제예요. 처음 맞힌 문제가 기록돼요.</p>
      <ul className="grid grid-cols-2 gap-2">
        {sets.map((s, i) => {
          const done = s.filter((q) => solved(q.id)).length;
          const cats = [...new Set(s.map((q) => q.category))].slice(0, 2).join(" · ");
          return (
            <li key={i}>
              <button onClick={() => onStart(s, i)} className="w-full rounded-2xl border border-line p-4 text-left">
                <p className="font-bold text-accent-ink">
                  실전 세트 {i + 1}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">{cats}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-good" style={{ width: `${(done / s.length) * 100}%` }} />
                </div>
                <p className="num mt-1 text-xs text-muted">
                  {done}/{s.length} 맞힘
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Dictionary({ mastered }: { mastered: (id: string) => boolean }) {
  const [cat, setCat] = useState<TermCategory | "전체">("전체");
  const [lvl, setLvl] = useState<Level | 0>(0);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(60);

  const q = query.trim().toLowerCase();
  const list = glossary.filter(
    (g) =>
      (cat === "전체" || g.category === cat) &&
      (!lvl || g.level === lvl) &&
      (!q || g.term.toLowerCase().includes(q) || g.short.includes(q) || (g.example ?? "").includes(q)),
  );

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setLimit(60);
        }}
        placeholder={`${glossary.length}개 용어 검색 (예: ISA, PER, 금리)`}
        className="w-full rounded-xl border border-line bg-card px-4 py-3 text-sm outline-none focus:border-accent"
      />
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {([0, 1, 2, 3, 4] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLvl(l)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
              lvl === l ? "border border-accent bg-accent-soft font-bold text-accent-ink" : "border border-line text-muted"
            }`}
          >
            {l ? levelInfo(l).name : "모든 레벨"}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(["전체", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
              cat === c ? "border border-accent bg-accent-soft font-bold text-accent-ink" : "border border-line text-muted"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">{list.length}개</p>
      <ul className="space-y-2">
        {list.slice(0, limit).map((g) => {
          const li = levelInfo(g.level);
          return (
            <li key={g.id}>
              <button
                onClick={() => setOpen(open === g.id ? null : g.id)}
                aria-expanded={open === g.id}
                className="w-full rounded-xl border border-line p-4 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold">{g.term}</span>
                  {mastered(g.id) && <span className="text-xs font-bold text-good">익힘</span>}
                  <span className="ml-auto shrink-0 text-xs" style={{ color: li.color }}>
                    <LevelIcon level={g.level} size={13} className="mr-0.5 inline -mt-0.5" />
                    {li.name}
                  </span>
                </div>
                {open === g.id ? (
                  <p className="mt-1 text-sm">{g.short}</p>
                ) : (
                  <p className="mt-1 text-[13px] text-muted">눌러서 뜻 보기</p>
                )}
                {open === g.id && (
                  <>
                    {g.example && <p className="mt-2 rounded-lg bg-gold/15 p-2 text-sm text-gold-ink"><Lightbulb size={15} className="mr-1 inline -mt-0.5" aria-hidden="true" />{g.example}</p>}
                    <p className="mt-2 text-xs text-muted">분류: {g.category}</p>
                  </>
                )}
              </button>
            </li>
          );
        })}
        {!list.length && <p className="py-8 text-center text-sm text-muted">찾는 용어가 없어요.</p>}
      </ul>
      {list.length > limit && (
        <button onClick={() => setLimit(limit + 60)} className="w-full rounded-xl border border-line py-3 text-sm">
          더 보기 ({list.length - limit}개 남음)
        </button>
      )}
    </div>
  );
}

function Flashcards({
  deck,
  onRecord,
  onExit,
}: {
  deck: Term[];
  onRecord: (id: string, known: boolean) => void;
  onExit: () => void;
}) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);

  if (i >= deck.length) {
    return (
      <div className="rounded-2xl bg-card p-8 text-center shadow-sm">
        <Layers size={48} className="mx-auto text-down" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl">카드 {deck.length}장을 다 봤어요</h1>
        <p className="mt-2 text-sm text-muted">
          알아요 {known}장 · 다시 볼 카드 {deck.length - known}장
        </p>
        <button onClick={onExit} className="mt-6 w-full rounded-xl bg-accent py-3.5 font-bold text-white">
          돌아가기
        </button>
      </div>
    );
  }

  const card = deck[i];
  const li = levelInfo(card.level);
  const answer = (ok: boolean) => {
    onRecord(card.id, ok);
    if (ok) setKnown(known + 1);
    setFlipped(false);
    setI(i + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onExit} className="text-xl text-muted" aria-label="나가기">
          <X size={24} />
        </button>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-good" style={{ width: `${(i / deck.length) * 100}%` }} />
        </div>
        <span className="num text-sm text-muted">
          {i + 1}/{deck.length}
        </span>
      </div>

      <button
        onClick={() => setFlipped(!flipped)}
        className="flex min-h-72 w-full flex-col items-center justify-center rounded-3xl bg-card p-8 text-center shadow-sm"
      >
        <span className="text-xs text-muted">
          <span style={{ color: li.color }}>
            <LevelIcon level={card.level} size={13} className="mr-0.5 inline -mt-0.5" />
            {li.name}
          </span>{" "}
          · {card.category}
        </span>
        <span className="mt-2 text-3xl font-bold">{card.term}</span>
        {flipped ? (
          <>
            <span className="mt-5 text-lg leading-relaxed">{card.short}</span>
            {card.example && <span className="mt-3 text-sm text-muted"><Lightbulb size={15} className="mr-1 inline -mt-0.5" aria-hidden="true" />{card.example}</span>}
          </>
        ) : (
          <span className="mt-6 text-sm text-muted">눌러서 뜻 보기</span>
        )}
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => answer(false)} className="rounded-xl border-2 border-up/40 py-3.5 font-bold text-up">
          모르겠어요
        </button>
        <button onClick={() => answer(true)} className="rounded-xl bg-good py-3.5 font-bold text-white">
          알아요
        </button>
      </div>
    </div>
  );
}
