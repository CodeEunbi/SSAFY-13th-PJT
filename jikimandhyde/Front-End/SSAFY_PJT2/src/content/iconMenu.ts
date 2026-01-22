/** CleanView: FAB + Menu + Loading-Color (fetch/XHR/SPA/IMG) */

import {
  initSettings,
  getSettings,
  updateSettings,
  type Settings,
} from '../utils/settings';

const ROOT_ID = 'cv-left-fab-root';
const SHADOW_HOST_ID = 'cv-left-fab-shadow-host';

type FetchArgs = Parameters<typeof window.fetch>;
type PushArgs = Parameters<typeof history.pushState>;
type ReplaceArgs = Parameters<typeof history.replaceState>;

declare global {
  interface Window {
    __cv_hist_patched__?: boolean;
    __cv_fetch_patched__?: boolean;
    __cv_xhr_patched__?: boolean;
  }
}

let inited = false;
let removeGlobalHandlers: (() => void) | null = null;
let moRef: MutationObserver | null = null;

/* ------------------ DOM helpers ------------------ */
function createShadowHost() {
  const existing = document.getElementById(
    SHADOW_HOST_ID,
  ) as HTMLElement | null;
  if (existing) return existing;

  const host = document.createElement('div');
  host.id = SHADOW_HOST_ID;
  host.style.position = 'fixed';
  host.style.left = 'max(16px, env(safe-area-inset-left))';
  host.style.bottom = 'max(16px, env(safe-area-inset-bottom))';
  host.style.zIndex = '2147483647';
  host.style.transform = 'none';
  host.style.filter = 'none';

  (document.documentElement || document.body || document).appendChild(host);
  return host;
}

function ensureRootInShadow() {
  const host = createShadowHost();
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  let root = shadow.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    shadow.appendChild(root);
  }
  return { host, shadow, root };
}

function removeRoot() {
  const host = document.getElementById(SHADOW_HOST_ID);
  try {
    moRef?.disconnect();
  } catch {}
  moRef = null;

  removeGlobalHandlers?.();
  removeGlobalHandlers = null;

  if (host?.parentElement) host.parentElement.removeChild(host);
  inited = false;
}

