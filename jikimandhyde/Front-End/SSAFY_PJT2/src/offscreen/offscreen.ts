// src/offscreen/offscreen.ts
import type { IpcEnvelope, TextBatchPayload, DecisionsPayload } from "../types/realtime";
import { websocket } from "./ws/socket";

// import { IPC_TOPICS } from "../content/ipc/events";
// import { WS_TOPICS } from "./ws/events";
// import { handleServerMessage } from "./ws/handlers";

declare global {
  interface Window {
    sio: SocketIOClient.Socket;
    sioPing: (note?: string) => void;
  }
}

const sio: any = websocket;

window.sio = sio;
window.sioPing = (note = "manual") => sio.emit("ping", { note, t: Date.now() });

// ---- Offscreen: maintain WS & relay batches + ping/pong ----
console.log("[OFF] loaded");

// BG(Service Worker)와 포트 연결, BG를 통해 들어오는 포트(탭별로 여러 개)와도 통신 가능
const port = chrome.runtime.connect({ name: "cv-offscreen" });
console.log("[OFF] connected to BG port");
port.postMessage({ type: "offscreen_loaded" });

// BG로 메시지 중계 (필요 시 tabId도 함께 전달해 BG가 해당 탭으로 라우팅 가능)
function relayToBG(topic: IpcEnvelope["topic"], data: unknown, tabId?: number) {
  const env: IpcEnvelope = { topic, data };
  if (tabId != null) (env as any).tabId = tabId;
  port.postMessage(env);
}

/**
 * reqId -> tabId 매핑
 * - content에서 올라온 배치(reqId 포함)가 어느 탭에서 온 건지 기억
 * - 서버 decisions 응답에 reqId가 그대로 오므로, 그걸로 역매핑해서 해당 탭으로만 전달
 */
const reqTab = new Map<string, number>();

// ---------- Socket.IO wiring (emit/on) ----------
sio.on("connect", () => {
  const id = sio.id || sio.io?.engine?.id || "(no-id)"; // v2에서 id 접근 안전화
  console.log("[OFF] Socket.IO connected", id);
});

sio.on("connect_error", (err: any) => {
  console.error("[OFF] socket connect_error:", err?.message || err);
});

// 타입 경고 피하려고 as any
(sio as any).on("reconnect", (n: number) => {
  console.log("[OFF] socket reconnect attempt:", n);
});

// 서버 → 오프스크린 → BG
sio.on("pong", (d: any) => {
  console.log("[OFF] PONG", d);
  relayToBG("OFFSCREEN:PONG", d);
});
sio.on("config", (cfg: any) => relayToBG("OFFSCREEN:CONFIG", cfg));
sio.on("decisions", (payload: DecisionsPayload & { reqId?: string }) => {
  let tabId: number | undefined;
  if (payload?.reqId && reqTab.has(payload.reqId)) {
    tabId = reqTab.get(payload.reqId);
    reqTab.delete(payload.reqId);
  }
  console.log(`[OFF] decisions 수신: targets=${payload?.targets?.length ?? 0} reqId=${payload?.reqId}`);
  relayToBG("OFFSCREEN:DECISIONS", payload, tabId);
});

// BG(=content에서 올라온 배치) → 서버로 전달
port.onMessage.addListener((msg: IpcEnvelope & { tabId?: number }) => {
  if (msg.topic === "CONTENT:TEXT_BATCH") {
    const batch = msg.data as TextBatchPayload;
    if (msg.tabId != null && batch?.reqId) {
      reqTab.set(batch.reqId, msg.tabId);
    }
    websocket.emit("analyze_text", batch); // ← 여기서 socket.emit 사용
  }
});

// 필요하면 호출해서 핑 보낼 수 있음
export function ping() {
  websocket.emit("ping", { t: Date.now() });
}

// 포트 끊김 대비
port.onDisconnect.addListener(() => {
  console.warn("[OFF] BG port disconnected");
});

// const client = new WSClient();

// function relayToBG(topic: string, data: unknown) {
//   const envelop: IpcEnvelope = { topic: topic as any, data };
//   port.postMessage(envelop);
// }

// client.on((msg) => handleServerMessage(msg, relayToBG));
// client.connect();

// port.onMessage.addListener((msg: IpcEnvelope) => {
//   // content -> BG -> offscreen 라우팅된 배치
//   if (msg.topic === IPC_TOPICS.TEXT_BATCH) {
//     const batch = msg.data as TextBatchPayload;
//     client.send({
//       type: WS_TOPICS.ANALYZE_TEXT,
//       payload: batch,
//       reqId: batch.reqId,
//     });
//   }
// });


// // ===== WS 설정 =====
// const WS_URL = "ws://127.0.0.1:8000/ws/test/"; // dev
// let ws: WebSocket | null = null;

// // ===== 배치 전송 큐 =====
// type ObsBatch = { _fromTabId: number; pageUrl: string; items: any[] };
// const queue: ObsBatch[] = [];
// let inflight = 0;

