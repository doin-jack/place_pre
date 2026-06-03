import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = "https://place.diccmain.workers.dev/api";
const MAX_PAGE = 3; // 최대 90위까지 (page 1~3, 페이지당 30개)

export interface PlaceItem {
  rank: number;
  id: string;
  name: string;
  category: string;
  n0: number;
  n1: number;
  n2: number;
  n3: number;
  blogReview: number;
  textReview: number;
  rcptReview: number;
  reviewScore: number | null;
  keywords: string[];
}

interface UpstreamResponse {
  keyword: string;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  count: number;
  C: number;
  items: PlaceItem[];
}

export interface AnalyzeResult {
  keyword: string;
  total: number;
  totalPages: number;
  competition: number; // C
  defaultC: number;
  graphItems: PlaceItem[]; // 상위 10개 — 그래프용
  top10: PlaceItem[]; // 상위 10개 (대표키워드 포함)
  myPlace: PlaceItem | null; // 입력한 플레이스 id 매칭 결과
  searchedPages: number; // 실제 조회한 페이지 수
}

const DEFAULT_C = 0.1868;

async function fetchPage(keyword: string, page: number): Promise<UpstreamResponse> {
  const url = `${UPSTREAM}?q=${encodeURIComponent(keyword)}&page=${page}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`upstream ${res.status} (page ${page})`);
  }
  return (await res.json()) as UpstreamResponse;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("q")?.trim();
  const placeId = searchParams.get("id")?.trim() || null;

  if (!keyword) {
    return NextResponse.json({ error: "키워드(q)를 입력하세요." }, { status: 400 });
  }

  try {
    // 1페이지 조회 (C, total 확보)
    const first = await fetchPage(keyword, 1);
    const collected: PlaceItem[] = [...first.items];
    let searchedPages = 1;
    const totalPages = first.totalPages;

    const findMine = () =>
      placeId ? collected.find((it) => it.id === placeId) ?? null : null;

    // 그래프는 상위 10개(1페이지)만 사용.
    // 내 플레이스를 못 찾으면 3페이지(90위)까지 순차 조회
    for (let page = 2; page <= MAX_PAGE; page++) {
      if (page > totalPages) break;

      const needForSearch = placeId !== null && findMine() === null;
      if (!needForSearch) break;

      const next = await fetchPage(keyword, page);
      collected.push(...next.items);
      searchedPages = page;

      if (findMine() !== null) break;
    }

    const result: AnalyzeResult = {
      keyword: first.keyword,
      total: first.total,
      totalPages: first.totalPages,
      competition: first.C,
      defaultC: DEFAULT_C,
      graphItems: collected.slice(0, 10),
      top10: collected.slice(0, 10),
      myPlace: findMine(),
      searchedPages,
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "조회 실패";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
