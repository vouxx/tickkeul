"use client";

import { BookOpen, ChartCandlestick, Flame, Heart, House, RotateCcw, UserRound, Zap, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { levelInfo } from "@/data/levels";
import { DAILY_GOAL_XP, useProgress } from "@/lib/progress";
import { useGame } from "@/lib/store";
import { useFocusMode } from "@/lib/focus";
import { DISCLOSURE_LABEL, type DisclosureType } from "@/lib/types";
import { LevelIcon } from "./icons";

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

export const APP_NAME = "티끌";

const TABS: { href: string; label: string; Icon: LucideIcon; match: (p: string) => boolean }[] = [
  { href: "/", label: "학습", Icon: House, match: (p) => p === "/" },
  { href: "/review", label: "복습", Icon: RotateCcw, match: (p) => p.startsWith("/review") },
  { href: "/words", label: "용어", Icon: BookOpen, match: (p) => p.startsWith("/words") },
  { href: "/play", label: "모의투자", Icon: ChartCandlestick, match: (p) => p.startsWith("/play") || p.startsWith("/records") },
  {
    href: "/me",
    label: "내 정보",
    Icon: UserRound,
    match: (p) => p.startsWith("/me") || p.startsWith("/account") || p.startsWith("/level"),
  },
];

/** 문제를 푸는 화면·레벨 정하기에서는 메뉴를 숨겨 집중하게 한다 */
const isFocusRoute = (p: string) => p.startsWith("/lesson") || p.startsWith("/level");

/** 로고: 초록 타일 위에서 점점 커지며 올라가는 점 넷 (맨 끝은 노랑) — '티끌 모아 태산' */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <rect width="64" height="64" rx="15" fill="var(--logo-tile)" />
      <circle cx="15" cy="48" r="2.6" fill="#FFFFFF" />
      <circle cx="23.5" cy="41.5" r="3.8" fill="#FFFFFF" />
      <circle cx="33.5" cy="33" r="5.2" fill="#FFFFFF" />
      <circle cx="45.5" cy="21.5" r="7.2" fill="#FFE58A" />
    </svg>
  );
}

/** 로고 + '티끌' 워드마크 */
export function Wordmark({ size = 34, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className="font-black tracking-[-0.05em]" style={{ fontSize: size * 0.56 }}>
        {APP_NAME}
      </span>
    </span>
  );
}

function LevelChip() {
  const { progress } = useProgress();
  if (!progress.level) {
    return (
      <Link
        href="/level"
        className="inline-flex h-[34px] items-center rounded-full border border-line px-3 text-[13px] font-bold"
      >
        레벨 정하기
      </Link>
    );
  }
  const info = levelInfo(progress.level);
  return (
    <Link
      href="/level"
      aria-label={`내 레벨: ${info.name} · 바꾸기`}
      className="inline-flex h-[34px] items-center gap-1 rounded-full border border-line bg-card px-2.5 text-[13px] font-bold"
    >
      <LevelIcon level={progress.level} size={16} />
      {info.name}
    </Link>
  );
}

function Stat({ Icon, value, label, fill, stroke }: { Icon: LucideIcon; value: number; label: string; fill: string; stroke: string }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${label} ${value}`}>
      <Icon size={20} fill={fill} stroke={stroke} strokeWidth={2} aria-hidden="true" />
      {value.toLocaleString("ko-KR")}
    </span>
  );
}

function Stats() {
  const { progress } = useProgress();
  return (
    <div className="num flex items-center gap-3.5 text-sm font-bold">
      <Stat Icon={Flame} value={progress.streak} label="연속 학습" fill="#FDE7B8" stroke="#E0900B" />
      <Stat Icon={Zap} value={progress.xp} label="XP" fill="var(--accent-soft)" stroke="var(--accent)" />
      <Stat Icon={Heart} value={progress.hearts} label="하트" fill="#FDE2E3" stroke="#D93A40" />
    </div>
  );
}

/** 모바일 위쪽: 로고 + 레벨 칩 / 연속 학습·XP·하트 */
export function TopBar() {
  const path = usePathname();
  const mounted = useMounted();
  const focusMode = useFocusMode();
  if (isFocusRoute(path) || focusMode) return null;
  return (
    <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <Link href="/" aria-label={`${APP_NAME} 홈`}>
            <Wordmark />
          </Link>
          {mounted && <LevelChip />}
        </div>
        {mounted && <Stats />}
      </div>
    </header>
  );
}

/** 모바일 아래쪽: 아이콘 탭바 */
export function BottomTabs() {
  const path = usePathname();
  const focusMode = useFocusMode();
  if (isFocusRoute(path) || focusMode) return null;
  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg pb-[max(env(safe-area-inset-bottom),12px)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5 px-1 pt-2">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match(path);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] ${
                  active ? "font-bold text-accent" : "font-medium text-muted"
                }`}
              >
                <Icon size={24} strokeWidth={2} fill={active ? "var(--accent-soft)" : "none"} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** 넓은 화면 왼쪽: 로고 + 메뉴 */
