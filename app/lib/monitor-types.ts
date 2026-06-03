// 클라이언트/서버 공용 타입 (런타임 의존성 없음 — node:sqlite import 금지)

export interface SnapshotRow {
  date: string; // YYYY-MM-DD
  checkedAt: string; // ISO timestamp
  rank: number | null;
  n1: number | null;
  n2: number | null;
  n3: number | null;
  blogReview: number | null;
  visitorReview: number | null;
  total: number | null; // 경쟁 업체수
  competition: number | null; // C
  name: string | null;
  keywords: string[];
  monthlyVolume: number | null; // 월 검색량 (추후 외부 API 연동)
}

export interface RegistrationRow {
  id: number;
  placeId: string;
  keyword: string;
  group: string;
  registeredAt: string;
  snapshots: SnapshotRow[]; // date 내림차순
}
