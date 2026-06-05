import { NextRequest, NextResponse } from "next/server";
import { analyzePlace } from "../../lib/place";
import "../../lib/ensure-scheduler";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("q")?.trim();
  const placeId = searchParams.get("id")?.trim() || null;

  if (!keyword) {
    return NextResponse.json({ error: "키워드(q)를 입력하세요." }, { status: 400 });
  }

  try {
    const result = await analyzePlace(keyword, placeId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "조회 실패";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
