// src/content/ImageScan.ts
import type { ImageItem, ImageBatchPayload } from '../types/realtime';
import { emitImageBatch } from './ipc/emits';
import { ensureId, isTooSmallToAnalyze, processKeyFor, markPending} from './imageBlur';

const MAX_BYTES = 1_000_000;
const SUPPORTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
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

// 1) 우선 canvas로 JPEG, 2) 실패 시 fetch→toBlob, 3) 그래도 실패하면 null
async function blobFromImg(img: HTMLImageElement): Promise<Blob | null> {
  if (!img.naturalWidth || !img.naturalHeight) return null;
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
  const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('img')).filter(inViewport);
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
    if (!SUPPORTED.includes(mimeType)) continue;
    if (blob.size > MAX_BYTES) continue;

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
  const obs = new MutationObserver((muts) => {
    let changed = false;
    for (const m of muts) {
      if (m.type === 'childList') {
        m.addedNodes.forEach((n) => {
          if ((n as Element)?.tagName === 'IMG') { markPending(n as HTMLImageElement); changed = true; }
          (n as Element)?.querySelectorAll?.('img')?.forEach((img) => { markPending(img as HTMLImageElement); changed = true; });
        });
      }
      if (m.type === 'attributes') {
        const t = m.target as Element;
        if (t.tagName === 'IMG' && (m.attributeName === 'src' || m.attributeName === 'srcset')) {
          markPending(t as HTMLImageElement);
          changed = true;
        }
      }
    }
    if (changed) scheduleSend();
  });

  obs.observe(document.documentElement, {
    subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'srcset'],
  });
}

let sendTimer: number | null = null;
let lastSendAt = 0;
const SEND_DEBOUNCE_MS = 1200;

function scheduleSend() {
  const now = Date.now();
  const wait = Math.max(0, SEND_DEBOUNCE_MS - (now - lastSendAt));
  if (sendTimer) clearTimeout(sendTimer);
  sendTimer = window.setTimeout(async () => {
    lastSendAt = Date.now();
    sendTimer = null;
    await scanViewportAndSend();
  }, wait);
}

function markAllImagesPending() {
  document.querySelectorAll('img').forEach(img => {
    if (!isTooSmallToAnalyze(img)) {
      markPending(img);
    }
  });
}

export function initImageScan() {
  markAllImagesPending(); // 즉시 모든 이미지를 분석중으로
  scanViewportAndSend();
  observeLazyAndSendOnSettle();
}

// 외부(오프스크린/백엔드결과)에서 성공 처리 후 불린다면, 완료 키 캐시 추가용 헬퍼를 원하면 여기서 노출해도 됨.
export function markDoneKey(key: string) { doneKeys.add(key); inflight = Math.max(0, inflight - 1); }