function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col gap-8 py-8 lg:flex">
      <Link href="/" aria-label={`${APP_NAME} 홈`} className="px-2">
        <Wordmark size={38} />
      </Link>
      <nav aria-label="주요 메뉴" className="flex flex-col gap-1.5">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match(path);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-[15px] ${
                active
                  ? "border-accent-ring bg-accent-soft font-bold text-accent-ink"
                  : "border-transparent font-medium text-muted hover:bg-soft"
              }`}
            >
              <Icon size={24} strokeWidth={2} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

/** 넓은 화면 오른쪽: 내 상태 · 오늘 목표 · 공시 유형별 정답률 */
function RightRail() {
  const { progress } = useProgress();
  const { state } = useGame();
  const goal = Math.min(1, progress.todayXp / DAILY_GOAL_XP);
  const left = Math.max(0, DAILY_GOAL_XP - progress.todayXp);
  const types = (Object.keys(DISCLOSURE_LABEL) as DisclosureType[]).map((t) => {
    const list = state.answers.filter((a) => a.type === t);
    return { t, n: list.length, rate: list.length ? list.filter((a) => a.correct).length / list.length : 0 };
  });
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col gap-4 py-8 lg:flex">
      <div className="flex flex-wrap items-center gap-2 text-[15px] font-bold">
        <LevelChip />
        <span className="inline-flex h-[34px] items-center rounded-full border border-line px-3">
          <Stats />
        </span>
      </div>
      <section className="rounded-2xl border border-line p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display">오늘의 목표</h2>
          <span className="num text-[13px] text-muted">
            {Math.min(progress.todayXp, DAILY_GOAL_XP)} / {DAILY_GOAL_XP} XP
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-line-soft">
          <div className="h-full rounded-full bg-gold" style={{ width: `${goal * 100}%` }} />
        </div>
        <p className="mt-3 text-[13px] text-muted">
          {left ? `${left} XP만 더 모으면 목표 달성이에요.` : "오늘 목표를 달성했어요."}
        </p>
      </section>
      <section className="rounded-2xl border border-line p-5">
        <h2 className="font-display">공시 유형별 정답률</h2>
        <ul className="mt-3 space-y-2.5 text-[13px]">
          {types.map(({ t, n, rate }) => (
            <li key={t} className="grid grid-cols-[72px_1fr_40px] items-center gap-2">
              <span>{DISCLOSURE_LABEL[t]}</span>
              <span className="h-2 overflow-hidden rounded-full bg-line-soft">
                <span
                  className={`block h-full rounded-full ${rate >= 0.5 ? "bg-accent" : "bg-gold"}`}
                  style={{ width: `${rate * 100}%` }}
                />
              </span>
              <span className="num text-right font-bold">{n ? `${Math.round(rate * 100)}%` : "-"}</span>
            </li>
          ))}
        </ul>
        <Link href="/play" className="mt-3 inline-block text-[13px] font-bold text-accent">
          모의투자로 연습하기
        </Link>
      </section>
    </aside>
  );
}

/** 화면 뼈대: 모바일은 위·아래 바, 넓은 화면은 3단 */
export function AppShell({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const path = usePathname();
  const mounted = useMounted();
  const focusMode = useFocusMode();
  const focus = isFocusRoute(path) || focusMode;
  return (
    <>
      <TopBar />
      <div
        className={`mx-auto w-full flex-1 ${
          focus ? "" : "lg:grid lg:max-w-6xl lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:gap-10 lg:px-8"
        }`}
      >
        {!focus && <Sidebar />}
        <div className={`mx-auto w-full max-w-xl px-5 ${focus ? "pt-2" : "pt-4 pb-28 lg:pt-8 lg:pb-12"}`}>
          <main>{children}</main>
          {!focus && footer}
        </div>
        {!focus && mounted && <RightRail />}
      </div>
      <BottomTabs />
    </>
  );
}
