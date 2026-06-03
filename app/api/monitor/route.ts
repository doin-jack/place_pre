import { NextRequest, NextResponse } from "next/server";
import {
  addRegistration,
  deleteRegistration,
  listRegistrations,
} from "../../lib/db";
import { checkAndStore, parseKeywords } from "../../lib/monitor";

export const runtime = "nodejs";

// 등록 목록 + 스냅샷 전체 조회
export async function GET() {
  try {
    return NextResponse.json({ registrations: listRegistrations() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 등록: { placeId, keywords: "a, b, c", group? }
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      placeId?: string;
      keywords?: string;
      group?: string;
    };
    const placeId = body.placeId?.trim();
    const keywords = parseKeywords(body.keywords ?? "");
    const group = body.group?.trim() || "기본";

    if (!placeId) {
      return NextResponse.json({ error: "플레이스 ID를 입력하세요." }, { status: 400 });
    }
    if (keywords.length === 0) {
      return NextResponse.json(
        { error: "키워드를 1개 이상 입력하세요. (콤마로 여러 개)" },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    for (const keyword of keywords) {
      const id = addRegistration(placeId, keyword, group);
      try {
        await checkAndStore(id, keyword, placeId);
      } catch (e) {
        errors.push(`${keyword}: ${e instanceof Error ? e.message : "조회 실패"}`);
      }
    }

    return NextResponse.json({
      registrations: listRegistrations(),
      errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "등록 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 삭제: ?id=123
export async function DELETE(req: NextRequest) {
  try {
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }
    deleteRegistration(id);
    return NextResponse.json({ registrations: listRegistrations() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "삭제 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