/* ------------------ UI build ------------------ */
function buildUI() {
  // host는 로컬 변수로 안 쓰이므로 구조분해에서 제외
  const { root, shadow } = ensureRootInShadow();
  root.innerHTML = '';

  const style = document.createElement('style');
  style.textContent = `
  :host { all: initial; }
  :host{
    --cv-btn-size: 72px;
    --cv-logo-size: 56px;
    --cv-logo-offset-x: 0px;
    --cv-logo-offset-y: 3px;
    --cv-ring-width: 4px;
    --cv-ring-track: rgba(59,130,246,.15);
    --cv-ring-highlight: rgba(59,130,246,.95);
    --cv-rotate-speed: 1s;
    --cv-btn-bg: #ffffff;
    --cv-btn-border: 1px solid rgba(0,0,0,.06);
  }

  .btn{
    position: relative;
    width: var(--cv-btn-size);
    height: var(--cv-btn-size);
    border-radius: 50%;
    border: var(--cv-btn-border);
    outline: none;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(0,0,0,0.2);
    background: var(--cv-btn-bg);
  }

  .btn .logo{
    position: absolute;
    width: var(--cv-logo-size);
    height: var(--cv-logo-size);
    left: 50%; top: 50%;
    transform: translate(-50%, -50%) translate(var(--cv-logo-offset-x), var(--cv-logo-offset-y));
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
    z-index: 2;
    pointer-events: none;
  }

  .btn::before{
    content:"";
    position:absolute;
    left:0; top:0; right:0; bottom:0;
    border-radius:50%;
    pointer-events:none;
    opacity:0;
    z-index:1;
    background:
      conic-gradient(
        from 0deg,
        var(--cv-ring-highlight) 0deg 60deg,
        var(--cv-ring-track)    60deg 360deg
      );
    -webkit-mask:
      radial-gradient(
        farthest-side,
        transparent calc(100% - var(--cv-ring-width)),
        #000        calc(100% - var(--cv-ring-width))
      );
    mask:
      radial-gradient(
        farthest-side,
        transparent calc(100% - var(--cv-ring-width)),
        #000        calc(100% - var(--cv-ring-width))
      );
    transform: rotate(0deg);
  }
  .btn.loading::before{ opacity:1; animation: cv-rotate var(--cv-rotate-speed) linear infinite; }
  @keyframes cv-rotate{ to { transform: rotate(360deg); } }

  .btn .fill{ position:absolute; inset:8px; border-radius:50%; background:#3b82f6; opacity:0; pointer-events:none; z-index:1; }
  .btn.loading .fill{ opacity:0; }

  .menu{
    position: fixed; background: #fff; border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    padding: 8px; min-width: 180px; display: none;
    font-family: system-ui,-apple-system,Segoe UI,Roboto,Noto Sans,sans-serif;
  }
  .item{ display:block; width:100%; text-align:left; background:transparent; border:none; padding:10px 12px; border-radius:8px; cursor:pointer; font-size:14px; }
  .item:hover,.item:focus{ background:#f4f6f8; outline:none; }

  @media (prefers-reduced-motion: reduce){
    .btn.loading::before{ animation:none; }
  }
  `;
  shadow.appendChild(style);

  // Button
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.setAttribute('aria-label', 'CleanView 메뉴');
  btn.setAttribute('aria-haspopup', 'menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('title', 'CleanView 메뉴');
  btn.style.pointerEvents = 'auto';

  // Logo
  const logo = document.createElement('span');
  logo.className = 'logo';
  logo.style.backgroundImage = `url(${chrome.runtime.getURL(
    'src/assets/icons/logo.png',
  )})`;
  btn.appendChild(logo);

  // Optional fill
  const fill = document.createElement('span');
  fill.className = 'fill';
  btn.appendChild(fill);

  // Menu
  const menu = document.createElement('div');
  menu.className = 'menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('tabindex', '-1');
  menu.style.pointerEvents = 'auto';

  const makeItem = (label: string, onClick: () => void) => {
    const a = document.createElement('button');
    a.className = 'item';
    a.textContent = label;
    a.setAttribute('role', 'menuitem');
    a.addEventListener('click', () => {
      hideMenu();
      onClick();
    });
    return a;
  };

  const goSettings = makeItem('설정으로 가기', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
  });

  // ✅ 저장 로직만 유틸 호출로 교체 (UI/텍스트 그대로)
  const closeBtn = makeItem('아이콘 닫기', async () => {
    try {
      await initSettings();
      await updateSettings({ showIcon: false });
    } catch (e) {
      console.error('[iconMenu] updateSettings(showIcon:false) failed:', e);
    }
  });

  menu.appendChild(goSettings);
  menu.appendChild(closeBtn);

  const GAP = 8;
  const positionMenu = () => {
    const r = btn.getBoundingClientRect();
    const prevDisplay = menu.style.display;
    const prevVis = (menu.style as any).visibility; // any 유지
    menu.style.display = 'block';
    (menu.style as any).visibility = 'hidden'; // any 유지

    const mw = menu.offsetWidth || 180;
    const mh = menu.offsetHeight || 0;

    let left = r.left + r.width / 2 - mw / 2;
    left = Math.min(Math.max(8, left), window.innerWidth - mw - 8);
    const top = Math.max(8, r.top - mh - GAP);

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    (menu.style as any).visibility = prevVis || 'visible'; // any 유지
    menu.style.display = prevDisplay || 'none';
  };

  const showMenu = () => {
    positionMenu();
    menu.style.display = 'block';
    btn.setAttribute('aria-expanded', 'true');
    (menu.querySelector('.item') as HTMLButtonElement | null)?.focus();
  };
  const hideMenu = () => {
    menu.style.display = 'none';
    btn.setAttribute('aria-expanded', 'false');
  };

  // ✅ showMenu를 실제로 사용(토글) — TS6133 방지
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menu.style.display !== 'none' && menu.style.display !== '';
    open ? hideMenu() : showMenu();
  });

  // outside click => close
  const onDocClick = (ev: MouseEvent) => {
    const path = (ev.composedPath?.() ?? []) as EventTarget[];
    const inside =
      path.includes(btn) ||
      path.includes(menu) ||
      path.includes((shadow as any).host); // any 유지
    if (!inside) hideMenu();
  };
  document.addEventListener('click', onDocClick, true);

  const onRelayout = () => {
    if (menu.style.display === 'block') positionMenu();
  };
  window.addEventListener('resize', onRelayout);
  window.addEventListener('scroll', onRelayout, true);

  const onUnload = () => {
    document.removeEventListener('click', onDocClick, true);
    window.removeEventListener('resize', onRelayout);
    window.removeEventListener('scroll', onRelayout, true);
    try {
      moRef?.disconnect();
    } catch {}
    moRef = null;
  };
  window.addEventListener('beforeunload', onUnload);
  removeGlobalHandlers = onUnload;

  /* ---------- Loading ring (initial + SPA + fetch/XHR + IMG) ---------- */
  const prefersReduced =
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  let isInitialLoading = document.readyState !== 'complete';
  let isRouteLoading = false;
  let pending = 0;
  let idleTimer: number | undefined;

  const imgState = new WeakMap<
    HTMLImageElement,
    { pending: boolean; key: string | null }
  >();

  const setLoadingVisual = (active: boolean) => {
    if (prefersReduced) {
      btn.classList.toggle('loading', false);
      return;
    }
    btn.classList.toggle('loading', active);
  };
  const scheduleIdleCheck = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (pending === 0)
        setLoadingVisual(isInitialLoading || isRouteLoading || pending > 0);
    }, 600);
  };
  const applyLoading = () => {
    const active = isInitialLoading || isRouteLoading || pending > 0;
    setLoadingVisual(active);
  };

  if (isInitialLoading) {
    applyLoading();
    const onReady = () => {
      if (document.readyState === 'complete') {
        isInitialLoading = false;
        applyLoading();
        document.removeEventListener('readystatechange', onReady);
      }
    };
    document.addEventListener('readystatechange', onReady);
    window.addEventListener(
      'load',
      () => {
        isInitialLoading = false;
        applyLoading();
      },
      { once: true },
    );
  } else {
    applyLoading();
  }

  // SPA routing
  const patchHistory = () => {
    if (window.__cv_hist_patched__) return;
    window.__cv_hist_patched__ = true;
    const fire = () => {
      isRouteLoading = true;
      applyLoading();
    };
    const origPush = history.pushState.bind(
      history,
    ) as typeof history.pushState;
    const origReplace = history.replaceState.bind(
      history,
    ) as typeof history.replaceState;
    history.pushState = function (...args: PushArgs) {
      const r = origPush(...args);
      fire();
      return r;
    } as typeof history.pushState;
    history.replaceState = function (...args: ReplaceArgs) {
      const r = origReplace(...args);
      fire();
      return r;
    } as typeof history.replaceState;
    window.addEventListener('popstate', fire);
  };
  patchHistory();

  // YouTube native events
  window.addEventListener(
    'yt-navigate-start',
    () => {
      isRouteLoading = true;
      applyLoading();
    },
    true,
  );
  window.addEventListener(
    'yt-navigate-finish',
    () => {
      isRouteLoading = false;
      scheduleIdleCheck();
    },
    true,
  );

  // fetch tracking
  if (!window.__cv_fetch_patched__) {
    window.__cv_fetch_patched__ = true;
    const origFetch = window.fetch.bind(window) as typeof window.fetch;
    (window as any).fetch = (...args: FetchArgs) => {
      // any 유지
      pending++;
      applyLoading();
      return origFetch(...args).finally(() => {
        pending = Math.max(0, pending - 1);
        scheduleIdleCheck();
      });
    };
  }

  // XHR tracking
  if (!window.__cv_xhr_patched__) {
    window.__cv_xhr_patched__ = true;
    const origOpen: typeof XMLHttpRequest.prototype.open =
      XMLHttpRequest.prototype.open;
    const origSend: typeof XMLHttpRequest.prototype.send =
      XMLHttpRequest.prototype.send;

    function openPatched(this: XMLHttpRequest, ...args: any[]): void {
      // any 유지
      this.addEventListener('loadend', () => {
        pending = Math.max(0, pending - 1);
        scheduleIdleCheck();
      });
      (origOpen as any).apply(this, args); // any 유지
    }
    XMLHttpRequest.prototype.open =
      openPatched as typeof XMLHttpRequest.prototype.open;

    function sendPatched(this: XMLHttpRequest, ...args: any[]): void {
      // any 유지
      pending++;
      applyLoading();
      (origSend as any).apply(this, args); // any 유지
    }
    XMLHttpRequest.prototype.send =
      sendPatched as typeof XMLHttpRequest.prototype.send;
  }

  // IMG tracking
  const computeImgKey = (img: HTMLImageElement) => {
    const srcset = img.getAttribute('srcset');
    const src = img.currentSrc || img.src || '';
    return srcset ? `srcset:${srcset}|src:${src}` : `src:${src}`;
  };
  const imgStateMap = imgState;
  const beginTrackImg = (img: HTMLImageElement) => {
    const key = computeImgKey(img);
    const state = imgStateMap.get(img);
    if (state?.pending && state.key === key) return;

    if (!img.complete) {
      pending++;
      applyLoading();
      imgStateMap.set(img, { pending: true, key });
      const onceDone = () => {
        const st = imgStateMap.get(img);
        if (st && st.pending) {
          st.pending = false;
          imgStateMap.set(img, st);
          pending = Math.max(0, pending - 1);
          scheduleIdleCheck();
        }
        img.removeEventListener('load', onceDone);
        img.removeEventListener('error', onceDone);
      };
      img.addEventListener('load', onceDone, { once: true });
      img.addEventListener('error', onceDone, { once: true });
    } else {
      imgStateMap.set(img, { pending: false, key });
    }
  };

  Array.from(document.images).forEach((img) =>
    beginTrackImg(img as HTMLImageElement),
  );
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes.forEach((n) => {
          if (n instanceof HTMLImageElement) beginTrackImg(n);
          else if (n instanceof Element)
            n.querySelectorAll('img').forEach((img) =>
              beginTrackImg(img as HTMLImageElement),
            );
        });
      } else if (
        m.type === 'attributes' &&
        m.target instanceof HTMLImageElement
      ) {
        beginTrackImg(m.target);
      }
    }
  });
  mo.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'srcset'],
  });
  moRef = mo;

  root.appendChild(btn);
  root.appendChild(menu);
  inited = true;
}

