// src/content/textFilter/socketText.ts

import io from 'socket.io-client';
import { SOCKET_IO_BASE, SOCKET_IO_PATH } from '../../types/api';
import type {
  TextNodeInfo,
  TextFilterRequestInfo,
  TextAnalysisResponse,
} from './type';
import { processBlurResults } from './blurFilteredTexts';
import { BatchSize } from './store';

// 텍스트 필터링 전용 소켓 연결
const textSocket = io(SOCKET_IO_BASE, {
  path: SOCKET_IO_PATH,
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// 소켓 연결 이벤트
textSocket.on('connect', () => {
  console.log('[CONTENT] Socket connected');
});

textSocket.on('user-settings', () => {
  sendUserSettings();
});

// 소켓 에러 이벤트
textSocket.on('connect_error', (err: unknown) => {
  console.error('[CONTENT] Socket connection error:', err);
});

// 소켓 해제 이벤트
textSocket.on('disconnect', (reason: string) => {
  console.warn('[CONTENT] Socket disconnected:', reason);
});

// 사용자 설정 전송 함수
export function sendUserSettings() {
  const userSettings = {
    type: 'settingsDoc',
    settings: {
      serviceEnabled: true,
      showIcon: true,
      filteringEnabled: true,
      filterImage: {
        enabled: true,
        originalViewEnabled: true,
        categories: ['CRIME', 'HORROR'],
      },
      filterText: {
        enabled: true,
        originalViewEnabled: true,
        categories: ['POLITICS'],
      },
    },
    __meta: {
      updatedAt: new Date().toISOString(),
    },
  };

  console.log('[CONTENT] Sending user settings:', userSettings);

  textSocket.emit('user-settings', userSettings, (response: unknown) => {
    console.log('[CONTENT] User settings response:', response);
  });
}

// 텍스트 노드를 서버로 전송하는 함수
export function sendTextNodesToServer(textNodes: TextNodeInfo[]) {
  // 100개씩 나누어서 처리
  for (let i = 0; i < textNodes.length; i += BatchSize) {
    const batch = textNodes.slice(i, i + BatchSize);
    const reqData: TextFilterRequestInfo[] = [];

    batch.forEach((node) => {
      const pageUrl = window.location.href;
      const meta = {
        elementId: '',
        tagName: 'span' as const,
      };

      reqData.push({
        elementId: node.id,
        content: node.content,
        pageUrl: pageUrl,
        elementMetadata: meta,
      });
    });

    console.log('[CONTENT] Sending text nodes to server:', reqData);

    textSocket.emit(
      'text-analysis',
      reqData,
      (response: TextAnalysisResponse) => {
        console.log('[CONTENT] Text analysis response:', response);

        processBlurResults(response);
      },
    );
  }
}
