// // src/content/metrics.ts
// // Initial + Incremental(무한 스크롤) 텍스트 계측
// declare global { interface Window { __cv_hist_patched__?: boolean } }

// type MetricPayload = {
//   url: string;
//   routeId: string;
//   kind: "INIT" | "INCR";
//   charCount: number;
//   textNodes: number;
//   // 증분 전송 시에는 누적 대비 증가분
//   deltaChar?: number;
//   deltaNodes?: number;
//   sampleHash?: string;
//   elapsedCollectMs?: number;   // INIT만
//   elapsedFromNavMs?: number;   // INIT만
//   elapsedSinceRouteMs?: number;
//   ts: number;
// };

// let navStart = performance.now();
// let currentUrl = location.href;
// let scheduled: number | null = null;

// // 중복 방지 & 세션 관리
// let routeId = makeRouteId();
// let lastInitSentFor = "";            // url@routeId
// let initCooldownMs = 1200;           // INIT는 이 시간 내 중복 방지
// let lastInitSentAt = 0;

// // 증분(무한스크롤) 관측
// let mo: MutationObserver | null = null;
// let incrTimer: number | null = null;
// const incrWindowMs = 2000;           // 2초마다 배치 전송
// const incrThresholdChars = 10000;    // 1만자 증가 시 즉시 전송
// let baseChars = 0;
// let baseNodes = 0;
// let pendingDeltaChars = 0;
// let pendingDeltaNodes = 0;

// let routeStartTs = Date.now();

// // 유튜브/네이버용 타깃 셀렉터(필요 시 늘리기)
// const TARGET_SELECTORS = [
//   "#contents",                          // 유튜브 피드/검색/채널
//   "ytd-app",                            // 유튜브 전체 앱 루트
//   ".newsct_article", ".end_photo",      // 네이버 뉴스 본문/이미지 블럭
//   "main", "article", "#content", "body" // 일반 fallback
// ];

// export function initCvMetrics() {
//   navStart = performance.now();
//   routeStartTs = Date.now();
//   currentUrl = location.href;
//   routeId = makeRouteId();

//   patchHistoryForSpa();
//   attachSiteSpecificEvents(); // 유튜브 전용 이벤트 훅
//   attachOnLoad();
//   scheduleMeasure(); // 초기 한 번
// }

// function patchHistoryForSpa() {
//   if (window.__cv_hist_patched__) return;
//   window.__cv_hist_patched__ = true;

//   const push = history.pushState;
//   const replace = history.replaceState;

//   const onRoute = () => {
//     // 라우트 교체 → 세션 리셋
//     navStart = performance.now();
//     routeStartTs = Date.now();
//     currentUrl = location.href;
//     routeId = makeRouteId();
//     lastInitSentFor = "";
//     baseChars = 0; baseNodes = 0;
//     pendingDeltaChars = 0; pendingDeltaNodes = 0;
//     stopIncrementalObserver();
//     scheduleMeasure();
//   };

//   history.pushState = ((...args: Parameters<typeof history.pushState>) => {
//     const r = push.apply(history, args);
//     onRoute();
//     return r;
//   }) as typeof history.pushState;

//   history.replaceState = ((...args: Parameters<typeof history.replaceState>) => {
//     const r = replace.apply(history, args);
//     onRoute();
//     return r;
//   }) as typeof history.replaceState;

//   addEventListener("popstate", onRoute);
// }

// // 유튜브 SPA 내비 이벤트 잡기
// function attachSiteSpecificEvents() {
//   // 유튜브가 라우팅 후 쏘는 이벤트
//   window.addEventListener("yt-navigate-finish", () => {
//     // 라우팅 직후에도 한 번만 시도 (디바운스)
//     scheduleMeasure();
//   });
//   window.addEventListener("yt-page-data-updated", () => {
//     // 페이지 데이터 갱신 시 콘텐츠가 늦게 들어옴 → 한 번만 더
//     scheduleMeasure();
//   });
// }

