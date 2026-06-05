// 사이드이펙트 모듈: API 라우트가 로드될 때 스케줄러를 1회 시작한다.
// (instrumentation 대신 사용 — 라우트는 node 런타임이라 node:sqlite 등이 정상 동작)
import { startScheduler } from "./scheduler";

startScheduler();
