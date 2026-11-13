"use client";

import { Check, Cloud, Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { units } from "@/data/course";
import { glossary } from "@/data/glossary";
import { FREE_PLAYS_PER_DAY, isFreeLesson, rememberReturn, useGate, type GateReason } from "@/lib/gate";

const BTN = "flex h-[52px] w-full items-center justify-center rounded-[14px] text-base font-black";

const COPY: Record<GateReason, { title: string; body: string }> = {
  unit: {
    title: "2단원부터는 가입하고 이어서 해요",
    body: `1단원은 가입 없이 끝까지 할 수 있어요. 가입하면 지금까지 쌓은 진도가 그대로 옮겨지고 나머지 ${units.length - 1}개 단원이 열려요.`,
  },
  review: {
    title: "복습은 가입하고 쓸 수 있어요",
    body: "틀린 문제만 모아 다시 풀고 하트를 채우는 기능이에요. 가입하면 지금까지 틀린 문제가 그대로 남아 있어요.",
  },
  words: {
    title: "다음 세트는 가입하고 풀어요",
    body: `레벨마다 첫 세트는 가입 없이 풀 수 있어요. 가입하면 용어 ${glossary.length.toLocaleString("ko-KR")}개와 실전 문제를 모두 공부할 수 있어요.`,
  },
  play: {
    title: `오늘 무료 ${FREE_PLAYS_PER_DAY}판을 다 했어요`,
    body: `가입 없이는 하루 ${FREE_PLAYS_PER_DAY}판까지 할 수 있어요. 가입하면 지금 바로 이어서, 횟수 제한 없이 할 수 있어요.`,
  },
};

const PERKS = ["모든 단원과 용어 세트가 열려요", "지금까지 쌓은 기록이 그대로 옮겨져요", "폰·PC 어디서든 이어서 할 수 있어요"];

function SignupLink({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <Link href="/account" onClick={() => rememberReturn(path)} className={`${BTN} bg-accent text-white`}>
      {children}
    </Link>
  );
}

function GateBody({ reason, headingId }: { reason: GateReason; headingId: string }) {
  const c = COPY[reason];
  return (
    <>
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Lock size={28} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <h2 id={headingId} className="font-display text-[22px] leading-snug">
        {c.title}
      </h2>
      <p className="text-[15px] text-muted">{c.body}</p>
      <ul className="flex flex-col gap-1.5 text-sm">
        {PERKS.map((t) => (
          <li key={t} className="flex items-center gap-2">
            <Check size={16} className="shrink-0 text-accent" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
    </>
  );
}

/** 화면 전체를 대신하는 가입 안내 (회원 전용 화면에 직접 들어왔을 때) */
export function SignupGate({ reason, back = "/", backLabel = "학습으로 돌아가기" }: {
  reason: GateReason;
  back?: string;
  backLabel?: string;
}) {
  return (
    <section aria-labelledby="gate-title" className="flex flex-col gap-4 rounded-[20px] border-2 border-line p-6">
      <GateBody reason={reason} headingId="gate-title" />
      <div className="mt-2 flex flex-col gap-2">
        <SignupLink>가입하고 계속하기</SignupLink>
        <Link href={back} className="flex h-12 items-center justify-center text-[15px] font-bold text-accent">
          {backLabel}
        </Link>
      </div>
    </section>
  );
}

/** 잠긴 항목을 눌렀을 때 아래에서 올라오는 가입 안내 */
export function SignupSheet({ reason, onClose }: { reason: GateReason; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-[rgba(18,22,28,0.45)]"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-sheet-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-xl flex-col gap-4 rounded-t-3xl bg-bg px-5 pt-6 pb-8"
      >
        <GateBody reason={reason} headingId="gate-sheet-title" />
        <div className="mt-2 flex flex-col gap-2">
          <SignupLink>가입하고 계속하기</SignupLink>
          <button onClick={onClose} autoFocus className="h-12 text-[15px] font-bold text-muted">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

/** 레슨 주소로 바로 들어와도 1단원 밖이면 가입 안내를 보여준다 */
export function LessonGate({ lessonId, children }: { lessonId: string; children: ReactNode }) {
  const gate = useGate();
  if (!gate.ready) return <div className="h-96 animate-pulse rounded-2xl bg-line-soft" />;
  if (gate.guest && !isFreeLesson(lessonId))
    return (
      <div className="pt-10">
        <SignupGate reason="unit" />
      </div>
    );
  return <>{children}</>;
}

/** 레슨을 끝낸 비회원에게 보여주는 가벼운 권유 (닫을 수 있다) */
export function SignupNudge({ xp, onLater }: { xp: number; onLater: () => void }) {
  return (
    <section aria-labelledby="nudge-title" className="flex w-full flex-col gap-3 rounded-2xl bg-accent-soft p-4">
      <div className="flex items-start gap-3">
        <Cloud size={24} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
        <div>
          <h2 id="nudge-title" className="font-display text-[15px] text-accent-ink">
            지금 가입하면 오늘 기록이 저장돼요
          </h2>
          <p className="mt-0.5 text-[13px] text-muted">
            지금까지 쌓은 {xp} XP가 그대로 옮겨지고, 2단원부터 이어서 할 수 있어요.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <SignupLink>가입하기</SignupLink>
        <button onClick={onLater} className="h-[52px] rounded-[14px] px-4 text-[15px] font-bold text-muted">
          나중에
        </button>
      </div>
    </section>
  );
}
