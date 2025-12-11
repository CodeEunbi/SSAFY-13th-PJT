// prelock.ts
// 첫 페인트 전에 모든 IMG를 임시 블러해 “번쩍” 방지
(() => {
  const STYLE_ID = 'cv-prelock-style';

  // 중복 주입 방지
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* prelock: 메인 스크립트 takeover 전까지 모든 IMG 블러 */
    img {
      filter: blur(12px) saturate(0.8) brightness(0.95) !important;
      transition: none !important;
    }
  `;

  // 가능하면 <head>, 없으면 documentElement에 부착
  (document.head || document.documentElement).appendChild(style);

  // 메인(content)에서 takeoverPrelockToArmed()가 이 규칙을
  // 'img:not([data-cv-armed="1"])'로 축소해 제어권을 넘겨받게 됨.
})();

// TS 컴파일러(특히 isolatedModules) 경고 회피용
export {};