// function attachOnLoad() {
//   if (document.readyState === "complete" || document.readyState === "interactive") {
//     scheduleMeasure();
//   } else {
//     addEventListener("DOMContentLoaded", scheduleMeasure, { once: true });
//     addEventListener("load", scheduleMeasure, { once: true });
//   }
// }

// function scheduleMeasure() {
//   if (scheduled !== null) cancelAnimationFrame(scheduled);
//   // 두 텀 양보 후 측정(깜박임/부분 DOM 회피)
//   scheduled = requestAnimationFrame(() => {
//     scheduled = requestAnimationFrame(() => {
//       doInitialMeasureOnce();
//       scheduled = null;
//     });
//   });
// }

// function doInitialMeasureOnce() {
//   // 중복 방지(같은 url@routeId에서 너무 자주 안 보냄)
//   const key = `${currentUrl}@${routeId}`;
//   const now = performance.now();
//   if (lastInitSentFor === key && now - lastInitSentAt < initCooldownMs) return;

//   const t0 = performance.now();
//   const { chars, nodes, sample } = collectText(); // 전체 수집
//   const tCollect = performance.now();

//   const elapsedCollectMs = Math.round(tCollect - t0);
//   const elapsedFromNavMs = Math.round(tCollect - navStart);
//   const elapsedSinceRouteMs = Date.now() - routeStartTs;  

//   baseChars = chars;
//   baseNodes = nodes;
//   pendingDeltaChars = 0;
//   pendingDeltaNodes = 0;

//   sendMetric({
//     url: currentUrl,
//     routeId,
//     kind: "INIT",
//     charCount: chars,
//     textNodes: nodes,
//     sampleHash: simpleHash(sample),
//     elapsedCollectMs,
//     elapsedFromNavMs,
//     ts: Date.now(),

//     elapsedSinceRouteMs
//   });

//   lastInitSentFor = key;
//   lastInitSentAt = now;

//   // 무한 스크롤/레이지 로딩 감시 시작
//   startIncrementalObserver();
// }

// function startIncrementalObserver() {
//   stopIncrementalObserver();

//   const target = pickTargetRoot();
//   if (!target) return;

//   mo = new MutationObserver((ml) => {
//     let addedChars = 0;
//     let addedNodes = 0;

//     for (const m of ml) {
//       if (m.type === "childList") {
//         // 추가된 노드의 텍스트만 빠르게 집계
//         m.addedNodes.forEach((n) => {
//           const r = collectFromNode(n);
//           addedChars += r.chars;
//           addedNodes += r.nodes;
//         });
//       }
//     }

//     if (addedChars || addedNodes) {
//       pendingDeltaChars += addedChars;
//       pendingDeltaNodes += addedNodes;

//       // 임계치 넘으면 즉시 전송
//       if (pendingDeltaChars >= incrThresholdChars) {
//         flushIncremental();
//       } else {
//         // 아니면 타임윈도우 내 배치
//         if (incrTimer) clearTimeout(incrTimer);
//         incrTimer = window.setTimeout(flushIncremental, incrWindowMs);
//       }
//     }
//   });

//   mo.observe(target, { childList: true, subtree: true });
// }

// function stopIncrementalObserver() {
//   if (mo) { mo.disconnect(); mo = null; }
//   if (incrTimer) { clearTimeout(incrTimer); incrTimer = null; }
// }

// function flushIncremental() {
//   if (!pendingDeltaChars && !pendingDeltaNodes) return;
//   baseChars += pendingDeltaChars;
//   baseNodes += pendingDeltaNodes;

