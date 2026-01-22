// // src/content/ipc/emits.ts
// import { IPC_TOPICS } from "./events";
// import type { IpcEnvelope, TextBatchPayload } from "../../types/realtime";

// let port: chrome.runtime.Port | null = null;

// export function connectBridge() {
//   if (port) return port;
//   port = chrome.runtime.connect({ name: "cv-content" });
//   return port;
// }

// export function emitTextBatch(batch: TextBatchPayload) {
//   const p = connectBridge();
//   const msg: IpcEnvelope<typeof IPC_TOPICS.TEXT_BATCH, TextBatchPayload> = {
//     topic: IPC_TOPICS.TEXT_BATCH,
//     data: batch,
//   };
//   p.postMessage(msg);
// }


// src/content/ipc/emits.ts
import type { IpcEnvelope, TextBatchPayload } from "../../types/realtime";
import { IPC_TOPICS } from "./events";

let port: chrome.runtime.Port | null = null;
export function connectBridge() {
  if (port) return port;
  port = chrome.runtime.connect({ name: "cv-content" });
  return port;
}
export function emitTextBatch(batch: TextBatchPayload) {
  const p = connectBridge();
  const msg: IpcEnvelope<typeof IPC_TOPICS.TEXT_BATCH, TextBatchPayload> = {
    topic: IPC_TOPICS.TEXT_BATCH,
    data: batch,
  };
  p.postMessage(msg);
}
