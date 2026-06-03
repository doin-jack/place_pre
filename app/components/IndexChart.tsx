"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PlaceItem } from "../api/place/route";

interface Props {
  items: PlaceItem[];
  myRank: number | null;
}

interface TooltipPayload {
  payload: PlaceItem;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-lg">
      <p className="font-semibold text-gray-900">
        {p.rank}위 · {p.name}
      </p>
      <p className="text-gray-500">{p.category}</p>
      <div className="mt-1 space-y-0.5">
        <p className="text-emerald-600">n1: {p.n1.toFixed(6)}</p>
        <p className="text-sky-600">n2: {p.n2.toFixed(6)}</p>
        <p className="text-violet-600">n3: {p.n3.toFixed(6)}</p>
      </div>
    </div>
  );
}

function RankTick({
  x,
  y,
  payload,
  items,
  myRank,
}: {
  x?: number;
  y?: number;
  payload?: { index: number; value: number };
  items: PlaceItem[];
  myRank: number | null;
}) {
  if (x === undefined || y === undefined || !payload) return null;
  const item = items[payload.index];
  const name = item?.name ?? "";
  const short = name.length > 7 ? name.slice(0, 7) + "…" : name;
  const isMine = myRank !== null && item?.rank === myRank;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={14}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill={isMine ? "#ef4444" : "#374151"}
      >
        {payload.value}위
      </text>
      <text
        x={0}
        y={0}
        dy={30}
        textAnchor="middle"
        fontSize={10}
        fill={isMine ? "#ef4444" : "#9ca3af"}
      >
        {short}
      </text>
    </g>
  );
}

// 단일 축. 바닥(floor)을 값 범위에 비례해 충분히 내려서,
// 가장 작은 n1 막대도 항상 일정 높이(약 27%) 이상 보이게 한다.
// 같은 축이므로 n1·n2·n3 막대 높이의 직접 비교가 가능하다.
function fittedDomain(values: number[]): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || max * 0.1 || 1;
  const floor = Math.max(0, min - range * 0.4); // 최솟값 막대 ≈ 27% 높이
  const top = max + range * 0.1;
  return [floor, top];
}

export default function IndexChart({ items, myRank }: Props) {
  const domain = fittedDomain(items.flatMap((i) => [i.n1, i.n2, i.n3]));

  return (
    <div className="h-[420px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} margin={{ top: 28, right: 16, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" />
          <XAxis
            dataKey="rank"
            interval={0}
            tickLine={false}
            height={48}
            tick={<RankTick items={items} myRank={myRank} />}
          />
          <YAxis
            domain={domain}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            width={56}
            tickFormatter={(v: number) => v.toFixed(3)}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {myRank !== null && (
            <ReferenceLine
              x={myRank}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4 2"
              label={{
                value: "내 플레이스",
                fill: "#ef4444",
                fontSize: 11,
                fontWeight: 600,
                position: "insideTop",
                offset: -18,
              }}
            />
          )}
          <Bar dataKey="n1" name="n1" fill="#10b981" radius={[2, 2, 0, 0]} />
          <Bar dataKey="n2" name="n2" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
          <Bar dataKey="n3" name="n3" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
