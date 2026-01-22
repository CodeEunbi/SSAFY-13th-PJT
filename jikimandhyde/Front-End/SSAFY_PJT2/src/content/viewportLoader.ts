// 뷰포트 진입 시 "로딩중 ㄱㄷ" 오버레이를 보여주고,
// 이미지 load / 비디오 loadeddata(canplay) 시 오버레이 제거

const ATTR = "data-cv-loader"; // 중복처리 방지

// 페이지에 한 번만 주입할 CSS
function injectStylesOnce() {
  if (document.getElementById("cv-loader-style")) return;
  const style = document.createElement("style");
  style.id = "cv-loader-style";
  style.textContent = `
  .cv-loader-wrap{ position:relative !important; overflow:hidden !important;}
  .cv-loader-overlay{
    position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    background:rgba(104,42,141,.85); color:#fff; font-weight:700; font-size:14px;
    z-index: 2147483646; pointer-events:none; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    letter-spacing: .5px;
  }
  `;
  document.documentElement.appendChild(style);
}

// function ensureWrapper(el: HTMLElement): HTMLElement {
//   const parent = el.parentElement!;
//   // 이미 포지셔닝 가능한 부모면 그대로 오버레이만 올려도 되지만,
//   // 썸네일의 경우 안전하게 부모에 position을 보장
//   if (getComputedStyle(parent).position === "static") {
//     parent.classList.add("cv-loader-wrap");
//   }
//   return parent;
// }

// ✅ 커스텀 엘리먼트(태그명에 '-')는 바깥 일반 컨테이너까지 올라가서 오버레이 부착
function findOverlayContainer(el: HTMLElement): HTMLElement {
  // 1) 유튜브 카드 썸네일 앵커가 제일 안전
  const thumbA = el.closest("a#thumbnail") as HTMLElement | null;
  if (thumbA) return thumbA;

  // 2) ytd-thumbnail 안이면 그 엘리먼트를 사용
  const ytdThumb = el.closest("ytd-thumbnail") as HTMLElement | null;
  if (ytdThumb) return ytdThumb;

  // 3) 커스텀 엘리먼트(태그에 '-')는 넘어가며 일반 엘리먼트 찾기
  let p: HTMLElement | null = el.parentElement;
  while (p && p.tagName.includes("-")) p = p.parentElement;
  return p || el.parentElement || el;
}


function ensureWrapper(el: HTMLElement): HTMLElement {
  const container = findOverlayContainer(el);
  const cs = getComputedStyle(container);
  if (cs.position === "static") {
    container.classList.add("cv-loader-wrap");
  }
  return container;
}



function addOverlay(target: HTMLElement): HTMLElement {
  const wrap = ensureWrapper(target);
  // 기존 오버레이 있으면 재사용
  let overlay = wrap.querySelector<HTMLElement>(".cv-loader-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "cv-loader-overlay";
    overlay.textContent = "로딩중 ㄱㄷ";
    wrap.appendChild(overlay);
  } else {
    overlay.style.display = "flex";
  }
  return overlay;
}

function removeOverlay(target: HTMLElement) {
  const wrap = ensureWrapper(target); // ⬅️ parentElement 대신 동일 컨테이너로
  const overlay = wrap.querySelector<HTMLElement>(".cv-loader-overlay");
  if (overlay) overlay.style.display = "none";
}


function isImageLoaded(img: HTMLImageElement) {
  return img.complete && img.naturalWidth > 0;
}

function isVideoLoaded(video: HTMLVideoElement) {
  // 첫 프레임이 준비되었는지 기준
  return video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
}

function watchImage(img: HTMLImageElement) {
  if (img.getAttribute(ATTR)) return;
  if (shouldSkipByAttr(img)) return; 
  if (isProfileContext(img)) return; 
  if (isLogo(img)) return;   
  img.setAttribute(ATTR, "1");


  const hideOverlay = () => removeOverlay(img);

  // 이미 로드되어 있으면 스킵
  if (isImageLoaded(img)) return;

  // 뷰포트 진입 시에만 오버레이 표시하고 로드 감시
  io.observe(img);

  // load/error 시 오버레이 제거
  const onDone = () => { hideOverlay(); img.removeEventListener("load", onDone); img.removeEventListener("error", onDone); };
  img.addEventListener("load", onDone);
  img.addEventListener("error", onDone);
}

