// src/content/contentScript.ts
import { initBridge } from "./bridge";
// import { initViewportLoader } from "./viewportLoader";
import { initIconMenu } from "./iconMenu";

import { ensureStyle, ensureOverlayCSS } from "./imageBlur";
import { initYoutubeScan } from "./youtubeScan";
import { initImageScan } from "./imageScan";
import { initTextFilter } from "./textFilter/initTextFilter";
import { getSettings } from "../utils/settings";

console.log("[CONTENT] boot — id:", chrome.runtime?.id);

// (선택) 기존 prelock을 “무장된 IMG만 블러 제외” 형태로 축소
function takeoverPrelockToArmed() {
  const pre = document.getElementById('cv-prelock-style') as HTMLStyleElement | null;
  if (!pre) return;
  pre.textContent = `
  img:not([data-cv-armed="1"]) {
    filter: blur(12px) saturate(0.8) brightness(0.95) !important;
    transition: none !important;
    }
    `;
  }
  
  function inViewport(el: Element): boolean {
    const r = el.getBoundingClientRect();
    const H = window.innerHeight || document.documentElement.clientHeight;
    const W = window.innerWidth || document.documentElement.clientWidth;
    return r.bottom > 0 && r.right > 0 && r.top < H && r.left < W;
  }
  
// 보이는 IMG에 바로 “무장+임시 블러”만 적용(UX 부드럽게)
function armVisibleImgsLite() {
  const imgs = Array.from(document.querySelectorAll('img')).filter(inViewport);
  for (const img of imgs as HTMLImageElement[]) {
    img.setAttribute('data-cv-armed', '1');
    if (!img.classList.contains('cv-blurred-temp')) {
      img.classList.add('cv-blurred-temp');
    }
  }
}

(async function main() {
  takeoverPrelockToArmed();
  armVisibleImgsLite();

  initBridge();

  // 전체 필터링 및 개별 필터링 설정 확인 후 조건부 실행
  try {
    const settings = await getSettings();
    const isFilteringEnabled = settings.filteringEnabled !== false;
    const isImageFilterEnabled = settings.filterImage?.enabled !== false;
    const isTextFilterEnabled = settings.filterText?.enabled !== false;

    console.log('[CONTENT] 필터링 설정:', {
      전체필터링: isFilteringEnabled,
      이미지필터링: isImageFilterEnabled,
      텍스트필터링: isTextFilterEnabled
    });

    // 텍스트 필터링
    if (isFilteringEnabled && isTextFilterEnabled) {
      console.log('[CONTENT] 텍스트 필터링 활성화됨');
      initTextFilter();
    } else {
      console.log('[CONTENT] 텍스트 필터링 비활성화됨 - 건너뜀');
    }

    // 이미지 필터링
    if (isFilteringEnabled && isImageFilterEnabled) {
      console.log('[CONTENT] 이미지 필터링 활성화됨');

      // 유튜브면 유튜브 스캔, 아니면 일반 스캔
      if (location.hostname.includes('youtube.com')) {
        initYoutubeScan();
      } else {
        initImageScan();
      }
    } else {
      console.log('[CONTENT] 이미지 필터링 비활성화됨 - 이미지를 바로 표시');
      // prelock 스타일 제거하여 이미지가 바로 보이도록 함
      const prelockStyle = document.getElementById('cv-prelock-style');
      if (prelockStyle) {
        prelockStyle.remove();
      }
      // 이미 적용된 임시 블러 클래스도 제거
      document.querySelectorAll('img.cv-blurred-temp').forEach(img => {
        img.classList.remove('cv-blurred-temp');
      });
    }
  } catch (e) {
    console.warn('[CONTENT] 설정 로드 실패, 모든 필터링 건너뜀:', e);
  }

  // try { initViewportLoader(); } catch {}
  try { initIconMenu(); } catch {}

  // 표시 관련 CSS(한 번만) - 나중에 사용할 수 있도록 항상 로드
  ensureStyle();
  ensureOverlayCSS();
})();
