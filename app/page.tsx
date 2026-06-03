"use client";

import { useState } from "react";
import Analyzer from "./components/Analyzer";
import MonitorTab from "./components/MonitorTab";

type Tab = "analyze" | "monitor";

export default function Home() {
  const [tab, setTab] = useState<Tab>("analyze");

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          📍 플레이스 분석툴
        </h1>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="mb-8 flex gap-1 border-b border-gray-200">
        <TabButton active={tab === "analyze"} onClick={() => setTab("analyze")}>
          순위 분석
        </TabButton>
        <TabButton active={tab === "monitor"} onClick={() => setTab("monitor")}>
          상위노출 정기체크
        </TabButton>
      </nav>

      {tab === "analyze" ? <Analyzer /> : <MonitorTab />}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "border-gray-900 text-gray-900"
          : "border-transparent text-gray-400 hover:text-gray-600"
      }`}
    >
      {children}
    </button>
  );
}
