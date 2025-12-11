// src/content/textFilter/initTextFilter.ts

import { blurAllTextAndExtract } from './findTextNodes';
import { sendTextNodesToServer } from './socketText';
import { startContentObserver } from './contentObserver'; // Observer 시작 함수 임포트

export function initTextFilter() {
  console.log('[CONTENT] 텍스트 필터 초기화 시작');

  // 1. 페이지 로드 시 존재하는 정적 텍스트 처리
  const initialNodes = blurAllTextAndExtract();
  if (initialNodes.length > 0) {
    console.log(`[CONTENT] 초기 텍스트 전송: ${initialNodes.length}개`);
    sendTextNodesToServer(initialNodes);
  } else {
    console.log('[CONTENT] 초기 텍스트 없음');
  }

  // 2. 동적으로 추가될 콘텐츠를 감시하는 Observer 시작
  startContentObserver();

  console.log('[CONTENT] 텍스트 필터 초기화 완료 - Observer 활성화됨');
}
