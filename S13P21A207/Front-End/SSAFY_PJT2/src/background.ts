// src/background.ts
// @ts-nocheck  // dev 파이프라인 안정화를 위해 이 파일만 타입체크 임시 비활성

let isIconEnabled = true;
let isSyncEnabled = true;

/* =========================
 * Debug helpers (optional)
 * ========================= */
// /** @param {any[]=} arr @param {string} [key] @param {number} [n] */
// function previewIds(arr, key = 'elementId', n = 10) {
//   return Array.isArray(arr) ? arr.slice(0, n).map((x) => x?.[key]) : [];
// }

// /** @param {any} m */
// const isImageResults = (m) =>
//   m?.topic === 'OFFSCREEN:IMAGE_RESULTS' || m?.topic === 'IMAGE_RESULTS';

/* =========================
 * Port maps / types
 * ========================= */
/** @typedef {{content: Map<number, chrome.runtime.Port>, offscreen: chrome.runtime.Port|null}} PortMap */
/** @type {PortMap} */
const ports = { content: new Map(), offscreen: null };

/** @typedef {Object} IncomingMsg
 * @property {string=} topic
 * @property {string=} type
 * @property {string=} event
 * @property {string|number=} reqId
 * @property {number=} timeoutMs
 * @property {unknown=} data
 * @property {unknown=} error
 * @property {number=} tabId
 */

/* =========================
 * UI / Settings sync
 * ========================= */
const updateIconVisibility = () => {
  chrome.action.enable(); // 팝업은 항상 접근 가능
  console.log(
    `[BG] 플로팅 아이콘 버튼 ${isIconEnabled ? '활성화' : '비활성화'}`,
  );
};

const performSync = async () => {
  try {
    console.log('[BG] 동기화 시작');
    const result = await chrome.storage.sync.get(null);
    console.log('[BG] 동기화된 데이터:', result);
    console.log('[BG] 동기화 완료');
  } catch (error) {
    console.error('[BG] 동기화 실패:', error);
  }
};

const loadSettingsAndUpdate = async () => {
  try {
    const result = await chrome.storage.sync.get(['settings']);
    /** @type {Record<string, unknown>|undefined} */
    const settings = result && result.settings;

    isIconEnabled = (settings && settings.showIcon) !== false;
    isSyncEnabled = (settings && settings.syncEnabled) !== false;

    updateIconVisibility();
    if (isSyncEnabled) await performSync();
  } catch (error) {
    console.error('[BG] 설정 로드 실패:', error);
    isIconEnabled = true;
    isSyncEnabled = true;
    updateIconVisibility();
  }
};

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[BG] Extension installed');
  await loadSettingsAndUpdate();
  await ensureOffscreen();
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.settings) {
    const c = /** @type {{ newValue?: Record<string, unknown>, oldValue?: Record<string, unknown> }} */ (changes.settings);
    const n = c.newValue || {};
    const o = c.oldValue || {};

    if (n.showIcon !== o.showIcon) {
      isIconEnabled = n.showIcon !== false;
      updateIconVisibility();
      console.log('[BG] 아이콘 설정 변경:', isIconEnabled);
    }
    if (n.syncEnabled !== o.syncEnabled) {
      isSyncEnabled = n.syncEnabled !== false;
      console.log('[BG] 동기화 설정 변경:', isSyncEnabled);
      if (isSyncEnabled) void performSync();
    }
  }
});

/* =========================
 * Pending map (SETTINGS_COMMIT 등)
 * ========================= */
/** @typedef {{ resolve: (resp: unknown) => void }} Pending */
/** @type {Map<string, Pending>} */
const pending = new Map();

