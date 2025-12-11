// src/content/ipc/emits.ts
import type { IpcEnvelope, TextBatchPayload, ImageBatchPayload } from "../../types/realtime";
import { IPC_TOPICS } from "./events";

let port: chrome.runtime.Port | null = null;
export function connectBridge() {
  if (port) return port;
  port = chrome.runtime.connect({ name: "cv-content" });
  return port;
}
export function emitTextBatch(payload: TextBatchPayload) {
  const p = connectBridge();
  const msg: IpcEnvelope<typeof IPC_TOPICS.TEXT_BATCH, TextBatchPayload> = {
    topic: IPC_TOPICS.TEXT_BATCH,
    data: payload,
  };
  p.postMessage(msg);
}


export function emitImageBatch(payload: ImageBatchPayload) {
  const p = connectBridge();
  const msg: IpcEnvelope<typeof IPC_TOPICS.IMAGE_BATCH, ImageBatchPayload> = {
    topic: IPC_TOPICS.IMAGE_BATCH,
    data: payload,
  };
  console.log("emitImageBatch:", msg)
  p.postMessage(msg);
}