// // ===== 지수 백오프 + 지터 =====
// let baseDelay = 500;               // 0.5s
// const maxDelay = 30_000;           // 30s
// let curDelay = baseDelay;
// function nextDelay() {
//   const jitter = Math.random() * curDelay;  // full jitter
//   const wait = Math.floor(jitter);
//   curDelay = Math.min(curDelay * 2, maxDelay);
//   return wait;
// }
// function resetDelay() { curDelay = baseDelay; }

// // ===== 핑/퐁 =====
// let hbTimer: number | null = null;

// function sendPing(note = "auto") {
//   if (!ws || ws.readyState !== WebSocket.OPEN) return;
//   const payload = { type: "ping", payload: note, ts: Date.now() };
//   ws.send(JSON.stringify(payload));
//   console.log("[WS] → PING sent:", payload);
// }

// function startHeartbeat() {
//   if (hbTimer) clearInterval(hbTimer);
//   hbTimer = setInterval(() => sendPing("heartbeat"), 15_000) as unknown as number;
// }

// function stopHeartbeat() {
//   if (hbTimer) { clearInterval(hbTimer); hbTimer = null; }
// }

// // ===== 연결/재연결 =====
// let reconnectTimer: number | null = null;

// function scheduleReconnect() {
//   if (reconnectTimer) return;
//   const wait = nextDelay();
//   console.log(`[WS] reconnect in ${wait}ms`);
//   reconnectTimer = setTimeout(() => {
//     reconnectTimer = null;
//     connect();
//   }, wait) as unknown as number;
// }

// function connect() {
//   if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

//   try {
//     console.log("[WS] connecting:", WS_URL);
//     ws = new WebSocket(WS_URL);

//     ws.onopen = () => {
//       console.log("[WS] OPEN");
//       resetDelay();
//       inflight = 0;
//       stopHeartbeat();
//       startHeartbeat();
//       // 연결 즉시 1회 핑
//       sendPing("hello-from-offscreen");
//       // 큐 비우기 시작
//       drain();
//     };

//     ws.onmessage = (e: MessageEvent<string>) => {
//       try {
//         const msg = JSON.parse(e.data);
//         // 디버그 로그
//         // console.log("[WS] message:", msg);

//         // 서버 종류별 처리
//         if (msg.type === "pong") {
//           console.log(`[WS] ✅ PONG ts=${msg.ts} echo=${msg.echo ?? ""}`);
//         } else if (msg.type === "ack") {
//           inflight = Math.max(0, inflight - 1);
//         } else if (msg.type === "decisions") {
//           // { tabId, pageUrl, decisions: [...] }
//           port.postMessage({
//             _toTabId: msg.tabId,
//             payload: { kind: "FILTER_DECISIONS", pageUrl: msg.pageUrl, decisions: msg.decisions },
//           });
//         } else if (msg.type === "text_blur_ranges") {
//       port.postMessage({
//         _toTabId: msg.tabId,
//         payload: msg, // <= 여기!
//       }); 
//       } else {
//           // 필요시 BG로 브로드캐스트
//           port.postMessage({ type: "ws_message", payload: msg });
//         }
//       } catch (err) {
//         console.warn("[WS] onmessage parse error", err);
//       }
//     };

//     ws.onclose = (ev) => {
//       console.warn("[WS] CLOSE", ev.code, ev.reason || "");
//       stopHeartbeat();
//       scheduleReconnect();
//     };

//     ws.onerror = (err) => {
//       console.error("[WS] ERROR", err);
//       try { ws?.close(); } catch {}
//     };
//   } catch (e) {
//     console.error("[WS] connect threw", e);
//     scheduleReconnect();
//   }
// }

// // ===== 큐 드레인 =====
// function drain() {
//   if (!ws || ws.readyState !== WebSocket.OPEN) return;
//   if (ws.bufferedAmount > 1_000_000) return; // 혼잡 시 잠깐 쉼

//   const MAX_INFLIGHT = 5;
//   while (queue.length && inflight < MAX_INFLIGHT) {
//     const b = queue.shift()!;
//     inflight++;
//     ws.send(JSON.stringify({
//       type: "obs_batch",
//       tabId: b._fromTabId,
//       pageUrl: b.pageUrl,
//       items: b.items,
//     }));
//   }
// }

// // BG → 오프스크린: 배치 적재
// port.onMessage.addListener((msg: any) => {
//   if (msg?.kind === "OBS_BATCH") {
//     const b: ObsBatch = {
//       _fromTabId: msg._fromTabId,
//       pageUrl: msg.pageUrl,
//       items: msg.items || [],
//     };
//     queue.push(b);
//     drain();
//     return;
//   }
//   // 수동 핑 지시
//   if (msg?.type === "send_ping") {
//     sendPing(msg.note ?? "manual");
//   }
// });

// // 주기적으로 드레인(100~200ms 권장)
// setInterval(drain, 150);

// // 포트 끊김 대비
// port.onDisconnect.addListener(() => {
//   console.warn("[OFF] BG port disconnected");
// });

// // 최초 연결
// connect();

