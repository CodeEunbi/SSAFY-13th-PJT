// src/content/textFilter/contentObserver.ts

import { extractTextNodesFrom } from './findTextNodes';
import { sendTextNodesToServer } from './socketText';
import type { TextNodeInfo } from './type';

let observer: MutationObserver | null = null;
let debounceTimer: number | null = null;

function processNewContent(elements: HTMLElement[]) {
  console.log(
    `[OBSERVER] 새로 추가된 ${elements.length}개 요소에서 텍스트 추출 시도.`,
  );

  const allNewTextNodes: TextNodeInfo[] = [];

  for (const element of elements) {
    const newNodes = extractTextNodesFrom(element);
    if (newNodes.length > 0) {
      allNewTextNodes.push(...newNodes);
    }
  }

  if (allNewTextNodes.length > 0) {
    console.log(
      `[OBSERVER] 총 ${allNewTextNodes.length}개의 새 텍스트 노드를 서버로 전송합니다.`,
    );
    sendTextNodesToServer(allNewTextNodes);
  }
}

export function startContentObserver() {
  if (observer) return;

  observer = new MutationObserver((mutationsList: MutationRecord[]) => {
    const addedElements: HTMLElement[] = [];

    for (const mutation of mutationsList) {
      // 변경이 일어난 위치가 새로 만든 span 내부인지 확인합
      if (
        mutation.target.nodeType === Node.ELEMENT_NODE &&
        (mutation.target as HTMLElement).closest('[data-text-node-id]')
      ) {
        // 블러 처리를 위해 DOM을 변경한 것이므로 이 변경은 무시
        continue;
      }

      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            addedElements.push(node as HTMLElement);
          }
        });
      }
    }

    if (addedElements.length > 0) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(() => {
        processNewContent(addedElements);
      }, 400);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('[OBSERVER] 동적 콘텐츠 감시를 시작합니다.');
}

export function stopContentObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
    console.log('[OBSERVER] 동적 콘텐츠 감시를 중지합니다.');
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
}
