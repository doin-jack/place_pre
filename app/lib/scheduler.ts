// 앱 내부 일일 스케줄러 (의존성 없음, setTimeout 기반).
// 서버 부팅 시 1회 등록되어 매일 지정 시각(기본 09:00, 서버 로컬시간)에
// 전체 키워드를 재검색해 그날 스냅샷을 저장한다.
// 운영 시 Railway 환경변수 TZ=Asia/Seoul 설정 권장 (로컬시간=KST 정렬).
import { listRegistrations } from "./db";
import { checkAndStore } from "./monitor";

const g = globalThis as unknown as {
  __monitorTimer?: ReturnType<typeof setTimeout>;
  __monitorStarted?: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");

function msUntilNext(hour: number, minute: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

function scheduleNext(hour: number, minute: number): void {
  const delay = msUntilNext(hour, minute);
  g.__monitorTimer = setTimeout(() => {
    void runDailyCheck().finally(() => scheduleNext(hour, minute));
  }, delay);
  const mins = Math.round(delay / 60000);
  console.log(`[scheduler] 다음 실행까지 약 ${mins}분 (${pad(hour)}:${pad(minute)})`);
}

export function startScheduler(): void {
  if (g.__monitorStarted) return; // 중복 등록 방지 (dev 핫리로드 등)
  g.__monitorStarted = true;

  const hour = Number(process.env.CRON_HOUR ?? 9);
  const minute = Number(process.env.CRON_MINUTE ?? 0);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    console.error("[scheduler] CRON_HOUR/CRON_MINUTE 값이 올바르지 않습니다.");
    return;
  }

  console.log(
    `[scheduler] 매일 ${pad(hour)}:${pad(minute)} 자동 체크 활성화 (TZ=${
      process.env.TZ || "서버 기본"
    })`
  );
  scheduleNext(hour, minute);
}

/** 등록된 모든 키워드를 재검색하고 오늘자 스냅샷 저장 */
export async function runDailyCheck(): Promise<{ ok: number; fail: number }> {
  const regs = listRegistrations();
  console.log(`[scheduler] 일일 체크 시작: ${regs.length}건`);
  let ok = 0;
  let fail = 0;
  for (const reg of regs) {
    try {
      await checkAndStore(reg.id, reg.keyword, reg.placeId);
      ok++;
    } catch (e) {
      fail++;
      console.error(
        `[scheduler] '${reg.keyword}' 실패:`,
        e instanceof Error ? e.message : e
      );
    }
  }
  console.log(`[scheduler] 일일 체크 완료: 성공 ${ok} / 실패 ${fail}`);
  return { ok, fail };
}
