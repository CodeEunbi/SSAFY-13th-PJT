
// import { initBridge } from "./bridge";
// import { emitTextBatch } from "./ipc/emits";
// import type { TextBatchItem, TextBatchPayload } from "../types/realtime";
// import { buildSelector } from "../utils/querySelectorPlus";

// // (선택) UI 모듈 쓰고 있으면 유지
// import { initViewportLoader } from "./viewportLoader";
// import { initIconMenu } from "./iconMenu";

// // 테스트 하드코딩
// const MAX_LEN = 10_000;
// const KEYWORD = "병원";

// init();

// function init() {
//   injectOnce();
//   initBridge();               // BG 포트 연결 + OFFSCREEN:* 리스너 등록 (blur 처리 여기서 함)
//   scanViewportAndSend();      // 초기 스캔
//   observeLazyAndSendOnSettle(); // lazy/동적 렌더 settle 시 재전송

//   // (선택) 부가 UI 초기화
//   try { initViewportLoader(); } catch {}
//   try { initIconMenu(); } catch {}
// }

// function injectOnce() {
//   if (document.getElementById("cv-blur-style")) return;
//   const style = document.createElement("style");
//   style.id = "cv-blur-style";
//   style.textContent = `.cv-blur-sent{ background: rgba(0,0,0,.15); border-radius: 4px; }`;
//   document.documentElement.appendChild(style);
// }

// function collectViewportText(): TextBatchItem[] {
//   const items: TextBatchItem[] = [];
//   const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);

//   let node: Element | null = walker.currentNode as Element;
//   const vh = window.innerHeight;
//   const vw = window.innerWidth;

//   while (node) {
//     const el = node as HTMLElement;
//     const rect = el.getBoundingClientRect?.();
//     if (
//       rect &&
//       rect.bottom >= 0 &&
//       rect.right >= 0 &&
//       rect.top <= vh &&
//       rect.left <= vw
//     ) {
//       // 입력창/편집 영역 제외
//       const tag = el.tagName.toLowerCase();
//       if (["input", "textarea"].includes(tag)) { node = walker.nextNode() as Element; continue; }

//       const text = (el.innerText || "").trim();
//       if (text && text.length <= MAX_LEN && /[^\s]/.test(text)) {
//         const selector = buildSelector(el);
//         const elementId = el.id || "";
//         items.push({ elementId, selector, text });
//       }
//     }
//     node = walker.nextNode() as Element;
//   }
//   return items;
// }

// function scanViewportAndSend() {
//   const all = collectViewportText();
//   if (!all.length) return;

//   // 프리필터(테스트): '병원' 포함 요소만 서버로 보내 트래픽 절감
//   const filtered = all.filter(i => i.text.includes(KEYWORD));
//   if (!filtered.length) return;

//   const payload: TextBatchPayload = {
//     url: location.href,
//     items: filtered,
//     ts: Date.now(),
//     reqId: crypto.randomUUID(),
//     // ↓ 옵션: 타입에 정의했다면 함께 보내기
//     // keywords: [KEYWORD],
//     // maxLen: MAX_LEN,
//     // lang: "mixed", // <- TextBatchPayload에 lang이 없다면 이 줄은 빼세요
//   };
//   emitTextBatch(payload);
// }

// function observeLazyAndSendOnSettle() {
//   const io = new IntersectionObserver((entries) => {
//     const visible = entries.some(e => e.isIntersecting);
//     if (visible) setTimeout(scanViewportAndSend, 120); // 렌더 settle 후 전송
//   }, { root: null, threshold: 0.2 });

//   document.querySelectorAll("img, video, [data-lazy], [loading]").forEach(el => io.observe(el));
// }

// src/content/contentScript.ts
import { initBridge } from "./bridge";
import { initViewportLoader } from "./viewportLoader";
import { initIconMenu } from "./iconMenu";
import { initTextBlur } from "./textBlur";

(function main() {
  initBridge();           // BG 포트 연결 + OFFSCREEN:* 리스너 등록
  try { initViewportLoader(); } catch {}
  try { initIconMenu(); } catch {}
  initTextBlur();         // ← 스캔/전송 시작
})();
