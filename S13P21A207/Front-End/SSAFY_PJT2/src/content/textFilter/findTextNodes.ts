// src/content/textFilter/findTextNodes.ts

import { textNodeMap } from './store';
import type { TextNodeInfo } from './type';
import '../../styles/global.css';

let nodeCounter = 0;
const processedNodes = new WeakSet<Node>();

/**
 * 페이지의 모든 초기 텍스트를 찾아 처리합니다.
 * @returns 초기 텍스트 노드 정보 배열
 */
export function blurAllTextAndExtract(): TextNodeInfo[] {
  // body 전체를 대상으로 하는 초기 실행
  return extractTextNodesFrom(document.body);
}

/**
 * 특정 DOM 요소 하위의 모든 텍스트 노드를 찾아 span으로 감싸고 정보를 반환합니다.
 * @param rootElement 탐색을 시작할 최상위 요소
 * @returns 새로 찾아낸 텍스트 노드 정보 배열
 */
export function extractTextNodesFrom(rootElement: HTMLElement): TextNodeInfo[] {
  const textNodes: TextNodeInfo[] = [];
  const collectedNodes: Text[] = [];

  if (!rootElement || typeof rootElement.querySelectorAll !== 'function') {
    return [];
  }

  const walker = document.createTreeWalker(
    rootElement,
    NodeFilter.SHOW_TEXT,
    (node) => {
      if (
        node.parentElement &&
        !node.parentElement.classList.contains('blur-default') &&
        node.parentElement.parentElement &&
        !node.parentElement.parentElement.classList.contains('cv-text') &&
        !['SCRIPT', 'STYLE', 'BUTTON', 'I'].includes(
          node.parentElement.tagName,
        ) &&
        node.textContent?.trim() &&
        isNaN(Number(node.textContent)) &&
        !processedNodes.has(node)
      ) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_REJECT;
    },
  );

  let node;
  while ((node = walker.nextNode())) {
    collectedNodes.push(node as Text);
  }

  // 역순으로 처리하여 DOM 구조 변경으로 인한 문제를 방지
  for (let i = collectedNodes.length - 1; i >= 0; i--) {
    const textNode = collectedNodes[i];
    if (!textNode.parentNode || processedNodes.has(textNode)) continue;

    const id = `${++nodeCounter}`;
    const span = document.createElement('span');
    span.className = 'blur-default';
    span.textContent = textNode.textContent;
    span.dataset.textNodeId = id;

    processedNodes.add(textNode);
    textNode.parentNode.replaceChild(span, textNode);
    textNodeMap.set(id, span);
    processedNodes.add(span);

    textNodes.push({
      id: id,
      content: span.textContent!,
    });
  }

  textNodes.reverse(); // 순서 복원
  return textNodes;
}

// 디버깅 및 테스트용 함수
export function getCurrentNodeCounter(): number {
  return nodeCounter;
}

export function getProcessedNodeCount(): number {
  return textNodeMap.size;
}

export function resetNodeCounter(): void {
  nodeCounter = 0;
}
