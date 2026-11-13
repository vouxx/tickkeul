"use client";

import { Check, ChevronLeft, ChevronRight, Cloud, LogIn, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { levelInfo } from "@/data/levels";
import {
  sendPasswordReset,
  signInWithPassword,
  signInWithProvider,
  signOut,
  signUpWithPassword,
  startAccount,
  syncNow,
  updatePassword,
  useAccount,
} from "@/lib/account";
import { takeReturn } from "@/lib/gate";
import { useProgress } from "@/lib/progress";
import { fetchAuthProviders, supabaseConfigured, type Provider } from "@/lib/supabase";

/** 레이아웃에 한 번 두는 동기화 시작점 (화면에는 아무것도 그리지 않는다) */
export function SyncProvider() {
  useEffect(() => startAccount(), []);
  return null;
}

/** 홈에서 아직 로그인 안 한 사람에게 백업 권유 */
export function BackupBanner() {
  const acc = useAccount();
  const { progress } = useProgress();
  if (!supabaseConfigured || !acc.ready || acc.user || progress.xp === 0) return null;
  return (
    <Link href="/account" className="flex items-center gap-3 rounded-2xl bg-accent-soft p-4 text-sm">
      <Cloud size={24} className="shrink-0 text-accent" aria-hidden="true" />
      <span className="flex-1">
        <b className="text-accent-ink">회원가입하고 진도를 저장하세요</b>
        <span className="block text-xs text-muted">
          지금까지 쌓은 {progress.xp} XP가 그대로 옮겨지고, 다른 기기에서도 이어서 할 수 있어요.
        </span>
      </span>
      <ChevronRight size={20} className="shrink-0 text-muted" aria-hidden="true" />
    </Link>
  );
}

const PROVIDER_STYLE: Record<Provider, { label: string; cls: string; icon: typeof LogIn }> = {
  kakao: { label: "카카오로 계속하기", cls: "bg-[#FEE500] text-[#191919]", icon: MessageCircle },
  google: { label: "Google로 계속하기", cls: "border-2 border-line", icon: LogIn },
  github: { label: "GitHub로 계속하기", cls: "border-2 border-line", icon: LogIn },
};

const MIN_PASSWORD = 8;
const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);
const inputCls =
  "mt-1.5 h-12 w-full rounded-xl border-2 border-line bg-bg px-3.5 text-[15px] font-normal text-fg outline-none focus:border-accent";
const BTN = "flex h-[52px] w-full items-center justify-center rounded-[14px] text-base font-black";

function BackHeader({ href, title }: { href: string; title?: string }) {
  return (
    <header className="flex items-center gap-2">
      <Link href={href} aria-label="뒤로" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-xl">
        <ChevronLeft size={24} aria-hidden="true" />
      </Link>
      {title && <h1 className="font-display text-[22px]">{title}</h1>}
    </header>
  );
}

