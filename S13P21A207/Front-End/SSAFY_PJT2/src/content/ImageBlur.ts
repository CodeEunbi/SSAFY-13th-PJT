// src/content/imageBlur.ts
import type { ImageDecisionPayload } from '../types/realtime';

// === 식별/크기 판정 ===
let seq = 0;
const idMap = new WeakMap<HTMLImageElement, string>();

export function ensureId(img: HTMLImageElement): string {
  const exist = img.dataset.cvId || idMap.get(img);
  if (exist) return exist;
  const id = `img_${++seq}`;
  idMap.set(img, id);
  img.dataset.cvId = id;
  return id;
}

export function isTooSmallToAnalyze(img: HTMLImageElement): boolean {
  const r = img.getBoundingClientRect();
  const rw = r.width || img.width || img.naturalWidth || 0;
  const rh = r.height || img.height || img.naturalHeight || 0;

  if (img.dataset.cvForce === '1') return false;
  if (img.dataset.cvIgnore === '1') return true;

  return rw < 128 || rh < 128 || rw * rh < 128 * 128;
}

export function processKeyFor(img: HTMLImageElement): string {
  const id = ensureId(img);
  const src = img.currentSrc || img.src || '';
  const w = img.naturalWidth || img.width || 0;
  const h = img.naturalHeight || img.height || 0;
  return `${id}|${src}|${w}x${h}`;
}

// === 스타일(한 번만) & 오버레이 ===
export function ensureStyle() {
  if (document.getElementById('cv-image-blur-style')) return;
  const s = document.createElement('style');
  s.id = 'cv-image-blur-style';
  s.textContent = `
    img[data-cv-id].cv-blurred {
    filter: blur(16px) saturate(0.7) brightness(0.9) !important;
    transition: filter .2s ease;
  }
  img[data-cv-id].cv-blurred:hover {
    filter: none !important;
  }
  img[data-cv-id].cv-blurred-temp {
    filter: blur(12px) saturate(0.8) brightness(0.95) !important;
    transition: filter .2s ease;
  }

  /* 래퍼: 둥근 모서리 + 클립 (parentWrapForOverlay에서 보강) */
  [data-cv-wrap="1"] {
    position: relative !important;
    border-radius: 14px !important;
    overflow: hidden !important;
    line-height: 0 !important;       /* 이미지 주변 공백 제거 */
  }

  .cv-overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;
  }
  .cv-overlay[data-state="loading"] {
    background: rgba(0,0,0,0.20);
    backdrop-filter: blur(1px);
  }
  .cv-overlay[data-state="blurred"] {
    background: rgba(0,0,0,0.25);     /* 뒷면 살짝 어둡게 */
  }

  .cv-overlay-inner {
    display: flex; gap: .5rem; align-items: center; justify-content: center;
    padding: .8em 1.2em;
    background: rgba(0,0,0,0.45);
    border-radius: 14px;
    box-shadow: 0 6px 18px rgba(0,0,0,.25);
    backdrop-filter: blur(2px);
    color: #fff;
    font-weight: 800;                  /* 제목 굵게 */
    letter-spacing: 0.2px;
    text-shadow: 0 1px 2px rgba(0,0,0,.35);
    user-select: none;
    max-width: 88%;
    box-sizing: border-box;
  }

  .cv-spinner {
    width: 1em; height: 1em; border-radius: 50%;
    border: .18em solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    animation: cvspin 1s linear infinite;
  }
  @keyframes cvspin { to { transform: rotate(360deg) } }

  .cv-text {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; white-space: pre-line; word-break: break-word;
  }

  .cv-text > span:first-child { 
    font-size: 1em; line-height: 1.15; 
  }
  .cv-text > small {
    font-size: .70em;                 /* “사유: …” 작게 */
    margin-top: .35em;
    opacity: .95;
    font-weight: 600;
  }

`;
  document.documentElement.appendChild(s);
}

