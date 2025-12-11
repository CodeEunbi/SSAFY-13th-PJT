
// src/offscreen/offscreen.ts

// @ts-nocheck
import type {
  IpcEnvelope,
  ImageBatchPayload,
  ImageDecisionPayload,
  TextAnalysisRequest,
  TextAnalysisResponse,
} from '../types/realtime';
import { IPC_TOPICS } from '../content/ipc/events';
import { websocket } from './ws/socket';

/* =========================
 * Window helpers (debug)
 * ========================= */
// TS의 `declare global` / `interface Window` 제거.
// 필요한 전역은 아래 Object.assign으로 주입.
declare global {
  interface Window {
    sio: SocketIOClient.Socket;
    sioPing: (note?: string) => void;
  }
}

const sio: any = websocket;

window.sio = sio;
window.sioPing = (note = 'manual') => sio.emit('ping', { note, t: Date.now() });


console.log('[OFF] loaded');

/* =========================
 * BG(Service Worker) port
 * ========================= */
const bgPort = chrome.runtime.connect({ name: 'cv-offscreen' });
console.log('[OFF] connected to BG port');
bgPort.postMessage({ type: 'offscreen_loaded' });

function relayToBG(topic, data, tabId) {
  const env = { topic, data };
  if (tabId != null) env.tabId = tabId;
  bgPort.postMessage(env);
}

/* =========================
 * reqId <-> tabId tracker
 * ========================= */
/** @typedef {{ tabId: number, expected: number, got: number }} Track */
/** @type {Map<string, Track>} */
const reqTrack = new Map();

/** @param {string|undefined} reqId @param {number|undefined} tabId @param {number=} expected */
function trackReqTab(reqId, tabId, expected = 1) {
  if (!reqId || tabId == null) return;
  reqTrack.set(reqId, { tabId, expected, got: 0 });
}
/** @param {string|undefined} reqId */
function pickTabIdFromReqId(reqId) {
  if (!reqId) return;
  const t = reqTrack.get(reqId);
  if (!t) return;
  t.got += 1;
  if (t.got >= t.expected) reqTrack.delete(reqId);
  else reqTrack.set(reqId, t);
  return t.tabId;
}

/* =========================
 * Category stats (debug)
 * ========================= */