export function AccountPage() {
  const acc = useAccount();
  const [providers, setProviders] = useState<Record<"email" | Provider, boolean> | null>(null);
  const router = useRouter();
  const signedIn = !!acc.user;

  // 잠긴 화면에서 가입하러 왔다면, 로그인되는 순간 그 화면으로 돌려보낸다
  useEffect(() => {
    if (!signedIn) return;
    const next = takeReturn();
    if (next) router.replace(next);
  }, [signedIn, router]);

  useEffect(() => {
    let alive = true;
    void fetchAuthProviders().then((p) => alive && setProviders(p));
    return () => {
      alive = false;
    };
  }, []);

  if (!supabaseConfigured) {
    return (
      <div className="flex flex-col gap-4">
        <BackHeader href="/me" title="내 계정" />
        <div className="rounded-2xl border-2 border-line p-6">
          <h2 className="font-display text-xl">계정 연결 준비가 안 됐어요</h2>
          <p className="mt-2 text-sm text-muted">
            .env.local에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 넣으면 회원가입과 진도 저장이
            켜져요. 그전까지는 이 브라우저에만 저장돼요.
          </p>
        </div>
      </div>
    );
  }

  if (!acc.ready) return <div className="h-64 animate-pulse rounded-2xl bg-line-soft" />;
  if (acc.recovery) return <NewPassword />;
  if (acc.user) return <SignedIn />;

  // 카카오·구글은 대시보드에서 켜져 있을 때만 버튼으로 보여준다
  const oauth = (["kakao", "google"] as Provider[]).filter((p) => providers?.[p]);

  return (
    <div className="flex flex-col gap-6">
      <BackHeader href="/me" />
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-2xl leading-snug">
          회원가입하고
          <br />
          진도를 저장하세요
        </h1>
        <ul className="flex flex-col gap-1.5 text-sm text-muted">
          {["폰·PC 어디서든 이어서 공부할 수 있어요", "브라우저 기록을 지워도 진도가 남아요"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check size={16} className="shrink-0 text-accent" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      {oauth.length > 0 && (
        <>
          <div className="flex flex-col gap-2.5">
            {oauth.map((p) => {
              const Icon = PROVIDER_STYLE[p].icon;
              return (
                <button
                  key={p}
                  onClick={() => void signInWithProvider(p)}
                  className={`flex h-[52px] items-center justify-center gap-2 rounded-[14px] text-[15px] font-bold ${PROVIDER_STYLE[p].cls}`}
                >
                  <Icon size={18} aria-hidden="true" />
                  {PROVIDER_STYLE[p].label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 text-[13px] text-muted">
            <span className="h-px flex-1 bg-line" />
            또는 이메일로
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      {acc.error && <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn-ink">{acc.error}</p>}
      <PasswordAuth />
    </div>
  );
}

type Mode = "login" | "signup" | "reset";

function PasswordAuth() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setNotice(null);
  };

  const submit = async () => {
    setError(null);
    setNotice(null);
    const e = email.trim();
    if (!isEmail(e)) return setError("이메일 주소를 확인해주세요.");
    if (mode !== "reset" && password.length < MIN_PASSWORD)
      return setError(`비밀번호는 ${MIN_PASSWORD}자 이상으로 정해주세요.`);
    if (mode === "signup" && password !== confirm) return setError("비밀번호가 서로 달라요.");

    setBusy(true);
    if (mode === "login") {
      setError(await signInWithPassword(e, password));
    } else if (mode === "signup") {
      const r = await signUpWithPassword(e, password);
      if (r.error) setError(r.error);
      else if (r.needsConfirm)
        setNotice(`${e}로 가입 확인 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나고 자동으로 로그인돼요.`);
    } else {
      const err = await sendPasswordReset(e);
      if (err) setError(err);
      else setNotice(`${e}로 비밀번호 재설정 링크를 보냈어요. 링크를 누르면 새 비밀번호를 정할 수 있어요.`);
    }
    setBusy(false);
  };

  const submitLabel = { login: "로그인", signup: "회원가입", reset: "재설정 링크 받기" }[mode];

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="이메일 계정" className="grid grid-cols-3 rounded-xl bg-line-soft p-1 text-sm">
        {(
          [
            ["login", "로그인"],
            ["signup", "회원가입"],
            ["reset", "비밀번호 찾기"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={`rounded-lg py-2 ${mode === m ? "bg-bg font-bold" : "text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        noValidate
        className="flex flex-col gap-3"
        onSubmit={(ev) => {
          ev.preventDefault();
          void submit();
        }}
      >
        <label className="text-[13px] font-bold text-muted">
          이메일
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputCls}
          />
        </label>
        {mode !== "reset" && (
          <label className="text-[13px] font-bold text-muted">
            비밀번호 {mode === "signup" && <span className="font-normal">({MIN_PASSWORD}자 이상)</span>}
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </label>
        )}
        {mode === "signup" && (
          <label className="text-[13px] font-bold text-muted">
            비밀번호 확인
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputCls}
            />
          </label>
        )}
        {mode === "reset" && <p className="text-[13px] text-muted">가입한 이메일로 비밀번호 재설정 링크를 보내드려요.</p>}
        <button
          type="submit"
          disabled={busy}
          className={`${BTN} mt-1 bg-accent text-white disabled:opacity-50`}
        >
          {busy ? "잠시만요…" : submitLabel}
        </button>
      </form>

      {error && <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn-ink">{error}</p>}
      {notice && (
        <p className="rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">
          <Mail size={15} className="mr-1 inline -mt-0.5" aria-hidden="true" />
          {notice}
        </p>
      )}
    </div>
  );
}

/** 비밀번호 재설정 메일 링크로 들어왔을 때 */
function NewPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (password.length < MIN_PASSWORD) return setError(`비밀번호는 ${MIN_PASSWORD}자 이상으로 정해주세요.`);
    if (password !== confirm) return setError("비밀번호가 서로 달라요.");
    setBusy(true);
    setError(await updatePassword(password));
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl">새 비밀번호 정하기</h1>
      <form
        noValidate
        className="flex flex-col gap-3"
        onSubmit={(ev) => {
          ev.preventDefault();
          void submit();
        }}
      >
        <label className="text-[13px] font-bold text-muted">
          새 비밀번호 <span className="font-normal">({MIN_PASSWORD}자 이상)</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="text-[13px] font-bold text-muted">
          새 비밀번호 확인
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
          />
        </label>
        <button type="submit" disabled={busy} className={`${BTN} mt-1 bg-accent text-white disabled:opacity-50`}>
          비밀번호 바꾸기
        </button>
      </form>
      {error && <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn-ink">{error}</p>}
    </div>
  );
}

function SignedIn() {
  const acc = useAccount();
  const { progress } = useProgress();
  if (!acc.user) return null;
  const provider = acc.user.provider ?? "email";
  const providerName = provider === "kakao" ? "카카오" : provider === "google" ? "Google" : "이메일";
  return (
    <div className="flex flex-col gap-4">
      <BackHeader href="/me" title="내 계정" />

      <section className="flex items-center gap-3 rounded-[20px] border border-line p-4">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-black ${
            provider === "kakao" ? "bg-[#FEE500] text-[#191919]" : "bg-accent-soft text-accent-ink"
          }`}
        >
          {providerName.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <span className="block text-xs text-muted">로그인 계정 · {providerName}</span>
          <strong className="block truncate text-[15px]">{acc.user.email ?? "이메일 없음"}</strong>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[20px] border border-line p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[15px]">진도 클라우드 저장</h2>
          {acc.sync === "synced" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-1 text-[13px] font-bold text-accent-ink">
              <Check size={14} aria-hidden="true" />
              저장됨
            </span>
          )}
          {acc.sync === "syncing" && (
            <span className="rounded-full bg-line-soft px-2 py-1 text-[13px] font-bold text-muted">동기화 중…</span>
          )}
          {acc.sync === "error" && (
            <span className="rounded-full bg-warn-soft px-2 py-1 text-[13px] font-bold text-warn-ink">오류</span>
          )}
        </div>
        <p className="text-[13px] text-muted">
          학습하면 몇 초 안에 자동으로 저장돼요.
          {acc.lastSyncedAt &&
            ` 마지막 저장 ${new Date(acc.lastSyncedAt).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" })}`}
        </p>
        {acc.error && <p className="rounded-lg bg-warn-soft p-2 text-sm text-warn-ink">{acc.error}</p>}
        <button
          onClick={() => void syncNow()}
          className="self-start rounded-xl border border-line px-3 py-2 text-[13px] font-bold text-accent"
        >
          지금 저장하기
        </button>
      </section>

      <section className="overflow-hidden rounded-[20px] border border-line">
        <Link href="/level" className="flex items-center justify-between border-b border-line-soft px-5 py-4 text-[15px]">
          내 레벨 바꾸기
          <span className="text-sm text-muted">{progress.level ? levelInfo(progress.level).name : "정하기"}</span>
        </Link>
        <Link href="/records" className="flex items-center justify-between px-5 py-4 text-[15px]">
          모의투자 기록
          <ChevronRight size={18} className="text-muted" aria-hidden="true" />
        </Link>
      </section>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => void signOut()}
          className="h-[52px] rounded-[14px] border-2 border-line text-[15px] font-bold text-muted"
        >
          로그아웃
        </button>
        <p className="text-center text-xs text-muted">로그아웃해도 이 기기의 진도는 그대로 남아요.</p>
      </div>
    </div>
  );
}
