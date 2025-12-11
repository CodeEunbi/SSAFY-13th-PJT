// src/content/ipc/events.ts

export const IPC_TOPICS = {
  TEXT_BATCH: "CONTENT:TEXT_BATCH",
  DECISIONS: "OFFSCREEN:DECISIONS",
  PONG: "OFFSCREEN:PONG",
  CONFIG: "OFFSCREEN:CONFIG",
  IMAGE_BATCH: "CONTENT:IMAGE_BATCH",        // content → offscreen(→ 서버)
  IMAGE_RESULTS: "OFFSCREEN:IMAGE_RESULTS",  // offscreen → content

  IMAGE_BATCH_ENRICHED: "IMAGE_BATCH_ENRICHED",
  IMAGE_UPLOAD_START: "CONTENT:IMAGE_UPLOAD_START",
  IMAGE_UPLOAD_CHUNK: "CONTENT:IMAGE_UPLOAD_CHUNK",
  IMAGE_UPLOAD_END:   "CONTENT:IMAGE_UPLOAD_END",

} as const;

// 🔥 여기서 바로 타입 뽑아내면 끝!
export type IpcTopic = typeof IPC_TOPICS[keyof typeof IPC_TOPICS];