/** @typedef {{ elementId: string, shouldBlur: boolean, primaryCategory?: string }} DecisionItem */
const categoryStats = new Map();
/** @param {DecisionItem[]|null|undefined} items */
function trackCategories(items) {
  if (!Array.isArray(items)) return;
  for (const it of items) {
    const c = it && it.primaryCategory;
    if (!c) continue;
    categoryStats.set(c, (categoryStats.get(c) ?? 0) + 1);
  }
}
Object.assign(window, {
  cvListCategories: () => {
    const list = [...categoryStats.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    console.table(list);
    return list;
  },
  cvClearCategories: () => {
    categoryStats.clear();
    console.log('[OFF] categoryStats cleared');
  },
});

/* =========================
 * Utilities for image bytes
 * ========================= */
/** @param {string} url */
function dataUrlToArrayBuffer(url) {
  try {
    const m = url.match(/^data:([^;,]+)?(;base64)?,(.*)$/);
    if (!m) return null;
    const isBase64 = !!m[2];
    const raw = m[3];
    if (isBase64) {
      const bin = atob(raw);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return u8.buffer;
    } else {
      const decoded = decodeURIComponent(raw);
      return new TextEncoder().encode(decoded).buffer;
    }
  } catch {
    return null;
  }
}

/** @param {string|undefined} url */
async function fetchBinary(url) {
  if (!url) return null;
  if (url.startsWith('data:')) return dataUrlToArrayBuffer(url);
  if (url.startsWith('blob:')) return null; // 다른 컨텍스트 Blob URL
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/** @param {ArrayBuffer|Blob} x */
const ensureArrayBuffer = (x) =>
  x instanceof ArrayBuffer ? Promise.resolve(x) : x.arrayBuffer();

/** @param {ArrayBuffer} ab @param {number=} n */
function headHex(ab, n = 8) {
  const u8 = new Uint8Array(ab, 0, Math.min(n, ab.byteLength));
  return Array.from(u8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

/**
 * Socket.IO 바이너리 전송 시 추가되는 0x04 헤더 제거 (O(1))
 * @param {ArrayBuffer} buffer - 원본 이미지 버퍼
 * @returns {ArrayBuffer} - 0x04 헤더가 제거된 버퍼
 */
function removeSocketIOBinaryHeader(buffer) {
  if (!buffer || buffer.byteLength === 0) return buffer;

  const uint8Array = new Uint8Array(buffer);

  // 첫 바이트가 0x04인지 확인
  if (uint8Array[0] === 0x04) {
    console.log('[OFF] Removing Socket.IO binary header (0x04) from image data');
    // ArrayBuffer.slice()는 메모리 뷰만 조정 (O(1))
    return buffer.slice(1);
  }

  return buffer;
}

/* =========================
 * Normalize server acks
 * ========================= */
/** @param {any} ack @param {string=} reqId */
function normalizeImageAck(ack, reqId) {
  if (!ack) return { results: [], reqId };

  // ImageAnalysisSocketResponse 구조 검증: processingTime, processedAt, results 필수
  if (ack.hasOwnProperty('processingTime') &&
      ack.hasOwnProperty('processedAt') &&
      ack.results && Array.isArray(ack.results)) {
    // 정상적인 ImageAnalysisSocketResponse
    return {
      results: ack.results,
      reqId: reqId,
      processingTime: ack.processingTime,
      processedAt: ack.processedAt
    };
  }

  // ImageAnalysisSocketResponse 구조가 아닌 경우 = 에러 응답
  console.error('[OFF] Invalid response format (not ImageAnalysisSocketResponse):', ack);
  return {
    results: [],
    reqId,
    error: {
      message: ack.message || '서버 오류',
      errorCode: ack.errorCode || 'INVALID_RESPONSE',
      category: ack.category || '시스템 오류',
      originalResponse: ack
    }
  };
}

/* =========================
 * Socket.IO wiring
 * ========================= */
sio.on('connect', () => {
  const id = sio.id || sio.io?.engine?.id || '(no-id)';
  console.log('[OFF] Socket.IO connected', {
    socketId: id,
    connected: sio.connected,
    url: sio.io?.engine?.uri || 'unknown'
  });
});
sio.on('connect_error', (err) => {
  console.error('[OFF] socket connect_error:', {
    message: err?.message || err,
    code: err?.code,
    description: err?.description,
    context: err?.context,
    type: err?.type
  });
});
sio.on?.('reconnect', (n) => console.log('[OFF] socket reconnect:', n));
sio.on('disconnect', (reason) => {
  console.warn('[OFF] Socket.IO disconnected:', reason);
});
sio.on('pong', (d) => {
  console.log('[OFF] PONG', d);
  relayToBG('OFFSCREEN:PONG', d);
});
sio.on('config', (cfg) => relayToBG('OFFSCREEN:CONFIG', cfg));

/* =========================
 * BG → Offscreen (batches)
 * ========================= */
bgPort.onMessage.addListener(async (msg) => {
  if (!msg || typeof msg.topic !== 'string') return;

  switch (msg.topic) {
    case IPC_TOPICS.TEXT_BATCH: {
      /** @type {TextAnalysisRequest} */
      const payload = msg.data;
      const reqId = payload && payload.reqId;
      trackReqTab(reqId, msg.tabId, 1);

      console.log('[OFF] → text-analysis', {
        count: payload?.items?.length ?? 0,
        reqId,
        tabId: msg.tabId,
      });

      try {
        console.log('[OFF] → text-analysis PAYLOAD', {
          count: payload?.items?.length ?? 0,
          approxBytes: new Blob([JSON.stringify(payload)]).size,
          firstItem: payload?.items?.[0],
          sample3: payload?.items?.slice(0, 3),
        });
      } catch {}

      sio.emit('text-analysis', payload);
      break;
    }

    case IPC_TOPICS.IMAGE_BATCH: {
      /** @type {ImageBatchPayload} */
      const p = msg.data;
      (async () => {
        const reqId = p.reqId;
        trackReqTab(reqId, msg.tabId, 1);

        // 1) imageData 없으면 src로 fetch해서 채움
        const enriched = await Promise.all(
          (p.images ?? []).map(async (it) => {
            let ab = it && it.imageData;
            let len =
              ab && ab.byteLength != null
                ? ab.byteLength
                : ab instanceof Blob
                ? ab.size
                : 0;

            if (!ab || len === 0) {
              const src = it?.imageMetadata?.src ?? undefined;
              const fetched = await fetchBinary(src);
              if (fetched && fetched.byteLength > 0) {
                it.imageData = fetched;
                it.size = fetched.byteLength;
                // console.log('[OFF][DEBUG] headHex', headHex(fetched, 8), src);
              } else {
                console.warn('[OFF] failed to fetch thumb', src);
              }
            }
            return it;
          }),
        );

        // 2) usable만 추출 + 메타/버퍼 분리
        /** @type {ArrayBuffer[]} */ const buffers = [];
        /** @type {any[]} */ const metas = [];

        function guessExt(mime) {
          switch (mime) {
            case 'image/jpeg':
            case 'image/jpg':
              return '.jpg';
            case 'image/png':
              return '.png';
            case 'image/webp':
              return '.webp';
            case 'image/gif':
              return '.gif';
            case 'image/bmp':
              return '.bmp';
            case 'image/tiff':
              return '.tiff';
            case 'image/x-icon':
            case 'image/vnd.microsoft.icon':
              return '.ico';
            default:
              return '';
          }
        }

        for (const it of enriched) {
          const raw = it && it.imageData;
          const ab =
            raw instanceof ArrayBuffer
              ? raw
              : raw instanceof Blob
              ? await ensureArrayBuffer(raw)
              : null;
          if (!ab || ab.byteLength <= 16) continue;

          buffers.push(ab);

          const { imageData: _drop, ...meta } = it || {};
          if (!meta.filename || typeof meta.filename !== 'string') {
            const ext = guessExt(meta.mimeType);
            meta.filename = `${meta.elementId}${ext || ''}`;
          }
          metas.push(meta);
        }

        // 3) 서버로 청크 전송 (프레임 과대 방지)
        const CHUNK = 12;
        const totalChunks = Math.max(1, Math.ceil(buffers.length / CHUNK));
        if (reqId && reqTrack.has(reqId)) {
          const tr = reqTrack.get(reqId);
          tr.expected = totalChunks;
          reqTrack.set(reqId, tr);
        }

        console.log('[OFF] IMAGE_BATCH ready', {
          reqId,
          totalIn: p.images?.length ?? 0,
          usable: buffers.length,
          totalChunks,
          chunkSize: CHUNK,
          approxBytes: buffers.reduce((n, ab) => n + (ab?.byteLength ?? 0), 0),
          allElementIds: metas.map((x) => x.elementId),
        });

        for (let i = 0; i < buffers.length; i += CHUNK) {
          const buffersChunk = buffers.slice(i, i + CHUNK);
          const metasChunk = metas.slice(i, i + CHUNK);
          const chunkNo = i / CHUNK;

          const payload = metasChunk.map((meta, idx) => ({
            ...meta,
            imageData: removeSocketIOBinaryHeader(buffersChunk[idx]),
            reqId: p.reqId,
          }));

          try {
            console.groupCollapsed('[OFF] IMAGE BYTES (emit preview)', {
              reqId: p.reqId,
              chunk: chunkNo,
              count: payload.length,
            });
            payload.slice(0, 5).forEach((x, j) => {
              const ab = x.imageData;
              const head = headHex(ab, 8);
              console.log(`#${j}`, {
                elementId: x.elementId,
                mimeType: x.mimeType,
                filename: x.filename,
                len: ab?.byteLength ?? 0,
                head,
              });
              if (head.startsWith('3c 68 74 6d 6c')) console.warn('❗HTML 응답 의심(<html...)');
              if (head.startsWith('7b 22')) console.warn('❗JSON 응답 의심({")');
            });
            console.groupEnd();
          } catch {}

          console.log('[OFF] → image-analysis emit', {
            reqId: p.reqId,
            chunk: `${chunkNo}/${totalChunks}`,
            count: payload.length,
            elementIds: payload.map(x => x.elementId),
            socketConnected: sio.connected,
            socketId: sio.id,
            socketUrl: sio.io?.engine?.uri || 'unknown'
          });

          sio.emit('image-analysis', payload, (ack) => {
            try {
              console.log('[OFF] ← image-analysis ACK received', {
                reqId: p.reqId,
                chunk: `${chunkNo}/${totalChunks}`,
                ackType: typeof ack,
                hasResults: !!ack?.results,
                resultsCount: ack?.results?.length || 0,
                hasError: !!ack?.error || ack?.success === false,
                ack: ack
              });

              const tabId = pickTabIdFromReqId(p.reqId);
              const decisions = normalizeImageAck(ack, p.reqId);
              trackCategories(decisions.results);

              relayToBG(IPC_TOPICS.IMAGE_RESULTS, decisions, tabId);
            } catch (e) {
              console.warn('[OFF] image-analysis ack handling failed:', e);
            }
          });
        }

        // 모든 청크 전송 완료 요약
        console.log('[OFF] ✅ All chunks sent', {
          reqId,
          totalChunks,
          totalImages: buffers.length,
          chunkSize: CHUNK,
          lastChunkSize: buffers.length % CHUNK || CHUNK
        });
      })();
      break;
    }

    default:
      break;
  }
});

/* =========================
 * Server → Offscreen (push)
 * ========================= */
sio.on('text-analysis:result', (data) => {
  const total = data?.results?.length ?? 0;
  const preview = (data?.results ?? []).slice(0, 5).map((r) => r.elementId);
  const tabId = pickTabIdFromReqId(data?.reqId);

  console.log('[OFF] ← text-analysis:result', { total, preview, reqId: data?.reqId, tabId });
  relayToBG(IPC_TOPICS.DECISIONS, data, tabId);
});

/* =========================
 * Settings relay + generic emit
 * ========================= */
/** @typedef {{ topic: 'OFFSCREEN:SOCKET_EMIT', event: string, data: unknown, timeoutMs?: number }} RuntimeMessage */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  /** @type {RuntimeMessage} */
  const message = msg;
  if (!message || message.topic !== 'OFFSCREEN:SOCKET_EMIT') return;

  const { event, data, timeoutMs = 7000 } = message;

  // 1) settings-update: 서버 푸시 이벤트로 성공/실패 판단
  if (event === 'settings-update') {
    let settled = false;

    const onSuccess = (payload) => {
      if (settled) return;
      settled = true;
      cleanup();
      chrome.runtime.sendMessage({ topic: 'OFFSCREEN:SETTINGS_ACK', data: payload });
    };
    const onError = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      chrome.runtime.sendMessage({ topic: 'OFFSCREEN:SETTINGS_ERROR', data: err });
    };
    const cleanup = () => {
      sio.off('setting-updated', onSuccess);
      sio.off('settings-updated', onSuccess);
      sio.off('error', onError);
      clearTimeout(timer);
    };

    sio.once('setting-updated', onSuccess);
    sio.once('settings-updated', onSuccess);
    sio.once('error', onError);

    const timer = setTimeout(() => {
      onError({ isError: true, errorCode: 'CL108', message: 'Timeout waiting for settings-updated' });
    }, timeoutMs);

    try {
      sio.emit('settings-update', data);
    } catch (e) {
      onError({ isError: true, errorCode: 'SO101', message: e?.message || 'Socket emit failed' });
    }

    sendResponse?.({ ok: true, note: 'deferred-by-server-event' });
    return true; // async
  }

  // 2) 일반 이벤트: ACK 콜백 사용
  let settled = false;
  const timer = setTimeout(() => {
    if (!settled) {
      settled = true;
      chrome.runtime.sendMessage({ topic: 'OFFSCREEN:GENERIC_ERROR', event, error: 'Timeout waiting for ACK' });
    }
  }, timeoutMs);

  try {
    sio.emit(event, data, (ack) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      chrome.runtime.sendMessage({ topic: 'OFFSCREEN:GENERIC_ACK', event, data: ack });
    });
  } catch (e) {
    if (!settled) {
      settled = true;
      clearTimeout(timer);
      chrome.runtime.sendMessage({ topic: 'OFFSCREEN:GENERIC_ERROR', event, error: e?.message || String(e) });
    }
  }

  sendResponse?.({ ok: true, note: 'ack-will-arrive-async' });
  return true; // async
});

/* =========================
 * Misc
 * ========================= */
export function ping() {
  sio.emit('ping', { t: Date.now() });
}
bgPort.onDisconnect.addListener(() => {
  console.warn('[OFF] BG port disconnected');
});

// 모든 서버 이벤트 로깅(디버그)
sio.onAny?.((event, ...args) => {
  try {
    const reqId = args?.[0]?.reqId;
    console.log('[OFF] onAny:', event, reqId, args?.[0]);
  } catch {}
});


