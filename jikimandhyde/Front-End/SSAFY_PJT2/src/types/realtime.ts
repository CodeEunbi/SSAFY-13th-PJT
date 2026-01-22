// src/types/realtime.ts
export type ReqId = string;

export type IpcTopic =
  | "CONTENT:TEXT_BATCH"   // content → offscreen(→ 서버)
  | "OFFSCREEN:DECISIONS"  // offscreen → content
  | "OFFSCREEN:PONG"
  | "OFFSCREEN:CONFIG";


export type TextBatchItem = {
  elementId: string;            // DOM 요소 식별자(널이면 선택자만)
  selector: string;             // utils/querySelector.ts로 만든 쿼리
  text: string;                 // innerText (<= 10,000자 제한)
};

export type TextBatchPayload = {
  url: string;
  items: TextBatchItem[];
  lang?: "ko" | "en" | "mixed";
  ts: number;
  reqId: ReqId;
  keywords?: string[],
  maxLen?: number,
};

export type DecisionSentence = {
  elementId: string;
  selector: string;
  sentence: string;             // 블러 처리할 "문장" 원문
  reason?: string;              // ex) "matched: 병원"
};

export type DecisionsPayload = {
  url: string;
  reqId: ReqId;
  targets: DecisionSentence[];  // 문장 단위 타깃들
};

export type IpcEnvelope<Topic extends IpcTopic = IpcTopic, T = unknown> = {
  topic: Topic;
  data?: T;
  tabId?: number;
  reqId?: ReqId;
};
