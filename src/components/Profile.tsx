"use client";

import { ChevronRight, Cloud, Settings } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { units, UNIT_LEVEL } from "@/data/course";
import { levelInfo, type Level } from "@/data/levels";
import { useAccount } from "@/lib/account";
import { DAILY_GOAL_XP, localDay, useProgress } from "@/lib/progress";
import { useGame } from "@/lib/store";
import { supabaseConfigured } from "@/lib/supabase";
import { DISCLOSURE_LABEL, type DisclosureType } from "@/lib/types";
import { LevelIcon } from "./icons";

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

function sinceText(since: string | null) {
  if (!since) return "오늘부터 시작해요";
  const [y, m] = since.split("-");
  return `${y}년 ${Number(m)}월부터 학습 중`;
}

export function Profile() {
  const mounted = useMounted();
  const { progress } = useProgress();
  const { state } = useGame();
  const acc = useAccount();
  if (!mounted) return <div className="h-96 animate-pulse rounded-2xl bg-line-soft" />;

  const name = acc.user?.email?.split("@")[0] ?? "학습자";
  const level = progress.level;
  const info = level ? levelInfo(level) : null;

  // 다음 레벨까지: 지금 레벨 유닛을 몇 개 끝냈는지
  const levelUnits = level ? units.filter((u) => (UNIT_LEVEL[u.id] ?? 1) === level) : [];
  const unitsDone = levelUnits.filter((u) => u.lessons.every((l) => progress.completed.includes(l.id))).length;

  // 이번 주 월~일 XP
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const week = DAYS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = localDay(d.getTime());
    return { label, xp: progress.xpByDay?.[key] ?? 0, today: key === localDay() };
  });
  const maxXp = Math.max(DAILY_GOAL_XP * 1.4, ...week.map((w) => w.xp));

  const types = (Object.keys(DISCLOSURE_LABEL) as DisclosureType[]).map((t) => {
    const list = state.answers.filter((a) => a.type === t);
    return { t, n: list.length, rate: list.length ? list.filter((a) => a.correct).length / list.length : 0 };
  });
  const weakest = types.filter((x) => x.n > 0).sort((a, b) => a.rate - b.rate)[0];

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent font-display text-[22px] text-white">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl">{name}</h1>
          <span className="text-[13px] text-muted">{sinceText(progress.since)}</span>
        </div>
        <Link
          href="/account"
          aria-label="내 계정 설정"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-muted"
        >
          <Settings size={20} aria-hidden="true" />
        </Link>
      </header>

      {supabaseConfigured && !acc.user && acc.ready && (
        <Link href="/account" className="flex items-center gap-3 rounded-2xl bg-accent-soft p-4 text-sm">
          <Cloud size={24} className="shrink-0 text-accent" aria-hidden="true" />
          <span className="flex-1">
            <b className="text-accent-ink">회원가입하고 진도를 저장하세요</b>
            <span className="block text-xs text-muted">폰·PC 어디서든 이어서 공부할 수 있어요.</span>
          </span>
          <ChevronRight size={20} className="shrink-0 text-muted" aria-hidden="true" />
        </Link>
      )}

      <section className="flex flex-col gap-3 rounded-[20px] border border-line p-5">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: info ? `color-mix(in oklab, ${info.color} 16%, transparent)` : "var(--line-soft)" }}
          >
            {level ? <LevelIcon level={level} size={26} /> : null}
          </span>
          <div className="flex-1">
            <span className="block text-xs text-muted">내 레벨</span>
            <strong className="font-display text-[17px]">{info ? info.name : "아직 안 정했어요"}</strong>
          </div>
          <Link href="/level" className="rounded-xl border border-line px-3 py-2 text-[13px] font-bold text-accent">
            {info ? "레벨 바꾸기" : "레벨 정하기"}
          </Link>
        </div>
        {level && level < 4 && levelUnits.length > 0 && (
          <>
            <div className="flex justify-between text-xs text-muted">
              <span>{levelInfo((level + 1) as Level).name}까지</span>
              <span className="num">
                {unitsDone} / {levelUnits.length} 유닛
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line-soft">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(unitsDone / levelUnits.length) * 100}%` }} />
            </div>
          </>
        )}
      </section>

      <div className="grid grid-cols-3 gap-2">
        {[
          ["연속 학습", `${progress.streak}일`],
          ["총 XP", progress.xp.toLocaleString("ko-KR")],
          ["완료 레슨", `${progress.completed.length}개`],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5 rounded-2xl border border-line p-3.5">
            <span className="text-xs text-muted">{label}</span>
            <strong className="num font-display text-xl">{value}</strong>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3 rounded-[20px] border border-line p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[15px]">이번 주 XP</h2>
          <span className="text-xs text-muted">점선 = 하루 목표 {DAILY_GOAL_XP} XP</span>
        </div>
        <div
          role="img"
          aria-label={`요일별 XP: ${week.map((w) => `${w.label} ${w.xp}`).join(", ")}`}
          className="relative grid h-28 grid-cols-7 items-end gap-2 border-b border-line"
        >
          <span
            className="absolute inset-x-0 border-t-2 border-dashed border-line"
            style={{ bottom: `${(DAILY_GOAL_XP / maxXp) * 100}%` }}
            aria-hidden="true"
          />
          {week.map((w) => (
            <span
              key={w.label}
              className={`rounded-t-md ${w.xp ? "bg-accent" : "bg-line"}`}
              style={{ height: `${Math.max((w.xp / maxXp) * 100, 4)}%` }}
            />
          ))}
        </div>
        <div aria-hidden="true" className="grid grid-cols-7 gap-2 text-center text-[11px] text-muted">
          {week.map((w) => (
            <span key={w.label} className={w.today ? "font-bold text-fg" : ""}>
              {w.label}
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[20px] border border-line p-5">
        <h2 className="font-display text-[15px]">공시 유형별 정답률</h2>
        <div className="grid grid-cols-[76px_1fr_40px] items-center gap-x-2.5 gap-y-3 text-[13px]">
          {types.map(({ t, n, rate }) => (
            <Row key={t} label={DISCLOSURE_LABEL[t]} n={n} rate={rate} />
          ))}
        </div>
        {weakest ? (
          <Link href="/play" className="text-[13px] font-bold text-accent">
            {DISCLOSURE_LABEL[weakest.t]} 공시 더 풀어보기
          </Link>
        ) : (
          <Link href="/play" className="text-[13px] font-bold text-accent">
            모의투자로 공시 풀어보기
          </Link>
        )}
      </section>
    </div>
  );
}

function Row({ label, n, rate }: { label: string; n: number; rate: number }) {
  return (
    <>
      <span className={n ? "" : "text-muted"}>{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-line-soft">
        <span
          className={`block h-full rounded-full ${rate >= 0.5 ? "bg-accent" : "bg-gold"}`}
          style={{ width: `${rate * 100}%` }}
        />
      </span>
      <span className="num text-right font-bold">{n ? `${Math.round(rate * 100)}%` : "-"}</span>
    </>
  );
}
