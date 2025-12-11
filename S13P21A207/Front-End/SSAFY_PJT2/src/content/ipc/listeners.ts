// src/content/ipc/listeners.ts
import type { IpcEnvelope, TextAnalysisResponse, FilteredIndex } from "../../types/realtime";
import { IPC_TOPICS } from "./events";
import { applyImageDecisions, processKeyFor } from "../imageBlur";
import { markDoneKey } from "../imageScan";

function ensureSentenceBlurStyle() {
  if (document.getElementById("cv-text-blur-style")) return;
  const style = document.createElement("style");
  style.id = "cv-text-blur-style";
  style.textContent = `.cv-blur-sent {filter: blur(6px) saturate(0) !important;}`;
  document.documentElement.appendChild(style);
}


export function registerContentListeners(port: chrome.runtime.Port) {
  port.onMessage.addListener((raw: unknown) => {
    const msg = raw as IpcEnvelope;
    if (!msg || typeof msg !== "object" || typeof msg.topic !== "string") return;

    if (msg.topic === IPC_TOPICS.DECISIONS) {
      const payload = msg.data as TextAnalysisResponse;
      applyBlur(payload);
    }

    if (msg.topic === IPC_TOPICS.IMAGE_RESULTS) {
      const payload = msg.data as import("../../types/realtime").ImageDecisionPayload;

      // 처리된 이미지들을 완료 상태로 마킹하여 중복 처리 방지
      for (const result of payload.results || []) {
        const img = document.querySelector(`img[data-cv-id="${CSS.escape(result.elementId)}"]`) as HTMLImageElement;
        if (img) {
          const key = processKeyFor(img);
          markDoneKey(key);
          console.log('[CONTENT] Marked image as done:', { elementId: result.elementId, key });
        }
      }

      // 지연 로딩 등으로 이미지가 늦게 생길 수 있으니 약간 딜레이 후 적용
      setTimeout(() => applyImageDecisions(payload), 0);
    }

  });
}

function applyBlur(resp: TextAnalysisResponse) {
  ensureSentenceBlurStyle();
  console.log("[CONTENT] ← text-analysis:result",
    { total: resp.results.length, batchMs: resp.processingTime, at: resp.processedAt });

    console.groupCollapsed("[CONTENT] text-analysis items");


  for (const item of resp.results) {
    const el = document.getElementById(item.elementId) || safeQuery(item.elementId);
    const ranges: FilteredIndex[] = (item.filteredIndexes ?? []) as FilteredIndex[];
    const texts  = ranges.map((x: any) => x.matchText).filter(Boolean) as string[];

    // 👇 아이템별 상세 로그
    console.log("[CONTENT] item", {
      elementId: item.elementId,
      foundElement: !!el,
      originalLength: item.originalLength,
      rangesCount: ranges.length,
      ranges: ranges.map(r => ({ start: r.start, end: r.end, matchText: (r as any).matchText })),
      processedAt: item.processedAt,
      processingTime: item.processingTime,
      // 선택자로 들어온 케이스 대비 프리뷰
      selectorPreview: item.elementId?.startsWith("#") || item.elementId?.startsWith(".") ? item.elementId : undefined,
      matchPreview: texts.slice(0, 5),
    });
    
    
    if (!el) continue;

    const normalized = normalizeRanges(ranges);

    // 1) 먼저 문자열 매칭으로 래핑 (innerText/공백 차이에 가장 강함)
    let wrappedAny = false;

    if (texts.length) {
      try { wrappedAny = wrapByStringMatches(el, texts); } catch {}
    }

    // 2) 그래도 못 찾은 게 남으면 오프셋 기반 폴백
    if (!wrappedAny && normalized.length) {
      try { wrapRangesInElement(el, ranges); } catch (e) { console.warn("[CONTENT] wrapRangesInElement failed:", e); }
    }
  }
  console.groupEnd();
}

/** 문자열 목록을 el 내부에서 찾아 모두 <span class="cv-blur-sent">로 감싼다(대소문자 무시). */
function wrapByStringMatches(rootEl: Element, needles: string[]): boolean {
  // 가상 문자열(공백 압축)과 index→(node,offset) 매핑 생성
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const { text, map } = buildVirtualText(rootEl, norm);
  if (!text) return false;

  let wrapped = 0;
  const lower = text.toLowerCase();

  for (const rawNeedle of needles) {
    const needle = norm(rawNeedle || "");
    if (!needle) continue;

    // 같은 문구가 여러 번 나올 수 있으니 전부 찾기
    let startIdx = 0;
    while (true) {
      const pos = lower.indexOf(needle.toLowerCase(), startIdx);
      if (pos < 0) break;
      const end = pos + needle.length;

      // pos..end-1 을 실제 DOM Range로 변환
      const a = map[pos];
      const b = map[end - 1];
      if (a && b) {
        const range = document.createRange();
        range.setStart(a.node, a.offset);
        range.setEnd(b.node, b.offset + 1);

        const span = document.createElement("span");
        span.className = "cv-blur-sent";
        range.surroundContents(span);
        wrapped++;
      }

      startIdx = end; // 다음 매치 탐색
    }
  }
  return wrapped > 0;
}


