// src/content/bridge.ts
// content <-> BG(Service Worker) <-> offscreen(WebSocket) 브리지
// - 자동 재연결
// - 송신 큐 (포트 끊겼을 때 임시 보관)
// - 서버 푸시 구독(onOffscreenPayload)
// - 간단 헬퍼(sendObsBatch / sendPing / request)

import { connectBridge } from "./ipc/emits";
import { registerContentListeners } from "./ipc/listeners";

export function initBridge() {
  const port = connectBridge();
  registerContentListeners(port);
}