//   const payload: MetricPayload & { elapsedSinceRouteMs: number } = {
//     url: currentUrl,
//     routeId,
//     kind: "INCR",
//     charCount: baseChars,
//     textNodes: baseNodes,
//     deltaChar: pendingDeltaChars,
//     deltaNodes: pendingDeltaNodes,
//     ts: Date.now(),
//     // ✅ INCR에도 경과 ms 추가
//     elapsedSinceRouteMs: Date.now() - routeStartTs
//   };
//   pendingDeltaChars = 0;
//   pendingDeltaNodes = 0;

//   try {
//     chrome.runtime?.sendMessage?.({ type: "CV_METRIC", payload });
//     // eslint-disable-next-line no-console
//     console.log("[CV_METRIC:INCR]", payload);
//   } catch (e) {
//     // eslint-disable-next-line no-console
//     console.warn("[CV_METRIC INCR] send failed", e);
//   }
// }

// // ===== 텍스트 수집 유틸 =====
// function collectText(): { chars: number; nodes: number; sample: string } {
//   const body = document.body || document.documentElement;
//   if (!body) return { chars: 0, nodes: 0, sample: "" };

//   const walker = document.createTreeWalker(
//     body,
//     NodeFilter.SHOW_TEXT,
//     {
//       acceptNode: (node: Node): number => acceptVisibleText(node)
//     } as unknown as NodeFilter
//   );

//   let nodes = 0;
//   let chars = 0;
//   let sample = "";
//   for (let n = walker.nextNode(); n; n = walker.nextNode()) {
//     const s = (n as Text).data;
//     if (!s) continue;
//     nodes++;
//     chars += s.length;
//     if (sample.length < 200000) sample += s + "\n";
//   }
//   return { chars, nodes, sample };
// }

// function collectFromNode(root: Node): { chars: number; nodes: number } {
//   let nodes = 0;
//   let chars = 0;
//   if (root.nodeType === Node.TEXT_NODE) {
//     // const el = (root as any).parentElement as HTMLElement | null;
//     if (acceptVisibleText(root) === NodeFilter.FILTER_ACCEPT) {
//       const s = (root as Text).data || "";
//       if (s) { nodes += 1; chars += s.length; }
//     }
//   } else if ((root as Element).querySelectorAll) {
//     const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
//       acceptNode: (node: Node): number => acceptVisibleText(node)
//     } as unknown as NodeFilter);
//     for (let n = tw.nextNode(); n; n = tw.nextNode()) {
//       const s = (n as Text).data;
//       if (!s) continue;
//       nodes++;
//       chars += s.length;
//     }
//   }
//   return { chars, nodes };
// }

// function acceptVisibleText(node: Node): number {
//   const el = (node as any).parentElement as HTMLElement | null;
//   if (!el) return NodeFilter.FILTER_REJECT;

//   const tag = el.tagName;
//   if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "META" || tag === "LINK") {
//     return NodeFilter.FILTER_REJECT;
//   }

//   const cs = getComputedStyle(el);
//   if ((cs && (cs.display === "none" || cs.visibility === "hidden")) || el.getAttribute?.("aria-hidden") === "true") {
//     return NodeFilter.FILTER_REJECT;
//   }
//   return NodeFilter.FILTER_ACCEPT;
// }

// function pickTargetRoot(): Element | null {
//   for (const sel of TARGET_SELECTORS) {
//     const el = document.querySelector(sel);
//     if (el) return el;
//   }
//   return document.body || document.documentElement;
// }

// // ===== 공통 =====
// function sendMetric(payload: MetricPayload) {
//   try {
//     chrome.runtime?.sendMessage?.({ type: "CV_METRIC", payload });
//     // eslint-disable-next-line no-console
//     console.log("[CV_METRIC]", payload);
//   } catch (e) {
//     // eslint-disable-next-line no-console
//     console.warn("[CV_METRIC] send failed", e);
//   }
// }

// function simpleHash(s: string) {
//   let h = 0;
//   for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
//   return (h >>> 0).toString(16);
// }

// function makeRouteId() {
//   return Math.random().toString(36).slice(2) + Date.now().toString(36);
// }