/** rootEl의 텍스트를 공백 압축 규칙으로 합쳐 만든 '가상 문자열'과, 각 문자 index에 대응하는 (Text노드,offset) 매핑 */
function buildVirtualText(rootEl: Element, normalize: (s: string) => string) {
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;

  const pieces: string[] = [];
  const map: Array<{ node: Text; offset: number } | null> = [];

  while (node) {
    const parent = node.parentElement;
    const tag = (parent?.tagName || "").toLowerCase();
    if (tag !== "script" && tag !== "style" && tag !== "noscript") {
      const raw = node.data ?? "";
      const normed = normalize(raw);
      pieces.push(normed);

      // 문자 단위 매핑
      let idxInRaw = 0, idxInNorm = 0;
      // 간단히: normed 길이만큼 현재 노드로 채움 (공백 압축의 완벽 매핑은 어렵지만, 대부분 기사문에서 잘 맞음)
      for (let i = 0; i < normed.length; i++) {
        map.push({ node, offset: Math.min(idxInRaw, raw.length) });
        idxInRaw++; idxInNorm++;
      }

      // 단락 구분(블록 경계)로 공백 하나 삽입
      map.push(null); pieces.push(" ");
    }
    node = walker.nextNode() as Text | null;
  }

  const text = normalize(pieces.join("")).trim();
  // null(단락 공백)들은 normalize에서 먹히므로 map 길이를 text 길이에 맞춤
  const trimmedMap = map.filter(Boolean) as Array<{ node: Text; offset: number }>;
  return { text, map: trimmedMap };
}

/** 기존: start~end 오프셋 폴백 (innerText 근사라 오차 가능) */
function wrapRangesInElement(rootEl: Element, ranges: Array<{start:number; end:number}>) {
  if (!ranges.length) return;

  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
  let node: Text | null = walker.nextNode() as Text | null;
  let offset = 0;

  let i = 0;
  const current = () => ranges[i] || null;

  while (node && i < ranges.length) {
    const parentTag = (node.parentElement?.tagName || "").toLowerCase();
    if (parentTag === "script" || parentTag === "style" || parentTag === "noscript") {
      offset += node.data.length;
      node = walker.nextNode() as Text | null;
      continue;
    }

    const text = node.data;
    const length = text.length;
    const r = current(); if (!r) break;

    const nodeStart = offset;
    const nodeEnd = offset + length;
    const overlapStart = Math.max(nodeStart, r.start);
    const overlapEnd   = Math.min(nodeEnd,   r.end);

    if (overlapEnd > overlapStart) {
      const inNodeStart = overlapStart - nodeStart;
      const inNodeEnd   = overlapEnd   - nodeStart;

      const before = text.slice(0, inNodeStart);
      const masked = text.slice(inNodeStart, inNodeEnd);
      const after  = text.slice(inNodeEnd);

      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));

      const span = document.createElement("span");
      span.className = "cv-blur-sent";
      span.textContent = masked;
      frag.appendChild(span);

      if (after) frag.appendChild(document.createTextNode(after));

      const toReplace = node;
      node = walker.nextNode() as Text | null;
      toReplace.parentNode?.replaceChild(frag, toReplace);

      offset += length;
      if (overlapEnd >= r.end) i++;
    } else {
      offset += length;
      node = walker.nextNode() as Text | null;
      if (nodeEnd <= r.start) {/**/}
      else if (nodeStart >= r.end) { i++; }
    }
  }
}


/** 겹치거나 인접한 구간을 정규화(머지) */
function normalizeRanges(ranges: FilteredIndex[]): Array<{start: number; end: number;}> {
  const arr = ranges
    .map(r => ({ start: Math.max(0, r.start), end: Math.max(0, r.end) }))
    .filter(r => r.end > r.start)
    .sort((a,b) => a.start - b.start);

  const merged: Array<{start:number; end:number}> = [];
  for (const r of arr) {
    const last = merged[merged.length - 1];
    if (!last || r.start > last.end) merged.push({ ...r });
    else last.end = Math.max(last.end, r.end);
  }
  return merged;
}

function safeQuery(sel?: string | null): Element | null {
  if (!sel || typeof sel !== "string") return null;
  try { return document.querySelector(sel); }
  catch { return null; }
}