/* ------------------ visibility logic ------------------ */
function shouldShowIcon(s?: Settings) {
  const enabled = (s as any)?.serviceEnabled !== false; // default true
  const wantIcon = s?.showIcon !== false; // default true
  return enabled && wantIcon;
}

function applyVisibility(s?: Settings) {
  const visible = shouldShowIcon(s);
  if (visible) {
    if (!inited) buildUI();
  } else {
    removeRoot();
  }
}

/* ------------------ init ------------------ */
async function _init() {
  if (window.top !== window) return;
  if (document.getElementById(SHADOW_HOST_ID)) {
    inited = true;
    return;
  }

  try {
    await initSettings(); // ✅ 병합/보호/레거시 흡수
    const s = await getSettings(); // ✅ 항상 새 포맷
    applyVisibility(s);
  } catch {
    // 설정 읽기 실패 시 보수적으로 표시
    buildUI();
  }

  // ✅ 새 키(settingsDoc) 기준으로 구독 + 레거시 보조
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' && area !== 'sync') return;

    const docChange = (changes as any).settingsDoc;
    if (docChange && docChange.newValue?.settings) {
      applyVisibility(docChange.newValue.settings as Settings);
      return;
    }

    const legacy = (changes as any).settings;
    if (legacy && legacy.newValue) {
      applyVisibility(legacy.newValue as Settings);
    }
  });
}

/** 외부에서 호출하는 엔트리 */
export async function initIconMenu() {
  if (inited || document.getElementById(SHADOW_HOST_ID)) return;
  await _init();
}

/** 정리 */
export function disposeIconMenu() {
  removeRoot();
}
