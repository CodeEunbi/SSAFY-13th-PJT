// src/content/textFilter/blurFilteredTexts.ts

import type { TextAnalysisResponse, TextResult, FilteredIndex } from './type';
import { textNodeMap } from './store';
import '../../styles/global.css';
import { BatchSize } from './store';

// 블러 처리 메인 함수 - 서버 응답 기반으로 부분 블러 처리
export function processBlurResults(response: TextAnalysisResponse) {
  // console.log('[BLUR] 블러 처리 시작, 결과 개수:', response.results.length);

  if (response.results.length === 0) return;

  // 응답에 포함된 elementId들 수집 (필터링 대상)
  const filteredElementIds = new Set(
    response.results.map((result) => result.elementId),
  );

  // ID를 숫자로 변환해서 범위 계산
  const ids = response.results.map((result) => parseInt(result.elementId));
  const minId = Math.min(...ids);
  const maxId = Math.max(...ids);

  // 배치 시작점 계산 (100개 단위로 내림)
  const batchStart = Math.floor((minId - 1) / BatchSize) * BatchSize + 1;

  // console.log(`[BLUR] 배치 범위 처리: ${batchStart} ~ ${maxId}`);

  // 현재 배치 범위만 for문으로 처리
  for (let i = batchStart; i <= maxId; i++) {
    const elementId = String(i);
    const element = textNodeMap.get(elementId);

    if (!element) continue;

    if (filteredElementIds.has(elementId)) {
      const result = response.results.find((r) => r.elementId === elementId)!;
      applyBlurToElement(element, result);
    } else {
      element.classList.remove('blur-default');
      //console.log(`[BLUR] ${elementId}: blur-default 해제`);
    }
  }

  // console.log(
  //   `[BLUR] 블러 처리 완료 - 필터링 대상: ${
  //     filteredElementIds.size
  //   }개, 블러 해제: ${textNodeMap.size - filteredElementIds.size}개`,
  // );
}

// 개별 요소에 블러 처리 적용
function applyBlurToElement(element: HTMLSpanElement, result: TextResult) {
  const originalText = element.textContent || '';

  if (result.filteredIndexes.length === 0) {
    // console.log(
    //   `[BLUR] ${result.elementId}: 필터링 인덱스 없음 - blur-default 유지`,
    // );
    return;
  }

  // 모든 filteredIndex가 start === 0, end === 0인지 확인 (전체 블러)
  const isFullBlur = result.filteredIndexes.every(
    (index) => index.start === 0 && index.end === 0,
  );

  if (isFullBlur) {
    // console.log(`[BLUR] ${result.elementId}: 전체 블러 처리`);
    applyFullBlur(element, result.filteredIndexes[0]);
    element.classList.remove('blur-default');
  } else {
    // 부분 블러 처리 - blur-default 제거하고 부분 블러 적용
    applyPartialBlur(
      element,
      originalText,
      result.filteredIndexes,
      // result.elementId,
    );
    element.classList.remove('blur-default');
  }
}

function applyFullBlur(element: HTMLSpanElement, index: FilteredIndex) {
  let colorClass = '';
  console.log('index.type[0]:', index.type[0]);
  if (index.type[0] === 'PO') {
    colorClass = 'color-politics';
  } else if (index.type[0] === 'AD') {
    colorClass = 'color-ad';
  } else if (index.type[0] === 'IN') {
    colorClass = 'color-insult';
  } else if (index.type[0] === 'VI') {
    colorClass = 'color-violence';
  } else if (index.type[0] === 'SE') {
    colorClass = 'color-sexual';
  }

  element.classList.add('cv-blur-partial', colorClass);
}

// 부분 블러 처리
function applyPartialBlur(
  element: HTMLSpanElement,
  originalText: string,
  filteredIndexes: FilteredIndex[],
  // elementId: string,
) {
  // start 기준으로 정렬
  const sortedIndexes = [...filteredIndexes].sort((a, b) => a.start - b.start);

  let html = '';
  let lastEnd = 0;

  sortedIndexes.forEach((index) => {
    // 블러 처리 전 일반 텍스트
    if (lastEnd < index.start) {
      html += escapeHtml(originalText.slice(lastEnd, index.start));
    }

    let colorClass;
    console.log('index.type[0]:', index.type[0]);
    if (index.type[0] === 'PO') {
      colorClass = 'color-politics';
    } else if (index.type[0] === 'AD') {
      colorClass = 'color-ad';
    } else if (index.type[0] === 'IN') {
      colorClass = 'color-insult';
    } else if (index.type[0] === 'VI') {
      colorClass = 'color-violence';
    } else if (index.type[0] === 'SE') {
      colorClass = 'color-sexual';
    }

    // 블러 처리할 텍스트
    const blurText = originalText.slice(index.start, index.end + 1);
    html += `<span class="cv-blur-partial ${colorClass}">${escapeHtml(
      blurText,
    )}</span>`;

    lastEnd = index.end + 1;
  });

  // 마지막 남은 일반 텍스트
  if (lastEnd < originalText.length) {
    html += escapeHtml(originalText.slice(lastEnd));
  }

  element.innerHTML = html;
  // console.log(
  //   `[BLUR] ${elementId}: 부분 블러 적용 (${sortedIndexes.length}개 구간)`,
  // );
}

// HTML 이스케이프
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 전체 블러 해제 함수
export function removeAllBlur() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  textNodeMap.forEach((element, _elementId) => {
    element.classList.remove('blur-default', 'cv-blur-partial');
    element.style.filter = '';

    // console.log('[BLUR] ' + elementId + ': 블러 해제');
    // if (element.innerHTML.includes('cv-blur-partial')) {
    //   element.innerHTML = element.textContent || '';
    // }
  });
  // console.log('[BLUR] 모든 블러 해제');
}