function watchVideo(video: HTMLVideoElement) {
  if (video.getAttribute(ATTR)) return;
  if (shouldSkipByAttr(video)) return;
  video.setAttribute(ATTR, "1");

  const hideOverlay = () => removeOverlay(video);

  if (isVideoLoaded(video)) return;

  io.observe(video);

  const onReady = () => { hideOverlay(); cleanup(); };
  const onCanPlay = () => { hideOverlay(); cleanup(); };
  const onError = () => { hideOverlay(); cleanup(); };

  function cleanup() {
    video.removeEventListener("loadeddata", onReady);
    video.removeEventListener("canplay", onCanPlay);
    video.removeEventListener("error", onError);
  }

  video.addEventListener("loadeddata", onReady);
  video.addEventListener("canplay", onCanPlay);
  video.addEventListener("error", onError);
}

// 뷰포트 감시자: 들어올 때 오버레이 보이게
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target as HTMLElement;
    
    if (shouldSkipByAttr(el) || isLogo(el)) {  // 🆕 관찰 즉시 제외
      io.unobserve(el);
      continue;
    }


    if (el instanceof HTMLImageElement) {
      if (isLikelyAvatar(el)) { io.unobserve(el); continue; }
      if (!isImageLoaded(el)) addOverlay(el);
      else removeOverlay(el);
    } else if (el instanceof HTMLVideoElement) {
      if (isHoverPreview(el)) { io.unobserve(el); continue; }
      if (!isVideoLoaded(el)) addOverlay(el);
      else removeOverlay(el);
    }
    // 한 번 처리했으면 관찰 해제 (필요 시 유지 가능)
    io.unobserve(el);
  }
}, { root: null, rootMargin: "0px", threshold: 0.1 });

// 유튜브 특화 + 일반 셀렉터
// 유튜브 썸네일만 잡도록 (아바타는 제외됨)
const IMG_SELECTORS = [
  "a#thumbnail img",      // 카드 내 가장 안정적
  "ytd-thumbnail img",
  "ytd-thumbnail #img",
  "#thumbnail img",
];

const VIDEO_SELECTORS = [
  "video.html5-main-video",
  "ytd-player video",
];
const ANY_SELECTOR = [...IMG_SELECTORS, ...VIDEO_SELECTORS].join(",");



// 업로더/채널/댓글 아바타 컨텍스트 전부 포함
const PROFILE_CTX_SELECTOR = [
  // 기존 + 추가
  "a#avatar-link",
  "#avatar",
  "#author-thumbnail",
  "#channel-thumbnail",          // ✅ 업로더/채널 썸네일 컨테이너
  "ytd-video-owner-renderer",    // ✅ 시청 페이지 업로더 블록
  "ytd-channel-icon",            // ✅ 채널 아이콘
  "ytd-mini-channel-renderer",
  "ytd-channel-renderer",
  "ytd-comment-renderer",
  "ytd-comment-thread-renderer",
  "ytd-author-comment-badge-renderer",
].join(",");


const LOGO_CTX_SELECTOR = [
  "#logo",
  '[id*="logo"]',
  '[class*="logo"]',
  'header [class*="logo"]',
  'nav [class*="logo"]',
  // 접근성/대체텍스트 기반
  'a[aria-label*="logo" i]',
  'img[alt*="logo" i]',
  'svg[aria-label*="logo" i]',
].join(",");


function isLogo(el: Element): boolean {
  const node = el as HTMLElement;
  if (node.closest?.(LOGO_CTX_SELECTOR)) return true;

  // 파일명/경로/alt 휴리스틱 (브랜드마크/파비콘 포함)
  if (el instanceof HTMLImageElement) {
    const alt = (el.alt || "").toLowerCase();
    const src = (el.currentSrc || el.src || "").toLowerCase();
    if (/logo|brand|favicon|mark/.test(alt) || /logo|brand|favicon|mark/.test(src)) {
      return true;
    }

    // 헤더/내비 안의 작은 마크류 (과하지 않게 보수적 범위)
    const r = el.getBoundingClientRect();
    const inHeader = !!el.closest("header, nav, #masthead, .site-header");
    if (inHeader && r.width > 0 && r.height > 0 && r.width <= 220 && r.height <= 120) {
      return true;
    }
  }
  return false;
}

