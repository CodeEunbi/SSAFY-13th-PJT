// ---- Content: collect text & stream to BG (→ Offscreen → WS) ----

type ObsText = {
  id: string;                     // 안정 ID (data-cv-id)
  type: "text";
  text: string;                   // 샘플 텍스트
  ctx?: { selector?: string };    // 선택자 fallback
};

const port = chrome.runtime.connect({ name: "cv-content" });

// ------- 튜닝 파라미터 -------
const BATCH_MS = 100;                  // 100~200ms 권장
const MAX_TEXT_PER_NODE = 400;         // 노드당 샘플 길이
const MAX_ITEMS_PER_BATCH = 120;       // 배치 크기
const VIEWPORT_MARGIN = 300;           // 뷰포트 근처 우선 스캔(px)
const FULL_SCAN_ONCE = false;          // true면 최초에 전체 페이지 한 번 훑기

// ------- 배치 버퍼 -------
let bucket: ObsText[] = [];
let timer: number | null = null;

function flush() {
  if (!bucket.length) return;
  const items = bucket.splice(0, MAX_ITEMS_PER_BATCH);
  port.postMessage({ kind: "OBS_BATCH", pageUrl: location.href, items });
  if (bucket.length) scheduleFlush();
}
function scheduleFlush() {
  if (timer) return;
  timer = window.setTimeout(() => {
    timer = null;
    flush();
  }, BATCH_MS);
}

// ------- 유틸 -------
function niceSelector(el: Element): string {
  try {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts: string[] = [];
    let cur: Element | null = el;
    while (cur && parts.length < 4) {
      let seg = cur.tagName.toLowerCase();
      if (cur.id) seg += `#${CSS.escape(cur.id)}`;
      else {
        const cls = (cur.getAttribute("class") || "")
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((c) => `.${CSS.escape(c)}`)
          .join("");
        if (cls) seg += cls;
      }
      parts.unshift(seg);
      cur = cur.parentElement;
    }
    return parts.join(" > ");
  } catch {
    return "";
  }
}

function assignStableId(el: Element): string {
  let id = el.getAttribute("data-cv-id");
  if (!id) {
    id = "t-" + Math.random().toString(36).slice(2, 9);
    el.setAttribute("data-cv-id", id);
  }
  return id;
}

function isSkippable(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag === "script" || tag === "style" || tag === "noscript") return true;
  if (el.closest("[contenteditable]")) return true;
  if (["input", "textarea", "select"].includes(tag)) return true;
  const cs = window.getComputedStyle(el);
  if (cs.display === "none" || cs.visibility === "hidden") return true;
  return false;
}

function inViewport(el: Element, margin = 0): boolean {
  const r = el.getBoundingClientRect();
  const w = window.innerWidth;
  const h = window.innerHeight;
  return r.bottom >= -margin && r.top <= h + margin && r.right >= -margin && r.left <= w + margin;
}

// 노드 → 텍스트 샘플 추출
function sampleTextOf(el: Element): string | null {
  // innerText는 매우 비싸다. 성능 위해 textContent 사용 후 공백 정리.
  const raw = el.textContent || "";
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.slice(0, MAX_TEXT_PER_NODE);
}

function enqueueText(el: Element) {
  if (isSkippable(el)) return;
  const txt = sampleTextOf(el);
  if (!txt) return;
  const id = assignStableId(el);
  const item: ObsText = { id, type: "text", text: txt, ctx: { selector: niceSelector(el) } };
  bucket.push(item);
  if (bucket.length >= MAX_ITEMS_PER_BATCH) flush();
  else scheduleFlush();
}

// ------- 스캐닝 전략 -------
// 1) 최초: 뷰포트 근처 텍스트 빠르게
function scanViewport() {
  // 후보: 제목/본문/링크 위주로 선택자 좁히면 성능 좋음
  const candidates = document.querySelectorAll<HTMLElement>([
    "h1,h2,h3,h4,h5,h6",
    "article,section",
    "p,li,dd,dt",
    "a[title],a[href]",
    "[role=heading]",
  ].join(","));
  candidates.forEach((el) => {
    if (inViewport(el, VIEWPORT_MARGIN)) enqueueText(el);
  });
}

// 2) MutationObserver: 동적 로딩 시 추가 노드 처리
const mo = new MutationObserver((muts) => {
  const uniques = new Set<Element>();
  for (const m of muts) {
    m.addedNodes.forEach((n) => {
      if (n.nodeType === Node.ELEMENT_NODE) uniques.add(n as Element);
    });
    if (m.type === "characterData" && m.target?.parentElement) {
      uniques.add(m.target.parentElement);
    }
  }
  uniques.forEach((el) => {
    if (inViewport(el, VIEWPORT_MARGIN)) enqueueText(el);
    // 큰 컨테이너엔 자식들 중 의미 있는 것 몇 개만 쿼리
    el.querySelectorAll("p,li,h1,h2,h3,a[title]").forEach((c) => {
      if (inViewport(c, VIEWPORT_MARGIN)) enqueueText(c);
    });
  });
});

// 3) (옵션) 전체 페이지 한 번 훑기 — requestIdleCallback로 끊어가며

const ric: typeof window.requestIdleCallback =
  window.requestIdleCallback
    ? window.requestIdleCallback.bind(window)
    : ((cb: IdleRequestCallback) =>
        window.setTimeout(
          () => cb({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline),
          1
        ));
        
function fullScanOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node: Element) {
      if (isSkippable(node)) return NodeFilter.FILTER_REJECT;
      // 텍스트 있을 법한 것만
      const tag = node.tagName.toLowerCase();
      if (/(p|h1|h2|h3|h4|h5|h6|li|article|section|blockquote|figcaption|dd|dt|a)/.test(tag)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  } as any);

  function step() {
    let count = 0;
    while (walker.nextNode() && count < 500) {
      const el = walker.currentNode as Element;
      enqueueText(el);
      count++;
    }
    if (count >= 500 && walker.currentNode) {
      ric(step);
    }
  }
  step();
}

// ------- 부트스트랩 -------
(function init() {
  // 초기 뷰포트 스캔
  scanViewport();
  // 동적 로딩 대응
  mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  // 스크롤할 때 뷰포트 근처 새 텍스트 수집
  let scT: number | null = null;
  window.addEventListener("scroll", () => {
    if (scT) return;
    scT = window.setTimeout(() => {
      scT = null;
      scanViewport();
    }, 120);
  }, { passive: true });

  // 필요할 때 전체 스캔 한 번 실행
  if (FULL_SCAN_ONCE) fullScanOnce();
})();
