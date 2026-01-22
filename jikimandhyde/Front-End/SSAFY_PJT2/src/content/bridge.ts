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



// type Unsubscribe = () => void;

// let port: chrome.runtime.Port | null = null;
// let tabId: number = 0;
// let debug = false;

// // 재연결 & 큐
// let reconnecting = false;
// const sendQueue: any[] = [];

// // 요청-응답 패턴용
// type ReqId = string;
// let reqSeq = 0;
// const pending = new Map<
//   ReqId,
//   { resolve: (v: any) => void; reject: (e: any) => void; timer: number }
// >();

// // 서버 푸시 구독자 (offscreen→BG→content로 오는 payload 수신)
// const subs = new Set<(payload: any) => void>();

// export function initBridge() {
//   port = connectBridge();
//   registerContentListeners(port);
// }

// function log(...args: any[]) {
//   if (debug) console.log("[BRIDGE]", ...args);
// }

// function nextReqId(): ReqId {
//   reqSeq = (reqSeq + 1) % 1_000_000;
//   return `req_${Date.now()}_${reqSeq}`;
// }

// /** BG와 포트 연결 (한 번만) */
// // export function connectBridge(opts?: { tabId?: number; debug?: boolean }) {
// //   if (port) return port;
// //   tabId = opts?.tabId ?? tabId ?? 0;
// //   debug = !!opts?.debug;

// //   port = chrome.runtime.connect({ name: "cv-content" });
// //   log("connected to BG", port);

// //   // (선택) BG에 탭 등록 통지
// //   try {
// //     port.postMessage({ type: "register_content_port", tabId });
// //   } catch {}

// //   port.onMessage.addListener(onPortMessage);
// //   port.onDisconnect.addListener(() => {
// //     log("BG port disconnected");
// //     port = null;
// //     if (!reconnecting) {
// //       reconnecting = true;
// //       setTimeout(() => {
// //         reconnecting = false;
// //         connectBridge({ tabId, debug });
// //         flushQueue();
// //       }, 300);
// //     }
// //   });

// //   flushQueue();
// //   return port;
// // }

// /** 오프스크린(WS)로 보낼 관찰 배치 */
// export function sendObsBatch(pageUrl: string, items: any[]) {
//   const msg = { kind: "OBS_BATCH", _fromTabId: tabId, pageUrl, items };
//   post(msg);
// }

// /** 오프스크린(WS)에 수동 핑 요청 (테스트용) */
// export function sendPing(note = "manual") {
//   const msg = { type: "send_ping", note };
//   post(msg);
// }

// /** 요청-응답 (BG→offscreen→WS→역회신) 라운드트립이 필요한 경우 */
// export function request<T = any>(
//   channel: string,
//   payload?: any,
//   opts?: { timeoutMs?: number }
// ): Promise<T> {
//   const reqId = nextReqId();
//   const timeoutMs = opts?.timeoutMs ?? 10_000;

//   const msg = { type: "request", channel, payload, reqId, _fromTabId: tabId };
//   return new Promise<T>((resolve, reject) => {
//     const timer = window.setTimeout(() => {
//       pending.delete(reqId);
//       reject(new Error(`request timeout: ${channel}`));
//     }, timeoutMs);
//     pending.set(reqId, { resolve, reject, timer });
//     post(msg);
//   });
// }

// /** 오프스크린에서 온 payload를 구독 */
// export function onOffscreenPayload(cb: (payload: any) => void): Unsubscribe {
  
//   subs.add(cb);
//   return () => subs.delete(cb);
// }

// /** 정리 */
// export function disposeBridge() {
//   pending.forEach(({ reject, timer }) => {
//     clearTimeout(timer);
//     reject(new Error("bridge disposed"));
//   });
//   pending.clear();
//   subs.clear();

//   if (port) {
//     try { port.disconnect(); } catch {}
//     port = null;
//   }
// }

// /* ---------------- 내부 유틸 ---------------- */

// function post(msg: any) {
//   if (!port) {
//     sendQueue.push(msg);
//     log("queued (no port):", msg?.type ?? msg?.kind);
//     return;
//   }
//   try {
//     port.postMessage(msg);
//   } catch (e) {
//     console.warn("[BRIDGE] post failed, queueing", e);
//     sendQueue.push(msg);
//   }
// }

// function flushQueue() {
//   if (!port || sendQueue.length === 0) return;
//   const items = sendQueue.splice(0, sendQueue.length);
//   items.forEach((m) => {
//     try { port!.postMessage(m); } catch {}
//   });
//   log("flushed", items.length);
// }

// function onPortMessage(msg: any) {
//   // 오프스크린에서 BG를 통해 되돌아오는 패턴:
//   // 1) 타게팅 메시지: { _toTabId, payload: {...} } → BG가 해당 탭으로 그대로 포워드
//   // 2) 브로드캐스트: { payload: {...} }
//   // 3) 요청-응답: { reqId, ok, data } (설계에 따라 조정)

//   // 요청-응답 매칭
//   if (msg && typeof msg === "object" && msg.reqId && (msg.ok || msg.error || "data" in msg)) {
//     const h = pending.get(msg.reqId as string);
//     if (h) {
//       clearTimeout(h.timer);
//       pending.delete(msg.reqId);
//       if (msg.ok === false) h.reject(msg.error ?? new Error("request failed"));
//       else h.resolve(msg.data);
//       return;
//     }
//   }

//   // 표준 푸시(payload) 브로드캐스트
//   const payload = msg?.payload ?? msg;
//   if (payload) {
//     subs.forEach((fn) => {
//       try { fn(payload); } catch (e) { console.error("[BRIDGE] sub error", e); }
//     });
//   }
// }