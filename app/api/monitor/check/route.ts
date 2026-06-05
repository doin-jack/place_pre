import { NextRequest, NextResponse } from "next/server";
import { getRegistration, listRegistrations } from "../../../lib/db";
import { checkAndStore } from "../../../lib/monitor";
import "../../../lib/ensure-scheduler";

export const runtime = "nodejs";

// 재검색: { id } 면 해당 항목만, 없으면 전체 재검색 후 오늘자 스냅샷 갱신
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { id?: number };
    const errors: string[] = [];

    if (body.id) {
      const reg = getRegistration(body.id);
      if (!reg) {
        return NextResponse.json({ error: "등록 항목 없음" }, { status: 404 });
      }
      try {
        await checkAndStore(reg.id, reg.keyword, reg.place_id);
      } catch (e) {
        errors.push(`${reg.keyword}: ${e instanceof Error ? e.message : "조회 실패"}`);
      }
    } else {
      for (const reg of listRegistrations()) {
        try {
          await checkAndStore(reg.id, reg.keyword, reg.placeId);
        } catch (e) {
          errors.push(
            `${reg.keyword}: ${e instanceof Error ? e.message : "조회 실패"}`
          );
        }
      }
    }

    return NextResponse.json({ registrations: listRegistrations(), errors });
  } catch (err) {
    const message = err instanceof Error ? err.message : "재검색 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