// 링크/사이즈 휴리스틱까지 포함한 최종 판별
function isLikelyAvatar(el: Element): boolean {

  if (isLogo(el)) return true;

  if (el.closest(PROFILE_CTX_SELECTOR)) return true;

  // 채널/핸들/유저 링크로 이어지는 이미지
  if (el.closest('a[href^="/channel/"], a[href^="/@"], a[href^="/user/"], a[href^="/c/"]')) return true;

  // 크기 휴리스틱: 디스플레이가 작은 정사각형일 확률 (필요시 80~96 사이로 조절)
  if (el instanceof HTMLImageElement) {
    const r = el.getBoundingClientRect();
    const maxSide = Math.max(r.width, r.height);
    if (maxSide > 0 && maxSide <= 88) return true; // <=88px 정도면 대부분 아바타
    // 네이티브 크기도 작으면 아바타로 간주
    if (el.naturalWidth && el.naturalHeight && Math.max(el.naturalWidth, el.naturalHeight) <= 160) return true;
  }
  return false;
}

function shouldSkipByAttr(el: Element): boolean {
  return el.hasAttribute("data-cv-skip-overlay");
}


function isHoverPreview(el: Element): boolean {
  // 썸네일(ytd-thumbnail) 안에 있는 video는 호버 프리뷰로 간주
  // 단, ytd-player 안이면 메인 플레이어이므로 제외
  return !!el.closest("ytd-thumbnail") && !el.closest("ytd-player");
}


function isProfileContext(el: Element): boolean {
  return !!el.closest(
    [
      "a#avatar-link",
      "#avatar",
      "#author-thumbnail",
      "ytd-comment-renderer",
      "ytd-comment-thread-renderer",
      "ytd-author-comment-badge-renderer",
      "ytd-mini-channel-renderer",
      "ytd-channel-renderer",
    ].join(",")
  );
}



function scan(root: ParentNode = document) {
  root.querySelectorAll<HTMLImageElement>(IMG_SELECTORS.join(","))
    .forEach((img) => {
      if (shouldSkipByAttr(img)) return;   // 🆕
      if (!isLikelyAvatar(img) && !isLogo(img)) watchImage(img); // 🆕
    });

  root.querySelectorAll<HTMLVideoElement>(VIDEO_SELECTORS.join(","))
    .forEach((v) => { if (!isHoverPreview(v)) watchVideo(v); });
}


let mo: MutationObserver | null = null;

export function initViewportLoader() {
  console.log("[cv] viewportLoader init");

  // 1) 샌드박스/iframe에서 실행 피하기
  if (window.top !== window) return;

  injectStylesOnce();
  scan(document);

  // 2) body가 없으면 documentElement로 대체
  const target: Node | null =
    (document.body as Node | null) ||
    (document.documentElement as Node | null);

  // 3) 그래도 없으면 DOMContentLoaded 때 다시 시작
  if (!target) {
    document.addEventListener(
      "DOMContentLoaded",
      () => initViewportLoader(),
      { once: true }
    );
    return;
  }

  mo = new MutationObserver((muts) => {
  for (const m of muts) {
    if (m.type === "childList") {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node as Element;

        // 새로 들어온 노드가 우리가 찾는 대상이면 빠르게 스캔
        if (el.matches?.(ANY_SELECTOR)) {
          // el 자체 혹은 부모에 더 많은 자식이 붙는 패턴이 있어서 parent도 훑어줌
          scan(el);
          if (el.parentNode) scan(el.parentNode as ParentNode);
        } else {
          // 대상이 하위에 있을 수 있음
          scan(el);
        }
      });
    } else if (m.type === "attributes") {
      // src/srcset/poster 등이 바뀐 경우 다시 감시
      const t = m.target as Element;
      if (t instanceof HTMLImageElement) {
        if (!isLikelyAvatar(t)) watchImage(t as HTMLImageElement);
      } else if (t instanceof HTMLVideoElement) {
        if (!isHoverPreview(t)) watchVideo(t as HTMLVideoElement);
      } else if (t.tagName === "SOURCE" && t.parentElement?.closest("video")) {
        // <source> 변경 시 상위 비디오 다시 스캔
        const v = t.parentElement.closest("video") as HTMLVideoElement | null;
        if (v && !isHoverPreview(v)) watchVideo(v); 
      }
    }
  }
});

mo.observe(
  target,
  {
    childList: true,
    subtree: true,
    attributes: true,
    // 비디오 poster도 바뀌니 같이 봄
    attributeFilter: ["src", "srcset", "style", "poster"]
  }
);

}


export function disposeViewportLoader() {
  mo?.disconnect();
  io.disconnect();
}
