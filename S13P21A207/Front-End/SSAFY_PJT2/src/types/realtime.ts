// src/types/realtime.ts
export type ReqId = string;

export type IpcTopic =
  | "CONTENT:TEXT_BATCH"   // content → offscreen(→ 서버)
  | "OFFSCREEN:DECISIONS"  // offscreen → content
  | "OFFSCREEN:PONG"
  | "OFFSCREEN:CONFIG"
  | "CONTENT:IMAGE_BATCH"        // content → offscreen(→ 서버)
  | "OFFSCREEN:IMAGE_RESULTS"
  | "OFFSCREEN:SETTINGS_COMMIT"
  | "OFFSCREEN:SETTINGS_ACK"
  | "OFFSCREEN:ERROR";



export type TextBatchItem = {
  elementId: string; // DOM 요소 식별자(널이면 선택자만)
  selector: string; // utils/querySelector.ts로 만든 쿼리
  text: string; // innerText (<= 10,000자 제한)
};

export type TextBatchPayload = {
  url: string;
  items: TextBatchItem[];
  lang?: 'ko' | 'en' | 'mixed';
  ts: number;
  reqId: ReqId;
  keywords?: string[];
  maxLen?: number;
};

export type DecisionSentence = {
  elementId: string;
  selector: string;
  sentence: string; // 블러 처리할 "문장" 원문
  reason?: string; // ex) "matched: 병원"
};

export type DecisionsPayload = {
  url: string;
  reqId: ReqId;
  targets: DecisionSentence[]; // 문장 단위 타깃들
};

export type IpcEnvelope<Topic extends IpcTopic = IpcTopic, T = unknown> = {
  topic: Topic;
  data?: T;
  tabId?: number;
  reqId?: ReqId;
};


// 이미지

export type ImageItem = {
  elementId: string;
  mimeType: string;
  size: number;               // bytes (<= 1MB로 맞춰 전송)
  pageUrl: string;
  imageMetadata: {
    width: number;
    height: number;
    alt?: string | null;
    src?: string | null;
  };
  imageData: ArrayBuffer;
};

export type ImageBatchPayload = {
  url: string;
  ts: number;
  reqId: ReqId;
  images: ImageItem[];
};

export type ImageDecisionItem = {
  elementId: string;
  shouldBlur: boolean;
  confidence: number;
  primaryCategory?: "CR" | "AC" | "HO" | "GO" | "SE" | null;
};



export type ImageDecisionPayload = {
  processingTime: number;     // ms
  processedAt: string;        // ISO8601 (UTC)
  results: ImageDecisionItem[];
};


//텍스트
export type TextAnalysisItem = {
  elementId: string;
  content: string;
  pageUrl: string;
  elementMetadata: {
    tagName: string;
  };
};

export type TextAnalysisRequest = {
  items: TextAnalysisItem[];
  reqId?: string;     // ← 추가: 라우팅/디버깅용
  ts?: number;        // ← 추가: 디버깅용(보낸 시각)
  url?: string;       // ← 추가: 페이지 URL
};

export type FilteredIndex = {
  start: number;
  end: number;
  type: "IN" | "PO" | "AD" | "SE" | "VI";
  confidence: number; // 0.0 ~ 1.0
};

export type TextAnalysisResultItem = {
  elementId: string;
  filteredIndexes: FilteredIndex[];
  originalLength: number;
  processedAt: string;   // ISO8601 (UTC)
  processingTime: number; // ms
};

// export type TextAnalysisResponse = {
//   processingTime: number; // ms (배치 총합)
//   processedAt: string;    // ISO8601 (UTC)
//   results: TextAnalysisResultItem[];
// };

export type TextAnalysisResponse = {
  results: Array<{
    elementId: string;
    originalLength: number;
    filteredIndexes: Array<{ start: number; end: number; matchText?: string }>;
    processedAt?: number;
    processingTime?: number;
  }>;
  reqId?: string;     // ← 추가: 라우팅 위해 그대로 되돌려 받음
  processedAt?: number;
  processingTime?: number;
};



// type ImageBegin = {
//   reqId: string;           // 배치/요청 ID
//   elementId: string;       // DOM id or 추적용 id
//   mimeType: string;        // 'image/jpeg' 등
//   totalBytes: number;      // 원본 전체 바이트
//   pageUrl: string;
//   width?: number;
//   height?: number;
//   alt?: string | null;
// };

// type ImageChunk = {
//   reqId: string;
//   elementId: string;
//   index: number;           // 0..N-1
//   data: ArrayBuffer;       // 실제 바이너리
// };

// type ImageEnd = {
//   reqId: string;
//   elementId: string;
//   chunks: number;          // 총 청크 개수
//   checksum?: string;       // 선택(MD5/xxHash 등)
// };
