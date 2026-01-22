// src/content/ipc/events.ts
import type { IpcTopic } from "../../types/realtime";
export const IPC_TOPICS: Record<string, IpcTopic> = {
  TEXT_BATCH: "CONTENT:TEXT_BATCH",
  DECISIONS: "OFFSCREEN:DECISIONS",
  PONG: "OFFSCREEN:PONG",
  CONFIG: "OFFSCREEN:CONFIG",
};