// === Overlay CSS & helpers (REPLACE FROM HERE) ===
export function ensureOverlayCSS() {
  if (document.getElementById('cv-overlay-style')) return;
  const s = document.createElement('style');
  s.id = 'cv-overlay-style';
  s.textContent = `
  /* 이미지 블러 */
  img[data-cv-id].cv-blurred {
    filter: blur(16px) saturate(0.7) brightness(0.9) !important;
    transition: filter .2s ease;
  }
  img[data-cv-id].cv-blurred:hover {
    filter: none !important;
  }
  /* 로딩 중 블러 */
  img[data-cv-id].cv-blurred-temp {
    filter: blur(12px) saturate(0.8) brightness(0.95) !important;
    transition: filter .2s ease;
  }

  /* 부모 래핑: position만 살짝 부여 */
  [data-cv-wrap="1"] { position: relative !important; }

  .cv-overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;
  }
  .cv-overlay[data-state="loading"] {
    background: rgba(0,0,0,0.25);
    backdrop-filter: blur(1px);
  }
  .cv-overlay[data-state="blurred"] {
    background: rgba(0,0,0,0.35);
  }
  .cv-overlay-inner {
    display: flex; gap: .5rem; align-items: center; justify-content: center;
    padding-block: .7em; padding-inline: 1em;
    background: rgba(0,0,0,0.35);
    color: #fff; line-height: 1.2; font-weight: 600;
    text-shadow: 0 1px 2px rgba(0,0,0,.4);
    user-select: none; max-width: 100%; box-sizing: border-box;
  }
  .cv-spinner {
    width: 1em; height: 1em; border-radius: 50%;
    border: .18em solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    animation: cvspin 1s linear infinite;
  }
  @keyframes cvspin { to { transform: rotate(360deg) } }

  .cv-text {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; white-space: pre-line; word-break: break-word;
  }
  .cv-text small { font-size: 0.8em; margin-top: 0.2em; opacity: 0.85; }
  `;
  document.documentElement.appendChild(s);
}

function parentWrapForOverlay(img: HTMLImageElement): HTMLElement {
  const parent = img.parentElement ?? document.body;
  const el = parent as HTMLElement;

  // 래퍼 표시 플래그
  el.setAttribute('data-cv-wrap', '1');

  // 오버레이가 얹힐 수 있게 position 보장
  if (getComputedStyle(el).position === 'static') {
    el.style.position = 'relative';
  }

  // ✅ 둥근 모서리 & 오버플로우 클립 (스크린샷처럼)
  //    필요하면 반경 값 12~20px 선에서 조절
  const R = '14px';
  if (!el.style.borderRadius) el.style.borderRadius = R;
  if (!el.style.overflow) el.style.overflow = 'hidden';

  // 이미지도 block로 만들어 간격/여백 오류 방지
  const cs = getComputedStyle(img);
  if (cs.display !== 'block') (img as any).style.display = 'block';
  (img as any).style.width ||= '100%'; // 부모 폭에 맞춤(선택)

  return el;
}