/* =========================
 * One-shot messages (options, fetch proxy, settings commit)
 * ========================= */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  /** @type {IncomingMsg} */
  const m = (msg || {});

  if (m?.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
    return false;
  }

  // ✅ 이미지 CORS 우회 fetch 프록시 (cookie/credential 제거)
  if (m?.type === 'FETCH_IMAGE' && typeof /** @type {any} */(m).url === 'string') {
    (async () => {
      try {
        const resp = await fetch(/** @type {any} */(m).url, {
          credentials: 'omit',
          cache: 'no-store',
        });
        const mime = resp.headers.get('content-type') || '';
        const buf = await resp.arrayBuffer();
        sendResponse({ ok: true, mime, buf });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true; // 비동기 응답
  }

  // ===== OPTIONS → BG: 설정 커밋 요청 (Offscreen까지 왕복) =====
  if (m?.topic === 'OFFSCREEN:SETTINGS_COMMIT') {
    const reqId = String(m.reqId ?? '');
    const event = /** @type {string|undefined} */ (m.event);
    const timeoutMs = Number(m.timeoutMs ?? 7000);

    if (!ports.offscreen) {
      console.warn('[BG][SETTINGS] offscreen not ready');
      try {
        sendResponse({ ok: false, error: 'Offscreen not ready' });
      } catch {
        /* no-op */
      }
      return false;
    }

    // pending 등록 + 타임아웃
    const timer = setTimeout(() => {
      const ent = pending.get(reqId);
      if (!ent) return;
      pending.delete(reqId);
      console.warn('[BG][SETTINGS] timeout', reqId);
      ent.resolve({ ok: false, error: 'Timeout' });
    }, timeoutMs);

    pending.set(reqId, {
      resolve: (resp) => {
        clearTimeout(timer);
        try {
          sendResponse(resp);
        } catch (e) {
          console.warn('[BG] sendResponse failed:', e);
        }
      },
    });

    console.log('[BG][SETTINGS] → OFF', { reqId, event });
    ports.offscreen.postMessage(m);

    return true; // async 응답 유지
  }

  return false;
});

/* =========================
 * Offscreen document
 * ========================= */
// ⚠️ 빌드 산출물 기준 경로를 맞춰주세요.
const OFF_URL = chrome.runtime.getURL('offscreen.html');
// 필요시: const OFF_URL = chrome.runtime.getURL('src/offscreen/offscreen.html');

async function hasOffscreenDoc() {
  try {
    // 최신 API (Chrome 121+) 우선
    if ('getContexts' in chrome.offscreen) {
      // @ts-ignore
      const ctx = await chrome.offscreen.getContexts();
      return ctx.some((c) => c.documentUrl?.endsWith('/offscreen.html'));
    }
    // 구버전 fallback
    // @ts-ignore
    return (await chrome.offscreen.hasDocument?.()) ?? false;
  } catch {
    return false;
  }
}

async function ensureOffscreen() {
  if (!('offscreen' in chrome)) {
    console.error(
      "[BG] offscreen unavailable. Need Chrome >=109 & 'offscreen' perm.",
    );
    return;
  }
  try {
    const has = await hasOffscreenDoc();
    if (has) return;
    console.log('[BG] creating offscreen:', OFF_URL);
    await chrome.offscreen.createDocument({
      url: OFF_URL,
      // 사유 값은 크롬 버전에 따라 상이 → any 캐스팅 대체
      reasons: /** @type {any} */ (['BLOBS']),
      justification: 'Maintain Socket.IO connection for real-time filtering',
    });
  } catch (e) {
    console.error('[BG] offscreen create failed:', e, chrome.runtime.lastError);
  }
}
chrome.runtime.onStartup?.addListener(ensureOffscreen);

/* =========================
 * Message queue until offscreen attaches
 * ========================= */
const pendingToOffscreen = [];

/* =========================
 * Port routing
 * ========================= */
chrome.runtime.onConnect.addListener((p) => {
  if (p.name === 'cv-content') {
    if (!ports.offscreen) void ensureOffscreen();

    p.onMessage.addListener((msg) => {
      const wrapped = { ...(msg || {}), tabId: p.sender?.tab?.id ?? -1 };
      if (ports.offscreen) {
        ports.offscreen.postMessage(wrapped);
      } else {
        // 오프스크린 붙을 때까지 보관
        pendingToOffscreen.push(wrapped);
        console.log(
          '[BG] queued→offscreen (no offscreen yet):',
          (/** @type {any} */(msg))?.topic
        );
      }
    });

    p.onDisconnect.addListener(() => {
      const entry = [...ports.content.entries()].find(([, port]) => port === p);
      if (entry) ports.content.delete(entry[0]);
    });

    if (p.sender?.tab?.id != null) ports.content.set(p.sender.tab.id, p);
  } else if (p.name === 'cv-offscreen') {
    ports.offscreen = p;

    // 오프스크린 붙은 직후 큐 비우기
    if (pendingToOffscreen.length) {
      console.log('[BG] flushing queued→offscreen:', pendingToOffscreen.length);
      for (const m of pendingToOffscreen.splice(0)) {
        try {
          ports.offscreen.postMessage(m);
        } catch (e) {
          console.warn('[BG] flush fail:', e);
        }
      }
    }

    p.onMessage.addListener((msg) => {
      /** @type {IncomingMsg} */
      const m = (msg || {});

      // ===== Offscreen → BG: 설정 ACK/ERROR =====
      if (m?.topic === 'OFFSCREEN:SETTINGS_ACK' && m?.reqId != null) {
        const id = String(m.reqId);
        const ent = pending.get(id);
        if (ent) {
          pending.delete(id);
          console.log('[BG][SETTINGS] ACK from OFF:', id, m.data);
          ent.resolve({ ok: true, data: m.data });
        }
        return;
      }
      if (m?.topic === 'OFFSCREEN:SETTINGS_ERROR' && m?.reqId != null) {
        const id = String(m.reqId);
        const ent = pending.get(id);
        if (ent) {
          pending.delete(id);
          console.warn('[BG][SETTINGS] ERROR from OFF:', id, m.error, m.data);
          ent.resolve({ ok: false, error: m.error, data: m.data });
        }
        return;
      }

      // // 🔎 결과 프리뷰 로그 (오프스크린 → 콘텐츠)
      // if (isImageResults(m)) {
      //   const results = (m && m.data && (m.data.results || m.data.targets)) || [];
      //   const count = Array.isArray(results) ? results.length : 0;
      //   const ids = previewIds(results, 'elementId');
      //   console.log('[BG] OFFSCREEN→CONTENT IMAGE_RESULTS', { count, idsPreview: ids });
      // }

      // 일반 라우팅: offscreen → content (탭 타깃 우선)
      const tabId = (m.tabId ?? p.sender?.tab?.id);
      if (tabId && ports.content.has(tabId)) {
        const cp = ports.content.get(tabId);
        if (cp) cp.postMessage(m);
      } else {
        ports.content.forEach((cp) => cp.postMessage(m)); // 브로드캐스트
      }
    });

    p.onDisconnect.addListener(() => {
      if (ports.offscreen === p) ports.offscreen = null;
    });
  }
});
