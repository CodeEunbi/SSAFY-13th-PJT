// src/content/textBlur.ts
import { emitTextBatch } from "./ipc/emits";
import type { TextBatchItem, TextBatchPayload } from "../types/realtime";
import { buildSelector } from "../utils/querySelectorPlus";

// 테스트 하드코딩
const KEYWORD = "병원";
const MAX_LEN = 10_000;

export function initTextBlur() {
  injectOnce();
  scanViewportAndSend();          // 초기
  observeLazyAndSendOnSettle();   // lazy settle 시 재전송
}

function injectOnce() {
  if (document.getElementById("cv-blur-style")) return;
  const style = document.createElement("style");
  style.id = "cv-blur-style";
  style.textContent = `.cv-blur-sent{ background: rgba(0,0,0,.15); border-radius: 4px; }`;
  document.documentElement.appendChild(style);
}

function collectViewportText(): TextBatchItem[] {
  const items: TextBatchItem[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let node = walker.currentNode as Element | null;

  const vh = innerHeight, vw = innerWidth;

  while (node) {
    const el = node as HTMLElement;
    const rect = el.getBoundingClientRect?.();
    if (rect && rect.bottom >= 0 && rect.right >= 0 && rect.top <= vh && rect.left <= vw) {
      const tag = el.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") { node = walker.nextNode() as Element; continue; }
      const text = (el.innerText || "").trim();
      if (text && text.length <= MAX_LEN) {
        const selector = buildSelector(el);
        items.push({ elementId: el.id || "", selector, text });
      }
    }
    node = walker.nextNode() as Element;
  }
  return items;
}

function scanViewportAndSend() {
  const all = collectViewportText();
  const total = all.length;
  const filtered = all.filter(i => i.text.includes(KEYWORD)); // 프리필터(테스트)

  if (filtered.length === 0) {
    console.log(`[CONTENT] 키워드 '${KEYWORD}' 문장 없음 → 전송 생략 (scanned=${total})`);
    return;
  }

  const reqId = crypto.randomUUID();
  console.log(
    `[CONTENT] 키워드 '${KEYWORD}' 포함 요소 ${filtered.length}/${total}개 → 서버로 배치 전송 (reqId=${reqId})`
  );

  const payload: TextBatchPayload = {
    url: location.href,
    items: filtered,
    ts: Date.now(),
    reqId,
    keywords: [KEYWORD], // 타입에 필드 추가했으면 유지, 아니면 삭제해도 OK
    maxLen: MAX_LEN,     // ↑ 동일
  };
  emitTextBatch(payload);
}

function observeLazyAndSendOnSettle() {
  const io = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      setTimeout(scanViewportAndSend, 120);
    }
  }, { root: null, threshold: 0.2 });

  document.querySelectorAll("img, video, [data-lazy], [loading]").forEach(el => io.observe(el));
}
