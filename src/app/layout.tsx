import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { SyncProvider } from "@/components/Account";
import { AppShell } from "@/components/Nav";
import "./globals.css";

const noto = Noto_Sans_KR({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "티끌 · 공시 공부",
  description: "모으면 태산이 되는 공시 공부. 주식·경제 흐름을 하루 몇 분씩 게임처럼 배워요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${noto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <SyncProvider />
        <AppShell
          footer={
            <footer className="pt-10 text-center text-xs text-muted">
              예시 문제와 실제 과거 공시가 함께 나와요. 투자 권유가 아닙니다.
            </footer>
          }
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
