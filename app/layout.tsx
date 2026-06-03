import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "플레이스 순위·지수 분석툴",
  description: "키워드별 플레이스 순위, N지수, 경쟁강도(C) 분석",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
