// 등록 항목을 현재 시점으로 조회해 오늘자 스냅샷을 저장하는 헬퍼 (서버 전용)
import { analyzePlace } from "./place";
import { upsertSnapshot, todayStr, type SnapshotRow } from "./db";

export async function checkAndStore(
  registrationId: number,
  keyword: string,
  placeId: string
): Promise<SnapshotRow> {
  const result = await analyzePlace(keyword, placeId);
  const mp = result.myPlace;

  const snap: SnapshotRow = {
    date: todayStr(),
    checkedAt: new Date().toISOString(),
    rank: mp ? mp.rank : null,
    n1: mp ? mp.n1 : null,
    n2: mp ? mp.n2 : null,
    n3: mp ? mp.n3 : null,
    blogReview: mp ? mp.blogReview : null,
    visitorReview: mp ? mp.textReview : null,
    total: result.total,
    competition: result.competition,
    name: mp ? mp.name : null,
    keywords: mp ? mp.keywords : [],
    monthlyVolume: null, // 추후 외부 검색량 API 연동
  };

  upsertSnapshot(registrationId, snap);
  return snap;
}

/** "병마피부과, 강남피부과" → ["병마피부과","강남피부과"] (트림/중복 제거) */
export function parseKeywords(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const k = part.trim();
    if (k && !seen.has(k)) {
      seen.add(k);
      out.push(k);
    }
  }
  return out;
}
