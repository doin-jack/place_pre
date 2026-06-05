// SQLite 영속 저장 레이어 (Node 24 내장 node:sqlite 사용, 네이티브 의존성 없음)
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import type { SnapshotRow, RegistrationRow } from "./monitor-types";

export type { SnapshotRow, RegistrationRow } from "./monitor-types";

interface SnapshotDbRow {
  date: string;
  checked_at: string;
  rank: number | null;
  n1: number | null;
  n2: number | null;
  n3: number | null;
  blog_review: number | null;
  visitor_review: number | null;
  total: number | null;
  competition: number | null;
  name: string | null;
  keywords: string | null;
  monthly_volume: number | null;
}

interface RegDbRow {
  id: number;
  place_id: string;
  keyword: string;
  group_name: string;
  registered_at: string;
}

const g = globalThis as unknown as { __placeMonitorDb?: DatabaseSync };

function getDb(): DatabaseSync {
  if (g.__placeMonitorDb) return g.__placeMonitorDb;

  // 운영(Railway 등)에서는 영구 Volume 경로를 DATABASE_DIR로 지정한다.
  // 미지정 시 로컬 ./data 로 폴백.
  const dataDir = process.env.DATABASE_DIR || path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const db = new DatabaseSync(path.join(dataDir, "monitor.db"));
  db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id      TEXT NOT NULL,
      keyword       TEXT NOT NULL,
      group_name    TEXT NOT NULL DEFAULT '기본',
      registered_at TEXT NOT NULL,
      UNIQUE(place_id, keyword)
    );
    CREATE TABLE IF NOT EXISTS snapshots (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id INTEGER NOT NULL,
      date            TEXT NOT NULL,
      checked_at      TEXT NOT NULL,
      rank            INTEGER,
      n1              REAL,
      n2              REAL,
      n3              REAL,
      blog_review     INTEGER,
      visitor_review  INTEGER,
      total           INTEGER,
      competition     REAL,
      name            TEXT,
      keywords        TEXT,
      monthly_volume  INTEGER,
      UNIQUE(registration_id, date),
      FOREIGN KEY(registration_id) REFERENCES registrations(id) ON DELETE CASCADE
    );
  `);
  db.exec("PRAGMA foreign_keys = ON;");

  g.__placeMonitorDb = db;
  return db;
}

export function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function mapSnapshot(r: SnapshotDbRow): SnapshotRow {
  return {
    date: r.date,
    checkedAt: r.checked_at,
    rank: r.rank,
    n1: r.n1,
    n2: r.n2,
    n3: r.n3,
    blogReview: r.blog_review,
    visitorReview: r.visitor_review,
    total: r.total,
    competition: r.competition,
    name: r.name,
    keywords: r.keywords ? (JSON.parse(r.keywords) as string[]) : [],
    monthlyVolume: r.monthly_volume,
  };
}

export function listRegistrations(): RegistrationRow[] {
  const db = getDb();
  const regs = db
    .prepare("SELECT * FROM registrations ORDER BY id ASC")
    .all() as unknown as RegDbRow[];
  const snapStmt = db.prepare(
    "SELECT * FROM snapshots WHERE registration_id = ? ORDER BY date DESC"
  );
  return regs.map((reg) => {
    const snaps = snapStmt.all(reg.id) as unknown as SnapshotDbRow[];
    return {
      id: reg.id,
      placeId: reg.place_id,
      keyword: reg.keyword,
      group: reg.group_name,
      registeredAt: reg.registered_at,
      snapshots: snaps.map(mapSnapshot),
    };
  });
}

/** 등록 추가(중복 시 기존 id 반환). 반환: registration id */
export function addRegistration(
  placeId: string,
  keyword: string,
  group: string
): number {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM registrations WHERE place_id = ? AND keyword = ?")
    .get(placeId, keyword) as { id: number } | undefined;
  if (existing) return existing.id;

  const info = db
    .prepare(
      "INSERT INTO registrations (place_id, keyword, group_name, registered_at) VALUES (?, ?, ?, ?)"
    )
    .run(placeId, keyword, group, new Date().toISOString());
  return Number(info.lastInsertRowid);
}

export function deleteRegistration(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM snapshots WHERE registration_id = ?").run(id);
  db.prepare("DELETE FROM registrations WHERE id = ?").run(id);
}

export function getRegistration(id: number): RegDbRow | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM registrations WHERE id = ?").get(id) as
    | RegDbRow
    | undefined;
}

/** 해당 날짜 스냅샷 upsert (같은 날짜면 갱신) */
export function upsertSnapshot(
  registrationId: number,
  snap: SnapshotRow
): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO snapshots
      (registration_id, date, checked_at, rank, n1, n2, n3, blog_review, visitor_review, total, competition, name, keywords, monthly_volume)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(registration_id, date) DO UPDATE SET
       checked_at=excluded.checked_at, rank=excluded.rank,
       n1=excluded.n1, n2=excluded.n2, n3=excluded.n3,
       blog_review=excluded.blog_review, visitor_review=excluded.visitor_review,
       total=excluded.total, competition=excluded.competition,
       name=excluded.name, keywords=excluded.keywords,
       monthly_volume=excluded.monthly_volume`
  ).run(
    registrationId,
    snap.date,
    snap.checkedAt,
    snap.rank,
    snap.n1,
    snap.n2,
    snap.n3,
    snap.blogReview,
    snap.visitorReview,
    snap.total,
    snap.competition,
    snap.name,
    JSON.stringify(snap.keywords),
    snap.monthlyVolume
  );
}