function calcFontSizeFor(img: HTMLImageElement) {
  const rw = Math.max(
    1,
    img.getBoundingClientRect().width || img.width || img.naturalWidth || 0,
  );
  const base = Math.round(rw * 0.11);
  const size = Math.max(12, Math.min(base, 42)); // 10~40px
  const tooSmall = rw < 80; // 너무 작으면 텍스트 숨김
  return { size, tooSmall, renderedWidth: rw };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

export function mkOverlay(
  img: HTMLImageElement,
  elementId: string,
  state: 'loading' | 'blurred',
  text: string,
) {
  ensureOverlayCSS();
  const host = parentWrapForOverlay(img);
  host
    .querySelector(`.cv-overlay[data-for="${CSS.escape(elementId)}"]`)
    ?.remove();

  const ov = document.createElement('div');
  ov.className = 'cv-overlay';
  ov.setAttribute('data-for', elementId);
  ov.setAttribute('data-state', state);

  const inner = document.createElement('div');
  inner.className = 'cv-overlay-inner';

  const { size, tooSmall, renderedWidth } = calcFontSizeFor(img);
  inner.style.fontSize = size + 'px';

  // 텍스트 박스 폭 계산
  const sideGutter = Math.max(16, Math.round(renderedWidth * 0.06));
  const preferred = Math.round(renderedWidth * 0.84);
  const minWidth = 160;
  const maxWidth = Math.max(40, renderedWidth - sideGutter);
  const targetW = clamp(preferred, minWidth, maxWidth);
  inner.style.width = `${targetW}px`;
  inner.style.maxWidth = `${maxWidth}px`;

  // 폰트 크기에 비례한 패딩
  const padY = Math.max(8, Math.round(size * 0.35));
  const padX = Math.max(12, Math.round(size * 0.7));
  inner.style.padding = `${padY}px ${padX}px`;

  if (state === 'loading') {
    img.classList.add('cv-blurred-temp');
    const spin = document.createElement('div');
    spin.className = 'cv-spinner';
    inner.appendChild(spin);
  }

  if (!tooSmall) {
    const label = document.createElement('span');
    label.className = 'cv-text';
    const line1 = String(text);
    if (line1) {
      const first = document.createElement('span');
      first.textContent = line1;
      label.appendChild(first);
    }
    inner.appendChild(label);
  }

  ov.appendChild(inner);
  host.appendChild(ov);
}

export function removeOverlay(elementId: string) {
  const el = document.querySelector(
    `.cv-overlay[data-for="${CSS.escape(elementId)}"]`,
  );
  el?.remove();

  const im = document.querySelector(
    `img[data-cv-id="${CSS.escape(elementId)}"]`,
  ) as HTMLImageElement | null;
  im?.classList.remove('cv-blurred-temp');
}

const CATEGORY_KO: Record<string, string> = { CRIME: '범죄', ACCIDENT: '참사', HORROR: '공포', GORE: '고어' };
export function mapCategoryToKo(cat: unknown): string {
  const s = Array.isArray(cat) ? cat[0] : cat;
  if (typeof s !== 'string') return '성인';
  const k = s.trim().replace(/\s+/g, '').toUpperCase();
  return CATEGORY_KO[k] ?? '성인';
}

export function markPending(img: HTMLImageElement) {
  // 작은 아이콘은 표시도 스킵 (원래 로직 유지)
  if (isTooSmallToAnalyze(img)) return;

  const id = ensureId(img);
  if (img.classList.contains('cv-blurred-temp')) return;
  img.classList.add('cv-blurred-temp'); // 즉시 흐리게
  mkOverlay(img, id, 'loading', '분석중…'); // 즉시 "분석중" 띄우기
}
// === 최종 블러 적용 ===
export function applyImageDecisions(payload: ImageDecisionPayload) {
  ensureStyle();

  // 에러가 있는 경우 에러 처리 (타입 확장)
  const extendedPayload = payload as any;
  if (extendedPayload.error) {
    applyImageError();
    return;
  }

  for (const r of payload.results || []) {
    removeOverlay(r.elementId);
    const img = document.querySelector(`img[data-cv-id="${CSS.escape(r.elementId)}"]`) as HTMLImageElement | null;
    if (!img) continue;
    if (r.shouldBlur) {
      img.classList.add('cv-blurred');
      img.classList.remove('cv-blurred-temp');
      mkOverlay(img, r.elementId, 'blurred', `사유: ${mapCategoryToKo(r.primaryCategory)}`);
    } else {
      img.classList.remove('cv-blurred', 'cv-blurred-temp');
    }
  }
}

// === 에러 처리 ===
export function applyImageError() {
  ensureStyle();

  // 분석중인 모든 이미지를 에러 상태로 변경
  const pendingImages = document.querySelectorAll('img.cv-blurred-temp');

  for (const img of pendingImages) {
    const elementId = (img as HTMLImageElement).dataset.cvId;
    if (!elementId) continue;

    removeOverlay(elementId);
    (img as HTMLImageElement).classList.add('cv-blurred');
    (img as HTMLImageElement).classList.remove('cv-blurred-temp');
    mkOverlay(img as HTMLImageElement, elementId, 'blurred', '서버 오류');
  }
}