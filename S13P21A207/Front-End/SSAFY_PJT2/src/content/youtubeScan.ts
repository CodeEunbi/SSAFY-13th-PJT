// src/content/YoutubeScan.ts
import type { ImageItem, ImageBatchPayload } from '../types/realtime';
import { emitImageBatch } from './ipc/emits';
import { ensureId, isTooSmallToAnalyze, processKeyFor, markPending } from './imageBlur';


const SUPPORTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 1_000_000;
const MAX_CONCURRENCY = 12;
const VIEWPORT_SETTLE_MS = 180;

let inflight = 0;
const inflightKeyById = new Map<string, string>();
const doneKeys = new Set<string>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const inViewport = (el: Element) => {
  const r = el.getBoundingClientRect();
  const H = window.innerHeight || document.documentElement.clientHeight;
  const W = window.innerWidth || document.documentElement.clientWidth;
  return r.bottom > 0 && r.right > 0 && r.top < H && r.left < W;
};

// 유튜브 썸네일만 타겟
function getYtImages(): HTMLImageElement[] {
  return Array.from(
    document.querySelectorAll<HTMLImageElement>('img.ytCoreImageHost, .ytCoreImageHost img')
  );
}

async function blobFromImg(img: HTMLImageElement): Promise<Blob | null> {
  try {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d'); if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    const b = await new Promise<Blob | null>(res => c.toBlob(res, 'image/jpeg', 0.9));
    if (b) return b;
  } catch {}
  try {
    const r = await fetch(img.currentSrc || img.src || '', { mode: 'cors', credentials: 'omit' });
    if (!r.ok) return null;
    return await r.blob();
  } catch { return null; }
}

async function scanViewportAndSend() {
  await sleep(VIEWPORT_SETTLE_MS);

  const pageUrl = location.href;
  const imgs = getYtImages().filter(inViewport);
  if (!imgs.length || inflight >= MAX_CONCURRENCY) return;

  const items: ImageItem[] = [];
  for (const img of imgs) {
    if (isTooSmallToAnalyze(img)) continue;
    const elementId = ensureId(img);
    const key = processKeyFor(img);
    if (doneKeys.has(key)) continue;
    if (inflightKeyById.get(elementId) === key) continue;
    if (inflight + items.length >= MAX_CONCURRENCY) break;

    const blob = await blobFromImg(img);
    if (!blob) continue;
    const mimeType = blob.type || 'image/jpeg';
    if (!SUPPORTED.includes(mimeType) || blob.size > MAX_BYTES) continue;

    inflightKeyById.set(elementId, key);
    markPending(img);

    items.push({
      elementId,
      mimeType,
      size: blob.size,
      pageUrl,
      imageMetadata: {
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        alt: img.alt || null,
        src: img.currentSrc || img.src || null,
      },
      imageData: await blob.arrayBuffer(),
    } as any);
  }

  if (!items.length) return;

  inflight += items.length;

  const payload: ImageBatchPayload = {
    url: pageUrl,
    ts: Date.now(),
    reqId: `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`,
    images: items,
  };

  emitImageBatch(payload);
}

function observeLazyAndSendOnSettle() {
  const obs = new MutationObserver(() => scheduleSend());
  obs.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'srcset'] });
}

let timer: number | null = null;
let last = 0;
const DEBOUNCE = 1200;

function scheduleSend() {
  const now = Date.now();
  const wait = Math.max(0, DEBOUNCE - (now - last));
  if (timer) clearTimeout(timer);
  timer = window.setTimeout(async () => {
    last = Date.now();
    timer = null;
    await scanViewportAndSend();
  }, wait);
}

export function initYoutubeScan() {
  scanViewportAndSend();
  observeLazyAndSendOnSettle();
}
